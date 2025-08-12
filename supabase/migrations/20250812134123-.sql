-- Fix security warnings by setting search_path for functions
-- This prevents SQL injection and ensures secure function execution

-- Update search functions to have secure search_path
CREATE OR REPLACE FUNCTION public.search_professionals(search_query text, requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  user_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.search_athletes(search_query text, requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  user_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix other existing functions to have secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'user_type'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(group_id_param uuid, user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_id_param 
    AND user_id = user_id_param 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param uuid, user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_id_param 
    AND user_id = user_id_param
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $$
BEGIN
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.read = true;
    END IF;
    RETURN NEW;
END;
$$;