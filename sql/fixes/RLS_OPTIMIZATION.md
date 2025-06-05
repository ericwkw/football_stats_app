# Row Level Security (RLS) Policy Optimization

## Issue 1: Inefficient Function Evaluation

The application had an RLS performance issue with tables using the following pattern in their security policies:

```sql
CREATE POLICY "Allow admin write access" ON table_name FOR ALL USING (auth.role() = 'authenticated');
```

This approach causes `auth.role()` to be re-evaluated for each row during queries, resulting in suboptimal performance at scale.

### Solution

The fix involves replacing direct function calls with subqueries, which are evaluated only once:

```sql
CREATE POLICY "Allow admin write access" ON table_name FOR ALL USING ((SELECT auth.role()) = 'authenticated');
```

This change ensures that `auth.role()` is evaluated only once per query rather than once per row, significantly improving performance for large tables.

## Issue 2: Multiple Permissive Policies

Supabase detected multiple permissive policies for the same role and action on multiple tables:

1. `public.matches` table:
   - "Allow admin write access" (FOR ALL, including SELECT)
   - "Allow public read access" (FOR SELECT)

2. `public.player_match_assignments` table:
   - "Allow admin write access" (FOR ALL, including SELECT)
   - "Allow public read access" (FOR SELECT)

Having multiple permissive policies for the same role and action is suboptimal for performance, as each policy must be executed for every relevant query.

### Solution

The fix involves creating separate policies for each specific action type to avoid overlap:

1. Create a dedicated SELECT policy that applies to all users
2. Create separate policies for each write operation (INSERT, UPDATE, DELETE) that only apply to authenticated users

```sql
-- First, drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.table_name;
DROP POLICY IF EXISTS "Allow admin write access" ON public.table_name;
DROP POLICY IF EXISTS "Allow admin insert" ON public.table_name;
DROP POLICY IF EXISTS "Allow admin update" ON public.table_name;
DROP POLICY IF EXISTS "Allow admin delete" ON public.table_name;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.table_name;

-- For read access (anyone can read)
CREATE POLICY "Allow public read access" ON public.table_name
FOR SELECT
USING (true);

-- For insert operations (only authenticated users)
CREATE POLICY "Allow admin insert" ON public.table_name
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- For update operations (only authenticated users)
CREATE POLICY "Allow admin update" ON public.table_name
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- For delete operations (only authenticated users)
CREATE POLICY "Allow admin delete" ON public.table_name
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');
```

This approach ensures there is only one policy per action type, avoiding the performance penalty of multiple permissive policies.

### Handling Existing Policies

Our fix scripts are designed to handle cases where policies may already exist by first dropping all potentially conflicting policies before creating new ones. This prevents errors like "policy X already exists" and ensures a clean implementation.

## Affected Tables

The following tables had their RLS policies optimized:

- `public.teams`
- `public.players`
- `public.matches`
- `public.player_match_stats`
- `public.player_match_assignments`

## Implementation

SQL files created to address these issues:

1. `fix_teams_rls_policy.sql` - Fixes only the `teams` table RLS policy (function evaluation issue)
2. `fix_all_rls_policies.sql` - Comprehensive fix for the function evaluation issue for all tables
3. `fix_matches_rls_policy.sql` - Fixes the multiple permissive policies issue for the matches table
4. `fix_player_match_assignments_rls_policy.sql` - Fixes the multiple permissive policies issue for the player_match_assignments table
5. `fix_all_multiple_permissive_policies.sql` - Comprehensive fix for the multiple permissive policies issue for all tables

The setup scripts (`complete_database_setup.sql` and `SUPABASE_SETUP.md`) were also updated to use the optimized approach for future deployments.

### Running the Fixes

To apply these fixes to your database, you can use the following shell scripts:

1. `run_rls_fixes.sh` - Applies the function evaluation fixes
2. `run_fix_matches_policy.sh` - Applies only the matches table multiple permissive policies fix
3. `run_fix_player_match_assignments_policy.sh` - Applies only the player_match_assignments table multiple permissive policies fix
4. `run_fix_all_multiple_policies.sh` - Applies the multiple permissive policies fix to all tables (recommended)

## Additional Information

These optimizations follow the recommendations from Supabase documentation for handling RLS policies efficiently. For more information, see the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security). 