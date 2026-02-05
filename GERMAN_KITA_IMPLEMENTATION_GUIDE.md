# German Kita Implementation Guide

## Overview
This document outlines the comprehensive enhancements made to transform the KG School system into a fully-featured German Kita (Kindergarten) management platform.

## Key Features Added

### 1. Multi-Tenant Architecture
**Tables Added:**
- `organizations` - Träger (organizations managing multiple Kitas)
- `kitas` - Individual Kita locations
- `organization_members` - Links users to organizations/kitas

**Benefits:**
- One instance can serve multiple Kitas/Träger
- Proper data isolation between tenants
- Support for Träger-level reporting and management

**Migration:** `supabase/migrations/add-german-kita-features.sql`

### 2. Contracts & Betreuungsumfang
**Table:** `child_contracts`

**Fields:**
- `betreuung_hours_type`: 25/35/45 hours, Ganztag/Halbtag
- `fee_category`: standard, reduced, waived, subsidized
- `lunch_obligation`: Boolean
- `lunch_billing_type`: flat_monthly, per_meal, hybrid
- `subsidy_type`: BuT, BremenPass, Geschwisterrabatt, Landeszuschuss
- `subsidy_amount`: Decimal amount

**Usage:**
- Tracks each child's care contract
- Links to billing calculations
- Supports German subsidy programs

### 3. Waitlist & Application Management
**Tables:**
- `applications` - Parent applications before enrollment
- `waitlist` - Queue management with priorities

**Workflow:**
1. Parent applies via `/apply` (public form)
2. Application status: new → under_review → offered → accepted/rejected
3. Admin manages at `/admin/applications`
4. When accepted, child is enrolled and contract created

**Status Flow:**
```
new → under_review → offered → accepted → enrolled
                              → rejected
                              → withdrawn
```

### 4. Enhanced Lunch Billing

#### Flat Rates vs Per-Meal
**Tables:**
- `lunch_settings` - Per-Kita configuration
- `food_flat_rates` - Monthly fixed amounts by age/group

**Billing Types:**
1. **flat_monthly**: Fixed €66/month regardless of attendance
2. **per_meal**: Current model (bill per day)
3. **hybrid**: Combination of both

#### Cancellation Deadlines
**Configuration:**
- `cancellation_deadline_time`: Default 08:00
- `grace_minutes`: Buffer time
- Stored in `lunch_settings` per Kita

**Logic:**
- If parent cancels before deadline → No charge (or refund)
- If parent cancels after deadline → Still charged
- Tracked in `lunch_billing_items.cancellation_deadline_met`

**Updated Fields in `lunch_billing_items`:**
- `cancellation_deadline_met`: Boolean
- `billing_reason`: present, ordered, cancellation_after_deadline, flat_rate_allocation, uninformed_absence
- `cancellation_timestamp`: When cancellation was made

### 5. DSGVO Compliance

#### Consents Management
**Table:** `consents`

**Consent Types:**
- `photo`: Photo/video consent
- `messaging`: Communication consent
- `emergency_data`: Emergency contact data
- `third_party_tools`: Third-party service consent
- `data_processing`: General data processing
- `publication`: Publication consent

**Features:**
- Track who granted/revoked consent
- Timestamps for audit trail
- Per-child, per-consent-type tracking

#### Data Retention
**Table:** `data_retention_settings`

**Configuration:**
- Retention period per data type
- Auto-anonymization after X years
- Auto-deletion option

**Data Types:**
- child_data
- attendance
- billing
- photos
- reports

#### Access Logging
**Table:** `access_logs`

**Tracks:**
- Who accessed what data
- When (timestamp)
- Action type: view, create, update, delete, export
- IP address and user agent

**Compliance:**
- Required for DSGVO audit trails
- Can prove who accessed child data
- Supports data protection officer reviews

### 6. Parent Work as Quota System

#### Quota Management
**Table:** `parent_work_quota`

**Fields:**
- `required_hours`: Hours required per period (e.g., 10 hours/year)
- `completed_hours`: Hours completed
- `remaining_hours`: Auto-calculated

**Payment Types:**
- `direct_payment`: Parent receives money (current model)
- `fee_credit`: Reduces monthly fees
- `voluntary`: No payment, just tracking

#### Fee Credit Integration
When `payment_type = 'fee_credit'`:
- Completed work reduces `monthly_billing.amount`
- Tracked in `parent_work_submissions.fee_credit_amount`
- Parent sees reduced fees instead of separate payment

**Parent UX:**
- Progress bar: "6/10 hours completed"
- Shows remaining quota
- Links to available tasks

### 7. Staff Management

#### Qualifications
**Table:** `staff_qualifications`

**Types:**
- Erzieher
- Kinderpfleger
- Heilpädagoge
- Fachkraft
- Praktikant

**Features:**
- Certificate tracking
- Expiry dates
- Issuing authority

#### Schedules & Employment
**Table:** `staff_schedules`

**Employment Types:**
- Vollzeit (full-time)
- Teilzeit (part-time)
- Minijob

**Fields:**
- `weekly_hours`: Decimal (e.g., 39.5)
- Date ranges
- Group assignments

#### Staff Rota
**Table:** `staff_rota`

**Daily assignments:**
- Which staff in which group
- Time slots
- Absence tracking (sick, vacation, training)
- Replacement staff

