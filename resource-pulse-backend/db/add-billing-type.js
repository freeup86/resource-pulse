/**
 * Add BillingType Column
 * 
 * This script adds the BillingType column to the Allocations table.
 */

const { poolPromise, sql } = require('./config');

const addBillingTypeColumn = async () => {
  try {
    console.log('======================================================');
    console.log('ADDING BILLING TYPE COLUMN');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    console.log('\nChecking and adding BillingType column...');
    try {
      const checkColumn = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Allocations' AND COLUMN_NAME = 'BillingType'
      `);
      
      if (checkColumn.recordset[0].count === 0) {
        console.log('  Adding BillingType column to Allocations table');
        await pool.request().query(`
          ALTER TABLE Allocations ADD BillingType VARCHAR(50) DEFAULT 'Hourly'
        `);
        console.log('  BillingType column added successfully');
      } else {
        console.log('  BillingType column already exists');
      }
    } catch (err) {
      console.error('  Error checking/adding BillingType column:', err.message);
    }
    
    // Also update the ResourceController to handle missing BillingType gracefully
    console.log('\n======================================================');
    console.log('BILLING TYPE COLUMN ADDED');
    console.log('======================================================');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error adding BillingType column:', err);
    process.exit(1);
  }
};

// Run the script
addBillingTypeColumn();