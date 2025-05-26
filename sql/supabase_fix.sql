-- Functions to fix player impact analysis

-- First drop the functions if they exist
DROP FUNCTION IF EXISTS public.get_player_all_teams_impact(text);
DROP FUNCTION IF EXISTS public.get_player_team_combinations(text, text);

-- Recreate the function with the correct table reference (player_match_stats instead of player_stats)
-- Also fix the ambiguous team_id column references
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
      tm.team_id,
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
      team_matches tm
    GROUP BY
      tm.team_id, player_participated
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
    t.id IN (SELECT pt.team_id FROM player_teams pt)
  ORDER BY
    matches_played DESC,
    ABS(impact_score) DESC;

  -- If no results were found
  IF NOT FOUND THEN
    RAISE NOTICE 'No team assignments found for player %', player_id_param;
  END IF;
END;
$$;

-- Add the player_team_combinations function that might be missing
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
        SELECT DISTINCT pma.team_id FROM public.player_match_assignments pma
        WHERE pma.player_id = player_id_uuid
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
GRANT EXECUTE ON FUNCTION public.get_player_all_teams_impact(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_player_all_teams_impact(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_all_teams_impact(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations(text, text) TO authenticated; 