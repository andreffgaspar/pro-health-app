-- Update the messages table RLS policy to allow marking messages as read
-- in conversations where the user is a participant

-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create a new policy that allows users to update their own messages
-- AND allows users to mark messages as read in conversations they participate in
CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (
  -- Users can update their own messages (for editing content)
  (auth.uid() = sender_id) 
  OR 
  -- Users can update read_at field for messages in conversations they participate in
  (EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.athlete_id = auth.uid() OR conversations.professional_id = auth.uid())
  ))
);