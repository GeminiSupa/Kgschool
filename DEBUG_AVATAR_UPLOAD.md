# Debug Avatar Upload Issue

## Current Error
❌ Permission denied (RLS error)

## Steps to Fix

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for the error that starts with: `❌ Upload error details:`
4. Copy the **full error message** - it will show the exact Supabase error

### Step 2: Run Complete Fix SQL
Run this file in Supabase SQL Editor:
- **File:** `COMPLETE_AVATAR_FIX.sql`

This script will:
1. ✅ Enable RLS on `storage.objects` table (if not already enabled)
2. ✅ Drop all existing avatar policies
3. ✅ Create 4 new policies (INSERT, UPDATE, DELETE, SELECT)
4. ✅ Verify policies were created
5. ✅ Show current user ID for testing

### Step 3: Verify Policies After Running SQL
After running the SQL, you should see:
- ✅ 4 policies listed
- ✅ "SUCCESS: All 4 policies exist!"

### Step 4: Check RLS is Enabled
Run this query to verify RLS is enabled:
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

Should show: `rls_enabled: true`

### Step 5: Test Upload Again
1. Refresh your browser (to clear cache)
2. Go to `/profile`
3. Open Console (F12)
4. Click "Bild ändern"
5. Select an image
6. Watch console for detailed error (if it fails)

## Common Issues

### Issue: "new row violates row-level security policy"
**Solution:** RLS is enabled but policies are missing or incorrect. Run `COMPLETE_AVATAR_FIX.sql`.

### Issue: Policies exist but still getting error
**Possible causes:**
1. User session expired - try logging out and back in
2. Policy syntax issue - check the policy definitions
3. File path doesn't match policy - should be `{user_id}/avatar.{ext}`

### Issue: RLS not enabled
**Solution:** The SQL script will enable it, but you can also run:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## File Path Structure
The code uploads files as: `{user_id}/avatar.{ext}`
Example: `740cae84-9235-452b-bc88-72e91ecda288/avatar.jpg`

The policy checks: `(string_to_array(name, '/'))[1] = auth.uid()::text`
This extracts the first folder name and compares it to the user's ID.

## Next Steps
1. **Check browser console** for the exact error message
2. **Run COMPLETE_AVATAR_FIX.sql** in Supabase SQL Editor
3. **Verify policies** were created (should see 4 policies)
4. **Try upload again** and share the console error if it still fails
