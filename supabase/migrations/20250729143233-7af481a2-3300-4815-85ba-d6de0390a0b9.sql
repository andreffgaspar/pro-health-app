-- Adicionar coluna appointment_type na tabela sessions
ALTER TABLE public.sessions 
ADD COLUMN appointment_type TEXT;