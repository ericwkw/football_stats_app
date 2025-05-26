-- Safe Database Renaming Script
-- This script updates comments and function descriptions from "Soccer Stats" to "Football Stats"
-- without altering any table structures or function logic

-- 1. Update function comments/descriptions
COMMENT ON FUNCTION get_top_scorers(integer) IS 'Function to get top scorers for the Football Stats application';
COMMENT ON FUNCTION get_team_statistics() IS 'Function to get team statistics for the Football Stats application';
COMMENT ON FUNCTION get_all_player_statistics() IS 'Function to get all player statistics for the Football Stats application';
COMMENT ON FUNCTION get_player_statistics(text) IS 'Function to get statistics for a specific player in the Football Stats application';
COMMENT ON FUNCTION get_team_player_statistics(text) IS 'Function to get player statistics for a specific team in the Football Stats application';
COMMENT ON FUNCTION get_player_win_impact(integer) IS 'Function to analyze how players affect team win rates in the Football Stats application';
COMMENT ON FUNCTION get_player_combinations(integer, integer) IS 'Function to identify effective player pairings in the Football Stats application';
COMMENT ON FUNCTION get_team_performance_with_player(text, text) IS 'Function to analyze team performance with and without a specific player in the Football Stats application';
COMMENT ON FUNCTION get_player_all_teams_impact(text) IS 'Function to analyze player impact across all teams they have played for in the Football Stats application';
COMMENT ON FUNCTION get_player_team_combinations(text, text) IS 'Function to find optimal player combinations within teams in the Football Stats application';

-- 2. Update table comments (if any exist)
COMMENT ON TABLE player_match_assignments IS 'Stores the team assignment for each player in each match for the Football Stats application';

-- 3. Note for the user: Database name
-- NOTE: This script does not change the actual database name.
-- If you want to rename your database from 'soccer_stats' to 'football_stats',
-- you would need to create a new database and migrate all data,
-- then update connection strings in your application.

-- 4. Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Football Stats database comments updated successfully';
END $$; 