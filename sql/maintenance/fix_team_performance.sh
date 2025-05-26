#!/bin/bash

# Fix for team performance data error in football stats app

echo "📊 Football Stats App - Team Performance Fix"
echo "=========================================="
echo ""

echo "1. Ensuring needed files exist..."

# Check if the team_performance_fix.sql file exists
if [ ! -f "team_performance_fix.sql" ]; then
  echo "❌ ERROR: team_performance_fix.sql not found!"
  echo "Please make sure the SQL fix file is in the current directory."
  exit 1
fi

echo "✅ Fix files found."
echo ""

echo "2. Checking if components are updated..."
if grep -q "TeamPerformanceWrapper" "src/components/Charts/index.ts"; then
  echo "✅ Component exports are updated."
else
  echo "⚠️ Component exports may need updating."
  echo "Please make sure TeamPerformanceWrapper is exported in src/components/Charts/index.ts"
fi
echo ""

echo "3. What would you like to do next?"
echo ""
echo "Options:"
echo "  [1] Just print the SQL fix (to copy/paste into Supabase SQL Editor)"
echo "  [2] View the diagnostic guide"
echo "  [3] Exit"
echo ""
read -p "Select an option (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📝 SQL Fix (copy this to Supabase SQL Editor):"
    echo "----------------------------------------------"
    cat team_performance_fix.sql
    echo ""
    echo "✅ Copy the SQL above and paste it into your Supabase SQL Editor, then run it."
    ;;
  2)
    echo ""
    echo "📋 Opening diagnostic guide..."
    if [ -f "TEAM_PERFORMANCE_FIX_GUIDE.md" ]; then
      if command -v open > /dev/null; then
        open TEAM_PERFORMANCE_FIX_GUIDE.md
      else
        cat TEAM_PERFORMANCE_FIX_GUIDE.md
      fi
    else
      echo "❌ Guide file not found!"
    fi
    ;;
  3)
    echo "Exiting..."
    ;;
  *)
    echo "Invalid option. Exiting."
    ;;
esac

echo ""
echo "Done! After applying the SQL fix, restart your app with 'npm run dev'" 