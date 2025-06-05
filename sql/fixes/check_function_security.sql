-- Script to check security settings of key functions
-- This will output whether functions use SECURITY INVOKER and have fixed search_path

SELECT 
    n.nspname as schema,
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_setting,
    CASE WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH SET (MUTABLE)' 
         ELSE 'SEARCH PATH SET: ' || array_to_string(p.proconfig, ', ')
    END as search_path_setting
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname IN (
        'get_team_player_combinations',
        'get_team_statistics',
        'get_club_players',
        'get_internal_teams',
        'get_club_teams',
        'get_internal_teams_statistics',
        'get_club_team_statistics',
        'get_head_to_head_stats',
        'get_team_player_statistics',
        'get_team_top_scorers',
        'get_player_win_impact',
        'get_internal_top_scorers',
        'get_club_top_scorers',
        'refresh_schema_cache',
        'get_all_player_statistics',
        'get_player_statistics',
        'get_player_combinations',
        'get_internal_all_player_statistics',
        'get_internal_player_statistics',
        'get_club_all_player_statistics',
        'get_club_player_statistics',
        'get_team_performance_with_player',
        'get_player_all_teams_impact',
        'get_player_team_combinations'
    )
ORDER BY 
    function_name; 