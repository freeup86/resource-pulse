const dotenv = require('dotenv');
dotenv.config();

// Mock SQL Server when real connection fails
const createMockPool = () => {
  console.warn('Using mock database - all operations will return empty data');
  
  // Create mock request object with chainable methods
  const createMockRequest = () => {
    const request = {
      input: function(name, type, value) {
        // Store inputs for potential use in query
        this._inputs = this._inputs || {};
        this._inputs[name] = value;
        return this;
      },
      query: async function(query) {
        console.log('Mock DB query:', query.substring(0, 50) + (query.length > 50 ? '...' : ''));
        
        // Mock responses for specific queries
        if (query.includes('COUNT(*) as count') && query.includes('Notifications')) {
          return { 
            recordset: [{ count: 0 }],
            rowsAffected: [1]
          };
        }
        
        if (query.includes('COUNT(*) as total') && query.includes('Notifications')) {
          return { 
            recordset: [{ total: 0 }],
            rowsAffected: [1]
          };
        }
        
        if (query.includes('NotificationTypes')) {
          return {
            recordset: [
              { 
                typeId: 1, 
                type: 'allocation_created', 
                description: 'New allocation', 
                isEmailEnabled: true,
                isInAppEnabled: true,
                frequency: 'immediate'
              },
              { 
                typeId: 2, 
                type: 'deadline_approaching', 
                description: 'Allocation deadline approaching', 
                isEmailEnabled: true,
                isInAppEnabled: true,
                frequency: 'immediate'
              }
            ],
            rowsAffected: [2]
          };
        }
        
        // Default empty response
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