-- Fix search path for functions reported as having mutable search paths
-- This script uses ALTER FUNCTION to set the search path explicitly

BEGIN;

-- Fix get_team_player_combinations function
ALTER FUNCTION public.get_team_player_combinations() 
  SET search_path = public;

-- Fix get_team_statistics function
ALTER FUNCTION public.get_team_statistics() 
  SET search_path = public;

-- Fix get_club_players function
ALTER FUNCTION public.get_club_players() 
  SET search_path = public;

-- Fix get_internal_teams function
ALTER FUNCTION public.get_internal_teams() 
  SET search_path = public;

-- Fix get_club_teams function
ALTER FUNCTION public.get_club_teams() 
  SET search_path = public;

-- Fix get_internal_teams_statistics function
ALTER FUNCTION public.get_internal_teams_statistics() 
  SET search_path = public;

-- Fix get_club_team_statistics function
ALTER FUNCTION public.get_club_team_statistics() 
  SET search_path = public;

-- Fix get_head_to_head_stats function
ALTER FUNCTION public.get_head_to_head_stats(text, text) 
  SET search_path = public;

-- Fix get_team_player_statistics function
ALTER FUNCTION public.get_team_player_statistics(text) 
  SET search_path = public;

-- Fix get_team_top_scorers function
ALTER FUNCTION public.get_team_top_scorers(text, integer) 
  SET search_path = public;

-- Fix get_player_win_impact function
ALTER FUNCTION public.get_player_win_impact(integer) 
  SET search_path = public;

-- Fix get_internal_top_scorers function
ALTER FUNCTION public.get_internal_top_scorers(integer) 
  SET search_path = public;

-- Fix get_club_top_scorers function
ALTER FUNCTION public.get_club_top_scorers(integer) 
  SET search_path = public;

-- Fix refresh_schema_cache function
ALTER FUNCTION public.refresh_schema_cache() 
  SET search_path = public;

-- Fix get_all_player_statistics function
ALTER FUNCTION public.get_all_player_statistics() 
  SET search_path = public;

-- Fix get_player_statistics function
ALTER FUNCTION public.get_player_statistics(text) 
  SET search_path = public;

-- Fix get_player_combinations function
ALTER FUNCTION public.get_player_combinations(integer, integer) 
  SET search_path = public;

-- Fix get_internal_all_player_statistics function
ALTER FUNCTION public.get_internal_all_player_statistics() 
  SET search_path = public;

-- Fix get_internal_player_statistics function
ALTER FUNCTION public.get_internal_player_statistics(text) 
  SET search_path = public;

-- Fix get_club_all_player_statistics function
ALTER FUNCTION public.get_club_all_player_statistics() 
  SET search_path = public;

-- Fix get_club_player_statistics function
ALTER FUNCTION public.get_club_player_statistics(text) 
  SET search_path = public;

-- Fix get_team_performance_with_player function
ALTER FUNCTION public.get_team_performance_with_player(text, text) 
  SET search_path = public;

-- Fix get_player_all_teams_impact function
ALTER FUNCTION public.get_player_all_teams_impact(text) 
  SET search_path = public;

-- Fix get_player_team_combinations function
ALTER FUNCTION public.get_player_team_combinations() 
  SET search_path = public;

COMMIT; 