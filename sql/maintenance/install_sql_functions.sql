-- This script will install all required SQL functions for the Soccer Stats App

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

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_statistics()
RETURNS TABLE (
  id text,
  name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  goals_for bigint,
  goals_against bigint
) 
LANGUAGE SQL
AS $$
  WITH match_results AS (
    -- Home team results
    SELECT 
      home_team_id as team_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE home_score > away_score) as wins,
      COUNT(*) FILTER (WHERE home_score = away_score) as draws,
      COUNT(*) FILTER (WHERE home_score < away_score) as losses,
      COALESCE(SUM(home_score), 0) as goals_for,
      COALESCE(SUM(away_score), 0) as goals_against
    FROM 
      matches
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
    GROUP BY 
      home_team_id
    
    UNION ALL
    
    -- Away team results
    SELECT 
      away_team_id as team_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE away_score > home_score) as wins,
      COUNT(*) FILTER (WHERE away_score = home_score) as draws,
      COUNT(*) FILTER (WHERE away_score < home_score) as losses,
      COALESCE(SUM(away_score), 0) as goals_for,
      COALESCE(SUM(home_score), 0) as goals_against
    FROM 
      matches
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
    GROUP BY 
      away_team_id
  )
  
  SELECT 
    t.id,
    t.name,
    COALESCE(SUM(mr.matches_played), 0)::bigint as matches_played,
    COALESCE(SUM(mr.wins), 0)::bigint as wins,
    COALESCE(SUM(mr.draws), 0)::bigint as draws,
    COALESCE(SUM(mr.losses), 0)::bigint as losses,
    COALESCE(SUM(mr.goals_for), 0)::bigint as goals_for,
    COALESCE(SUM(mr.goals_against), 0)::bigint as goals_against
  FROM 
    teams t
  LEFT JOIN 
    match_results mr ON t.id = mr.team_id
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC, -- Points (3 for win, 1 for draw)
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC, -- Goal difference
    COALESCE(SUM(mr.goals_for), 0) DESC, -- Goals for
    t.name;
$$;

-- Function to get all player statistics
CREATE OR REPLACE FUNCTION get_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  clean_sheets bigint,
  weighted_goals numeric,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0)::bigint as goals,
    COALESCE(SUM(pms.assists), 0)::bigint as assists,
    COALESCE(SUM(pms.own_goals), 0)::bigint as own_goals,
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
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  GROUP BY 
    p.id, p.name;
$$;

-- Function to get player statistics for a specific player
CREATE OR REPLACE FUNCTION get_player_statistics(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  clean_sheets bigint,
  weighted_goals numeric,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0)::bigint as goals,
    COALESCE(SUM(pms.assists), 0)::bigint as assists,
    COALESCE(SUM(pms.own_goals), 0)::bigint as own_goals,
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
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    p.id = player_id_param::uuid
  GROUP BY 
    p.id, p.name;
$$;

-- Function to get all player statistics for internal teams only
CREATE OR REPLACE FUNCTION get_internal_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
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
    COALESCE(SUM(pms.own_goals), 0)::bigint as own_goals,
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
    teams t ON p.team_id = t.id AND t.team_type = 'internal'
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  GROUP BY 
    p.id, p.name, t.id, t.name;
$$;

-- Function to get top scorers from internal teams only (for frontend display)
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

-- Function to get top assists from internal teams only (for frontend display)
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