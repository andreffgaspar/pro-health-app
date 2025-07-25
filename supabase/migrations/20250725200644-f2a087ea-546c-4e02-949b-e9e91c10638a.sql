-- Create conversations table for athlete-professional communication
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, professional_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create athlete_data table for expanded health/training data
CREATE TABLE public.athlete_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('training', 'nutrition', 'physiotherapy', 'medical', 'sleep', 'vitals')),
  data JSONB NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = athlete_id OR auth.uid() = professional_id);

CREATE POLICY "Athletes can create conversations with professionals" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = athlete_id OR auth.uid() = professional_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (athlete_id = auth.uid() OR professional_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (athlete_id = auth.uid() OR professional_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- RLS Policies for athlete_data
CREATE POLICY "Athletes can view their own data" 
ON public.athlete_data 
FOR SELECT 
USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert their own data" 
ON public.athlete_data 
FOR INSERT 
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update their own data" 
ON public.athlete_data 
FOR UPDATE 
USING (auth.uid() = athlete_id);

CREATE POLICY "Professionals can view athlete data in conversations"
ON public.athlete_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE athlete_id = public.athlete_data.athlete_id
    AND professional_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_conversations_athlete_id ON public.conversations(athlete_id);
CREATE INDEX idx_conversations_professional_id ON public.conversations(professional_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_athlete_data_athlete_id ON public.athlete_data(athlete_id);
CREATE INDEX idx_athlete_data_type ON public.athlete_data(data_type);
CREATE INDEX idx_athlete_data_recorded_at ON public.athlete_data(recorded_at DESC);