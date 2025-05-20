/**
 * Script to create and update Skills Gap tables
 * This will create the tables needed for the skills gap feature to work
 */
const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require('./config');

async function readSQL(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf8');
}

async function executeSQLBatch(sqlContent) {
  const pool = await poolPromise;
  const batches = sqlContent.split('GO');
  
  for (const batch of batches) {
    const trimmedBatch = batch.trim();
    if (trimmedBatch) {
      try {
        await pool.request().query(trimmedBatch);
        console.log(`Successfully executed SQL batch with ${trimmedBatch.length} characters`);
      } catch (error) {
        console.error(`Error executing SQL batch: ${error.message}`);
        console.log('SQL batch that failed:', trimmedBatch);
      }
    }
  }
}

async function setupTables() {
  try {
    console.log('Setting up Skills Gap tables...');
    
    // Apply skills-gap-tables.sql
    console.log('Applying skills-gap-tables.sql...');
    const skillsGapSQL = await readSQL('skills-gap-tables.sql');
    await executeSQLBatch(skillsGapSQL);
    
    console.log('Tables setup completed successfully!');
  } catch (error) {
    console.error('Error setting up tables:', error);
  } finally {
    // Close the SQL connection
    try {
      const pool = await poolPromise;
      await pool.close();
      console.log('SQL connection closed');
    } catch (closeError) {
      console.error('Error closing SQL connection:', closeError);
    }
  }
}

// Execute the setup
setupTables();