-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Teacher Leave Requests table
CREATE TABLE IF NOT EXISTS teacher_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'other')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_teacher_id ON teacher_leave_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_status ON teacher_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_dates ON teacher_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_reviewed_by ON teacher_leave_requests(reviewed_by);

-- Enable RLS
ALTER TABLE teacher_leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Teachers can view their own leave requests
CREATE POLICY "Teachers can view their own leave requests" ON teacher_leave_requests
  FOR SELECT USING (teacher_id = auth.uid());

-- Teachers can create their own leave requests
CREATE POLICY "Teachers can create their own leave requests" ON teacher_leave_requests
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own pending leave requests
CREATE POLICY "Teachers can update their own pending requests" ON teacher_leave_requests
  FOR UPDATE USING (
    teacher_id = auth.uid() AND status = 'pending'
  );

-- Admins can view all leave requests
CREATE POLICY "Admins can view all teacher leave requests" ON teacher_leave_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all leave requests
CREATE POLICY "Admins can update all teacher leave requests" ON teacher_leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger to update updated_at
CREATE TRIGGER update_teacher_leave_requests_updated_at BEFORE UPDATE ON teacher_leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
