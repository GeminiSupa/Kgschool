-- Comprehensive diagnostic and fix for avatars bucket
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: DIAGNOSTIC - Check if bucket exists
-- ============================================
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION 'ERROR: avatars bucket does not exist! Please create it manually in Supabase Dashboard > Storage > New Bucket. Name: avatars, Public: YES';
  ELSE
    RAISE NOTICE '✓ Bucket "avatars" exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Check current policies
-- ============================================
SELECT 
  'Current Storage Policies:' as info,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as action
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 3: Drop all existing avatar policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- ============================================
-- STEP 4: Create new policies with proper syntax
-- ============================================

-- Policy 1: Users can INSERT (upload) files to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 2: Users can UPDATE files in their own folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 3: Users can DELETE files in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 4: Anyone (including anonymous) can SELECT (view) avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- STEP 5: Verify policies were created
-- ============================================
SELECT 
  '✓ Policies Created:' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 6: Test policy logic (replace with your user ID)
-- ============================================
-- Uncomment and replace YOUR_USER_ID to test:
-- SELECT 
--   auth.uid() as current_user_id,
--   'avatars' = 'avatars' as bucket_check,
--   (string_to_array('YOUR_USER_ID/avatar.jpg', '/'))[1] = auth.uid()::text as path_check;

-- ============================================
-- STEP 7: Ensure profiles table update policy exists
-- ============================================
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

SELECT '✓ Profile update policy verified' as status;
