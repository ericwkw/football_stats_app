-- Script to drop player impact analysis functions
-- Use this script if you're encountering errors about existing functions with different return types

-- Drop player impact functions if they exist
DROP FUNCTION IF EXISTS get_player_win_impact(integer);
DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);

SELECT 'Player impact functions have been dropped successfully.' as status; 