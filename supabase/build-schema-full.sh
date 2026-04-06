#!/usr/bin/env bash
# Regenerates schema-full.sql — order matters (RLS helpers before policies that call them).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="supabase/schema-full.sql"
{
  echo "-- ============================================================================="
  echo "-- KG School — consolidated schema (single file). Built by supabase/build-schema-full.sh"
  echo "-- $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "-- Run: reset-public-schema.sql then this file once."
  echo "-- ============================================================================="
  echo ""
  echo 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
  echo 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
  echo ""
} > "$OUT"

FILES=(
  supabase/schema.sql
  supabase/schema-educational.sql
  supabase/schema-kita-features.sql
  supabase/schema-leave-requests.sql
  supabase/migrations/add-german-kita-features.sql
  supabase/migrations/20260328_enhance_user_profiles.sql
  supabase/migrations/20260327_add_compliance_audit_and_data_requests.sql
  supabase/migrations/add-academic-calendar.sql
  supabase/migrations/add-parent-work-system.sql
  supabase/migrations/add-lunch-billing.sql
  supabase/migrations/add-billing-audit-log.sql
  supabase/migrations/add-teacher-leave-requests.sql
  supabase/migrations/enhance-group-teacher-assignment.sql
  supabase/migrations/add-monthly-fees-system.sql
  supabase/migrations/add-staff-assignments.sql
  supabase/migrations/migrate-existing-assignments.sql
  supabase/migrations/add-payroll-system.sql
  supabase/migrations/add-support-staff-permissions.sql
  supabase/migrations/enhance-attendance-system.sql
  supabase/migrations/add-billing-timetable.sql
  supabase/migrations/fix-monthly-billing-rls.sql
  # --- RLS helpers MUST run before anything that calls get_user_role() / is_admin() / is_teacher() ---
  supabase/migrations/20260331120000_fix_rls_recursion_security_helpers.sql
  supabase/migrations/20260401120000_fix_profiles_rls_recursion_role_helpers.sql
  supabase/migrations/20260329120000_tenant_isolation_rls.sql
  supabase/migrations/add-teacher-filtering-functions.sql
  supabase/migrations/20260330120000_profiles_ensure_self_select_rls.sql
  supabase/migrations/20260331_fix_multi_tenancy_rls.sql
  supabase/migrations/20260331_storage_setup.sql
  supabase/migrations/diagnose-and-fix-avatars.sql
  supabase/migrations/fix-avatar-upload-rls.sql
  supabase/migrations/fix-avatar-upload-rls-v2.sql
  supabase/migrations/fix-profiles-policies-safe.sql
  supabase/migrations/20260402120000_get_my_profile_hydration_rpc.sql
  supabase/migrations/20260403120000_fix_children_groups_rls_recursion.sql
  supabase/migrations/20260404120000_alter_rls_helpers_volatile.sql
  supabase/migrations/setup-avatars-bucket.sql
  supabase/migrations/setup-billing-documents-bucket.sql
  sql/tenant_site_builder.sql
)

# Note: 20260331120000 was previously after tenant_isolation; 20260401 after that.
# That left is_admin() undefined when tenant_isolation + add-teacher-filtering ran.

for f in "${FILES[@]}"; do
  echo "" >> "$OUT"
  echo "-- >>> FILE: $f" >> "$OUT"
  echo "" >> "$OUT"
  cat "$f" >> "$OUT"
done

wc -l "$OUT"
echo "Wrote $OUT"
