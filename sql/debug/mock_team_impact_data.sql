-- This script creates mock data for Player1 to demonstrate team impact analysis
-- It ensures Player1 has played for multiple teams with sufficient match data

-- First, let's get Player1's ID and create variables for team IDs
DO $$
DECLARE
    aaron_id UUID;
    light_blue_team_id UUID;
    red_team_id UUID;
    black_team_id UUID;
    match_id UUID;
BEGIN
    -- Get Player1's ID
    SELECT id INTO aaron_id FROM players WHERE name = 'Player1';
    
    -- If Player1 doesn't exist, raise an exception
    IF aaron_id IS NULL THEN
        RAISE EXCEPTION 'Player1 not found in the players table';
    END IF;

    -- Get team IDs - if they don't exist, create them
    SELECT id INTO light_blue_team_id FROM teams WHERE name = 'Light Blue Team';
    IF light_blue_team_id IS NULL THEN
        INSERT INTO teams (name, primary_shirt_color, team_type)
        VALUES ('Light Blue Team', 'light-blue', 'internal')
        RETURNING id INTO light_blue_team_id;
        RAISE NOTICE 'Created Light Blue Team with ID: %', light_blue_team_id;
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
    
    RAISE NOTICE 'Player1 ID: %, Light Blue Team ID: %, Red Team ID: %, Black Team ID: %', 
                  aaron_id, light_blue_team_id, red_team_id, black_team_id;

    -- Create 4 matches with Player1 on Light Blue Team
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
            (CURRENT_DATE - (i * 7)), -- Each match a week apart
            'Home Stadium',
            'internal_friendly',
            light_blue_team_id,
            red_team_id,
            CASE WHEN i % 2 = 0 THEN 3 ELSE 1 END, -- Light Blue wins 2 games, loses 2
            CASE WHEN i % 2 = 0 THEN 1 ELSE 2 END  -- Red wins 2 games, loses 2
        ) RETURNING id INTO match_id;
        
        -- Assign Player1 to Light Blue Team for this match
        INSERT INTO player_match_assignments (
            match_id,
            player_id,
            team_id
        ) VALUES (
            match_id,
            aaron_id,
            light_blue_team_id
        );
        
        -- Add stats for Player1 (defender with occasional own goal)
        INSERT INTO player_match_stats (
            player_id,
            match_id,
            goals,
            assists,
            own_goals,
            minutes_played
        ) VALUES (
            aaron_id,
            match_id,
            0, -- No goals (defender)
            CASE WHEN i = 1 THEN 1 ELSE 0 END, -- One assist in first match
            CASE WHEN i = 3 THEN 1 ELSE 0 END, -- One own goal in third match
            90 -- Full game
        );
    END LOOP;
    
    -- Create 4 matches with Player1 on Red Team
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
            'Away Stadium',
            'internal_friendly',
            red_team_id,
            black_team_id,
            CASE WHEN i % 3 = 0 THEN 1 ELSE 3 END, -- Red wins 3 games, loses 1
            CASE WHEN i % 3 = 0 THEN 2 ELSE 1 END  -- Black wins 1 game, loses 3
        ) RETURNING id INTO match_id;
        
        -- Assign Player1 to Red Team for this match
        INSERT INTO player_match_assignments (
            match_id,
            player_id,
            team_id
        ) VALUES (
            match_id,
            aaron_id,
            red_team_id
        );
        
        -- Add stats for Player1
        INSERT INTO player_match_stats (
            player_id,
            match_id,
            goals,
            assists,
            own_goals,
            minutes_played
        ) VALUES (
            aaron_id,
            match_id,
            CASE WHEN i = 2 THEN 1 ELSE 0 END, -- One goal in second match (rare for defender)
            CASE WHEN i = 4 THEN 1 ELSE 0 END, -- One assist in fourth match
            0, -- No own goals
            90 -- Full game
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
            light_blue_team_id,
            black_team_id,
            CASE WHEN i % 4 = 0 THEN 2 ELSE 1 END, -- Light Blue wins 1 game, loses 3
            CASE WHEN i % 4 = 0 THEN 1 ELSE 2 END  -- Black wins 3 games, loses 1
        );
        -- No player assignment for Player1 (that's the point - matches without him)
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
            light_blue_team_id,
            CASE WHEN i % 2 = 0 THEN 2 ELSE 1 END, -- Red wins 2 games, loses 2
            CASE WHEN i % 2 = 0 THEN 1 ELSE 3 END  -- Light Blue wins 2 games, loses 2
        );
        -- No player assignment for Player1 (that's the point - matches without him)
    END LOOP;
    
    -- This data setup should produce a positive impact score for Player1 on Red Team
    -- and a negative impact score on Light Blue Team (demonstrating his variable impact)
    
    RAISE NOTICE 'Mock data for Player1 created successfully';
END $$; 