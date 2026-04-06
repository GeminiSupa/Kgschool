-- Migration: Add German Kita Features
-- This migration adds multi-tenant architecture, contracts, waitlist, DSGVO compliance, and German-specific features

-- ============================================================================
-- 1. MULTI-TENANT ARCHITECTURE (Organizations & Kitas)
-- ============================================================================

-- Organizations table (Träger)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address JSONB,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitas table (locations)
CREATE TABLE IF NOT EXISTS kitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB,
  phone TEXT,
  email TEXT,
  capacity_total INTEGER,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members (who belongs to which organization/kita)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('super_admin', 'admin', 'manager', 'staff', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, profile_id),
  UNIQUE(kita_id, profile_id)
);

-- Add organization_id and kita_id to existing tables
ALTER TABLE groups ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_kita_id UUID REFERENCES kitas(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CONTRACTS & BETREUUNGSUMFANG
-- ============================================================================

-- Child contracts table
CREATE TABLE IF NOT EXISTS child_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  betreuung_hours_type TEXT NOT NULL CHECK (betreuung_hours_type IN ('25', '35', '45', 'ganztag', 'halbtag')),
  fee_category TEXT NOT NULL CHECK (fee_category IN ('standard', 'reduced', 'waived', 'subsidized')),
  lunch_obligation BOOLEAN DEFAULT TRUE,
  lunch_billing_type TEXT NOT NULL DEFAULT 'per_meal' CHECK (lunch_billing_type IN ('flat_monthly', 'per_meal', 'hybrid')),
  lunch_flat_rate_amount DECIMAL(10, 2),
  subsidy_type TEXT CHECK (subsidy_type IN ('BuT', 'BremenPass', 'Geschwisterrabatt', 'Landeszuschuss', 'other')),
  subsidy_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, start_date)
);

-- ============================================================================
-- 3. WAITLIST & APPLICATIONS
-- ============================================================================

-- Applications table (before enrollment)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  child_first_name TEXT NOT NULL,
  child_last_name TEXT NOT NULL,
  child_date_of_birth DATE NOT NULL,
  preferred_start_date DATE NOT NULL,
  betreuung_hours_type TEXT NOT NULL CHECK (betreuung_hours_type IN ('25', '35', '45', 'ganztag', 'halbtag')),
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  address JSONB,
  priority_kita_ids UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'offered', 'accepted', 'rejected', 'withdrawn')),
  offered_place_date DATE,
  accepted_date DATE,
  rejected_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist positions
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  priority_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. IMPROVED LUNCH BILLING (Flat Rates & Cancellation Deadlines)
-- ============================================================================

-- Lunch settings per kita
CREATE TABLE IF NOT EXISTS lunch_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  cancellation_deadline_time TIME NOT NULL DEFAULT '08:00:00',
  grace_minutes INTEGER DEFAULT 0,
  default_billing_type TEXT NOT NULL DEFAULT 'per_meal' CHECK (default_billing_type IN ('flat_monthly', 'per_meal', 'hybrid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kita_id)
);

-- Food flat rates (monthly fixed amounts)
CREATE TABLE IF NOT EXISTS food_flat_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  age_range TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- lunch_billing_items extra columns: applied in add-lunch-billing.sql (after CREATE TABLE)

-- ============================================================================
-- 5. DSGVO COMPLIANCE (Consents, Data Retention, Access Logs)
-- ============================================================================

-- Consents table
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('photo', 'messaging', 'emergency_data', 'third_party_tools', 'data_processing', 'publication')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, consent_type)
);

-- Data retention settings
CREATE TABLE IF NOT EXISTS data_retention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('child_data', 'attendance', 'billing', 'photos', 'reports')),
  retention_years INTEGER NOT NULL DEFAULT 10,
  anonymize_after_years INTEGER,
  auto_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kita_id, data_type)
);

-- Access logs (who accessed what data)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('child', 'attendance', 'billing', 'contract', 'application', 'parent_work')),
  resource_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. PARENT WORK AS QUOTA SYSTEM
-- ============================================================================

-- Parent work quota (required hours per year)
CREATE TABLE IF NOT EXISTS parent_work_quota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  required_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
  completed_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
  remaining_hours DECIMAL(5, 2) GENERATED ALWAYS AS (required_hours - completed_hours) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- parent_work_tasks / parent_work_submissions extra columns: applied in add-parent-work-system.sql
-- (those tables are created there; parent_work_quota above must exist first for submission FKs)

-- ============================================================================
-- 7. STAFF MANAGEMENT (Qualifications, Schedules, Betreuungsschlüssel)
-- ============================================================================

-- Staff qualifications
CREATE TABLE IF NOT EXISTS staff_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_type TEXT NOT NULL CHECK (qualification_type IN ('Erzieher', 'Kinderpfleger', 'Heilpädagoge', 'Fachkraft', 'Praktikant', 'other')),
  certificate_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff schedules (Vollzeit/Teilzeit, Stundenumfang)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('vollzeit', 'teilzeit', 'minijob')),
  weekly_hours DECIMAL(4, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  group_assignments UUID[] DEFAULT ARRAY[]::UUID[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff rota (daily assignments)
CREATE TABLE IF NOT EXISTS staff_rota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_absence BOOLEAN DEFAULT FALSE,
  absence_type TEXT CHECK (absence_type IN ('sick', 'vacation', 'training', 'other')),
  replacement_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, group_id, date)
);

-- Betreuungsschlüssel tracking (staff-child ratio per group)
CREATE TABLE IF NOT EXISTS care_ratios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  staff_count INTEGER NOT NULL,
  child_count INTEGER NOT NULL,
  ratio DECIMAL(4, 2) GENERATED ALWAYS AS (CASE WHEN child_count > 0 THEN staff_count::DECIMAL / child_count ELSE 0 END) STORED,
  target_ratio DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, date)
);

