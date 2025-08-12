-- Add unique constraint to prevent duplicate health records
-- First, remove any existing duplicates (keep the most recent record for each combination)
DELETE FROM public.athlete_data a
USING public.athlete_data b
WHERE a.id < b.id
  AND a.athlete_id = b.athlete_id
  AND a.data_type = b.data_type
  AND DATE(a.recorded_at) = DATE(b.recorded_at);

-- Add unique constraint on athlete_id, data_type, and date (not full timestamp)
-- We'll use a partial index to ensure uniqueness per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_athlete_data_unique_daily
ON public.athlete_data (athlete_id, data_type, DATE(recorded_at));

-- Add a function to normalize recorded_at to start of day for daily aggregation
CREATE OR REPLACE FUNCTION normalize_daily_timestamp(input_timestamp timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN DATE_TRUNC('day', input_timestamp);
END;
$$ LANGUAGE plpgsql IMMUTABLE;