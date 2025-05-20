# Database Encryption Fix

This document explains the fix for the database encryption error when running the authentication tests.

## Issue

The error occurred when trying to connect to the SQL Server database:

```
ConnectionError: Server requires encryption, set 'encrypt' config option to true.
```

## Solution

The database configuration has been updated to handle encryption requirements more intelligently.

### Changes Made

1. **Default Encryption to True**: Changed the database configuration to default to encryption enabled unless explicitly disabled:
   ```javascript
   encrypt: process.env.DB_ENCRYPT !== 'false', // Default to true for security
   ```

2. **Automatic Retry with Encryption**: Added retry logic that automatically enables encryption if the server requires it:
   ```javascript
   .catch(err => {
     if (err.code === 'EENCRYPT' && config.options.encrypt !== true) {
       console.log('Server requires encryption, retrying with encrypt=true...');
       config.options.encrypt = true;
       return new sql.ConnectionPool(config).connect();
     }
     throw err;
   });
   ```

3. **Enhanced Security**: Added TLS version constraints:
   ```javascript
   cryptoCredentialsDetails: {
     minVersion: 'TLSv1.2'
   }
   ```

### Environment Variables

To configure database encryption, set these environment variables:

```bash
# For Azure SQL Database or any server requiring encryption
DB_ENCRYPT=true

# For local development with self-signed certificates
DB_TRUST_CERT=true

# For local SQL Server without encryption (not recommended for production)
DB_ENCRYPT=false
```

### Files Modified

- `resource-pulse-backend/db/config.js` - Updated with enhanced encryption handling
- `resource-pulse-backend/db/config-enhanced.js` - Created enhanced version with better error handling
- `resource-pulse-backend/.env.template` - Added template for environment configuration

### Testing

After applying these changes, the database connection should work with both encrypted and non-encrypted SQL Server instances. The system will automatically detect if encryption is required and retry the connection with the appropriate settings.

### Deployment Notes

When deploying to production environments:

1. Always set `DB_ENCRYPT=true` for security
2. Use proper SSL certificates instead of `DB_TRUST_CERT=true`
3. Ensure your SQL Server supports TLS 1.2 or higher
4. Test the connection before deploying to production

This fix ensures compatibility with cloud databases (like Azure SQL Database) which require encryption by default.