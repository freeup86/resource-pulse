/**
 * Client Satisfaction Data Setup Script
 * 
 * This script sets up the client satisfaction tables and seeds them with realistic data.
 * It runs the SQL script first and then seeds the data.
 */

const { poolPromise, sql } = require('./config');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const runSqlScript = async (pool, scriptPath) => {
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Split the script by GO statements (T-SQL batch separator)
  const batches = scriptContent.split(/^\s*GO\s*$/gim);
  
  for (const batch of batches) {
    if (batch.trim()) {
      await pool.request().query(batch);
    }
  }
  
  console.log(`SQL script ${path.basename(scriptPath)} executed successfully.`);
};

const setupSatisfactionData = async () => {
  try {
    console.log('======================================================');
    console.log('SETTING UP CLIENT SATISFACTION DATA');
    console.log('======================================================');
    
    const pool = await poolPromise;
    
    // Run the SQL script to create tables
    const sqlScriptPath = path.join(__dirname, 'client-satisfaction-tables.sql');
    console.log(`Executing SQL script: ${sqlScriptPath}`);
    
    await runSqlScript(pool, sqlScriptPath);
    
    console.log('Tables set up successfully.');
    console.log('\nNow running data seeding script...');
    
    // Close the pool before running the seed script
    await pool.close();
    
    // Run the seeding script as a separate process
    const seedScriptPath = path.join(__dirname, 'seed-satisfaction-data.js');
    const childProcess = exec(`node "${seedScriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing seed script: ${error.message}`);
        process.exit(1);
      }
      
      if (stderr) {
        console.error(`Seed script stderr: ${stderr}`);
      }
      
      console.log(stdout);
      console.log('\nClient satisfaction data setup complete.');
      process.exit(0);
    });
    
    // Pipe the child process stdout/stderr to the parent
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
    
  } catch (err) {
    console.error('Error setting up client satisfaction data:', err);
    process.exit(1);
  }
};

// Run the setup script
setupSatisfactionData();