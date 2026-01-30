-- Staff Assignments table for many-to-many relationship between children and staff
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('primary_teacher', 'assistant_teacher', 'support_staff')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, staff_id, assignment_type, start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_assignments_child_id ON staff_assignments(child_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_type ON staff_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_dates ON staff_assignments(start_date, end_date);

-- Enable RLS
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all assignments
CREATE POLICY "Admins can manage all staff assignments" ON staff_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view assignments for their children
CREATE POLICY "Teachers can view assignments for their children" ON staff_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = staff_assignments.child_id
      AND EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = children.group_id
        AND groups.educator_id = auth.uid()
      )
    ) OR
    staff_assignments.staff_id = auth.uid()
  );

-- Support staff can view assignments
CREATE POLICY "Support staff can view assignments" ON staff_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view assignments for their children
CREATE POLICY "Parents can view assignments for their children" ON staff_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = staff_assignments.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_staff_assignments_updated_at BEFORE UPDATE ON staff_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
