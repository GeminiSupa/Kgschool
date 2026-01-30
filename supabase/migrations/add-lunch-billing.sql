-- Migration: Add Lunch Billing System Tables
-- This migration adds tables for lunch billing, absence tracking, and refunds

-- 1. Lunch Pricing Table
CREATE TABLE IF NOT EXISTS lunch_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  price_per_meal DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, effective_from)
);

-- 2. Billing Configuration Table
CREATE TABLE IF NOT EXISTS billing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Absence Notifications Table
CREATE TABLE IF NOT EXISTS absence_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notified_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deadline_met BOOLEAN NOT NULL DEFAULT FALSE,
  notification_method TEXT CHECK (notification_method IN ('app', 'email', 'phone')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, absence_date)
);

-- 4. Monthly Billing Table
CREATE TABLE IF NOT EXISTS monthly_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, month, year)
);

-- 5. Lunch Billing Items Table
CREATE TABLE IF NOT EXISTS lunch_billing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES monthly_billing(id) ON DELETE CASCADE,
  order_id UUID REFERENCES lunch_orders(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_price DECIMAL(10, 2) NOT NULL,
  is_informed_absence BOOLEAN NOT NULL DEFAULT FALSE,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  refund_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing tables
ALTER TABLE lunch_orders ADD COLUMN IF NOT EXISTS billing_item_id UUID REFERENCES lunch_billing_items(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS lunch_price_per_meal DECIMAL(10, 2);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lunch_pricing_group ON lunch_pricing(group_id);
CREATE INDEX IF NOT EXISTS idx_lunch_pricing_dates ON lunch_pricing(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_absence_notifications_child ON absence_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_absence_notifications_date ON absence_notifications(absence_date);
CREATE INDEX IF NOT EXISTS idx_monthly_billing_child ON monthly_billing(child_id);
CREATE INDEX IF NOT EXISTS idx_monthly_billing_month_year ON monthly_billing(year, month);
CREATE INDEX IF NOT EXISTS idx_lunch_billing_items_billing ON lunch_billing_items(billing_id);
CREATE INDEX IF NOT EXISTS idx_lunch_billing_items_date ON lunch_billing_items(date);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_billing_item ON lunch_orders(billing_item_id);

-- Enable RLS on all new tables
ALTER TABLE lunch_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_billing_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lunch_pricing
CREATE POLICY "Admins and kitchen can view pricing" ON lunch_pricing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage pricing" ON lunch_pricing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for billing_config
CREATE POLICY "Admins can view config" ON billing_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage config" ON billing_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for absence_notifications
CREATE POLICY "Parents can view their children's absence notifications" ON absence_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = absence_notifications.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Parents can create absence notifications" ON absence_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = absence_notifications.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) AND
    notified_by = auth.uid()
  );

CREATE POLICY "Admins can manage absence notifications" ON absence_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for monthly_billing
CREATE POLICY "Parents can view their children's bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = monthly_billing.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage billing" ON monthly_billing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for lunch_billing_items
CREATE POLICY "Parents can view their children's billing items" ON lunch_billing_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_billing mb
      JOIN children c ON c.id = mb.child_id
      WHERE mb.id = lunch_billing_items.billing_id
      AND auth.uid() = ANY(c.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage billing items" ON lunch_billing_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Helper Functions

-- Function to check if absence notification deadline was met
CREATE OR REPLACE FUNCTION check_informed_absence_deadline(
  p_absence_date DATE,
  p_notification_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deadline_hours INTEGER;
  v_deadline_time TIMESTAMP WITH TIME ZONE;
  v_absence_8am TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get configured deadline hours (default to 16 hours if not set)
  SELECT COALESCE(
    (SELECT value::INTEGER FROM billing_config WHERE key = 'informed_absence_deadline_hours'),
    16
  ) INTO v_deadline_hours;
  
  -- Calculate 8 AM on absence date
  v_absence_8am := (p_absence_date::TIMESTAMP WITH TIME ZONE) + INTERVAL '8 hours';
  
  -- Calculate deadline time (deadline_hours before 8 AM on absence date)
  v_deadline_time := v_absence_8am - (v_deadline_hours || ' hours')::INTERVAL;
  
  -- Check if notification was before deadline
  RETURN p_notification_time < v_deadline_time;
END;
$$;

-- Function to get current lunch price for a group
CREATE OR REPLACE FUNCTION get_group_lunch_price(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_price DECIMAL(10, 2);
BEGIN
  -- First check groups table for quick reference
  SELECT lunch_price_per_meal INTO v_price
  FROM groups
  WHERE id = p_group_id;
  
  -- If not set in groups table, check lunch_pricing table
  IF v_price IS NULL THEN
    SELECT price_per_meal INTO v_price
    FROM lunch_pricing
    WHERE group_id = p_group_id
      AND effective_from <= p_date
      AND (effective_to IS NULL OR effective_to >= p_date)
    ORDER BY effective_from DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_price, 0);
END;
$$;

-- Function to calculate monthly billing for a child
CREATE OR REPLACE FUNCTION calculate_monthly_billing(
  p_child_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE(
  billable_days INTEGER,
  refundable_days INTEGER,
  total_amount DECIMAL(10, 2),
  refund_amount DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id UUID;
  v_price_per_meal DECIMAL(10, 2);
  v_start_date DATE;
  v_end_date DATE;
  v_billable_count INTEGER := 0;
  v_refundable_count INTEGER := 0;
  v_current_date DATE;
  v_has_order BOOLEAN;
  v_has_informed_absence BOOLEAN;
  v_deadline_met BOOLEAN;
BEGIN
  -- Get child's group
  SELECT group_id INTO v_group_id
  FROM children
  WHERE id = p_child_id;
  
  IF v_group_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get price for the group
  v_price_per_meal := get_group_lunch_price(v_group_id);
  
  -- Calculate date range for the month
  v_start_date := DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1));
  v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
  
  -- Loop through each day in the month (excluding weekends)
  v_current_date := v_start_date;
  WHILE v_current_date <= v_end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
      -- Check if there's a lunch order for this date
      SELECT EXISTS(
        SELECT 1 FROM lunch_orders lo
        JOIN lunch_menus lm ON lm.id = lo.menu_id
        WHERE lo.child_id = p_child_id
          AND lm.date = v_current_date
          AND lo.status != 'cancelled'
      ) INTO v_has_order;
      
      -- Check if there's an informed absence
      SELECT EXISTS(
        SELECT 1 FROM absence_notifications an
        WHERE an.child_id = p_child_id
          AND an.absence_date = v_current_date
          AND an.deadline_met = TRUE
      ) INTO v_has_informed_absence;
      
      IF v_has_order THEN
        -- Has order, so billable
        v_billable_count := v_billable_count + 1;
      ELSIF v_has_informed_absence THEN
        -- Informed absence before deadline, refundable
        v_refundable_count := v_refundable_count + 1;
      ELSE
        -- Uninformed absence, still billable
        v_billable_count := v_billable_count + 1;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN QUERY SELECT
    v_billable_count,
    v_refundable_count,
    (v_billable_count * v_price_per_meal)::DECIMAL(10, 2),
    (v_refundable_count * v_price_per_meal)::DECIMAL(10, 2);
END;
$$;

-- Insert default billing config
INSERT INTO billing_config (key, value, description)
VALUES 
  ('informed_absence_deadline_hours', '16', 'Hours before 8 AM on absence date that parent must notify (default: 16 hours = day before by 4 PM)')
ON CONFLICT (key) DO NOTHING;

-- Add trigger to update updated_at for lunch_pricing
CREATE TRIGGER update_lunch_pricing_updated_at BEFORE UPDATE ON lunch_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update updated_at for monthly_billing
CREATE TRIGGER update_monthly_billing_updated_at BEFORE UPDATE ON monthly_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
