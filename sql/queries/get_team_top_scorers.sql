-- Function to get top scorers for a specific team using player_match_assignments
CREATE OR REPLACE FUNCTION get_team_top_scorers(team_id_param text, limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric,
  matches_played bigint
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0)::bigint as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COUNT(DISTINCT pms.match_id)::bigint as matches_played
  FROM 
    players p
  JOIN 
    player_match_stats pms ON p.id = pms.player_id
  JOIN
    matches m ON pms.match_id = m.id
  JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    pma.team_id = team_id_param::uuid
  GROUP BY 
    p.id, p.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$; 