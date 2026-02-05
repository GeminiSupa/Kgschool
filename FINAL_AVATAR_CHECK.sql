-- Final comprehensive check for avatar upload setup
-- Run this to verify everything is ready

-- ============================================
-- 1. Bucket Status (You already confirmed this ✅)
-- ============================================
SELECT 
  'Bucket Status' as check_type,
  name,
  public as is_public,
  CASE WHEN public = true THEN '✅' ELSE '❌' END as status
FROM storage.buckets 
WHERE name = 'avatars';

-- ============================================
-- 2. Storage RLS Policies (CRITICAL - Must have 4)
-- ============================================
SELECT 
  'Storage Policies' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View (Public)'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as action,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- Count check
SELECT 
  'Policy Count' as check_type,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 policies exist'
    WHEN COUNT(*) < 4 THEN '❌ Missing policies - Run SQL migration!'
    ELSE '⚠️ Extra policies found'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- ============================================
-- 3. Profile Update Policy (You already confirmed this ✅)
-- ============================================
SELECT 
  'Profile Policy' as check_type,
  policyname,
  cmd,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND policyname LIKE '%update%'
  AND policyname LIKE '%profile%';

-- ============================================
-- SUMMARY
-- ============================================
-- Expected Results:
-- ✅ Bucket "avatars" exists and is public
-- ✅ 4 storage policies (INSERT, UPDATE, DELETE, SELECT)
-- ✅ 1 profile update policy
--
-- If you see all ✅, you're ready to test upload!
