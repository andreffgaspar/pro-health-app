-- Create table for login debug logs
CREATE TABLE public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  step TEXT NOT NULL,
  status TEXT NOT NULL, -- 'started', 'success', 'error', 'timeout'
  message TEXT,
  data JSONB DEFAULT '{}',
  error_details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  platform TEXT
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own login logs" 
ON public.login_logs 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert login logs" 
ON public.login_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_login_logs_user_id_timestamp ON public.login_logs(user_id, timestamp DESC);
CREATE INDEX idx_login_logs_session_id ON public.login_logs(session_id);
CREATE INDEX idx_login_logs_step_status ON public.login_logs(step, status);