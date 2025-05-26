DROP FUNCTION IF EXISTS get_internal_all_player_statistics();

CREATE OR REPLACE FUNCTION get_internal_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  clean_sheets bigint,
  weighted_goals numeric,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    t.id as team_id,
    t.name as team_name,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0)::bigint as goals,
    COALESCE(SUM(pms.assists), 0)::bigint as assists,
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
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3
        ELSE pms.assists
      END
    ), 0) as weighted_assists
  FROM 
    players p
  JOIN
    teams t ON p.team_id = t.id
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    t.team_type IN ('internal', 'club')
  GROUP BY 
    p.id, p.name, t.id, t.name
  ORDER BY
    goals DESC, assists DESC, p.name;
$$;
