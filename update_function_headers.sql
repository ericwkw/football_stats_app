-- Function Header Update Script
-- This script updates function headers to use "Football Stats" terminology
-- It takes a conservative approach to minimize risks of breaking functionality

-- We will NOT drop and recreate functions as that could break references
-- Instead, we'll only update function headers for key functions

-- Create a helper function to safely update function headers
CREATE OR REPLACE FUNCTION temp_update_function_header(
  function_name text,
  function_args text,
  new_comment text
) RETURNS void AS $$
DECLARE
  cmd text;
BEGIN
  -- Check if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = function_name
  ) THEN
    -- Update function comment
    cmd := format('COMMENT ON FUNCTION public.%I(%s) IS %L', 
                 function_name, function_args, new_comment);
    EXECUTE cmd;
    RAISE NOTICE 'Updated comment for function %', function_name;
  ELSE
    RAISE NOTICE 'Function % does not exist, skipping', function_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update main function headers
SELECT temp_update_function_header('get_top_scorers', 'integer', 
  'Returns top scorers for the Football Stats application with weighted goals');

SELECT temp_update_function_header('get_team_statistics', '', 
  'Returns team statistics for the Football Stats application');

SELECT temp_update_function_header('get_all_player_statistics', '', 
  'Returns statistics for all players in the Football Stats application');

SELECT temp_update_function_header('get_player_statistics', 'text', 
  'Returns statistics for a specific player in the Football Stats application');

SELECT temp_update_function_header('get_player_win_impact', 'integer', 
  'Analyzes how players affect team win rates in the Football Stats application');

SELECT temp_update_function_header('get_team_performance_with_player', 'text, text', 
  'Analyzes team performance with and without a specific player in the Football Stats application');

SELECT temp_update_function_header('get_simplified_leaderboards', '', 
  'Returns simplified leaderboards for the Football Stats application');

SELECT temp_update_function_header('get_internal_team_statistics', '', 
  'Returns team statistics for internal teams in the Football Stats application');

SELECT temp_update_function_header('get_club_team_statistics', '', 
  'Returns team statistics for club teams in the Football Stats application');

-- Clean up the temporary function
DROP FUNCTION IF EXISTS temp_update_function_header(text, text, text); 