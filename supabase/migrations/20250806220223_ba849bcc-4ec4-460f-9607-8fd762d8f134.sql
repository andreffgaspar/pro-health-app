-- Update the athlete_data_data_type_check constraint to include HealthKit data types
ALTER TABLE public.athlete_data 
DROP CONSTRAINT athlete_data_data_type_check;

-- Add the updated constraint with all HealthKit data types
ALTER TABLE public.athlete_data 
ADD CONSTRAINT athlete_data_data_type_check 
CHECK (data_type = ANY (ARRAY[
  'training'::text, 
  'nutrition'::text, 
  'physiotherapy'::text, 
  'medical'::text, 
  'sleep'::text, 
  'vitals'::text,
  -- HealthKit data types
  'steps'::text,
  'distance'::text,
  'calories'::text,
  'heart_rate'::text,
  'weight'::text,
  'height'::text,
  'water'::text,
  'activity'::text
]));