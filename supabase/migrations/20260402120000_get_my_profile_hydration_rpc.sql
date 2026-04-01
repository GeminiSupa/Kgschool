-- Client hydration for auth: read own profiles row + organization_members without
-- triggering profiles RLS (avoids 42P17 when policies still recurse despite helper fixes).
-- SECURITY DEFINER runs as function owner; SET LOCAL row_security = off skips RLS for these reads.
-- Only returns rows for auth.uid() — safe to expose to authenticated role.

CREATE OR REPLACE FUNCTION public.get_my_profile_hydration()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof jsonb;
  om jsonb;
BEGIN
  SET LOCAL row_security = off;

  SELECT to_jsonb(p.*)
  INTO prof
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF prof IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('kita_id', om.kita_id)),
    '[]'::jsonb
  )
  INTO om
  FROM public.organization_members om
  WHERE om.profile_id = auth.uid();

  RETURN prof || jsonb_build_object('organization_members', COALESCE(om, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile_hydration() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile_hydration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_hydration() TO service_role;

COMMENT ON FUNCTION public.get_my_profile_hydration() IS
  'Returns profiles row + organization_members for auth.uid(); bypasses RLS for hydration only.';
