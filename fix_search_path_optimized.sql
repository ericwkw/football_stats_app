-- fix_search_path_optimized.sql
-- Optimized script to fix mutable search paths with better performance

DO $$
DECLARE
    func_rec RECORD;
    alter_stmt TEXT;
BEGIN
    -- Use a single query to get all target functions and their properties
    -- This avoids repeated catalog lookups for each function
    FOR func_rec IN 
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args,
            p.proconfig IS NULL AS needs_search_path
        FROM 
            pg_proc p
        JOIN 
            pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public'
            AND p.proname IN (
                'get_team_player_combinations',
                'get_team_statistics',
                'get_club_players',
                'get_internal_teams',
                'get_club_teams',
                'get_internal_team_statistics',
                'get_club_team_statistics',
                'get_internal_players',
                'get_club_top_scorers',
                'get_team_top_scorers',
                'get_top_scorers',
                'get_player_win_impact',
                'get_player_combinations',
                'get_team_performance_with_player',
                'get_club_all_player_statistics',
                'get_player_team_combinations',
                'get_internal_top_scorers',
                'get_player_all_teams_impact',
                'get_internal_all_player_statistics',
                'get_team_player_statistics',
                'get_internal_player_statistics',
                'get_club_player_statistics',
                'get_player_statistics',
                'get_all_player_statistics'
            )
            -- Only process functions that actually need a search path fix
            AND p.proconfig IS NULL
    LOOP
        -- Only attempt to fix functions that need it
        IF func_rec.needs_search_path THEN
            -- Generate ALTER FUNCTION statement
            alter_stmt := format('ALTER FUNCTION %I.%I(%s) SET search_path = public;', 
                          func_rec.schema_name, 
                          func_rec.function_name,
                          func_rec.args);
            
            -- Execute with error handling
            BEGIN
                EXECUTE alter_stmt;
                RAISE NOTICE 'Fixed function: %.%(%)', 
                    func_rec.schema_name, func_rec.function_name, func_rec.args;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error fixing %.%(%): %', 
                    func_rec.schema_name, func_rec.function_name, func_rec.args, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Now report on the results of the operation
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
    CASE WHEN p.proconfig IS NULL THEN 'MUTABLE (NOT FIXED)' 
         ELSE 'FIXED: ' || array_to_string(p.proconfig, ', ')
    END as search_path
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname IN (
        'get_team_player_combinations',
        'get_team_statistics',
        'get_club_players',
        'get_internal_teams',
        'get_club_teams',
        'get_internal_team_statistics',
        'get_club_team_statistics',
        'get_internal_players',
        'get_club_top_scorers',
        'get_team_top_scorers',
        'get_top_scorers',
        'get_player_win_impact',
        'get_player_combinations',
        'get_team_performance_with_player',
        'get_club_all_player_statistics',
        'get_player_team_combinations',
        'get_internal_top_scorers',
        'get_player_all_teams_impact',
        'get_internal_all_player_statistics',
        'get_team_player_statistics',
        'get_internal_player_statistics',
        'get_club_player_statistics',
        'get_player_statistics',
        'get_all_player_statistics'
    )
ORDER BY 
    CASE WHEN p.proconfig IS NULL THEN 0 ELSE 1 END, -- Show unfixed functions first
    function_name; 