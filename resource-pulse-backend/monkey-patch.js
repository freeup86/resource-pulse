/**
 * Monkey Patch for path-to-regexp Empty Parameter Name Error
 * 
 * This module directly patches the path-to-regexp module's error handling
 * to fix issues with empty parameter names in route patterns.
 */

// Function to apply the monkey patch
function applyPathToRegexpPatch() {
  try {
    // Load path-to-regexp module
    const pathToRegexpModule = require.cache[require.resolve('path-to-regexp')];
    
    if (!pathToRegexpModule || !pathToRegexpModule.exports) {
      console.error('[PATCH] Cannot find path-to-regexp module in require.cache');
      return false;
    }
    
    // Store original parse function
    const originalParse = pathToRegexpModule.exports.parse;
    
    // Replace parse with our patched version
    pathToRegexpModule.exports.parse = function patchedParse(path, options = {}) {
      try {
        // Fix path before passing to original parse
        if (typeof path === 'string') {
          // Fix /:/ pattern (empty parameter)
          if (path.includes('/:')) {
            // Replace any instances of a colon followed by a non-word character
            const fixedPath = path.replace(/\/:(\/|$|[^a-zA-Z0-9_])/g, '/:__param$1');
            
            // Log the fix if it made any changes
            if (fixedPath !== path) {
              console.log(`[PATCH] Fixed route pattern: ${path} → ${fixedPath}`);
              path = fixedPath;
            }
          }
        }
        
        // Call original parse with potentially fixed path
        return originalParse.call(this, path, options);
      } catch (err) {
        // If error still occurs, try more aggressive fix
        if (err.message && err.message.includes('Missing parameter name')) {
          console.warn(`[PATCH] Error parsing route "${path}": ${err.message}`);
          
          // One last attempt - replace all parameter markers with fixed parameter
          if (typeof path === 'string') {
            const sanitizedPath = path.replace(/\/:/g, '/:__fixed_param');
            console.log(`[PATCH] Last resort fix: ${path} → ${sanitizedPath}`);
            
            try {
              return originalParse.call(this, sanitizedPath, options);
            } catch (e) {
              console.error(`[PATCH] Final fix failed: ${e.message}`);
            }
          }
        }
        
        // If we can't fix it, re-throw the original error
        throw err;
      }
    };
    
    // Check if we need to patch pathToRegexp function too
    if (typeof pathToRegexpModule.exports.pathToRegexp === 'function') {
      const originalPathToRegexp = pathToRegexpModule.exports.pathToRegexp;
      
      pathToRegexpModule.exports.pathToRegexp = function patchedPathToRegexp(path, keys, options) {
        try {
          return originalPathToRegexp.call(this, path, keys, options);
        } catch (err) {
          console.warn(`[PATCH] Error in pathToRegexp: ${err.message}`);
          
          // Apply same fixes as in parse
          if (typeof path === 'string' && path.includes('/:')) {
            const fixedPath = path.replace(/\/:(\/|$|[^a-zA-Z0-9_])/g, '/:__param$1');
            console.log(`[PATCH] Fixing in pathToRegexp: ${path} → ${fixedPath}`);
            return originalPathToRegexp.call(this, fixedPath, keys, options);
          }
          throw err;
        }
      };
    }
    
    console.log('[PATCH] Successfully applied path-to-regexp fixes!');
    return true;
  } catch (err) {
    console.error('[PATCH] Failed to patch path-to-regexp:', err);
    return false;
  }
}

module.exports = applyPathToRegexpPatch;