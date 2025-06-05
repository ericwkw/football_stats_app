-- Fix multiple permissive policies for matches table
-- This addresses the Supabase performance issue: "Multiple Permissive Policies"

BEGIN;

-- Drop existing policies for matches table
DROP POLICY IF EXISTS "Allow public read access" ON public.matches;
DROP POLICY IF EXISTS "Allow admin write access" ON public.matches;

-- Create a single policy for SELECT that allows anyone to read
CREATE POLICY "Allow public read access" ON public.matches
FOR SELECT
USING (true);

-- Create a separate policy for write operations that requires authentication
CREATE POLICY "Allow admin write operations" ON public.matches
FOR ALL
WITH CHECK ((SELECT auth.role()) = 'authenticated');

COMMIT; 