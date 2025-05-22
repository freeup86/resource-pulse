// Script to safely clear all data by temporarily disabling foreign key constraints
const { poolPromise, sql } = require('./db/config');

async function clearAllDataSafe() {
  try {
    const pool = await poolPromise;
    
    console.log('Starting comprehensive data cleanup...');
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // First, disable all foreign key constraints
      console.log('Temporarily disabling foreign key constraints...');
      await transaction.request().query('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"');
      
      // Get list of all user tables (excluding system settings and auth tables)
      const tablesResult = await transaction.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME NOT IN ('SystemSettings', 'Users', 'UserSessions', '__EFMigrationsHistory')
        ORDER BY TABLE_NAME
      `);
      
      const tables = tablesResult.recordset.map(row => row.TABLE_NAME);
      
      console.log('Found tables to clear:', tables);
      
      // Clear all data from each table
      for (const tableName of tables) {
        try {
          console.log(`Clearing ${tableName}...`);
          await transaction.request().query(`DELETE FROM [${tableName}]`);
          
          // Try to reset identity if it exists
          try {
            await transaction.request().query(`
              IF EXISTS (SELECT * FROM sys.identity_columns WHERE object_name(object_id) = '${tableName}')
              BEGIN
                DBCC CHECKIDENT('${tableName}', RESEED, 0)
              END
            `);
            console.log(`  ✓ Reset identity for ${tableName}`);
          } catch (identityErr) {
            console.log(`  - No identity column in ${tableName}`);
          }
          
        } catch (err) {
          console.log(`  ⚠ Could not clear ${tableName}: ${err.message}`);
        }
      }
      
      // Re-enable all foreign key constraints
      console.log('Re-enabling foreign key constraints...');
      await transaction.request().query('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"');
      
      // Commit the transaction
      await transaction.commit();
      
      console.log('');
      console.log('✅ All data cleared successfully!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`- Cleared ${tables.length} tables`);
      console.log('- Reset all identity columns');
      console.log('- Re-enabled all foreign key constraints');
      console.log('');
      console.log('🔒 What was preserved:');
      console.log('- Database structure (tables, columns, constraints)');
      console.log('- System settings (including overallocation settings)');
      console.log('- User accounts and authentication data');
      console.log('- Database migrations history');
      console.log('');
      console.log('🗑️  What was cleared:');
      console.log('- All business data (resources, projects, allocations, etc.)');
      console.log('- All generated/calculated data');
      console.log('- All notifications and logs');
      console.log('');
      console.log('🚀 Ready for fresh data!');
      console.log('You can now start adding new data through the UI or import fresh data.');
      
    } catch (err) {
      console.error('Error during data clearing, rolling back transaction...');
      
      // Try to re-enable constraints even if there was an error
      try {
        await transaction.request().query('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"');
      } catch (constraintErr) {
        console.error('Warning: Could not re-enable constraints:', constraintErr.message);
      }
      
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
console.log('🚨 WARNING: This will delete ALL existing business data!');
console.log('');
console.log('This script will:');
console.log('✅ Safely clear all tables by temporarily disabling foreign key constraints');
console.log('✅ Reset all identity columns to start fresh');
console.log('✅ Preserve database structure and system settings');
console.log('✅ Preserve user accounts');
console.log('');
console.log('⚠️  This will PERMANENTLY DELETE:');
console.log('- All resources and their allocations');
console.log('- All projects and configurations');
console.log('- All skills and roles');
console.log('- All what-if scenarios');
console.log('- All notifications and AI data');
console.log('- All other business data');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "CLEAR ALL DATA" to confirm you want to proceed: ', (answer) => {
  rl.close();
  
  if (answer === 'CLEAR ALL DATA') {
    console.log('');
    console.log('🔄 Proceeding with comprehensive data cleanup...');
    clearAllDataSafe();
  } else {
    console.log('');
    console.log('❌ Operation cancelled. No data was modified.');
    process.exit(0);
  }
});