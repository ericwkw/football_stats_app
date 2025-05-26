# Fixing Player2's Player Impact Data

This document provides instructions for fixing the issue where Player2's impact on FCB United is not showing correctly in the charts.

## The Issue

Player2's player profile page shows zero matches played with FCB United despite having 33 goals for the team. This is due to two main issues:

1. The SQL function `get_player_all_teams_impact` refers to a non-existent table `player_stats` instead of the correct `player_match_stats` table
2. The SQL function `get_team_performance_with_player` has ambiguous column references and isn't correctly identifying matches where Player2 participated

## Steps to Fix

### 1. Execute SQL Fix

Apply the SQL fixes by running the `direct_function_fix.sql` file in the Supabase SQL Editor:

1. Log in to the Supabase dashboard
2. Navigate to the SQL Editor
3. Open the `sql/direct_function_fix.sql` file from this project
4. Execute the SQL script

This script will:
- Drop the problematic functions
- Create new versions that properly use the `player_match_stats` table
- Fix column reference ambiguities
- Update the logic for detecting player participation in matches

### 2. Fix Player Team Assignments (Optional)

If Player2's data still doesn't show correctly after the function fix, you can also run the `sql/fix_team_performance_data.sql` script to fix Player2's team assignments:

1. In the Supabase SQL Editor, open `sql/fix_team_performance_data.sql`
2. Execute the SQL script

This script will:
- Check if Player2 has proper team assignments for matches they played
- Add missing team assignments for FCB United
- Update assignments with NULL team_id

### 3. Test the Fix

After applying the SQL fixes:

1. Restart the application (`npm run dev`)
2. Navigate to Player2's player profile page
3. Check if the charts now display Player2's impact on FCB United correctly
4. Check the debug view to verify the raw data shows matches played

## Diagnostic Tools

For troubleshooting, we've added a diagnostic API endpoint:
- `/api/player-diagnostic/[playerId]` - This provides detailed information about a player's match stats and team assignments

This endpoint will show:
- Player's basic info
- All match assignments
- All match stats
- Team performance data
- Any errors returned from the Supabase APIs

## Long-term Solution

The underlying issue was that the SQL functions were referring to a wrong table name and had ambiguous column references. The fixes provided in this document resolve these issues and should ensure that player impact data is correctly displayed for all players going forward. 