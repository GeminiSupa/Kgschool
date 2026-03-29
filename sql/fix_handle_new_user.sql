-- Run in Supabase SQL Editor if registration fails with "Database error creating new user".
-- Ensures new auth users get a profiles row with required columns (especially email).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
  IF v_role NOT IN ('admin', 'teacher', 'parent', 'kitchen', 'support') THEN
    v_role := 'parent';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), ''),
      'User'
    ),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
    full_name = COALESCE(
      NULLIF(EXCLUDED.full_name, ''),
      NULLIF(trim(public.profiles.full_name), ''),
      public.profiles.full_name
    ),
    role = CASE
      WHEN EXCLUDED.role IN ('admin', 'teacher', 'parent', 'kitchen', 'support')
      THEN EXCLUDED.role
      ELSE public.profiles.role
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
