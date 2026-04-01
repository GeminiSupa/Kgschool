-- Fix PostgreSQL 42P17: infinite recursion in policy for relation "profiles".
-- Cause: is_admin(), is_teacher(), etc. read public.profiles while RLS is already
-- evaluating policies on profiles — each EXISTS re-enters profiles RLS.
-- Fix: same pattern as 20260331120000_fix_rls_recursion_security_helpers.sql:
-- SECURITY DEFINER + SET LOCAL row_security = off around internal reads.
--
-- Also replace get_user_kita_id() (no-arg) so it does not hit organization_members
-- RLS in a way that can chain back into profiles (defensive).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'admin' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'teacher' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'teacher'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') IN ('admin', 'teacher') INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_kitchen()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'kitchen' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'kitchen'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'support' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'support'
  );
END;
$$;

-- Zero-arg overload used by 20260331_fix_multi_tenancy_rls.sql policies on groups, children, profiles, etc.
CREATE OR REPLACE FUNCTION public.get_user_kita_id()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kita uuid;
BEGIN
  SET LOCAL row_security = off;
  SELECT om.kita_id
  INTO v_kita
  FROM public.organization_members om
  WHERE om.profile_id = auth.uid()
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at DESC NULLS LAST
  LIMIT 1;

  RETURN v_kita;
END;
$$;
