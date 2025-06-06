-- Fix security settings for leaderboard views
-- This script updates all views to use SECURITY INVOKER instead of SECURITY DEFINER

BEGIN;

-- First drop the existing views
DROP VIEW IF EXISTS top_goalkeepers_view;
DROP VIEW IF EXISTS top_scorers_view;
DROP VIEW IF EXISTS top_assists_view;

-- Create top_goalkeepers_view
CREATE VIEW top_goalkeepers_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
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
  ), 0)::bigint as clean_sheets,
  CASE 
    WHEN COUNT(DISTINCT pms.match_id) > 0 THEN
      ROUND((COALESCE(SUM(
        CASE 
          WHEN p.position = 'Goalkeeper' AND 
               (
                 (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
                 (pma.team_id = m.away_team_id AND m.home_score = 0)
               )
          THEN 1
          ELSE 0
        END
      ), 0)::numeric / COUNT(DISTINCT pms.match_id)) * 100, 1)
    ELSE 0
  END as clean_sheet_percentage
FROM 
  players p
LEFT JOIN 
  player_match_stats pms ON p.id = pms.player_id
LEFT JOIN
  matches m ON pms.match_id = m.id
LEFT JOIN
  player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
WHERE
  p.position = 'Goalkeeper'
GROUP BY 
  p.id, p.name
ORDER BY
  clean_sheets DESC, clean_sheet_percentage DESC, matches_played DESC, p.name;

-- Apply SECURITY INVOKER to the view
ALTER VIEW top_goalkeepers_view SET (security_invoker = true);

-- Create top_scorers_view
CREATE VIEW top_scorers_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COALESCE(SUM(pms.goals), 0)::bigint as goals,
  COALESCE(SUM(
    CASE 
      WHEN m.match_type = 'external_game' THEN pms.goals * 3
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
  weighted_goals DESC, goals DESC, p.name;

-- Apply SECURITY INVOKER to the view
ALTER VIEW top_scorers_view SET (security_invoker = true);

-- Create top_assists_view
CREATE VIEW top_assists_view AS
SELECT
  p.id as player_id,
  p.name as player_name,
  COALESCE(SUM(pms.assists), 0)::bigint as assists,
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
GROUP BY 
  p.id, p.name
ORDER BY
  weighted_assists DESC, assists DESC, p.name;

-- Apply SECURITY INVOKER to the view
ALTER VIEW top_assists_view SET (security_invoker = true);

-- Re-apply permissions
ALTER VIEW top_scorers_view OWNER TO postgres;
GRANT SELECT ON top_scorers_view TO authenticated;

ALTER VIEW top_assists_view OWNER TO postgres;
GRANT SELECT ON top_assists_view TO authenticated;

ALTER VIEW top_goalkeepers_view OWNER TO postgres;
GRANT SELECT ON top_goalkeepers_view TO authenticated;

COMMIT; 