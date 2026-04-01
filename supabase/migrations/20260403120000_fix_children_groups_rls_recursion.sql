-- Fix 42P17 infinite recursion on public.children (and stabilize public.groups).
-- Cause: groups SELECT policy contained EXISTS (SELECT 1 FROM children ...), while
-- children policies referenced groups (e.g. teacher subquery). RLS re-entered children ↔ groups.
-- Fix: SECURITY DEFINER helpers with SET LOCAL row_security = off for internal reads, and
-- replace direct cross-table policy embeds with those helpers.

CREATE OR REPLACE FUNCTION public.parent_has_child_in_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RETURN FALSE;
  END IF;
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.children c
    WHERE c.group_id = p_group_id
      AND auth.uid() = ANY (c.parent_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.group_educator_is_me(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RETURN FALSE;
  END IF;
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = p_group_id
      AND g.educator_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.parent_has_child_in_group(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.group_educator_is_me(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.parent_has_child_in_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_educator_is_me(uuid) TO authenticated;

-- groups: stop embedding children scans that re-trigger children RLS
DROP POLICY IF EXISTS "Users view groups in their kita" ON public.groups;

CREATE POLICY "Users view groups in their kita" ON public.groups
  FOR SELECT USING (
    kita_id = public.get_user_kita_id()
    OR public.parent_has_child_in_group(id)
  );

-- children: drop overlapping policies from various migrations, then recreate without groups subquery
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Parents view own children" ON public.children;
DROP POLICY IF EXISTS "Staff can view kita children" ON public.children;
DROP POLICY IF EXISTS "Staff view kita children" ON public.children;
DROP POLICY IF EXISTS "Admins manage children in their kita" ON public.children;
DROP POLICY IF EXISTS "Teachers view children in their kita and groups" ON public.children;
DROP POLICY IF EXISTS "Teachers view assigned children" ON public.children;
DROP POLICY IF EXISTS "Support staff view children in their kita" ON public.children;
DROP POLICY IF EXISTS "Support staff can view all children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "children_select_staff" ON public.children;
DROP POLICY IF EXISTS "children_select_parents" ON public.children;
DROP POLICY IF EXISTS "children_select_teachers" ON public.children;
DROP POLICY IF EXISTS "children_select_support" ON public.children;
DROP POLICY IF EXISTS "children_admin_manage" ON public.children;

CREATE POLICY "children_select_staff" ON public.children
  FOR SELECT USING (
    kita_id IS NOT NULL
    AND kita_id = public.get_user_kita_id()
  );

CREATE POLICY "children_select_parents" ON public.children
  FOR SELECT USING (auth.uid() = ANY (parent_ids));

CREATE POLICY "children_select_teachers" ON public.children
  FOR SELECT USING (
    public.is_teacher()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
    AND public.group_educator_is_me(group_id)
  );

CREATE POLICY "children_select_support" ON public.children
  FOR SELECT USING (
    public.is_support()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

CREATE POLICY "children_admin_manage" ON public.children
  FOR ALL
  USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );
