-- Fix security issue: Remove public access to sessions table
-- Replace the overly permissive SELECT policy with secure access controls

-- Drop the existing problematic SELECT policy
DROP POLICY "Athletes can view available sessions" ON public.sessions;

-- Create a new secure SELECT policy that only allows:
-- 1. Professionals to view their own sessions
-- 2. Athletes to view sessions from professionals they have accepted relationships with
-- 3. Athletes to view their own booked sessions
CREATE POLICY "Secure session viewing for authenticated users" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (
  -- Professionals can view their own sessions
  auth.uid() = professional_id
  OR
  -- Athletes can view their own booked sessions
  auth.uid() = athlete_id
  OR
  -- Athletes can view available sessions from professionals they have accepted relationships with
  (
    session_type = 'available'::text 
    AND status = 'available'::text
    AND EXISTS (
      SELECT 1 FROM public.athlete_professional_relationships apr
      WHERE apr.athlete_id = auth.uid()
      AND apr.professional_id = sessions.professional_id
      AND apr.status = 'accepted'::text
      AND apr.is_active = true
    )
  )
);