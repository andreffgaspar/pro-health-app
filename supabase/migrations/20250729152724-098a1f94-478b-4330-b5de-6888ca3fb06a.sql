-- Verificar e corrigir as políticas RLS para as tabelas de conversas

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view group participants they're part of" ON group_participants;
DROP POLICY IF EXISTS "Users can insert themselves in groups" ON group_participants;

-- Criar políticas mais simples e diretas para conversas
CREATE POLICY "Enable read access for conversation participants" ON conversations
FOR SELECT USING (
  auth.uid() = athlete_id OR 
  auth.uid() = professional_id
);

CREATE POLICY "Enable insert for authenticated users" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() = athlete_id OR 
  auth.uid() = professional_id
);

CREATE POLICY "Enable update for conversation participants" ON conversations
FOR UPDATE USING (
  auth.uid() = athlete_id OR 
  auth.uid() = professional_id
);

-- Criar políticas simples para group_participants
CREATE POLICY "Enable read access for group participants" ON group_participants
FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Enable insert for authenticated users" ON group_participants
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Verificar se RLS está habilitado
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;