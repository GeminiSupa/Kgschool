-- Fix profiles RLS to allow admins to view all profiles without recursion
-- This replaces the recursive "Admins can view all profiles" policy
-- Also creates helper functions for role checks to avoid recursion in other policies

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create helper function to get user role (without recursion)
-- Uses SECURITY DEFINER to bypass RLS when checking profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get role from auth.users metadata first (if available)
  SELECT raw_user_meta_data->>'role' INTO v_role
  FROM auth.users
  WHERE id = auth.uid();
  
  -- If not in metadata, check profiles table (using SECURITY DEFINER to bypass RLS)
  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM profiles
    WHERE id = auth.uid();
  END IF;
  
  RETURN v_role;
END;
$$;

-- Create a function to check if current user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$;

-- Create a function to check if current user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN get_user_role() = 'teacher';
END;
$$;

-- Create a function to check if current user is admin or teacher
CREATE OR REPLACE FUNCTION is_admin_or_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := get_user_role();
  RETURN v_role IN ('admin', 'teacher');
END;
$$;

-- Create a function to check if current user is admin or kitchen staff
CREATE OR REPLACE FUNCTION is_admin_or_kitchen()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := get_user_role();
  RETURN v_role IN ('admin', 'kitchen');
END;
$$;

-- Create new admin policy using the function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Also allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (is_admin());
