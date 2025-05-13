// authController.js - Authentication controller
const { poolPromise, sql } = require('../db/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Environment variables - should be configured in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || 30; // days

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    const pool = await poolPromise;
    
    // Check if username or email already exists
    const userCheck = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID FROM Users 
        WHERE Username = @username OR Email = @email
      `);
    
    if (userCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create the user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('firstName', sql.NVarChar, firstName || null)
      .input('lastName', sql.NVarChar, lastName || null)
      .input('role', sql.NVarChar, 'user') // Default role
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, Role)
        VALUES (@username, @email, @passwordHash, @firstName, @lastName, @role);
        
        SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt
        FROM Users WHERE UserID = SCOPE_IDENTITY();
      `);
    
    // Return the user data (excluding password)
    const user = result.recordset[0];
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.Role,
        createdAt: user.CreatedAt
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const pool = await poolPromise;
    
    // Try to record login attempt, but continue if table doesn't exist yet
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      await pool.request()
        .input('username', sql.NVarChar, username)
        .input('ip', sql.NVarChar, ip)
        .input('userAgent', sql.NVarChar, userAgent)
        .query(`
          IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
          BEGIN
            INSERT INTO LoginAttempts (Username, IP, UserAgent)
            VALUES (@username, @ip, @userAgent)
          END
        `);

      // Check for too many failed attempts
      // Only if LoginAttempts table exists
      const attemptsResult = await pool.request()
        .query(`
          IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
          BEGIN
            SELECT COUNT(*) AS FailedAttempts
            FROM LoginAttempts
            WHERE Username = '${username}'
            AND Successful = 0
            AND AttemptedAt > DATEADD(MINUTE, -15, GETDATE())
          END
          ELSE
          BEGIN
            SELECT 0 AS FailedAttempts
          END
        `);

      const failedAttempts = attemptsResult.recordset[0].FailedAttempts;

      if (failedAttempts >= 5) {
        return res.status(429).json({
          message: 'Too many failed login attempts. Please try again later.'
        });
      }
    } catch (loginAttemptsError) {
      // Log but continue if there's an issue with login attempts
      console.warn('Could not record login attempt. LoginAttempts table may not exist yet:', loginAttemptsError.message);
      // Continue with login process
    }
    
    // Find the user
    const userResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT UserID, Username, Email, PasswordHash, FirstName, LastName, Role, IsActive
        FROM Users
        WHERE Username = @username
      `);
    
    if (userResult.recordset.length === 0) {
      // Update login attempt as failed (if table exists)
      try {
        await pool.request()
          .input('username', sql.NVarChar, username)
          .query(`
            IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
            BEGIN
              UPDATE LoginAttempts
              SET Successful = 0
              WHERE Username = @username
              AND AttemptedAt = (
                SELECT MAX(AttemptedAt)
                FROM LoginAttempts
                WHERE Username = @username
              )
            END
          `);
      } catch (loginAttemptError) {
        console.warn('Could not update login attempt:', loginAttemptError.message);
        // Continue with login process
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.recordset[0];
    
    // Check if user is active
    if (!user.IsActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact an administrator.' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    
    if (!passwordMatch) {
      // Update login attempt as failed (if table exists)
      try {
        await pool.request()
          .input('username', sql.NVarChar, username)
          .query(`
            IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
            BEGIN
              UPDATE LoginAttempts
              SET Successful = 0
              WHERE Username = @username
              AND AttemptedAt = (
                SELECT MAX(AttemptedAt)
                FROM LoginAttempts
                WHERE Username = @username
              )
            END
          `);
      } catch (loginAttemptError) {
        console.warn('Could not update login attempt:', loginAttemptError.message);
        // Continue with login process
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Password matched - mark login attempt as successful (if table exists)
    try {
      await pool.request()
        .input('username', sql.NVarChar, username)
        .query(`
          IF OBJECT_ID('LoginAttempts', 'U') IS NOT NULL
          BEGIN
            UPDATE LoginAttempts
            SET Successful = 1
            WHERE Username = @username
            AND AttemptedAt = (
              SELECT MAX(AttemptedAt)
              FROM LoginAttempts
              WHERE Username = @username
            )
          END
        `);
    } catch (loginAttemptError) {
      console.warn('Could not update login attempt status:', loginAttemptError.message);
      // Continue with login process
    }
    
    // Update last login time
    await pool.request()
      .input('userId', sql.Int, user.UserID)
      .query(`
        UPDATE Users
        SET LastLogin = GETDATE()
        WHERE UserID = @userId
      `);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        role: user.Role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY);
    
    // Save refresh token
    await pool.request()
      .input('userId', sql.Int, user.UserID)
      .input('token', sql.NVarChar, refreshToken)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO RefreshTokens (UserID, Token, ExpiresAt)
        VALUES (@userId, @token, @expiresAt)
      `);
    
    // Return user info and tokens
    res.json({
      message: 'Login successful',
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.Role
      },
      token,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Error during login',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    const pool = await poolPromise;
    
    // Find the refresh token and check if it's valid
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar, refreshToken)
      .query(`
        SELECT rt.TokenID, rt.UserID, rt.ExpiresAt, rt.RevokedAt,
               u.UserID, u.Username, u.Email, u.Role, u.IsActive
        FROM RefreshTokens rt
        JOIN Users u ON rt.UserID = u.UserID
        WHERE rt.Token = @token
      `);
    
    if (tokenResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const tokenData = tokenResult.recordset[0];
    
    // Check if token is expired or revoked
    if (tokenData.RevokedAt || new Date(tokenData.ExpiresAt) < new Date()) {
      return res.status(401).json({ message: 'Refresh token has expired or been revoked' });
    }
    
    // Check if user is active
    if (!tokenData.IsActive) {
      return res.status(403).json({ message: 'Account is disabled' });
    }
    
    // Generate new JWT token
    const newToken = jwt.sign(
      { 
        userId: tokenData.UserID,
        username: tokenData.Username,
        email: tokenData.Email,
        role: tokenData.Role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ 
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Logout - revoke refresh token
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    const pool = await poolPromise;
    
    // Revoke refresh token
    await pool.request()
      .input('token', sql.NVarChar, refreshToken)
      .query(`
        UPDATE RefreshTokens
        SET RevokedAt = GETDATE()
        WHERE Token = @token
      `);
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      message: 'Error during logout',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Get authenticated user profile
 */
const getProfile = async (req, res) => {
  try {
    // User ID should come from the authenticated middleware
    const userId = req.user.userId;
    
    const pool = await poolPromise;
    
    // Get user details
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
        FROM Users
        WHERE UserID = @userId
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    
    res.json({
      id: user.UserID,
      username: user.Username,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      createdAt: user.CreatedAt,
      lastLogin: user.LastLogin
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ 
      message: 'Error retrieving user profile',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    const pool = await poolPromise;
    
    // Get current password hash
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT PasswordHash
        FROM Users
        WHERE UserID = @userId
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.recordset[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.NVarChar, newPasswordHash)
      .query(`
        UPDATE Users
        SET PasswordHash = @passwordHash, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);
    
    // Revoke all existing refresh tokens for security
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE RefreshTokens
        SET RevokedAt = GETDATE()
        WHERE UserID = @userId
      `);
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ 
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const pool = await poolPromise;
    
    // Find user by email
    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID, Username, Email
        FROM Users
        WHERE Email = @email
      `);
    
    if (userResult.recordset.length === 0) {
      // For security reasons, still return a success message even if email doesn't exist
      return res.json({ message: 'If your email is registered, you will receive password reset instructions' });
    }
    
    const user = userResult.recordset[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Save reset token
    await pool.request()
      .input('userId', sql.Int, user.UserID)
      .input('token', sql.NVarChar, resetToken)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO PasswordResetTokens (UserID, Token, ExpiresAt)
        VALUES (@userId, @token, @expiresAt)
      `);
    
    // In a real application, you would send an email with the reset link
    // For this example, we'll just log it
    console.log(`Password reset token for ${user.Email}: ${resetToken}`);
    console.log(`Reset URL would be: ${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`);
    
    res.json({ 
      message: 'If your email is registered, you will receive password reset instructions',
      // For development/testing only:
      ...(process.env.NODE_ENV !== 'production' && { 
        resetToken,
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`
      })
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ 
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    const pool = await poolPromise;
    
    // Find token and check if valid
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT t.TokenID, t.UserID, t.ExpiresAt, t.UsedAt
        FROM PasswordResetTokens t
        WHERE t.Token = @token
      `);
    
    if (tokenResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const tokenData = tokenResult.recordset[0];
    
    // Check if token is used or expired
    if (tokenData.UsedAt || new Date(tokenData.ExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'Token has expired or already been used' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password and mark token as used
    await pool.request()
      .input('userId', sql.Int, tokenData.UserID)
      .input('passwordHash', sql.NVarChar, newPasswordHash)
      .input('tokenId', sql.Int, tokenData.TokenID)
      .query(`
        BEGIN TRANSACTION;
        
        -- Update user password
        UPDATE Users
        SET PasswordHash = @passwordHash, UpdatedAt = GETDATE()
        WHERE UserID = @userId;
        
        -- Mark token as used
        UPDATE PasswordResetTokens
        SET UsedAt = GETDATE()
        WHERE TokenID = @tokenId;
        
        -- Revoke all refresh tokens for this user
        UPDATE RefreshTokens
        SET RevokedAt = GETDATE()
        WHERE UserID = @userId;
        
        COMMIT;
      `);
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ 
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email is already used by another user
    if (email) {
      const pool = await poolPromise;
      const emailCheck = await pool.request()
        .input('email', sql.NVarChar, email)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT UserID FROM Users
          WHERE Email = @email AND UserID != @userId
        `);

      if (emailCheck.recordset.length > 0) {
        return res.status(409).json({ message: 'Email is already in use by another account' });
      }
    }

    // Update user profile
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('firstName', sql.NVarChar, firstName || null)
      .input('lastName', sql.NVarChar, lastName || null)
      .input('email', sql.NVarChar, email)
      .query(`
        UPDATE Users
        SET FirstName = @firstName,
            LastName = @lastName,
            Email = @email,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);

    // Get updated user data
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
        FROM Users
        WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.recordset[0];

    res.json({
      id: user.UserID,
      username: user.Username,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      createdAt: user.CreatedAt,
      lastLogin: user.LastLogin
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      message: 'Error updating user profile',
      error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
};