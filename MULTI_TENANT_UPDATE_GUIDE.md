# Multi-Tenant Query Updates - Implementation Guide

## Overview
This document tracks the updates made to add multi-tenant support (kita_id filtering) to existing queries throughout the application.

## ✅ Completed Updates

### 1. Helper Composable Created
**File:** `composables/useKita.ts`

**Functions:**
- `getUserKitaId()` - Get user's kita_id from organization_members
- `getCachedKitaId()` - Get kita_id from profile cache
- `addKitaFilter()` - Add kita_id filter to queries
- `filterChildrenByKita()` - Filter children array by kita
- `filterGroupsByKita()` - Filter groups array by kita
- `userBelongsToKita()` - Check kita membership

### 2. Stores Updated

#### `stores/children.ts`
- ✅ `fetchChildren()` now accepts optional `kitaId` parameter
- ✅ Automatically gets user's kita_id if not provided
- ✅ Filters by kita_id in query

#### `stores/groups.ts`
- ✅ `fetchGroups()` now accepts optional `kitaId` parameter
- ✅ Automatically gets user's kita_id if not provided
- ✅ Filters by kita_id in query
- ✅ `getGroupCapacity()` updated to filter children by kita_id

#### `stores/attendance.ts`
- ✅ `fetchAttendance()` now accepts optional `kitaId` parameter
- ✅ Joins with children table to filter by kita_id
- ✅ Handles kita filtering for attendance records

### 3. Pages Updated

#### Admin Pages
- ✅ `/admin/children/index.vue` - Filters children by kita_id
- ✅ `/admin/groups/index.vue` - Filters groups by kita_id

#### Support Pages
- ✅ `/support/children/index.vue` - Filters children by kita_id
- ✅ `/support/attendance/index.vue` - Filters children by kita_id

## 📋 Remaining Updates Needed

### High Priority

#### Stores
- [ ] `stores/lunch.ts` - Add kita_id filters to lunch queries
- [ ] `stores/lunchPricing.ts` - Filter pricing by kita_id
- [ ] `stores/parentWork.ts` - Filter parent work by kita_id

#### Pages
- [ ] `/admin/lunch/*` - All lunch pages need kita_id filters
- [ ] `/admin/parent-work/*` - Filter by kita_id
- [ ] `/teacher/*` - Teacher pages (already filter by group, but should verify kita isolation)
- [ ] `/parent/*` - Parent pages (should already be isolated via RLS, but verify)

#### Server API
- [ ] `server/api/admin/lunch/billing/generate.post.ts` - Already updated for contracts, verify kita filtering
- [ ] `server/api/lunch/*` - All lunch API endpoints
- [ ] `server/api/admin/*` - All admin API endpoints

### Medium Priority

#### Components
- [ ] `components/forms/ChildForm.vue` - Add kita_id selection
- [ ] `components/forms/GroupForm.vue` - Add kita_id selection
- [ ] All form components that create children/groups

#### Teacher Pages
- [ ] `/teacher/children/index.vue` - Verify kita isolation
- [ ] `/teacher/attendance/index.vue` - Verify kita isolation
- [ ] `/teacher/dashboard.vue` - Filter by kita

### Low Priority

#### Parent Pages
- [ ] Parent pages should already be isolated via RLS (child_guardians)
- [ ] Verify parent can only see their children's data

## 🔧 Implementation Pattern

### For Stores

```typescript
async fetchItems(kitaId?: string) {
  const supabase = useSupabaseClient()
  let query = supabase.from('table').select('*')

  // Add kita_id filter
  if (kitaId) {
    query = query.eq('kita_id', kitaId)
  } else {
    // Auto-get from user
    const { getUserKitaId } = useKita()
    const userKitaId = await getUserKitaId()
    if (userKitaId) {
      query = query.eq('kita_id', userKitaId)
    }
  }

  const { data, error } = await query
  // ...
}
```

### For Pages

```typescript
import { useKita } from '~/composables/useKita'

const { getUserKitaId } = useKita()

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await store.fetchItems(kitaId || undefined)
})
```

### For Attendance (Join Required)

```typescript
// Attendance doesn't have kita_id directly, join with children
let query = supabase
  .from('attendance')
  .select('*, children!inner(kita_id)')

if (kitaId) {
  query = query.eq('children.kita_id', kitaId)
}
```

## 🎯 Testing Checklist

- [ ] Admin can only see children/groups from their kita
- [ ] Teacher can only see children from assigned groups (which belong to their kita)
- [ ] Support can only see children/groups from their kita
- [ ] Parent can only see their own children (RLS enforced)
- [ ] Billing generation respects kita boundaries
- [ ] Lunch orders filtered by kita
- [ ] Parent work filtered by kita
- [ ] Applications filtered by kita

## ⚠️ Important Notes

1. **RLS Policies:** Database RLS policies should enforce kita isolation, but application-level filtering provides additional security and better UX

2. **Backward Compatibility:** All updates are backward compatible - if kita_id is not available, queries still work (but may return all data if RLS doesn't filter)

3. **Performance:** Adding kita_id filters improves performance by reducing data scanned

4. **Default Kita:** For existing data, migration creates a default kita. All existing data is assigned to this kita.

## 📝 Migration Notes

After running the database migration:
1. All existing groups/children are assigned to default kita
2. Users need to be assigned to kita via `organization_members`
3. New data automatically gets kita_id from user's membership

## 🔍 Verification

To verify multi-tenant isolation:
1. Create two kitas
2. Assign different users to different kitas
3. Create children/groups in each kita
4. Verify users can only see their kita's data
