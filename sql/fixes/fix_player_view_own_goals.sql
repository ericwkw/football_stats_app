-- Fix missing own_goals field in player_stats_with_assignments view
-- This script adds the missing field to make the view compatible with the player details page

BEGIN;

-- Drop and recreate the player_stats_with_assignments view to include own_goals
DROP VIEW IF EXISTS player_stats_with_assignments;

CREATE OR REPLACE VIEW player_stats_with_assignments AS
SELECT
  pms.id,
  pms.player_id,
  pms.match_id,
  pms.goals,
  pms.assists,
  pms.own_goals,
  pms.minutes_played,
  pms.created_at,
  pma.team_id AS assigned_team_id,
  p.name AS player_name,
  p.position AS player_position,
  t.name AS team_name,
  t.primary_shirt_color AS team_color
FROM
  public.player_match_stats pms
LEFT JOIN
  public.player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
LEFT JOIN
  public.players p ON pms.player_id = p.id
LEFT JOIN
  public.teams t ON pma.team_id = t.id;

-- Apply SECURITY INVOKER to the view
ALTER VIEW player_stats_with_assignments SET (security_invoker = true);

-- Comment on view
COMMENT ON VIEW player_stats_with_assignments IS 'Combines player match statistics with team assignments for each match';

-- Grant appropriate permissions
GRANT SELECT ON player_stats_with_assignments TO authenticated;

COMMIT; 