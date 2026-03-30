-- Cleanup and Fix Multi-tenancy RLS
-- This script ensures all tables are strictly isolated by kita_id or ownership.

-- 1. Ensure helper functions are robust and in public schema
CREATE OR REPLACE FUNCTION public.get_user_kita_id()
RETURNS UUID AS $$
  SELECT kita_id FROM public.organization_members 
  WHERE profile_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. GROUPS TABLE FIX
-- Drop the broad authenticated policy that causes leaks
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users view groups by kita or assignment" ON public.groups;

CREATE POLICY "Users view groups in their kita" ON public.groups
  FOR SELECT USING (
    kita_id = public.get_user_kita_id()
    OR EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.group_id = groups.id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 3. PROFILES TABLE FIX
-- Ensure admins can only see profiles in their own kita
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view profiles in their kita" ON public.profiles;

CREATE POLICY "Admins view profiles in their kita" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.profile_id = profiles.id 
      AND om.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE auth.uid() = ANY(c.parent_ids) AND profiles.id = ANY(c.parent_ids)
    )
  );

-- 4. CHILDREN TABLE FIX
DROP POLICY IF EXISTS "Staff can view kita children" ON public.children;
DROP POLICY IF EXISTS "Admins manage children in their kita" ON public.children;

CREATE POLICY "Staff view kita children" ON public.children
  FOR SELECT USING (kita_id = public.get_user_kita_id());

CREATE POLICY "Parents view own children" ON public.children
  FOR SELECT USING (auth.uid() = ANY(parent_ids));

-- 5. DAILY REPORTS FIX
DROP POLICY IF EXISTS "Parents can view daily reports for their children's groups" ON public.daily_reports;
DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON public.daily_reports;

CREATE POLICY "Strict daily reports isolation" ON public.daily_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = daily_reports.group_id AND g.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.group_id = daily_reports.group_id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 6. ATTENDANCE FIX
DROP POLICY IF EXISTS "Staff can view kita attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;

CREATE POLICY "Strict attendance isolation" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = attendance.child_id AND c.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = attendance.child_id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 7. Ensure kt@kg.com is correctly setup (Example/Seed fix)
-- This ensures the user has a kita_id if they are staff
DO $$
DECLARE
  target_user_id UUID;
  first_kita_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'kt@kg.com';
  SELECT id INTO first_kita_id FROM public.kitas LIMIT 1;
  
  IF target_user_id IS NOT NULL AND first_kita_id IS NOT NULL THEN
    INSERT INTO public.organization_members (profile_id, kita_id, org_role, organization_id)
    SELECT target_user_id, first_kita_id, 'staff', organization_id
    FROM public.kitas WHERE id = first_kita_id
    ON CONFLICT DO NOTHING;
    
    UPDATE public.profiles SET default_kita_id = first_kita_id WHERE id = target_user_id AND default_kita_id IS NULL;
  END IF;
END $$;
