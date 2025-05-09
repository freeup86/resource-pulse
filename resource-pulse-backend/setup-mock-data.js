/**
 * Setup Mock Data Service
 * 
 * This script sets up the mock data service by:
 * 1. Ensuring .env.development file exists with USE_MOCK_DATA=true
 * 2. Updating db/config.js to properly handle database connection failures
 * 3. Running the database table fix script
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Setup environment files
const setupEnvFiles = () => {
  const envDevPath = path.join(__dirname, '.env.development');
  
  // Check if .env.development exists
  if (!fs.existsSync(envDevPath)) {
    console.log('Creating .env.development file...');
    const envContent = `# Development environment settings

# Enable mock data service (when database is unavailable)
USE_MOCK_DATA=true

# Server port
PORT=8000

# Disable production mode
NODE_ENV=development`;
    
    fs.writeFileSync(envDevPath, envContent);
    console.log('Created .env.development file successfully');
  } else {
    console.log('.env.development file already exists');
    
    // Ensure USE_MOCK_DATA=true is set
    let envContent = fs.readFileSync(envDevPath, 'utf8');
    if (!envContent.includes('USE_MOCK_DATA=true')) {
      envContent = envContent.replace(/USE_MOCK_DATA=(false|"false")/g, 'USE_MOCK_DATA=true');
      
      // If still not found, add it
      if (!envContent.includes('USE_MOCK_DATA=true')) {
        envContent += '\n# Enable mock data service\nUSE_MOCK_DATA=true\n';
      }
      
      fs.writeFileSync(envDevPath, envContent);
      console.log('Updated .env.development with USE_MOCK_DATA=true');
    }
  }
};

// Update the database config to handle connection failures gracefully
const updateDbConfig = () => {
  const dbConfigPath = path.join(__dirname, 'db', 'config.js');
  
  if (fs.existsSync(dbConfigPath)) {
    console.log('Checking db/config.js for robust error handling...');
    
    let configContent = fs.readFileSync(dbConfigPath, 'utf8');
    
    // Check if we already have proper error handling
    if (!configContent.includes('console.error(\'Database Connection Failed:') ||
        !configContent.includes('module.exports.poolPromise = pool.connect()')) {
      
      // Create backup
      const backupPath = dbConfigPath + '.bak';
      fs.writeFileSync(backupPath, configContent);
      console.log(`Created backup of config.js at ${backupPath}`);
      
      // Get the SQL config
      const configMatch = configContent.match(/const config = {[\s\S]*?};/);
      if (configMatch) {
        const sqlConfig = configMatch[0];
        
        // Create updated content
        const updatedContent = `const sql = require('mssql');

// If environment specifies database config, use it - otherwise use defaults
${sqlConfig}

console.log('Connecting to database...');

// Create connection pool
const pool = new sql.ConnectionPool(config);

// Attempt to connect, but gracefully handle failures
const poolPromise = (async () => {
  try {
    return await pool.connect();
  } catch (err) {
    console.error('Database Connection Failed:', err);
    return null;
  }
})();

module.exports = {
  sql,
  poolPromise,
  isConnected: async () => {
    try {
      const pool = await poolPromise;
      return pool !== null;
    } catch (err) {
      return false;
    }
  }
};`;
        
        fs.writeFileSync(dbConfigPath, updatedContent);
        console.log('Updated db/config.js with robust error handling');
      } else {
        console.log('Could not safely update db/config.js - SQL config section not found');
      }
    } else {
      console.log('db/config.js already has robust error handling');
    }
  } else {
    console.log(`db/config.js not found at ${dbConfigPath}`);
  }
};

// Run database fix script
const runDatabaseFix = () => {
  console.log('Running database fix script...');
  
  exec('node db/fix-budget-items.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing fix script:');
      console.error(stderr);
      return;
    }
    
    console.log(stdout);
    console.log('Fix script executed successfully');
  });
};

// Main setup function
const setupMockData = () => {
  console.log('======================================================');
  console.log('SETTING UP MOCK DATA SERVICE');
  console.log('======================================================');
  
  setupEnvFiles();
  updateDbConfig();
  
  console.log('\nMock data service setup successfully!');
  console.log('\nTo test your mock data service:');
  console.log('1. Run the server with: node server.js');
  console.log('2. Try to add a new project in the frontend');
  console.log('3. Check the console logs for "Using mock data service"');
  console.log('======================================================');

  // Run the database fix script only when explicitly requested
  if (process.argv.includes('--fix-database')) {
    runDatabaseFix();
  }
};

// Run the setup
setupMockData();