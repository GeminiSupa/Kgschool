-- Quick verification: Check if all 4 policies exist
-- Run this to confirm policies were created

SELECT 
  '✅ Policy Status' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View (Public)'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- Count check
SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ SUCCESS: All 4 policies exist!'
    WHEN COUNT(*) > 4 THEN '⚠️ WARNING: ' || COUNT(*) || ' policies found (expected 4)'
    ELSE '❌ ERROR: Only ' || COUNT(*) || ' policies found. Expected 4.'
  END as result,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';
