-- Fix function search path issues
-- This script sets explicit search paths for functions to eliminate security warnings

BEGIN;

-- Fix get_internal_top_goalkeepers function
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

-- Fix permissions
GRANT EXECUTE ON FUNCTION public.get_internal_top_goalkeepers(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_internal_top_goalkeepers(integer) TO authenticated;

-- Check if get_internal_top_assists also needs fixing
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

-- Fix permissions
GRANT EXECUTE ON FUNCTION public.get_internal_top_assists(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_internal_top_assists(integer) TO authenticated;

COMMIT; 