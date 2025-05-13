const { poolPromise, sql } = require('./config');

/**
 * Script to add ProjectNumber and ProjectOwner fields to the Projects table
 */
async function addProjectFields() {
  try {
    const pool = await poolPromise;
    console.log('Connected to SQL Server');

    // Check if ProjectNumber column exists
    const projectNumberResult = await pool.request().query(`
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Projects') 
      AND name = 'ProjectNumber'
    `);

    // Check if ProjectOwner column exists
    const projectOwnerResult = await pool.request().query(`
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Projects') 
      AND name = 'ProjectOwner'
    `);

    // Add ProjectNumber column if it doesn't exist
    if (projectNumberResult.recordset.length === 0) {
      console.log('Adding ProjectNumber column to Projects table');
      await pool.request().query(`
        ALTER TABLE Projects
        ADD ProjectNumber NVARCHAR(50) NULL;
      `);
      console.log('ProjectNumber column added successfully');
    } else {
      console.log('ProjectNumber column already exists');
    }

    // Add ProjectOwner column if it doesn't exist
    if (projectOwnerResult.recordset.length === 0) {
      console.log('Adding ProjectOwner column to Projects table');
      await pool.request().query(`
        ALTER TABLE Projects
        ADD ProjectOwner NVARCHAR(200) NULL;
      `);
      console.log('ProjectOwner column added successfully');
    } else {
      console.log('ProjectOwner column already exists');
    }

    console.log('Database migration completed successfully');
  } catch (err) {
    console.error('Error during database migration:', err);
  }
}

// Run the migration
addProjectFields()
  .then(() => {
    console.log('Migration script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration script execution failed:', err);
    process.exit(1);
  });