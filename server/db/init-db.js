// Database initialization script
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const config = require('../config/database');

async function initializeDatabase() {
  try {
    // Connect to the SQL Server
    await sql.connect(config);
    console.log('Connected to SQL Server');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .filter(statement => statement.trim() !== '');

    // Execute each statement
    for (const statement of statements) {
      await sql.query(statement);
    }

    console.log('Database schema initialized successfully');

    // Create an admin user
    await createAdminUser();

    console.log('Database initialization completed');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    await sql.close();
  }
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const result = await sql.query`
      SELECT UserID FROM Users WHERE Email = 'admin@roboticsedu.com'
    `;

    if (result.recordset.length === 0) {
      // Create an admin user with a default password (should be changed immediately)
      // In production, use a proper password hashing method
      const adminPassword = 'AdminPassword123!'; // This should be hashed in production
      
      await sql.query`
        INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, Active)
        VALUES ('admin@roboticsedu.com', ${adminPassword}, 'Admin', 'User', 'admin', 1)
      `;
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
    throw err;
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };