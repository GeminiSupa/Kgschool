# Avatar Storage Bucket Setup

## Bucket Configuration

### Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Configure as follows:

**Bucket Name:** `avatars`

**Public bucket:** ✅ **YES** (checked - make it public for easy access)

**File size limit:** `2 MB` (or your preference)

**Allowed MIME types:** 
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

### Why Public?

Profile pictures are meant to be visible to other users, so making the bucket public allows easy access without generating signed URLs for every request.

### Setup RLS Policies

After creating the bucket, run the SQL migration:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/setup-avatars-bucket.sql
```

This will create RLS policies that:
- Allow users to upload, update, and delete their own avatars
- Allow anyone to view avatars (public access)

## How It Works

1. **Upload**: User selects image → uploaded to `avatars/{user_id}/{timestamp}.{ext}` → URL saved in `profiles.avatar_url`

2. **Display**: Avatar URL is stored in the profile and displayed throughout the app

3. **Security**: 
   - Users can only upload/delete their own avatars (enforced by RLS)
   - Anyone can view avatars (public bucket)

## Features

- ✅ Upload profile picture
- ✅ Remove profile picture
- ✅ Automatic file validation (image types, 2MB limit)
- ✅ Avatar displayed in user menu and profile page
- ✅ Fallback to initials if no avatar

## Testing

1. Go to `/profile`
2. Click "Change Picture"
3. Select an image file
4. Verify the avatar appears in the user menu
5. Try removing the avatar
6. Verify it falls back to initials
