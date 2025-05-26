# Supabase Setup for Player Match Assignments

This document provides instructions for setting up the required database tables, views, and functions for the player match assignments feature in the Soccer Stats App.

## Setup Instructions

Follow these steps in the Supabase SQL Editor to properly set up your database:

### 1. Create player_match_assignments Table

```sql
-- Create the player_match_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_match_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One player can only have one team assignment per match
  UNIQUE(match_id, player_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_player_match_assignments_match_id ON player_match_assignments(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_assignments_player_id ON player_match_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_assignments_team_id ON player_match_assignments(team_id);

-- Comment on table and columns
COMMENT ON TABLE player_match_assignments IS 'Stores the team assignment for each player in each match';
COMMENT ON COLUMN player_match_assignments.match_id IS 'Reference to the match';
COMMENT ON COLUMN player_match_assignments.player_id IS 'Reference to the player';
COMMENT ON COLUMN player_match_assignments.team_id IS 'Reference to the team the player was assigned to for this match';
```

### 2. Create Player Stats With Assignments View

```sql
-- Create a view that joins player_match_stats with player_match_assignments
CREATE OR REPLACE VIEW player_stats_with_assignments AS
SELECT
  pms.id,
  pms.player_id,
  pms.match_id,
  pms.goals,
  pms.assists,
  pms.minutes_played,
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
```

### 3. Create get_team_top_scorers Function

```sql
-- Function to get top scorers for a specific team using player_match_assignments
CREATE OR REPLACE FUNCTION get_team_top_scorers(team_id_param text, limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric,
  matches_played bigint
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0)::bigint as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COUNT(DISTINCT pms.match_id)::bigint as matches_played
  FROM 
    players p
  JOIN 
    player_match_stats pms ON p.id = pms.player_id
  JOIN
    matches m ON pms.match_id = m.id
  JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    pma.team_id = team_id_param::uuid
  GROUP BY 
    p.id, p.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$;
```

### 4. Update get_all_player_statistics Function

```sql
-- Function to get all player statistics - UPDATED to use player_match_assignments
CREATE OR REPLACE FUNCTION get_all_player_statistics()
RETURNS TABLE (
  player_id text,
  player_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  clean_sheets bigint,
  weighted_goals numeric,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0)::bigint as goals,
    COALESCE(SUM(pms.assists), 0)::bigint as assists,
    COALESCE(SUM(
      CASE 
        WHEN p.position = 'Goalkeeper' AND 
             (
               (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
               (pma.team_id = m.away_team_id AND m.home_score = 0)
             )
        THEN 1
        ELSE 0
      END
    ), 0)::bigint as clean_sheets,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3
        ELSE pms.assists
      END
    ), 0) as weighted_assists
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  GROUP BY 
    p.id, p.name;
$$;
```

### 5. Update get_player_statistics Function

```sql
-- Function to get player statistics for a specific player - UPDATED to use player_match_assignments
CREATE OR REPLACE FUNCTION get_player_statistics(player_id_param text)
RETURNS TABLE (
  player_id text,
  player_name text,
  matches_played bigint,
  goals bigint,
  assists bigint,
  clean_sheets bigint,
  weighted_goals numeric,
  weighted_assists numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COUNT(DISTINCT pms.match_id) as matches_played,
    COALESCE(SUM(pms.goals), 0)::bigint as goals,
    COALESCE(SUM(pms.assists), 0)::bigint as assists,
    COALESCE(SUM(
      CASE 
        WHEN p.position = 'Goalkeeper' AND 
             (
               (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
               (pma.team_id = m.away_team_id AND m.home_score = 0)
             )
        THEN 1
        ELSE 0
      END
    ), 0)::bigint as clean_sheets,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3
        ELSE pms.goals
      END
    ), 0) as weighted_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3
        ELSE pms.assists
      END
    ), 0) as weighted_assists
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    p.id = player_id_param::uuid
  GROUP BY 
    p.id, p.name;
$$;
```

## Notes

- Execute these SQL statements in order in the Supabase SQL Editor.
- After setting up the database, make sure to run the seed script to populate some test data: `npm run seed`
- The player_match_assignments table allows players to be assigned to different teams for each match, even if they have a default team.
- The updated SQL functions use the player_match_assignments table to correctly calculate statistics based on which team a player played for in each match. 