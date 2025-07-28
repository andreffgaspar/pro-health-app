-- Create medical files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Create storage policies for medical files
CREATE POLICY "Athletes can upload their own medical files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Athletes can view their own medical files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Athletes can update their own medical files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Athletes can delete their own medical files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Professionals can view medical files from their athlete relationships" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-files' 
  AND EXISTS (
    SELECT 1 
    FROM athlete_professional_relationships 
    WHERE athlete_id::text = (storage.foldername(name))[1]
    AND professional_id = auth.uid()
    AND status = 'accepted'
  )
);