-- SQL script to create a custom RPC function to fetch player match statistics with match details
-- This is an alternative to fixing the relationship between player_stats_with_assignments and matches

-- Begin transaction
BEGIN;

-- Create a custom function that returns all the data needed for the player page in a single call
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
    player_match_stats pms
  LEFT JOIN
    player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
  LEFT JOIN
    players p ON pms.player_id = p.id
  LEFT JOIN
    teams t ON pma.team_id = t.id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    teams ht ON m.home_team_id = ht.id
  LEFT JOIN
    teams at ON m.away_team_id = at.id
  WHERE
    pms.player_id = player_id_param::uuid
  ORDER BY
    m.match_date DESC, pms.id DESC;
$$;

-- Grant permissions to the function
COMMENT ON FUNCTION get_player_match_statistics(text) IS 'Retrieves all match statistics for a player with complete match details';
GRANT EXECUTE ON FUNCTION get_player_match_statistics TO authenticated;

-- Create another function that returns the data in a more nested structure if preferred
CREATE OR REPLACE FUNCTION get_player_match_statistics_nested(player_id_param text)
RETURNS jsonb
LANGUAGE plpgsql
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
    player_match_stats pms
  LEFT JOIN
    player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
  LEFT JOIN
    players p ON pms.player_id = p.id
  LEFT JOIN
    teams t ON pma.team_id = t.id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    teams ht ON m.home_team_id = ht.id
  LEFT JOIN
    teams at ON m.away_team_id = at.id
  WHERE
    pms.player_id = player_id_param::uuid
  ORDER BY
    m.match_date DESC, pms.id DESC;
    
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant permissions to the nested function
COMMENT ON FUNCTION get_player_match_statistics_nested(text) IS 'Retrieves all match statistics for a player with complete match details in a nested JSON structure';
GRANT EXECUTE ON FUNCTION get_player_match_statistics_nested TO authenticated;

COMMIT;

-- Explanation of client-side usage:
/*
 * Instead of using:
 *
 * const { data: matchStatsData, error: matchStatsError } = await supabase
 *   .from('player_stats_with_assignments')
 *   .select(`
 *     id,
 *     match_id,
 *     goals,
 *     assists,
 *     minutes_played,
 *     assigned_team_id,
 *     matches (
 *       id,
 *       match_date,
 *       venue,
 *       match_type,
 *       home_score,
 *       away_score,
 *       home_team:home_team_id (name),
 *       away_team:away_team_id (name)
 *     )
 *   `)
 *   .eq('player_id', playerId)
 *   .order('id', { ascending: false });
 *
 * You can use:
 *
 * const { data: matchStatsData, error: matchStatsError } = await supabase
 *   .rpc('get_player_match_statistics', { player_id_param: playerId });
 *
 * Or if you prefer the nested structure:
 *
 * const { data: matchStatsData, error: matchStatsError } = await supabase
 *   .rpc('get_player_match_statistics_nested', { player_id_param: playerId });
 *
 * This avoids the need for Supabase to understand the relationship between
 * player_stats_with_assignments and matches in the schema cache.
 */ 