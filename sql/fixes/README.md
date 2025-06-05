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

- `fix_additional_function_security.sql` - Adds `SECURITY INVOKER` and `SET search_path = public` to:
  - `get_team_player_combinations`
  - `get_team_statistics`
  - `get_club_players`
  - `get_internal_teams`
  - `get_club_teams`
  - `get_internal_teams_statistics`
  - `get_club_team_statistics`

- `fix_more_functions_security.sql` - Adds `SECURITY INVOKER` and `SET search_path = public` to:
  - `get_head_to_head_stats`
  - `get_team_player_statistics`
  - `get_team_top_scorers`
  - `get_player_win_impact`
  - `get_internal_top_scorers`
  - `get_club_top_scorers`
  - `refresh_schema_cache`

- `fix_more_functions_security_part2.sql` - Adds `SECURITY INVOKER` and `SET search_path = public` to:
  - `get_all_player_statistics`
  - `get_player_statistics`
  - `get_player_combinations`
  - `get_internal_all_player_statistics`
  - `get_internal_player_statistics`
  - `get_club_all_player_statistics`
  - `get_club_player_statistics`

- `fix_more_functions_security_part3.sql` - Adds `SECURITY INVOKER` and `SET search_path = public` to:
  - `get_team_performance_with_player`
  - `get_player_all_teams_impact`
  - `get_player_team_combinations`

## Issue 3: Missing Fields in Leaderboard Views

The frontend expects certain fields that were missing in some views.

Fixed in:
- `fix_leaderboard_views.sql` - Adds missing `matches_played` field to:
  - `top_scorers_view`
  - `top_assists_view`
  - Also updates the `get_simplified_leaderboards` function to include this field

## Issue 4: Missing Own Goals Field in Player Stats View

The player details page expects an `own_goals` field that was missing from the `player_stats_with_assignments` view.

Fixed in:
- `fix_player_view_own_goals.sql` - Adds missing `own_goals` field to:
  - `player_stats_with_assignments` view

## How to Apply Fixes

1. Log into the Supabase dashboard
2. Navigate to the SQL Editor
3. Execute each fix script in the following order:
   - `fix_security_invoker_views.sql`
   - `fix_function_search_path.sql`
   - `fix_additional_function_search_paths.sql`
   - `fix_more_function_search_paths.sql`
   - `fix_additional_function_security.sql`
   - `fix_more_functions_security.sql`
   - `fix_more_functions_security_part2.sql`
   - `fix_more_functions_security_part3.sql`
   - `fix_leaderboard_views.sql`
   - `fix_player_view_own_goals.sql`

Alternatively, you can run the `run_security_fixes.sh` script which will apply all fixes in the correct order:
```
./run_security_fixes.sh
```

## Validation

After applying the fixes, verify that:
1. All views have `security_invoker = true` setting
2. All functions (except admin functions) use `SECURITY INVOKER`
3. All functions have explicit `SET search_path = public`
4. The dashboard displays leaderboards correctly without "matches_played does not exist" error
5. Player details pages display correctly without "own_goals does not exist" error

## Related Security Best Practices

1. Always use `SECURITY INVOKER` for functions and views unless there's a specific reason to use `SECURITY DEFINER`
2. Always set an explicit search path with `SET search_path = public` in function definitions
3. Use fully qualified table names (e.g., `public.players` instead of just `players`)
4. For any `SECURITY DEFINER` functions:
   - Always set explicit search path
   - Restrict access with proper `GRANT` permissions
   - Document the security implications 