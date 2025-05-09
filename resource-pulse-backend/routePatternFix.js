/**
 * Route Pattern Fix for Express
 * 
 * This file provides a monkey patch for Express to fix path-to-regexp errors
 * related to empty parameter names in route patterns.
 */

// Function to be executed before the server starts
function applyRoutePatternFix() {
  try {
    // Get references to original express and path-to-regexp modules
    const pathToRegexpModule = require('path-to-regexp');
    const originalParse = pathToRegexpModule.parse;
    
    // Monkey patch the parse function in path-to-regexp
    pathToRegexpModule.parse = function patchedParse(path, options = {}) {
      try {
        // Check for problematic patterns before parsing
        if (typeof path === 'string') {
          // Fix patterns with empty parameter names: '/:/'
          if (path.includes('/:/')) {
            console.warn(`Fixing problematic route pattern: ${path}`);
            path = path.replace('/:/', '/:param/');
          }
          
          // Fix patterns with empty parameter names: '/::'
          if (path.includes('/::')) {
            console.warn(`Fixing problematic route pattern: ${path}`);
            path = path.replace('/::', '/:param:');
          }
          
          // Fix patterns with trailing colon: '/path/:'
          if (path.includes('/:') && path.endsWith(':')) {
            console.warn(`Fixing problematic route pattern: ${path}`);
            path = path.replace(/:$/, ':param');
          }
        }
        
        // Call the original parse function with the fixed path
        return originalParse.call(this, path, options);
      } catch (err) {
        console.error(`Error in patched path-to-regexp.parse: ${err.message}`);
        
        // If we encounter an error, let's try to rescue by replacing any problematic patterns
        if (typeof path === 'string') {
          const fixedPath = path
            .replace(/\/:[^a-zA-Z0-9_]/g, '/:param')  // Replace any : followed by non-word char
            .replace(/\/:$/g, '/:param')             // Replace any trailing /:
            .replace(/\/:[^\/]*:/g, '/:param:');     // Replace any :: in parameters
          
          console.warn(`Attempting to fix route pattern: ${path} -> ${fixedPath}`);
          return originalParse.call(this, fixedPath, options);
        }
        
        throw err; // Re-throw if we can't fix it
      }
    };
    
    console.log('Path-to-regexp route pattern fix applied successfully');
    return true;
  } catch (error) {
    console.error('Failed to apply path-to-regexp fix:', error);
    return false;
  }
}

module.exports = applyRoutePatternFix;