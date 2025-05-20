const dotenv = require('dotenv');
dotenv.config();

// Import sql module
const sql = require('mssql');

// Enhanced configuration with better security defaults
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE, // Support both naming conventions
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false', // Default to true for security
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // For local dev / self-signed certs
    enableArithAbort: true,
    connectionTimeout: 30000,
    // Add TLS version constraint for better security
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1.2'
    }
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Enhanced connection pool with retry logic for encryption errors
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    
    // If encryption is required by server but not set, retry with encryption
    if (err.code === 'EENCRYPT' && config.options.encrypt !== true) {
      console.log('Server requires encryption, retrying with encrypt=true...');
      
      // Update config to force encryption
      config.options.encrypt = true;
      
      // Retry connection
      return new sql.ConnectionPool(config)
        .connect()
        .then(pool => {
          console.log('Connected to SQL Server with encryption');
          return pool;
        })
        .catch(retryErr => {
          console.error('Database Connection Failed on retry:', retryErr);
          throw retryErr;
        });
    }
    
    throw err; // Let the application handle this error properly
  });

module.exports = {
  sql,
  poolPromise
};