# Avatar Upload Verification Checklist

## ✅ After Running SQL Migration

After running `supabase/migrations/diagnose-and-fix-avatars.sql`, verify the following:

### 1. Check Storage Bucket Exists
- Go to Supabase Dashboard → Storage
- Verify `avatars` bucket exists
- Verify it's marked as **Public**
- If not, create it: Name: `avatars`, Public: ✅ YES

### 2. Verify RLS Policies Were Created
Run this in Supabase SQL Editor to check:

```sql
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

You should see 4 policies:
- ✅ "Users can upload their own avatar" (INSERT)
- ✅ "Users can update their own avatar" (UPDATE)
- ✅ "Users can delete their own avatar" (DELETE)
- ✅ "Anyone can view avatars" (SELECT)

### 3. Verify Profile Update Policy
Run this to check:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND policyname LIKE '%update%';
```

Should see: "Users can update their own profile"

### 4. Test Upload Functionality

1. **Login** to the application
2. Go to **Profile** page (`/profile`)
3. Click **"Bild ändern"** (Change Picture)
4. Select an image file (JPG, PNG, or GIF, max 2MB)
5. Check browser console for:
   - `Uploading avatar: { fileName, userId }`
   - `Upload successful: { ... }`
   - `Public URL: ...`

### 5. Expected Behavior

✅ **Success:**
- File uploads to `avatars/{user_id}/avatar.{ext}`
- Profile updates with avatar URL
- Avatar displays in profile page and user menu
- No errors in console

❌ **If you see errors:**

**"Permission denied" or "row-level security" error:**
- The RLS policies may not be active
- Re-run the SQL migration
- Check that policies were created (see step 2)

**"Bucket not found" error:**
- Create the `avatars` bucket in Supabase Dashboard
- Make sure it's marked as Public

**"Not authenticated" error:**
- User session may have expired
- Try logging out and back in

### 6. File Path Structure

The upload creates files with this structure:
```
avatars/
  └── {user_id}/
      └── avatar.jpg (or .png, .gif, etc.)
```

The RLS policy checks that `(string_to_array(name, '/'))[1] = auth.uid()::text`
- This means the first folder name must match the user's ID
- The code uses: `${user.value.id}/avatar.{ext}` ✅

### 7. Console Debugging

Open browser DevTools (F12) → Console tab, then try uploading. You should see:
```
Uploading avatar: { fileName: "abc123/avatar.jpg", userId: "abc123" }
Upload successful: { path: "abc123/avatar.jpg", ... }
Public URL: https://your-project.supabase.co/storage/v1/object/public/avatars/abc123/avatar.jpg
```

If you see errors, they will be logged with full details.

## Troubleshooting

### Still getting permission errors?

1. **Verify user is authenticated:**
   ```sql
   SELECT auth.uid() as current_user_id;
   ```

2. **Check if bucket exists:**
   ```sql
   SELECT name, public FROM storage.buckets WHERE name = 'avatars';
   ```

3. **Verify policies are active:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' 
   AND tablename = 'objects' 
   AND policyname LIKE '%avatar%';
   ```

4. **Test policy manually:**
   ```sql
   -- Replace YOUR_USER_ID with actual user ID
   SELECT 
     'avatars' = 'avatars' as bucket_check,
     (string_to_array('YOUR_USER_ID/avatar.jpg', '/'))[1] = auth.uid()::text as path_check;
   ```
