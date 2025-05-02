const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

const setupDatabase = async () => {
  try {
    const pool = await poolPromise;
    
    // Check if database is already set up
    const checkTable = await pool.request().query(`
      SELECT CASE WHEN EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Skills'
      ) THEN 1 ELSE 0 END AS TableExists
    `);
    
    const tableExists = checkTable.recordset[0].TableExists === 1;
    
    if (tableExists) {
      console.log('Main database tables already exist, skipping setup.sql');
    } else {
      // Read and execute the main setup file
      console.log('Setting up main database tables...');
      const setupScript = fs.readFileSync(
        path.join(__dirname, 'setup.sql'), 
        'utf8'
      );
      
      // Split the script by GO statements (if any)
      const commands = setupScript.split(/\r?\n\s*GO\s*\r?\n/).filter(cmd => cmd.trim());
      
      // Execute each command
      for (const command of commands) {
        if (command.trim()) {
          await pool.request().query(command);
        }
      }
    }
    
    // Check if capacity tables exist
    const checkCapacityTable = await pool.request().query(`
      SELECT CASE WHEN EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CapacityScenarios'
      ) THEN 1 ELSE 0 END AS TableExists
    `);
    
    const capacityTablesExist = checkCapacityTable.recordset[0].TableExists === 1;
    
    if (capacityTablesExist) {
      console.log('Capacity planning tables already exist, skipping capacity-tables.sql');
    } else {
      // Read and execute the capacity tables script
      console.log('Setting up capacity planning tables...');
      const capacityScript = fs.readFileSync(
        path.join(__dirname, 'capacity-tables.sql'), 
        'utf8'
      );
      
      // Split the script by GO statements (if any)
      const capacityCommands = capacityScript.split(/\r?\n\s*GO\s*\r?\n/).filter(cmd => cmd.trim());
      
      // Execute each command
      for (const command of capacityCommands) {
        if (command.trim()) {
          await pool.request().query(command);
        }
      }
    }
    
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
    
    console.log('Database setup completed successfully');
    
    // Close the pool
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
};

setupDatabase();