-- ============================================================================
-- 8. CHILD GUARDIANS (Better than parent_ids array)
-- ============================================================================

-- Child guardians table (replaces parent_ids array for better RLS)
CREATE TABLE IF NOT EXISTS child_guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('parent', 'step_parent', 'legal_guardian', 'grandparent', 'other')),
  is_primary BOOLEAN DEFAULT FALSE,
  has_custody BOOLEAN DEFAULT TRUE,
  custody_notes TEXT,
  emergency_contact BOOLEAN DEFAULT FALSE,
  can_pickup BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, guardian_id)
);

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_groups_kita_id ON groups(kita_id);
CREATE INDEX IF NOT EXISTS idx_children_kita_id ON children(kita_id);
-- Note: attendance already has index on (child_id, date) from schema.sql
-- Additional index for kita-based queries can be created via join if needed
CREATE INDEX IF NOT EXISTS idx_contracts_child_kita ON child_contracts(child_id, kita_id);
CREATE INDEX IF NOT EXISTS idx_applications_kita_status ON applications(kita_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_kita_position ON waitlist(kita_id, position);
CREATE INDEX IF NOT EXISTS idx_consents_child_type ON consents(child_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_resource ON access_logs(user_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_rota_group_date ON staff_rota(group_id, date);
CREATE INDEX IF NOT EXISTS idx_care_ratios_group_date ON care_ratios(group_id, date);
CREATE INDEX IF NOT EXISTS idx_child_guardians_child ON child_guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_child_guardians_guardian ON child_guardians(guardian_id);

-- ============================================================================
-- 10. RLS POLICIES FOR MULTI-TENANT SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_flat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_guardians ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's kita_id
CREATE OR REPLACE FUNCTION get_user_kita_id(user_id UUID)
RETURNS UUID AS $$
  SELECT kita_id FROM organization_members WHERE profile_id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user belongs to kita
CREATE OR REPLACE FUNCTION user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE profile_id = user_id AND kita_id = target_kita_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: Super admins can manage all, org admins can manage their org
CREATE POLICY "Super admins can manage all organizations" ON organizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Kitas: Users can view/manage kitas they belong to
CREATE POLICY "Users can view kitas they belong to" ON kitas
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage kitas they belong to" ON kitas
  FOR ALL USING (
    user_belongs_to_kita(auth.uid(), id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Organization members: Users can view members of their kita
CREATE POLICY "Users can view members of their kita" ON organization_members
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Child contracts: Users can view contracts for children in their kita
CREATE POLICY "Users can view contracts in their kita" ON child_contracts
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    EXISTS (SELECT 1 FROM child_guardians WHERE child_id = child_contracts.child_id AND guardian_id = auth.uid())
  );

-- Applications: Parents can view their own, staff can view in their kita
CREATE POLICY "Users can view applications in their kita" ON applications
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Consents: Parents can view their children's consents, staff in their kita
CREATE POLICY "Users can view consents in their kita" ON consents
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), (SELECT kita_id FROM children WHERE id = consents.child_id)) OR
    EXISTS (SELECT 1 FROM child_guardians WHERE child_id = consents.child_id AND guardian_id = auth.uid())
  );

-- Access logs: Users can view their own logs, admins can view all in their kita
CREATE POLICY "Users can view their own access logs" ON access_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') AND
     EXISTS (SELECT 1 FROM children WHERE id = access_logs.resource_id AND kita_id = get_user_kita_id(auth.uid())))
  );

-- Child guardians: Parents can view their own, staff can view in their kita
CREATE POLICY "Users can view guardians in their kita" ON child_guardians
  FOR SELECT USING (
    guardian_id = auth.uid() OR
    user_belongs_to_kita(auth.uid(), (SELECT kita_id FROM children WHERE id = child_guardians.child_id))
  );

-- ============================================================================
-- 11. TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- parent_work_quota trigger on parent_work_submissions: see add-parent-work-system.sql
-- (parent_work_submissions is created there)

-- Auto-create access log on sensitive operations
CREATE OR REPLACE FUNCTION log_child_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' THEN
    INSERT INTO access_logs (user_id, resource_type, resource_id, action)
    VALUES (auth.uid(), 'child', NEW.id, 'view');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Access logging for SELECT requires views or application-level logging
-- This is a placeholder - implement in application code for better control

-- ============================================================================
-- 12. MIGRATION HELPERS (Backfill existing data)
-- ============================================================================

-- Function to create default kita for existing data
CREATE OR REPLACE FUNCTION create_default_kita_for_existing_data()
RETURNS UUID AS $$
DECLARE
  default_org_id UUID;
  default_kita_id UUID;
BEGIN
  -- Create default organization
  INSERT INTO organizations (name, legal_name)
  VALUES ('Default Organization', 'Default Organization')
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_org_id;
  
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id FROM organizations LIMIT 1;
  END IF;
  
  -- Create default kita
  INSERT INTO kitas (organization_id, name, capacity_total)
  VALUES (default_org_id, 'Default Kita', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_kita_id;
  
  IF default_kita_id IS NULL THEN
    SELECT id INTO default_kita_id FROM kitas LIMIT 1;
  END IF;
  
  -- Update existing groups and children
  UPDATE groups SET kita_id = default_kita_id WHERE kita_id IS NULL;
  UPDATE children SET kita_id = default_kita_id WHERE kita_id IS NULL;
  
  RETURN default_kita_id;
END;
$$ LANGUAGE plpgsql;

-- Run migration helper (comment out after first run)
-- SELECT create_default_kita_for_existing_data();
