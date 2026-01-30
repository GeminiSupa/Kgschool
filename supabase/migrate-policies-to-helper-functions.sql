-- Migration: Update all RLS policies to use helper functions instead of recursive queries
-- This should be run after fix-profiles-rls-admin.sql
-- This prevents recursion and improves performance

-- Drop existing policies that query profiles table directly
DROP POLICY IF EXISTS "Parents can view their own children" ON children;
DROP POLICY IF EXISTS "Admins can manage all children" ON children;
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Kitchen staff and admins can manage menus" ON lunch_menus;
DROP POLICY IF EXISTS "Parents can view and manage their children's orders" ON lunch_orders;
DROP POLICY IF EXISTS "Parents can view their children's allergies" ON allergies;

-- Children policies (using helper functions)
CREATE POLICY "Parents can view their own children" ON children
  FOR SELECT USING (
    auth.uid() = ANY(parent_ids) OR
    is_admin_or_teacher()
  );

CREATE POLICY "Admins can manage all children" ON children
  FOR ALL USING (is_admin());

-- Groups policies
CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (is_admin());

-- Attendance policies
CREATE POLICY "Parents can view their children's attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = attendance.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    is_admin_or_teacher()
  );

CREATE POLICY "Teachers and admins can manage attendance" ON attendance
  FOR ALL USING (is_admin_or_teacher());

-- Lunch menus policies
CREATE POLICY "Kitchen staff and admins can manage menus" ON lunch_menus
  FOR ALL USING (is_admin_or_kitchen());

-- Lunch orders policies
CREATE POLICY "Parents can view and manage their children's orders" ON lunch_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = lunch_orders.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    is_admin_or_kitchen()
  );

-- Allergies policies
CREATE POLICY "Parents can view their children's allergies" ON allergies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = allergies.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    is_admin_or_teacher()
  );
