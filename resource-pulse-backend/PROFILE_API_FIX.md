# Profile API Fix

This document explains the fix for the 500 error occurring when fetching user profiles on Render.com.

## Issue Description

The application was experiencing a 500 Internal Server Error when fetching user profiles from the backend API. The error logs showed:

```
Profile fetch error: RequestError: Validation failed for parameter 'userId'. Invalid number.
```

## Root Cause

The issue was identified in the authentication flow:

1. When creating JWT tokens, the `userId` was not being explicitly converted to a number type
2. This caused the `userId` to be passed as a string or potentially other non-numeric format in the auth middleware
3. When the SQL Server tried to use this value with the `sql.Int` type, it failed with a validation error

## Fix Details

The fix addresses these issues in several components:

### 1. Token Generation

Modified the JWT token generation in `login` and `refreshToken` functions to explicitly convert the userId to a number:

```javascript
// Before
const token = jwt.sign(
  { 
    userId: user.UserID,   // Could be parsed as string or object
    // ...other fields
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRY }
);

// After
const token = jwt.sign(
  { 
    userId: Number(user.UserID),  // Force as number
    // ...other fields
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRY }
);
```

### 2. Profile Fetch Handler

Enhanced the `getProfile` function in the auth controller to properly validate and convert the userId before using it in SQL queries:

```javascript
const getProfile = async (req, res) => {
  try {
    // User ID should come from the authenticated middleware
    const userId = req.user?.userId;
    
    // Enhanced error logging
    console.log('Profile fetch request from user:', {
      userId: userId,
      type: typeof userId,
      headers: req.headers['user-agent']
    });
    
    // FIXED: Ensure userId is a valid number before using with SQL Server
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
    
    // Use the converted numeric userId
    const userResult = await pool.request()
      .input('userId', sql.Int, userIdNumber) // Use the numeric value
      .query(`...`);
```

### 3. Frontend Retry Logic

Added enhanced retry logic to the frontend `getProfileAfterRefresh` function with exponential backoff to handle temporary issues:

```javascript
// Add retry mechanism with exponential backoff
let retries = 0;
const maxRetries = 3;
let lastError = null;

while (retries < maxRetries) {
  try {
    console.log(`Profile fetch after refresh: Attempt ${retries + 1} of ${maxRetries}`);
    
    const response = await axios({...});
    
    console.log('Profile fetch after refresh: Success');
    return response.data;
  } catch (err) {
    lastError = err;
    retries++;
    
    if (retries < maxRetries) {
      const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
      console.log(`Profile fetch after refresh: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Deployment Instructions

To deploy this fix:

1. **Backend Fix**:
   - Copy `authController-fixed.js` to replace the existing `authController.js` file
   - Restart the backend service on Render.com

2. **Frontend Fix**:
   - The frontend fixes have already been applied to:
     - `src/services/authService.js`
     - `src/services/api.js`
     - `src/components/auth/ProfilePage.jsx`
   - Deploy the updated frontend code to Render.com

## Verification

After deploying the fix, verify it by:

1. Log in to the application
2. Navigate to the profile page
3. Check the browser console for any errors
4. Verify that profile data loads correctly

If you see any new errors:

1. Check the server logs on Render.com for more details
2. Run the `enhanced-debug-auth.js` script on the server to diagnose token-related issues

## Potential Rollback

If issues persist after deployment:

1. Revert the changes to `authController.js`
2. Restore frontend files from backup (using `*.bak` files created during the fix process)
3. Restart both frontend and backend services

## Long-term Recommendations

1. Add more robust type validation throughout the authentication flow
2. Add more detailed logging for troubleshooting authentication issues
3. Consider using TypeScript to enforce stronger type checking