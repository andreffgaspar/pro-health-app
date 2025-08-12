-- Add unique constraint to prevent duplicate health records
-- First, remove any existing duplicates (keep the most recent record for each combination)
DELETE FROM public.athlete_data a
USING public.athlete_data b
WHERE a.id < b.id
  AND a.athlete_id = b.athlete_id
  AND a.data_type = b.data_type
  AND DATE(a.recorded_at) = DATE(b.recorded_at);

-- Add unique constraint on athlete_id, data_type, and date (not full timestamp)
-- We'll use an expression index with DATE function
CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_data_unique_daily
ON public.athlete_data (athlete_id, data_type, DATE(recorded_at));