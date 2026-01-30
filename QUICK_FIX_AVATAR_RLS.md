# Quick Fix: Avatar Upload Permission Denied

## ⚡ Quick Steps (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy and Paste This SQL

Copy the **entire content** from this file:
- `supabase/migrations/diagnose-and-fix-avatars.sql`

Or copy this simplified version:

```sql
-- Drop existing policies
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

-- Ensure profile update policy exists
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 3: Run the SQL
1. Paste the SQL into the editor
2. Click **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for success message

### Step 4: Verify
You should see:
- ✅ Success message
- ✅ No errors

### Step 5: Test Upload
1. Go back to your app
2. Go to `/profile`
3. Try uploading an avatar
4. It should work now! 🎉

## 🔍 If It Still Doesn't Work

### Check 1: Verify Bucket is Public
1. Go to **Storage** → Click **"avatars"** bucket
2. Check **"Public bucket"** is **ON** ✅
3. If OFF, toggle it ON

### Check 2: Verify Policies Were Created
Run this in SQL Editor:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%avatar%';
```

You should see **4 policies**:
- Users can upload their own avatar (INSERT)
- Users can update their own avatar (UPDATE)
- Users can delete their own avatar (DELETE)
- Anyone can view avatars (SELECT)

### Check 3: Check Your User ID
Run this in SQL Editor:

```sql
SELECT auth.uid() as your_user_id;
```

Make sure it returns your user ID (not NULL).

## 📝 What These Policies Do

1. **Upload Policy**: Allows users to upload files to `avatars/{user_id}/` folder
2. **Update Policy**: Allows users to update files in their own folder
3. **Delete Policy**: Allows users to delete files in their own folder
4. **View Policy**: Allows anyone to view avatars (public bucket)

The path structure is: `{user_id}/avatar.{ext}`

Example: `abc123-def456-ghi789/avatar.jpg`
