#!/bin/bash

# Run the fix for multiple permissive policies on matches table
# This addresses the Supabase performance issue

echo "Fixing multiple permissive policies for matches table..."
psql "$DATABASE_URL" -f sql/fixes/fix_matches_rls_policy.sql

echo "Fix applied successfully!" 