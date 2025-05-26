#!/bin/bash
# Git history purge script for the football_stats_app
# WARNING: This script rewrites git history and should be used with caution
# Make sure to coordinate with your team before running this script
# All collaborators will need to reclone the repository after this is done

echo "🧹 GIT HISTORY CLEANUP SCRIPT"
echo "============================"
echo "This script will help remove sensitive data from your git history."
echo "WARNING: This will rewrite git history!"
echo
echo "Prerequisites:"
echo "1. Install BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/"
echo "2. Ensure you have committed all changes you want to keep"
echo "3. Push all branches you want to keep to a temporary backup"
echo

read -p "Have you installed BFG Repo-Cleaner and made a backup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please install BFG and make a backup before continuing."
    exit 1
fi

echo "Creating a list of sensitive terms to remove..."
cat > sensitive-terms.txt << EOL
# API Keys and Secrets
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI
# Database credentials
username:password@localhost
# Names to anonymize
Player2
Player1
EOL

echo "Creating a mirror of your repository (this preserves refs)..."
git clone --mirror . football_stats_app-mirror.git

echo "Running BFG to remove sensitive data..."
bfg --replace-text sensitive-terms.txt football_stats_app-mirror.git

echo "Entering the mirror repository to clean up..."
cd football_stats_app-mirror.git

echo "Running git garbage collection..."
git reflog expire --expire=now --all && git gc --prune=now --aggressive

echo "Return to the original repository..."
cd ..

echo
echo "🎉 CLEANING COMPLETE!"
echo 
echo "Next steps:"
echo "1. Verify the changes in the mirror repository"
echo "2. If satisfied, use the mirror to replace your current repository:"
echo "   git push football_stats_app-mirror.git --force --all"
echo "   git push football_stats_app-mirror.git --force --tags"
echo "3. Notify all collaborators to reclone the repository"
echo
echo "IMPORTANT: Also run these commands to update your local repository:"
echo "git fetch --all"
echo "git reset --hard origin/main"
echo "git reflog expire --expire=now --all"
echo "git gc --prune=now --aggressive"
echo
echo "After confirming everything works, remove these files:"
echo "rm -rf football_stats_app-mirror.git sensitive-terms.txt" 