-- Safe migration: Drop and recreate profiles policies
-- This can be run multiple times without errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Use helper function if it exists, otherwise use direct check
DO $$
BEGIN
  -- Check if helper function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    -- Use helper function
    EXECUTE 'CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (is_admin())';
    
    EXECUTE 'CREATE POLICY "Admins can manage all profiles" ON profiles
      FOR ALL USING (is_admin())';
  ELSE
    -- Fallback to direct check
    CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "Admins can manage all profiles" ON profiles
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
