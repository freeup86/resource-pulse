/**
 * Full Database Setup Script
 * 
 * This script will set up the entire ResourcePulse database from scratch.
 * It executes all SQL scripts in the correct order to create all tables and seed initial data.
 */

const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

// List of scripts to run in order
const SCRIPTS_TO_EXECUTE = [
  { name: 'setup.sql', description: 'Core tables (Resources, Projects, Skills, Allocations)' },
  { name: 'capacity-tables.sql', description: 'Capacity planning tables' },
  { name: 'notification-tables.sql', description: 'Notification system tables' },
  { name: 'financial-tracking.sql', description: 'Financial tracking tables and views' },
  { name: 'financial-calculations.sql', description: 'Financial calculations stored procedures' }
];

// Add any additional scripts or data seed scripts here if needed

const setupDatabaseFromScratch = async () => {
  try {
    console.log('======================================================');
    console.log('STARTING COMPLETE DATABASE SETUP');
    console.log('======================================================');
    console.log('This will set up the ResourcePulse database from scratch.');
    console.log('Any existing data will be preserved if tables already exist.');
    console.log('------------------------------------------------------');
    
    const pool = await poolPromise;
    
    // Loop through each script and execute it
    for (const script of SCRIPTS_TO_EXECUTE) {
      console.log(`\n[${script.name}] Executing: ${script.description}`);
      
      try {
        // Check if the first table mentioned in the script exists
        if (script.name === 'setup.sql') {
          const checkTable = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
              SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Skills'
            ) THEN 1 ELSE 0 END AS TableExists
          `);
          
          if (checkTable.recordset[0].TableExists === 1) {
            console.log(`  Core tables already exist, skipping ${script.name}`);
            continue;
          }
        } else if (script.name === 'capacity-tables.sql') {
          const checkTable = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
              SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CapacityScenarios'
            ) THEN 1 ELSE 0 END AS TableExists
          `);
          
          if (checkTable.recordset[0].TableExists === 1) {
            console.log(`  Capacity tables already exist, skipping ${script.name}`);
            continue;
          }
        } else if (script.name === 'notification-tables.sql') {
          const checkTable = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
              SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Notifications'
            ) THEN 1 ELSE 0 END AS TableExists
          `);
          
          if (checkTable.recordset[0].TableExists === 1) {
            console.log(`  Notification tables already exist, skipping ${script.name}`);
            continue;
          }
        } else if (script.name === 'financial-tracking.sql') {
          const checkTable = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
              SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectFinancialSnapshots'
            ) THEN 1 ELSE 0 END AS TableExists
          `);
          
          if (checkTable.recordset[0].TableExists === 1) {
            console.log(`  Financial tracking tables already exist, skipping ${script.name}`);
            continue;
          }
        } else if (script.name === 'financial-calculations.sql') {
          const checkProc = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
              SELECT * FROM sys.procedures WHERE name = 'sp_RecalculateProjectFinancials'
            ) THEN 1 ELSE 0 END AS ProcedureExists
          `);
          
          if (checkProc.recordset[0].ProcedureExists === 1) {
            console.log(`  Financial calculations procedures already exist, skipping ${script.name}`);
            continue;
          }
        }
        
        // Read and execute the script
        console.log(`  Creating tables from ${script.name}...`);
        const scriptContent = fs.readFileSync(
          path.join(__dirname, script.name), 
          'utf8'
        );
        
        // Split the script by GO statements (if any)
        const commands = scriptContent.split(/\r?\n\s*GO\s*\r?\n/).filter(cmd => cmd.trim());
        
        // Execute each command
        for (const command of commands) {
          if (command.trim()) {
            await pool.request().query(command);
          }
        }
        
        console.log(`  Successfully executed ${script.name}`);
      } catch (err) {
        console.error(`  Error executing ${script.name}:`, err.message);
        // Continue with next script instead of aborting everything
        console.log(`  Continuing with next script...`);
      }
    }
    
    // Perform any additional setup or fixes
    
    // Make sure IsTemporary column exists in ScenarioAllocations
    try {
      console.log('\n[Fix] Checking ScenarioAllocations.IsTemporary column...');
      
      const checkColumn = await pool.request().query(`
        SELECT CASE WHEN EXISTS (
          SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'ScenarioAllocations' AND COLUMN_NAME = 'IsTemporary'
        ) THEN 1 ELSE 0 END AS ColumnExists
      `);
      
      if (checkColumn.recordset[0].ColumnExists === 0) {
        console.log('  Adding IsTemporary column to ScenarioAllocations table');
        await pool.request().query(`
          ALTER TABLE ScenarioAllocations
          ADD IsTemporary BIT DEFAULT 1
        `);
        console.log('  Successfully added IsTemporary column');
      } else {
        console.log('  IsTemporary column already exists');
      }
    } catch (err) {
      console.error('  Error fixing ScenarioAllocations:', err.message);
    }
    
    // Add sample data if database is empty
    try {
      console.log('\n[Sample Data] Checking if sample data is needed...');
      
      const resourceCount = await pool.request().query(`
        SELECT COUNT(*) as count FROM Resources
      `);
      
      if (resourceCount.recordset[0].count === 0) {
        console.log('  No resources found, would you like to add sample data?');
        console.log('  To add sample data, run: node db/seed-sample-data.js');
      } else {
        console.log(`  Found ${resourceCount.recordset[0].count} resources, skipping sample data`);
      }
    } catch (err) {
      console.error('  Error checking for sample data:', err.message);
    }
    
    console.log('\n======================================================');
    console.log('DATABASE SETUP COMPLETE');
    console.log('======================================================');
    console.log('The ResourcePulse database has been successfully set up.');
    console.log('You can now start using the application.');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error setting up database:', err);
    process.exit(1);
  }
};

// Run the setup
setupDatabaseFromScratch();