# KG School System - Quick Reference Guide

## 🔗 Key Links by Feature

### Teacher Assignment
- **Assign teachers to groups:** `/admin/groups/[id]/assign-teachers`
- **View group details:** `/admin/groups/[id]`
- **List all groups:** `/admin/groups`

### Attendance System
- **Teachers mark attendance:** `/teacher/attendance`
- **Admin view calendar:** `/admin/attendance/calendar`
- **Parents view attendance:** `/parent/attendance`

### Lunch Billing
- **Generate bills:** `/admin/lunch/billing/generate`
- **View all bills:** `/admin/lunch/billing`
- **Set pricing:** `/admin/lunch/pricing`
- **Parents view bills:** `/parent/billing`

### Parent Work (Eltern Arbeit)
- **Admin create task:** `/admin/parent-work/new`
- **Admin manage tasks:** `/admin/parent-work`
- **Parent dashboard:** `/parent/work`
- **Parent submit work:** `/parent/work/tasks/[id]`

---

## 🔄 Common Workflows

### 1. Assign Teacher to Group
1. Go to `/admin/groups`
2. Click on a group
3. Click "Assign Teachers" or go to `/admin/groups/[id]/assign-teachers`
4. Fill form: Select teacher, choose role, set dates
5. Save

### 2. Teacher Marks Attendance
1. Teacher logs in
2. Goes to `/teacher/attendance`
3. Selects date
4. Clicks "Present" or "Absent" for each child
5. System saves with `recorded_by` = teacher ID

### 3. Generate Lunch Bills
1. Admin goes to `/admin/lunch/billing/generate`
2. Selects month/year
3. System calculates:
   - Present days → Bill
   - Ordered lunch → Bill
   - Informed absence → Don't bill
   - Uninformed absence → Bill
4. Review bills at `/admin/lunch/billing`

### 4. Parent Work Flow
1. **Admin creates task:** `/admin/parent-work/new`
   - Set hourly rate, task type
2. **Parent submits work:** `/parent/work/tasks/[id]`
   - Enter hours worked, date
3. **Admin approves:** `/admin/parent-work/[id]`
   - Click "Approve" on submission
4. **Admin creates payment:** `/admin/parent-work/[id]`
   - Click "Pay" on approved submission
5. **Parent sees earnings:** `/parent/work`

---

## 📊 How Attendance Affects Lunch Billing

**Billable Scenarios:**
- ✅ Child was present (attendance = 'present')
- ✅ Child ordered lunch (even if absent)
- ✅ Child was absent without notification

**Not Billable:**
- ❌ Child was absent with informed notification (before deadline)

**Calculation:**
```
For each day:
  IF (ordered lunch OR present OR uninformed absence):
    BILL = price_per_meal
  ELSE IF (informed absence):
    REFUND = price_per_meal
```

---

## 🗄️ Database Tables Reference

| Table | Purpose |
|-------|---------|
| `group_teachers` | Links teachers to groups with roles |
| `attendance` | Daily attendance records |
| `lunch_orders` | Parent lunch orders |
| `monthly_billing` | Generated bills |
| `lunch_billing_items` | Daily bill breakdown |
| `parent_work_tasks` | Available tasks |
| `parent_work_submissions` | Parent work submissions |
| `parent_work_payments` | Payment records |

---

## 🔐 Access Control

- **Teachers** can only see children in assigned groups
- **Parents** can only see their own children
- **Admins** have full access
- All access controlled by RLS policies in Supabase

---

## ⚠️ Troubleshooting

**Issue:** Teacher can't see children
- **Fix:** Assign teacher to group at `/admin/groups/[id]/assign-teachers`

**Issue:** Bills showing €0.00
- **Fix:** Set lunch pricing at `/admin/lunch/pricing`

**Issue:** Attendance not saving
- **Fix:** Check RLS policies, verify teacher assignment

---

For detailed documentation, see: `END_TO_END_SYSTEM_DOCUMENTATION.md`
