-- Tenant isolation: admins/staff only see data for Kitas they belong to (organization_members).
-- Run via Supabase migrations or paste into SQL Editor.
-- Prereqs: organization_members, kitas, user_belongs_to_kita(), get_user_kita_id(), is_admin(), is_teacher(), is_admin_or_teacher(), is_admin_or_kitchen(), is_support or role checks

-- Ensure helpers exist (idempotent if already applied from add-german-kita-features)
CREATE OR REPLACE FUNCTION public.get_user_kita_id(user_id UUID)
RETURNS UUID AS $$
  SELECT om.kita_id
  FROM public.organization_members om
  WHERE om.profile_id = user_id
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at NULLS LAST
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.profile_id = user_id
      AND om.kita_id IS NOT NULL
      AND om.kita_id = target_kita_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;

CREATE POLICY "Org members can view their organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  );

CREATE POLICY "Kita admins can manage their organization" ON public.organizations
  FOR ALL USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  );

-- ---------------------------------------------------------------------------
-- kitas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view kitas they belong to" ON public.kitas;
DROP POLICY IF EXISTS "Users can manage kitas they belong to" ON public.kitas;

CREATE POLICY "Users can view kitas they belong to" ON public.kitas
  FOR SELECT USING (public.user_belongs_to_kita(auth.uid(), id));

CREATE POLICY "Users can manage kitas they belong to" ON public.kitas
  FOR ALL USING (public.user_belongs_to_kita(auth.uid(), id))
  WITH CHECK (public.user_belongs_to_kita(auth.uid(), id));

-- ---------------------------------------------------------------------------
-- organization_members (remove global admin bypass)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view members of their kita" ON public.organization_members;

