-- Fix additional function search path issues
-- This script sets explicit search paths for more functions to eliminate security warnings

BEGIN;

-- Fix get_all_internal_players function
CREATE OR REPLACE FUNCTION get_all_internal_players()
RETURNS TABLE (
  id text,
  name text,
  player_position text,
  team_id text,
  team_name text,
  created_at timestamptz
) 
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id::text,
    p.name,
    p.position as player_position,
    p.team_id::text,
    t.name as team_name,
    p.created_at
  FROM 
    public.players p
  JOIN
    public.teams t ON p.team_id = t.id
  WHERE 
    t.team_type IN ('internal', 'club')
  ORDER BY 
    p.name;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_all_internal_players() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_internal_players() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_internal_players() TO authenticated;

COMMIT; 