-- Comprehensive fix for all function security issues
-- This script sets both SECURITY INVOKER and explicit search path in a single ALTER FUNCTION operation

BEGIN;

-- List of all functions to fix
-- Each function is altered to use SECURITY INVOKER and SET search_path = public

-- Fix get_team_player_combinations function
ALTER FUNCTION public.get_team_player_combinations() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_team_statistics function
ALTER FUNCTION public.get_team_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_players function
ALTER FUNCTION public.get_club_players() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_internal_teams function
ALTER FUNCTION public.get_internal_teams() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_teams function
ALTER FUNCTION public.get_club_teams() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_internal_teams_statistics function
ALTER FUNCTION public.get_internal_teams_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_team_statistics function
ALTER FUNCTION public.get_club_team_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_head_to_head_stats function
ALTER FUNCTION public.get_head_to_head_stats(text, text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_team_player_statistics function
ALTER FUNCTION public.get_team_player_statistics(text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_team_top_scorers function
ALTER FUNCTION public.get_team_top_scorers(text, integer) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_player_win_impact function
ALTER FUNCTION public.get_player_win_impact(integer) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_internal_top_scorers function
ALTER FUNCTION public.get_internal_top_scorers(integer) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_top_scorers function
ALTER FUNCTION public.get_club_top_scorers(integer) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix refresh_schema_cache function
ALTER FUNCTION public.refresh_schema_cache() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_all_player_statistics function
ALTER FUNCTION public.get_all_player_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_player_statistics function
ALTER FUNCTION public.get_player_statistics(text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_player_combinations function
ALTER FUNCTION public.get_player_combinations(integer, integer) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_internal_all_player_statistics function
ALTER FUNCTION public.get_internal_all_player_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_internal_player_statistics function
ALTER FUNCTION public.get_internal_player_statistics(text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_all_player_statistics function
ALTER FUNCTION public.get_club_all_player_statistics() 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_club_player_statistics function
ALTER FUNCTION public.get_club_player_statistics(text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_team_performance_with_player function
ALTER FUNCTION public.get_team_performance_with_player(text, text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_player_all_teams_impact function
ALTER FUNCTION public.get_player_all_teams_impact(text) 
  SECURITY INVOKER
  SET search_path = public;

-- Fix get_player_team_combinations function
ALTER FUNCTION public.get_player_team_combinations() 
  SECURITY INVOKER
  SET search_path = public;

-- For views, add a short explanation about why we don't need to modify them
COMMENT ON VIEW public.match_list IS 'This view is already using SECURITY INVOKER by default';
COMMENT ON VIEW public.player_list IS 'This view is already using SECURITY INVOKER by default';
COMMENT ON VIEW public.team_list IS 'This view is already using SECURITY INVOKER by default';

-- GRANT appropriate permissions on all fixed functions
GRANT EXECUTE ON FUNCTION public.get_team_player_combinations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_players() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_teams_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_team_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_head_to_head_stats(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_top_scorers(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_win_impact(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_top_scorers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_top_scorers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_combinations(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_all_player_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_player_statistics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_performance_with_player(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_all_teams_impact(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_team_combinations() TO authenticated;

COMMIT; 