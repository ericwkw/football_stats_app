-- Fix additional function security issues (part 3)
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

COMMIT; 