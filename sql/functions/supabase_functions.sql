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
    COALESCE(SUM(
      CASE 
        WHEN p.position = 'Goalkeeper' AND 
             ((m.home_team_id = p.team_id AND m.away_score = 0) OR 
              (m.away_team_id = p.team_id AND m.home_score = 0))
        THEN 1
        ELSE 0
      END
    ), 0)::bigint as clean_sheets,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3 -- Weight external game assists 3x
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
    COALESCE(SUM(
      CASE 
        WHEN p.position = 'Goalkeeper' AND 
             ((m.home_team_id = p.team_id AND m.away_score = 0) OR 
              (m.away_team_id = p.team_id AND m.home_score = 0))
        THEN 1
        ELSE 0
      END
    ), 0)::bigint as clean_sheets,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3 -- Weight external game assists 3x
        ELSE pms.assists
      END
    ), 0) as weighted_assists
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  WHERE
    p.id = player_id_param
  GROUP BY 
    p.id, p.name;
$$;

-- Function to get team vs team head-to-head statistics
CREATE OR REPLACE FUNCTION get_head_to_head_stats(team_id_1 text, team_id_2 text)
RETURNS TABLE (
  team_1_id text,
  team_1_name text,
  team_2_id text,
  team_2_name text,
  matches_played bigint,
  team_1_wins bigint,
  team_2_wins bigint,
  draws bigint,
  team_1_goals bigint,
  team_2_goals bigint
) 
LANGUAGE SQL
AS $$
  WITH head_to_head AS (
    -- Team 1 home, Team 2 away
    SELECT 
      home_team_id as team_1_id,
      away_team_id as team_2_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE home_score > away_score) as team_1_wins,
      COUNT(*) FILTER (WHERE home_score < away_score) as team_2_wins,
      COUNT(*) FILTER (WHERE home_score = away_score) as draws,
      COALESCE(SUM(home_score), 0) as team_1_goals,
      COALESCE(SUM(away_score), 0) as team_2_goals
    FROM 
      matches
    WHERE 
      home_team_id = team_id_1 AND away_team_id = team_id_2 AND
      home_score IS NOT NULL AND away_score IS NOT NULL
    
    UNION ALL
    
    -- Team 1 away, Team 2 home
    SELECT 
      away_team_id as team_1_id,
      home_team_id as team_2_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE away_score > home_score) as team_1_wins,
      COUNT(*) FILTER (WHERE away_score < home_score) as team_2_wins,
      COUNT(*) FILTER (WHERE away_score = home_score) as draws,
      COALESCE(SUM(away_score), 0) as team_1_goals,
      COALESCE(SUM(home_score), 0) as team_2_goals
    FROM 
      matches
    WHERE 
      away_team_id = team_id_1 AND home_team_id = team_id_2 AND
      home_score IS NOT NULL AND away_score IS NOT NULL
  )
  
  SELECT 
    team_id_1 as team_1_id,
    t1.name as team_1_name,
    team_id_2 as team_2_id,
    t2.name as team_2_name,
    COALESCE(SUM(h2h.matches_played), 0)::bigint as matches_played,
    COALESCE(SUM(h2h.team_1_wins), 0)::bigint as team_1_wins,
    COALESCE(SUM(h2h.team_2_wins), 0)::bigint as team_2_wins,
    COALESCE(SUM(h2h.draws), 0)::bigint as draws,
    COALESCE(SUM(h2h.team_1_goals), 0)::bigint as team_1_goals,
    COALESCE(SUM(h2h.team_2_goals), 0)::bigint as team_2_goals
  FROM 
    teams t1
  CROSS JOIN 
    teams t2
  LEFT JOIN 
    head_to_head h2h ON TRUE
  WHERE 
    t1.id = team_id_1 AND t2.id = team_id_2
  GROUP BY 
    t1.id, t1.name, t2.id, t2.name;
$$;
