// Run schema update to add ProficiencyLevel column
const fs = require('fs');
const path = require('path');
const { poolPromise } = require('./config');

async function runSchemaUpdate() {
  try {
    console.log('Running schema update to add ProficiencyLevel column...');
    const pool = await poolPromise;
    
    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add-proficiency-level.sql'), 'utf8');
    
    // Execute the SQL script
    const result = await pool.request().batch(sqlScript);
    
    console.log('Schema update completed successfully');
    return true;
  } catch (err) {
    console.error('Error running schema update:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  runSchemaUpdate()
    .then(success => {
      if (success) {
        console.log('Schema update completed');
      } else {
        console.error('Failed to update schema');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { runSchemaUpdate };