CREATE POLICY "Users can view members of their kita" ON public.organization_members
  FOR SELECT USING (
    public.user_belongs_to_kita(auth.uid(), kita_id)
    OR profile_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "Teachers can view children in their groups" ON public.children;
DROP POLICY IF EXISTS "Support staff can view all children" ON public.children;

CREATE POLICY "Parents can view their own children" ON public.children
  FOR SELECT USING (auth.uid() = ANY (parent_ids));

CREATE POLICY "Admins manage children in their kita" ON public.children
  FOR ALL USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

CREATE POLICY "Teachers view children in their kita and groups" ON public.children
  FOR SELECT USING (
    public.is_teacher()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
    AND group_id IN (SELECT g.id FROM public.groups g WHERE g.educator_id = auth.uid())
  );

CREATE POLICY "Support staff view children in their kita" ON public.children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Teachers can view their assigned groups" ON public.groups;

CREATE POLICY "Users view groups by kita or assignment" ON public.groups
  FOR SELECT USING (
    (
      kita_id IS NOT NULL
      AND public.user_belongs_to_kita(auth.uid(), kita_id)
    )
    OR (
      public.is_teacher()
      AND educator_id = auth.uid()
      AND (
        kita_id IS NULL
        OR public.user_belongs_to_kita(auth.uid(), kita_id)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = groups.id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Admins manage groups in their kita" ON public.groups
  FOR ALL USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

-- ---------------------------------------------------------------------------
-- profiles (admin no longer global)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins view profiles in their kita" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
    AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.profile_id = profiles.id
          AND public.user_belongs_to_kita(auth.uid(), om.kita_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.child_guardians cg
        INNER JOIN public.children c ON c.id = cg.child_id
        WHERE cg.guardian_id = profiles.id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
      OR (
        profiles.default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), profiles.default_kita_id)
      )
    )
  );

CREATE POLICY "Admins manage profiles in their kita" ON public.profiles
  FOR ALL USING (
    public.is_admin()
    AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.profile_id = profiles.id
          AND public.user_belongs_to_kita(auth.uid(), om.kita_id)
      )
      OR (
        profiles.default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), profiles.default_kita_id)
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    AND (
      id = auth.uid()
      OR (
        default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), default_kita_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Support staff can manage attendance" ON public.attendance;

CREATE POLICY "Parents can view their children's attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins manage attendance in their kita" ON public.attendance
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

CREATE POLICY "Support staff manage attendance in their kita" ON public.attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

-- ---------------------------------------------------------------------------
-- leave_requests & absence_submissions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins can update leave requests" ON public.leave_requests;

CREATE POLICY "Parents can view their own leave requests" ON public.leave_requests
  FOR SELECT USING (
    auth.uid() = parent_id
    OR EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = leave_requests.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = leave_requests.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Admins update leave requests in their kita" ON public.leave_requests
  FOR UPDATE USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = leave_requests.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Teachers and admins can view absence submissions" ON public.absence_submissions;
DROP POLICY IF EXISTS "Teachers and admins can create absence submissions" ON public.absence_submissions;

CREATE POLICY "Teachers and admins view absence submissions in their kita" ON public.absence_submissions
  FOR SELECT USING (
    (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.attendance a
        INNER JOIN public.children c ON c.id = a.child_id
        WHERE a.id = absence_submissions.attendance_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.attendance a
      INNER JOIN public.children c ON c.id = a.child_id
      WHERE a.id = absence_submissions.attendance_id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins create absence submissions in their kita" ON public.absence_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by
    AND public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.attendance a
      INNER JOIN public.children c ON c.id = a.child_id
      WHERE a.id = absence_submissions.attendance_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Kita feature tables (observations, reports, themes, etc.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view observations for their children" ON public.observations;
DROP POLICY IF EXISTS "Teachers and admins can create observations" ON public.observations;
DROP POLICY IF EXISTS "Teachers and admins can update observations" ON public.observations;

CREATE POLICY "Parents can view observations for their children" ON public.observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = observations.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins create observations in their kita" ON public.observations
  FOR INSERT WITH CHECK (
    auth.uid() = observer_id
    AND public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

CREATE POLICY "Teachers and admins update observations in their kita" ON public.observations
  FOR UPDATE USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view daily reports for their children's groups" ON public.daily_reports;
DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON public.daily_reports;

CREATE POLICY "Parents can view daily reports for their children's groups" ON public.daily_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = daily_reports.group_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = daily_reports.group_id
          AND g.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage daily reports in their kita" ON public.daily_reports
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_reports.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_reports.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view development docs for their children" ON public.development_docs;
DROP POLICY IF EXISTS "Teachers and admins can manage development docs" ON public.development_docs;

CREATE POLICY "Parents can view development docs for their children" ON public.development_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = development_docs.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage development docs in their kita" ON public.development_docs
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view portfolios for their children" ON public.portfolios;
DROP POLICY IF EXISTS "Teachers and admins can manage portfolios" ON public.portfolios;

CREATE POLICY "Parents can view portfolios for their children" ON public.portfolios
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = portfolios.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage portfolios in their kita" ON public.portfolios
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view daily routines" ON public.daily_routines;
DROP POLICY IF EXISTS "Teachers and admins can manage daily routines" ON public.daily_routines;

CREATE POLICY "Users view daily routines for their group context" ON public.daily_routines
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND (
          (
            g.kita_id IS NOT NULL
            AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
          )
          OR EXISTS (
            SELECT 1
            FROM public.children c
            WHERE c.group_id = g.id
              AND auth.uid() = ANY (c.parent_ids)
          )
        )
    )
  );

CREATE POLICY "Teachers and admins manage daily routines in their kita" ON public.daily_routines
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view learning themes for their children's groups" ON public.learning_themes;
DROP POLICY IF EXISTS "Teachers and admins can manage learning themes" ON public.learning_themes;

CREATE POLICY "Parents can view learning themes for their children's groups" ON public.learning_themes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = learning_themes.group_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = learning_themes.group_id
          AND g.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage learning themes in their kita" ON public.learning_themes
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = learning_themes.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = learning_themes.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view nap records for their children" ON public.nap_records;
DROP POLICY IF EXISTS "Teachers and admins can manage nap records" ON public.nap_records;

CREATE POLICY "Parents can view nap records for their children" ON public.nap_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = nap_records.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage nap records in their kita" ON public.nap_records
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );
