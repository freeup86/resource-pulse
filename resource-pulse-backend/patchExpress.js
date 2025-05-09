/**
 * Express Patch for path-to-regexp error
 * 
 * This script patches Express to prevent path-to-regexp errors
 * by adding a wrapper around the route registration methods.
 */

function patchExpress() {
  try {
    // Load required modules
    const express = require('express');
    const Router = express.Router;
    
    // Get reference to the original route methods
    const originalGet = Router.prototype.get;
    const originalPost = Router.prototype.post;
    const originalPut = Router.prototype.put;
    const originalDelete = Router.prototype.delete;
    
    // Define route validator function
    function validateRoute(route) {
      // If not a string, return as is
      if (typeof route !== 'string') return route;

      // Check if the route has problematic parameter patterns
      try {
        // Fix routes with parameter name missing after colon
        // Examples: '/:', '/:/', '/::'
        let fixedRoute = route;

        // Special fix for '/:', which seems to be directly causing the error
        if (fixedRoute.includes('/:') && !fixedRoute.match(/\/:[a-zA-Z0-9_]/)) {
          // This means we have /: but not followed by a valid parameter name character
          console.warn(`[EXPRESS PATCH] Critical problem in route detected: ${route}`);
          // Add param name after any ":" that isn't followed by a valid character
          fixedRoute = fixedRoute.replace(/\/:(\/|$|\W)/g, '/:_param$1');
          console.warn(`[EXPRESS PATCH] Fixed to: ${fixedRoute}`);
        }

        // Replace parameter marker followed immediately by non-alphanumeric character
        if (fixedRoute.match(/\/:[^a-zA-Z0-9_\/]/)) {
          console.warn(`[EXPRESS PATCH] Problematic route detected: ${route}`);
          fixedRoute = fixedRoute.replace(/\/:[^a-zA-Z0-9_\/]/g, '/:_param$&');
          console.warn(`[EXPRESS PATCH] Fixed to: ${fixedRoute}`);
        }

        // Replace parameter marker that ends the string
        if (fixedRoute.match(/\/:$/)) {
          console.warn(`[EXPRESS PATCH] Trailing parameter marker detected: ${route}`);
          fixedRoute = fixedRoute + '_param';
          console.warn(`[EXPRESS PATCH] Fixed to: ${fixedRoute}`);
        }

        // Special case: /:id format - this is likely not the issue, but let's be safe
        if (fixedRoute === '/:') {
          console.warn(`[EXPRESS PATCH] Empty parameter detected: ${route}`);
          fixedRoute = '/:_param';
          console.warn(`[EXPRESS PATCH] Fixed to: ${fixedRoute}`);
        }
        
        return fixedRoute;
      } catch (err) {
        console.warn(`[EXPRESS PATCH] Error validating route ${route}: ${err.message}`);
        return route;
      }
    }
    
    // Patch router.get method
    Router.prototype.get = function(route, ...handlers) {
      return originalGet.call(this, validateRoute(route), ...handlers);
    };
    
    // Patch router.post method
    Router.prototype.post = function(route, ...handlers) {
      return originalPost.call(this, validateRoute(route), ...handlers);
    };
    
    // Patch router.put method
    Router.prototype.put = function(route, ...handlers) {
      return originalPut.call(this, validateRoute(route), ...handlers);
    };
    
    // Patch router.delete method
    Router.prototype.delete = function(route, ...handlers) {
      return originalDelete.call(this, validateRoute(route), ...handlers);
    };
    
    // Add check if we are already patched
    if (!Router._patched) {
      Router._patched = true;
      console.log('[EXPRESS PATCH] Express router methods successfully patched!');
    }
    
    return true;
  } catch (err) {
    console.error('[EXPRESS PATCH] Failed to patch Express:', err);
    return false;
  }
}

module.exports = patchExpress;