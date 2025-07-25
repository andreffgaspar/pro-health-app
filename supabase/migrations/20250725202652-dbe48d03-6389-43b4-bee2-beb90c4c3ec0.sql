-- Create athlete_professional_relationships table
CREATE TABLE public.athlete_professional_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  specialty TEXT NOT NULL CHECK (specialty IN ('nutrition', 'physiotherapy', 'medical', 'training', 'psychology')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, professional_id, specialty)
);

-- Create invitations table for email invites
CREATE TABLE public.professional_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  specialty TEXT NOT NULL CHECK (specialty IN ('nutrition', 'physiotherapy', 'medical', 'training', 'psychology')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.athlete_professional_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athlete_professional_relationships
CREATE POLICY "Athletes can view their relationships" 
ON public.athlete_professional_relationships 
FOR SELECT 
USING (auth.uid() = athlete_id);

CREATE POLICY "Professionals can view their relationships" 
ON public.athlete_professional_relationships 
FOR SELECT 
USING (auth.uid() = professional_id);

CREATE POLICY "Athletes can create relationships" 
ON public.athlete_professional_relationships 
FOR INSERT 
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes and professionals can update relationships" 
ON public.athlete_professional_relationships 
FOR UPDATE 
USING (auth.uid() = athlete_id OR auth.uid() = professional_id);

-- RLS Policies for professional_invitations
CREATE POLICY "Athletes can manage their invitations" 
ON public.professional_invitations 
FOR ALL 
USING (auth.uid() = athlete_id);

-- Add triggers for updated_at
CREATE TRIGGER update_athlete_professional_relationships_updated_at
BEFORE UPDATE ON public.athlete_professional_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_invitations_updated_at
BEFORE UPDATE ON public.professional_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_athlete_professional_relationships_athlete_id ON public.athlete_professional_relationships(athlete_id);
CREATE INDEX idx_athlete_professional_relationships_professional_id ON public.athlete_professional_relationships(professional_id);
CREATE INDEX idx_athlete_professional_relationships_status ON public.athlete_professional_relationships(status);
CREATE INDEX idx_professional_invitations_athlete_id ON public.professional_invitations(athlete_id);
CREATE INDEX idx_professional_invitations_email ON public.professional_invitations(email);
CREATE INDEX idx_professional_invitations_status ON public.professional_invitations(status);