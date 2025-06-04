# Database Security Fixes

This directory contains SQL scripts to fix various security issues identified in the database schema. These issues were primarily related to search path vulnerabilities and security definer settings.

## Issue 1: Security Definer Views

Views with `SECURITY DEFINER` property run with the permissions of the view creator instead of the querying user, which can bypass Row Level Security (RLS) policies.

Fixed in:
- `fix_security_invoker_views.sql` - Makes views use `SECURITY INVOKER`

## Issue 2: Function Search Path Mutable

Functions without an explicit `search_path` set allow potential attackers to manipulate the schema search order, which could lead to privilege escalation.

Fixed in:
- `fix_function_search_path.sql` - Adds `SET search_path = public` to functions:
  - `get_internal_top_goalkeepers`
  - `get_internal_top_assists`

- `fix_additional_function_search_paths.sql` - Adds `SET search_path = public` to:
  - `get_all_internal_players`

- `fix_more_function_search_paths.sql` - Adds `SET search_path = public` to:
  - `get_simplified_leaderboards`
  - `get_player_match_statistics`
  - `get_player_match_statistics_nested`
  - `exec_sql` (though this intentionally uses SECURITY DEFINER for admin purposes)

## Issue 3: Missing Fields in Leaderboard Views

The frontend expects certain fields that were missing in some views.

Fixed in:
- `fix_leaderboard_views.sql` - Adds missing `matches_played` field to:
  - `top_scorers_view`
  - `top_assists_view`
  - Also updates the `get_simplified_leaderboards` function to include this field

## How to Apply Fixes

1. Log into the Supabase dashboard
2. Navigate to the SQL Editor
3. Execute each fix script in the following order:
   - `fix_security_invoker_views.sql`
   - `fix_function_search_path.sql`
   - `fix_additional_function_search_paths.sql`
   - `fix_more_function_search_paths.sql`
   - `fix_leaderboard_views.sql`

## Validation

After applying the fixes, verify that:
1. All views have `security_invoker = true` setting
2. All functions (except admin functions) use `SECURITY INVOKER`
3. All functions have explicit `SET search_path = public`
4. The dashboard displays leaderboards correctly without "matches_played does not exist" error

## Related Security Best Practices

1. Always use `SECURITY INVOKER` for functions and views unless there's a specific reason to use `SECURITY DEFINER`
2. Always set an explicit search path with `SET search_path = public` in function definitions
3. Use fully qualified table names (e.g., `public.players` instead of just `players`)
4. For any `SECURITY DEFINER` functions:
   - Always set explicit search path
   - Restrict access with proper `GRANT` permissions
   - Document the security implications 