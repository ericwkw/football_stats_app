-- SQL script to fix the relationship between player_stats_with_assignments and matches

-- First verify that the tables and view exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_match_stats') THEN
        RAISE EXCEPTION 'Table player_match_stats does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_match_assignments') THEN
        RAISE EXCEPTION 'Table player_match_assignments does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') THEN
        RAISE EXCEPTION 'Table matches does not exist';
    END IF;
END $$;

-- Begin transaction
BEGIN;

-- Drop and recreate the view with all necessary relationships
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
  t.primary_shirt_color AS team_color,
  m.id AS match_reference_id -- Add this to make the relationship explicit
FROM
  player_match_stats pms
LEFT JOIN
  player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
LEFT JOIN
  players p ON pms.player_id = p.id
LEFT JOIN
  teams t ON pma.team_id = t.id
LEFT JOIN
  matches m ON pms.match_id = m.id; -- Explicit join to matches table

-- Add explicit comments for Supabase to recognize the relationships
COMMENT ON VIEW player_stats_with_assignments IS 'Combines player match statistics with team assignments for each match';
COMMENT ON COLUMN player_stats_with_assignments.match_id IS 'Reference to the matches table';
COMMENT ON COLUMN player_stats_with_assignments.player_id IS 'Reference to the players table';
COMMENT ON COLUMN player_stats_with_assignments.assigned_team_id IS 'Reference to the teams table';

-- Add foreign key relationship manually to the postgREST schema cache
-- This is a special Supabase comment format that helps define relationships for the API
COMMENT ON CONSTRAINT player_match_stats_match_id_fkey ON player_match_stats IS
  E'@foreignFieldName player_stats\n@fieldName matches';

-- Set ownership and permissions
ALTER VIEW player_stats_with_assignments OWNER TO postgres;
GRANT SELECT ON player_stats_with_assignments TO authenticated;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT; 