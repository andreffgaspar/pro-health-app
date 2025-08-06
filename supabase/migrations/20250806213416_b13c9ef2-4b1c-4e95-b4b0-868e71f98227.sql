-- Create table for HealthKit integration logs
CREATE TABLE public.healthkit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level TEXT NOT NULL DEFAULT 'info', -- info, warning, error, debug
  component TEXT NOT NULL, -- useHealthIntegration, perfoodHealthService, etc
  action TEXT NOT NULL, -- initialize, requestPermissions, syncData, etc
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  error_details TEXT,
  platform TEXT, -- ios, android, web
  is_native BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.healthkit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own healthkit logs" 
ON public.healthkit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own healthkit logs" 
ON public.healthkit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_healthkit_logs_user_created 
ON public.healthkit_logs(user_id, created_at DESC);

-- Create index for filtering by action
CREATE INDEX idx_healthkit_logs_action 
ON public.healthkit_logs(action, created_at DESC);