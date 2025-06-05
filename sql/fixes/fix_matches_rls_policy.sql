-- Fix multiple permissive policies for matches table
-- This addresses the Supabase performance issue: "Multiple Permissive Policies"

BEGIN;

-- Drop existing policies for matches table
DROP POLICY IF EXISTS "Allow public read access" ON public.matches;
DROP POLICY IF EXISTS "Allow admin write access" ON public.matches;
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

COMMIT; 