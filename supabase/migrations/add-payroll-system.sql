-- Staff Salary Configuration table
CREATE TABLE IF NOT EXISTS staff_salary_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_salary DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, effective_from)
);

-- Staff Payroll table
CREATE TABLE IF NOT EXISTS staff_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2),
  overtime_amount DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  net_salary DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, month, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salary_config_staff_id ON staff_salary_config(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_config_dates ON staff_salary_config(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_staff_id ON staff_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_month_year ON staff_payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_status ON staff_payroll(status);

-- Enable RLS
ALTER TABLE staff_salary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_salary_config
-- Admins can manage all salary configs
CREATE POLICY "Admins can manage all salary configs" ON staff_salary_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff can view their own salary configs
CREATE POLICY "Staff can view their own salary configs" ON staff_salary_config
  FOR SELECT USING (staff_id = auth.uid());

-- RLS Policies for staff_payroll
-- Admins can manage all payroll
CREATE POLICY "Admins can manage all payroll" ON staff_payroll
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff can view their own payroll
CREATE POLICY "Staff can view their own payroll" ON staff_payroll
  FOR SELECT USING (staff_id = auth.uid());

-- Triggers to update updated_at
CREATE TRIGGER update_staff_salary_config_updated_at BEFORE UPDATE ON staff_salary_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_payroll_updated_at BEFORE UPDATE ON staff_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current salary config for a staff member
CREATE OR REPLACE FUNCTION get_current_salary_config(p_staff_id UUID)
RETURNS TABLE (
  id UUID,
  staff_id UUID,
  base_salary DECIMAL,
  hourly_rate DECIMAL,
  overtime_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.staff_id,
    sc.base_salary,
    sc.hourly_rate,
    sc.overtime_multiplier
  FROM staff_salary_config sc
  WHERE sc.staff_id = p_staff_id
    AND sc.effective_from <= CURRENT_DATE
    AND (sc.effective_to IS NULL OR sc.effective_to >= CURRENT_DATE)
  ORDER BY sc.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
