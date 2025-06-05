# Row Level Security (RLS) Policy Optimization

## Issue

The application had an RLS performance issue with tables using the following pattern in their security policies:

```sql
CREATE POLICY "Allow admin write access" ON table_name FOR ALL USING (auth.role() = 'authenticated');
```

This approach causes `auth.role()` to be re-evaluated for each row during queries, resulting in suboptimal performance at scale.

## Solution

The fix involves replacing direct function calls with subqueries, which are evaluated only once:

```sql
CREATE POLICY "Allow admin write access" ON table_name FOR ALL USING ((SELECT auth.role()) = 'authenticated');
```

This change ensures that `auth.role()` is evaluated only once per query rather than once per row, significantly improving performance for large tables.

## Affected Tables

The following tables had their RLS policies optimized:

- `public.teams`
- `public.players`
- `public.matches`
- `public.player_match_stats`
- `public.player_match_assignments`

## Implementation

Two SQL files were created to address this issue:

1. `fix_teams_rls_policy.sql` - Fixes only the `teams` table RLS policy
2. `fix_all_rls_policies.sql` - Comprehensive fix for all tables with this issue

The setup scripts (`complete_database_setup.sql` and `SUPABASE_SETUP.md`) were also updated to use the optimized approach for future deployments.

## Additional Information

This optimization follows the recommendation from Supabase documentation for handling RLS policies efficiently. For more information, see the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security). 