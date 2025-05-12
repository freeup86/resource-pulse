// Authentication controller
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../utils/db');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const userCheck = await executeQuery(
      'SELECT UserID FROM Users WHERE Email = @email',
      { email }
    );

    if (userCheck.recordset.length > 0) {
      throw new ApiError(400, 'User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await executeQuery(
      `INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Role, Active)
       VALUES (@email, @passwordHash, @firstName, @lastName, @phone, @role, 1);
       SELECT SCOPE_IDENTITY() AS UserID;`,
      {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role
      }
    );

    const userId = result.recordset[0].UserID;

    // Create additional records based on role
    if (role === 'parent') {
      await executeQuery(
        `INSERT INTO Parents (UserID) VALUES (@userId)`,
        { userId }
      );
    } else if (role === 'instructor') {
      await executeQuery(
        `INSERT INTO Instructors (UserID, HireDate, EmploymentType) 
         VALUES (@userId, GETDATE(), 'contractor')`,
        { userId }
      );
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const result = await executeQuery(
      'SELECT UserID, Email, PasswordHash, FirstName, LastName, Role, Active FROM Users WHERE Email = @email',
      { email }
    );

    if (result.recordset.length === 0) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const user = result.recordset[0];

    // Check if user is active
    if (!user.Active) {
      throw new ApiError(401, 'Account is deactivated');
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login time
    await executeQuery(
      'UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @userId',
      { userId: user.UserID }
    );

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.Role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user details
    const result = await executeQuery(
      `SELECT UserID, Email, FirstName, LastName, Phone, Role, LastLogin, CreatedAt
       FROM Users WHERE UserID = @userId`,
      { userId }
    );

    if (result.recordset.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    const user = result.recordset[0];

    // Get role-specific details
    let roleDetails = null;
    
    if (user.Role === 'parent') {
      const parentResult = await executeQuery(
        `SELECT ParentID, Address, City, State, ZipCode, PreferredContactMethod
         FROM Parents WHERE UserID = @userId`,
        { userId }
      );
      
      if (parentResult.recordset.length > 0) {
        roleDetails = parentResult.recordset[0];
      }
    } else if (user.Role === 'instructor') {
      const instructorResult = await executeQuery(
        `SELECT InstructorID, HireDate, EmploymentType, Education, Certifications
         FROM Instructors WHERE UserID = @userId`,
        { userId }
      );
      
      if (instructorResult.recordset.length > 0) {
        roleDetails = instructorResult.recordset[0];
      }
    }

    res.json({
      success: true,
      user: {
        id: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        phone: user.Phone,
        role: user.Role,
        lastLogin: user.LastLogin,
        createdAt: user.CreatedAt,
        roleDetails
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = require('../utils/jwt').verifyToken(refreshToken);
    
    // Get user from database
    const result = await executeQuery(
      'SELECT UserID, Email, Role FROM Users WHERE UserID = @userId',
      { userId: decoded.id }
    );

    if (result.recordset.length === 0) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const user = result.recordset[0];

    // Generate new access token
    const token = generateToken(user);

    res.json({
      success: true,
      token
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid refresh token'));
    }
    next(err);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const result = await executeQuery(
      'SELECT PasswordHash FROM Users WHERE UserID = @userId',
      { userId }
    );

    if (result.recordset.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    const user = result.recordset[0];

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await executeQuery(
      'UPDATE Users SET PasswordHash = @passwordHash, UpdatedAt = GETDATE() WHERE UserID = @userId',
      { passwordHash: hashedPassword, userId }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  changePassword
};