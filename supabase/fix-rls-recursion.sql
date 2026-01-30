-- Fix infinite recursion in profiles RLS policies
-- The "Admins can view all profiles" policy was checking profiles table,
-- which caused infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Replace with a non-recursive version that doesn't query profiles table
-- Instead, we'll use a function or check metadata
-- For now, users can view their own profile and admins will use a separate function

-- Users can view their own profile (this one is fine)
-- Already exists, but keeping it for reference
-- CREATE POLICY "Users can view their own profile" ON profiles
--   FOR SELECT USING (auth.uid() = id);

-- If you need admins to view all profiles, use a service role or
-- create a function that bypasses RLS for admin checks

-- For now, remove the admin policy to fix the recursion
-- Users can view their own profiles, which should be enough for login
