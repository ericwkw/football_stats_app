-- Schema Diagnostic SQL
-- Run this on your Supabase database to understand the current state of functions

-- 1. Check if the functions exist at all
SELECT routine_name, routine_schema, data_type 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_name IN ('get_player_win_impact', 'get_player_combinations', 'get_team_performance_with_player');

-- 2. Check for specific schema/parameter issues
SELECT pg_get_functiondef(f.oid) 
FROM pg_proc f 
JOIN pg_namespace n ON f.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND f.proname IN ('get_player_win_impact', 'get_player_combinations', 'get_team_performance_with_player');

-- 3. Check which schemas exist
SELECT nspname FROM pg_namespace;

-- 4. Check for the specific error about the function
SELECT EXISTS (
  SELECT 1
  FROM pg_proc
  WHERE proname = 'get_player_win_impact'
);

-- 5. Check if player_match_assignments table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'player_match_assignments'
);

-- 6. Check schema search path
SHOW search_path;

-- 7. List Supabase roles to check permission issues
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb
FROM pg_roles;

-- 8. Fix the role issue by granting permission to anon
DO $$
BEGIN
  EXECUTE 'GRANT USAGE ON SCHEMA public TO anon';
  EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon';
  EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated';
  EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role';
END
$$; 