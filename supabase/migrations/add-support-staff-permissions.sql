-- Update RLS policies to allow support staff to view children (read-only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Support staff can view all children" ON children;

-- Support staff can view all children (read-only)
CREATE POLICY "Support staff can view all children" ON children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Support staff can manage attendance
-- This is already covered by the existing "Teachers and admins can manage attendance" policy
-- But we'll add a specific one for support staff
DROP POLICY IF EXISTS "Support staff can manage attendance" ON attendance;

CREATE POLICY "Support staff can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Support staff can send messages
-- This is already covered by existing message policies, but ensure support can send to parents
-- The existing "Users can send messages" policy should work, but let's verify support can view profiles

-- Support staff can view basic child information (already covered by children view policy above)
