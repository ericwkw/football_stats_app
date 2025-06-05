-- Fix RLS policy for public.teams table to improve query performance
-- The issue is that auth.role() is being re-evaluated for each row
-- We'll replace it with a subquery that evaluates once

BEGIN;

-- Drop existing policy
DROP POLICY IF EXISTS "Allow admin write access" ON public.teams;

-- Create new policy using a subquery for better performance
CREATE POLICY "Allow admin write access" ON public.teams
FOR ALL
USING ((SELECT auth.role()) = 'authenticated');

-- This change will make the RLS policy more efficient by evaluating auth.role() only once
-- instead of re-evaluating it for each row, which improves query performance at scale.

COMMIT; 