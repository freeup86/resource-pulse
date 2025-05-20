// Enhanced database configuration with better security and error handling
const dotenv = require('dotenv');
dotenv.config();

// Import sql module
const sql = require('mssql');

// Get environment variables with defaults
const DB_SERVER = process.env.DB_SERVER;
const DB_NAME = process.env.DB_NAME || process.env.DB_DATABASE; // Support both naming conventions
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 1433;
const DB_ENCRYPT = process.env.DB_ENCRYPT !== 'false'; // Default to true for security
const DB_TRUST_CERT = process.env.DB_TRUST_CERT === 'true';
const DB_MAX_POOL = parseInt(process.env.DB_MAX_POOL, 10) || 10;
const DB_MIN_POOL = parseInt(process.env.DB_MIN_POOL, 10) || 0;
const DB_IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000;
const DB_CONN_TIMEOUT = parseInt(process.env.DB_CONN_TIMEOUT, 10) || 30000;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Validate required configuration
if (!DB_SERVER) console.warn('WARNING: DB_SERVER environment variable is not set');
if (!DB_NAME) console.warn('WARNING: DB_NAME/DB_DATABASE environment variable is not set');
if (!DB_USER) console.warn('WARNING: DB_USER environment variable is not set');
if (!DB_PASSWORD) console.warn('WARNING: DB_PASSWORD environment variable is not set');

// Log configuration (redacted sensitive info)
console.log('Database Configuration:');
console.log(`- Server: ${DB_SERVER || 'NOT SET'}`);
console.log(`- Database: ${DB_NAME || 'NOT SET'}`);
console.log(`- User: ${DB_USER ? '******' : 'NOT SET'}`);
console.log(`- Password: ${DB_PASSWORD ? '******' : 'NOT SET'}`);
console.log(`- Port: ${DB_PORT}`);
console.log(`- Encryption: ${DB_ENCRYPT}`);
console.log(`- Trust Server Certificate: ${DB_TRUST_CERT}`);
console.log(`- Environment: ${ENVIRONMENT}`);

// Database configuration with enhanced security options
const config = {
  server: DB_SERVER,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  options: {
    encrypt: DB_ENCRYPT, // Required for SQL Azure
    trustServerCertificate: DB_TRUST_CERT, // For local dev / self-signed certs
    enableArithAbort: true,
    connectionTimeout: DB_CONN_TIMEOUT,
    // Enforce TLS 1.2 for better security
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1.2'
    }
  },
  pool: {
    max: DB_MAX_POOL,
    min: DB_MIN_POOL,
    idleTimeoutMillis: DB_IDLE_TIMEOUT,
    // Auto-clean idle connections
    autoCleanIdle: true
  },
  // Add retry strategy for better reliability
  retry: {
    max: 3,
    interval: 1000,
    backoffRate: 2
  }
};

// Enhanced connection pool with better error handling
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server successfully');
    
    // Add event listeners for better monitoring
    pool.on('error', err => {
      console.error('Database pool error:', err);
      // In production, you might want to notify admins or restart the pool
    });
    
    return pool;
  })
  .catch(err => {
    const originalError = err.originalError || err;
    const errorDetails = {
      name: err.name,
      code: err.code || (originalError && originalError.code),
      number: err.number,
      state: err.state,
      message: err.message,
      serverName: err.serverName,
      procName: err.procName,
    };
    
    console.error('Database Connection Failed:', errorDetails);
    
    // Enhanced error handling with specific guidance
    if (err.code === 'ELOGIN') {
      console.error('Authentication failed. Please check DB_USER and DB_PASSWORD environment variables.');
    } else if (err.code === 'ESOCKET') {
      console.error('Cannot connect to the server. Please check DB_SERVER and DB_PORT environment variables.');
    } else if (err.code === 'ETIMEOUT') {
      console.error('Connection timeout. Please check network settings and firewall rules.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Please check if the SQL Server is running and accessible.');
    } else if (err.code === 'EENCRYPT') {
      console.error('SQL Server requires encryption. Make sure encrypt=true in the connection options.');
      console.log('Setting encrypt=true and retrying...');
      
      // Modify config to force encryption and retry
      config.options.encrypt = true;
      return new sql.ConnectionPool(config).connect();
    }
    
    throw err; // Let the application handle this error properly
  });

module.exports = {
  sql,
  poolPromise,
  config // Export configuration for debugging
};