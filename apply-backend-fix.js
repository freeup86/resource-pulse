// apply-backend-fix.js - Script to apply backend fixes for the profile API issue
const fs = require('fs');
const path = require('path');

// Paths to the files we need to update
const AUTH_CONTROLLER_PATH = path.join(__dirname, 'resource-pulse-backend', 'controllers', 'authController.js');
const AUTH_CONTROLLER_FIXED_PATH = path.join(__dirname, 'resource-pulse-backend', 'controllers', 'authController-fixed.js');
const AUTH_MIDDLEWARE_PATH = path.join(__dirname, 'resource-pulse-backend', 'middleware', 'auth.js');

// Create backup function
function createBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  console.log(`Creating backup of ${filePath} to ${backupPath}`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Apply fixes function
async function applyFixes() {
  console.log('Starting application of backend fixes...');

  try {
    // Create backups first
    if (fs.existsSync(AUTH_CONTROLLER_PATH)) {
      createBackup(AUTH_CONTROLLER_PATH);
    } else {
      console.error(`ERROR: Auth controller not found at ${AUTH_CONTROLLER_PATH}`);
      return;
    }
    
    if (fs.existsSync(AUTH_MIDDLEWARE_PATH)) {
      createBackup(AUTH_MIDDLEWARE_PATH);
    }

    console.log('Backups created successfully.');

    console.log('Applying fixes to auth controller...');
    
    if (fs.existsSync(AUTH_CONTROLLER_FIXED_PATH)) {
      // Copy the fixed controller to the original location
      fs.copyFileSync(AUTH_CONTROLLER_FIXED_PATH, AUTH_CONTROLLER_PATH);
      console.log('Auth controller replaced with fixed version successfully.');
    } else {
      console.error(`ERROR: Fixed auth controller not found at ${AUTH_CONTROLLER_FIXED_PATH}`);
      return;
    }

    // Modify auth middleware to ensure user ID is converted to a number
    if (fs.existsSync(AUTH_MIDDLEWARE_PATH)) {
      console.log('Updating auth middleware...');
      
      let authMiddlewareContent = fs.readFileSync(AUTH_MIDDLEWARE_PATH, 'utf8');
      
      // Check if it needs to be modified
      if (!authMiddlewareContent.includes('Force userId to be a number')) {
        // Add number conversion to the middleware
        authMiddlewareContent = authMiddlewareContent.replace(
          '    // Attach user info to request object\n    req.user = decoded;',
          '    // Attach user info to request object\n    // Force userId to be a number to prevent SQL parameter validation errors\n    if (decoded && decoded.userId) {\n      decoded.userId = Number(decoded.userId);\n      if (isNaN(decoded.userId)) {\n        console.error(\'Auth middleware: Invalid userId in token\', decoded);\n        return res.status(401).json({ message: \'Authentication failed. Invalid user ID in token.\' });\n      }\n    }\n    req.user = decoded;'
        );
        
        // Write updated middleware
        fs.writeFileSync(AUTH_MIDDLEWARE_PATH, authMiddlewareContent);
        console.log('Auth middleware updated successfully.');
      } else {
        console.log('Auth middleware already contains the fix.');
      }
    }
    
    console.log('\nFix application complete!');
    console.log('\nThe applied fixes address the following issues:');
    console.log('1. Force userId to be a number in JWT token payload');
    console.log('2. Add validation of userId in auth controller');
    console.log('3. Ensure userId is properly converted before SQL operations');
    console.log('4. Add better error handling and reporting');
    
    console.log('\nNext steps:');
    console.log('1. Restart the backend server');
    console.log('2. Test the profile API by logging in and viewing the profile page');
    console.log('3. Check server logs for any remaining errors');
  } catch (error) {
    console.error('Error applying fixes:', error);
    process.exit(1);
  }
}

// Run the fix application
applyFixes().catch(err => {
  console.error('Unhandled error during fix application:', err);
  process.exit(1);
});