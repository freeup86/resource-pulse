const dotenv = require('dotenv');
dotenv.config();

// Import sql module
const sql = require('mssql');

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
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