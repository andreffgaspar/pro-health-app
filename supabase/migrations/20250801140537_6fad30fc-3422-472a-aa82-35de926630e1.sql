-- Enable real-time for athlete_data table
ALTER TABLE public.athlete_data REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.athlete_data;

-- Enable real-time for athlete_professional_relationships table
ALTER TABLE public.athlete_professional_relationships REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.athlete_professional_relationships;

-- Enable real-time for conversations table
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.conversations;

-- Enable real-time for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- Enable real-time for sessions table
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.sessions;