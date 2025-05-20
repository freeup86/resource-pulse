// debug-auth.js
// Simple script to debug JWT tokens and user IDs

const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db/config');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'resource-pulse-secret-key';

// Parse a JWT token to see its contents
function parseToken(token) {
  try {
    console.log("Parsing token:", token);
    
    // Split the token to get the actual JWT part
    const parts = token.split(' ');
    const jwtToken = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : token;
    
    try {
      // Verify and decode the token
      const decoded = jwt.verify(jwtToken, JWT_SECRET);
      console.log("Token verification successful");
      console.log("Decoded token payload:", decoded);
      console.log("UserId type:", typeof decoded.userId);
      console.log("UserId value:", decoded.userId);
      
      return decoded;
    } catch (err) {
      console.error("Token verification failed:", err.message);
      console.log("Attempting to decode without verification...");
      
      // Try decoding without verification to see what's inside
      try {
        const decoded = jwt.decode(jwtToken);
        console.log("Decoded token (without verification):", decoded);
        console.log("UserId type:", typeof decoded.userId);
        console.log("UserId value:", decoded.userId);
        
        return decoded;
      } catch (decodeErr) {
        console.error("Token decode failed:", decodeErr.message);
        return null;
      }
    }
  } catch (err) {
    console.error("Error parsing token:", err);
    return null;
  }
}

// Test if a userId can be properly converted to sql.Int
async function testUserId(userId) {
  console.log("Testing userId:", userId);
  console.log("Type of userId:", typeof userId);
  
  try {
    // Test if we can convert to number
    const userIdNum = Number(userId);
    console.log("Converted to Number:", userIdNum);
    console.log("Is NaN?", isNaN(userIdNum));
    
    // Try to use it in a SQL query
    const pool = await poolPromise;
    const request = pool.request();
    
    // Explicitly convert userId to ensure it's a valid integer
    try {
      const userIdInt = parseInt(userId, 10);
      console.log("Parsed as integer:", userIdInt);
      
      if (isNaN(userIdInt)) {
        console.log("PROBLEM: userId is not a valid number!");
        return;
      }
      
      request.input('userId', sql.Int, userIdInt);
      console.log("Successfully added userId as sql.Int parameter");
      
      // Try executing a simple query
      try {
        const result = await request.query('SELECT @userId AS UserId');
        console.log("Query executed successfully");
        console.log("Query result:", result.recordset);
      } catch (queryErr) {
        console.error("Query execution failed:", queryErr);
      }
    } catch (paramErr) {
      console.error("Parameter binding failed:", paramErr);
    }
  } catch (err) {
    console.error("Error testing userId:", err);
  }
}

// Get all users to check what valid userIds look like
async function listUsers() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT UserID, Username, Email FROM Users');
    
    console.log("Users in the database:");
    console.table(result.recordset);
    
    return result.recordset;
  } catch (err) {
    console.error("Error listing users:", err);
    return [];
  }
}

// For a given test token, get the user profile as the controller would
async function testGetProfile(tokenPayload) {
  try {
    if (!tokenPayload || !tokenPayload.userId) {
      console.log("No valid userId in token payload");
      return;
    }
    
    const userId = tokenPayload.userId;
    console.log(`Attempting to get profile for userId: ${userId}`);
    
    const pool = await poolPromise;
    
    // First, try to parse userId to ensure it's a valid integer
    const userIdInt = parseInt(userId, 10);
    
    if (isNaN(userIdInt)) {
      console.error("Invalid userId: Not a number");
      return;
    }
    
    try {
      // Get user details
      const userResult = await pool.request()
        .input('userId', sql.Int, userIdInt)
        .query(`
          SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
          FROM Users
          WHERE UserID = @userId
        `);
      
      if (userResult.recordset.length === 0) {
        console.log("User not found");
        return;
      }
      
      const user = userResult.recordset[0];
      console.log("User profile retrieved successfully:");
      console.log(user);
      
      return user;
    } catch (err) {
      console.error("Error retrieving user profile:", err);
    }
  } catch (err) {
    console.error("Error in testGetProfile:", err);
  }
}

// Main function - run all the tests
async function run() {
  try {
    // 1. List all users
    console.log("=== LISTING USERS ===");
    await listUsers();
    
    // 2. Ask for a token to test
    console.log("\n=== TESTING TOKEN ===");
    const testToken = process.argv[2] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMzQiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MjE0NTYwMDAsImV4cCI6MTYyMTU0MjQwMH0.JqkpAUNLvQwvnJ6-UMY8VgFJeIhF6DpBJjUWZcDeXXX";
    
    console.log("Using test token:", testToken);
    const decoded = parseToken(testToken);
    
    if (decoded && decoded.userId) {
      // 3. Test userId parameter handling
      console.log("\n=== TESTING USERID PARAMETER ===");
      await testUserId(decoded.userId);
      
      // 4. Test profile retrieval
      console.log("\n=== TESTING PROFILE RETRIEVAL ===");
      await testGetProfile(decoded);
    }
    
    console.log("\nDebug completed");
  } catch (err) {
    console.error("Error in debug run:", err);
  }
}

run();