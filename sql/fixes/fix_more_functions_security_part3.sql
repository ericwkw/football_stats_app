-- Fix additional function security issues (part 4)
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