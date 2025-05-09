#!/bin/bash

# Deployment script for resource-pulse-backend

# Check if we're on the master branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "master" ]; then
  echo "Not on master branch. Please switch to master branch first."
  exit 1
fi

# Display current status
echo "Current git status:"
git status

# Make sure the code is ready to push
echo -e "\nAre you ready to push these changes to GitHub? (y/n)"
read -r answer
if [[ "$answer" != "y" ]]; then
  echo "Deployment canceled."
  exit 0
fi

# Add your GitHub personal access token here
# or use GitHub CLI if installed
if command -v gh &> /dev/null; then
  echo -e "\nUsing GitHub CLI for authentication"
  gh auth status || gh auth login
  
  echo -e "\nPushing to GitHub..."
  git push origin master
else
  echo -e "\nPushing to GitHub..."
  echo "You may be prompted for GitHub credentials"
  git push origin master
fi

echo -e "\nDeployment completed!"