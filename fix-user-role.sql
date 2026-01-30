-- Fix user role from parent to admin
UPDATE profiles 
SET role = 'admin', full_name = 'Admin User' 
WHERE email = 'admin@kg.com';

-- Verify the update
SELECT id, email, role, full_name FROM profiles WHERE email = 'admin@kg.com';
