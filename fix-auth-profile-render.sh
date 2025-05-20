#!/bin/bash
# fix-auth-profile-render.sh - Comprehensive fix for authentication and profile issues on Render.com

echo "================================"
echo "Resource Pulse Auth & Profile Fix"
echo "================================"
echo "This script will apply fixes to resolve token and profile issues on Render.com"
echo

# Make sure we're in the project root
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory."
  exit 1
fi

# Step 1: Create backups
echo "Step 1: Creating backups of critical files..."
mkdir -p .backups/$(date +%Y%m%d)

# Frontend backups
cp src/services/authService.js .backups/$(date +%Y%m%d)/authService.js.bak
cp src/services/api.js .backups/$(date +%Y%m%d)/api.js.bak
cp src/components/auth/ProfilePage.jsx .backups/$(date +%Y%m%d)/ProfilePage.jsx.bak

# Backend backups
cp resource-pulse-backend/controllers/authController.js .backups/$(date +%Y%m%d)/authController.js.bak
cp resource-pulse-backend/middleware/auth.js .backups/$(date +%Y%m%d)/auth.js.bak

echo "Backups saved to .backups/$(date +%Y%m%d)/"
echo

# Step 2: Apply frontend fixes
echo "Step 2: Applying frontend fixes..."
echo "- Updating authService.js with enhanced token validation"
echo "- Updating api.js with improved error handling"
echo "- Updating ProfilePage.jsx with robust error recovery"

# Apply the frontend fix script
node apply-auth-fix.js

echo "Frontend fixes applied"
echo

# Step 3: Apply backend fixes
echo "Step 3: Applying backend fixes..."
echo "- Updating authController.js to ensure userId is numeric"
echo "- Adding debug logging to token refresh mechanism"
echo "- Enhancing auth middleware to validate userId"

# Apply the backend fix script
node apply-backend-fix.js

echo "Backend fixes applied"
echo

# Step 4: Create diagnostic tools
echo "Step 4: Setting up diagnostic tools..."
chmod +x resource-pulse-backend/debug-token-refresh.js
chmod +x resource-pulse-backend/enhanced-debug-auth.js

echo "Diagnostic tools ready"
echo

# Step 5: Update documentation
echo "Step 5: Updating documentation..."

cat > AUTH_TOKEN_FIX.md << EOL
# Authentication and Profile Fix

This document describes the comprehensive fix applied to resolve authentication and profile issues in the Resource Pulse application when deployed to Render.com.

## Issues Addressed

1. Profile loading error with 500 response
2. "wt" token parsing error
3. userId type validation errors
4. Token refresh failures
5. Null userId in profile requests after token refresh

## Fix Components

### Frontend Fixes

1. **Enhanced Token Validation**:
   - Added explicit token format checks
   - Improved error handling for malformed tokens
   - Added specific detection for "wt" error cases

2. **Improved Token Refresh**:
   - Enhanced token refresh mechanism with direct axios calls
   - Added robust error handling and recovery
   - Implemented detailed logging for debugging

3. **Profile Page Enhancements**:
   - Added proactive token refresh before profile fetching
   - Improved error detection and recovery
   - Enhanced user feedback for authentication issues

### Backend Fixes

1. **UserId Type Enforcement**:
   - Modified token generation to ensure userId is a number
   - Added validation in authController.js for all userId uses
   - Enhanced SQL parameter binding with type checking

2. **Auth Middleware Improvements**:
   - Added userId validation in auth middleware
   - Improved token verification error handling
   - Added extended logging for debugging

3. **Error Handling Enhancements**:
   - Added more detailed error messages
   - Improved logging throughout the authentication flow
   - Added validation checks at critical points

## Deployment Instructions

1. Apply frontend and backend fixes:
   ```
   ./fix-auth-profile-render.sh
   ```

2. Run the token refresh diagnostic:
   ```
   node resource-pulse-backend/debug-token-refresh.js
   ```

3. Deploy to Render.com
   - Deploy backend first
   - Then deploy frontend

4. Verify fix by:
   - Logging in to the application
   - Navigating to the profile page
   - Testing token refresh by waiting > 20 minutes
   - Checking application logs for any errors

## Rollback Procedure

If issues persist:
1. Restore from backups in the .backups directory
2. Run the rollback script: \`./rollback-auth-fix.sh\`

## Additional Diagnostic Tools

1. \`debug-token-refresh.js\` - Tests the entire token refresh flow
2. \`enhanced-debug-auth.js\` - Diagnoses token and userId issues

## Contributors

Fix implemented by Claude AI Assistant based on detailed debugging and analysis.
EOL

echo "Documentation created in AUTH_TOKEN_FIX.md"
echo

# Create a simple rollback script
cat > rollback-auth-fix.sh << EOL
#!/bin/bash
# rollback-auth-fix.sh - Rollback authentication and profile fixes

echo "Rolling back authentication and profile fixes..."

# Find the most recent backup
BACKUP_DIR=\$(ls -td .backups/* | head -n 1)

if [ -z "\$BACKUP_DIR" ]; then
  echo "Error: No backups found."
  exit 1
fi

echo "Restoring from \$BACKUP_DIR"

# Restore frontend files
cp "\$BACKUP_DIR/authService.js.bak" src/services/authService.js
cp "\$BACKUP_DIR/api.js.bak" src/services/api.js
cp "\$BACKUP_DIR/ProfilePage.jsx.bak" src/components/auth/ProfilePage.jsx

# Restore backend files
cp "\$BACKUP_DIR/authController.js.bak" resource-pulse-backend/controllers/authController.js
cp "\$BACKUP_DIR/auth.js.bak" resource-pulse-backend/middleware/auth.js

echo "Rollback complete"
EOL

chmod +x rollback-auth-fix.sh

echo "Rollback script created: rollback-auth-fix.sh"
echo

# Step 6: Summary
echo "========================================="
echo "Fix application complete!"
echo "========================================="
echo
echo "Next steps:"
echo "1. Deploy the backend to Render.com"
echo "2. Deploy the frontend to Render.com"
echo "3. Test the application by logging in and viewing your profile"
echo "4. If any issues persist, run the rollback script: ./rollback-auth-fix.sh"
echo
echo "For additional debugging, use:"
echo "- node resource-pulse-backend/debug-token-refresh.js"
echo "- node resource-pulse-backend/enhanced-debug-auth.js"
echo
echo "Documentation has been saved in AUTH_TOKEN_FIX.md"
echo "========================================="