# Profile Page Fix for Render Deployment

## Issue Summary

When deployed to render.com, the profile page fails to load with the following errors:

```
Failed to load resource: the server responded with a status of 500 ()
Profile fetch error: wt
Profile fetch: Server response error: Object
Error fetching profile: wt
```

The issue appears to be related to token handling and profile endpoint access.

## Root Causes Identified

1. **Token Parsing Error**: The "wt" error indicates a token parsing issue where the JWT token is not being properly processed.

2. **userId Type Mismatch**: The userId in the token is not consistently handled as a number, causing SQL errors when used with `sql.Int`.

3. **404 Error on Profile Endpoint**: The profile API endpoint appears to be returning 404 errors, suggesting routing issues.

4. **Environment Variable Issues**: Inconsistent API URL resolution between environments is causing API connectivity problems.

## Solution Components

The solution includes several critical components:

### 1. Direct API Utilities

A new `api-direct.js` module has been created to provide direct API access for critical paths, bypassing the regular API instance and its interceptors. This provides a more reliable way to access essential endpoints like profile and token refresh.

### 2. Constants for Consistent URLs

A new `constants.js` file has been added to provide consistent API URLs without relying on environment variables, which can be inconsistent on Render.

### 3. Enhanced Error Handling

Improved error detection and logging has been added throughout the authentication flow, particularly for token parsing errors.

### 4. Token Format Validation

Token format is now explicitly validated before use to prevent parsing errors.

### 5. Retry Mechanism

A retry mechanism with exponential backoff has been implemented for profile fetching to handle temporary issues.

## Implementation Files

- `src/constants.js` - Centralized constants including API URLs
- `src/services/api-direct.js` - Direct API access for critical paths
- `src/services/authService.js` - Enhanced token handling and validation
- `resource-pulse-backend/controllers/authController.js` - Improved userId validation
- `resource-pulse-backend/middleware/auth.js` - Enhanced token verification

## How to Apply the Fix

1. Apply the frontend and backend fixes with the provided script:
   ```bash
   ./fix-auth-profile-render.sh
   ```

2. Deploy the updated code to Render.com, deploying the backend first, then the frontend.

3. If you need to make manual changes, focus on:
   - Using the direct API utilities for profile and token refresh
   - Ensuring userId is explicitly converted to a number in all backend code
   - Adding proper error handling for API requests

## Verifying the Fix

After deployment:

1. Log in to the application
2. Navigate to the profile page
3. Check browser console for any errors
4. Test token refresh by waiting 20+ minutes and reloading

## If Issues Persist

If the fix doesn't resolve the issue:

1. Check server logs on Render.com for specific error messages
2. Run the diagnostic tools:
   ```bash
   node resource-pulse-backend/debug-token-refresh.js
   ```
3. Review API endpoint accessibility (ensure auth routes are properly registered)
4. Verify CORS settings in the backend server
5. Manually test API endpoints using tools like Postman or curl