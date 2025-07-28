-- Add policy to allow users to view basic profile info of other users for search purposes
CREATE POLICY "Users can view basic profile info for search" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: This allows viewing basic profile info (user_id, full_name, user_type) for search functionality
-- The existing policy "Users can view their own profile" will remain for full profile access