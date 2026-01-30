# Avatar Upload Troubleshooting Guide

## Error: "new row violates row-level security policy"

This error occurs when the RLS (Row Level Security) policies for the storage bucket are not set up correctly.

## Step-by-Step Fix

### Step 1: Verify Bucket Exists

1. Go to **Supabase Dashboard** → **Storage**
2. Check if the `avatars` bucket exists
3. If it doesn't exist:
   - Click **"New bucket"**
   - Name: `avatars`
   - **Public bucket**: ✅ YES (checked)
   - File size limit: `2 MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - Click **"Create bucket"**

### Step 2: Run RLS Migration

Run this SQL in **Supabase SQL Editor**:

```sql
-- File: supabase/migrations/fix-avatar-upload-rls-v2.sql
-- Or copy the entire content of that file
```

Or run this directly:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create upload policy
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Create update policy
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

-- Create delete policy
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Create view policy (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Ensure profiles update policy exists
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 3: Verify Policies

Run this query to check if policies exist:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%';
```

You should see 4 policies listed.

### Step 4: Test Upload

1. Go to `/profile` page
2. Click "Change Picture"
3. Select an image file
4. Check browser console for any errors

### Step 5: Check Browser Console

If it still fails, check the browser console (F12) for:
- The exact error message
- The file path being used
- Any RLS-related errors

## Common Issues

### Issue 1: Bucket doesn't exist
**Solution**: Create the bucket manually in Supabase Dashboard

### Issue 2: Bucket is private instead of public
**Solution**: 
- Go to Storage → avatars bucket → Settings
- Toggle "Public bucket" to ON

### Issue 3: RLS policies not applied
**Solution**: Run the migration SQL again

### Issue 4: User ID mismatch
**Solution**: Make sure you're logged in and `auth.uid()` returns your user ID

## Manual Test Query

Test if you can insert into storage (replace YOUR_USER_ID):

```sql
-- This should work if policies are correct
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
SELECT auth.uid(); -- Check your user ID first

-- Then test the policy logic
SELECT 
  'avatars' = 'avatars' AS bucket_check,
  (string_to_array('YOUR_USER_ID/avatar.jpg', '/'))[1] = auth.uid()::text AS path_check;
```

## Still Not Working?

1. Check Supabase logs: Dashboard → Logs → API Logs
2. Verify your user is authenticated: `SELECT auth.uid();`
3. Try creating a test file manually in Storage to verify bucket access
4. Check if there are any conflicting policies
