-- Fix multiple permissive policies for player_match_assignments table
-- This addresses the Supabase performance issue: "Multiple Permissive Policies"

BEGIN;

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

COMMIT; 