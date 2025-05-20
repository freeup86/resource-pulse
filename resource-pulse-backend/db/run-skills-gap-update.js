// Run skills gap tables update
const fs = require('fs');
const path = require('path');
const { poolPromise } = require('./config');

async function runSkillsGapUpdate() {
  try {
    console.log('Running skills gap schema update...');
    const pool = await poolPromise;
    
    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'skills-gap-tables-mssql.sql'), 'utf8');
    
    // Split the script by GO statements (SQL Server batch separator)
    const batches = sqlScript.split(/\bGO\b/);
    
    // Execute each batch separately
    for (let i = 0; i < batches.length; i++) {
      const batchText = batches[i].trim();
      if (batchText) {
        console.log(`Executing batch ${i+1} of ${batches.length}...`);
        try {
          await pool.request().batch(batchText);
        } catch (batchErr) {
          console.error(`Error in batch ${i+1}:`, batchErr.message);
          console.error('Batch text causing error:');
          console.error(batchText.substring(0, 500) + (batchText.length > 500 ? '...' : ''));
          throw batchErr;
        }
      }
    }
    
    console.log('Skills gap schema update completed successfully');
    return true;
  } catch (err) {
    console.error('Error running skills gap schema update:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  runSkillsGapUpdate()
    .then(success => {
      if (success) {
        console.log('Skills gap tables have been created and populated');
      } else {
        console.error('Failed to create skills gap tables');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { runSkillsGapUpdate };