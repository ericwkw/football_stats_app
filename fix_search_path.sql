-- fix_search_path.sql
-- This script fixes mutable search paths for all functions
-- by first identifying the exact function signatures and then applying the fix

-- Step 1: Create a temporary table to store function information
CREATE TEMP TABLE function_signatures AS
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as function_args
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
    );

-- Step 2: Function to execute dynamic SQL
CREATE OR REPLACE FUNCTION exec_alter_function()
RETURNS void AS $$
DECLARE
    func_rec record;
    alter_sql text;
BEGIN
    FOR func_rec IN 
        SELECT * FROM function_signatures
    LOOP
        alter_sql := format('ALTER FUNCTION %I.%I(%s) SET search_path = public;', 
                          func_rec.schema_name, 
                          func_rec.function_name,
                          func_rec.function_args);
        
        RAISE NOTICE 'Executing: %', alter_sql;
        
        BEGIN
            EXECUTE alter_sql;
            RAISE NOTICE 'Successfully altered function %', func_rec.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error altering function % : %', func_rec.function_name, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the function
SELECT exec_alter_function();

-- Step 4: Clean up
DROP FUNCTION exec_alter_function();
DROP TABLE function_signatures;

-- Done! All functions should now have their search paths set to 'public' 