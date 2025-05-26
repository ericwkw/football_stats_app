-- Create a view that joins player_match_stats with player_match_assignments
CREATE OR REPLACE VIEW player_stats_with_assignments AS
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

-- Comment on view
COMMENT ON VIEW player_stats_with_assignments IS 'Combines player match statistics with team assignments for each match'; 