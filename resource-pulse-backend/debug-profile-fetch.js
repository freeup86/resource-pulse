// Debug script to test profile fetching
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db/config');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';

async function debugProfileFetch() {
  try {
    console.log('Debug: Testing profile fetch');
    
    // Create a test token with a user ID (use a real user ID from your database)
    // For testing, we'll use the admin user (ID 1) if it exists
    const testToken = jwt.sign(
      { 
        userId: 1, // This should be a valid user ID in your database
        username: 'admin',
        email: 'admin@resourcepulse.com',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Debug: Created test token');
    
    // Decode the token to verify contents
    const decoded = jwt.verify(testToken, JWT_SECRET);
    console.log('Debug: Decoded token:', decoded);
    
    // Connect to database
    const pool = await poolPromise;
    console.log('Debug: Connected to database');
    
    // Test getting user data with the user ID from the token
    const userId = decoded.userId;
    
    // First try checking if the user exists
    const checkResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS UserExists
        FROM Users
        WHERE UserID = @userId
      `);
      
    if (checkResult.recordset[0].UserExists === 0) {
      console.error('Debug: User with ID', userId, 'not found in database');
      console.log('Debug: Checking all users in the database:');
      
      // List all users to help identify correct IDs
      const allUsers = await pool.request().query(`
        SELECT UserID, Username, Email, Role
        FROM Users
      `);
      
      console.log('Available users:', allUsers.recordset);
      
      // Try with the first available user ID
      if (allUsers.recordset.length > 0) {
        const availableUserId = allUsers.recordset[0].UserID;
        console.log(`Debug: Using first available user ID: ${availableUserId}`);
        
        // Create a new token with the correct ID
        const newTestToken = jwt.sign(
          { 
            userId: availableUserId,
            username: allUsers.recordset[0].Username,
            email: allUsers.recordset[0].Email,
            role: allUsers.recordset[0].Role
          },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        console.log('Debug: Created new test token with valid user ID');
        
        // Try fetching with the new token
        const newDecoded = jwt.verify(newTestToken, JWT_SECRET);
        const userResult = await pool.request()
          .input('userId', sql.Int, newDecoded.userId)
          .query(`
            SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
            FROM Users
            WHERE UserID = @userId
          `);
          
        if (userResult.recordset.length === 0) {
          console.error('Debug: Still cannot find user with ID', newDecoded.userId);
        } else {
          console.log('Debug: Successfully fetched user profile with valid ID:', userResult.recordset[0]);
        }
      } else {
        console.error('Debug: No users found in the database');
      }
    } else {
      // Original user ID exists, continue with the query
      const userResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
          FROM Users
          WHERE UserID = @userId
        `);
        
      if (userResult.recordset.length === 0) {
        console.error('Debug: User with ID', userId, 'not found, but check query said it exists. Possible query issue.');
      } else {
        console.log('Debug: Successfully fetched user profile:', userResult.recordset[0]);
      }
    }
  } catch (err) {
    console.error('Debug Error:', err);
  }
}

// Run the test
debugProfileFetch()
  .then(() => {
    console.log('Debug: Testing completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });