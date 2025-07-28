-- Create table for group conversations
CREATE TABLE public.group_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for group participants  
CREATE TABLE public.group_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create table for group messages
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_by JSONB DEFAULT '[]'
);

-- Enable RLS
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_conversations
CREATE POLICY "Users can view groups they participate in"
ON public.group_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_participants.group_id = group_conversations.id 
    AND group_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON public.group_conversations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
ON public.group_conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_participants.group_id = group_conversations.id 
    AND group_participants.user_id = auth.uid()
    AND group_participants.role = 'admin'
  )
);

-- RLS Policies for group_participants
CREATE POLICY "Users can view participants of their groups"
ON public.group_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp2
    WHERE gp2.group_id = group_participants.group_id 
    AND gp2.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can manage participants"
ON public.group_participants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp2
    WHERE gp2.group_id = group_participants.group_id 
    AND gp2.user_id = auth.uid()
    AND gp2.role = 'admin'
  )
);

-- RLS Policies for group_messages
CREATE POLICY "Users can view messages in their groups"
ON public.group_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_participants.group_id = group_messages.group_id 
    AND group_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can send messages"
ON public.group_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_participants.group_id = group_messages.group_id 
    AND group_participants.user_id = auth.uid()
  )
);

-- Create triggers for updating timestamps
CREATE TRIGGER update_group_conversations_updated_at
BEFORE UPDATE ON public.group_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();