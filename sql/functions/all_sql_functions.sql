-- All SQL Functions for Soccer Stats App
-- This file contains all SQL functions required for the app to work properly

-- Drop existing player impact functions if they exist to avoid return type errors
DROP FUNCTION IF EXISTS get_player_win_impact(integer);
DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);

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
      COUNT(DISTINCT match_id) as total_opponent_matches,
      SUM(is_win_team1) as win_matches_team1,
      COUNT(DISTINCT match_id) - SUM(is_win_team1) - 
        SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as loss_matches_team1
    FROM
      player_opponents po
    JOIN
      matches m ON po.match_id = m.id
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
      WHEN os.total_opponent_matches >= 2 THEN 
        ROUND(os.win_matches_team1::numeric / NULLIF(os.total_opponent_matches, 0) * 100, 1)
      ELSE NULL
    END as win_rate_as_opponents
  FROM
    combined_stats cs
  LEFT JOIN
    opponent_stats os ON 
      cs.player1_id = os.player1_id AND 
      cs.player2_id = os.player2_id
  WHERE
    cs.total_matches >= min_matches_param
  ORDER BY
    win_rate DESC, total_matches DESC
  LIMIT limit_param;
$$;

-- Function to compare team performance with/without specific players
CREATE OR REPLACE FUNCTION get_team_performance_with_player(player_id_param text, team_id_param text)
RETURNS TABLE (
  scenario text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_rate numeric,
  goals_scored_avg numeric,
  goals_conceded_avg numeric
)
LANGUAGE SQL
AS $$
  WITH team_matches AS (
    SELECT
      m.id as match_id,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN 'home'
        WHEN m.away_team_id = team_id_param::uuid THEN 'away'
        ELSE NULL
      END as team_position,
      m.home_score,
      m.away_score,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN
          CASE
            WHEN m.home_score > m.away_score THEN 'win'
            WHEN m.home_score = m.away_score THEN 'draw'
            ELSE 'loss'
          END
        WHEN m.away_team_id = team_id_param::uuid THEN
          CASE
            WHEN m.away_score > m.home_score THEN 'win'
            WHEN m.home_score = m.away_score THEN 'draw'
            ELSE 'loss'
          END
      END as result,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN m.home_score
        ELSE m.away_score
      END as team_score,
      CASE
        WHEN m.home_team_id = team_id_param::uuid THEN m.away_score
        ELSE m.home_score
      END as opponent_score,
      EXISTS (
        SELECT 1 FROM player_match_assignments pma
        WHERE pma.match_id = m.id
        AND pma.team_id = team_id_param::uuid
        AND pma.player_id = player_id_param::uuid
      ) as player_participated
    FROM
      matches m
    WHERE
      (m.home_team_id = team_id_param::uuid OR m.away_team_id = team_id_param::uuid)
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
  )
  
  SELECT
    scenario,
    COUNT(*) as matches_played,
    COUNT(*) FILTER (WHERE result = 'win') as wins,
    COUNT(*) FILTER (WHERE result = 'draw') as draws,
    COUNT(*) FILTER (WHERE result = 'loss') as losses,
    ROUND(COUNT(*) FILTER (WHERE result = 'win')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as win_rate,
    ROUND(AVG(team_score), 2) as goals_scored_avg,
    ROUND(AVG(opponent_score), 2) as goals_conceded_avg
  FROM (
    -- With player
    SELECT
      'With Player' as scenario,
      match_id,
      result,
      team_score,
      opponent_score
    FROM
      team_matches
    WHERE
      player_participated = true
    
    UNION ALL
    
    -- Without player
    SELECT
      'Without Player' as scenario,
      match_id,
      result,
      team_score,
      opponent_score
    FROM
      team_matches
    WHERE
      player_participated = false
  ) subq
  GROUP BY
    scenario
  ORDER BY
    scenario = 'With Player' DESC;
$$; 