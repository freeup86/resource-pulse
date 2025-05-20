// Script to apply the auth profile fetch fix
const fs = require('fs');
const path = require('path');

try {
  console.log('Applying auth profile fetch fix...');
  
  // Backup the original file
  const authServicePath = path.join(__dirname, 'src', 'services', 'authService.js');
  const backupPath = path.join(__dirname, 'src', 'services', 'authService.js.bak');
  
  if (fs.existsSync(authServicePath)) {
    fs.copyFileSync(authServicePath, backupPath);
    console.log(`Original file backed up to ${backupPath}`);
  }
  
  // Copy the fixed version to replace the original
  const fixedPath = path.join(__dirname, 'src', 'services', 'authService.fixed.js');
  
  if (fs.existsSync(fixedPath)) {
    fs.copyFileSync(fixedPath, authServicePath);
    console.log(`Auth service replaced with fixed version`);
    
    console.log('Fix applied successfully!');
    console.log('The fix addresses the following issues:');
    console.log('1. Improved profile fetching with better error handling');
    console.log('2. Added direct axios request to bypass problematic interceptors');
    console.log('3. Added token age tracking for automatic refreshing');
    console.log('4. Implemented more robust interceptor cleanup');
    console.log('5. Enhanced caching prevention for auth requests');
    console.log('6. Added improved debug logging');
  } else {
    console.error('Fixed auth service file not found');
  }
} catch (error) {
  console.error('Error applying fix:', error);
}