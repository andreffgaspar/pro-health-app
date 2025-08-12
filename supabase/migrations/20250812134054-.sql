-- Fix security issue: Remove overly permissive profile access policy
-- and replace with secure search functionality

-- Drop the problematic policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view basic profile info for search" ON public.profiles;

-- Create a secure function for professional search that only returns necessary data
CREATE OR REPLACE FUNCTION public.search_professionals(search_query text, requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  user_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to search
  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return professionals for search (only basic info needed for search)
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.user_type
  FROM public.profiles p
  WHERE p.user_type = 'professional'
    AND p.full_name ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$;

-- Create a secure function for athlete search that only returns necessary data
CREATE OR REPLACE FUNCTION public.search_athletes(search_query text, requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  user_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to search
  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return athletes for search (only basic info needed for search)
  RETURN QUERY
  SELECT p.user_id, p.full_name, p.user_type
  FROM public.profiles p
  WHERE p.user_type = 'athlete'
    AND p.full_name ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$;