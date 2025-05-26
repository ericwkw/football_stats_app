-- Function to get top scorers with limit
CREATE OR REPLACE FUNCTION get_top_scorers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
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
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$; 