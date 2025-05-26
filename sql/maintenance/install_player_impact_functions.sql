-- Script to install player impact analysis functions

-- Import the functions
\i player_impact_functions.sql

-- Test the functions
SELECT 'Testing get_player_win_impact function...' as status;
SELECT * FROM get_player_win_impact(5);

SELECT 'Testing get_player_combinations function...' as status;
SELECT * FROM get_player_combinations(3, 5);

-- Note: To test get_team_performance_with_player, you need specific player_id and team_id
-- Get a sample player and their team to test with
SELECT 'Finding sample player and team for testing...' as status;
WITH player_team_sample AS (
  SELECT 
    p.id as player_id, 
    p.name as player_name, 
    p.team_id,
    t.name as team_name
  FROM players p
  JOIN teams t ON p.team_id = t.id
  WHERE p.team_id IS NOT NULL
  LIMIT 1
)
SELECT 
  'Testing get_team_performance_with_player function with ' || 
  player_name || ' (' || player_id || ') and team ' || 
  team_name || ' (' || team_id || ')' as status,
  get_team_performance_with_player(player_id, team_id)
FROM player_team_sample;

SELECT 'All player impact functions installed and tested.' as status; 