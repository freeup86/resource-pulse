/**
 * Hot-fix script to update the routes to use the fixed controller
 */
const fs = require('fs');
const path = require('path');

// Paths
const routesPath = path.join(__dirname, '..', 'routes', 'clientSatisfactionRoutes.js');
const backupPath = `${routesPath}.bak`;

// Backup the original file
console.log(`Creating backup of ${routesPath} to ${backupPath}`);
fs.copyFileSync(routesPath, backupPath);

// Read the routes file
console.log('Reading routes file...');
const routesContent = fs.readFileSync(routesPath, 'utf8');

// Update the controller import
const updatedContent = routesContent.replace(
  /const clientSatisfactionController = require\(['"]\.\.\/controllers\/clientSatisfactionController['"]\);/,
  "const clientSatisfactionController = require('../controllers/clientSatisfactionController-fixed');"
);

// Write the updated content
console.log('Writing updated routes file...');
fs.writeFileSync(routesPath, updatedContent);

console.log('Hot-fix applied!');
console.log('Please restart your server for the changes to take effect.');
console.log('To revert the changes later, run:');
console.log(`cp ${backupPath} ${routesPath}`);