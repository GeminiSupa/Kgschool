# Quick Fix for Login Issue

## 🔍 Most Common Issues

### Issue 1: Profile Fetch Failing (RLS Policy)

The profile fetch might be blocked by RLS. Check this:

**Run in Supabase SQL Editor:**

```sql
-- Check if you can read your own profile
SELECT * FROM profiles WHERE email = 'admin@kg.com';

-- If this fails, check RLS policies
-- The schema should have this policy:
-- "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id)
```

**Fix if RLS is blocking:**

```sql
-- Temporarily disable RLS to test (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test login, then re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Email Not Confirmed

**Check in Supabase Dashboard:**
1. Go to **Authentication > Users**
2. Find `admin@kg.com`
3. Check if **"Email Confirmed"** is checked
4. If not, click on user and set it to confirmed

**Or run SQL:**

```sql
-- Check email confirmation
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@kg.com';

-- If NULL, update it (requires service role):
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@kg.com';
```

### Issue 3: Wrong Password

**Reset password in Supabase:**
1. Go to **Authentication > Users**
2. Find `admin@kg.com`
3. Click on user
4. Click **"Reset Password"** or set a new password

### Issue 4: Profile Doesn't Match User ID

**Check if profile ID matches user ID:**

```sql
-- Compare IDs
SELECT 
  au.id as user_id,
  p.id as profile_id,
  au.email,
  p.email as profile_email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@kg.com';
```

**If IDs don't match, fix it:**

```sql
-- Delete old profile if exists
DELETE FROM profiles WHERE email = 'admin@kg.com';

-- Create new profile with correct ID
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@kg.com';
```

## 🎯 Complete Diagnostic

Run this complete check:

```sql
-- Complete diagnostic
SELECT 
  'User exists' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kg.com') 
    THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
  'Email confirmed',
  CASE WHEN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@kg.com' 
    AND email_confirmed_at IS NOT NULL
  ) THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'Profile exists',
  CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@kg.com') 
    THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'Profile ID matches User ID',
  CASE WHEN EXISTS (
    SELECT 1 FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE au.email = 'admin@kg.com'
  ) THEN '✅' ELSE '❌' END
UNION ALL
SELECT 
  'Role is admin',
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = 'admin@kg.com' 
    AND role = 'admin'
  ) THEN '✅' ELSE '❌' END;
```

## 🔧 Quick Fix Script

If everything looks correct but still not working, run this complete fix:

```sql
-- Complete fix script
-- 1. Ensure email is confirmed
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'admin@kg.com';

-- 2. Ensure profile exists with correct ID
DELETE FROM profiles WHERE email = 'admin@kg.com';

INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@kg.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Admin User';

-- 3. Verify
SELECT 
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  p.role,
  p.full_name,
  au.id = p.id as ids_match
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@kg.com';
```

## 📝 What to Check in Browser

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Try to log in**
4. **Look for:**
   - "Profile fetched successfully" ✅
   - "User role after login: admin" ✅
   - Any red error messages ❌

5. **Go to Network tab**
6. **Look for:**
   - `/auth/v1/token` request (should be 200)
   - `/rest/v1/profiles` request (check status)

## 🎯 After Running Fix

1. **Clear browser cache/cookies** (or use incognito)
2. **Go to**: http://localhost:3000/login
3. **Log in** with `admin@kg.com`
4. **Check console** for messages
5. **Should redirect** to `/admin/dashboard`

---

**Run the diagnostic SQL first to see what's wrong!** 🔍