#### Betreuungsschlüssel (Care Ratio)
**Table:** `care_ratios`

**Tracks:**
- Staff count per group per day
- Child count
- Actual ratio vs target ratio
- Compliance monitoring

**Formula:**
```
Ratio = Staff Count / Child Count
Target: Usually 1:8 for Ü3, 1:4 for U3
```

### 8. Child Guardians (Improved Parent Model)

**Table:** `child_guardians`

**Replaces:** `children.parent_ids` array (better for RLS)

**Fields:**
- `relation_type`: parent, step_parent, legal_guardian, grandparent
- `is_primary`: Boolean
- `has_custody`: Boolean
- `custody_notes`: Text
- `emergency_contact`: Boolean
- `can_pickup`: Boolean

**Benefits:**
- Better RLS policies
- Supports complex family structures
- Legal custody tracking
- Pickup authorization

## Updated Billing Logic

### Per-Meal Model (Existing)
```
For each day:
  IF (ordered lunch OR present):
    BILL = price_per_meal
  ELSE IF (informed absence before deadline):
    DON'T BILL (refund if prepaid)
  ELSE:
    BILL (uninformed absence)
```

### Flat Monthly Model (New)
```
For each month:
  BILL = flat_rate_amount (from food_flat_rates or contract)
  Attendance only used for reporting, not billing
```

### Hybrid Model (New)
```
Base = flat_rate_amount
+ Additional meals beyond base (if applicable)
- Credits for informed absences
```

## RLS Security Updates

### Tenant-Based Policies
All policies now check:
1. User's role (admin, teacher, parent)
2. User's kita membership (`user_belongs_to_kita()`)
3. Resource ownership (for parents)

### Helper Functions
- `get_user_kita_id(user_id)`: Returns user's kita
- `user_belongs_to_kita(user_id, kita_id)`: Checks membership

### Policy Pattern
```sql
CREATE POLICY "Users can view X in their kita" ON table_name
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    -- Additional conditions
  );
```

## Migration Steps

### 1. Run Database Migration
```sql
-- Run in Supabase SQL Editor:
\i supabase/migrations/add-german-kita-features.sql
```

### 2. Create Default Kita (for existing data)
```sql
SELECT create_default_kita_for_existing_data();
```

### 3. Migrate Existing Data
- Assign existing groups/children to default kita
- Create organization_members entries
- Convert parent_ids to child_guardians

### 4. Update Application Code
- Add kita_id to all queries
- Update RLS checks
- Add new pages for applications, waitlist, etc.

## New Pages to Create

### Admin Pages
- `/admin/organizations` - Manage organizations
- `/admin/kitas` - Manage Kita locations
- `/admin/applications` - Waitlist management
- `/admin/contracts` - Child contracts
- `/admin/staff/qualifications` - Staff certs
- `/admin/staff/rota` - Daily schedules
- `/admin/consents` - DSGVO consents
- `/admin/data-retention` - Retention settings
- `/admin/access-logs` - Audit trail

### Public Pages
- `/apply` - Application form (public)
- `/apply/status` - Check application status

### Parent Pages
- `/parent/work/quota` - Quota progress
- `/parent/consents` - Manage consents

### Träger Pages (Super Admin)
- `/org/dashboard` - Multi-Kita overview
- `/org/reports` - Cross-Kita reports
- `/org/kitas` - Manage all Kitas

## Configuration Examples

### Lunch Settings
```sql
INSERT INTO lunch_settings (kita_id, cancellation_deadline_time, grace_minutes, default_billing_type)
VALUES ('kita-uuid', '08:00:00', 15, 'per_meal');
```

### Flat Rate
```sql
INSERT INTO food_flat_rates (kita_id, age_range, amount, effective_from)
VALUES ('kita-uuid', 'Ü3', 66.00, '2024-01-01');
```

### Contract
```sql
INSERT INTO child_contracts (
  child_id, kita_id, betreuung_hours_type, 
  fee_category, lunch_billing_type, lunch_flat_rate_amount
)
VALUES (
  'child-uuid', 'kita-uuid', '35',
  'standard', 'flat_monthly', 66.00
);
```

### Parent Work Quota
```sql
INSERT INTO parent_work_quota (
  child_id, period_start, period_end, required_hours
)
VALUES (
  'child-uuid', '2024-09-01', '2025-08-31', 10.0
);
```

## Testing Checklist

- [ ] Multi-tenant: Create organization and kita
- [ ] Assign users to kita
- [ ] Create application and move to waitlist
- [ ] Accept application and create contract
- [ ] Test flat rate billing
- [ ] Test cancellation deadline logic
- [ ] Create parent work quota
- [ ] Test fee credit application
- [ ] Create consents
- [ ] Test access logging
- [ ] Verify RLS policies work correctly

## Next Steps

1. **Update billing generation** to support flat rates
2. **Create application/waitlist pages**
3. **Add consent management UI**
4. **Build staff rota/schedule pages**
5. **Add Träger dashboard**
6. **Implement access logging in app code**
7. **Create data retention automation**

## Notes

- All new tables have proper RLS policies
- Indexes added for performance
- Triggers for auto-updates (quota, etc.)
- Helper functions for common checks
- Migration helper for existing data

This implementation provides a solid foundation for a German Kita management system with proper multi-tenancy, DSGVO compliance, and German-specific features.
