# Player Impact Analysis Functions: Solution Guide

## Error Resolution

You encountered this error when trying to create the SQL functions:

```
ERROR: 42P13: cannot change return type of existing function
DETAIL: Row type defined by OUT parameters is different.
HINT: Use DROP FUNCTION get_player_win_impact(integer) first.
```

This happens because you already have these functions in your database but with different return types or parameters.

## Solution Steps

I've created several files to help you implement these functions correctly:

1. **drop_player_impact_functions.sql** - A script that only drops the existing functions
2. **player_impact_functions.sql** - Updated to drop functions first, then create them
3. **all_sql_functions.sql** - Includes all app functions with proper drop statements
4. **DEPLOY_FUNCTIONS_UPDATED.md** - Updated deployment instructions

## Recommended Approach

### Option 1: Execute via Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor section
3. Run this SQL command first:
   ```sql
   DROP FUNCTION IF EXISTS get_player_win_impact(integer);
   DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
   DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);
   ```
4. Then run the entire contents of `player_impact_functions.sql`

### Option 2: Using psql (if you have direct database access)

```bash
psql your_database_connection_string -f drop_player_impact_functions.sql
psql your_database_connection_string -f player_impact_functions.sql
```

## Verifying the Solution

After deploying, run these test queries:

```sql
-- Check function existence
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name IN ('get_player_win_impact', 'get_player_combinations', 'get_team_performance_with_player');

-- Test get_player_win_impact
SELECT * FROM get_player_win_impact(5);

-- Test get_player_combinations
SELECT * FROM get_player_combinations(3, 5);
```

## Important Notes

1. The error occurred because these functions already existed in your database but with different return types.
2. The `DROP FUNCTION IF EXISTS` statements now handle this scenario by removing the old versions first.
3. All functions have been implemented according to the requirements.
4. The UI components in your app were already correctly set up to use these functions.

## Next Steps

1. Deploy the updated SQL functions using one of the methods above
2. Start your app with `npm run dev` to test the analytics features
3. Visit the analytics page and player detail pages to confirm the charts are working correctly 