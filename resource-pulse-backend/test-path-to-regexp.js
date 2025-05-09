/**
 * Script to test and identify the exact route that causes the path-to-regexp error
 */
const fs = require('fs');
const path = require('path');

// First, let's monkey-patch the path-to-regexp module's `name` function
// to log any problematic parameters it encounters
try {
  // Find the path-to-regexp module file location
  const pathToRegexpPath = require.resolve('path-to-regexp');
  
  // Read the file contents
  let content = fs.readFileSync(pathToRegexpPath, 'utf8');
  
  // Log the location for verification
  console.log(`path-to-regexp found at: ${pathToRegexpPath}`);
  
  // Test a known problematic route to see the exact issue
  const express = require('express');
  const app = express();
  
  // Create a fake route to trace
  try {
    // Intercept the error
    const originalParse = require('path-to-regexp').parse;
    require('path-to-regexp').parse = function(str, options) {
      console.log(`Testing route: ${str}`);
      try {
        return originalParse(str, options);
      } catch(e) {
        console.error(`!! ERROR parsing route: ${str}`);
        console.error(e.message);
        // If the error is about missing parameter name, let's try to fix it
        if (e.message.includes('Missing parameter name')) {
          // Check for empty parameter name
          if (str.includes('/:')) {
            const fixedStr = str.replace(/\/:[^a-zA-Z0-9_]/g, '/:_param');
            console.log(`Attempted fix: ${fixedStr}`);
            // Try the fixed version
            try {
              const result = originalParse(fixedStr, options);
              console.log('Fix worked!');
              return result;
            } catch(e2) {
              console.error('Fix did not work:', e2.message);
            }
          }
        }
        throw e;
      }
    };
    
    // Try some problematic routes
    const router = express.Router();
    
    console.log('\nTesting potentially problematic routes:');
    router.get('/test/:', ()=>{});
    router.get('/test/:/', ()=>{});
    router.get('/test/::test', ()=>{});
    router.get('/:id', ()=>{});
    
    // From our codebase:
    router.get('/projects/:projectId/recommendations', ()=>{});
    router.get('/clients/:clientId/satisfaction', ()=>{});
    
    console.log('\nAll route tests completed successfully');
  } catch (err) {
    console.error('Error testing routes:', err);
  }
  
} catch (err) {
  console.error('Error patching path-to-regexp:', err);
}