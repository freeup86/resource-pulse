// Authentication middleware
const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Middleware to verify JWT token and authorize user
 */
const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided');
    }

    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Access denied. No token provided');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    next(err);
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    // Convert string to array if only one role is provided
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user role is included in the required roles
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized to access this resource'));
    }

    next();
  };
};

module.exports = {
  auth,
  authorize
};