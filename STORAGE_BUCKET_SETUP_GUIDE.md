# Storage Bucket Setup Guide - CRITICAL STEP

## ⚠️ IMPORTANT: Bucket Must Be Created Manually

**SQL migrations CANNOT create storage buckets.** You MUST create the bucket manually in Supabase Dashboard first!

## Step-by-Step Setup

### Step 1: Create the Storage Bucket (REQUIRED)

1. **Go to Supabase Dashboard**
   - Open your project
   - Click **"Storage"** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** button (top right)
   - Fill in the form:
     - **Name:** `avatars` (exactly this, lowercase, no spaces)
     - **Public bucket:** ✅ **YES** (MUST be checked - this is critical!)
     - **File size limit:** `2097152` (2 MB in bytes) or leave default
     - **Allowed MIME types:** 
       - `image/jpeg`
       - `image/png`
       - `image/webp`
       - `image/gif`
   - Click **"Create bucket"**

3. **Verify Bucket Created**
   - You should see `avatars` in the bucket list
   - Click on it to verify it's marked as **Public**

### Step 2: Run the RLS Policies SQL

After creating the bucket, run the SQL migration:

1. Go to **SQL Editor** in Supabase Dashboard
2. Open or paste the content of: `supabase/migrations/diagnose-and-fix-avatars.sql`
3. Click **"Run"**
4. Check the output - it should show:
   - ✓ Bucket "avatars" exists
   - ✓ Policies Created (4 policies)

### Step 3: Verify Everything

Run this query in SQL Editor to verify:

```sql
-- Check bucket exists and is public
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'avatars';

-- Check policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%avatar%'
ORDER BY cmd;
```

Expected results:
- Bucket should show `public: true`
- 4 policies should exist (INSERT, UPDATE, DELETE, SELECT)

### Step 4: Test Upload

1. Go to `/profile` page in your app
2. Click "Bild ändern" (Change Picture)
3. Select an image file
4. Check browser console (F12) for:
   - `Uploading avatar: { fileName, userId }`
   - `Upload successful: { ... }`
   - `Public URL: ...`

## Common Issues

### Issue: "Bucket not found" error
**Solution:** The bucket doesn't exist. Go back to Step 1 and create it manually.

### Issue: "Permission denied" or "RLS" error
**Solution:** 
1. Verify bucket is **Public** (Step 1)
2. Re-run the SQL migration (Step 2)
3. Check policies exist (Step 3)

### Issue: Upload succeeds but image doesn't show
**Solution:** 
1. Check if bucket is Public
2. Verify the public URL is correct
3. Check browser console for image loading errors

## Quick Verification Checklist

- [ ] Bucket `avatars` exists in Storage
- [ ] Bucket is marked as **Public** ✅
- [ ] SQL migration has been run
- [ ] 4 RLS policies exist (check with SQL query)
- [ ] Profile update policy exists
- [ ] Test upload works without errors
