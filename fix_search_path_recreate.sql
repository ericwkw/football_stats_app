-- fix_search_path_recreate.sql
-- This approach recreates functions with proper security settings

-- Function to get the definition of a function and modify it to include search_path
DO $$
DECLARE
    func_rec RECORD;
    func_def TEXT;
    new_func_def TEXT;
    search_path_clause TEXT := 'SET search_path = public';
    security_clause TEXT := 'SECURITY INVOKER';
BEGIN
    -- For each function with mutable search path
    FOR func_rec IN 
        SELECT 
            p.oid,
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_functiondef(p.oid) AS function_definition
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
            AND NOT EXISTS (
                SELECT 1 FROM pg_settings WHERE name = 'search_path' AND source = func_rec.oid::text
            )
    LOOP
        func_def := func_rec.function_definition;
        
        -- Check if the function already has SECURITY DEFINER/INVOKER
        IF func_def ~* 'SECURITY (DEFINER|INVOKER)' THEN
            -- Function already has security clause
            -- Replace with SECURITY INVOKER if needed
            func_def := regexp_replace(func_def, 'SECURITY (DEFINER|INVOKER)', security_clause, 'i');
        ELSE
            -- Function doesn't have security clause, add it before AS
            func_def := regexp_replace(func_def, 'AS(\s*)(\$\$|\$[a-zA-Z0-9_]*\$)', 
                                      format('%s AS\1\2', security_clause), 'i');
        END IF;
        
        -- Check if the function already has SET search_path
        IF func_def ~* 'SET search_path =' THEN
            -- Already has search path, replace it
            func_def := regexp_replace(func_def, 'SET search_path = [^;]*', search_path_clause, 'i');
        ELSE
            -- Doesn't have search path, add it
            func_def := regexp_replace(func_def, security_clause, 
                                      format('%s\n%s', security_clause, search_path_clause), 'i');
        END IF;
        
        -- Drop and recreate function
        BEGIN
            RAISE NOTICE 'Recreating function %', func_rec.function_name;
            EXECUTE func_def;
            RAISE NOTICE 'Successfully fixed function %', func_rec.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error fixing function %: %', func_rec.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Report which functions still have mutable search paths
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_setting,
    CASE WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH SET (MUTABLE)' 
         ELSE 'SEARCH PATH SET: ' || array_to_string(p.proconfig, ', ')
    END as search_path_setting
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proconfig IS NULL
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
    function_name; 