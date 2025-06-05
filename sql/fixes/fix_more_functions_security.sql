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

COMMIT; 