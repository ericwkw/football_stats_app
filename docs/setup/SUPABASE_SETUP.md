# Supabase Setup Instructions

This document provides instructions for setting up the Supabase database for the Football Stats application.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL editor

## Setup Steps

### 1. Set up Tables

Run the following SQL commands in the Supabase SQL editor to set up the necessary tables:

```sql
-- Create tables
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  primary_shirt_color TEXT NOT NULL,
  secondary_shirt_color TEXT,
  team_type TEXT CHECK (team_type IN ('club', 'external', 'internal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT CHECK (position IN ('Forward', 'Midfielder', 'Defender', 'Goalkeeper')),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  match_date TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  venue TEXT NOT NULL,
  match_type TEXT CHECK (match_type IN ('internal_friendly', 'external_game')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  minutes_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

CREATE TABLE player_match_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);
```

### 2. Create Indexes

Create indexes for better query performance:

```sql
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX idx_player_match_stats_player_id ON player_match_stats(player_id);
CREATE INDEX idx_player_match_stats_match_id ON player_match_stats(match_id);
CREATE INDEX idx_player_match_assignments_match_id ON player_match_assignments(match_id);
CREATE INDEX idx_player_match_assignments_player_id ON player_match_assignments(player_id);
CREATE INDEX idx_player_match_assignments_team_id ON player_match_assignments(team_id);
```

### 3. Set up SQL Functions

Run the SQL functions from the `updated_sql_functions.sql` file in the Supabase SQL editor. These functions will be used by the application to calculate statistics.

### 4. Set up Row Level Security (RLS)

To secure your data, set up Row Level Security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to read all data
CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON player_match_stats FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON player_match_assignments FOR SELECT USING (true);

-- Create policies that allow authenticated users with admin role to modify data
CREATE POLICY "Allow admin write access" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin write access" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin write access" ON matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin write access" ON player_match_stats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin write access" ON player_match_assignments FOR ALL USING (auth.role() = 'authenticated');
```

### 5. Add Sample Data (Optional)

If you want to start with some sample data, you can run the following SQL:

```sql
-- Insert sample teams
INSERT INTO teams (name, primary_shirt_color, team_type) VALUES
('FCB United', 'Blue', 'club'),
('Light Blue', 'Light Blue', 'internal'),
('Red', 'Red', 'internal'),
('Black', 'Black', 'internal'),
('Rival FC', 'Green', 'external');

-- Insert sample players (you can add more)
INSERT INTO players (name, position, team_id) 
SELECT 'John Doe', 'Forward', id FROM teams WHERE name = 'FCB United';

INSERT INTO players (name, position, team_id) 
SELECT 'Jane Smith', 'Midfielder', id FROM teams WHERE name = 'FCB United';

INSERT INTO players (name, position, team_id) 
SELECT 'Mike Johnson', 'Defender', id FROM teams WHERE name = 'FCB United';

INSERT INTO players (name, position, team_id) 
SELECT 'Sarah Brown', 'Goalkeeper', id FROM teams WHERE name = 'FCB United';
```

## Troubleshooting

If you encounter errors related to the `uuid_generate_v4()` function, you may need to enable the uuid-ossp extension:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

If you need to reset your database, you can drop all tables and start over:

```sql
DROP TABLE IF EXISTS player_match_assignments CASCADE;
DROP TABLE IF EXISTS player_match_stats CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
```

## Verifying the Setup

After completing the setup, you can verify that everything is working correctly by running the following query:

```sql
SELECT * FROM teams;
SELECT * FROM players;
```

You should see the sample data you added in the results. 