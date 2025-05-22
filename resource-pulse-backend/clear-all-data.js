// Script to clear all existing data while preserving database structure and system settings
const { poolPromise, sql } = require('./db/config');

async function clearAllData() {
  try {
    const pool = await poolPromise;
    
    console.log('Starting data cleanup...');
    
    // Start a transaction to ensure all operations complete successfully
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Clear data in dependency order (children first, then parents)
      
      console.log('Clearing scenario allocations...');
      await transaction.request().query('DELETE FROM ScenarioAllocations WHERE 1=1');
      
      console.log('Clearing allocations...');
      await transaction.request().query('DELETE FROM Allocations');
      
      console.log('Clearing resource skills...');
      await transaction.request().query('DELETE FROM ResourceSkills');
      
      console.log('Clearing project skills...');
      await transaction.request().query('DELETE FROM ProjectSkills');
      
      console.log('Clearing project roles...');
      await transaction.request().query('DELETE FROM ProjectRoles');
      
      console.log('Clearing resources...');
      await transaction.request().query('DELETE FROM Resources');
      
      console.log('Clearing projects...');
      await transaction.request().query('DELETE FROM Projects');
      
      console.log('Clearing skills...');
      await transaction.request().query('DELETE FROM Skills');
      
      console.log('Clearing roles...');
      await transaction.request().query('DELETE FROM Roles');
      
      // Clear other data tables but preserve system settings and auth
      console.log('Clearing notifications...');
      await transaction.request().query('DELETE FROM Notifications');
      
      console.log('Clearing what-if scenarios...');
      await transaction.request().query('DELETE FROM WhatIfScenarios WHERE 1=1');
      
      console.log('Clearing what-if allocations...');
      await transaction.request().query('DELETE FROM WhatIfAllocations WHERE 1=1');
      
      console.log('Clearing client satisfaction data...');
      await transaction.request().query('DELETE FROM ClientSatisfactionPredictions WHERE 1=1');
      
      console.log('Clearing AI recommendations...');
      await transaction.request().query('DELETE FROM AIRecommendations WHERE 1=1');
      
      // Reset identity columns if they exist
      console.log('Resetting identity columns...');
      
      // Check if tables have identity columns and reset them
      const tables = [
        'Resources', 'Projects', 'Skills', 'Roles', 'Allocations', 
        'Notifications', 'WhatIfScenarios', 'WhatIfAllocations', 'ScenarioAllocations',
        'ClientSatisfactionPredictions', 'AIRecommendations'
      ];
      
      for (const table of tables) {
        try {
          await transaction.request().query(`
            IF EXISTS (SELECT * FROM sys.identity_columns WHERE object_name(object_id) = '${table}')
            BEGIN
              DBCC CHECKIDENT('${table}', RESEED, 0)
            END
          `);
        } catch (err) {
          console.log(`Note: Could not reset identity for ${table} (table may not exist or have identity): ${err.message}`);
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log('✅ All data cleared successfully!');
      console.log('');
      console.log('What was preserved:');
      console.log('- Database structure (tables, columns, constraints)');
      console.log('- System settings (including your overallocation settings)');
      console.log('- User accounts and authentication data');
      console.log('');
      console.log('What was cleared:');
      console.log('- All resources and their allocations');
      console.log('- All projects and their configurations');
      console.log('- All skills and roles');
      console.log('- All notifications');
      console.log('- All what-if scenarios');
      console.log('- All AI recommendations and predictions');
      console.log('');
      console.log('You can now start adding fresh data through the UI or import new data.');
      
    } catch (err) {
      console.error('Error during data clearing, rolling back transaction...');
      await transaction.rollback();
      throw err;
    }
    
  } catch (error) {
    console.error('Failed to clear data:', error);
    console.error('Database structure and existing data remain unchanged.');
  } finally {
    process.exit(0);
  }
}

// Confirm before running
console.log('⚠️  WARNING: This will delete ALL existing data!');
console.log('');
console.log('This script will clear:');
console.log('- All resources and allocations');
console.log('- All projects');
console.log('- All skills and roles');
console.log('- All notifications');
console.log('- All what-if scenarios');
console.log('- All AI recommendations');
console.log('');
console.log('This will NOT affect:');
console.log('- Database structure');
console.log('- System settings');
console.log('- User accounts');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', (answer) => {
  rl.close();
  
  if (answer === 'YES') {
    console.log('Proceeding with data cleanup...');
    clearAllData();
  } else {
    console.log('Operation cancelled.');
    process.exit(0);
  }
});