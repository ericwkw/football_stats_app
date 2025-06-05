-- Fix RLS policies for all tables to improve query performance
-- The issue is that auth.role() is being re-evaluated for each row
-- We'll replace it with a subquery that evaluates once

BEGIN;

-- Fix RLS policy for teams table
DROP POLICY IF EXISTS "Allow admin write access" ON public.teams;
CREATE POLICY "Allow admin write access" ON public.teams
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- Fix RLS policy for players table
DROP POLICY IF EXISTS "Allow admin write access" ON public.players;
CREATE POLICY "Allow admin write access" ON public.players
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- Fix RLS policy for matches table
DROP POLICY IF EXISTS "Allow admin write access" ON public.matches;
CREATE POLICY "Allow admin write access" ON public.matches
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- Fix RLS policy for player_match_stats table
DROP POLICY IF EXISTS "Allow admin write access" ON public.player_match_stats;
CREATE POLICY "Allow admin write access" ON public.player_match_stats
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- Fix RLS policy for player_match_assignments table
DROP POLICY IF EXISTS "Allow admin write access" ON public.player_match_assignments;
CREATE POLICY "Allow admin write access" ON public.player_match_assignments
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- These changes will make the RLS policies more efficient by evaluating auth.role() only once
-- instead of re-evaluating it for each row, which improves query performance at scale.

COMMIT; 