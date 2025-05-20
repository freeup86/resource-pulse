#!/bin/bash
# rollback-auth-fix.sh - Rollback authentication and profile fixes

echo "Rolling back authentication and profile fixes..."

# Find the most recent backup
BACKUP_DIR=$(ls -td .backups/* | head -n 1)

if [ -z "$BACKUP_DIR" ]; then
  echo "Error: No backups found."
  exit 1
fi

echo "Restoring from $BACKUP_DIR"

# Restore frontend files
cp "$BACKUP_DIR/authService.js.bak" src/services/authService.js
cp "$BACKUP_DIR/api.js.bak" src/services/api.js
cp "$BACKUP_DIR/ProfilePage.jsx.bak" src/components/auth/ProfilePage.jsx

# Restore backend files
cp "$BACKUP_DIR/authController.js.bak" resource-pulse-backend/controllers/authController.js
cp "$BACKUP_DIR/auth.js.bak" resource-pulse-backend/middleware/auth.js

echo "Rollback complete"
