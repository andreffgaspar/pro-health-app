-- Fix infinite recursion in group_participants policies
-- Drop problematic policies first
DROP POLICY IF EXISTS "Group admins can manage participants" ON public.group_participants;
DROP POLICY IF EXISTS "Users can view participants of their groups" ON public.group_participants;

-- Create security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_id_param 
    AND user_id = user_id_param 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create security definer function to check if user is group member
CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_id_param 
    AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using security definer functions
CREATE POLICY "Group admins can manage participants" ON public.group_participants
FOR ALL USING (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Users can view participants of their groups" ON public.group_participants
FOR SELECT USING (public.is_group_member(group_id, auth.uid()));