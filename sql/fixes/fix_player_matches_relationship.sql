-- SQL script to fix the relationship between player_stats_with_assignments and matches
-- This script provides multiple approaches to fix the issue

-- First, verify that necessary tables exist
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

-- Approach 1: Ensure foreign key constraint has proper comments to be recognized by PostgREST
-- Check if the constraint exists, and if so, add appropriate comments
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'player_match_stats_match_id_fkey'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        EXECUTE 'COMMENT ON CONSTRAINT player_match_stats_match_id_fkey ON player_match_stats IS 
            E''@foreignFieldName player_stats\n@fieldName matches''';
    ELSE
        RAISE NOTICE 'Foreign key constraint player_match_stats_match_id_fkey does not exist, skipping comment';
    END IF;
END $$;

-- Approach 2: Add explicit comments on the tables and columns to help Supabase recognize the relationship
COMMENT ON TABLE player_match_stats IS 'Stores player performance statistics for matches';
COMMENT ON TABLE matches IS 'Stores match information';

COMMENT ON COLUMN player_match_stats.match_id IS 'Reference to matches(id)';
COMMENT ON COLUMN matches.id IS 'Primary key for matches';

-- Approach 3: Re-create the view with an explicit relationship to matches table
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
  m.id AS match_reference_id,
  m.match_date,
  m.venue,
  m.match_type,
  m.home_score,
  m.away_score,
  m.home_team_id,
  m.away_team_id
FROM
  player_match_stats pms
LEFT JOIN
  player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
LEFT JOIN
  players p ON pms.player_id = p.id
LEFT JOIN
  teams t ON pma.team_id = t.id
LEFT JOIN
  matches m ON pms.match_id = m.id;

-- Add explicit comment on the view's relationship to matches
COMMENT ON VIEW player_stats_with_assignments IS 'Combines player match statistics with team assignments and match details';
COMMENT ON COLUMN player_stats_with_assignments.match_id IS 'References matches(id)';
COMMENT ON COLUMN player_stats_with_assignments.match_reference_id IS 'Duplicates match_id to make relationship explicit, references matches(id)';

-- Approach 4: Create an additional view specifically for use in the API with embedded match data
-- This may be easier to use from the client side without relying on Supabase's relationship handling
CREATE OR REPLACE VIEW player_match_stats_complete AS
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
  jsonb_build_object(
    'id', m.id,
    'match_date', m.match_date,
    'venue', m.venue,
    'match_type', m.match_type,
    'home_score', m.home_score,
    'away_score', m.away_score,
    'home_team', (SELECT jsonb_agg(jsonb_build_object('name', ht.name)) FROM teams ht WHERE ht.id = m.home_team_id),
    'away_team', (SELECT jsonb_agg(jsonb_build_object('name', at.name)) FROM teams at WHERE at.id = m.away_team_id)
  ) AS match_data
FROM
  player_match_stats pms
LEFT JOIN
  player_match_assignments pma ON pms.player_id = pma.player_id AND pms.match_id = pma.match_id
LEFT JOIN
  players p ON pms.player_id = p.id
LEFT JOIN
  teams t ON pma.team_id = t.id
LEFT JOIN
  matches m ON pms.match_id = m.id;

COMMENT ON VIEW player_match_stats_complete IS 'Provides all match data embedded in a JSONB column for direct access without relying on relationships';

-- Set ownership and permissions for both views
ALTER VIEW player_stats_with_assignments OWNER TO postgres;
GRANT SELECT ON player_stats_with_assignments TO authenticated;

ALTER VIEW player_match_stats_complete OWNER TO postgres;
GRANT SELECT ON player_match_stats_complete TO authenticated;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Optional: Create a helper function to force the schema cache refresh
-- This can be called from client-side if needed
CREATE OR REPLACE FUNCTION refresh_schema_cache() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_schema_cache() IS 'Helper function to force PostgREST to refresh its schema cache';
GRANT EXECUTE ON FUNCTION refresh_schema_cache() TO authenticated;

COMMIT; 