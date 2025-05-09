/**
 * Route Debugging Middleware
 * This middleware helps identify problematic route patterns
 */
const express = require('express');

/**
 * Creates a middleware that logs route information
 */
function createDebugMiddleware() {
  const router = express.Router();
  
  // Intercepts all requests to log route information
  router.use((req, res, next) => {
    console.log(`[ROUTE DEBUG] Path: ${req.path}`);
    if (req.path.includes('/:')) {
      console.warn(`[ROUTE DEBUG] WARNING: Possible invalid parameter - ${req.path}`);
    }
    next();
  });
  
  return router;
}

module.exports = createDebugMiddleware;