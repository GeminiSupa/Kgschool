-- Quick verification script for avatar upload setup
-- Run this in Supabase SQL Editor to verify everything is configured correctly

-- ============================================
-- 1. Verify Bucket Exists and is Public
-- ============================================
SELECT 
  'Bucket Status:' as check_type,
  name,
  public as is_public,
  file_size_limit,
  CASE 
    WHEN public = true THEN '✅ Public'
    ELSE '❌ NOT Public - FIX THIS!'
  END as status
FROM storage.buckets 
WHERE name = 'avatars';

-- ============================================
-- 2. Verify RLS Policies Exist
-- ============================================
SELECT 
  'RLS Policies:' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as action,
  CASE 
    WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT') THEN '✅'
    ELSE '❌'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- 3. Verify Profile Update Policy
-- ============================================
SELECT 
  'Profile Policy:' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'UPDATE' THEN '✅'
    ELSE '❌'
  END as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND policyname LIKE '%update%'
  AND policyname LIKE '%profile%';

-- ============================================
-- 4. Expected Results Summary
-- ============================================
-- You should see:
-- ✅ Bucket "avatars" with public = true
-- ✅ 4 storage policies (INSERT, UPDATE, DELETE, SELECT)
-- ✅ 1 profile policy (UPDATE)
