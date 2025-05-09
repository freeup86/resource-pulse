/**
 * Fix Resources Table Schema
 * 
 * This script modifies the Resources table to allow NULL values in the Role column.
 */

const { poolPromise, sql } = require('./config');

const fixResourcesTable = async () => {
  try {
    console.log('======================================================');
    console.log('FIXING RESOURCES TABLE SCHEMA');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Check if Role column has NOT NULL constraint
    console.log('Checking Role column constraints...');
    const checkConstraint = await pool.request().query(`
      SELECT 
        c.name as column_name,
        c.is_nullable
      FROM 
        sys.columns c
      INNER JOIN 
        sys.tables t ON c.object_id = t.object_id
      WHERE 
        t.name = 'Resources' 
        AND c.name = 'Role'
    `);
    
    if (checkConstraint.recordset.length > 0 && checkConstraint.recordset[0].is_nullable === 0) {
      console.log('Role column currently does not allow NULL values. Updating...');
      
      try {
        // Modify the column to allow NULL values
        await pool.request().query(`
          ALTER TABLE Resources
          ALTER COLUMN Role NVARCHAR(100) NULL
        `);
        console.log('Successfully updated Resources.Role column to allow NULL values');
      } catch (err) {
        console.error('Error updating column:', err.message);
      }
    } else {
      console.log('Role column already allows NULL values or does not exist.');
    }
    
    console.log('======================================================');
    console.log('RESOURCES TABLE FIX COMPLETE');
    console.log('======================================================');
    
    await pool.close();
    
  } catch (err) {
    console.error('Fatal error fixing Resources table:', err);
  }
};

// Run the fix
fixResourcesTable();