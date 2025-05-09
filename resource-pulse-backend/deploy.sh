#\!/bin/bash

# ResourcePulse Backend Deployment Script
# 
# This script deploys the latest changes to the backend server
# and runs the necessary migration scripts.

echo "======================================================="
echo "DEPLOYING RESOURCE PULSE BACKEND"
echo "======================================================="

# Step 1: Ensure all files are committed
echo -e "\nChecking git status..."
if [[ -n $(git status -s) ]]; then
  echo "Error: You have uncommitted changes. Please commit all changes before deploying."
  exit 1
fi

# Step 2: Push to remote repository
echo -e "\nPushing to remote repository..."
git push origin master

if [ $? -ne 0 ]; then
  echo "Error: Failed to push to remote repository."
  exit 1
fi

echo "Successfully pushed to remote repository."

# Step 3: Ask if we should run schema fix script in production
echo -e "\nDo you want to run the schema fix script in production? (y/n)"
read -r run_fix

if [[ $run_fix == "y" || $run_fix == "Y" ]]; then
  echo -e "\nTo run the schema fix script in production, connect to the Render dashboard"
  echo "and run the following command in the shell:"
  echo "node fix-production-schema.js"
  echo -e "\nThis will fix the BudgetItems table schema issue."
fi

echo -e "\n======================================================="
echo "DEPLOYMENT INSTRUCTIONS COMPLETE"
echo "======================================================="
echo ""
echo "Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Check the deployment status"
echo "3. If deployment fails, debug the issue in the logs"
echo "4. You can trigger a manual redeploy if needed"
echo ""
echo "For immediate testing before Render deploys, use the mock data service:"
echo "node setup-mock-data.js"
echo "node server.js"
echo "======================================================="

exit 0
