// enhanced-debug-auth.js
// Enhanced script to debug JWT tokens and user IDs - focuses on the specific userId validation issue

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

// Create a sample token with a valid numeric userId
async function createValidToken() {
  try {
    console.log("Creating a valid token with a numeric userId...");
    
    // Get a valid user from the database
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 1 UserID, Username, Email, Role FROM Users');
    
    if (result.recordset.length === 0) {
      console.error("No users found in the database");
      return null;
    }
    
    const user = result.recordset[0];
    console.log("Using user:", user);
    
    // Create a token ensuring userId is a number
    const payload = {
      userId: Number(user.UserID), // Force as number
      username: user.Username,
      email: user.Email,
      role: user.Role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    console.log("Token created successfully");
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token verification successful");
    console.log("Decoded userId type:", typeof decoded.userId);
    
    return token;
  } catch (err) {
    console.error("Error creating valid token:", err);
    return null;
  }
}

// Test if a userId can be properly converted to sql.Int
async function testUserId(userId) {
  console.log("\n=== TESTING USERID PARAMETER ===");
  console.log("Testing userId:", userId);
  console.log("Type of userId:", typeof userId);
  
  try {
    // Test various parsing/conversion methods
    console.log("Number(userId):", Number(userId));
    console.log("parseInt(userId, 10):", parseInt(userId, 10));
    console.log("parseFloat(userId):", parseFloat(userId));
    console.log("+userId:", +userId);
    console.log("~~userId (double bitwise negation):", ~~userId);
    console.log("userId | 0 (bitwise OR with 0):", userId | 0);
    
    // Check for NaN
    console.log("isNaN(Number(userId)):", isNaN(Number(userId)));
    
    // The issue is likely with SQL Server parameter binding
    // Try to use it in a SQL query
    const pool = await poolPromise;
    
    // Test with different conversion methods
    await testSqlBinding(pool, "Direct", userId);
    await testSqlBinding(pool, "Number()", Number(userId));
    await testSqlBinding(pool, "parseInt()", parseInt(userId, 10));
    await testSqlBinding(pool, "Force Number", userId * 1); // Force to number
    await testSqlBinding(pool, "toString()", userId.toString());
    
    // Additional tests for specific user IDs
    const directResult = await pool.request()
      .query(`SELECT UserID, Username FROM Users WHERE UserID = ${parseInt(userId, 10)}`);
    
    console.log("Direct SQL query result count:", directResult.recordset.length);
    if (directResult.recordset.length > 0) {
      console.log("Found user:", directResult.recordset[0]);
    }
  } catch (err) {
    console.error("Error testing userId:", err);
  }
}

// Helper function to test binding a value as a SQL parameter
async function testSqlBinding(pool, methodName, value) {
  try {
    console.log(`\nTesting SQL binding with ${methodName}: ${value} (${typeof value})`);
    const request = pool.request();
    
    try {
      request.input('userId', sql.Int, value);
      console.log("✅ Parameter binding succeeded");
      
      try {
        const result = await request.query('SELECT @userId AS ParsedUserId');
        console.log("✅ SQL query succeeded");
        console.log("Result:", result.recordset[0]);
        return true;
      } catch (queryErr) {
        console.error("❌ SQL query failed:", queryErr.message);
        return false;
      }
    } catch (paramErr) {
      console.error("❌ Parameter binding failed:", paramErr.message);
      return false;
    }
  } catch (err) {
    console.error("Error in testSqlBinding:", err);
    return false;
  }
}

// Patch function - Fix the auth controller by ensuring userId is a number
async function patchAuthController() {
  try {
    console.log("\n=== GENERATING PATCH FOR AUTH CONTROLLER ===");
    
    // Generate code to patch the controller
    const patchCode = `
// Patch for authController.js - Fix userId validation issue
// Add this code at the start of the getProfile function:

const getProfile = async (req, res) => {
  try {
    // User ID should come from the authenticated middleware
    const userId = req.user.userId;
    
    // *** FIX: Ensure userId is a valid number before using with SQL Server ***
    let userIdNumber;
    
    try {
      // Try multiple conversion methods
      userIdNumber = Number(userId);
      
      // Check if it's a valid number
      if (isNaN(userIdNumber)) {
        console.error('Profile fetch: Invalid userId format:', userId);
        return res.status(400).json({ 
          message: 'Invalid user ID format'
        });
      }
    } catch (conversionError) {
      console.error('Profile fetch: userId conversion error:', conversionError);
      return res.status(400).json({ 
        message: 'Error processing user ID'
      });
    }
    
    const pool = await poolPromise;
    
    // Use the converted numeric userId
    const userResult = await pool.request()
      .input('userId', sql.Int, userIdNumber)
      .query(\`
        SELECT UserID, Username, Email, FirstName, LastName, Role, CreatedAt, LastLogin
        FROM Users
        WHERE UserID = @userId
      \`);
    
    // Rest of the function remains the same...
`;

    console.log("Patch code generated. Apply this code to the getProfile function in authController.js:");
    console.log(patchCode);
    
    return patchCode;
  } catch (err) {
    console.error("Error generating patch:", err);
    return null;
  }
}

// Create a test JWT token with proper numeric userId
async function generateFixedToken() {
  try {
    console.log("\n=== GENERATING FIXED TOKEN ===");
    
    // Get a valid user ID from the database
    const pool = await poolPromise;
    const userResult = await pool.request()
      .query('SELECT TOP 1 UserID, Username, Email, Role FROM Users');
    
    if (userResult.recordset.length === 0) {
      console.error("No users found in database");
      return null;
    }
    
    const user = userResult.recordset[0];
    console.log("Creating token for user:", {
      id: user.UserID,
      username: user.Username,
      type: typeof user.UserID
    });
    
    // Ensure userId is a number
    const userId = Number(user.UserID);
    
    // Create a token with numeric userId
    const token = jwt.sign(
      { 
        userId: userId,  // Must be a number!
        username: user.Username,
        email: user.Email,
        role: user.Role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Verify the token is valid
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token created successfully with numeric userId:", typeof decoded.userId);
    console.log("Token for testing:", token);
    
    return {
      token,
      userId: decoded.userId
    };
  } catch (err) {
    console.error("Error generating fixed token:", err);
    return null;
  }
}

// Main function - run all the tests
async function run() {
  try {
    console.log("=== ENHANCED AUTH DEBUGGING TOOL ===");
    console.log("Testing for userId validation issues in auth controller");
    
    // 1. Create a proper token
    const fixedToken = await generateFixedToken();
    
    if (fixedToken) {
      // 2. Test userId parameter handling
      await testUserId(fixedToken.userId);
      
      // 3. Generate patch
      await patchAuthController();
      
      console.log("\n=== FIX INSTRUCTIONS ===");
      console.log("1. Apply the patch to authController.js");
      console.log("2. Test with the following token:", fixedToken.token);
      console.log("3. Make sure the auth middleware properly extracts and validates numeric userId");
    }
    
    console.log("\nDebug completed");
  } catch (err) {
    console.error("Error in debug run:", err);
  }
}

run();