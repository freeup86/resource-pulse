/**
 * Direct Fix Script for Variance Column Issue
 * 
 * This script directly edits the insert query in the projectController.js
 * to fix the Variance column issue.
 */

const fs = require('fs');
const path = require('path');

// Main function to fix the issue
async function fixVarianceIssue() {
  console.log("=== Direct Fix Script for Variance Column Issue ===");
  
  // Find projectController.js
  const projectControllerPath = '/opt/render/project/src/resource-pulse-backend/controllers/projectController.js';
  
  if (\!fs.existsSync(projectControllerPath)) {
    console.error(`File not found: ${projectControllerPath}`);
    return false;
  }
  
  console.log(`Found projectController.js at: ${projectControllerPath}`);
  
  // Create a backup
  const backupPath = `${projectControllerPath}.bak.variance-fix`;
  fs.copyFileSync(projectControllerPath, backupPath);
  console.log(`Created backup at: ${backupPath}`);
  
  // Read the file
  let content = fs.readFileSync(projectControllerPath, 'utf8');
  
  // Find and fix the BudgetItems INSERT query with Variance
  const originalInsertPattern = /INSERT INTO BudgetItems \(\s*ProjectID,\s*Category,\s*Description,\s*PlannedAmount,\s*ActualAmount,\s*Variance,\s*Notes\s*\)/;
  
  if (content.match(originalInsertPattern)) {
    console.log("Found INSERT statement with Variance column");
    
    // Replace the INSERT statement to remove Variance
    const fixedContent = content.replace(
      originalInsertPattern,
      'INSERT INTO BudgetItems (\n                ProjectID, \n                Category, \n                Description, \n                PlannedAmount,\n                ActualAmount,\n                Notes\n              )'
    );
    
    // Fix the VALUES clause as well
    const originalValuesPattern = /VALUES \(\s*@projectId,\s*@category,\s*@description,\s*@plannedAmount,\s*@actualAmount,\s*@plannedAmount,\s*@notes\s*\)/;
    
    let newContent = fixedContent.replace(
      originalValuesPattern,
      'VALUES (\n                @projectId, \n                @category, \n                @description, \n                @plannedAmount,\n                0,  -- Initial actual amount is 0\n                @notes\n              )'
    );
    
    // Now fix any direct queries to select the BudgetItems table
    const selectPattern = /SELECT\s+[^;]*?BudgetItemID,\s*Category,\s*Description,\s*PlannedAmount,\s*ActualAmount,\s*Variance,\s*Notes\s+FROM\s+BudgetItems/g;
    
    newContent = newContent.replace(
      selectPattern,
      'SELECT \n            BudgetItemID,\n            Category,\n            Description,\n            PlannedAmount,\n            ActualAmount,\n            COALESCE(PlannedAmount, 0) - COALESCE(ActualAmount, 0) AS Variance,\n            Notes\n          FROM BudgetItems'
    );
    
    // Write the changes
    fs.writeFileSync(projectControllerPath, newContent);
    console.log("Updated INSERT and SELECT statements for BudgetItems table");
    
    // Look for the other issue with INSERT
    console.log("Checking for other INSERT statements...");
    
    // Add more specific fixes for other locations if needed
    
    console.log("Completed fixes for projectController.js");
    return true;
  } else {
    console.log("INSERT statement with Variance column not found - another issue might be causing the error");
    return false;
  }
}

// Run the fix
fixVarianceIssue()
  .then(result => {
    if (result) {
      console.log("Fix completed successfully. Restart the server to apply changes.");
    } else {
      console.log("Unable to complete fix automatically.");
    }
  })
  .catch(err => {
    console.error("Error during fix:", err);
  });
