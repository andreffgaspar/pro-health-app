-- Create sessions table
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL,
  athlete_id uuid,
  title text NOT NULL,
  description text,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text NOT NULL, -- 'available', 'booked', 'completed', 'cancelled'
  status text NOT NULL DEFAULT 'available', -- 'available', 'pending', 'confirmed', 'completed', 'cancelled'
  location text,
  notes text,
  price decimal(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professionals can manage their sessions" 
ON public.sessions 
FOR ALL
USING (auth.uid() = professional_id);

CREATE POLICY "Athletes can view available sessions" 
ON public.sessions 
FOR SELECT 
USING (
  session_type = 'available' OR 
  auth.uid() = athlete_id OR 
  auth.uid() = professional_id
);

CREATE POLICY "Athletes can book sessions" 
ON public.sessions 
FOR UPDATE 
USING (
  auth.uid() = athlete_id AND 
  session_type = 'available' AND 
  status = 'available'
);

-- Add trigger for timestamps
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_sessions_professional_date 
ON public.sessions(professional_id, session_date);

CREATE INDEX idx_sessions_athlete_date 
ON public.sessions(athlete_id, session_date);

CREATE INDEX idx_sessions_status_type 
ON public.sessions(status, session_type);