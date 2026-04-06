-- Migration: Add Parent Work (Eltern Arbeit) System
-- This migration adds tables for managing parent work tasks and payments

-- 1. Parent Work Tasks Table
CREATE TABLE IF NOT EXISTS parent_work_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('cleaning', 'cooking', 'maintenance', 'gardening', 'administration', 'other')),
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_hours DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES profiles(id),
  assigned_date DATE,
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extra columns (from add-german-kita-features; table must exist first)
ALTER TABLE parent_work_tasks ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'direct_payment' CHECK (payment_type IN ('direct_payment', 'fee_credit', 'voluntary'));
ALTER TABLE parent_work_tasks ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;

-- 2. Parent Work Submissions Table
CREATE TABLE IF NOT EXISTS parent_work_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES parent_work_tasks(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  hours_worked DECIMAL(5, 2) NOT NULL,
  work_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_amount DECIMAL(10, 2),
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link submissions to quota (parent_work_quota is created in add-german-kita-features, which runs before this migration)
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS quota_id UUID REFERENCES parent_work_quota(id) ON DELETE SET NULL;
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS fee_credit_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS fee_credit_amount DECIMAL(10, 2);

-- 3. Parent Work Payments Table
CREATE TABLE IF NOT EXISTS parent_work_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES parent_work_submissions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_status ON parent_work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_assigned_to ON parent_work_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_type ON parent_work_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_task ON parent_work_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_parent ON parent_work_submissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_status ON parent_work_submissions(status);
CREATE INDEX IF NOT EXISTS idx_parent_work_payments_submission ON parent_work_payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_payments_status ON parent_work_payments(status);

-- Enable RLS
ALTER TABLE parent_work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_work_tasks
-- Admins can manage all tasks
CREATE POLICY "Admins can manage all parent work tasks" ON parent_work_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view tasks assigned to them
CREATE POLICY "Parents can view assigned tasks" ON parent_work_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can update tasks assigned to them
CREATE POLICY "Parents can update assigned tasks" ON parent_work_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for parent_work_submissions
-- Admins can manage all submissions
CREATE POLICY "Admins can manage all parent work submissions" ON parent_work_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view and create their own submissions
CREATE POLICY "Parents can manage their own submissions" ON parent_work_submissions
  FOR ALL USING (
    parent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for parent_work_payments
-- Admins can manage all payments
CREATE POLICY "Admins can manage all parent work payments" ON parent_work_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view payments for their submissions
CREATE POLICY "Parents can view their payment records" ON parent_work_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_work_submissions 
      WHERE id = parent_work_payments.submission_id 
      AND parent_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create function to calculate payment amount
CREATE OR REPLACE FUNCTION calculate_parent_work_payment(
  p_task_id UUID,
  p_hours_worked DECIMAL
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_hourly_rate DECIMAL(10, 2);
BEGIN
  SELECT hourly_rate INTO v_hourly_rate
  FROM parent_work_tasks
  WHERE id = p_task_id;
  
  RETURN COALESCE(v_hourly_rate, 0) * p_hours_worked;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update payment amount when submission is created/updated
CREATE OR REPLACE FUNCTION update_parent_work_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_amount = calculate_parent_work_payment(NEW.task_id, NEW.hours_worked);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_amount
  BEFORE INSERT OR UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_work_payment_amount();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parent_work_tasks_updated_at
  BEFORE UPDATE ON parent_work_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_parent_work_submissions_updated_at
  BEFORE UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_parent_work_payments_updated_at
  BEFORE UPDATE ON parent_work_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update parent_work_quota when a submission is approved (from add-german-kita-features)
CREATE OR REPLACE FUNCTION update_parent_work_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.quota_id IS NOT NULL THEN
    UPDATE parent_work_quota
    SET completed_hours = completed_hours + NEW.hours_worked
    WHERE id = NEW.quota_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_parent_work_quota ON parent_work_submissions;
CREATE TRIGGER trigger_update_parent_work_quota
  AFTER UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_work_quota();
