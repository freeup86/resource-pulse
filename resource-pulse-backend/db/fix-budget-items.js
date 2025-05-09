/**
 * Fix BudgetItems table structure by removing Variance column
 * 
 * This script updates the BudgetItems table structure to remove the Variance column,
 * which should be calculated instead of stored. This fixes the issue with SQL Server.
 */

const { poolPromise, sql } = require('./config');

const fixBudgetItems = async () => {
  try {
    console.log('======================================================');
    console.log('FIXING BUDGET ITEMS TABLE STRUCTURE');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Check if Variance column exists
    console.log('\nChecking if Variance column exists in BudgetItems table...');
    const columnCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BudgetItems' AND COLUMN_NAME = 'Variance'
    `);
    
    if (columnCheck.recordset.length > 0) {
      console.log('  Variance column found - removing it...');
      
      // Remove the Variance column
      await pool.request().query(`
        ALTER TABLE BudgetItems
        DROP COLUMN Variance
      `);
      
      console.log('  Variance column removed successfully');
    } else {
      console.log('  Variance column not found - no action needed');
    }
    
    console.log('\n======================================================');
    console.log('BUDGET ITEMS TABLE FIXED SUCCESSFULLY');
    console.log('======================================================');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error fixing BudgetItems table:', err);
    process.exit(1);
  }
};

// Run the script
fixBudgetItems();