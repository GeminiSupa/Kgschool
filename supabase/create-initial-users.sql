-- Script to create initial users for each role
-- Run this after setting up your Supabase project
-- Note: You'll need to manually create users in Supabase Auth first, then update their profiles

-- Example workflow:
-- 1. Create users in Supabase Dashboard > Authentication > Users
-- 2. Note their UUIDs
-- 3. Update the profiles table with the correct roles:

-- For Admin:
-- UPDATE profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@kindergarten.de';

-- For Teacher:
-- UPDATE profiles SET role = 'teacher', full_name = 'Teacher User' WHERE email = 'teacher@kindergarten.de';

-- For Parent:
-- UPDATE profiles SET role = 'parent', full_name = 'Parent User' WHERE email = 'parent@kindergarten.de';

-- For Kitchen:
-- UPDATE profiles SET role = 'kitchen', full_name = 'Kitchen Staff' WHERE email = 'kitchen@kindergarten.de';

-- Alternative: Use Supabase Admin API to create users programmatically
-- This requires the service role key and should be done server-side

-- Function to create user with profile (requires service role)
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- This function should be called from a server-side script with service role
  -- as it requires admin privileges to create auth users
  -- For now, users should be created through Supabase Auth UI or Admin API
  
  -- After user is created in auth.users, update their profile
  -- This part can be done via trigger or manually
  
  RETURN v_user_id;
END;
$$;

-- Helper: Update profile role after user creation
-- This can be run after creating a user in Supabase Auth
CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;
