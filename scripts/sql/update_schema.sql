-- Update schema for player_match_stats table to include additional statistics fields

-- First check if columns already exist
DO $$
BEGIN
    -- Add shots_total if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'shots_total') THEN
        ALTER TABLE player_match_stats ADD COLUMN shots_total INTEGER DEFAULT 0;
    END IF;

    -- Add shots_on_target if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'shots_on_target') THEN
        ALTER TABLE player_match_stats ADD COLUMN shots_on_target INTEGER DEFAULT 0;
    END IF;

    -- Add passes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'passes') THEN
        ALTER TABLE player_match_stats ADD COLUMN passes INTEGER DEFAULT 0;
    END IF;

    -- Add key_passes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'key_passes') THEN
        ALTER TABLE player_match_stats ADD COLUMN key_passes INTEGER DEFAULT 0;
    END IF;

    -- Add yellow_cards if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'yellow_cards') THEN
        ALTER TABLE player_match_stats ADD COLUMN yellow_cards INTEGER DEFAULT 0;
    END IF;

    -- Add red_cards if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'red_cards') THEN
        ALTER TABLE player_match_stats ADD COLUMN red_cards INTEGER DEFAULT 0;
    END IF;

    -- Add xg (expected goals) if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'xg') THEN
        ALTER TABLE player_match_stats ADD COLUMN xg NUMERIC(5,2) DEFAULT 0;
    END IF;

    -- Add tackles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'tackles') THEN
        ALTER TABLE player_match_stats ADD COLUMN tackles INTEGER DEFAULT 0;
    END IF;

    -- Add interceptions if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'interceptions') THEN
        ALTER TABLE player_match_stats ADD COLUMN interceptions INTEGER DEFAULT 0;
    END IF;

    -- Add attendance, weather_conditions and referee to matches if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'matches'
                   AND column_name = 'attendance') THEN
        ALTER TABLE matches ADD COLUMN attendance INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'matches'
                   AND column_name = 'weather_conditions') THEN
        ALTER TABLE matches ADD COLUMN weather_conditions TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'matches'
                   AND column_name = 'referee') THEN
        ALTER TABLE matches ADD COLUMN referee TEXT DEFAULT NULL;
    END IF;

    -- Add additional player fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'players'
                   AND column_name = 'jersey_number') THEN
        ALTER TABLE players ADD COLUMN jersey_number INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'players'
                   AND column_name = 'height_cm') THEN
        ALTER TABLE players ADD COLUMN height_cm INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'players'
                   AND column_name = 'weight_kg') THEN
        ALTER TABLE players ADD COLUMN weight_kg INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'players'
                   AND column_name = 'dominant_foot') THEN
        ALTER TABLE players ADD COLUMN dominant_foot TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'players'
                   AND column_name = 'birth_date') THEN
        ALTER TABLE players ADD COLUMN birth_date DATE DEFAULT NULL;
    END IF;

    -- Add own_goals if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'player_match_stats'
                   AND column_name = 'own_goals') THEN
        ALTER TABLE player_match_stats ADD COLUMN own_goals INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update match_type column to match our requirements
DO $$
BEGIN
    -- Make sure match_type accepts the values we need
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'matches'
               AND column_name = 'match_type') THEN
        
        -- Drop the constraint if it exists
        EXECUTE (
            'ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_type_check'
        );
        
        -- Add updated constraint
        EXECUTE (
            'ALTER TABLE matches ADD CONSTRAINT matches_match_type_check CHECK (match_type IN (''internal_friendly'', ''external_game''))'
        );
    END IF;
END $$;

-- Add indices for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_player_match_stats_goals ON player_match_stats(goals);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_assists ON player_match_stats(assists);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_minutes_played ON player_match_stats(minutes_played);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_xg ON player_match_stats(xg);
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);

-- Grant permissions to all roles
GRANT ALL PRIVILEGES ON TABLE player_match_stats TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON TABLE players TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON TABLE matches TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON TABLE teams TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON TABLE player_match_assignments TO authenticated, anon, service_role;

-- Update any existing rows to have own_goals = 0 if null
UPDATE player_match_stats 
SET own_goals = 0 
WHERE own_goals IS NULL; 