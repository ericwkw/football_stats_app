-- SQL file for additional function security fixes
-- Created: 2025-06-05

-- This file contains SQL statements to improve security for database functions
-- Add your security fixes below

-- Fix additional function security issues
-- This script updates functions to use SECURITY INVOKER and set explicit search paths

BEGIN;

-- Fix get_team_player_combinations function
CREATE OR REPLACE FUNCTION public.get_team_player_combinations()
RETURNS TABLE (
  team_id text,
  team_name text,
  player_id text,
  player_name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_percentage numeric,
  goals_for bigint,
  goals_against bigint,
  goal_difference bigint
)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$ 
  -- Original function body remains unchanged
  SELECT * FROM public.get_player_team_combinations();
$$;

-- Fix get_team_statistics function
CREATE OR REPLACE FUNCTION public.get_team_statistics()
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
SECURITY INVOKER
SET search_path = public
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
      public.matches
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
      public.matches
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
    public.teams t
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

-- Fix get_club_players function
CREATE OR REPLACE FUNCTION public.get_club_players()
RETURNS TABLE (
  id text,
  name text,
  "position" text,
  created_at timestamptz
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id::text,
    name,
    position,
    created_at
  FROM 
    public.players
  WHERE 
    EXISTS (
      SELECT 1 
      FROM public.player_team_assignments pta
      JOIN public.teams t ON pta.team_id = t.id
      WHERE pta.player_id = players.id
      AND t.team_type = 'club'
    )
  ORDER BY 
    position, name;
$$;

-- Fix get_internal_teams function
CREATE OR REPLACE FUNCTION public.get_internal_teams()
RETURNS TABLE (
  id text,
  name text,
  primary_shirt_color text,
  team_type text,
  created_at timestamptz
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id::text,
    name,
    primary_shirt_color,
    team_type,
    created_at
  FROM 
    public.teams
  WHERE 
    team_type = 'internal'
  ORDER BY 
    name;
$$;

-- Fix get_club_teams function
CREATE OR REPLACE FUNCTION public.get_club_teams()
RETURNS TABLE (
  id text,
  name text,
  primary_shirt_color text,
  team_type text,
  created_at timestamptz
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id::text,
    name,
    primary_shirt_color,
    team_type,
    created_at
  FROM 
    public.teams
  WHERE 
    team_type = 'club'
  ORDER BY 
    name;
$$;

-- Fix get_internal_teams_statistics function
CREATE OR REPLACE FUNCTION public.get_internal_teams_statistics()
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
SECURITY INVOKER
SET search_path = public
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
      public.matches m
    JOIN
      public.teams t1 ON m.home_team_id = t1.id
    JOIN
      public.teams t2 ON m.away_team_id = t2.id
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
      public.matches m
    JOIN
      public.teams t1 ON m.home_team_id = t1.id
    JOIN
      public.teams t2 ON m.away_team_id = t2.id  
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
    public.teams t
  LEFT JOIN 
    match_results mr ON t.id = mr.team_id
  WHERE
    t.team_type = 'internal'
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC,
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC,
    COALESCE(SUM(mr.goals_for), 0) DESC,
    t.name;
$$;

-- Fix get_club_team_statistics function (this is likely what was meant by get_club_team_statstics)
CREATE OR REPLACE FUNCTION public.get_club_team_statistics()
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
SECURITY INVOKER
SET search_path = public
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
      public.matches m
    JOIN
      public.teams t1 ON m.home_team_id = t1.id
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
      public.matches m
    JOIN
      public.teams t1 ON m.away_team_id = t1.id
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
    public.teams t
  LEFT JOIN 
    match_results mr ON t.id = mr.team_id
  WHERE
    t.team_type = 'club'
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC,
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC,
    COALESCE(SUM(mr.goals_for), 0) DESC,
    t.name;
$$;

-- Grant permissions on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_team_player_combinations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_players() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_teams_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_team_statistics() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_team_player_combinations() IS 'Returns all team-player combinations with performance statistics (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_team_statistics() IS 'Returns statistics for all teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_players() IS 'Returns all players assigned to club teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_internal_teams() IS 'Returns all internal teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_teams() IS 'Returns all club teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_internal_teams_statistics() IS 'Returns statistics for internal teams only (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_team_statistics() IS 'Returns statistics for club teams only (SECURITY INVOKER with explicit search_path)';

COMMIT;
-- Fix additional function security issues (part 2)
-- This script updates more functions to use SECURITY INVOKER and set explicit search paths

BEGIN;

-- Fix get_head_to_head_stats function
CREATE OR REPLACE FUNCTION public.get_head_to_head_stats(team_id_1 text, team_id_2 text)
RETURNS TABLE (
  matches_played bigint,
  team_1_wins bigint,
  team_2_wins bigint,
  draws bigint,
  team_1_goals bigint,
  team_2_goals bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as matches_played,
    COUNT(*) FILTER (
      WHERE (home_team_id = team_id_1::uuid AND away_team_id = team_id_2::uuid AND home_score > away_score)
      OR (home_team_id = team_id_2::uuid AND away_team_id = team_id_1::uuid AND home_score < away_score)
    ) as team_1_wins,
    COUNT(*) FILTER (
      WHERE (home_team_id = team_id_1::uuid AND away_team_id = team_id_2::uuid AND home_score < away_score)
      OR (home_team_id = team_id_2::uuid AND away_team_id = team_id_1::uuid AND home_score > away_score)
    ) as team_2_wins,
    COUNT(*) FILTER (
      WHERE home_score = away_score
    ) as draws,
    SUM(
      CASE
        WHEN home_team_id = team_id_1::uuid THEN home_score
        WHEN away_team_id = team_id_1::uuid THEN away_score
        ELSE 0
      END
    ) as team_1_goals,
    SUM(
      CASE
        WHEN home_team_id = team_id_2::uuid THEN home_score
        WHEN away_team_id = team_id_2::uuid THEN away_score
        ELSE 0
      END
    ) as team_2_goals
  FROM 
    public.matches
  WHERE 
    (home_team_id = team_id_1::uuid AND away_team_id = team_id_2::uuid)
    OR (home_team_id = team_id_2::uuid AND away_team_id = team_id_1::uuid)
    AND home_score IS NOT NULL AND away_score IS NOT NULL;
$$;

-- Fix get_team_player_statistics function
CREATE OR REPLACE FUNCTION public.get_team_player_statistics(team_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  WHERE 
    pta.team_id = team_id_param::uuid
  GROUP BY 
    p.id, p.name, p.position
  ORDER BY 
    goals DESC, assists DESC, p.name;
$$;

-- Fix get_team_top_scorers function
CREATE OR REPLACE FUNCTION public.get_team_top_scorers(team_id_param text, limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  WHERE 
    pta.team_id = team_id_param::uuid
  GROUP BY 
    p.id, p.name, p.position
  ORDER BY 
    goals DESC, assists DESC, p.name
  LIMIT limit_count;
$$;

-- Fix get_player_win_impact function
CREATE OR REPLACE FUNCTION public.get_player_win_impact(limit_param integer DEFAULT 20)
RETURNS TABLE (
  player_id text,
  player_name text,
  matches_played bigint,
  team_with_player_wins bigint,
  team_with_player_losses bigint,
  team_with_player_draws bigint,
  win_percentage numeric,
  impact_score numeric
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  WITH player_results AS (
    SELECT 
      p.id as player_id,
      p.name as player_name,
      pma.team_id,
      m.id as match_id,
      CASE 
        WHEN pma.team_id = m.home_team_id AND m.home_score > m.away_score THEN 'win'
        WHEN pma.team_id = m.away_team_id AND m.away_score > m.home_score THEN 'win'
        WHEN pma.team_id = m.home_team_id AND m.home_score < m.away_score THEN 'loss'
        WHEN pma.team_id = m.away_team_id AND m.away_score < m.home_score THEN 'loss'
        ELSE 'draw'
      END as result
    FROM 
      public.players p
    JOIN 
      public.player_match_assignments pma ON p.id = pma.player_id
    JOIN 
      public.matches m ON pma.match_id = m.id
    WHERE 
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  )
  
  SELECT 
    pr.player_id::text,
    MAX(pr.player_name) as player_name,
    COUNT(DISTINCT pr.match_id) as matches_played,
    COUNT(DISTINCT pr.match_id) FILTER (WHERE pr.result = 'win') as team_with_player_wins,
    COUNT(DISTINCT pr.match_id) FILTER (WHERE pr.result = 'loss') as team_with_player_losses,
    COUNT(DISTINCT pr.match_id) FILTER (WHERE pr.result = 'draw') as team_with_player_draws,
    CASE 
      WHEN COUNT(DISTINCT pr.match_id) > 0 THEN 
        ROUND((COUNT(DISTINCT pr.match_id) FILTER (WHERE pr.result = 'win')::numeric / 
              COUNT(DISTINCT pr.match_id)) * 100, 1)
      ELSE 0
    END as win_percentage,
    -- Impact score: win percentage * matches played (weighted)
    CASE 
      WHEN COUNT(DISTINCT pr.match_id) > 0 THEN 
        ROUND((COUNT(DISTINCT pr.match_id) FILTER (WHERE pr.result = 'win')::numeric / 
              COUNT(DISTINCT pr.match_id)) * 100 * 
              LEAST(1.0, (COUNT(DISTINCT pr.match_id)::numeric / 5)), 1)
      ELSE 0
    END as impact_score
  FROM 
    player_results pr
  GROUP BY 
    pr.player_id
  HAVING 
    COUNT(DISTINCT pr.match_id) >= 3
  ORDER BY 
    impact_score DESC, win_percentage DESC, matches_played DESC
  LIMIT limit_param;
$$;

-- Fix get_internal_top_scorers function
CREATE OR REPLACE FUNCTION public.get_internal_top_scorers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(pms.goals), 0) as weighted_goals
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  JOIN
    public.teams mt ON pma.team_id = mt.id
  WHERE 
    t.team_type = 'internal'
    AND mt.team_type = 'internal'
  GROUP BY 
    p.id, p.name
  ORDER BY 
    total_goals DESC, player_name
  LIMIT limit_count;
$$;

-- Fix get_club_top_scorers function
CREATE OR REPLACE FUNCTION public.get_club_top_scorers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  WHERE 
    t.team_type = 'club'
  GROUP BY 
    p.id, p.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$;

-- Fix refresh_schema_cache function
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS void 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- This is a helper function to force PostgREST to refresh its schema cache
  -- It doesn't actually do anything except provide a way to invalidate the cache
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant permissions on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_head_to_head_stats(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_top_scorers(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_win_impact(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_top_scorers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_top_scorers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_head_to_head_stats(text, text) IS 'Returns head-to-head statistics between two teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_team_player_statistics(text) IS 'Returns all player statistics for a specific team (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_team_top_scorers(text, integer) IS 'Returns top scorers for a specific team (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_player_win_impact(integer) IS 'Returns players with the highest win impact (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_internal_top_scorers(integer) IS 'Returns top scorers from internal teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_top_scorers(integer) IS 'Returns top scorers from club teams (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.refresh_schema_cache() IS 'Helper function to force PostgREST to refresh its schema cache (SECURITY INVOKER with explicit search_path)';

COMMIT; -- Fix additional function security issues (part 3)
-- This script updates the remaining functions to use SECURITY INVOKER and set explicit search paths

BEGIN;

-- Fix get_all_player_statistics function
CREATE OR REPLACE FUNCTION public.get_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  GROUP BY 
    p.id, p.name, p.position
  ORDER BY 
    goals DESC, assists DESC, p.name;
$$;

-- Fix get_player_statistics function
CREATE OR REPLACE FUNCTION public.get_player_statistics(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  WHERE 
    p.id = player_id_param::uuid
  GROUP BY 
    p.id, p.name, p.position;
$$;

-- Fix get_player_combinations function
CREATE OR REPLACE FUNCTION public.get_player_combinations(min_matches_param integer DEFAULT 3, limit_param integer DEFAULT 20)
RETURNS TABLE (
  player_1_id text,
  player_1_name text,
  player_2_id text,
  player_2_name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_percentage numeric,
  team_id text,
  team_name text
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  WITH player_pairs AS (
    SELECT 
      p1.id AS player_1_id,
      p1.name AS player_1_name,
      p2.id AS player_2_id,
      p2.name AS player_2_name,
      pma1.team_id,
      t.name AS team_name,
      m.id AS match_id,
      CASE 
        WHEN pma1.team_id = m.home_team_id AND m.home_score > m.away_score THEN 'win'
        WHEN pma1.team_id = m.away_team_id AND m.away_score > m.home_score THEN 'win'
        WHEN pma1.team_id = m.home_team_id AND m.home_score < m.away_score THEN 'loss'
        WHEN pma1.team_id = m.away_team_id AND m.away_score < m.home_score THEN 'loss'
        ELSE 'draw'
      END AS result
    FROM 
      public.players p1
    JOIN 
      public.player_match_assignments pma1 ON p1.id = pma1.player_id
    JOIN 
      public.players p2 ON p1.id < p2.id -- Ensure unique pairs
    JOIN 
      public.player_match_assignments pma2 ON p2.id = pma2.player_id AND pma1.match_id = pma2.match_id AND pma1.team_id = pma2.team_id
    JOIN 
      public.matches m ON pma1.match_id = m.id
    JOIN
      public.teams t ON pma1.team_id = t.id
    WHERE 
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  )
  
  SELECT 
    pp.player_1_id::text,
    MAX(pp.player_1_name) AS player_1_name,
    pp.player_2_id::text,
    MAX(pp.player_2_name) AS player_2_name,
    COUNT(DISTINCT pp.match_id) AS matches_played,
    COUNT(DISTINCT pp.match_id) FILTER (WHERE pp.result = 'win') AS wins,
    COUNT(DISTINCT pp.match_id) FILTER (WHERE pp.result = 'draw') AS draws,
    COUNT(DISTINCT pp.match_id) FILTER (WHERE pp.result = 'loss') AS losses,
    CASE 
      WHEN COUNT(DISTINCT pp.match_id) > 0 THEN 
        ROUND((COUNT(DISTINCT pp.match_id) FILTER (WHERE pp.result = 'win')::numeric / 
              COUNT(DISTINCT pp.match_id)) * 100, 1)
      ELSE 0
    END AS win_percentage,
    pp.team_id::text,
    MAX(pp.team_name) AS team_name
  FROM 
    player_pairs pp
  GROUP BY 
    pp.player_1_id, pp.player_2_id, pp.team_id
  HAVING 
    COUNT(DISTINCT pp.match_id) >= min_matches_param
  ORDER BY 
    win_percentage DESC, matches_played DESC
  LIMIT limit_param;
$$;

-- Fix get_internal_all_player_statistics function
CREATE OR REPLACE FUNCTION public.get_internal_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  JOIN
    public.teams mt ON pma.team_id = mt.id
  WHERE 
    t.team_type = 'internal'
    AND mt.team_type = 'internal'
  GROUP BY 
    p.id, p.name, p.position
  ORDER BY 
    goals DESC, assists DESC, p.name;
$$;

-- Fix get_internal_player_statistics function
CREATE OR REPLACE FUNCTION public.get_internal_player_statistics(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  JOIN
    public.teams mt ON pma.team_id = mt.id
  WHERE 
    p.id = player_id_param::uuid
    AND t.team_type = 'internal'
    AND mt.team_type = 'internal'
  GROUP BY 
    p.id, p.name, p.position;
$$;

-- Fix get_club_all_player_statistics function
CREATE OR REPLACE FUNCTION public.get_club_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  JOIN
    public.teams mt ON pma.team_id = mt.id
  WHERE 
    t.team_type = 'club'
    AND mt.team_type = 'club'
  GROUP BY 
    p.id, p.name, p.position
  ORDER BY 
    goals DESC, assists DESC, p.name;
$$;

-- Fix get_club_player_statistics function
CREATE OR REPLACE FUNCTION public.get_club_player_statistics(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  "position" text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  own_goals bigint,
  total_minutes bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text as player_id,
    p.name as player_name,
    p.position,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0) as goals,
    COALESCE(SUM(pms.assists), 0) as assists,
    COALESCE(SUM(pms.own_goals), 0) as own_goals,
    COALESCE(SUM(pms.minutes_played), 0) as total_minutes
  FROM 
    public.players p
  JOIN 
    public.player_team_assignments pta ON p.id = pta.player_id
  JOIN 
    public.teams t ON pta.team_id = t.id
  LEFT JOIN 
    public.player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    public.matches m ON pms.match_id = m.id
  LEFT JOIN
    public.player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  JOIN
    public.teams mt ON pma.team_id = mt.id
  WHERE 
    p.id = player_id_param::uuid
    AND t.team_type = 'club'
    AND mt.team_type = 'club'
  GROUP BY 
    p.id, p.name, p.position;
$$;

-- Grant permissions on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_combinations(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_player_statistics(text) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_all_player_statistics() IS 'Returns statistics for all players (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_player_statistics(text) IS 'Returns statistics for a specific player (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_player_combinations(integer, integer) IS 'Returns effective player combinations (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_internal_all_player_statistics() IS 'Returns statistics for all internal players (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_internal_player_statistics(text) IS 'Returns statistics for a specific internal player (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_all_player_statistics() IS 'Returns statistics for all club players (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_club_player_statistics(text) IS 'Returns statistics for a specific club player (SECURITY INVOKER with explicit search_path)';

COMMIT; -- Fix additional function security issues (part 4)
-- This script updates the remaining functions to use SECURITY INVOKER and set explicit search paths

BEGIN;

-- Fix get_team_performance_with_player function
CREATE OR REPLACE FUNCTION public.get_team_performance_with_player(player_id_param text, team_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  matches_played bigint,
  matches_without_player bigint,
  team_total_matches bigint,
  wins_with_player bigint,
  wins_without_player bigint,
  draws_with_player bigint,
  draws_without_player bigint,
  losses_with_player bigint,
  losses_without_player bigint,
  win_percentage_with_player numeric,
  win_percentage_without_player numeric,
  win_percentage_difference numeric,
  goals_for_with_player bigint,
  goals_for_without_player bigint,
  goals_against_with_player bigint,
  goals_against_without_player bigint,
  goal_difference_with_player bigint,
  goal_difference_without_player bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  WITH team_matches AS (
    -- All matches for this team
    SELECT 
      m.id as match_id,
      CASE 
        WHEN m.home_team_id = team_id_param::uuid THEN m.home_score
        WHEN m.away_team_id = team_id_param::uuid THEN m.away_score
      END as team_score,
      CASE 
        WHEN m.home_team_id = team_id_param::uuid THEN m.away_score
        WHEN m.away_team_id = team_id_param::uuid THEN m.home_score
      END as opponent_score,
      CASE 
        WHEN m.home_team_id = team_id_param::uuid AND m.home_score > m.away_score THEN 'win'
        WHEN m.away_team_id = team_id_param::uuid AND m.away_score > m.home_score THEN 'win'
        WHEN m.home_team_id = team_id_param::uuid AND m.home_score < m.away_score THEN 'loss'
        WHEN m.away_team_id = team_id_param::uuid AND m.away_score < m.home_score THEN 'loss'
        ELSE 'draw'
      END as result,
      -- Check if the player was in this match for this team
      EXISTS (
        SELECT 1 
        FROM public.player_match_assignments pma
        WHERE pma.match_id = m.id 
          AND pma.player_id = player_id_param::uuid
          AND pma.team_id = team_id_param::uuid
      ) as player_in_match
    FROM public.matches m
    WHERE 
      (m.home_team_id = team_id_param::uuid OR m.away_team_id = team_id_param::uuid)
      AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  )
  
  SELECT 
    player_id_param as player_id,
    (SELECT name FROM public.players WHERE id = player_id_param::uuid) as player_name,
    team_id_param as team_id,
    (SELECT name FROM public.teams WHERE id = team_id_param::uuid) as team_name,
    COUNT(*) FILTER (WHERE player_in_match) as matches_played,
    COUNT(*) FILTER (WHERE NOT player_in_match) as matches_without_player,
    COUNT(*) as team_total_matches,
    COUNT(*) FILTER (WHERE result = 'win' AND player_in_match) as wins_with_player,
    COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match) as wins_without_player,
    COUNT(*) FILTER (WHERE result = 'draw' AND player_in_match) as draws_with_player,
    COUNT(*) FILTER (WHERE result = 'draw' AND NOT player_in_match) as draws_without_player,
    COUNT(*) FILTER (WHERE result = 'loss' AND player_in_match) as losses_with_player,
    COUNT(*) FILTER (WHERE result = 'loss' AND NOT player_in_match) as losses_without_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_with_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE NOT player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE NOT player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_without_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE player_in_match) > 0 AND COUNT(*) FILTER (WHERE NOT player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE player_in_match)) * 100, 1) -
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE NOT player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_difference,
    COALESCE(SUM(team_score) FILTER (WHERE player_in_match), 0) as goals_for_with_player,
    COALESCE(SUM(team_score) FILTER (WHERE NOT player_in_match), 0) as goals_for_without_player,
    COALESCE(SUM(opponent_score) FILTER (WHERE player_in_match), 0) as goals_against_with_player,
    COALESCE(SUM(opponent_score) FILTER (WHERE NOT player_in_match), 0) as goals_against_without_player,
    COALESCE(SUM(team_score) FILTER (WHERE player_in_match), 0) - COALESCE(SUM(opponent_score) FILTER (WHERE player_in_match), 0) as goal_difference_with_player,
    COALESCE(SUM(team_score) FILTER (WHERE NOT player_in_match), 0) - COALESCE(SUM(opponent_score) FILTER (WHERE NOT player_in_match), 0) as goal_difference_without_player
  FROM 
    team_matches
  WHERE
    EXISTS (SELECT 1 FROM public.players WHERE id = player_id_param::uuid)
    AND EXISTS (SELECT 1 FROM public.teams WHERE id = team_id_param::uuid);
$$;

-- Fix get_player_all_teams_impact function
CREATE OR REPLACE FUNCTION public.get_player_all_teams_impact(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  team_id text,
  team_name text,
  matches_played bigint,
  matches_without_player bigint,
  team_total_matches bigint,
  wins_with_player bigint,
  wins_without_player bigint,
  draws_with_player bigint,
  draws_without_player bigint,
  losses_with_player bigint,
  losses_without_player bigint,
  win_percentage_with_player numeric,
  win_percentage_without_player numeric,
  win_percentage_difference numeric,
  goals_for_with_player bigint,
  goals_for_without_player bigint,
  goals_against_with_player bigint,
  goals_against_without_player bigint,
  goal_difference_with_player bigint,
  goal_difference_without_player bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  WITH player_teams AS (
    -- Get all teams the player has played for
    SELECT DISTINCT
      team_id
    FROM 
      public.player_match_assignments
    WHERE 
      player_id = player_id_param::uuid
  ),
  
  all_team_matches AS (
    -- All matches for each team the player has played for
    SELECT 
      pt.team_id,
      m.id as match_id,
      CASE 
        WHEN m.home_team_id = pt.team_id THEN m.home_score
        WHEN m.away_team_id = pt.team_id THEN m.away_score
      END as team_score,
      CASE 
        WHEN m.home_team_id = pt.team_id THEN m.away_score
        WHEN m.away_team_id = pt.team_id THEN m.home_score
      END as opponent_score,
      CASE 
        WHEN m.home_team_id = pt.team_id AND m.home_score > m.away_score THEN 'win'
        WHEN m.away_team_id = pt.team_id AND m.away_score > m.home_score THEN 'win'
        WHEN m.home_team_id = pt.team_id AND m.home_score < m.away_score THEN 'loss'
        WHEN m.away_team_id = pt.team_id AND m.away_score < m.home_score THEN 'loss'
        ELSE 'draw'
      END as result,
      -- Check if the player was in this match for this team
      EXISTS (
        SELECT 1 
        FROM public.player_match_assignments pma
        WHERE pma.match_id = m.id 
          AND pma.player_id = player_id_param::uuid
          AND pma.team_id = pt.team_id
      ) as player_in_match
    FROM 
      player_teams pt
    JOIN 
      public.matches m ON (m.home_team_id = pt.team_id OR m.away_team_id = pt.team_id)
    WHERE 
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  )
  
  SELECT 
    player_id_param as player_id,
    (SELECT name FROM public.players WHERE id = player_id_param::uuid) as player_name,
    tm.team_id::text,
    (SELECT name FROM public.teams WHERE id = tm.team_id) as team_name,
    COUNT(*) FILTER (WHERE player_in_match) as matches_played,
    COUNT(*) FILTER (WHERE NOT player_in_match) as matches_without_player,
    COUNT(*) as team_total_matches,
    COUNT(*) FILTER (WHERE result = 'win' AND player_in_match) as wins_with_player,
    COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match) as wins_without_player,
    COUNT(*) FILTER (WHERE result = 'draw' AND player_in_match) as draws_with_player,
    COUNT(*) FILTER (WHERE result = 'draw' AND NOT player_in_match) as draws_without_player,
    COUNT(*) FILTER (WHERE result = 'loss' AND player_in_match) as losses_with_player,
    COUNT(*) FILTER (WHERE result = 'loss' AND NOT player_in_match) as losses_without_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_with_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE NOT player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE NOT player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_without_player,
    CASE 
      WHEN COUNT(*) FILTER (WHERE player_in_match) > 0 AND COUNT(*) FILTER (WHERE NOT player_in_match) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE player_in_match)) * 100, 1) -
        ROUND((COUNT(*) FILTER (WHERE result = 'win' AND NOT player_in_match)::numeric / 
               COUNT(*) FILTER (WHERE NOT player_in_match)) * 100, 1)
      ELSE 0
    END as win_percentage_difference,
    COALESCE(SUM(team_score) FILTER (WHERE player_in_match), 0) as goals_for_with_player,
    COALESCE(SUM(team_score) FILTER (WHERE NOT player_in_match), 0) as goals_for_without_player,
    COALESCE(SUM(opponent_score) FILTER (WHERE player_in_match), 0) as goals_against_with_player,
    COALESCE(SUM(opponent_score) FILTER (WHERE NOT player_in_match), 0) as goals_against_without_player,
    COALESCE(SUM(team_score) FILTER (WHERE player_in_match), 0) - COALESCE(SUM(opponent_score) FILTER (WHERE player_in_match), 0) as goal_difference_with_player,
    COALESCE(SUM(team_score) FILTER (WHERE NOT player_in_match), 0) - COALESCE(SUM(opponent_score) FILTER (WHERE NOT player_in_match), 0) as goal_difference_without_player
  FROM 
    all_team_matches tm
  GROUP BY 
    tm.team_id
  HAVING
    COUNT(*) FILTER (WHERE player_in_match) > 0
  ORDER BY
    win_percentage_difference DESC, matches_played DESC;
$$;

-- Fix get_player_team_combinations function
CREATE OR REPLACE FUNCTION public.get_player_team_combinations()
RETURNS TABLE (
  team_id text,
  team_name text,
  player_id text,
  player_name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  win_percentage numeric,
  goals_for bigint,
  goals_against bigint,
  goal_difference bigint
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  WITH player_team_matches AS (
    SELECT 
      pma.team_id,
      t.name as team_name,
      pma.player_id,
      p.name as player_name,
      m.id as match_id,
      CASE 
        WHEN pma.team_id = m.home_team_id THEN m.home_score
        ELSE m.away_score
      END as team_score,
      CASE 
        WHEN pma.team_id = m.home_team_id THEN m.away_score
        ELSE m.home_score
      END as opponent_score,
      CASE 
        WHEN (pma.team_id = m.home_team_id AND m.home_score > m.away_score) 
          OR (pma.team_id = m.away_team_id AND m.away_score > m.home_score) THEN 'win'
        WHEN (pma.team_id = m.home_team_id AND m.home_score < m.away_score) 
          OR (pma.team_id = m.away_team_id AND m.away_score < m.home_score) THEN 'loss'
        ELSE 'draw'
      END as result
    FROM 
      public.player_match_assignments pma
    JOIN 
      public.teams t ON pma.team_id = t.id
    JOIN 
      public.players p ON pma.player_id = p.id
    JOIN 
      public.matches m ON pma.match_id = m.id
    WHERE 
      m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  )
  
  SELECT 
    ptm.team_id::text,
    MAX(ptm.team_name) as team_name,
    ptm.player_id::text,
    MAX(ptm.player_name) as player_name,
    COUNT(DISTINCT ptm.match_id) as matches_played,
    COUNT(DISTINCT ptm.match_id) FILTER (WHERE ptm.result = 'win') as wins,
    COUNT(DISTINCT ptm.match_id) FILTER (WHERE ptm.result = 'draw') as draws,
    COUNT(DISTINCT ptm.match_id) FILTER (WHERE ptm.result = 'loss') as losses,
    CASE 
      WHEN COUNT(DISTINCT ptm.match_id) > 0 THEN 
        ROUND((COUNT(DISTINCT ptm.match_id) FILTER (WHERE ptm.result = 'win')::numeric / 
              COUNT(DISTINCT ptm.match_id)) * 100, 1)
      ELSE 0
    END as win_percentage,
    SUM(ptm.team_score) as goals_for,
    SUM(ptm.opponent_score) as goals_against,
    SUM(ptm.team_score) - SUM(ptm.opponent_score) as goal_difference
  FROM 
    player_team_matches ptm
  GROUP BY 
    ptm.team_id, ptm.player_id
  HAVING 
    COUNT(DISTINCT ptm.match_id) >= 2
  ORDER BY 
    win_percentage DESC, matches_played DESC;
$$;

-- Grant permissions on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_all_teams_impact(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_team_performance_with_player(text, text) IS 'Returns team performance with and without a specific player (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_player_all_teams_impact(text) IS 'Returns player impact on all teams they have played for (SECURITY INVOKER with explicit search_path)';
COMMENT ON FUNCTION public.get_player_team_combinations() IS 'Returns all player-team combinations with performance statistics (SECURITY INVOKER with explicit search_path)';

COMMIT; 