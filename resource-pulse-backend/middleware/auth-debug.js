// Enhanced auth middleware with comprehensive debugging
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../db/config');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';

/**
 * Enhanced middleware to authenticate JWT tokens with debugging
 */
const authenticateDebug = (req, res, next) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  
  console.log('Auth Debug: Request received', {
    url: req.url,
    method: req.method,
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'None',
    userAgent: req.headers['user-agent']
  });
  
  if (!authHeader) {
    console.log('Auth Debug: No authorization header provided');
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }
  
  // Check if the format is Bearer {token}
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Auth Debug: Invalid token format', { parts: parts.length, prefix: parts[0] });
    return res.status(401).json({ message: 'Authentication failed. Token format is invalid.' });
  }
  
  const token = parts[1];
  
  console.log('Auth Debug: Token extracted', {
    tokenLength: token.length,
    tokenStart: token.substring(0, 10),
    tokenEnd: token.substring(token.length - 10)
  });
  
  try {
    // First, try to decode without verification to see the payload
    let unverifiedPayload;
    try {
      unverifiedPayload = jwt.decode(token);
      console.log('Auth Debug: Unverified token payload', {
        userId: unverifiedPayload?.userId,
        userIdType: typeof unverifiedPayload?.userId,
        username: unverifiedPayload?.username,
        exp: unverifiedPayload?.exp ? new Date(unverifiedPayload.exp * 1000) : 'None',
        iat: unverifiedPayload?.iat ? new Date(unverifiedPayload.iat * 1000) : 'None'
      });
    } catch (decodeErr) {
      console.error('Auth Debug: Failed to decode token', decodeErr);
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('Auth Debug: Token verified successfully', {
      userId: decoded.userId,
      userIdType: typeof decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000),
      iat: new Date(decoded.iat * 1000)
    });
    
    // Force userId to be a number to prevent SQL parameter validation errors
    if (decoded && decoded.userId !== undefined && decoded.userId !== null) {
      const originalUserId = decoded.userId;
      decoded.userId = Number(decoded.userId);
      
      console.log('Auth Debug: UserId conversion', {
        original: originalUserId,
        originalType: typeof originalUserId,
        converted: decoded.userId,
        convertedType: typeof decoded.userId,
        isNaN: isNaN(decoded.userId)
      });
      
      if (isNaN(decoded.userId)) {
        console.error('Auth Debug: Invalid userId in token after conversion', decoded);
        return res.status(401).json({ message: 'Authentication failed. Invalid user ID in token.' });
      }
    } else {
      console.error('Auth Debug: No userId found in token payload', decoded);
      return res.status(401).json({ message: 'Authentication failed. No user ID in token.' });
    }
    
    // Attach user info to request object
    req.user = decoded;
    
    console.log('Auth Debug: User attached to request', {
      userId: req.user.userId,
      userIdType: typeof req.user.userId,
      username: req.user.username
    });
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Auth Debug: Token verification error:', {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
      stack: err.stack
    });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Authentication failed. Token has expired.',
        expiredAt: err.expiredAt
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Authentication failed. Invalid token format.',
        error: err.message
      });
    }
    
    return res.status(401).json({ 
      message: 'Authentication failed. Invalid token.',
      error: process.env.NODE_ENV === 'production' ? 'Token verification failed' : err.message
    });
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
  authenticate: authenticateDebug,
  requireAdmin,
  requireActiveUser
};