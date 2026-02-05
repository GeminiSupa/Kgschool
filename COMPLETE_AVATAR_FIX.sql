-- COMPLETE FIX: Avatar Upload RLS - Run this in Supabase SQL Editor
-- Note: RLS is already enabled on storage.objects by default in Supabase
-- We only need to create the policies

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
-- STEP 3: Create policies with explicit syntax
-- ============================================

-- Policy 1: INSERT (Upload) - Users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 2: UPDATE - Users can update files in their own folder
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

-- Policy 3: DELETE - Users can delete files in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 4: SELECT (View) - Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- STEP 4: Verify RLS is enabled (read-only check)
-- Note: RLS is enabled by default on storage.objects in Supabase
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- ============================================
-- STEP 5: List all created policies
-- ============================================
SELECT 
  '✅ Policy' as status,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View (Public)'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 6: Final verification
-- ============================================
SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ SUCCESS: All 4 policies exist!'
    ELSE '❌ ERROR: Only ' || COUNT(*) || ' policies found. Expected 4.'
  END as result,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- ============================================
-- STEP 7: Test policy logic (optional - shows current user)
-- ============================================
SELECT 
  auth.uid() as current_user_id,
  'avatars' as bucket_name,
  'Policy check ready' as status;
