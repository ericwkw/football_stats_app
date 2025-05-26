-- Anonymized mock data for team impact analysis demonstration
-- This script creates sample data to demonstrate team impact analysis
-- with fictitious player and team names

-- First, let's get Player1's ID and create variables for team IDs
DO $$
DECLARE
    player1_id UUID;
    blue_team_id UUID;
    red_team_id UUID;
    black_team_id UUID;
    match_id UUID;
BEGIN
    -- Get Player1's ID
    SELECT id INTO player1_id FROM players WHERE name = 'Player1';
    
    -- If Player1 doesn't exist, create it
    IF player1_id IS NULL THEN
        INSERT INTO players (name, position)
        VALUES ('Player1', 'Forward')
        RETURNING id INTO player1_id;
        RAISE NOTICE 'Created Player1 with ID: %', player1_id;
    END IF;

    -- Get team IDs - if they don't exist, create them
    SELECT id INTO blue_team_id FROM teams WHERE name = 'Blue Team';
    IF blue_team_id IS NULL THEN
        INSERT INTO teams (name, primary_shirt_color, team_type)
        VALUES ('Blue Team', 'blue', 'internal')
        RETURNING id INTO blue_team_id;
        RAISE NOTICE 'Created Blue Team with ID: %', blue_team_id;
    END IF;
    
    SELECT id INTO red_team_id FROM teams WHERE name = 'Red Team';
    IF red_team_id IS NULL THEN
        INSERT INTO teams (name, primary_shirt_color, team_type)
        VALUES ('Red Team', 'red', 'internal')
        RETURNING id INTO red_team_id;
        RAISE NOTICE 'Created Red Team with ID: %', red_team_id;
    END IF;
    
    SELECT id INTO black_team_id FROM teams WHERE name = 'Black Team';
    IF black_team_id IS NULL THEN
        INSERT INTO teams (name, primary_shirt_color, team_type)
        VALUES ('Black Team', 'black', 'internal')
        RETURNING id INTO black_team_id;
        RAISE NOTICE 'Created Black Team with ID: %', black_team_id;
    END IF;
    
    RAISE NOTICE 'Player1 ID: %, Blue Team ID: %, Red Team ID: %, Black Team ID: %', 
                  player1_id, blue_team_id, red_team_id, black_team_id;

    -- Create sample matches with Player1 on Red Team
    FOR i IN 1..6 LOOP
        -- Create match
        INSERT INTO matches (
            match_date, 
            venue, 
            match_type, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score
        ) VALUES (
            (CURRENT_DATE - (i * 7)), 
            'Home Venue',
            'internal_friendly',
            red_team_id,
            blue_team_id,
            CASE WHEN i % 3 = 0 THEN 1 ELSE 3 END, -- Red wins 4 games, loses 2
            CASE WHEN i % 3 = 0 THEN 3 ELSE 1 END  -- Blue wins 2 games, loses 4
        )
        RETURNING id INTO match_id;
        
        -- Assign Player1 to Red Team for this match
        INSERT INTO player_match_assignments (
            player_id,
            match_id,
            assigned_team_id
        ) VALUES (
            player1_id,
            match_id,
            red_team_id
        );
        
        -- Record stats for Player1
        INSERT INTO player_match_stats (
            player_id,
            match_id,
            goals,
            assists,
            minutes_played
        ) VALUES (
            player1_id,
            match_id,
            CASE WHEN i % 2 = 0 THEN 2 ELSE 1 END, -- Alternating 1 or 2 goals
            CASE WHEN i % 4 = 0 THEN 2 ELSE 0 END, -- Occasional assists
            90 -- Full match
        );
    END LOOP;
    
    -- Create 4 matches with Player1 on Blue Team
    FOR i IN 1..4 LOOP
        -- Create match
        INSERT INTO matches (
            match_date, 
            venue, 
            match_type, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score
        ) VALUES (
            (CURRENT_DATE - (i * 7 + 30)), -- Older matches
            'Away Venue',
            'internal_friendly',
            blue_team_id,
            black_team_id,
            CASE WHEN i % 2 = 0 THEN 2 ELSE 0 END, -- Blue wins 2 games, loses 2
            CASE WHEN i % 2 = 0 THEN 0 ELSE 1 END  -- Black wins 2 games, loses 2
        )
        RETURNING id INTO match_id;
        
        -- Assign Player1 to Blue Team for this match
        INSERT INTO player_match_assignments (
            player_id,
            match_id,
            assigned_team_id
        ) VALUES (
            player1_id,
            match_id,
            blue_team_id
        );
        
        -- Record stats for Player1
        INSERT INTO player_match_stats (
            player_id,
            match_id,
            goals,
            assists,
            minutes_played
        ) VALUES (
            player1_id,
            match_id,
            CASE WHEN i % 2 = 0 THEN 1 ELSE 0 END, -- Sometimes scores
            0, -- No assists
            90 -- Full match
        );
    END LOOP;
    
    -- Create 4 matches with Light Blue Team WITHOUT Player1 (for comparison)
    FOR i IN 1..4 LOOP
        -- Create match
        INSERT INTO matches (
            match_date, 
            venue, 
            match_type, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score
        ) VALUES (
            (CURRENT_DATE - (i * 7 + 60)), -- Even older matches
            'Neutral Venue',
            'internal_friendly',
            blue_team_id,
            black_team_id,
            CASE WHEN i % 4 = 0 THEN 2 ELSE 1 END, -- Blue wins 1 game, loses 3
            CASE WHEN i % 4 = 0 THEN 1 ELSE 2 END  -- Black wins 3 games, loses 1
        );
        -- No player assignment for Player1 (that's the point - matches without them)
    END LOOP;
    
    -- Create 4 matches with Red Team WITHOUT Player1 (for comparison)
    FOR i IN 1..4 LOOP
        -- Create match
        INSERT INTO matches (
            match_date, 
            venue, 
            match_type, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score
        ) VALUES (
            (CURRENT_DATE - (i * 7 + 90)), -- Even older matches
            'Away Venue',
            'internal_friendly',
            red_team_id,
            blue_team_id,
            CASE WHEN i % 2 = 0 THEN 2 ELSE 1 END, -- Red wins 2 games, loses 2
            CASE WHEN i % 2 = 0 THEN 1 ELSE 3 END  -- Blue wins 2 games, loses 2
        );
        -- No player assignment for Player1 (that's the point - matches without them)
    END LOOP;
    
    -- This data setup should produce a positive impact score for Player1 on Red Team
    -- and a lower impact score on Blue Team (demonstrating variable impact)
    
    RAISE NOTICE 'Mock data for Player1 created successfully';
END $$; 