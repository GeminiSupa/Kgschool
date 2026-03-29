-- =========================================================================
-- FIX: INFINITE RECURSION IN RLS POLICIES (PROFILES, CHILDREN, GROUPS, ORG MEMBERS)
-- =========================================================================

-- 1. Create SECURITY DEFINER helpers (idempotent)
-- These functions bypass RLS to prevent recursion loops.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT 
    COALESCE(
      (SELECT (u.raw_user_meta_data->>'role') = 'admin' FROM auth.users u WHERE u.id = auth.uid()),
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT 
    COALESCE(
      (SELECT (u.raw_user_meta_data->>'role') = 'teacher' FROM auth.users u WHERE u.id = auth.uid()),
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT 
    COALESCE(
      (SELECT (u.raw_user_meta_data->>'role') IN ('admin', 'teacher') FROM auth.users u WHERE u.id = auth.uid()),
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );
$$;

CREATE OR REPLACE FUNCTION public.is_kitchen()
RETURNS BOOLEAN 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT 
    COALESCE(
      (SELECT (u.raw_user_meta_data->>'role') = 'kitchen' FROM auth.users u WHERE u.id = auth.uid()),
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'kitchen')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS BOOLEAN 
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT 
    COALESCE(
      (SELECT (u.raw_user_meta_data->>'role') = 'support' FROM auth.users u WHERE u.id = auth.uid()),
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'support')
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_kita_id(user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT om.kita_id
  FROM public.organization_members om
  WHERE om.profile_id = user_id
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at NULLS LAST
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.profile_id = user_id AND om.kita_id = target_kita_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_educator_of_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND educator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children
    WHERE group_id = p_group_id AND auth.uid() = ANY (parent_ids)
  );
$$;

-- 2. Update PROFILES Policies (Breaking the recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" 
ON public.profiles FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin()); 

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid()); 

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" 
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Update ORGANIZATION_MEMBERS Policies
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view members of their kita" ON public.organization_members;
CREATE POLICY "Users view members of their kita" 
ON public.organization_members FOR SELECT 
USING (
  public.user_belongs_to_kita(auth.uid(), kita_id)
  OR profile_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins manage organization_members" ON public.organization_members;
CREATE POLICY "Admins manage organization_members" 
ON public.organization_members FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Update CHILDREN Policies
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage children in their kita" ON public.children;
CREATE POLICY "Admins manage children in their kita" ON public.children
FOR ALL
USING (
  public.is_admin() 
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
)
WITH CHECK (
  public.is_admin() 
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
);

DROP POLICY IF EXISTS "Teachers view assigned children" ON public.children;
DROP POLICY IF EXISTS "Teachers view children in their kita and groups" ON public.children;
CREATE POLICY "Teachers view children in their kita and groups" ON public.children
FOR SELECT
USING (
  (public.is_teacher() AND public.is_educator_of_group(group_id))
  OR (auth.uid() = ANY (parent_ids))
);

-- 5. Update GROUPS Policies
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage groups in their kita" ON public.groups;
CREATE POLICY "Admins manage groups in their kita" ON public.groups
FOR ALL
USING (
  public.is_admin()
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
)
WITH CHECK (
  public.is_admin()
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
);

DROP POLICY IF EXISTS "Users view authorized groups" ON public.groups;
CREATE POLICY "Users view authorized groups" ON public.groups
FOR SELECT
USING (
  (kita_id IS NOT NULL AND public.user_belongs_to_kita(auth.uid(), kita_id))
  OR (public.is_teacher() AND educator_id = auth.uid())
  OR public.is_parent_of_group(id)
);

-- 6. Update LUNCH Policies
-- Ensure kita_id exists on lunch_menus and lunch_orders
ALTER TABLE public.lunch_menus ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES public.kitas(id) ON DELETE CASCADE;
ALTER TABLE public.lunch_orders ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES public.kitas(id) ON DELETE CASCADE;

-- Fix unique constraint for multi-tenancy (date only -> date, kita_id)
ALTER TABLE public.lunch_menus DROP CONSTRAINT IF EXISTS lunch_menus_date_key;
ALTER TABLE public.lunch_menus DROP CONSTRAINT IF EXISTS lunch_menus_date_kita_id_key;
ALTER TABLE public.lunch_menus ADD CONSTRAINT lunch_menus_date_kita_id_key UNIQUE (date, kita_id);

ALTER TABLE public.lunch_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kitchen staff and admins can manage menus" ON public.lunch_menus;
DROP POLICY IF EXISTS "Admins and kitchen manage lunch_menus" ON public.lunch_menus;
CREATE POLICY "Admins and kitchen manage lunch_menus" ON public.lunch_menus
FOR ALL USING (
  (public.is_admin() OR public.is_kitchen())
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
)
WITH CHECK (
  (public.is_admin() OR public.is_kitchen())
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
);

DROP POLICY IF EXISTS "Authenticated users can view menus" ON public.lunch_menus;
DROP POLICY IF EXISTS "Users view authorized lunch_menus" ON public.lunch_menus;
CREATE POLICY "Users view authorized lunch_menus" ON public.lunch_menus
FOR SELECT USING (
  (kita_id IS NOT NULL AND public.user_belongs_to_kita(auth.uid(), kita_id))
  OR public.is_admin() OR public.is_kitchen()
);

DROP POLICY IF EXISTS "Parents can view and manage their children's orders" ON public.lunch_orders;
DROP POLICY IF EXISTS "Admins and kitchen manage lunch_orders" ON public.lunch_orders;
CREATE POLICY "Admins and kitchen manage lunch_orders" ON public.lunch_orders
FOR ALL USING (
  (public.is_admin() OR public.is_kitchen())
  AND (kita_id IS NULL OR public.user_belongs_to_kita(auth.uid(), kita_id))
);

-- 7. Update ATTENDANCE Policies
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins and teachers manage attendance" ON public.attendance;
CREATE POLICY "Admins and teachers manage attendance" ON public.attendance
FOR ALL USING (
  public.is_admin_or_teacher()
  -- Connect to kita via child_id
  AND EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = attendance.child_id
    AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
  )
)
WITH CHECK (
  public.is_admin_or_teacher()
  AND EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = attendance.child_id
    AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
  )
);

-- 8. Update OBSERVATIONS Policies
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and teachers manage observations" ON public.observations;
DROP POLICY IF EXISTS "Teachers and admins can manage observations" ON public.observations;
CREATE POLICY "Admins and teachers manage observations" ON public.observations
FOR ALL USING (
  public.is_admin_or_teacher()
  AND EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = observations.child_id
    AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
  )
);

-- 9. Update DAILY_REPORTS Policies
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and teachers manage daily_reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON public.daily_reports;
CREATE POLICY "Admins and teachers manage daily_reports" ON public.daily_reports
FOR ALL USING (
  public.is_admin_or_teacher()
  AND EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = daily_reports.group_id
    AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
  )
);

-- =========================================================================
-- How it works:
-- By using SECURITY DEFINER, the subquery inside the function is executed
-- with the permissions of the function owner (usually the postgres superuser),
-- bypassing RLS for that specific subquery. This breaks the recursion chain:
-- children -> group policy (via subquery) -> children policy (via subquery) ...
-- =========================================================================
