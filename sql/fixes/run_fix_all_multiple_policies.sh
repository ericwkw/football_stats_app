#!/bin/bash

# Run the fix for multiple permissive policies on all affected tables
# This addresses the Supabase performance issue

echo "Fixing multiple permissive policies for all tables..."
psql "$DATABASE_URL" -f sql/fixes/fix_all_multiple_permissive_policies.sql

echo "Fix applied successfully!" 