/**
 * Force Fix Details - Directly modify database table structure
 * 
 * This script directly connects to the database and executes SQL to modify 
 * the BudgetItems table structure, removing the Variance column.
 */

const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get database config from environment variables
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function fixDatabaseSchema() {
  console.log('=== Force Fix Details - Database Schema Fix ===');
  console.log('Connecting to database...');
  
  try {
    // Connect to database
    const pool = await sql.connect(config);
    console.log('Connected to database');
    
    // First check if the BudgetItems table exists
    console.log('Checking if BudgetItems table exists...');
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'BudgetItems'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.log('BudgetItems table does not exist. Nothing to fix.');
      return;
    }
    
    // Check if Variance column exists
    console.log('Checking if Variance column exists...');
    const columnCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BudgetItems' AND COLUMN_NAME = 'Variance'
    `);
    
    if (columnCheck.recordset.length === 0) {
      console.log('Variance column does not exist in BudgetItems table. Fixing the INSERT statement only.');
      
      // Check if the table structure matches our expectations
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'BudgetItems'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Current BudgetItems columns:');
      columns.recordset.forEach(col => {
        console.log(` - ${col.COLUMN_NAME}`);
      });
      
      return;
    }
    
    // Variance column exists, need to remove it
    console.log('Variance column found in BudgetItems table. Removing it...');
    
    // First get some data stats
    const countQuery = await pool.request().query(`
      SELECT COUNT(*) AS ItemCount FROM BudgetItems
    `);
    const count = countQuery.recordset[0].ItemCount;
    console.log(`Table contains ${count} budget items.`);
    
    try {
      // Attempt to directly alter the table
      console.log('Attempting to alter table...');
      await pool.request().query(`
        ALTER TABLE BudgetItems DROP COLUMN Variance
      `);
      console.log('Successfully removed Variance column');
    } catch (alterErr) {
      console.log('Could not alter table directly:', alterErr.message);
      console.log('Trying alternative approach with backup and recreate...');
      
      // Create a temp table and copy data
      await pool.request().query(`
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
      
      // Drop original table
      await pool.request().query(`
        DROP TABLE BudgetItems
      `);
      
      // Recreate without Variance
      await pool.request().query(`
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
      
      // Copy data back
      await pool.request().query(`
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
        
        DROP TABLE #TempBudgetItems;
      `);
      
      console.log('Successfully rebuilt BudgetItems table without Variance column');
    }
    
    // Verify the fix
    const verifyColumns = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BudgetItems'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('New BudgetItems columns:');
    verifyColumns.recordset.forEach(col => {
      console.log(` - ${col.COLUMN_NAME}`);
    });
    
    console.log('Database schema fixed successfully');
  } catch (err) {
    console.error('Error fixing database schema:', err);
  } finally {
    try {
      await sql.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log('Schema fix process completed');
  })
  .catch(err => {
    console.error('Unhandled error:', err);
  });
