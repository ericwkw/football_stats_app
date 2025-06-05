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
