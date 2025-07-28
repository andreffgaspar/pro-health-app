-- Criar bucket para arquivos médicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-files', 'medical-files', true);

-- Política para permitir que usuários vejam seus próprios arquivos
CREATE POLICY "Users can view their own medical files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir que usuários façam upload de seus próprios arquivos
CREATE POLICY "Users can upload their own medical files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir que usuários atualizem seus próprios arquivos
CREATE POLICY "Users can update their own medical files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Users can delete their own medical files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);