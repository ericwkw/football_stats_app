-- Fix missing matches_played field in leaderboard views
-- This script adds the missing field to make the views compatible with the frontend

BEGIN;

-- Update top_scorers_view to include matches_played
DROP VIEW IF EXISTS top_scorers_view;

CREATE OR REPLACE VIEW top_scorers_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COUNT(DISTINCT pms.match_id) as matches_played,
  COALESCE(SUM(pms.goals), 0)::bigint as goals,
  COALESCE(SUM(
    CASE 
      WHEN m.match_type = 'external_game' THEN pms.goals * 3
      ELSE pms.goals
    END
  ), 0) as weighted_goals
FROM 
  public.players p
LEFT JOIN 
  public.player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  public.matches m ON pms.match_id = m.id
GROUP BY 
  p.id, p.name
ORDER BY
  weighted_goals DESC, goals DESC, p.name;

-- Set security to INVOKER for top_scorers_view
ALTER VIEW top_scorers_view SET (security_invoker = true);
ALTER VIEW top_scorers_view OWNER TO postgres;
GRANT SELECT ON top_scorers_view TO authenticated;

-- Update top_assists_view to include matches_played
DROP VIEW IF EXISTS top_assists_view;

CREATE OR REPLACE VIEW top_assists_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COUNT(DISTINCT pms.match_id) as matches_played,
  COALESCE(SUM(pms.assists), 0)::bigint as assists,
  COALESCE(SUM(
    CASE 
      WHEN m.match_type = 'external_game' THEN pms.assists * 3
      ELSE pms.assists
    END
  ), 0) as weighted_assists
FROM 
  public.players p
LEFT JOIN 
  public.player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  public.matches m ON pms.match_id = m.id
GROUP BY 
  p.id, p.name
ORDER BY
  weighted_assists DESC, assists DESC, p.name;

-- Set security to INVOKER for top_assists_view
ALTER VIEW top_assists_view SET (security_invoker = true);
ALTER VIEW top_assists_view OWNER TO postgres;
GRANT SELECT ON top_assists_view TO authenticated;

-- Update the get_simplified_leaderboards function to reference the public schema
CREATE OR REPLACE FUNCTION get_simplified_leaderboards()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
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
      'matches_played', matches_played,
      'goals', goals,
      'weighted_goals', weighted_goals
    )
  )
  INTO top_scorers
  FROM public.top_scorers_view
  LIMIT 5;
  
  -- Get top assists
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', player_id,
      'player_name', player_name,
      'matches_played', matches_played,
      'assists', assists,
      'weighted_assists', weighted_assists
    )
  )
  INTO top_assists
  FROM public.top_assists_view
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
  FROM public.top_goalkeepers_view
  LIMIT 5;
  
  RETURN jsonb_build_object(
    'top_scorers', COALESCE(top_scorers, '[]'::jsonb),
    'top_assists', COALESCE(top_assists, '[]'::jsonb),
    'top_goalkeepers', COALESCE(top_goalkeepers, '[]'::jsonb)
  );
END;
$$;

-- Grant permissions
COMMENT ON FUNCTION get_simplified_leaderboards() IS 'Returns simplified leaderboard data for FCB United players';
GRANT EXECUTE ON FUNCTION get_simplified_leaderboards() TO authenticated;

COMMIT; 