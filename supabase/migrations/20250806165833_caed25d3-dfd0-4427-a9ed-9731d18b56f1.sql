-- Create table for debug logs
CREATE TABLE public.debug_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  component TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info', -- info, warn, error, debug
  message TEXT NOT NULL,
  context JSONB,
  user_agent TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own debug logs" 
ON public.debug_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debug logs" 
ON public.debug_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_debug_logs_user_created ON public.debug_logs(user_id, created_at DESC);
CREATE INDEX idx_debug_logs_component ON public.debug_logs(component);
CREATE INDEX idx_debug_logs_level ON public.debug_logs(level);