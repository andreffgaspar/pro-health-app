-- Verificar se as políticas já existem e criar apenas as que não existem
DO $$
BEGIN
    -- Política para permitir que usuários vejam seus próprios arquivos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own medical files'
    ) THEN
        CREATE POLICY "Users can view their own medical files" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Política para permitir que usuários façam upload de seus próprios arquivos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own medical files'
    ) THEN
        CREATE POLICY "Users can upload their own medical files" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Política para permitir que usuários atualizem seus próprios arquivos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own medical files'
    ) THEN
        CREATE POLICY "Users can update their own medical files" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Política para permitir que usuários deletem seus próprios arquivos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own medical files'
    ) THEN
        CREATE POLICY "Users can delete their own medical files" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;