-- Fix missing profile for existing user
-- Run this in Supabase SQL Editor to create profile for user that doesn't have one

-- STEP 1: First check what columns exist in profiles table
-- Run this query first to see the table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- STEP 2: Based on the actual columns, use one of these options:

-- Option A: Minimal - just id and role (try this first)
INSERT INTO profiles (id, role)
VALUES (
  '740cae84-9235-452b-bc88-72e91ecda288',
  COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = '740cae84-9235-452b-bc88-72e91ecda288'),
    'admin'
  )
)
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, profiles.role);

-- Option B: If the above fails, try just updating the role (if profile exists):
-- UPDATE profiles SET role = 'admin' WHERE id = '740cae84-9235-452b-bc88-72e91ecda288';

-- Option C: If profiles has different column names, check with:
-- SELECT * FROM profiles LIMIT 1;
