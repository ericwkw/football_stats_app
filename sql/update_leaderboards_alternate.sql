-- Alternate approach: Use direct RPC functions instead of views
BEGIN;

-- Create a new function to get leaderboards with matches_played
CREATE OR REPLACE FUNCTION get_simplified_leaderboards_with_mp()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  top_scorers jsonb;
  top_assists jsonb;
  top_goalkeepers jsonb;
BEGIN
  -- Get top scorers with matches_played
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', p.id,
      'player_name', p.name,
      'matches_played', COUNT(DISTINCT pms.match_id),
      'goals', COALESCE(SUM(pms.goals), 0)::bigint,
      'weighted_goals', COALESCE(SUM(
        CASE 
          WHEN m.match_type = 'external_game' THEN pms.goals * 3
          ELSE pms.goals
        END
      ), 0)
    )
  )
  INTO top_scorers
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  GROUP BY 
    p.id, p.name
  ORDER BY
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.goals * 3
        ELSE pms.goals
      END
    ), 0) DESC,
    COALESCE(SUM(pms.goals), 0) DESC,
    p.name
  LIMIT 5;
  
  -- Get top assists with matches_played
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', p.id,
      'player_name', p.name,
      'matches_played', COUNT(DISTINCT pms.match_id),
      'assists', COALESCE(SUM(pms.assists), 0)::bigint,
      'weighted_assists', COALESCE(SUM(
        CASE 
          WHEN m.match_type = 'external_game' THEN pms.assists * 3
          ELSE pms.assists
        END
      ), 0)
    )
  )
  INTO top_assists
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  GROUP BY 
    p.id, p.name
  ORDER BY
    COALESCE(SUM(
      CASE 
        WHEN m.match_type = 'external_game' THEN pms.assists * 3
        ELSE pms.assists
      END
    ), 0) DESC,
    COALESCE(SUM(pms.assists), 0) DESC,
    p.name
  LIMIT 5;
  
  -- Get top goalkeepers (reusing existing code)
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', p.id,
      'player_name', p.name,
      'matches_played', COUNT(DISTINCT pms.match_id),
      'clean_sheets', COALESCE(SUM(
        CASE 
          WHEN p.position = 'Goalkeeper' AND 
               (
                 (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
                 (pma.team_id = m.away_team_id AND m.home_score = 0)
               )
          THEN 1
          ELSE 0
        END
      ), 0)::bigint,
      'clean_sheet_percentage', CASE 
        WHEN COUNT(DISTINCT pms.match_id) > 0 THEN
          ROUND((COALESCE(SUM(
            CASE 
              WHEN p.position = 'Goalkeeper' AND 
                   (
                     (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
                     (pma.team_id = m.away_team_id AND m.home_score = 0)
                   )
              THEN 1
              ELSE 0
            END
          ), 0)::numeric / COUNT(DISTINCT pms.match_id)) * 100, 1)
        ELSE 0
      END
    )
  )
  INTO top_goalkeepers
  FROM 
    players p
  LEFT JOIN 
    player_match_stats pms ON p.id = pms.player_id
  LEFT JOIN
    matches m ON pms.match_id = m.id
  LEFT JOIN
    player_match_assignments pma ON pma.player_id = p.id AND pma.match_id = m.id
  WHERE
    p.position = 'Goalkeeper'
  GROUP BY 
    p.id, p.name
  ORDER BY
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
    ), 0) DESC,
    CASE 
      WHEN COUNT(DISTINCT pms.match_id) > 0 THEN
        (COALESCE(SUM(
          CASE 
            WHEN p.position = 'Goalkeeper' AND 
                 (
                   (pma.team_id = m.home_team_id AND m.away_score = 0) OR 
                   (pma.team_id = m.away_team_id AND m.home_score = 0)
                 )
            THEN 1
            ELSE 0
          END
        ), 0)::numeric / COUNT(DISTINCT pms.match_id))
      ELSE 0
    END DESC,
    COUNT(DISTINCT pms.match_id) DESC,
    p.name
  LIMIT 5;
  
  RETURN jsonb_build_object(
    'top_scorers', COALESCE(top_scorers, '[]'::jsonb),
    'top_assists', COALESCE(top_assists, '[]'::jsonb),
    'top_goalkeepers', COALESCE(top_goalkeepers, '[]'::jsonb)
  );
END;
$$;

-- Grant permissions to the function
COMMENT ON FUNCTION get_simplified_leaderboards_with_mp() IS 'Returns simplified leaderboard data for FCB United players including matches played';
GRANT EXECUTE ON FUNCTION get_simplified_leaderboards_with_mp() TO authenticated;

COMMIT; 