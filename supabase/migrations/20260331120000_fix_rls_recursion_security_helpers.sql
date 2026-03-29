-- Fix PostgreSQL error 42P17: infinite recursion in policy for relation "profiles".
-- Cause: policies call is_admin() -> get_user_role() -> SELECT from profiles, which re-evaluates profiles RLS.
-- Same risk: user_belongs_to_kita() / get_user_kita_id() reading organization_members while org RLS calls those helpers.
-- Fix: SECURITY DEFINER + SET LOCAL row_security = off for the internal lookups (restored when the function returns).

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT u.raw_user_meta_data->>'role' INTO v_role
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_role IS NOT NULL AND btrim(v_role) <> '' THEN
    RETURN v_role;
  END IF;

  SET LOCAL row_security = off;
  SELECT p.role INTO v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_kita_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kita UUID;
BEGIN
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SET LOCAL row_security = off;
  SELECT om.kita_id INTO v_kita
  FROM public.organization_members om
  WHERE om.profile_id = user_id
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at NULLS LAST
  LIMIT 1;

  RETURN v_kita;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR target_kita_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.profile_id = user_id
      AND om.kita_id IS NOT NULL
      AND om.kita_id = target_kita_id
  );
END;
$$;
