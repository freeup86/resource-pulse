// JWT utility functions
const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user.UserID,
      email: user.Email,
      role: user.Role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return token;
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw error;
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw error;
  }
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object with id
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  try {
    const refreshToken = jwt.sign(
      { id: user.UserID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return refreshToken;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};