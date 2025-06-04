-- Fix security settings for player_stats_with_assignments view
-- This script updates the view to use SECURITY INVOKER instead of SECURITY DEFINER

BEGIN;

-- First drop the existing view
DROP VIEW IF EXISTS player_stats_with_assignments;

-- Create the view
CREATE VIEW player_stats_with_assignments AS
SELECT
  pms.id,
  pms.player_id,
  pms.match_id,
  pms.goals,
  pms.assists,
  pms.minutes_played,
  pms.created_at,
  pma.team_id AS assigned_team_id,
  p.name AS player_name,
  p.position AS player_position,
  t.name AS team_name,
  t.primary_shirt_color AS team_color
FROM
  player_match_stats pms
LEFT JOIN
  player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
LEFT JOIN
  players p ON pms.player_id = p.id
LEFT JOIN
  teams t ON pma.team_id = t.id;

-- Apply SECURITY INVOKER to the view
ALTER VIEW player_stats_with_assignments SET (security_invoker = true);

-- Re-apply permissions
ALTER VIEW player_stats_with_assignments OWNER TO postgres;
GRANT SELECT ON player_stats_with_assignments TO authenticated;

-- Comment on view
COMMENT ON VIEW player_stats_with_assignments IS 'Combines player match statistics with team assignments for each match';

COMMIT; 