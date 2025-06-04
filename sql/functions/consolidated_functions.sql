-- Consolidated SQL Functions for Football Stats App
-- This file contains all SQL functions required for the app to work properly
-- Created as part of project reorganization to eliminate redundancy

-- Drop existing player impact functions if they exist to avoid return type errors
DROP FUNCTION IF EXISTS get_player_win_impact(integer);
DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);
DROP FUNCTION IF EXISTS get_top_scorers(integer);
DROP FUNCTION IF EXISTS get_team_statistics();
DROP FUNCTION IF EXISTS get_all_player_statistics();
DROP FUNCTION IF EXISTS get_player_statistics(text);
DROP FUNCTION IF EXISTS get_team_top_scorers(text, integer);
DROP FUNCTION IF EXISTS get_internal_teams();
DROP FUNCTION IF EXISTS get_internal_players();
DROP FUNCTION IF EXISTS get_internal_team_statistics();
DROP FUNCTION IF EXISTS get_internal_top_scorers(integer);
DROP FUNCTION IF EXISTS get_club_teams();
DROP FUNCTION IF EXISTS get_club_players();
DROP FUNCTION IF EXISTS get_club_team_statistics();
DROP FUNCTION IF EXISTS get_club_top_scorers(integer);
DROP FUNCTION IF EXISTS get_internal_player_statistics();
DROP FUNCTION IF EXISTS get_club_player_statistics();
DROP FUNCTION IF EXISTS get_internal_all_player_statistics();
DROP FUNCTION IF EXISTS get_club_all_player_statistics();

-- SECTION: BASIC STATISTICS FUNCTIONS

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

-- Function to get only internal and club teams (for display purposes)
CREATE OR REPLACE FUNCTION get_internal_teams()
RETURNS TABLE (
  id text,
  name text,
  primary_shirt_color text,
  team_type text,
  created_at timestamptz
) 
LANGUAGE SQL
AS $$
  SELECT 
    id::text,
    name,
    primary_shirt_color,
    team_type,
    created_at
  FROM 
    teams
  WHERE 
    team_type = 'internal'
  ORDER BY 
    name;
$$;

-- Function to get only FCB United and club teams (separate function)
CREATE OR REPLACE FUNCTION get_club_teams()
RETURNS TABLE (
  id text,
  name text,
  primary_shirt_color text,
  team_type text,
  created_at timestamptz
) 
LANGUAGE SQL
AS $$
  SELECT 
    id::text,
    name,
    primary_shirt_color,
    team_type,
    created_at
  FROM 
    teams
  WHERE 
    team_type = 'club'
  ORDER BY 
    name;
$$;

-- Function to get team statistics for internal teams only (for frontend display)
CREATE OR REPLACE FUNCTION get_internal_team_statistics()
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
      matches m
    JOIN
      teams t1 ON m.home_team_id = t1.id
    JOIN
      teams t2 ON m.away_team_id = t2.id
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
      AND t1.team_type = 'internal'
      AND t2.team_type = 'internal'
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
      matches m
    JOIN
      teams t1 ON m.home_team_id = t1.id
    JOIN
      teams t2 ON m.away_team_id = t2.id  
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
      AND t1.team_type = 'internal'
      AND t2.team_type = 'internal'
    GROUP BY 
      away_team_id
  )
  
  SELECT 
    t.id::text,
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
  WHERE
    t.team_type = 'internal'
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC, -- Points (3 for win, 1 for draw)
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC, -- Goal difference
    COALESCE(SUM(mr.goals_for), 0) DESC, -- Goals for
    t.name;
$$;

-- Function to get club team statistics (for FCB United against external teams)
CREATE OR REPLACE FUNCTION get_club_team_statistics()
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
      matches m
    JOIN
      teams t1 ON m.home_team_id = t1.id
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
      AND t1.team_type = 'club'
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
      matches m
    JOIN
      teams t1 ON m.away_team_id = t1.id
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
      AND t1.team_type = 'club'
    GROUP BY 
      away_team_id
  )
  
  SELECT 
    t.id::text,
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
  WHERE
    t.team_type = 'club'
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC, -- Points (3 for win, 1 for draw)
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC, -- Goal difference
    COALESCE(SUM(mr.goals_for), 0) DESC, -- Goals for
    t.name;
