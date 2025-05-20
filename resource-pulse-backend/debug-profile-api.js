// Debug script to test the profile API endpoint
const http = require('http');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db/config');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';

async function debugProfileAPI() {
  try {
    console.log('Debug: Testing profile API endpoint');
    
    // First get a valid user ID from the database
    const pool = await poolPromise;
    console.log('Debug: Connected to database');
    
    // Get the first admin user from the database
    const userResult = await pool.request()
      .query(`
        SELECT TOP 1 UserID, Username, Email, Role
        FROM Users
        WHERE Role = 'admin'
      `);
    
    if (userResult.recordset.length === 0) {
      console.error('Debug: No admin users found in the database');
      return;
    }
    
    const user = userResult.recordset[0];
    console.log('Debug: Found admin user:', user);
    
    // Create a test token with the user's details
    const testToken = jwt.sign(
      { 
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        role: user.Role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Debug: Created test token for user ID:', user.UserID);
    
    // Now test the API endpoint
    const testPort = 8999; // Use a different port
    const options = {
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Debug: Making API request to:', `http://${options.hostname}:${options.port}${options.path}`);
    
    const request = http.request(options, response => {
      console.log('Debug: API Response Status:', response.statusCode);
      console.log('Debug: API Response Headers:', response.headers);
      
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          console.log('Debug: API Response Body (raw):', data);
          
          if (data) {
            const result = JSON.parse(data);
            console.log('Debug: API Response Body (parsed):', result);
          }
          
          console.log('Debug: API test completed');
          process.exit(0);
        } catch (e) {
          console.error('Debug: Error parsing API response:', e);
          process.exit(1);
        }
      });
    });
    
    request.on('error', error => {
      console.error('Debug: API Request Error:', error);
      process.exit(1);
    });
    
    request.end();
    
  } catch (err) {
    console.error('Debug Error:', err);
    process.exit(1);
  }
}

// Start the test after a brief delay to ensure server is running
console.log('Debug: Waiting 2 seconds for server to be ready...');
setTimeout(() => {
  debugProfileAPI();
}, 2000);