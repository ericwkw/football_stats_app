#!/bin/bash
# Git history filter script for the football_stats_app
# WARNING: This script rewrites git history and should be used with caution
# Make sure to coordinate with your team before running this script
# All collaborators will need to reclone the repository after this is done

echo "🧹 GIT HISTORY CLEANUP SCRIPT (FILTER-BRANCH)"
echo "==========================================="
echo "This script will help remove sensitive data from your git history."
echo "WARNING: This will rewrite git history!"
echo

read -p "Have you made a backup of your repository? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please make a backup before continuing."
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)

# Create a backup branch
echo "Creating a backup branch..."
git checkout -b backup_before_cleanup_$(date +%Y%m%d) 2>/dev/null || echo "Backup branch already exists"

# Go back to main branch
git checkout main

# Remove .env files from history
echo "Removing .env files from git history..."
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local" \
  --prune-empty --tag-name-filter cat -- --all || echo "No .env files to remove"

# Create simpler approach for macOS
echo "Creating simple scripts for cleaning history..."

# Clean up environment variables in a file containing sensitive data
cat > $CURRENT_DIR/replace_env_vars.sh << 'EOL'
#!/bin/bash
git ls-files | while read file; do
    if [ -f "$file" ]; then
        # Replace Supabase keys
        perl -i -pe 's/(NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here"]*/$1your_supabase_url_here/g' "$file" 2>/dev/null || true
        perl -i -pe 's/(NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here"]*/$1your_supabase_anon_key_here/g' "$file" 2>/dev/null || true
        perl -i -pe 's/(SUPABASE_SERVICE_KEY=your_supabase_service_key_here"]*/$1your_supabase_service_key_here/g' "$file" 2>/dev/null || true
        
        # Replace JWT tokens
        perl -i -pe 's/your_jwt_token_here[^\s\n\"]/your_jwt_token_here/g' "$file" 2>/dev/null || true
        
        # Replace database credentials
        perl -i -pe 's/username:password@localhost/username:password@localhost/g' "$file" 2>/dev/null || true
        
        # Replace real names with generic names
        perl -i -pe 's/Player2/Player2/g; s/Player1/Player1/g' "$file" 2>/dev/null || true
    fi
done
EOL
chmod +x $CURRENT_DIR/replace_env_vars.sh

# Run the script to clean the history
echo "Removing sensitive data from history..."
git filter-branch --force --tree-filter "$CURRENT_DIR/replace_env_vars.sh" \
  --prune-empty --tag-name-filter cat -- --all || echo "Failed to clean history"

# Clean up temporary scripts
echo "Cleaning up temporary files..."
rm -f $CURRENT_DIR/replace_env_vars.sh

echo "Running git garbage collection..."
git reflog expire --expire=now --all && git gc --prune=now --aggressive

echo
echo "🎉 CLEANING COMPLETE!"
echo 
echo "Next steps:"
echo "1. Push changes to GitHub with: git push origin main --force"
echo "2. Notify all collaborators to re-clone the repository"
echo 
echo "IMPORTANT: The force push is necessary and will overwrite the remote history."
echo "This means all collaborators will need to clone a fresh copy of the repository." 