$$;

-- Function to get only players from internal teams (for display purposes)
CREATE OR REPLACE FUNCTION get_internal_players()
RETURNS TABLE (
  id text,
  name text,
  player_position text,
  team_id text,
  team_name text,
  created_at timestamptz
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id::text,
    p.name,
    p.position as player_position,
    p.team_id::text,
    t.name as team_name,
    p.created_at
  FROM 
    players p
  JOIN
    teams t ON p.team_id = t.id
  WHERE 
    t.team_type IN ('internal', 'club')
  ORDER BY 
    p.name;
$$;

-- Function to get only players from club teams (for display purposes)
CREATE OR REPLACE FUNCTION get_club_players()
RETURNS TABLE (
  id text,
  name text,
  player_position text,
  team_id text,
  team_name text,
  created_at timestamptz
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id::text,
    p.name,
    p.position as player_position,
    p.team_id::text,
    t.name as team_name,
    p.created_at
  FROM 
    players p
  JOIN
    teams t ON p.team_id = t.id
  WHERE 
    t.team_type = 'club'
  ORDER BY 
    p.name;
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

-- Function to get top scorers from club teams (for FCB United)
CREATE OR REPLACE FUNCTION get_club_top_scorers(limit_count integer DEFAULT 10)
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
    t.team_type = 'club'
  GROUP BY 
    p.id, p.name, t.id, t.name
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
    t.id::text,
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

-- Function to get top scorers for a specific team
CREATE OR REPLACE FUNCTION get_team_top_scorers(team_id_param text, limit_count integer DEFAULT 10)
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
  JOIN
    player_match_assignments pma ON p.id = pma.player_id
  JOIN
    player_match_stats pms ON p.id = pms.player_id AND pma.match_id = pms.match_id
  JOIN
    matches m ON pms.match_id = m.id
  WHERE
    pma.team_id = team_id_param::uuid
  GROUP BY 
    p.id, p.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$;

-- SECTION: PLAYER IMPACT ANALYSIS FUNCTIONS

-- Function to analyze how players affect team win rates
CREATE OR REPLACE FUNCTION get_player_win_impact(limit_param integer DEFAULT 20)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_matches bigint,
  win_matches bigint,
  draw_matches bigint,
  loss_matches bigint,
  win_rate numeric,
  win_rate_delta numeric,
  player_position text
)
LANGUAGE SQL
AS $$
  WITH overall_stats AS (
    SELECT
      COUNT(DISTINCT id) as total_matches,
      COUNT(DISTINCT id) FILTER (
        WHERE (home_score > away_score) OR (away_score > home_score)
      ) as matches_with_winner,
      COUNT(DISTINCT id) FILTER (
        WHERE home_score = away_score
      ) as draw_matches,
      ROUND(
        COUNT(DISTINCT id) FILTER (
          WHERE (home_score > away_score) OR (away_score > home_score)
        )::numeric / NULLIF(COUNT(DISTINCT id), 0) * 100, 1
      ) as overall_win_rate
    FROM matches
    WHERE home_score IS NOT NULL AND away_score IS NOT NULL
  ),
  player_match_results AS (
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.position as player_position,
      COUNT(DISTINCT m.id) as total_matches,
      COUNT(DISTINCT m.id) FILTER (
        WHERE (pma.team_id = m.home_team_id AND m.home_score > m.away_score) OR
              (pma.team_id = m.away_team_id AND m.away_score > m.home_score)
      ) as win_matches,
      COUNT(DISTINCT m.id) FILTER (
        WHERE m.home_score = m.away_score
      ) as draw_matches,
      COUNT(DISTINCT m.id) FILTER (
        WHERE (pma.team_id = m.home_team_id AND m.home_score < m.away_score) OR
              (pma.team_id = m.away_team_id AND m.away_score < m.home_score)
      ) as loss_matches
    FROM
      players p
    JOIN
      player_match_assignments pma ON p.id = pma.player_id
    JOIN
      matches m ON pma.match_id = m.id
    WHERE
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
    GROUP BY
      p.id, p.name, p.position
  )
  
  SELECT
    pmr.player_id,
    pmr.player_name,
    pmr.total_matches,
    pmr.win_matches,
    pmr.draw_matches,
    pmr.loss_matches,
    ROUND(pmr.win_matches::numeric / NULLIF(pmr.total_matches, 0) * 100, 1) as win_rate,
    ROUND(
      (pmr.win_matches::numeric / NULLIF(pmr.total_matches, 0) * 100) - 
      (SELECT overall_win_rate FROM overall_stats),
      1
    ) as win_rate_delta,
    pmr.player_position
  FROM
    player_match_results pmr
  WHERE
    pmr.total_matches >= 3  -- Minimum matches for meaningful analysis
  ORDER BY
    win_rate_delta DESC
  LIMIT limit_param;
$$;

-- Function to identify effective player pairings
CREATE OR REPLACE FUNCTION get_player_combinations(min_matches_param integer DEFAULT 3, limit_param integer DEFAULT 20)
RETURNS TABLE (
  player1_id text,
  player1_name text,
  player2_id text,
  player2_name text,
  total_matches bigint,
  win_matches bigint,
  draw_matches bigint,
  loss_matches bigint,
  win_rate numeric,
  win_rate_as_opponents numeric
)
LANGUAGE SQL
AS $$
  WITH player_pairs AS (
    -- Find all pairs of players on the same team in matches
    SELECT
      CASE WHEN p1.id < p2.id THEN p1.id ELSE p2.id END as player1_id,
      CASE WHEN p1.id < p2.id THEN p1.name ELSE p2.name END as player1_name,
      CASE WHEN p1.id < p2.id THEN p2.id ELSE p1.id END as player2_id,
      CASE WHEN p1.id < p2.id THEN p2.name ELSE p1.name END as player2_name,
      pma1.team_id,
      m.id as match_id,
      CASE
        WHEN (pma1.team_id = m.home_team_id AND m.home_score > m.away_score) OR
             (pma1.team_id = m.away_team_id AND m.away_score > m.home_score)
        THEN 1
        ELSE 0
      END as is_win,
      CASE
        WHEN m.home_score = m.away_score THEN 1
        ELSE 0
      END as is_draw,
      CASE
        WHEN (pma1.team_id = m.home_team_id AND m.home_score < m.away_score) OR
             (pma1.team_id = m.away_team_id AND m.away_score < m.home_score)
        THEN 1
        ELSE 0
      END as is_loss
    FROM
      player_match_assignments pma1
    JOIN
      player_match_assignments pma2 ON 
        pma1.match_id = pma2.match_id AND
        pma1.team_id = pma2.team_id AND
        pma1.player_id < pma2.player_id
    JOIN
      players p1 ON pma1.player_id = p1.id
    JOIN
      players p2 ON pma2.player_id = p2.id
    JOIN
      matches m ON pma1.match_id = m.id
    WHERE
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  ),
  player_opponents AS (
    -- Find all pairs of players on opposite teams in matches
    SELECT
      CASE WHEN p1.id < p2.id THEN p1.id ELSE p2.id END as player1_id,
      CASE WHEN p1.id < p2.id THEN p1.name ELSE p2.name END as player1_name,
      CASE WHEN p1.id < p2.id THEN p2.id ELSE p1.id END as player2_id,
      CASE WHEN p1.id < p2.id THEN p2.name ELSE p1.name END as player2_name,
      pma1.team_id as team1_id,
      pma2.team_id as team2_id,
      m.id as match_id,
      CASE
        WHEN (pma1.team_id = m.home_team_id AND m.home_score > m.away_score) OR
             (pma1.team_id = m.away_team_id AND m.away_score > m.home_score)
        THEN 1
        ELSE 0
      END as is_win_team1
    FROM
      player_match_assignments pma1
    JOIN
      player_match_assignments pma2 ON 
        pma1.match_id = pma2.match_id AND
        pma1.team_id <> pma2.team_id
    JOIN
      players p1 ON pma1.player_id = p1.id
    JOIN
      players p2 ON pma2.player_id = p2.id
    JOIN
      matches m ON pma1.match_id = m.id
    WHERE
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  ),
  combined_stats AS (
    SELECT
      player1_id,
      player1_name,
      player2_id,
      player2_name,
      COUNT(DISTINCT match_id) as total_matches,
      SUM(is_win) as win_matches,
      SUM(is_draw) as draw_matches,
      SUM(is_loss) as loss_matches
    FROM
      player_pairs
    GROUP BY
      player1_id, player1_name, player2_id, player2_name
  ),
  opponent_stats AS (
    SELECT
      player1_id,
      player1_name,
      player2_id,
      player2_name,
      COUNT(DISTINCT match_id) as total_matches,
      SUM(is_win_team1) as win_matches_team1,
      COUNT(DISTINCT match_id) - SUM(is_win_team1) as win_matches_team2
    FROM
      player_opponents
    GROUP BY
      player1_id, player1_name, player2_id, player2_name
  )
  
  SELECT
    cs.player1_id,
    cs.player1_name,
    cs.player2_id,
    cs.player2_name,
    cs.total_matches,
    cs.win_matches,
    cs.draw_matches,
    cs.loss_matches,
    ROUND(cs.win_matches::numeric / NULLIF(cs.total_matches, 0) * 100, 1) as win_rate,
    CASE
      WHEN os.total_matches > 0 THEN
        ROUND(os.win_matches_team1::numeric / os.total_matches * 100, 1)
      ELSE
        NULL
    END as win_rate_as_opponents
  FROM
    combined_stats cs
  LEFT JOIN
    opponent_stats os ON cs.player1_id = os.player1_id AND cs.player2_id = os.player2_id
  WHERE
    cs.total_matches >= min_matches_param
  ORDER BY
    win_rate DESC,
    total_matches DESC
  LIMIT limit_param;
$$;

-- Function to analyze team performance with and without a specific player
CREATE OR REPLACE FUNCTION get_team_performance_with_player(player_id_param text, team_id_param text)
RETURNS TABLE (
  category text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_rate numeric,
  goals_scored_per_match numeric,
  goals_conceded_per_match numeric
)
LANGUAGE SQL
AS $$
  WITH player_matches AS (
    -- Matches where the player played for the specified team
    SELECT
      m.id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score,
      CASE
        WHEN pma.team_id = m.home_team_id THEN m.home_score
        ELSE m.away_score
      END as team_score,
      CASE
        WHEN pma.team_id = m.home_team_id THEN m.away_score
        ELSE m.home_score
      END as opponent_score,
      CASE
        WHEN (pma.team_id = m.home_team_id AND m.home_score > m.away_score) OR
             (pma.team_id = m.away_team_id AND m.away_score > m.home_score)
        THEN 'win'
        WHEN m.home_score = m.away_score
        THEN 'draw'
        ELSE 'loss'
      END as result
    FROM
      matches m
    JOIN
      player_match_assignments pma ON m.id = pma.match_id
    WHERE
      pma.player_id = player_id_param::uuid AND
      pma.team_id = team_id_param::uuid AND
      m.home_score IS NOT NULL AND
      m.away_score IS NOT NULL
  ),
  all_team_matches AS (
    -- All matches for the specified team
    SELECT
      m.id,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN m.home_score
        ELSE m.away_score
      END as team_score,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN m.away_score
        ELSE m.home_score
      END as opponent_score,
      CASE
        WHEN (m.home_team_id = team_id_param::uuid AND m.home_score > m.away_score) OR
             (m.away_team_id = team_id_param::uuid AND m.away_score > m.home_score)
        THEN 'win'
        WHEN m.home_score = m.away_score
        THEN 'draw'
        ELSE 'loss'
      END as result
    FROM
      matches m
    WHERE
      (m.home_team_id = team_id_param::uuid OR m.away_team_id = team_id_param::uuid) AND
      m.home_score IS NOT NULL AND
      m.away_score IS NOT NULL
  ),
  player_matches_stats AS (
    SELECT
      'With Player' as category,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE result = 'win') as wins,
      COUNT(*) FILTER (WHERE result = 'draw') as draws,
      COUNT(*) FILTER (WHERE result = 'loss') as losses,
      ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as win_rate,
      ROUND(SUM(team_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_scored_per_match,
      ROUND(SUM(opponent_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_conceded_per_match
    FROM
      player_matches
  ),
  without_player_matches AS (
    SELECT
      id,
      team_score,
      opponent_score,
      result
    FROM
      all_team_matches
    WHERE
      id NOT IN (SELECT id FROM player_matches)
  ),
  without_player_stats AS (
    SELECT
      'Without Player' as category,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE result = 'win') as wins,
      COUNT(*) FILTER (WHERE result = 'draw') as draws,
      COUNT(*) FILTER (WHERE result = 'loss') as losses,
      ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as win_rate,
      ROUND(SUM(team_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_scored_per_match,
      ROUND(SUM(opponent_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_conceded_per_match
    FROM
      without_player_matches
  ),
  all_team_stats AS (
    SELECT
      'All Team Matches' as category,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE result = 'win') as wins,
      COUNT(*) FILTER (WHERE result = 'draw') as draws,
      COUNT(*) FILTER (WHERE result = 'loss') as losses,
      ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as win_rate,
      ROUND(SUM(team_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_scored_per_match,
      ROUND(SUM(opponent_score)::numeric / NULLIF(COUNT(*), 0), 2) as goals_conceded_per_match
    FROM
      all_team_matches
  )
  
  SELECT * FROM (
    SELECT * FROM player_matches_stats
    UNION ALL
    SELECT * FROM without_player_stats
    UNION ALL
    SELECT * FROM all_team_stats
  ) sorted_results
  ORDER BY
    CASE
      WHEN category = 'With Player' THEN 1
      WHEN category = 'Without Player' THEN 2
      ELSE 3
    END;
$$;

-- Function to analyze player impact across all teams they've played for
DROP FUNCTION IF EXISTS public.get_player_all_teams_impact(text);

CREATE OR REPLACE FUNCTION public.get_player_all_teams_impact(player_id_param text)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_rate numeric,
  goals_per_game numeric,
  assists_per_game numeric,
  team_win_rate_with_player numeric,
  team_win_rate_without_player numeric,
  impact_score numeric,
  statistical_significance boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  player_id_uuid uuid;
BEGIN
  -- Validate and convert player_id to UUID
  BEGIN
    player_id_uuid := player_id_param::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid player ID format. Must be a valid UUID.';
  END;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = player_id_uuid) THEN
    RAISE EXCEPTION 'Player with ID % does not exist', player_id_param;
  END IF;

  -- Return data for all teams
  RETURN QUERY
  WITH player_teams AS (
    -- Find all teams this player has played with
    SELECT DISTINCT 
      pma.team_id
    FROM 
      public.player_match_assignments pma
    WHERE 
      pma.player_id = player_id_uuid
      AND pma.team_id IS NOT NULL
  ),
  player_stats AS (
    -- Calculate player stats per team
    SELECT
      pma.team_id,
      COUNT(DISTINCT pma.match_id) AS matches_played,
      SUM(ps.goals) AS total_goals,
      SUM(ps.assists) AS total_assists
    FROM
      public.player_match_assignments pma
    JOIN
      public.player_match_stats ps ON ps.match_id = pma.match_id AND ps.player_id = pma.player_id
    WHERE
      pma.player_id = player_id_uuid
      AND pma.team_id IS NOT NULL
    GROUP BY
      pma.team_id
  ),
  team_matches AS (
    -- All completed matches for each team
    SELECT
      t.id AS team_id,
      m.id AS match_id,
      CASE
        WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 'win'
        WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 'win'
        WHEN m.home_score = m.away_score THEN 'draw'
        ELSE 'loss'
      END AS result,
      EXISTS (
        SELECT 1 FROM public.player_match_assignments pma
        WHERE pma.match_id = m.id
        AND pma.team_id = t.id
        AND pma.player_id = player_id_uuid
      ) AS player_participated
    FROM
      public.teams t
    JOIN
      public.matches m ON m.home_team_id = t.id OR m.away_team_id = t.id
    WHERE
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
      AND t.id IN (SELECT team_id FROM player_teams)
  ),
  team_performance AS (
    -- Calculate team performance with and without player
    SELECT
      team_id,
      player_participated,
      COUNT(*) AS matches,
      COUNT(*) FILTER (WHERE result = 'win') AS wins,
      COUNT(*) FILTER (WHERE result = 'draw') AS draws,
      COUNT(*) FILTER (WHERE result = 'loss') AS losses,
      CASE 
        WHEN COUNT(*) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE result = 'win')::numeric / COUNT(*)) * 100, 1)
        ELSE 0
      END AS win_rate
    FROM
      team_matches
    GROUP BY
      team_id, player_participated
  )
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    COALESCE(ps.matches_played, 0) AS matches_played,
    COALESCE(tp_with.wins, 0) AS wins,
    COALESCE(tp_with.draws, 0) AS draws,
    COALESCE(tp_with.losses, 0) AS losses,
    COALESCE(tp_with.win_rate, 0) AS win_rate,
    CASE 
      WHEN COALESCE(ps.matches_played, 0) > 0 THEN
        ROUND(COALESCE(ps.total_goals, 0)::numeric / ps.matches_played, 2)
      ELSE 0
    END AS goals_per_game,
    CASE 
      WHEN COALESCE(ps.matches_played, 0) > 0 THEN
        ROUND(COALESCE(ps.total_assists, 0)::numeric / ps.matches_played, 2)
      ELSE 0
    END AS assists_per_game,
    COALESCE(tp_with.win_rate, 0) AS team_win_rate_with_player,
    COALESCE(tp_without.win_rate, 0) AS team_win_rate_without_player,
    -- Impact score: difference in win rate with/without the player
    COALESCE(tp_with.win_rate, 0) - COALESCE(tp_without.win_rate, 0) AS impact_score,
    -- Statistical significance: at least 3 matches with and without the player
    (COALESCE(tp_with.matches, 0) >= 3 AND COALESCE(tp_without.matches, 0) >= 3) AS statistical_significance
  FROM
    public.teams t
  LEFT JOIN
    player_stats ps ON ps.team_id = t.id
  LEFT JOIN
    team_performance tp_with ON tp_with.team_id = t.id AND tp_with.player_participated = true
  LEFT JOIN
    team_performance tp_without ON tp_without.team_id = t.id AND tp_without.player_participated = false
  WHERE
    t.id IN (SELECT team_id FROM player_teams)
  ORDER BY
    matches_played DESC,
    ABS(impact_score) DESC;

  -- If no results were found
  IF NOT FOUND THEN
    RAISE NOTICE 'No team assignments found for player %', player_id_param;
  END IF;
END;
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

-- Function to get player statistics for a specific internal player
CREATE OR REPLACE FUNCTION get_internal_player_statistics(player_id_param text)
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
    COALESCE(SUM(pms.goals), 0) as weighted_goals,
    COALESCE(SUM(pms.assists), 0) as weighted_assists
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
    p.id = player_id_param::uuid
  GROUP BY 
    p.id, p.name, t.id, t.name;
$$;

-- Function to get all player statistics for club teams only (FCB United vs external)
CREATE OR REPLACE FUNCTION get_club_all_player_statistics()
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
    teams t ON p.team_id = t.id
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    t.team_type = 'club'
  GROUP BY 
    p.id, p.name, t.id, t.name
  ORDER BY
    weighted_goals DESC, weighted_assists DESC, p.name;
$$;

-- Function to get player statistics for a specific club player
CREATE OR REPLACE FUNCTION get_club_player_statistics(player_id_param text)
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
    teams t ON p.team_id = t.id
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE 
    p.id = player_id_param::uuid
    AND t.team_type = 'club'
  GROUP BY 
    p.id, p.name, t.id, t.name;
$$;

-- Function to get all players for the application (for cross-team comparison)
CREATE OR REPLACE FUNCTION get_all_internal_players()
RETURNS TABLE (
  id text,
  name text,
  player_position text,
  team_id text,
  team_name text,
  created_at timestamptz
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text,
    p.name,
    p.position as player_position,
    p.team_id::text,
    t.name as team_name,
    p.created_at
  FROM 
    public.players p
  JOIN
    public.teams t ON p.team_id = t.id
  WHERE 
    t.team_type IN ('internal', 'club')
  ORDER BY 
    p.name;
$$;

-- Function to find optimal player combinations within teams
-- This analyzes which players work well together with the specified player
DROP FUNCTION IF EXISTS public.get_player_team_combinations(text, text);

CREATE OR REPLACE FUNCTION public.get_player_team_combinations(
  player_id_param text,
  team_id_param text DEFAULT NULL
)
RETURNS TABLE (
  teammate_id uuid,
  teammate_name text,
  team_id uuid,
  team_name text,
  matches_together int,
  win_rate_together numeric,
  win_rate_without numeric,
  win_impact numeric,
  goals_per_match_together numeric,
  goals_per_match_without numeric,
  goal_impact numeric,
  statistical_significance boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  player_id_uuid uuid;
  team_id_uuid uuid;
BEGIN
  -- Validate and convert player_id to UUID
  BEGIN
    player_id_uuid := player_id_param::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid player ID format. Must be a valid UUID.';
  END;
  
  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = player_id_uuid) THEN
    RAISE EXCEPTION 'Player with ID % does not exist', player_id_param;
  END IF;
  
  -- Convert team_id if provided
  IF team_id_param IS NOT NULL THEN
    BEGIN
      team_id_uuid := team_id_param::uuid;
      
      -- Check if team exists
      IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = team_id_uuid) THEN
        RAISE EXCEPTION 'Team with ID % does not exist', team_id_param;
      END IF;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid team ID format. Must be a valid UUID.';
    END;
  END IF;
  
  -- Return data for player combinations
  RETURN QUERY
  WITH player_matches AS (
    -- Get all matches where the target player participated
    SELECT
      pma.match_id,
      pma.team_id,
      m.home_score,
      m.away_score,
      CASE
        WHEN (m.home_team_id = pma.team_id AND m.home_score > m.away_score) OR
             (m.away_team_id = pma.team_id AND m.away_score > m.home_score) THEN true
        ELSE false
      END AS won,
      CASE
        WHEN m.home_team_id = pma.team_id THEN m.home_score
        ELSE m.away_score
      END AS team_goals
    FROM
      public.player_match_assignments pma
    JOIN
      public.matches m ON m.id = pma.match_id
    WHERE
      pma.player_id = player_id_uuid
      AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
      AND (team_id_uuid IS NULL OR pma.team_id = team_id_uuid)
  ),
  teammate_matches AS (
    -- Find teammates from these matches
    SELECT
      pm.match_id,
      pm.team_id,
      pma.player_id AS teammate_id,
      pm.won,
      pm.team_goals
    FROM
      player_matches pm
    JOIN
      public.player_match_assignments pma ON pma.match_id = pm.match_id AND pma.team_id = pm.team_id
    WHERE
      pma.player_id != player_id_uuid
  ),
  player_team_matches AS (
    -- All matches for teams where the player has played
    SELECT
      m.id AS match_id,
      t.id AS team_id,
      CASE
        WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR
             (m.away_team_id = t.id AND m.away_score > m.home_score) THEN true
        ELSE false
      END AS won,
      CASE
        WHEN m.home_team_id = t.id THEN m.home_score
        ELSE m.away_score
      END AS team_goals,
      EXISTS (
        SELECT 1 FROM public.player_match_assignments pma
        WHERE pma.match_id = m.id
        AND pma.team_id = t.id
        AND pma.player_id = player_id_uuid
      ) AS main_player_played,
      EXISTS (
        SELECT 1 FROM public.player_match_assignments pma
        WHERE pma.match_id = m.id
        AND pma.team_id = t.id
        AND pma.player_id = p.id
      ) AS teammate_played
    FROM
      public.teams t
    JOIN
      public.matches m ON m.home_team_id = t.id OR m.away_team_id = t.id
    CROSS JOIN
      public.players p
    WHERE
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
      AND p.id != player_id_uuid
      AND (team_id_uuid IS NULL OR t.id = team_id_uuid)
      AND t.id IN (
        SELECT DISTINCT team_id FROM public.player_match_assignments
        WHERE player_id = player_id_uuid
      )
  ),
  teammate_stats AS (
    -- Calculate stats per teammate
    SELECT
      tm.teammate_id,
      tm.team_id,
      COUNT(DISTINCT tm.match_id) AS matches_together,
      ROUND(AVG(CASE WHEN tm.won THEN 1 ELSE 0 END) * 100, 1) AS win_rate_together,
      AVG(tm.team_goals) AS goals_per_match_together
    FROM
      teammate_matches tm
    GROUP BY
      tm.teammate_id, tm.team_id
  ),
  without_stats AS (
    -- Stats when teammate played without main player
    SELECT
      ptm.team_id,
      p.id AS teammate_id,
      COUNT(*) FILTER (WHERE ptm.teammate_played AND NOT ptm.main_player_played) AS matches_without,
      ROUND(AVG(CASE WHEN ptm.won AND ptm.teammate_played AND NOT ptm.main_player_played THEN 1 ELSE 0 END) * 100, 1) AS win_rate_without,
      AVG(CASE WHEN ptm.teammate_played AND NOT ptm.main_player_played THEN ptm.team_goals ELSE NULL END) AS goals_per_match_without
    FROM
      player_team_matches ptm
    CROSS JOIN
      public.players p
    WHERE
      p.id != player_id_uuid
    GROUP BY
      ptm.team_id, p.id
  )
  SELECT
    p.id AS teammate_id,
    p.name AS teammate_name,
    t.id AS team_id,
    t.name AS team_name,
    ts.matches_together,
    ts.win_rate_together,
    COALESCE(ws.win_rate_without, 0) AS win_rate_without,
    ts.win_rate_together - COALESCE(ws.win_rate_without, 0) AS win_impact,
    ROUND(ts.goals_per_match_together, 2) AS goals_per_match_together,
    ROUND(COALESCE(ws.goals_per_match_without, 0), 2) AS goals_per_match_without,
    ROUND(ts.goals_per_match_together - COALESCE(ws.goals_per_match_without, 0), 2) AS goal_impact,
    (ts.matches_together >= 3 AND COALESCE(ws.matches_without, 0) >= 3) AS statistical_significance
  FROM
    teammate_stats ts
  JOIN
    public.players p ON p.id = ts.teammate_id
  JOIN
    public.teams t ON t.id = ts.team_id
  LEFT JOIN
    without_stats ws ON ws.teammate_id = ts.teammate_id AND ws.team_id = ts.team_id
  WHERE
    ts.matches_together > 0
  ORDER BY
    ts.matches_together DESC,
    ABS(win_impact) DESC;

  -- If no results were found
  IF NOT FOUND THEN
    RAISE NOTICE 'No team combinations found for player %', player_id_param;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO authenticated;

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
SECURITY INVOKER
SET search_path = public
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
    public.players p
  JOIN
    public.teams t ON p.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  WHERE
    t.team_type IN ('internal', 'club')
  GROUP BY 
    p.id, p.name, t.id, t.name
  ORDER BY 
    weighted_assists DESC, total_assists DESC, player_name
  LIMIT limit_count;
$$;

-- Function to get top goalkeepers with clean sheets from internal teams only (for frontend display)
CREATE OR REPLACE FUNCTION get_internal_top_goalkeepers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  matches_played bigint,
  clean_sheets bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    t.id as team_id,
    t.name as team_name,
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
    ), 0)::bigint as clean_sheets
  FROM 
    public.players p
  JOIN
    public.teams t ON p.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    t.team_type IN ('internal', 'club')
    AND p.position = 'Goalkeeper'
  GROUP BY 
    p.id, p.name, t.id, t.name
  HAVING
    COUNT(DISTINCT pms.match_id) > 0
  ORDER BY 
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
    ), 0)::bigint DESC,
    (COALESCE(SUM(
      CASE 
        WHEN p.position = 'Goalkeeper' AND 
             (
               (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
               (pma.team_id = m.away_team_id AND m.home_score = 0)
             )
        THEN 1
        ELSE 0
      END
    ), 0)::FLOAT / NULLIF(COUNT(DISTINCT pms.match_id), 0)) DESC, -- Clean sheet percentage as tiebreaker
    player_name
  LIMIT limit_count;
$$;

-- Grant execution permissions to anon and authenticated roles for the new functions
GRANT EXECUTE ON FUNCTION public.get_internal_top_assists(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_internal_top_assists(integer) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_internal_top_goalkeepers(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_internal_top_goalkeepers(integer) TO authenticated; 