// Database configuration
require('dotenv').config();

// SQL Server connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrongPassword',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'RoboticsEducationCRM',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use encryption for Azure SQL
    trustServerCertificate: process.env.NODE_ENV !== 'production', // Trust self-signed certificates in dev
    enableArithAbort: true
  },
  pool: {
    max: 10, // Maximum pool size
    min: 0, // Minimum pool size
    idleTimeoutMillis: 30000 // How long a connection can be idle before being removed
  }
};

module.exports = dbConfig;