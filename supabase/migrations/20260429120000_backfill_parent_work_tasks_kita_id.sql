-- Backfill missing kita_id values for existing parent_work_tasks rows.
-- Safe/idempotent: only updates rows where kita_id IS NULL.

-- 1) Best source: creator membership in organization_members.
UPDATE public.parent_work_tasks t
SET kita_id = om.kita_id
FROM (
  SELECT DISTINCT ON (profile_id)
    profile_id,
    kita_id
  FROM public.organization_members
  WHERE kita_id IS NOT NULL
  ORDER BY profile_id, created_at DESC
) om
WHERE t.kita_id IS NULL
  AND t.created_by = om.profile_id;

-- 2) Fallback: creator default_kita_id from profiles.
UPDATE public.parent_work_tasks t
SET kita_id = p.default_kita_id
FROM public.profiles p
WHERE t.kita_id IS NULL
  AND t.created_by = p.id
  AND p.default_kita_id IS NOT NULL;

-- 3) Final fallback: only if there is exactly one kita in the system.
DO $$
DECLARE
  v_only_kita_id uuid;
BEGIN
  SELECT id
  INTO v_only_kita_id
  FROM public.kitas
  LIMIT 1;

  IF v_only_kita_id IS NOT NULL AND (SELECT COUNT(*) FROM public.kitas) = 1 THEN
    UPDATE public.parent_work_tasks
    SET kita_id = v_only_kita_id
    WHERE kita_id IS NULL;
  END IF;
END $$;

