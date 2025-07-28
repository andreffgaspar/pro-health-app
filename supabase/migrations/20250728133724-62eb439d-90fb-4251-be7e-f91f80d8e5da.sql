-- Add status column to track active/inactive relationships
ALTER TABLE public.athlete_professional_relationships 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing records to be active
UPDATE public.athlete_professional_relationships 
SET is_active = true;

-- Add index for better performance on status queries
CREATE INDEX idx_athlete_professional_relationships_active 
ON public.athlete_professional_relationships(is_active, professional_id, athlete_id);