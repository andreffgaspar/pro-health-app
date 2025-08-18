-- Fix security vulnerability in professional_invitations table RLS policies
-- Issue: The current "ALL" policy is too broad and could potentially expose email addresses
-- Solution: Replace with specific granular policies for each operation

-- Drop the existing broad "ALL" policy
DROP POLICY IF EXISTS "Athletes can manage their invitations" ON public.professional_invitations;

-- Create specific policies for each operation to ensure better security granularity

-- Athletes can create their own invitations
CREATE POLICY "Athletes can create their own invitations" 
ON public.professional_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = athlete_id);

-- Athletes can view only their own invitations
CREATE POLICY "Athletes can view their own invitations" 
ON public.professional_invitations 
FOR SELECT 
USING (auth.uid() = athlete_id);

-- Athletes can update only their own invitations
CREATE POLICY "Athletes can update their own invitations" 
ON public.professional_invitations 
FOR UPDATE 
USING (auth.uid() = athlete_id);

-- Athletes can delete only their own invitations
CREATE POLICY "Athletes can delete their own invitations" 
ON public.professional_invitations 
FOR DELETE 
USING (auth.uid() = athlete_id);