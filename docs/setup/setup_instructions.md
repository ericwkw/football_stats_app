# Soccer Stats App - SQL Functions Setup

The error message `Failed to fetch top scorers: Could not find the function public.get_top_scorers(limit_count) in the schema cache` indicates that one or more required SQL functions are missing from your Supabase database.

Follow these steps to add the necessary SQL functions:

## 1. Access the Supabase SQL Editor

1. Log in to your Supabase account at [app.supabase.com](https://app.supabase.com/)
2. Select your project from the dashboard
3. Click on "SQL Editor" in the left sidebar

## 2. Create a New Query

1. Click the "+" button to create a new query
2. Name it something like "Install SQL Functions"

## 3. Add the SQL Functions

Paste the contents of all three SQL files (get_top_scorers.sql, get_team_statistics.sql, and get_player_statistics.sql) into the editor:

```sql
-- Function to get top scorers with limit
CREATE OR REPLACE FUNCTION get_top_scorers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  player_id text,
  player_name text,
  total_goals bigint,
  weighted_goals numeric
) 
LANGUAGE SQL
AS $$
  SELECT 
    p.id as player_id,
    p.name as player_name,
    COALESCE(SUM(pms.goals), 0) as total_goals,
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3 -- Weight external game goals 3x
        ELSE pms.goals
      END
    ), 0) as weighted_goals
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  GROUP BY 
    p.id, p.name
  ORDER BY 
    weighted_goals DESC, total_goals DESC, player_name
  LIMIT limit_count;
$$;

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_statistics()
RETURNS TABLE (
  id text,
  name text,
  matches_played bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  goals_for bigint,
  goals_against bigint
) 
LANGUAGE SQL
AS $$
  WITH match_results AS (
    -- Home team results
    SELECT 
      home_team_id as team_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE home_score > away_score) as wins,
      COUNT(*) FILTER (WHERE home_score = away_score) as draws,
      COUNT(*) FILTER (WHERE home_score < away_score) as losses,
      COALESCE(SUM(home_score), 0) as goals_for,
      COALESCE(SUM(away_score), 0) as goals_against
    FROM 
      matches
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
    GROUP BY 
      home_team_id
    
    UNION ALL
    
    -- Away team results
    SELECT 
      away_team_id as team_id,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE away_score > home_score) as wins,
      COUNT(*) FILTER (WHERE away_score = home_score) as draws,
      COUNT(*) FILTER (WHERE away_score < home_score) as losses,
      COALESCE(SUM(away_score), 0) as goals_for,
      COALESCE(SUM(home_score), 0) as goals_against
    FROM 
      matches
    WHERE 
      home_score IS NOT NULL AND away_score IS NOT NULL
    GROUP BY 
      away_team_id
  )
  
  SELECT 
    t.id,
    t.name,
    COALESCE(SUM(mr.matches_played), 0)::bigint as matches_played,
    COALESCE(SUM(mr.wins), 0)::bigint as wins,
    COALESCE(SUM(mr.draws), 0)::bigint as draws,
    COALESCE(SUM(mr.losses), 0)::bigint as losses,
    COALESCE(SUM(mr.goals_for), 0)::bigint as goals_for,
    COALESCE(SUM(mr.goals_against), 0)::bigint as goals_against
  FROM 
    teams t
  LEFT JOIN 
    match_results mr ON t.id = mr.team_id
  GROUP BY 
    t.id, t.name
  ORDER BY 
    (COALESCE(SUM(mr.wins), 0) * 3 + COALESCE(SUM(mr.draws), 0)) DESC, -- Points (3 for win, 1 for draw)
    (COALESCE(SUM(mr.goals_for), 0) - COALESCE(SUM(mr.goals_against), 0)) DESC, -- Goal difference
    COALESCE(SUM(mr.goals_for), 0) DESC, -- Goals for
    t.name;
$$;

-- Function to get player statistics for a specific player
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

## 4. Execute the Query

1. Click the "Run" button to execute the SQL commands
2. You should see a success message indicating the functions were created

## 5. Restart Your Application

1. Go back to your development environment
2. Restart your Next.js application with `npm run dev`
3. The error should now be resolved, and your app should be able to fetch top scorers

## Troubleshooting

If you still encounter issues:

1. Check the Supabase SQL Editor console for any error messages during function creation
2. Verify table names and column names match your actual database schema
3. Make sure your Supabase connection is properly configured in your application 