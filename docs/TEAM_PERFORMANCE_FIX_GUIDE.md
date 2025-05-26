# Fix for "Failed to fetch team performance data: {}" Error

This document provides a step-by-step solution to fix the error occurring when trying to view player team performance analytics.

## The Problem

The error occurs when the application tries to call the `get_team_performance_with_player` SQL function but either:
1. The function isn't properly defined in the database
2. There's an error in parameter handling 
3. The function is failing silently and returning an empty result

## Solution 1: Fix the Database Function

I've created an improved version of the function in `team_performance_fix.sql` that:
- Uses PL/pgSQL instead of SQL for better error handling
- Validates input parameters
- Returns default values when no data is found
- Includes better error reporting

### How to Apply the Fix:

1. Login to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `team_performance_fix.sql`
5. Run the query to update the function

## Solution 2: Use the New Client-Side Error Handling

I've created a `TeamPerformanceWrapper` component that:
- Handles API errors gracefully
- Shows useful error messages to users
- Displays fallback data when the function fails
- Provides a better user experience

This wrapper is now integrated into the player detail page.

## Testing the Fix

1. After applying the database fix, restart your application with `npm run dev`
2. Navigate to a player's detail page
3. The team performance chart should now display properly
4. If there are still issues, you'll see a more informative error message

## Additional Diagnostics

If you continue to experience issues after applying these fixes, here are some diagnostic steps:

1. Check console logs for more specific error details
2. Verify that the SQL function has the correct permissions (`GRANT EXECUTE` statements)
3. Ensure the player and team IDs being passed are valid UUIDs
4. Check that you have match data with the specific player both on and off the team

## Function Ambiguity Error

If you encounter this error:
```
Error fetching team performance: Could not choose the best candidate function between: 
public.get_team_performance_with_player(player_id_param => text, team_id_param => text), 
public.get_team_performance_with_player(team_id_param => uuid, player_id_param => uuid)
```

This means you have multiple versions of the function with different parameter types. The latest version of `team_performance_fix.sql` addresses this by:

1. Dropping all variations of the function (both text and UUID parameter versions)
2. Creating only one canonical version that properly handles parameter type conversion
3. Explicitly handling UUID conversion with proper error reporting
4. Setting appropriate permissions for the function

After applying this fix in Supabase SQL Editor, the ambiguity should be resolved.

## Column Ambiguity Error

If you encounter this error:
```
Error fetching team performance: column reference "scenario" is ambiguous
```

This occurs because the SQL query has multiple references to a column named "scenario" in different subqueries. The latest version of `team_performance_fix.sql` fixes this by:

1. Renaming the scenario column in the subquery to "scenario_label"
2. Using table aliases to explicitly reference columns
3. Restructuring the query to use a cleaner CTE (Common Table Expression) approach

Apply the latest SQL fix to resolve this issue.

## Need Further Support?

If you're still experiencing issues after applying these fixes, check for:

1. Database schema issues (run the diagnostic SQL script)
2. Supabase cache problems (might need to restart the database)
3. Data integrity issues (missing or invalid player/team relationships) 