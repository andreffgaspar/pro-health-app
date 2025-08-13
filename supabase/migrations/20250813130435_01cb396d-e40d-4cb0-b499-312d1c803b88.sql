-- Fix security vulnerability in login_logs table RLS policies
-- Issue: Current policy allows users to view login logs with NULL user_id
-- This could expose system logs and failed login attempts to all users

-- Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "Users can view their own login logs" ON public.login_logs;

-- Create a more secure SELECT policy that only allows users to view their own logs
-- Remove the "OR (user_id IS NULL)" condition that was causing the security issue
CREATE POLICY "Users can view only their own login logs" 
ON public.login_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Create a separate policy for system administrators if needed later
-- This can be uncommented if you need admin access to all logs
-- CREATE POLICY "Admins can view all login logs" 
-- ON public.login_logs 
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles 
--     WHERE user_id = auth.uid() 
--     AND user_type = 'admin'
--   )
-- );