-- Migration: Setup Storage Buckets for Avatars and Lunch Photos
-- This ensures the buckets exist and have the correct RLS policies.

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'avatars', 
    'avatars', 
    true, 
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'lunch-photos', 
    'lunch-photos', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Avatars Policies
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Lunch Photos Policies
DROP POLICY IF EXISTS "Public Access to Lunch Photos" ON storage.objects;
CREATE POLICY "Public Access to Lunch Photos" ON storage.objects
FOR SELECT USING (bucket_id = 'lunch-photos');

DROP POLICY IF EXISTS "Admins and Kitchen can upload lunch photos" ON storage.objects;
CREATE POLICY "Admins and Kitchen can upload lunch photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lunch-photos' 
  AND (public.is_admin() OR public.is_kitchen())
);

DROP POLICY IF EXISTS "Admins and Kitchen can update lunch photos" ON storage.objects;
CREATE POLICY "Admins and Kitchen can update lunch photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'lunch-photos' 
  AND (public.is_admin() OR public.is_kitchen())
);

DROP POLICY IF EXISTS "Admins and Kitchen can delete lunch photos" ON storage.objects;
CREATE POLICY "Admins and Kitchen can delete lunch photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'lunch-photos' 
  AND (public.is_admin() OR public.is_kitchen())
);
