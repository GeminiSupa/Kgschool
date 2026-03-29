-- Every authenticated user must be able to SELECT their own profiles row (hydration after login).
-- Without this, RLS can block fetchProfile when admin/tenant policies do not match yet.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
