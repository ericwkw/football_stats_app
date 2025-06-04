-- Fix more function search path issues
-- This script sets explicit search paths for additional functions to eliminate security warnings

BEGIN;

-- Fix get_simplified_leaderboards function
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

-- Fix get_player_match_statistics function
CREATE OR REPLACE FUNCTION get_player_match_statistics(player_id_param text)
RETURNS TABLE (
  stat_id uuid,
  player_id uuid,
  match_id uuid,
  goals integer,
  assists integer,
  own_goals integer,
  minutes_played integer,
  created_at timestamptz,
  assigned_team_id uuid,
  player_name text,
  player_position text,
  team_name text,
  team_color text,
  match_date date,
  venue text,
  match_type text,
  home_score integer,
  away_score integer,
  home_team_name text,
  away_team_name text
)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    pms.id AS stat_id,
    pms.player_id,
    pms.match_id,
    pms.goals,
    pms.assists,
    pms.own_goals,
    pms.minutes_played,
    pms.created_at,
    pma.team_id AS assigned_team_id,
    p.name AS player_name,
    p.position AS player_position,
    t.name AS team_name,
    t.primary_shirt_color AS team_color,
    m.match_date,
    m.venue,
    m.match_type,
    m.home_score,
    m.away_score,
    ht.name AS home_team_name,
    at.name AS away_team_name
  FROM
    public.player_match_stats pms
  LEFT JOIN
    public.player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
  LEFT JOIN
    public.players p ON pms.player_id = p.id
  LEFT JOIN
    public.teams t ON pma.team_id = t.id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.teams ht ON m.home_team_id = ht.id
  LEFT JOIN
    public.teams at ON m.away_team_id = at.id
  WHERE
    pms.player_id = player_id_param::uuid
  ORDER BY
    m.match_date DESC, pms.id DESC;
$$;

-- Grant permissions
COMMENT ON FUNCTION get_player_match_statistics(text) IS 'Retrieves all match statistics for a player with complete match details';
GRANT EXECUTE ON FUNCTION get_player_match_statistics TO authenticated;

-- Fix get_player_match_statistics_nested function
CREATE OR REPLACE FUNCTION get_player_match_statistics_nested(player_id_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', pms.id,
        'player_id', pms.player_id,
        'match_id', pms.match_id,
        'goals', pms.goals,
        'assists', pms.assists,
        'own_goals', pms.own_goals,
        'minutes_played', pms.minutes_played,
        'created_at', pms.created_at,
        'assigned_team_id', pma.team_id,
        'player_name', p.name,
        'player_position', p.position,
        'team_name', t.name,
        'team_color', t.primary_shirt_color,
        'match', jsonb_build_object(
          'id', m.id,
          'match_date', m.match_date,
          'venue', m.venue,
          'match_type', m.match_type,
          'home_score', m.home_score,
          'away_score', m.away_score,
          'home_team', jsonb_build_object('name', ht.name),
          'away_team', jsonb_build_object('name', at.name)
        )
      )
    )
  INTO result
  FROM
    public.player_match_stats pms
  LEFT JOIN
    public.player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
  LEFT JOIN
    public.players p ON pms.player_id = p.id
  LEFT JOIN
    public.teams t ON pma.team_id = t.id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.teams ht ON m.home_team_id = ht.id
  LEFT JOIN
    public.teams at ON m.away_team_id = at.id
  WHERE
    pms.player_id = player_id_param::uuid
  ORDER BY
    m.match_date DESC, pms.id DESC;
    
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant permissions
COMMENT ON FUNCTION get_player_match_statistics_nested(text) IS 'Retrieves all match statistics for a player with complete match details in a nested JSON structure';
GRANT EXECUTE ON FUNCTION get_player_match_statistics_nested TO authenticated;

-- Fix exec_sql function - note that this intentionally uses SECURITY DEFINER with restricted access
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Restrict access to the function
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Comment on the function to document its purpose and security implications
COMMENT ON FUNCTION exec_sql(text) IS 
'Admin function to execute arbitrary SQL. 
SECURITY WARNING: This function runs with elevated privileges and explicitly sets search_path=public.
Only grant access to trusted roles.';

COMMIT; 