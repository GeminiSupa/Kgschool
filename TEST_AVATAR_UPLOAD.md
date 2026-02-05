# Avatar Upload Test Guide

## ✅ Bucket Status: CONFIRMED
Your bucket is set up correctly:
- ✅ Name: `avatars`
- ✅ Public: `true`
- ✅ File size limit: 3MB (code limits to 2MB)

## Next Steps: Verify RLS Policies

### Step 1: Run Verification SQL

Run this in **Supabase SQL Editor** to verify RLS policies:

```sql
-- Check RLS Policies
SELECT 
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
```

**Expected Result:** You should see **4 policies**:
- ✅ "Users can upload their own avatar" (INSERT)
- ✅ "Users can update their own avatar" (UPDATE)
- ✅ "Users can delete their own avatar" (DELETE)
- ✅ "Anyone can view avatars" (SELECT)

### Step 2: Verify Profile Update Policy

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND policyname LIKE '%update%';
```

**Expected Result:** Should see "Users can update their own profile" (UPDATE)

### Step 3: Test Upload

1. **Go to Profile Page**
   - Navigate to `/profile` in your app
   - Make sure you're logged in

2. **Open Browser Console**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to **Console** tab
   - Keep it open to see logs

3. **Try Upload**
   - Click **"Bild ändern"** (Change Picture)
   - Select an image file (JPG, PNG, or GIF, max 2MB)
   - Watch the console for messages

4. **Expected Console Output (Success):**
   ```
   Uploading avatar: { fileName: "your-user-id/avatar.jpg", userId: "your-user-id" }
   ✓ Bucket verified: { name: "avatars", public: true }
   Upload successful: { path: "your-user-id/avatar.jpg", ... }
   Public URL: https://your-project.supabase.co/storage/v1/object/public/avatars/your-user-id/avatar.jpg
   ```

5. **If You See Errors:**
   - Copy the **exact error message** from console
   - Check which step failed
   - Common issues:
     - ❌ "Permission denied" → RLS policies not set up (run SQL migration)
     - ❌ "Bucket not found" → Bucket doesn't exist (but you confirmed it does)
     - ❌ "Not authenticated" → Log out and log back in

## Troubleshooting

### If RLS Policies Are Missing

Run the SQL migration again:
```sql
-- File: supabase/migrations/diagnose-and-fix-avatars.sql
-- Copy entire content and run in SQL Editor
```

### If Upload Still Fails

1. **Check Browser Console** for exact error
2. **Check Network Tab** (F12 → Network) for failed requests
3. **Verify User Session:**
   - Make sure you're logged in
   - Try logging out and back in
4. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → API Logs
   - Look for storage-related errors

## Quick Test Checklist

- [ ] Bucket exists and is public ✅ (CONFIRMED)
- [ ] 4 RLS policies exist (run SQL query above)
- [ ] Profile update policy exists (run SQL query above)
- [ ] User is logged in
- [ ] Browser console shows no errors
- [ ] Upload succeeds and avatar appears

## Still Having Issues?

If upload still fails after verifying everything:
1. Share the **exact error message** from browser console
2. Share the result of the RLS policy check SQL query
3. Check if there are any errors in Supabase Dashboard → Logs
