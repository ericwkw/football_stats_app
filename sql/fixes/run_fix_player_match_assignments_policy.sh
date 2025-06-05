#!/bin/bash

# Run the fix for multiple permissive policies on player_match_assignments table
# This addresses the Supabase performance issue

echo "Fixing multiple permissive policies for player_match_assignments table..."
psql "$DATABASE_URL" -f sql/fixes/fix_player_match_assignments_rls_policy.sql

echo "Fix applied successfully!" 