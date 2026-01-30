-- Migration: Add teacher-specific filtering functions
-- This adds functions to help teachers see only their assigned groups' data

-- Function to check if current user is assigned as educator to a group
CREATE OR REPLACE FUNCTION is_educator_of_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_educator_id UUID;
BEGIN
  v_user_role := get_user_role();
  
  -- Admins can see all groups
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Teachers can only see their assigned groups
  IF v_user_role = 'teacher' THEN
    SELECT educator_id INTO v_educator_id
    FROM groups
    WHERE id = p_group_id;
    
    RETURN v_educator_id = auth.uid();
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to get all group IDs where current user is educator
CREATE OR REPLACE FUNCTION get_teacher_group_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_group_ids UUID[];
BEGIN
  v_user_role := get_user_role();
  
  -- Admins see all groups (return empty array means no filter)
  IF v_user_role = 'admin' THEN
    RETURN ARRAY[]::UUID[];
  END IF;
  
  -- Teachers see only their groups
  IF v_user_role = 'teacher' THEN
    SELECT ARRAY_AGG(id) INTO v_group_ids
    FROM groups
    WHERE educator_id = auth.uid();
    
    RETURN COALESCE(v_group_ids, ARRAY[]::UUID[]);
  END IF;
  
  RETURN ARRAY[]::UUID[];
END;
$$;

-- Update children policy to allow teachers to see children in their groups
DROP POLICY IF EXISTS "Teachers can view children in their groups" ON children;
CREATE POLICY "Teachers can view children in their groups" ON children
  FOR SELECT USING (
    auth.uid() = ANY(parent_ids) OR
    is_admin() OR
    (is_teacher() AND group_id IN (SELECT id FROM groups WHERE educator_id = auth.uid()))
  );

-- Update groups policy to allow teachers to view their assigned groups
DROP POLICY IF EXISTS "Teachers can view their assigned groups" ON groups;
CREATE POLICY "Teachers can view their assigned groups" ON groups
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR
      (is_teacher() AND educator_id = auth.uid())
    )
  );
