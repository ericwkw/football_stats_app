-- Specific fix for the team performance function

-- Drop all variations of the function to fix ambiguity issues
DROP FUNCTION IF EXISTS public.get_team_performance_with_player(text, text);
DROP FUNCTION IF EXISTS public.get_team_performance_with_player(uuid, uuid);
DROP FUNCTION IF EXISTS get_team_performance_with_player(player_id_param text, team_id_param text);
DROP FUNCTION IF EXISTS get_team_performance_with_player(player_id_param uuid, team_id_param uuid);

-- Create only one version that properly handles UUID conversion
CREATE OR REPLACE FUNCTION public.get_team_performance_with_player(player_id_param text, team_id_param text)
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
  WITH player_match_ids AS (
    -- Get all match IDs where this player played for this specific team
    SELECT DISTINCT
      pma.match_id
    FROM
      player_match_assignments pma
    WHERE
      pma.player_id = player_id_param::uuid AND
      pma.team_id = team_id_param::uuid
  ),
  player_matches AS (
    -- Matches where the player played for the specified team
    SELECT
      m.id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score,
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
      m.id IN (SELECT match_id FROM player_match_ids) AND
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO authenticated; 