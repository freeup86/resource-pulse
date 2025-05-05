const dotenv = require('dotenv');
dotenv.config();

// Mock SQL Server when real connection fails
const createMockPool = () => {
  console.warn('Using mock database - all operations will return empty data');
  
  // Create mock request object with chainable methods
  const createMockRequest = () => {
    const request = {
      input: function(name, type, value) {
        return this;
      },
      query: async function(query) {
        console.log('Mock DB query:', query.substring(0, 50) + (query.length > 50 ? '...' : ''));
        // Return empty recordset for any query
        return { 
          recordset: [],
          rowsAffected: [0]
        };
      }
    };
    return request;
  };
  
  // Create mock pool
  return {
    request: createMockRequest,
    connect: async () => Promise.resolve(true),
    close: async () => Promise.resolve(true)
  };
};

let sql, poolPromise;

try {
  sql = require('mssql');
  
  const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'resourcepulse',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'password',
    options: {
      enableArithAbort: true,
      trustServerCertificate: true,
      connectionTimeout: 30000
    }
  };
  
  // Connection pool
  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('Connected to SQL Server');
      return pool;
    })
    .catch(err => {
      console.error('Database Connection Failed:', err);
      // Return mock pool instead of undefined to avoid crashes
      return createMockPool();
    });
} catch (err) {
  console.error('Error setting up database:', err);
  // Create mock sql and pool objects for fallback
  sql = {
    Int: 'Int',
    NVarChar: 'NVarChar',
    DateTime2: 'DateTime2'
  };
  poolPromise = Promise.resolve(createMockPool());
}

module.exports = {
  sql,
  poolPromise
};