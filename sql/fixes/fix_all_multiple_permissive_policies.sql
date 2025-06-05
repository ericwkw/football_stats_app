-- Fix multiple permissive policies for all affected tables
-- This addresses the Supabase performance issue: "Multiple Permissive Policies"

BEGIN;

-- Fix for matches table
-- Drop ALL existing policies for matches table
DROP POLICY IF EXISTS "Allow public read access" ON public.matches;
DROP POLICY IF EXISTS "Allow admin write access" ON public.matches;
DROP POLICY IF EXISTS "Allow admin insert" ON public.matches;
DROP POLICY IF EXISTS "Allow admin update" ON public.matches;
DROP POLICY IF EXISTS "Allow admin delete" ON public.matches;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.matches;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.matches
FOR SELECT
USING (true);

-- Create separate policies for each write operation to avoid overlap with SELECT
CREATE POLICY "Allow admin insert" ON public.matches
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin update" ON public.matches
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin delete" ON public.matches
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

-- Fix for player_match_assignments table
-- Drop ALL existing policies for player_match_assignments table
DROP POLICY IF EXISTS "Allow public read access" ON public.player_match_assignments;
DROP POLICY IF EXISTS "Allow admin write access" ON public.player_match_assignments;
DROP POLICY IF EXISTS "Allow admin insert" ON public.player_match_assignments;
DROP POLICY IF EXISTS "Allow admin update" ON public.player_match_assignments;
DROP POLICY IF EXISTS "Allow admin delete" ON public.player_match_assignments;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.player_match_assignments;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.player_match_assignments
FOR SELECT
USING (true);

-- Create separate policies for each write operation to avoid overlap with SELECT
CREATE POLICY "Allow admin insert" ON public.player_match_assignments
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin update" ON public.player_match_assignments
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin delete" ON public.player_match_assignments
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

-- Fix for player_match_stats table (preventive measure)
-- Drop ALL existing policies for player_match_stats table
DROP POLICY IF EXISTS "Allow public read access" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow admin write access" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow admin insert" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow admin update" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow admin delete" ON public.player_match_stats;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.player_match_stats;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.player_match_stats
FOR SELECT
USING (true);

-- Create separate policies for each write operation to avoid overlap with SELECT
CREATE POLICY "Allow admin insert" ON public.player_match_stats
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin update" ON public.player_match_stats
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin delete" ON public.player_match_stats
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

-- Fix for players table (preventive measure)
-- Drop ALL existing policies for players table
DROP POLICY IF EXISTS "Allow public read access" ON public.players;
DROP POLICY IF EXISTS "Allow admin write access" ON public.players;
DROP POLICY IF EXISTS "Allow admin insert" ON public.players;
DROP POLICY IF EXISTS "Allow admin update" ON public.players;
DROP POLICY IF EXISTS "Allow admin delete" ON public.players;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.players;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.players
FOR SELECT
USING (true);

-- Create separate policies for each write operation to avoid overlap with SELECT
CREATE POLICY "Allow admin insert" ON public.players
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin update" ON public.players
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin delete" ON public.players
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

-- Fix for teams table (preventive measure)
-- Drop ALL existing policies for teams table
DROP POLICY IF EXISTS "Allow public read access" ON public.teams;
DROP POLICY IF EXISTS "Allow admin write access" ON public.teams;
DROP POLICY IF EXISTS "Allow admin insert" ON public.teams;
DROP POLICY IF EXISTS "Allow admin update" ON public.teams;
DROP POLICY IF EXISTS "Allow admin delete" ON public.teams;
DROP POLICY IF EXISTS "Allow admin write operations" ON public.teams;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.teams
FOR SELECT
USING (true);

-- Create separate policies for each write operation to avoid overlap with SELECT
CREATE POLICY "Allow admin insert" ON public.teams
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin update" ON public.teams
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow admin delete" ON public.teams
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

COMMIT; 