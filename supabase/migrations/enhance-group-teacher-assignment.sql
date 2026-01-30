-- Group Teachers junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS group_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'assistant', 'support')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, teacher_id, start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_teachers_group_id ON group_teachers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_teachers_teacher_id ON group_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_group_teachers_role ON group_teachers(role);
CREATE INDEX IF NOT EXISTS idx_group_teachers_dates ON group_teachers(start_date, end_date);

-- Enable RLS
ALTER TABLE group_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all group-teacher assignments
CREATE POLICY "Admins can manage all group-teacher assignments" ON group_teachers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view their own group assignments
CREATE POLICY "Teachers can view their own group assignments" ON group_teachers
  FOR SELECT USING (teacher_id = auth.uid());

-- Support staff can view group assignments
CREATE POLICY "Support staff can view group assignments" ON group_teachers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view group assignments for their children's groups
CREATE POLICY "Parents can view group assignments for their children's groups" ON group_teachers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.group_id = group_teachers.group_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_group_teachers_updated_at BEFORE UPDATE ON group_teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active teachers for a group
CREATE OR REPLACE FUNCTION get_active_group_teachers(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  teacher_id UUID,
  role TEXT,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.teacher_id,
    gt.role,
    p.full_name
  FROM group_teachers gt
  JOIN profiles p ON p.id = gt.teacher_id
  WHERE gt.group_id = p_group_id
    AND gt.start_date <= CURRENT_DATE
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY 
    CASE gt.role
      WHEN 'primary' THEN 1
      WHEN 'assistant' THEN 2
      WHEN 'support' THEN 3
    END,
    p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
