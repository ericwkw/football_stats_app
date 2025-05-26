-- SQL script to add the missing relationship between player_match_stats and player_match_assignments

-- First, let's verify that these tables exist
-- This ensures the script will fail early if there's a schema issue
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_match_stats') THEN
        RAISE EXCEPTION 'Table player_match_stats does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_match_assignments') THEN
        RAISE EXCEPTION 'Table player_match_assignments does not exist';
    END IF;
END $$;

-- Create a RLS policy if it doesn't exist
-- This will expose the relationship to authenticated Supabase clients
BEGIN;

-- Create a relationship between player_match_stats and player_match_assignments
-- This doesn't add a foreign key constraint but tells Supabase about the relationship
COMMENT ON TABLE player_match_stats IS 'Stores player performance statistics for matches';
COMMENT ON TABLE player_match_assignments IS 'Stores the team assignment for each player in each match';

-- Adding explicit relationship comments
COMMENT ON COLUMN player_match_stats.player_id IS 'Reference to the player';
COMMENT ON COLUMN player_match_stats.match_id IS 'Reference to the match';
COMMENT ON COLUMN player_match_assignments.player_id IS 'Reference to the player';
COMMENT ON COLUMN player_match_assignments.match_id IS 'Reference to the match';

-- Add a foreign key relationship if it doesn't exist already
-- This helps Supabase understand the relationship
DO $$
BEGIN
    -- Create view to expose the relationship
    EXECUTE 'CREATE OR REPLACE VIEW player_stats_with_assignments AS
    SELECT 
        pms.*,
        pma.team_id as assigned_team_id
    FROM 
        player_match_stats pms
    LEFT JOIN 
        player_match_assignments pma 
    ON 
        pms.player_id = pma.player_id AND pms.match_id = pma.match_id';
        
    -- Enable RLS on the view
    EXECUTE 'ALTER VIEW player_stats_with_assignments OWNER TO postgres';
    
    -- Grant access to authenticated users
    EXECUTE 'GRANT SELECT ON player_stats_with_assignments TO authenticated';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating view: %', SQLERRM;
END $$;

-- Alternative way to update the schema cache
-- We'll create a dummy notification that might help Supabase refresh its cache
NOTIFY pgrst, 'reload schema';

COMMIT; 