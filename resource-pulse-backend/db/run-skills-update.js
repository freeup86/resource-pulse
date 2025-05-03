const fs = require('fs');
const sql = require('mssql');

// Database config
const config = {
  server: 'cortez-sqlserver.database.windows.net',
  database: 'ResourcePulse',
  user: 'sysadmin',
  password: 'Dc0wboy$',
  options: {
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

async function runScript() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('Connected successfully');
    
    // Read and execute the first script
    console.log('Running tables and columns script...');
    const tablesScript = fs.readFileSync('skills-enhancement-fixed.sql', 'utf8');
    await pool.request().query(tablesScript);
    console.log('Tables and columns created successfully');
    
    // Read and execute the view script
    console.log('Running view creation script...');
    try {
      const viewScript = fs.readFileSync('setup-skills-view.sql', 'utf8');
      await pool.request().query(viewScript);
      console.log('View created successfully');
    } catch (viewErr) {
      console.error('Error creating view:', viewErr.message);
      console.log('Continuing with server setup...');
    }
    
    console.log('Database update completed');
    process.exit(0);
  } catch (err) {
    console.error('Error updating database:', err);
    process.exit(1);
  }
}

runScript();