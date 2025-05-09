const dotenv = require('dotenv');
dotenv.config();

// Import sql module
const sql = require('mssql');

// Database configuration
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE, // Support both naming conventions
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // For Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // For local dev / self-signed certs
    enableArithAbort: true,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    throw err; // Let the application handle this error properly
  });

module.exports = {
  sql,
  poolPromise
};