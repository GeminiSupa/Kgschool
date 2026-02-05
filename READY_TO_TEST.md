# ✅ Avatar Upload - Ready to Test!

## Current Status

✅ **Bucket:** Exists and is public  
✅ **Profile Policy:** Verified  
⏳ **Storage Policies:** Need to verify (4 policies required)

## Final Verification Step

Run this SQL query in **Supabase SQL Editor** to check storage policies:

```sql
-- Check Storage RLS Policies
SELECT 
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
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 policies exist'
    ELSE '❌ Missing policies - Run SQL migration!'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';
```

**Expected Result:** You should see **4 policies**:
1. ✅ "Users can upload their own avatar" (INSERT)
2. ✅ "Users can update their own avatar" (UPDATE)
3. ✅ "Users can delete their own avatar" (DELETE)
4. ✅ "Anyone can view avatars" (SELECT)

## If Policies Are Missing

If you see fewer than 4 policies, run the SQL migration again:

1. Go to **Supabase SQL Editor**
2. Open: `supabase/migrations/diagnose-and-fix-avatars.sql`
3. Copy the entire content
4. Paste and click **"Run"**

## Test Upload Now

Once all 4 policies are confirmed:

1. **Go to Profile Page** (`/profile`)
2. **Open Browser Console** (F12 → Console tab)
3. **Click "Bild ändern"** (Change Picture button)
4. **Select an image file** (JPG, PNG, or GIF, max 2MB)
5. **Watch the console** for success messages

### Expected Success Output:
```
Uploading avatar: { fileName: "your-user-id/avatar.jpg", userId: "your-user-id" }
✓ Bucket verified: { name: "avatars", public: true }
Upload successful: { path: "your-user-id/avatar.jpg", ... }
Public URL: https://your-project.supabase.co/storage/v1/object/public/avatars/your-user-id/avatar.jpg
```

### If You See Errors:
- Copy the **exact error message** from console
- The error message will tell you exactly what's wrong
- Common fixes:
  - ❌ "Permission denied" → Re-run SQL migration
  - ❌ "Bucket not found" → Check bucket exists (you already confirmed it does)
  - ❌ "Not authenticated" → Log out and log back in

## Quick Checklist

- [x] Bucket exists and is public ✅
- [x] Profile update policy exists ✅
- [ ] **4 storage RLS policies exist** ← Verify this now!
- [ ] Upload test successful

Once you verify the 4 storage policies exist, try uploading and let me know the result!
