#!/bin/bash

# Script to apply Row Level Security optimization fixes
# This script fixes the issue where auth.role() is re-evaluated for each row in RLS policies

# Display informational message
echo "Running RLS policy optimizations..."
echo "This will replace auth.role() with (SELECT auth.role()) to improve query performance"

# Set variables for database connection
# You can modify these or use environment variables
DB_NAME=${DB_NAME:-"postgres"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

# Apply fix for teams table only
fix_teams_only() {
  echo "Applying fix for teams table only..."
  psql -d "$DB_NAME" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -f "fix_teams_rls_policy.sql"
  echo "Teams table RLS policy optimized."
}

# Apply fix for all tables
fix_all_tables() {
  echo "Applying fix for all tables..."
  psql -d "$DB_NAME" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -f "fix_all_rls_policies.sql"
  echo "All RLS policies optimized."
}

# Display usage information
show_usage() {
  echo "Usage: $0 [option]"
  echo "Options:"
  echo "  --teams-only    Apply fix only to teams table"
  echo "  --all-tables    Apply fix to all tables (default)"
  echo "  --help          Show this help message"
}

# Process command line arguments
if [ $# -eq 0 ]; then
  # Default behavior if no arguments provided
  fix_all_tables
else
  case "$1" in
    --teams-only)
      fix_teams_only
      ;;
    --all-tables)
      fix_all_tables
      ;;
    --help)
      show_usage
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
fi

echo "RLS optimization complete!" 