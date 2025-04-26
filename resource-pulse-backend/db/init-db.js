const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');

const setupDatabase = async () => {
  try {
    const pool = await poolPromise;
    
    // Read the SQL setup file
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