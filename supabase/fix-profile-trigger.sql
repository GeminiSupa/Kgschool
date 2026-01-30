-- Fix for profile creation trigger to handle missing full_name
-- This ensures full_name is always set, even if metadata is missing

-- First, fix the existing user's profile
UPDATE profiles 
SET full_name = COALESCE(
  full_name, 
  SPLIT_PART(email, '@', 1), -- Use email prefix as fallback
  'User' -- Final fallback
)
WHERE full_name IS NULL;

-- Update the trigger function to better handle missing metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
      'User'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;