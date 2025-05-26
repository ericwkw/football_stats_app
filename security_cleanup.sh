#!/bin/bash
# Security cleanup script for football_stats_app

echo "🔒 SECURITY CLEANUP SCRIPT"
echo "=========================="
echo "This script will help secure your repository before making it public."
echo

# 1. Create env.example file
echo "1️⃣ Creating .env.example file..."
cat > .env.example << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Database Connection (for local development)
DATABASE_URL=postgres://username:password@localhost:5432/football_stats
EOL
echo "✅ Created .env.example file"

# 2. Verify .gitignore has proper entries
echo "2️⃣ Checking .gitignore file..."
if grep -q "\.env\*" .gitignore; then
  echo "✅ .gitignore already has .env* pattern"
else
  echo "Adding .env* pattern to .gitignore"
  echo ".env*" >> .gitignore
  echo "✅ Updated .gitignore"
fi

# 3. Remove .env files from git tracking
echo "3️⃣ Removing .env files from git tracking..."
if [ -f .env ]; then
  git rm --cached .env
  echo "✅ Removed .env from git tracking (file preserved locally)"
else
  echo "⏩ No .env file found"
fi

if [ -f .env.local ]; then
  git rm --cached .env.local
  echo "✅ Removed .env.local from git tracking (file preserved locally)"
else
  echo "⏩ No .env.local file found"
fi

# 4. Remind about rotating API keys
echo "4️⃣ IMPORTANT: Your Supabase API keys need to be rotated"
echo "   Please visit your Supabase dashboard and generate new API keys"
echo "   Then update your local .env.local file with the new keys"
echo

# 5. Instructions for checking for other sensitive data
echo "5️⃣ Additional Security Recommendations:"
echo "   - Remove any real personal data or names from the codebase"
echo "   - Check for hardcoded passwords or connection strings"
echo "   - Consider using git-filter-repo to completely remove secrets from history"
echo

echo "🔒 SECURITY CLEANUP COMPLETE"
echo "To finalize cleanup, run these commands:"
echo "1. git add ."
echo "2. git commit -m \"Security: Remove sensitive data and improve security configuration\""
echo "3. Rotate your Supabase API keys"
echo
echo "Then you can safely make your repository public." 