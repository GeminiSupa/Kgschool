-- Billing Audit Log table to track all billing adjustments
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES monthly_billing(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES profiles(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('amount', 'status', 'payment', 'refund')),
  previous_total_amount NUMERIC(10, 2),
  new_total_amount NUMERIC(10, 2),
  previous_paid_amount NUMERIC(10, 2),
  new_paid_amount NUMERIC(10, 2),
  previous_refund_amount NUMERIC(10, 2),
  new_refund_amount NUMERIC(10, 2),
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_billing_id ON billing_audit_log(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_adjusted_by ON billing_audit_log(adjusted_by);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created_at ON billing_audit_log(created_at);

-- Enable RLS
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all audit logs
CREATE POLICY "Admins can view all billing audit logs" ON billing_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view audit logs for their children's bills
CREATE POLICY "Parents can view audit logs for their children's bills" ON billing_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_billing mb
      JOIN children c ON c.id = mb.child_id
      WHERE mb.id = billing_audit_log.billing_id
      AND auth.uid() = ANY(c.parent_ids)
    )
  );
