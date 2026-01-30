-- Migration: Add Billing Timetable Configuration
-- Allows admins to configure which days of the week are billable

-- Add billing_timetable table
CREATE TABLE IF NOT EXISTS billing_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  monday BOOLEAN NOT NULL DEFAULT TRUE,
  tuesday BOOLEAN NOT NULL DEFAULT TRUE,
  wednesday BOOLEAN NOT NULL DEFAULT TRUE,
  thursday BOOLEAN NOT NULL DEFAULT TRUE,
  friday BOOLEAN NOT NULL DEFAULT TRUE,
  saturday BOOLEAN NOT NULL DEFAULT FALSE,
  sunday BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, effective_from)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_billing_timetable_group ON billing_timetable(group_id);
CREATE INDEX IF NOT EXISTS idx_billing_timetable_dates ON billing_timetable(effective_from, effective_to);

-- Enable RLS
ALTER TABLE billing_timetable ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage billing timetable" ON billing_timetable
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view billing timetable" ON billing_timetable
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to get billable days for a group on a specific date
CREATE OR REPLACE FUNCTION get_billable_days(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_timetable RECORD;
  v_days INTEGER[] := ARRAY[]::INTEGER[];
  v_day_of_week INTEGER;
BEGIN
  -- Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get timetable for the group
  SELECT * INTO v_timetable
  FROM billing_timetable
  WHERE group_id = p_group_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- If no timetable found, use default (Mon-Fri)
  IF v_timetable IS NULL THEN
    RETURN ARRAY[1, 2, 3, 4, 5]; -- Monday to Friday
  END IF;
  
  -- Build array of billable days based on timetable
  -- Convert to PostgreSQL day format: 0=Sunday, 1=Monday, ..., 6=Saturday
  IF v_timetable.monday THEN
    v_days := array_append(v_days, 1);
  END IF;
  IF v_timetable.tuesday THEN
    v_days := array_append(v_days, 2);
  END IF;
  IF v_timetable.wednesday THEN
    v_days := array_append(v_days, 3);
  END IF;
  IF v_timetable.thursday THEN
    v_days := array_append(v_days, 4);
  END IF;
  IF v_timetable.friday THEN
    v_days := array_append(v_days, 5);
  END IF;
  IF v_timetable.saturday THEN
    v_days := array_append(v_days, 6);
  END IF;
  IF v_timetable.sunday THEN
    v_days := array_append(v_days, 0);
  END IF;
  
  RETURN v_days;
END;
$$;

-- Function to check if a date is billable for a group
CREATE OR REPLACE FUNCTION is_billable_day(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_billable_days INTEGER[];
  v_day_of_week INTEGER;
BEGIN
  v_billable_days := get_billable_days(p_group_id, p_date);
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  RETURN v_day_of_week = ANY(v_billable_days);
END;
$$;

-- Add trigger to update updated_at
CREATE TRIGGER update_billing_timetable_updated_at BEFORE UPDATE ON billing_timetable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
