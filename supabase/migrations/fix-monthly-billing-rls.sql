-- Fix RLS policies for monthly_billing to ensure admins can update
-- This fixes potential recursion issues in the policy check

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can view their children's bills" ON monthly_billing;
DROP POLICY IF EXISTS "Admins can manage billing" ON monthly_billing;

-- Recreate with better structure to avoid recursion
CREATE POLICY "Parents can view their children's bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = monthly_billing.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Use a helper function approach to avoid recursion
CREATE POLICY "Admins can view all bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bills" ON monthly_billing
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert bills" ON monthly_billing
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete bills" ON monthly_billing
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
