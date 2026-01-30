-- Migration script to convert existing educator_id assignments to group_teachers table
-- This maintains backward compatibility while moving to the new many-to-many system

-- Step 1: Migrate existing groups.educator_id to group_teachers
INSERT INTO group_teachers (group_id, teacher_id, role, start_date, created_at, updated_at)
SELECT 
  id as group_id,
  educator_id as teacher_id,
  'primary' as role,
  COALESCE(created_at::date, CURRENT_DATE) as start_date,
  created_at,
  updated_at
FROM groups
WHERE educator_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates if migration runs multiple times
    SELECT 1 FROM group_teachers gt
    WHERE gt.group_id = groups.id
      AND gt.teacher_id = groups.educator_id
      AND gt.role = 'primary'
      AND gt.start_date = COALESCE(groups.created_at::date, CURRENT_DATE)
  );

-- Step 2: Update any staff_assignments that should be group assignments
-- This handles cases where individual child-teacher assignments should become group assignments
INSERT INTO group_teachers (group_id, teacher_id, role, start_date, created_at, updated_at)
SELECT DISTINCT
  c.group_id,
  sa.staff_id as teacher_id,
  CASE 
    WHEN sa.assignment_type = 'primary_teacher' THEN 'primary'
    WHEN sa.assignment_type = 'assistant_teacher' THEN 'assistant'
    ELSE 'support'
  END as role,
  COALESCE(sa.start_date, CURRENT_DATE) as start_date,
  sa.created_at,
  sa.updated_at
FROM staff_assignments sa
JOIN children c ON c.id = sa.child_id
WHERE c.group_id IS NOT NULL
  AND sa.assignment_type IN ('primary_teacher', 'assistant_teacher')
  AND (sa.end_date IS NULL OR sa.end_date >= CURRENT_DATE)
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM group_teachers gt
    WHERE gt.group_id = c.group_id
      AND gt.teacher_id = sa.staff_id
      AND gt.role = CASE 
        WHEN sa.assignment_type = 'primary_teacher' THEN 'primary'
        WHEN sa.assignment_type = 'assistant_teacher' THEN 'assistant'
        ELSE 'support'
      END
      AND gt.start_date = COALESCE(sa.start_date, CURRENT_DATE)
  );

-- Step 3: Ensure groups.educator_id matches the primary teacher in group_teachers
-- This maintains backward compatibility
UPDATE groups g
SET educator_id = (
  SELECT teacher_id
  FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY gt.start_date DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
)
AND (g.educator_id IS NULL OR g.educator_id != (
  SELECT teacher_id
  FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY gt.start_date DESC
  LIMIT 1
));

-- Step 4: Create a function to sync educator_id when group_teachers change
-- This will be called by triggers to keep educator_id in sync
CREATE OR REPLACE FUNCTION sync_group_educator_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Update groups.educator_id when primary teacher changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'primary' AND (NEW.end_date IS NULL OR NEW.end_date >= CURRENT_DATE) THEN
      UPDATE groups
      SET educator_id = NEW.teacher_id
      WHERE id = NEW.group_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'primary') THEN
    -- If primary teacher removed, set to another primary or null
    UPDATE groups
    SET educator_id = (
      SELECT teacher_id
      FROM group_teachers
      WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        AND role = 'primary'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND id != COALESCE(NEW.id, OLD.id)
      ORDER BY start_date DESC
      LIMIT 1
    )
    WHERE id = COALESCE(NEW.group_id, OLD.group_id)
      AND educator_id = COALESCE(OLD.teacher_id, NEW.teacher_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers to keep educator_id in sync
DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_insert ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_insert
  AFTER INSERT ON group_teachers
  FOR EACH ROW
  WHEN (NEW.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_update ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_update
  AFTER UPDATE ON group_teachers
  FOR EACH ROW
  WHEN (NEW.role = 'primary' OR OLD.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_delete ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_delete
  AFTER DELETE ON group_teachers
  FOR EACH ROW
  WHEN (OLD.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

-- Step 6: Verify migration
DO $$
DECLARE
  migrated_count INTEGER;
  groups_with_educator INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM group_teachers
  WHERE role = 'primary';

  SELECT COUNT(*) INTO groups_with_educator
  FROM groups
  WHERE educator_id IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Primary teacher assignments in group_teachers: %', migrated_count;
  RAISE NOTICE '  - Groups with educator_id: %', groups_with_educator;
END $$;
