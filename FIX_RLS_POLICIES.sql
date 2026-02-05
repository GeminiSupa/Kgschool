-- Fix RLS Policies for Avatar Uploads
-- Run this in Supabase SQL Editor to fix permission issues

-- ============================================
-- STEP 1: Check current policies (diagnostic)
-- ============================================
SELECT 
  'Current Policies (before fix):' as info,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 2: Drop ALL existing avatar policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatar_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_view_policy" ON storage.objects;

-- ============================================
-- STEP 3: Create new policies with correct syntax
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
-- STEP 4: Verify policies were created
-- ============================================
SELECT 
  '✓ Policies Created:' as status,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View (Public)'
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

-- Count check
SELECT 
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 policies created successfully!'
    ELSE '❌ Only ' || COUNT(*) || ' policies found. Expected 4.'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- ============================================
-- STEP 5: Verify profile update policy
-- ============================================
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

SELECT '✓ Profile update policy verified' as status;
