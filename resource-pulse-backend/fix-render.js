/**
 * Fix BudgetItems Table in Render Deployment
 * 
 * This script directly modifies the SQL query in projectController.js
 * to calculate Variance instead of selecting it. This is a simpler
 * approach that doesn't require database schema changes.
 */

const fs = require('fs');
const path = require('path');

// Find all controllers directory
function findControllersDir() {
  const possiblePaths = [
    './controllers',
    '../controllers',
    '../../controllers',
    '../resource-pulse-backend/controllers',
    '/opt/render/project/src/controllers',
    '/opt/render/project/src/resource-pulse-backend/controllers'
  ];
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(`Found controllers directory at: ${dirPath}`);
      return dirPath;
    }
  }
  
  console.error('Controllers directory not found');
  return null;
}

// Fix projectController.js file
function fixProjectController(controllersDir) {
  const filePath = path.join(controllersDir, 'projectController.js');
  
  if (!fs.existsSync(filePath)) {
    console.error(`Project controller not found at: ${filePath}`);
    return false;
  }
  
  console.log(`Found project controller at: ${filePath}`);
  
  try {
    // Create backup file
    const backupPath = `${filePath}.bak.fix`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    
    // Read file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Variance column selection with calculation
    const originalPattern = /SELECT\s+[^;]*?BudgetItemID,\s+Category,\s+Description,\s+PlannedAmount,\s+ActualAmount,\s+Variance,\s+Notes\s+FROM\s+BudgetItems/g;
    const replacementText = 'SELECT BudgetItemID, Category, Description, PlannedAmount, ActualAmount, COALESCE(PlannedAmount, 0) - COALESCE(ActualAmount, 0) AS Variance, Notes FROM BudgetItems';
    
    // Apply fix
    const updatedContent = content.replace(originalPattern, replacementText);
    
    // Count replacements
    const replacementCount = (updatedContent.match(/COALESCE\(PlannedAmount, 0\) - COALESCE\(ActualAmount, 0\) AS Variance/g) || []).length;
    
    if (replacementCount === 0) {
      console.log('No instances of Variance column selection found, or the file might already be fixed');
      return false;
    }
    
    // Save changes
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Applied fix with ${replacementCount} replacements`);
    
    return true;
  } catch (err) {
    console.error('Error fixing project controller:', err);
    return false;
  }
}

// Main function
async function main() {
  console.log('======================================================');
  console.log('FIXING SQL QUERY FOR BUDGET ITEMS TABLE');
  console.log('======================================================\n');
  
  const controllersDir = findControllersDir();
  if (!controllersDir) {
    process.exit(1);
  }
  
  const success = fixProjectController(controllersDir);
  
  if (success) {
    console.log('\n======================================================');
    console.log('FIX APPLIED SUCCESSFULLY');
    console.log('======================================================');
    console.log('You should restart the server for changes to take effect');
  } else {
    console.log('\n======================================================');
    console.log('FIX NOT APPLIED - NO CHANGES MADE');
    console.log('======================================================');
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});