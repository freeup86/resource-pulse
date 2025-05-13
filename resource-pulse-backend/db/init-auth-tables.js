// Initialize authentication tables
const fs = require('fs');
const path = require('path');
const { poolPromise, sql } = require('./config');
const bcrypt = require('bcrypt');

async function initAuthTables() {
  try {
    console.log('Initializing authentication tables...');
    const pool = await poolPromise;

    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'auth-tables.sql'), 'utf8');

    // Split the script by GO statements if present
    const sqlBatches = sqlScript.split(/^\s*GO\s*$/m);

    // Also extract individual CREATE TABLE statements to execute them separately if needed
    const createTableRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([^\s(]+)\s*\(([\s\S]*?)\);/g;
    let createStatements = [];

    for (const batch of sqlBatches) {
      if (batch.trim()) {
        // Extract CREATE TABLE statements from each batch
        let match;
        while ((match = createTableRegex.exec(batch)) !== null) {
          const tableName = match[1];
          const createStatement = match[0];
          createStatements.push({ tableName, sql: createStatement });
        }
      }
    }

    // First try to execute each batch as a whole
    let hasError = false;
    for (const batch of sqlBatches) {
      if (batch.trim()) {
        try {
          await pool.request().batch(batch);
        } catch (err) {
          console.error(`Error executing SQL batch: ${err.message}`);
          console.error('SQL batch:', batch);
          hasError = true;
          // Continue trying other batches instead of throwing
        }
      }
    }

    // If there were errors, try executing individual CREATE TABLE statements
    if (hasError && createStatements.length > 0) {
      console.log('Attempting to create tables individually...');
      for (const statement of createStatements) {
        try {
          console.log(`Creating table ${statement.tableName} individually...`);
          await pool.request().query(statement.sql);
        } catch (err) {
          console.error(`Error creating table ${statement.tableName}: ${err.message}`);
          // Continue with other tables
        }
      }
    }

    if (hasError) {
      console.warn('Some errors occurred during authentication tables initialization, but will continue with available tables.');
    }

    // Check if admin user needs password update
    // If you're using the default password from the SQL script, this will update it
    if (process.env.DEFAULT_ADMIN_PASSWORD) {
      try {
        // First check if Users table exists
        const tablesResult = await pool.request()
          .query(`SELECT OBJECT_ID('Users', 'U') AS TableExists`);

        if (tablesResult.recordset[0].TableExists) {
          // Check if admin user exists
          const userResult = await pool.request()
            .query(`SELECT COUNT(*) AS AdminExists FROM Users WHERE Username = 'admin'`);

          if (userResult.recordset[0].AdminExists > 0) {
            const passwordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
            await pool.request()
              .input('passwordHash', sql.NVarChar, passwordHash)
              .query('UPDATE Users SET PasswordHash = @passwordHash WHERE Username = \'admin\'');
            console.log('Admin password updated with value from environment variable');
          } else {
            console.log('Admin user does not exist yet, skipping password update');
          }
        } else {
          console.log('Users table does not exist yet, skipping admin password update');
        }
      } catch (passwordError) {
        console.error('Error updating admin password:', passwordError.message);
      }
    }

    console.log('Authentication tables initialized successfully');
    return true;
  } catch (err) {
    console.error('Error initializing authentication tables:', err.message);
    return false;
  }
}

// Execute if this script is run directly
if (require.main === module) {
  initAuthTables()
    .then(success => {
      if (success) {
        console.log('Auth tables setup completed successfully');
      } else {
        console.error('Failed to set up auth tables');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { initAuthTables };