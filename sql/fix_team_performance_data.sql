-- Fix for Player2's match data to show proper team impact
-- This script will:
-- 1. Check if Player2 exists in the database
-- 2. Verify their match assignments
-- 3. Make sure their match stats are properly recorded
-- 4. Fix any data inconsistencies found

-- First, let's check Player2's player info
SELECT id, name, position, team_id 
FROM players 
WHERE name = 'Player2';

-- Then, check their team info
SELECT t.id, t.name
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE p.name = 'Player2';

-- Check Player2's match assignments
SELECT pma.* 
FROM player_match_assignments pma
JOIN players p ON pma.player_id = p.id
WHERE p.name = 'Player2';

-- Check Player2's match stats
SELECT pms.* 
FROM player_match_stats pms
JOIN players p ON pms.player_id = p.id
WHERE p.name = 'Player2';

-- Matches that FCB United played
SELECT m.* 
FROM matches m
JOIN teams t ON m.home_team_id = t.id OR m.away_team_id = t.id
WHERE t.name = 'FCB United';

-- Fix: Ensure Player2 has proper team assignments for matches they played with FCB United
-- First, identify Player2's ID and FCB United's ID

DO $$
DECLARE 
    kahei_id uuid;
    fcb_id uuid;
BEGIN
    -- Get Player2's ID
    SELECT id INTO kahei_id FROM players WHERE name = 'Player2';
    
    -- Get FCB United's ID
    SELECT id INTO fcb_id FROM teams WHERE name = 'FCB United';
    
    IF kahei_id IS NOT NULL AND fcb_id IS NOT NULL THEN
        -- Ensure Player2 has proper team assignments for all matches
        -- where they have stats but no assignment
        INSERT INTO player_match_assignments (player_id, match_id, team_id)
        SELECT 
            pms.player_id, 
            pms.match_id, 
            fcb_id
        FROM 
            player_match_stats pms
        LEFT JOIN 
            player_match_assignments pma 
            ON pms.player_id = pma.player_id 
            AND pms.match_id = pma.match_id
        WHERE 
            pms.player_id = kahei_id 
            AND pma.id IS NULL
            AND (
                -- Only for matches where FCB United played
                EXISTS (
                    SELECT 1 
                    FROM matches m 
                    WHERE m.id = pms.match_id
                    AND (m.home_team_id = fcb_id OR m.away_team_id = fcb_id)
                )
            );
            
        -- Update existing assignments that have NULL team_id
        UPDATE player_match_assignments 
        SET team_id = fcb_id
        WHERE 
            player_id = kahei_id 
            AND team_id IS NULL
            AND EXISTS (
                SELECT 1 
                FROM matches m 
                WHERE m.id = match_id
                AND (m.home_team_id = fcb_id OR m.away_team_id = fcb_id)
            );
            
        RAISE NOTICE 'Fixed team assignments for Player2';
    ELSE
        RAISE NOTICE 'Could not find Player2 or FCB United';
    END IF;
END $$; 