-- Add foreign key constraints to sessions table
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_professional_id_fkey 
FOREIGN KEY (professional_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_athlete_id_fkey 
FOREIGN KEY (athlete_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;