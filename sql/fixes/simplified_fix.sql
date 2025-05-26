-- SQL script to add the missing relationship between player_match_stats and player_match_assignments

-- Create a relationship between player_match_stats and player_match_assignments
COMMENT ON TABLE player_match_stats IS 'Stores player performance statistics for matches';
COMMENT ON TABLE player_match_assignments IS 'Stores the team assignment for each player in each match';

-- Adding explicit relationship comments
COMMENT ON COLUMN player_match_stats.player_id IS 'Reference to the player';
COMMENT ON COLUMN player_match_stats.match_id IS 'Reference to the match';
COMMENT ON COLUMN player_match_assignments.player_id IS 'Reference to the player';
COMMENT ON COLUMN player_match_assignments.match_id IS 'Reference to the match';

-- Create view to expose the relationship
CREATE OR REPLACE VIEW player_stats_with_assignments AS
SELECT 
    pms.*,
    pma.team_id as assigned_team_id
FROM 
    player_match_stats pms
LEFT JOIN 
    player_match_assignments pma 
ON 
    pms.player_id = pma.player_id AND pms.match_id = pma.match_id;

-- Set ownership and permissions
ALTER VIEW player_stats_with_assignments OWNER TO postgres;
GRANT SELECT ON player_stats_with_assignments TO authenticated; 