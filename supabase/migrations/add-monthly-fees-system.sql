-- Fee Configuration table
CREATE TABLE IF NOT EXISTS fee_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'lunch', 'activities', 'other')),
  group_id UUID REFERENCES groups(id),
  amount DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Fees table
CREATE TABLE IF NOT EXISTS monthly_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'lunch', 'activities', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Payments table (for partial payments and payment history)
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_id UUID NOT NULL REFERENCES monthly_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_config_group_id ON fee_config(group_id);
CREATE INDEX IF NOT EXISTS idx_fee_config_dates ON fee_config(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_child_id ON monthly_fees(child_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_month_year ON monthly_fees(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_fee_id ON fee_payments(fee_id);

-- Enable RLS
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_config
-- Admins can manage all fee configs
CREATE POLICY "Admins can manage all fee configs" ON fee_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view fee configs (read-only)
CREATE POLICY "Parents can view fee configs" ON fee_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for monthly_fees
-- Admins can manage all fees
CREATE POLICY "Admins can manage all monthly fees" ON monthly_fees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view and pay their children's fees
CREATE POLICY "Parents can view their children's fees" ON monthly_fees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = monthly_fees.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Parents can update their children's fees" ON monthly_fees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = monthly_fees.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- RLS Policies for fee_payments
-- Admins can manage all payments
CREATE POLICY "Admins can manage all fee payments" ON fee_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view payments for their children's fees
CREATE POLICY "Parents can view their children's fee payments" ON fee_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_fees
      JOIN children ON children.id = monthly_fees.child_id
      WHERE monthly_fees.id = fee_payments.fee_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Parents can create payments for their children's fees
CREATE POLICY "Parents can create payments for their children's fees" ON fee_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM monthly_fees
      JOIN children ON children.id = monthly_fees.child_id
      WHERE monthly_fees.id = fee_payments.fee_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Triggers to update updated_at
CREATE TRIGGER update_fee_config_updated_at BEFORE UPDATE ON fee_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_fees_updated_at BEFORE UPDATE ON monthly_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current fee config for a group and fee type
CREATE OR REPLACE FUNCTION get_current_fee_config(p_group_id UUID, p_fee_type TEXT)
RETURNS TABLE (
  id UUID,
  amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.amount
  FROM fee_config fc
  WHERE fc.group_id = p_group_id
    AND fc.fee_type = p_fee_type
    AND fc.effective_from <= CURRENT_DATE
    AND (fc.effective_to IS NULL OR fc.effective_to >= CURRENT_DATE)
  ORDER BY fc.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
