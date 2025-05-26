-- Fix weighted values for top scorers and top assists functions

-- Update get_internal_top_scorers function
DROP FUNCTION IF EXISTS get_internal_top_scorers(integer);

CREATE OR REPLACE FUNCTION get_internal_top_scorers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  total_goals bigint,
  weighted_goals numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    t.id as team_id,
    t.name as team_name,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals
  FROM 
    players p
  JOIN
    teams t ON p.team_id = t.id
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  WHERE
    t.team_type IN ('internal', 'club')
  GROUP BY 
    p.id, p.name, t.id, t.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$;

-- Update get_internal_top_assists function
DROP FUNCTION IF EXISTS get_internal_top_assists(integer);

CREATE OR REPLACE FUNCTION get_internal_top_assists(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  total_assists bigint,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    t.id as team_id,
    t.name as team_name,
    COALESCE(SUM(pms.assists), 0) as total_assists,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3 -- Weight external game assists 3x
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
  WHERE
    t.team_type IN ('internal', 'club')
  GROUP BY 
    p.id, p.name, t.id, t.name
  ORDER BY 
    weighted_assists DESC, total_assists DESC, player_name
  LIMIT limit_count;
$$; 