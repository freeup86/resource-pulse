const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

const fixDatabase = async () => {
  try {
    console.log('Starting database fixes...');
    
    const pool = await poolPromise;
    
    // Check if notification tables exist
    const checkNotificationTable = await pool.request().query(`
      SELECT CASE WHEN EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Notifications'
      ) THEN 1 ELSE 0 END AS TableExists
    `);
    
    const notificationTablesExist = checkNotificationTable.recordset[0].TableExists === 1;
    
    if (notificationTablesExist) {
      console.log('Notification system tables already exist, skipping notification-tables.sql');
    } else {
      // Read and execute the notification tables script
      console.log('Setting up notification system tables...');
      const notificationScript = fs.readFileSync(
        path.join(__dirname, 'notification-tables.sql'), 
        'utf8'
      );
      
      // Split the script by GO statements (if any)
      const notificationCommands = notificationScript.split(/\r?\n\s*GO\s*\r?\n/).filter(cmd => cmd.trim());
      
      // Execute each command
      for (const command of notificationCommands) {
        if (command.trim()) {
          await pool.request().query(command);
        }
      }
    }
    
    // Check and fix capacity tables
    console.log('Checking and fixing capacity tables...');
    
    const fixScript = fs.readFileSync(
      path.join(__dirname, 'fix-capacity-tables.sql'), 
      'utf8'
    );
    
    await pool.request().query(fixScript);
    
    console.log('All database fixes completed successfully');
    
    // Close the pool
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database:', err);
    process.exit(1);
  }
};

fixDatabase();