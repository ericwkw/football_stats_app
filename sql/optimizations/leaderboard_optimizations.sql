-- SQL script to optimize leaderboard views
-- Since all players belong to FCB United, we can simplify the leaderboard displays

BEGIN;

-- Create or replace view for top scorers without team column
CREATE OR REPLACE VIEW top_scorers_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COALESCE(SUM(pms.goals), 0)::bigint as goals,
  COALESCE(SUM(
    CASE 
      WHEN m.match_type = 'external_game' THEN pms.goals * 3
      ELSE pms.goals
    END
  ), 0) as weighted_goals
FROM 
  players p
LEFT JOIN 
  player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  matches m ON pms.match_id = m.id
GROUP BY 
  p.id, p.name
ORDER BY
  weighted_goals DESC, goals DESC, p.name;

-- Set security to INVOKER for top_scorers_view
ALTER VIEW top_scorers_view SET (security_invoker = true);
ALTER VIEW top_scorers_view OWNER TO postgres;
GRANT SELECT ON top_scorers_view TO authenticated;

-- Create or replace view for top assists without team column
CREATE OR REPLACE VIEW top_assists_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COALESCE(SUM(pms.assists), 0)::bigint as assists,
  COALESCE(SUM(
    CASE 
      WHEN m.match_type = 'external_game' THEN pms.assists * 3
      ELSE pms.assists
    END
  ), 0) as weighted_assists
FROM 
  players p
LEFT JOIN 
  player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  matches m ON pms.match_id = m.id
GROUP BY 
  p.id, p.name
ORDER BY
  weighted_assists DESC, assists DESC, p.name;

-- Set security to INVOKER for top_assists_view
ALTER VIEW top_assists_view SET (security_invoker = true);
ALTER VIEW top_assists_view OWNER TO postgres;
GRANT SELECT ON top_assists_view TO authenticated;

-- Create or replace view for top goalkeepers without team column
CREATE OR REPLACE VIEW top_goalkeepers_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COUNT(DISTINCT pms.match_id) as matches_played,
  COALESCE(SUM(
    CASE 
      WHEN p.position = 'Goalkeeper' AND 
           (
             (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
             (pma.team_id = m.away_team_id AND m.home_score = 0)
           )
      THEN 1
      ELSE 0
    END
  ), 0)::bigint as clean_sheets,
  CASE 
    WHEN COUNT(DISTINCT pms.match_id) > 0 THEN
      ROUND((COALESCE(SUM(
        CASE 
          WHEN p.position = 'Goalkeeper' AND 
               (
                 (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
                 (pma.team_id = m.away_team_id AND m.home_score = 0)
               )
          THEN 1
          ELSE 0
        END
      ), 0)::numeric / COUNT(DISTINCT pms.match_id)) * 100, 1)
    ELSE 0
  END as clean_sheet_percentage
FROM 
  players p
LEFT JOIN 
  player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  matches m ON pms.match_id = m.id
LEFT JOIN
  player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
WHERE
  p.position = 'Goalkeeper'
GROUP BY 
  p.id, p.name
ORDER BY
  clean_sheets DESC, clean_sheet_percentage DESC, matches_played DESC, p.name;

-- Set security to INVOKER for top_goalkeepers_view
ALTER VIEW top_goalkeepers_view SET (security_invoker = true);
ALTER VIEW top_goalkeepers_view OWNER TO postgres;
GRANT SELECT ON top_goalkeepers_view TO authenticated;

-- Create function to get simplified leaderboard data
CREATE OR REPLACE FUNCTION get_simplified_leaderboards()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  top_scorers jsonb;
  top_assists jsonb;
  top_goalkeepers jsonb;
BEGIN
  -- Get top scorers
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', player_id,
      'player_name', player_name,
      'goals', goals,
      'weighted_goals', weighted_goals
    )
  )
  INTO top_scorers
  FROM top_scorers_view
  LIMIT 5;
  
  -- Get top assists
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', player_id,
      'player_name', player_name,
      'assists', assists,
      'weighted_assists', weighted_assists
    )
  )
  INTO top_assists
  FROM top_assists_view
  LIMIT 5;
  
  -- Get top goalkeepers
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', player_id,
      'player_name', player_name,
      'matches_played', matches_played,
      'clean_sheets', clean_sheets,
      'clean_sheet_percentage', clean_sheet_percentage
    )
  )
  INTO top_goalkeepers
  FROM top_goalkeepers_view
  LIMIT 5;
  
  RETURN jsonb_build_object(
    'top_scorers', COALESCE(top_scorers, '[]'::jsonb),
    'top_assists', COALESCE(top_assists, '[]'::jsonb),
    'top_goalkeepers', COALESCE(top_goalkeepers, '[]'::jsonb)
  );
END;
$$;

-- Grant permissions to the function
COMMENT ON FUNCTION get_simplified_leaderboards() IS 'Returns simplified leaderboard data for FCB United players';
GRANT EXECUTE ON FUNCTION get_simplified_leaderboards() TO authenticated;

COMMIT; 