# Avatar Upload Fix Checklist

## ⚠️ Error: "Permission denied. Please ensure the avatars bucket exists and RLS policies are set up correctly."

Follow these steps in order:

## Step 1: Create the Bucket (if it doesn't exist)

1. Go to **Supabase Dashboard** → **Storage**
2. Check if `avatars` bucket exists in the list
3. **If it doesn't exist:**
   - Click **"New bucket"** button
   - **Name:** `avatars` (exactly this, lowercase)
   - **Public bucket:** ✅ **YES** (must be checked)
   - **File size limit:** `2 MB` (or your preference)
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - Click **"Create bucket"**

## Step 2: Run the Diagnostic and Fix SQL

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/migrations/diagnose-and-fix-avatars.sql`
3. Copy the entire content
4. Paste into SQL Editor
5. Click **"Run"**

This script will:
- ✅ Check if bucket exists
- ✅ Show current policies
- ✅ Drop old policies
- ✅ Create new policies
- ✅ Verify everything is set up

## Step 3: Verify Bucket Settings

1. Go to **Storage** → Click on `avatars` bucket
2. Check these settings:
   - **Public bucket:** Should be **ON** ✅
   - **File size limit:** Should be set (e.g., 2 MB)
3. If Public is OFF, toggle it ON

## Step 4: Test Upload

1. Go to `/profile` page in your app
2. Click "Change Picture"
3. Select an image file
4. Check browser console (F12) for any errors

## Step 5: If Still Not Working

### Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Exact error message
- Any RLS-related errors
- Network errors

### Check Supabase Logs

1. Go to **Supabase Dashboard** → **Logs** → **API Logs**
2. Look for errors related to storage uploads
3. Check the error message details

### Manual Test Query

Run this in SQL Editor (replace YOUR_USER_ID with your actual user ID):

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then test the policy logic (replace YOUR_USER_ID)
SELECT 
  auth.uid() as current_user_id,
  'avatars' = 'avatars' as bucket_check,
  (string_to_array('YOUR_USER_ID/avatar.jpg', '/'))[1] = auth.uid()::text as path_check;
```

## Common Issues

### Issue 1: Bucket doesn't exist
**Solution:** Create it manually (Step 1)

### Issue 2: Bucket is private
**Solution:** Go to Storage → avatars → Settings → Toggle "Public bucket" to ON

### Issue 3: Policies not applied
**Solution:** Run the diagnostic SQL script (Step 2)

### Issue 4: User ID mismatch
**Solution:** Make sure you're logged in. Check `SELECT auth.uid();` returns your user ID

### Issue 5: Path structure wrong
**Solution:** The file path should be `{user_id}/avatar.{ext}`. The code handles this automatically.

## Still Not Working?

1. **Check if you're authenticated:**
   ```sql
   SELECT auth.uid();
   ```
   Should return your user ID, not NULL

2. **Check bucket permissions:**
   ```sql
   SELECT name, public, file_size_limit 
   FROM storage.buckets 
   WHERE name = 'avatars';
   ```
   `public` should be `true`

3. **Check policies exist:**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'storage' 
     AND tablename = 'objects' 
     AND policyname LIKE '%avatar%';
   ```
   Should show 4 policies (INSERT, UPDATE, DELETE, SELECT)

4. **Try uploading a test file manually:**
   - Go to Storage → avatars
   - Click "Upload file"
   - Create a folder with your user ID
   - Upload a file named `avatar.jpg` inside that folder
   - If this works, the issue is in the code
   - If this fails, the issue is with RLS policies
