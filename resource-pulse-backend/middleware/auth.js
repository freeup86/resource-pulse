// auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../db/config');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = (req, res, next) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }
  
  // Check if the format is Bearer {token}
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Authentication failed. Token format is invalid.' });
  }
  
  const token = parts[1];
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication failed. Token has expired.' });
    }
    
    return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
};

/**
 * Middleware to check if user has admin role
 * Must be used after authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

/**
 * Middleware to check if user is active
 * Must be used after authenticate middleware
 */
const requireActiveUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query(`
        SELECT IsActive 
        FROM Users 
        WHERE UserID = @userId
      `);
    
    if (result.recordset.length === 0 || !result.recordset[0].IsActive) {
      return res.status(403).json({ message: 'Your account is inactive or has been disabled.' });
    }
    
    next();
  } catch (err) {
    console.error('Error checking user status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireActiveUser
};