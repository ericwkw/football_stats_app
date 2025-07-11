-- fix_search_path_alternative.sql
-- Alternative approach to fix mutable search paths by recreating functions

-- First, create a temp table with the list of functions that need fixing
CREATE TEMP TABLE functions_to_fix (function_name text);

-- Insert the function names from the warning messages
INSERT INTO functions_to_fix VALUES
('get_team_player_combinations'),
('get_team_statistics'),
('get_club_players'),
('get_internal_teams'),
('get_club_teams'),
('get_internal_team_statistics'),
('get_club_team_statistics'),
('get_internal_players'),
('get_club_top_scorers'),
('get_team_top_scorers'),
('get_top_scorers'),
('get_player_win_impact'),
('get_player_combinations'),
('get_team_performance_with_player'),
('get_club_all_player_statistics'),
('get_player_team_combinations'),
('get_internal_top_scorers'),
('get_player_all_teams_impact'),
('get_internal_all_player_statistics'),
('get_team_player_statistics'),
('get_internal_player_statistics'),
('get_club_player_statistics'),
('get_player_statistics'),
('get_all_player_statistics');

-- Create a function to generate and execute the ALTER statements
DO $$
DECLARE
    func_name text;
    func_info record;
    sql_stmt text;
BEGIN
    FOR func_name IN SELECT function_name FROM functions_to_fix
    LOOP
        FOR func_info IN 
            SELECT 
                p.oid, 
                proname, 
                pg_get_function_identity_arguments(p.oid) as args
            FROM 
                pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE 
                n.nspname = 'public' AND p.proname = func_name
        LOOP
            -- Generate ALTER FUNCTION statement with correct signature
            sql_stmt := format('ALTER FUNCTION public.%I(%s) SET search_path = public;', 
                func_info.proname, func_info.args);
            
            RAISE NOTICE 'Executing: %', sql_stmt;
            
            -- Try to execute the statement, catch and report errors
            BEGIN
                EXECUTE sql_stmt;
                RAISE NOTICE 'Successfully fixed function: %(%)', func_info.proname, func_info.args;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error fixing function %(%): %', func_info.proname, func_info.args, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- Clean up
DROP TABLE functions_to_fix;

-- Done! All functions should now have their search paths set to 'public' 