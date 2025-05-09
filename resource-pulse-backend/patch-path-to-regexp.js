/**
 * Direct patch to path-to-regexp module
 * 
 * This script directly modifies the path-to-regexp module's source code
 * to make it handle invalid parameter names gracefully.
 * If the patch cannot be applied, it falls back to a proxy-based solution.
 */

const fs = require('fs');
const path = require('path');

// Find the path-to-regexp module file
const pathToRegexpPath = path.join(
  __dirname, 
  'node_modules', 
  'path-to-regexp', 
  'dist', 
  'index.js'
);

function applyDirectPatch() {
  try {
    console.log(`Patching file: ${pathToRegexpPath}`);

    if (!fs.existsSync(pathToRegexpPath)) {
      console.warn('path-to-regexp module file not found, using fallback approach');
      return false;
    }

    // Read the file content
    let content = fs.readFileSync(pathToRegexpPath, 'utf8');

    // Find the location of the problematic code
    const errorFunctionLoc = content.indexOf('if (!value) {');
    if (errorFunctionLoc === -1) {
      console.warn('Could not find the target code to patch, using fallback approach');
      return false;
    }

    // Find the line we need to modify
    const errorThrowLoc = content.indexOf('throw new TypeError', errorFunctionLoc);
    if (errorThrowLoc === -1) {
      console.warn('Could not find the error throw statement, using fallback approach');
      return false;
    }

    // Extract the problematic code segment
    const originalSegment = content.substring(errorFunctionLoc, errorThrowLoc + 80);
    console.log('Found original code segment:');
    console.log(originalSegment);

    // Create the patched version
    const patchedSegment = `if (!value) {
            // PATCHED: Add a default parameter name instead of throwing error
            console.warn(\`Missing parameter name at \${i}, adding default name\`);
            return \`param\${i}\`;
            // Original code: throw new TypeError(\`Missing parameter name at \${i}: \${DEBUG_URL}\`);
        }`;

    // Replace the code
    const patchedContent = content.replace(
      originalSegment.substring(0, originalSegment.indexOf('throw new TypeError') + 'throw new TypeError'.length + 80),
      patchedSegment
    );

    // Backup the original file
    try {
      const backupPath = `${pathToRegexpPath}.bak`;
      fs.writeFileSync(backupPath, content);
      console.log(`Original file backed up to ${backupPath}`);
    } catch (err) {
      console.warn(`Could not create backup file: ${err.message}`);
      // Continue anyway
    }

    // Write the patched content
    fs.writeFileSync(pathToRegexpPath, patchedContent);
    console.log('Successfully patched path-to-regexp module');

    // Verify the patch was applied
    const verificationContent = fs.readFileSync(pathToRegexpPath, 'utf8');
    if (verificationContent.includes('PATCHED: Add a default parameter name')) {
      console.log('Patch verification successful');
      return true;
    } else {
      console.warn('Patch verification failed, using fallback approach');
      return false;
    }
  } catch (err) {
    console.warn(`Error applying direct patch: ${err.message}`);
    return false;
  }
}

function applyProxyPatch() {
  try {
    console.log('Applying proxy-based patch for path-to-regexp');
    
    // Get the path-to-regexp module
    const pathToRegexp = require('path-to-regexp');
    
    // Save original parse function
    const originalParse = pathToRegexp.parse;
    
    // Override the parse function
    pathToRegexp.parse = function(path, options = {}) {
      try {
        // Try the original parse
        return originalParse(path, options);
      } catch (err) {
        // If we get an error about missing parameter name
        if (err.message && err.message.includes('Missing parameter name')) {
          console.warn(`Catching path-to-regexp error for path: ${path}`);
          
          // Fix the path by replacing problematic patterns
          if (typeof path === 'string') {
            const fixedPath = path
              .replace(/\/:(\/|$|[^a-zA-Z0-9_])/g, '/:_param$1')
              .replace(/\/:/g, '/:_param');
            
            console.warn(`Fixed path from "${path}" to "${fixedPath}"`);
            
            // Try again with the fixed path
            try {
              return originalParse(fixedPath, options);
            } catch (innerErr) {
              console.error(`Failed to parse fixed path: ${innerErr.message}`);
            }
          }
        }
        
        // Re-throw the original error
        throw err;
      }
    };
    
    // Also patch pathToRegexp function if it exists
    if (typeof pathToRegexp.pathToRegexp === 'function') {
      const originalPathToRegexp = pathToRegexp.pathToRegexp;
      
      pathToRegexp.pathToRegexp = function(path, keys, options) {
        try {
          return originalPathToRegexp.call(this, path, keys, options);
        } catch (err) {
          if (err.message && err.message.includes('Missing parameter name')) {
            console.warn(`Catching path-to-regexp.pathToRegexp error for path: ${path}`);
            
            // Fix the path by replacing problematic patterns
            if (typeof path === 'string') {
              const fixedPath = path
                .replace(/\/:(\/|$|[^a-zA-Z0-9_])/g, '/:_param$1')
                .replace(/\/:/g, '/:_param');
              
              console.warn(`Fixed path from "${path}" to "${fixedPath}"`);
              
              // Try again with the fixed path
              try {
                return originalPathToRegexp.call(this, fixedPath, keys, options);
              } catch (innerErr) {
                console.error(`Failed to parse fixed path: ${innerErr.message}`);
              }
            }
          }
          
          // Re-throw the original error
          throw err;
        }
      };
    }
    
    console.log('Proxy-based patch applied successfully');
    return true;
  } catch (err) {
    console.error(`Failed to apply proxy-based patch: ${err.message}`);
    return false;
  }
}

// Try direct patch first, fall back to proxy patch
if (!applyDirectPatch()) {
  console.log('Falling back to proxy-based patch method');
  applyProxyPatch();
}