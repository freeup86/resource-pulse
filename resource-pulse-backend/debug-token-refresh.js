// debug-token-refresh.js - Script to debug token refresh flow
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db/config');

// Environment variables - should be configured in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';
const API_URL = 'https://resource-pulse-backend.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:3001/api';

// Test credentials for a known user
const TEST_USERNAME = 'admin'; // Replace with a valid username
const TEST_PASSWORD = 'password123'; // Replace with the actual password

// Debug the entire token flow
async function debugTokenFlow() {
  console.log('======== TOKEN FLOW DEBUGGING ========');
  console.log('Starting debug of full authentication flow...');
  
  try {
    // Step 1: Get a test user from the database first
    console.log('\n----- STEP 1: GET TEST USER -----');
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('username', sql.NVarChar, TEST_USERNAME)
      .query(`
        SELECT TOP 1 UserID, Username, Email, Role, IsActive
        FROM Users
        WHERE Username = @username AND IsActive = 1
      `);
    
    if (userResult.recordset.length === 0) {
      throw new Error('Test user not found in database. Please update TEST_USERNAME with a valid user.');
    }
    
    const testUser = userResult.recordset[0];
    console.log('Found test user:', testUser);
    
    // Step 2: Login and get tokens
    console.log('\n----- STEP 2: LOGIN -----');
    let token, refreshToken;
    
    try {
      const loginResponse = await axios.post(`${LOCAL_API_URL}/auth/login`, {
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      });
      
      token = loginResponse.data.token;
      refreshToken = loginResponse.data.refreshToken;
      
      console.log('Login successful, received tokens:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        refreshTokenExists: !!refreshToken,
        refreshTokenLength: refreshToken?.length
      });
    } catch (loginError) {
      console.error('Login failed:', loginError.response?.data || loginError.message);
      throw new Error('Login failed, cannot continue testing');
    }
    
    // Step 3: Decode and verify the token
    console.log('\n----- STEP 3: VERIFY TOKEN -----');
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully, payload:', {
        userId: decoded.userId,
        userIdType: typeof decoded.userId,
        username: decoded.username,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      throw new Error('Token verification failed');
    }
    
    // Step 4: Use token to fetch profile
    console.log('\n----- STEP 4: FETCH PROFILE -----');
    try {
      const profileResponse = await axios.get(`${LOCAL_API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile fetch successful:', profileResponse.data);
    } catch (profileError) {
      console.error('Profile fetch failed:', {
        status: profileError.response?.status,
        data: profileError.response?.data || profileError.message
      });
      // Continue with the flow even if profile fetch fails
    }
    
    // Step 5: Test token refresh
    console.log('\n----- STEP 5: REFRESH TOKEN -----');
    let newToken;
    try {
      const refreshResponse = await axios.post(`${LOCAL_API_URL}/auth/refresh-token`, {
        refreshToken: refreshToken
      });
      
      newToken = refreshResponse.data.token;
      console.log('Token refresh successful:', {
        tokenExists: !!newToken,
        tokenLength: newToken?.length
      });
    } catch (refreshError) {
      console.error('Token refresh failed:', {
        status: refreshError.response?.status,
        data: refreshError.response?.data || refreshError.message
      });
      // Continue with the flow even if refresh fails
    }
    
    if (newToken) {
      // Step 6: Verify the new token
      console.log('\n----- STEP 6: VERIFY NEW TOKEN -----');
      try {
        const newDecoded = jwt.verify(newToken, JWT_SECRET);
        console.log('New token verified successfully, payload:', {
          userId: newDecoded.userId,
          userIdType: typeof newDecoded.userId,
          username: newDecoded.username,
          exp: new Date(newDecoded.exp * 1000).toISOString()
        });
      } catch (newVerifyError) {
        console.error('New token verification failed:', newVerifyError);
      }
      
      // Step 7: Try using the new token
      console.log('\n----- STEP 7: USE NEW TOKEN FOR PROFILE -----');
      try {
        const newProfileResponse = await axios.get(`${LOCAL_API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Profile fetch with new token successful:', newProfileResponse.data);
      } catch (newProfileError) {
        console.error('Profile fetch with new token failed:', {
          status: newProfileError.response?.status,
          data: newProfileError.response?.data || newProfileError.message
        });
      }
    }
    
    // Step 8: Check refresh token in database
    console.log('\n----- STEP 8: CHECK REFRESH TOKEN IN DATABASE -----');
    try {
      const tokenDbResult = await pool.request()
        .input('token', sql.NVarChar, refreshToken)
        .query(`
          SELECT TokenID, UserID, ExpiresAt, RevokedAt, CreatedAt
          FROM RefreshTokens
          WHERE Token = @token
        `);
      
      if (tokenDbResult.recordset.length === 0) {
        console.error('Refresh token not found in database');
      } else {
        const tokenData = tokenDbResult.recordset[0];
        console.log('Refresh token found in database:', {
          tokenId: tokenData.TokenID,
          userId: tokenData.UserID,
          expiresAt: tokenData.ExpiresAt,
          isRevoked: !!tokenData.RevokedAt,
          createdAt: tokenData.CreatedAt
        });
      }
    } catch (tokenDbError) {
      console.error('Error checking refresh token in database:', tokenDbError);
    }
    
    console.log('\n======== TOKEN FLOW DEBUGGING COMPLETE ========');
    console.log('Summary:');
    console.log('- Login successful:', !!token && !!refreshToken);
    console.log('- Initial token verification:', !!decoded);
    console.log('- Token refresh successful:', !!newToken);
    
    return {
      success: true,
      token,
      refreshToken,
      newToken
    };
  } catch (error) {
    console.error('Token flow debugging failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the debug function
debugTokenFlow()
  .then(result => {
    if (result.success) {
      console.log('Debug completed successfully');
      process.exit(0);
    } else {
      console.error('Debug failed:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });