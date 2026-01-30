-- Create/update profile for user: 740cae84-9235-452b-bc88-72e91ecda288
-- All required columns: id, role, full_name, email

INSERT INTO profiles (id, role, full_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'role', 'admin')::text,
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1), 'User')::text,
  email::text
FROM auth.users
WHERE id = '740cae84-9235-452b-bc88-72e91ecda288'
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, profiles.role),
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = COALESCE(EXCLUDED.email, profiles.email);
