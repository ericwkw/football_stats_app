# Resolving "Function Not Found" Error in Supabase

This guide will help you fix the error: `Failed to fetch player impact data: Could not find the function public.get_player_win_impact(limit_param) in the schema cache`

## Step 1: Diagnose the Issue

The error indicates:
1. The function doesn't exist in the database, OR
2. There's a permission issue with Supabase roles, OR
3. There's a schema path issue

## Step 2: Fix the Function Creation

### Option A: Using Supabase Dashboard SQL Editor

1. Login to your Supabase dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `player_impact_functions_fixed.sql` 
5. Run the query

This script is specifically designed to:
- Explicitly specify the schema as `public`
- Drop any existing functions with more specific parameter names
- Grant execute permissions to all necessary roles

### Option B: Run Diagnostic and Fix Script

If Option A doesn't work, run the diagnostic script:

1. Copy and paste the contents of `schema_diagnostic.sql` into the SQL Editor
2. Run the query to see what might be wrong
3. Pay special attention to:
   - If the functions exist at all
   - Which schema they're in
   - If permissions are set correctly

## Step 3: Verify Function Creation

After running either fix option, verify the functions exist with this query:

```sql
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name IN ('get_player_win_impact', 'get_player_combinations', 'get_team_performance_with_player');
```

You should see all three functions listed in the `public` schema.

## Step 4: Explicitly Grant Permissions

To ensure Supabase's anonymous role can access the functions, run:

```sql
-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_win_impact(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_combinations(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_win_impact(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_combinations(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO authenticated;
```

## Step 5: Test the App

Start your application again with `npm run dev` and navigate to the analytics page. The functions should now work correctly.

## Common Issues and Solutions

### Parameter Names Issue
If the error mentions not finding a function with parameters like `limit_param`, it could be because PostgreSQL doesn't store parameter names in its cache. Try using positional parameters instead of named parameters in your application.

### Schema Issue
If your functions exist but in a different schema than `public`, you'll need to either:
1. Move them to the public schema, or
2. Update your application to use the fully qualified function names

### Permissions Issue
Supabase uses role-based access control. Make sure your functions grant execute permission to the appropriate roles:
- `anon`: For unauthenticated requests
- `authenticated`: For authenticated user requests
- `service_role`: For server-side operations

### Cache Issue
If all else fails, sometimes Supabase's cache needs to be refreshed:
1. Go to your project Dashboard
2. Navigate to Settings -> Database
3. Click "Restart Database" (be careful as this will temporarily disconnect all clients)

## Need More Help?

If you're still having issues, check the Supabase logs in your dashboard for more detailed error messages. 