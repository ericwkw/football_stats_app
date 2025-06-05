#!/bin/bash

# Script to apply all security fixes to the database
# Usage: ./run_security_fixes.sh [DATABASE_URL]

# Default to supabase connection if no URL provided
if [ -z "$1" ]; then
  echo "No database URL provided, using Supabase URL from environment"
  DB_URL=${SUPABASE_DB_URL:-"postgresql://postgres:postgres@localhost:5432/postgres"}
else
  DB_URL=$1
fi

# Directory containing the fix scripts
FIX_DIR="$(dirname "$0")"

echo "Applying security fixes to database..."

# Apply the fixes in the correct order
psql "$DB_URL" -f "$FIX_DIR/fix_security_invoker_views.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_function_search_path.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_additional_function_search_paths.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_more_function_search_paths.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_additional_function_security.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_more_functions_security.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_more_functions_security_part2.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_more_functions_security_part3.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_leaderboard_views.sql" && \
psql "$DB_URL" -f "$FIX_DIR/fix_player_view_own_goals.sql"

# Check if all scripts executed successfully
if [ $? -eq 0 ]; then
  echo "All security fixes applied successfully."
else
  echo "Error applying security fixes. Please check the error messages above."
  exit 1
fi

echo "Done!" 