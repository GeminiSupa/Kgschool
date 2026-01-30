-- First, check what columns actually exist in the profiles table
-- Run this to see the table structure:

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
