# Login Troubleshooting Guide

## 🔍 Issue: Can't Log In / Redirected Back to Login

If you're being redirected back to the login page, here's how to fix it:

## ✅ Step 1: Create a User Account

You need a user account before you can log in. Two options:

### Option A: Sign Up Through the App (Recommended)

1. **Go to login page**: http://localhost:3000/login (or 3001)
2. **Click "Sign Up"** (if available) or go to signup page
3. **Create an account**:
   - Email: `admin@kindergarten.de` (or your email)
   - Password: (choose a strong password)
4. **After signup**, go to Supabase SQL Editor and run:
   ```sql
   UPDATE profiles SET role = 'admin', full_name = 'Admin User' 
   WHERE email = 'admin@kindergarten.de';
   ```
5. **Log out and log back in**

### Option B: Create Through Supabase Dashboard

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/omfteqtfgyxftoukjfar
   - Or: https://omfteqtfgyxftoukjfar.supabase.co

2. **Navigate to Authentication > Users**

3. **Click "Add User"** or "Invite User"

4. **Create User**:
   - Email: `admin@kindergarten.de` (or your email)
   - Password: (choose a password)
   - ✅ Check "Auto Confirm User"
   - Click **Create User**

5. **Set Role in SQL Editor**:
   ```sql
   UPDATE profiles SET role = 'admin', full_name = 'Admin User' 
   WHERE email = 'admin@kindergarten.de';
   ```

6. **Try logging in** with those credentials

## ✅ Step 2: Fix Profile If Needed

If you created a user but still can't log in, check the profile:

```sql
-- Check if profile exists
SELECT id, email, role, full_name FROM profiles WHERE email = 'admin@kindergarten.de';

-- If full_name is NULL, fix it:
UPDATE profiles 
SET full_name = SPLIT_PART(email, '@', 1)
WHERE full_name IS NULL AND email = 'admin@kindergarten.de';

-- If role is not set, set it:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@kindergarten.de';
```

## ✅ Step 3: Verify Login

1. **Open**: http://localhost:3000/login
2. **Enter credentials**:
   - Email: `admin@kindergarten.de`
   - Password: (the password you set)
3. **Click "Login"**
4. **Should redirect to**: `/admin/dashboard`

## 🔍 Common Issues

### Issue: "Invalid login credentials"
- **Solution**: Check email/password in Supabase Dashboard > Authentication > Users
- **Verify**: User exists and password is correct

### Issue: "User profile not found"
- **Solution**: Profile might not have been created by trigger
- **Fix**: Run `supabase/fix-profile-trigger.sql` in SQL Editor
- **Then**: Manually create profile or fix existing one

### Issue: Redirected back to login immediately
- **Cause**: Profile might not have a role set
- **Fix**: Run the UPDATE query to set role to 'admin'

### Issue: "Profile fetch error" in console
- **Cause**: RLS policy blocking profile read
- **Fix**: Verify you ran `supabase/schema.sql` which includes RLS policies

## ✅ Quick Test SQL

Run this in Supabase SQL Editor to check everything:

```sql
-- Check all users and their profiles
SELECT 
  au.email,
  p.role,
  p.full_name,
  p.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- If a user has no profile, create one:
-- (Replace 'your@email.com' with actual email)
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, SPLIT_PART(email, '@', 1), 'admin'
FROM auth.users
WHERE email = 'your@email.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.users.id);
```

## 🎯 Expected Behavior

After successful login:
- ✅ Redirects to `/admin/dashboard` (if role is admin)
- ✅ Shows dashboard with navigation
- ✅ User menu visible in header
- ✅ No redirect back to login

## 📝 Summary

1. **Create user** (through app or Supabase dashboard)
2. **Set role** in SQL Editor (`UPDATE profiles SET role = 'admin' ...`)
3. **Fix profile** if needed (ensure `full_name` is not NULL)
4. **Login** with credentials
5. **Should work!** 🎉

---

**Quick Checklist:**
- [ ] User exists in Supabase Authentication
- [ ] Profile exists in profiles table
- [ ] Profile has `role` set (e.g., 'admin')
- [ ] Profile has `full_name` set (not NULL)
- [ ] Try logging in with correct credentials
