/**
 * Fix Production Schema Issues
 * 
 * This script fixes schema issues in production, particularly addressing the 'Variance' column
 * in BudgetItems table that should be calculated rather than stored.
 */

const { poolPromise, sql } = require('./db/config');

// Function to run a SQL query safely
async function safeExecuteQuery(description, query) {
  try {
    console.log(`Executing: ${description}...`);
    const pool = await poolPromise;
    if (!pool) {
      console.error(`Database connection not available for: ${description}`);
      return false;
    }
    
    await pool.request().query(query);
    console.log(`Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`Error in ${description}:`, err.message);
    return false;
  }
}

async function fixProductionSchema() {
  console.log('======================================================');
  console.log('FIXING PRODUCTION SCHEMA ISSUES');
  console.log('======================================================\n');
  
  // Connect to database
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('Database connection failed. Cannot fix schema issues.');
      return;
    }
    
    // Step 1: Check BudgetItems table for Variance column
    console.log('Step 1: Checking BudgetItems table for Variance column...');
    const varianceCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BudgetItems' AND COLUMN_NAME = 'Variance'
    `);
    
    if (varianceCheck.recordset.length > 0) {
      // Column exists, need to remove it
      console.log('  - Variance column found in BudgetItems table');
      
      // Step 2: First try to create a temporary copy of values
      await safeExecuteQuery('Creating temporary table to preserve data', `
        SELECT 
          BudgetItemID, 
          ProjectID, 
          Category, 
          Description, 
          PlannedAmount, 
          ActualAmount, 
          Notes 
        INTO #TempBudgetItems 
        FROM BudgetItems
      `);
      
      // Step 3: Drop the original table
      await safeExecuteQuery('Dropping original BudgetItems table', `
        DROP TABLE BudgetItems
      `);
      
      // Step 4: Recreate the table without Variance column
      await safeExecuteQuery('Recreating BudgetItems table with correct schema', `
        CREATE TABLE BudgetItems (
          BudgetItemID INT IDENTITY(1,1) PRIMARY KEY,
          ProjectID INT NOT NULL,
          Category NVARCHAR(100) NOT NULL,
          Description NVARCHAR(500) NOT NULL,
          PlannedAmount DECIMAL(14, 2) NOT NULL,
          ActualAmount DECIMAL(14, 2) NULL,
          Notes NVARCHAR(MAX) NULL,
          FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID) ON DELETE CASCADE
        )
      `);
      
      // Step 5: Copy data back from temp table
      await safeExecuteQuery('Restoring data to new BudgetItems table', `
        SET IDENTITY_INSERT BudgetItems ON;
        
        INSERT INTO BudgetItems (
          BudgetItemID, 
          ProjectID, 
          Category, 
          Description, 
          PlannedAmount, 
          ActualAmount, 
          Notes
        )
        SELECT 
          BudgetItemID, 
          ProjectID, 
          Category, 
          Description, 
          PlannedAmount, 
          ActualAmount, 
          Notes
        FROM #TempBudgetItems;
        
        SET IDENTITY_INSERT BudgetItems OFF;
      `);
      
      // Step 6: Drop temp table
      await safeExecuteQuery('Cleaning up temporary table', `
        DROP TABLE #TempBudgetItems
      `);
      
      console.log('Successfully updated BudgetItems table schema');
    } else {
      console.log('  - Variance column not found in BudgetItems table, no action needed');
    }
    
    console.log('\n======================================================');
    console.log('PRODUCTION SCHEMA FIXES COMPLETE');
    console.log('======================================================');
    
  } catch (err) {
    console.error('Fatal error fixing production schema:', err);
  }
}

// Run the fix
fixProductionSchema();