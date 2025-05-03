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

// Function to execute SQL script
async function executeScript() {
  try {
    // Create connection pool
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to database successfully');
    
    // Read the SQL script file
    const scriptContent = fs.readFileSync('skills-enhancement.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = scriptContent
      .replace(/GO/g, '')  // Remove GO statements if present
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.request().query(statement);
        console.log('Successfully executed statement');
      } catch (err) {
        console.error('Error executing SQL statement:', err);
        console.error('Statement that failed:', statement);
      }
    }
    
    console.log('Database schema update completed');
    
    // Close the connection
    await pool.close();
    console.log('Connection closed');
    
  } catch (err) {
    console.error('Database operation failed:', err);
  }
}

// Run the function
executeScript();