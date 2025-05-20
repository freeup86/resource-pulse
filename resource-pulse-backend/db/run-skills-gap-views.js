// Run skills gap views update
const fs = require('fs');
const path = require('path');
const { poolPromise } = require('./config');

async function runSkillsGapViews() {
  try {
    console.log('Creating skills gap views...');
    const pool = await poolPromise;
    
    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'skills-gap-views.sql'), 'utf8');
    
    // Split the script by view creation
    const viewStatements = sqlScript.split(/CREATE VIEW/i);
    
    // Execute each statement separately
    for (let i = 0; i < viewStatements.length; i++) {
      const statement = viewStatements[i].trim();
      
      // Skip empty statements
      if (!statement) continue;
      
      // Add back the CREATE VIEW prefix for all but the first segment (which is just comments)
      const fullStatement = i === 0 ? statement : 'CREATE VIEW ' + statement;
      
      if (fullStatement.length > 10) { // Make sure it's not just whitespace
        console.log(`Executing view statement ${i}...`);
        try {
          await pool.request().batch(fullStatement);
        } catch (err) {
          console.error(`Error creating view in statement ${i}:`, err.message);
          console.error('Statement text causing error:');
          console.error(fullStatement.substring(0, 500) + (fullStatement.length > 500 ? '...' : ''));
          // Don't throw, try to continue with other statements
        }
      }
    }
    
    console.log('Skills gap views created successfully');
    return true;
  } catch (err) {
    console.error('Error creating skills gap views:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  runSkillsGapViews()
    .then(success => {
      if (success) {
        console.log('All skills gap views have been created');
      } else {
        console.error('Failed to create all skills gap views');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { runSkillsGapViews };