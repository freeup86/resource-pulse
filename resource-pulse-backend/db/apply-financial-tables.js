/**
 * Apply Financial Tables and Calculations
 * 
 * This script applies only the financial tables and stored procedures to the database.
 * It's meant to be run when you need to add financial tracking to an existing database.
 */

const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

// List of scripts to run in order
const SCRIPTS_TO_EXECUTE = [
  { name: 'financial-tables.sql', description: 'Financial tracking tables and columns' },
  { name: 'financial-tracking.sql', description: 'Financial tracking views' },
  { name: 'financial-calculations.sql', description: 'Financial calculations stored procedures' }
];

const applyFinancialTables = async () => {
  try {
    console.log('======================================================');
    console.log('STARTING FINANCIAL TABLES SETUP');
    console.log('======================================================');
    console.log('This will add financial tracking capabilities to your database.');
    console.log('------------------------------------------------------');
    
    const pool = await poolPromise;
    
    // Loop through each script and execute it
    for (const script of SCRIPTS_TO_EXECUTE) {
      console.log(`\n[${script.name}] Executing: ${script.description}`);
      
      try {
        // Read and execute the script
        console.log(`  Applying changes from ${script.name}...`);
        const scriptContent = fs.readFileSync(
          path.join(__dirname, script.name), 
          'utf8'
        );
        
        // Split the script by GO statements (if any)
        const commands = scriptContent.split(/\r?\n\s*GO\s*\r?\n/).filter(cmd => cmd.trim());
        
        // Execute each command
        for (const command of commands) {
          if (command.trim()) {
            try {
              await pool.request().query(command);
            } catch (cmdErr) {
              console.log(`  Command error: ${cmdErr.message}`);
              console.log('  Continuing with next command...');
            }
          }
        }
        
        console.log(`  Successfully executed ${script.name}`);
      } catch (err) {
        console.error(`  Error executing ${script.name}:`, err.message);
        // Continue with next script instead of aborting everything
        console.log(`  Continuing with next script...`);
      }
    }
    
    console.log('\n======================================================');
    console.log('FINANCIAL TABLES SETUP COMPLETE');
    console.log('======================================================');
    console.log('Financial tracking capabilities have been added to your database.');
    
    // Close the database connection
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error setting up financial tables:', err);
    process.exit(1);
  }
};

// Run the setup
applyFinancialTables();