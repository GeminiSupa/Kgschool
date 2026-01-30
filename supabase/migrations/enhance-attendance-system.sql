-- Add new columns to attendance table
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS check_in_method TEXT CHECK (check_in_method IN ('manual', 'bulk', 'check_in_out'));

-- Create attendance_logs table for audit trail
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('check_in', 'check_out', 'status_change', 'created', 'updated')),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by ON attendance(recorded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_attendance_id ON attendance_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_performed_by ON attendance_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp);

-- Enable RLS on attendance_logs
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_logs
-- Admins can view all logs
CREATE POLICY "Admins can view all attendance logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view logs for their children
CREATE POLICY "Teachers can view logs for their children" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance
      JOIN children ON children.id = attendance.child_id
      JOIN groups ON groups.id = children.group_id
      WHERE attendance.id = attendance_logs.attendance_id
      AND groups.educator_id = auth.uid()
    )
  );

-- Support staff can view logs
CREATE POLICY "Support staff can view logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view logs for their children
CREATE POLICY "Parents can view logs for their children" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance
      JOIN children ON children.id = attendance.child_id
      WHERE attendance.id = attendance_logs.attendance_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Function to log attendance changes
CREATE OR REPLACE FUNCTION log_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO attendance_logs (
    attendance_id,
    action,
    performed_by,
    old_value,
    new_value
  ) VALUES (
    NEW.id,
    CASE
      WHEN OLD.id IS NULL THEN 'created'
      WHEN OLD.status != NEW.status THEN 'status_change'
      WHEN OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN 'check_in'
      WHEN OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN 'check_out'
      ELSE 'updated'
    END,
    COALESCE(NEW.recorded_by, auth.uid()),
    CASE
      WHEN OLD.id IS NULL THEN NULL
      WHEN OLD.status != NEW.status THEN OLD.status
      ELSE NULL
    END,
    CASE
      WHEN OLD.id IS NULL THEN NEW.status
      WHEN OLD.status != NEW.status THEN NEW.status
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log attendance changes
DROP TRIGGER IF EXISTS attendance_change_log ON attendance;
CREATE TRIGGER attendance_change_log
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION log_attendance_change();
