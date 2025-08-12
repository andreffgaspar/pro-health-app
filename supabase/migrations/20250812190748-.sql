-- Add policy for athletes and professionals to view profiles of connected users
CREATE POLICY "Athletes and professionals can view connected profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.athlete_professional_relationships apr
    WHERE apr.status = 'accepted'
    AND ((apr.athlete_id = auth.uid() AND apr.professional_id = profiles.user_id)
         OR (apr.professional_id = auth.uid() AND apr.athlete_id = profiles.user_id))
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;