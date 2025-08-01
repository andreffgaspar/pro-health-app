-- Enable realtime for all communication tables
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.group_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
SELECT
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'conversations'
    ) 
    THEN 'conversations already in publication'
    ELSE 'conversations not in publication'
  END as conversations_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
    ) 
    THEN 'messages already in publication'
    ELSE 'messages not in publication'
  END as messages_status;