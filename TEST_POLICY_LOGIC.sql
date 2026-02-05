-- Test the policy logic to see if it matches correctly
-- This helps debug why uploads are still failing

-- ============================================
-- STEP 1: Check current user (when authenticated in app)
-- ============================================
-- Note: This will be null in SQL Editor, but will work when called from the app
SELECT 
  auth.uid() as current_user_id,
  'Run this from your app context' as note;

-- ============================================
-- STEP 2: Check policy conditions
-- ============================================
SELECT 
  policyname,
  cmd,
  qual as using_condition,
  with_check as with_check_condition
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 3: Test path matching logic
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the app
-- You can get it from browser console when uploading
SELECT 
  'Test path matching' as test,
  'YOUR_USER_ID_HERE' as user_id,
  'YOUR_USER_ID_HERE/avatar.jpg' as file_path,
  (string_to_array('YOUR_USER_ID_HERE/avatar.jpg', '/'))[1] as extracted_folder,
  CASE 
    WHEN (string_to_array('YOUR_USER_ID_HERE/avatar.jpg', '/'))[1] = 'YOUR_USER_ID_HERE' THEN '✅ Path matches'
    ELSE '❌ Path does not match'
  END as match_result;

-- ============================================
-- STEP 4: Check if there are any conflicting policies
-- ============================================
SELECT 
  'All storage policies' as info,
  policyname,
  cmd,
  bucket_id
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
