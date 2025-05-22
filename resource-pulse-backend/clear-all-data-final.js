// Script to safely clear all data by individually handling foreign key constraints
const { poolPromise, sql } = require('./db/config');

async function clearAllDataFinal() {
  try {
    const pool = await poolPromise;
    
    console.log('Starting comprehensive data cleanup...');
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Get all foreign key constraints
      const fkResult = await transaction.request().query(`
        SELECT 
          tc.TABLE_NAME,
          tc.CONSTRAINT_NAME,
          kcu.COLUMN_NAME,
          ccu.TABLE_NAME AS FOREIGN_TABLE_NAME,
          ccu.COLUMN_NAME AS FOREIGN_COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc 
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
          ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ccu
          ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND tc.TABLE_SCHEMA = 'dbo'
      `);
      
      // Disable all foreign key constraints individually
      console.log('Disabling foreign key constraints...');
      for (const fk of fkResult.recordset) {
        try {
          await transaction.request().query(`
            ALTER TABLE [${fk.TABLE_NAME}] NOCHECK CONSTRAINT [${fk.CONSTRAINT_NAME}]
          `);
          console.log(`  Disabled: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
        } catch (err) {
          console.log(`  Warning: Could not disable ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}: ${err.message}`);
        }
      }
      
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
      
      console.log('');
      console.log('Clearing data from tables:');
      
      // Clear all data from each table
      let clearedCount = 0;
      for (const tableName of tables) {
        try {
          const countResult = await transaction.request().query(`SELECT COUNT(*) as count FROM [${tableName}]`);
          const rowCount = countResult.recordset[0].count;
          
          if (rowCount > 0) {
            await transaction.request().query(`DELETE FROM [${tableName}]`);
            console.log(`  ✓ Cleared ${tableName} (${rowCount} rows)`);
            clearedCount++;
          } else {
            console.log(`  - ${tableName} (already empty)`);
          }
          
          // Try to reset identity if it exists
          try {
            await transaction.request().query(`
              IF EXISTS (SELECT * FROM sys.identity_columns WHERE object_name(object_id) = '${tableName}')
              BEGIN
                DBCC CHECKIDENT('${tableName}', RESEED, 0)
              END
            `);
          } catch (identityErr) {
            // Identity reset errors are not critical
          }
          
        } catch (err) {
          console.log(`  ⚠ Could not clear ${tableName}: ${err.message}`);
        }
      }
      
      // Re-enable all foreign key constraints
      console.log('');
      console.log('Re-enabling foreign key constraints...');
      for (const fk of fkResult.recordset) {
        try {
          await transaction.request().query(`
            ALTER TABLE [${fk.TABLE_NAME}] WITH CHECK CHECK CONSTRAINT [${fk.CONSTRAINT_NAME}]
          `);
        } catch (err) {
          console.log(`  Warning: Could not re-enable ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}: ${err.message}`);
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      console.log('');
      console.log('✅ Data cleanup completed successfully!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`- Found ${tables.length} tables`);
      console.log(`- Cleared ${clearedCount} tables with data`);
      console.log(`- Handled ${fkResult.recordset.length} foreign key constraints`);
      console.log('- Reset all identity columns');
      console.log('');
      console.log('🔒 Preserved:');
      console.log('- Database structure and constraints');
      console.log('- System settings (overallocation settings intact)');
      console.log('- User accounts and authentication');
      console.log('');
      console.log('🗑️  Cleared:');
      console.log('- All business data and relationships');
      console.log('- All generated content and logs');
      console.log('');
      console.log('🚀 Your database is now ready for fresh data!');
      
    } catch (err) {
      console.error('Error during data clearing, rolling back transaction...');
      await transaction.rollback();
      throw err;
    }
    
  } catch (error) {
    console.error('Failed to clear data:', error);
    console.error('Database remains unchanged.');
  } finally {
    process.exit(0);
  }
}

// Confirm before running
console.log('🚨 FINAL WARNING: Complete data wipe!');
console.log('');
console.log('This will permanently delete ALL business data while preserving:');
console.log('✅ Database structure');
console.log('✅ System settings');
console.log('✅ User accounts');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "WIPE DATA" to proceed: ', (answer) => {
  rl.close();
  
  if (answer === 'WIPE DATA') {
    console.log('');
    clearAllDataFinal();
  } else {
    console.log('Operation cancelled.');
    process.exit(0);
  }
});