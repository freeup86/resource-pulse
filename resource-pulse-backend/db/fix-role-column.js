/**
 * Fix Role Column in Resources Table
 * 
 * This script explicitly alters the Role column to allow NULL values.
 */

const { poolPromise, sql } = require('./config');

const fixRoleColumn = async () => {
  try {
    console.log('======================================================');
    console.log('FIXING ROLE COLUMN IN RESOURCES TABLE');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    console.log('Altering Role column to allow NULL values...');
    
    try {
      // Directly attempt to alter the column constraint
      await pool.request().query(`
        ALTER TABLE Resources ALTER COLUMN Role NVARCHAR(100) NULL
      `);
      console.log('Successfully updated Role column to allow NULL values');
    } catch (err) {
      console.error('Error altering column:', err.message);
    }
    
    // Verify the column was updated
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
    
    if (checkConstraint.recordset.length > 0) {
      if (checkConstraint.recordset[0].is_nullable === 1) {
        console.log('Verified: Role column now allows NULL values');
      } else {
        console.log('Warning: Role column still does not allow NULL values');
      }
    }
    
    console.log('======================================================');
    console.log('ROLE COLUMN FIX COMPLETE');
    console.log('======================================================');
    
    await pool.close();
    
  } catch (err) {
    console.error('Fatal error fixing Role column:', err);
  }
};

// Run the fix
fixRoleColumn();