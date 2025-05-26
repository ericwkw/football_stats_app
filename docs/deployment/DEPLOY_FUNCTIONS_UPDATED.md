# Deploying Player Impact Analysis Functions (Updated)

This document provides updated instructions for deploying the SQL functions needed for the player impact analysis features in the Soccer Stats App, addressing potential errors with existing functions.

## SQL Functions Overview

Three SQL functions need to be deployed to your Supabase database:

1. `get_player_win_impact` - Analyzes how players affect team win rates
2. `get_player_combinations` - Identifies effective player pairings
3. `get_team_performance_with_player` - Compares team performance with/without specific players

## Important: Handling Existing Functions

If you encounter errors like:
```
ERROR: 42P13: cannot change return type of existing function
DETAIL: Row type defined by OUT parameters is different.
HINT: Use DROP FUNCTION get_player_win_impact(integer) first.
```

This means the functions already exist in your database with different return types. The updated SQL scripts now include `DROP FUNCTION IF EXISTS` statements to handle this scenario automatically.

## Deployment Options

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `player_impact_functions.sql` into the editor
   - This script now includes DROP statements to handle existing functions
5. Run the query to create all three functions

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed, you can deploy the functions with:

```bash
supabase functions deploy --project-ref <YOUR_PROJECT_ID> --file player_impact_functions.sql
```

## Alternative: Manual Dropping of Functions

If you still encounter issues, you can manually drop the functions first using:

```sql
DROP FUNCTION IF EXISTS get_player_win_impact(integer);
DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);
```

Then run the creation scripts.

## Verification

After deploying the functions, you can verify they're working properly by running these test queries in the SQL Editor:

```sql
-- Test get_player_win_impact
SELECT * FROM get_player_win_impact(5);

-- Test get_player_combinations
SELECT * FROM get_player_combinations(3, 5);

-- Test get_team_performance_with_player (replace with actual IDs)
SELECT * FROM get_team_performance_with_player('player_id_here', 'team_id_here');
```

## Function Parameters

### get_player_win_impact

- `limit_param`: (default 20) Maximum number of players to return

### get_player_combinations

- `min_matches_param`: (default 3) Minimum matches played together to be included
- `limit_param`: (default 20) Maximum number of combinations to return

### get_team_performance_with_player

- `player_id_param`: UUID of the player to analyze
- `team_id_param`: UUID of the team to analyze

## Troubleshooting

If you encounter errors:

1. Make sure the functions were properly dropped before being recreated
2. Check that your database has the required tables: `players`, `matches`, `player_match_stats`, `player_match_assignments`
3. Verify table structure and column names match those in the SQL functions
4. Ensure there's sufficient data for meaningful analysis
5. Check for syntax errors or PostgreSQL version compatibility issues

For assistance, please contact the development team. 