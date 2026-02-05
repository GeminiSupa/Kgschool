-- Migration: Add Academic Calendar for Holidays and Vacations
-- Only admins can manage holidays/vacations

-- Academic calendar table
CREATE TABLE IF NOT EXISTS academic_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  holiday_type TEXT NOT NULL CHECK (holiday_type IN ('holiday', 'vacation', 'closure', 'training', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('yearly', 'monthly', 'weekly')),
  affects_billing BOOLEAN DEFAULT TRUE, -- Whether this holiday affects billing
  affects_attendance BOOLEAN DEFAULT TRUE, -- Whether attendance should be tracked
  kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE, -- NULL means applies to all Kitas
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_academic_calendar_dates ON academic_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_kita ON academic_calendar(kita_id);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_type ON academic_calendar(holiday_type);

-- Function to check if a date is a holiday
CREATE OR REPLACE FUNCTION is_holiday(p_date DATE, p_kita_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM academic_calendar
  WHERE p_date >= start_date
    AND p_date <= end_date
    AND (kita_id IS NULL OR kita_id = p_kita_id);
  
  RETURN v_count > 0;
END;
$$;

-- Function to get all holidays in a date range
CREATE OR REPLACE FUNCTION get_holidays(p_start_date DATE, p_end_date DATE, p_kita_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  holiday_type TEXT,
  affects_billing BOOLEAN,
  affects_attendance BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.title,
    ac.description,
    ac.start_date,
    ac.end_date,
    ac.holiday_type,
    ac.affects_billing,
    ac.affects_attendance
  FROM academic_calendar ac
  WHERE ac.start_date <= p_end_date
    AND ac.end_date >= p_start_date
    AND (ac.kita_id IS NULL OR ac.kita_id = p_kita_id)
  ORDER BY ac.start_date;
END;
$$;

-- Enable RLS
ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage, everyone can view
CREATE POLICY "Admins can manage academic calendar" ON academic_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view academic calendar" ON academic_calendar
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_academic_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_academic_calendar_updated_at
  BEFORE UPDATE ON academic_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_calendar_updated_at();

-- Insert some common German holidays (example)
-- These can be managed via the admin UI
-- INSERT INTO academic_calendar (title, start_date, end_date, holiday_type, is_recurring, recurring_pattern, affects_billing, affects_attendance, created_by)
-- VALUES 
--   ('Weihnachtsferien', '2024-12-23', '2025-01-06', 'vacation', TRUE, 'yearly', TRUE, TRUE, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
--   ('Sommerferien', '2025-07-15', '2025-08-15', 'vacation', TRUE, 'yearly', TRUE, TRUE, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));
