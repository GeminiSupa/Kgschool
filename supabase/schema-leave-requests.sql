-- Migration: Add leave requests and absence submissions tables
-- This migration adds support for parent leave requests and teacher absence submissions

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'other')),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Absence submissions table
CREATE TABLE IF NOT EXISTS absence_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify attendance table to link to leave requests and absence submissions
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS leave_request_id UUID REFERENCES leave_requests(id),
  ADD COLUMN IF NOT EXISTS absence_submission_id UUID REFERENCES absence_submissions(id);

-- Modify lunch_orders table for German Kita billing model
ALTER TABLE lunch_orders
  ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deadline_passed BOOLEAN DEFAULT FALSE;

-- Update lunch_orders status check constraint to include 'cancelled'
ALTER TABLE lunch_orders DROP CONSTRAINT IF EXISTS lunch_orders_status_check;
ALTER TABLE lunch_orders 
  ADD CONSTRAINT lunch_orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'prepared', 'served', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_child ON leave_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_parent ON leave_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absence_submissions_attendance ON absence_submissions(attendance_id);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_auto_created ON lunch_orders(auto_created);
CREATE INDEX IF NOT EXISTS idx_attendance_leave_request ON attendance(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_attendance_absence_submission ON attendance(absence_submission_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_submissions ENABLE ROW LEVEL SECURITY;

-- Leave requests policies
CREATE POLICY "Parents can view their own leave requests" ON leave_requests
  FOR SELECT USING (
    auth.uid() = parent_id OR
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = leave_requests.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Parents can create leave requests for their children" ON leave_requests
  FOR INSERT WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = leave_requests.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Admins can update leave requests" ON leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Absence submissions policies
CREATE POLICY "Teachers and admins can view absence submissions" ON absence_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')) OR
    EXISTS (
      SELECT 1 FROM attendance 
      JOIN children ON children.id = attendance.child_id
      WHERE attendance.id = absence_submissions.attendance_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins can create absence submissions" ON absence_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Update lunch_orders policies to allow cancellation
CREATE POLICY "Parents can cancel their children's orders before deadline" ON lunch_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = lunch_orders.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Function to update updated_at timestamp for leave_requests
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
