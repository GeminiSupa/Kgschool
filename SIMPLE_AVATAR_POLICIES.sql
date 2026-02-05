-- SIMPLE Avatar Policies - Minimal restrictions to test
-- Run this if other policies aren't working

-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- ============================================
-- STEP 2: Create simple policies (bucket-only check first)
-- ============================================

-- Policy 1: INSERT - Allow any authenticated user to upload to avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 2: UPDATE
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy 3: DELETE
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy 4: SELECT (Public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- STEP 3: Verify
-- ============================================
SELECT 
  '✅ Simple policies created' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- NOTE: These policies allow any authenticated user to upload/update/delete
-- any file in the avatars bucket. This is less secure but will help us
-- determine if the issue is with the path matching logic.
-- 
-- Once uploads work, we can add back the folder restriction:
-- (string_to_array(name, '/'))[1] = auth.uid()::text
-- ============================================
