# KG School Management System - End-to-End Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Access](#user-roles--access)
3. [Core Features & Workflows](#core-features--workflows)
4. [Teacher Assignment & Attendance System](#teacher-assignment--attendance-system)
5. [Lunch Billing System](#lunch-billing-system)
6. [Parent Work (Eltern Arbeit) System](#parent-work-eltern-arbeit-system)
7. [Navigation & Links](#navigation--links)
8. [Database Architecture](#database-architecture)
9. [Security & Permissions](#security--permissions)

---

## 🎯 System Overview

The KG School Management System is a comprehensive web application for managing a kindergarten/daycare facility. It handles:

- **Child Management**: Enrollment, groups, attendance
- **Teacher Management**: Assignments, schedules, leave requests
- **Lunch System**: Menu planning, ordering, billing
- **Parent Work System**: Task assignment and payment tracking
- **Communication**: Messaging between parents, teachers, and admin
- **Financial Management**: Fees, billing, payments

**Technology Stack:**
- Frontend: Nuxt 3 (Vue.js)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Styling: Tailwind CSS

---

## 👥 User Roles & Access

### 1. **Admin** (`/admin/*`)
Full system access. Can manage:
- All users, children, groups
- Teacher assignments
- Lunch menus and billing
- Parent work tasks and payments
- System settings

### 2. **Teacher** (`/teacher/*`)
Can manage:
- Assigned groups and children
- Attendance marking
- Daily reports and observations
- Leave requests
- View assigned children's information

### 3. **Parent** (`/parent/*`)
Can:
- View their children's information
- Order lunches
- View billing and fees
- Submit parent work tasks
- Communicate with teachers
- View attendance and reports

### 4. **Kitchen Staff** (`/kitchen/*`)
Can:
- Create and manage lunch menus
- View and process lunch orders
- Update order status

### 5. **Support Staff** (`/support/*`)
Can:
- View attendance calendar
- Access reports
- View children information

---

## 🔄 Core Features & Workflows

### A. Child Enrollment Workflow

1. **Admin creates child** (`/admin/children/new`)
   - Enter child details (name, DOB, enrollment date)
   - Assign to a group
   - Link parent accounts

2. **Child appears in system**
   - Visible to assigned teachers
   - Visible to linked parents
   - Can be included in attendance

3. **Group Assignment**
   - Admin assigns child to group (`/admin/children/[id]`)
   - Group determines which teachers can access child

### B. Teacher Assignment to Groups

**Path:** `/admin/groups/[id]/assign-teachers`

**How it works:**
1. Admin navigates to group details
2. Clicks "Assign Teachers" or goes to `/admin/groups/[id]/assign-teachers`
3. Views current teacher assignments
4. Adds new teacher:
   - Selects teacher from dropdown
   - Chooses role: Primary, Assistant, or Support
   - Sets start date (and optional end date)
   - Adds notes
5. System automatically:
   - Creates entry in `group_teachers` table
   - If primary teacher, updates `groups.educator_id`
   - Enables teacher to see group's children

**Teacher Roles:**
- **Primary**: Main group leader (only one per group)
- **Assistant**: Supporting teacher
- **Support**: Additional support staff

**Database Tables:**
- `group_teachers`: Junction table linking groups and teachers
- `groups`: Contains `educator_id` (backward compatibility with primary teacher)

---

## 📝 Teacher Attendance System

### How Teachers Mark Attendance

**Path:** `/teacher/attendance`

**Workflow:**
1. Teacher logs in and navigates to Attendance page
2. System shows:
   - All children from assigned groups
   - Current date (can change date)
   - Attendance status for each child

3. **Marking Attendance:**
   - **Present**: Click "Present" button
     - Creates/updates attendance record with status='present'
     - Records check-in time
     - Records who marked it (`recorded_by`)
   
   - **Absent**: Click "Absent" button
     - Opens absence submission form
     - Teacher enters reason and notes
     - Creates attendance record with status='absent'
     - Creates absence submission record

4. **Check-In/Check-Out:**
   - Teachers can record exact check-in/check-out times
   - Useful for tracking arrival/departure times

5. **Bulk Mode:**
   - Select multiple children
   - Mark all as present at once

**Database Flow:**
```
attendance table:
- child_id, date, status, check_in_time, check_out_time
- recorded_by (teacher who marked it)
- check_in_method (manual, bulk, check_in_out)
```

**Access Control:**
- Teachers can only mark attendance for children in their assigned groups
- System checks `group_teachers` table to determine access

---

## 🍽️ Lunch Billing System

### How Attendance Relates to Lunch Payment

**Key Concept:** Children are billed for lunch if they:
1. **Ordered lunch** (explicit order)
2. **Were present** (attendance shows 'present')
3. **Were absent without notification** (uninformed absence)

Children are **NOT billed** if:
- They were absent with **informed absence** (parent notified before deadline)

### Lunch Billing Workflow

**1. Setup (Admin):**
- Set lunch pricing per group (`/admin/lunch/pricing`)
  - Or set `lunch_price_per_meal` directly on group
- Create lunch menus (`/admin/lunch/menus`)

**2. During Month:**
- Parents order lunches (`/parent/lunch`)
- Teachers mark attendance (`/teacher/attendance`)
- Parents can notify absences (`/parent/absences/new`)

**3. End of Month - Generate Bills:**
- Admin goes to `/admin/lunch/billing/generate`
- Selects month and year
- System calculates bills for each child:

**Billing Calculation Logic:**
```
For each day in the month:
  - Check if child ordered lunch → BILL
  - Check if child was present (attendance) → BILL
  - Check if informed absence → DON'T BILL (refundable)
  - Otherwise → BILL (uninformed absence)

Total = (Billable days × price per meal) - Refundable days
```

**4. Bill Details:**
- Admin can view each bill (`/admin/lunch/billing/[id]`)
- Shows breakdown by day
- Can manually edit amount if needed
- Can mark as paid

**5. Refunds:**
- Informed absences are tracked as refundable
- Admin can process refunds (`/admin/lunch/billing/refunds`)

**Database Tables:**
- `lunch_menus`: Available meals
- `lunch_orders`: Parent orders
- `attendance`: Used to determine if child was present
- `absence_notifications`: Informed absences
- `monthly_billing`: Generated bills
- `lunch_billing_items`: Daily breakdown of billable items

**Key Links:**
- Admin billing: `/admin/lunch/billing`
- Generate bills: `/admin/lunch/billing/generate`
- Preview bills: `/admin/lunch/billing/preview`
- Parent view: `/parent/billing`

---

## 👨‍👩‍👧 Parent Work (Eltern Arbeit) System

### Overview
Allows parents to perform tasks (cleaning, cooking, maintenance, etc.) and receive payment from the school.

### Admin Workflow

**1. Create Tasks** (`/admin/parent-work/new`)
- Enter task details:
  - Title and description
  - Task type (cleaning, cooking, maintenance, gardening, administration, other)
  - Hourly rate (€)
  - Estimated hours (optional)
  - Due date (optional)
  - Assign to specific parent (optional)
- Task status: "open" or "assigned"

**2. Manage Tasks** (`/admin/parent-work`)
- View all tasks
- Filter by status or type
- Edit or delete tasks
- View task details

**3. Review Submissions** (`/admin/parent-work/[id]`)
- View submissions from parents
- Approve or reject submissions
- When approved, payment amount is calculated automatically:
  ```
  Payment = hours_worked × hourly_rate
  ```

**4. Process Payments** (`/admin/parent-work/payments`)
- Create payment records for approved submissions
- Mark payments as completed
- Track payment method and transaction ID

### Parent Workflow

**1. View Available Tasks** (`/parent/work`)
- See all open tasks or tasks assigned to them
- View task details: description, hourly rate, estimated hours

**2. Submit Work** (`/parent/work/tasks/[id]`)
- Select work date
- Enter hours worked
- Add description of work performed
- Submit for review
- System calculates estimated payment

**3. Track Submissions** (`/parent/work`)
- View all submissions
- See status: pending, approved, rejected, paid
- View payment amounts
- Track total earnings

### Database Structure

**Tables:**
1. **`parent_work_tasks`**
   - Task definitions
   - Hourly rates
   - Status tracking

2. **`parent_work_submissions`**
   - Parent work submissions
   - Hours worked
   - Payment amount (auto-calculated)
   - Approval status

3. **`parent_work_payments`**
   - Payment records
   - Payment status
   - Transaction tracking

**Automatic Calculations:**
- Payment amount is calculated via database trigger:
  ```sql
  payment_amount = hourly_rate × hours_worked
  ```

**Key Links:**
- Admin tasks: `/admin/parent-work`
- Admin create task: `/admin/parent-work/new`
- Parent work dashboard: `/parent/work`
- Parent submit work: `/parent/work/tasks/[id]`

---

## 🔗 Navigation & Links

### Admin Navigation

**Dashboard:** `/admin/dashboard`

**Children:**
- List: `/admin/children`
- New: `/admin/children/new`
- Details: `/admin/children/[id]`
- Change group: `/admin/children/[id]/change-group`
- Assign teachers: `/admin/children/[id]/assign-teachers`

**Groups:**
- List: `/admin/groups`
- New: `/admin/groups/new`
- Details: `/admin/groups/[id]`
- Assign teachers: `/admin/groups/[id]/assign-teachers`

**Teachers/Staff:**
- List: `/admin/staff`
- New: `/admin/staff/new`
- Details: `/admin/staff/[id]`

**Lunch System:**
- Menus: `/admin/lunch/menus`
- Orders: `/admin/lunch/orders`
- Pricing: `/admin/lunch/pricing`
- Billing: `/admin/lunch/billing`
- Generate bills: `/admin/lunch/billing/generate`

**Parent Work:**
- Tasks: `/admin/parent-work`
- New task: `/admin/parent-work/new`
- Task details: `/admin/parent-work/[id]`

**Attendance:**
- Calendar: `/admin/attendance/calendar`
- List: `/admin/attendance`

**Fees:**
- List: `/admin/fees`
- Generate: `/admin/fees/generate`
- Config: `/admin/fees/config`

### Teacher Navigation

**Dashboard:** `/teacher/dashboard`

**Children:**
- List: `/teacher/children`
- Details: `/teacher/children/[id]`

**Groups:**
- Details: `/teacher/groups/[id]`

**Attendance:**
- Mark attendance: `/teacher/attendance`
- Scan QR: `/teacher/attendance/scan`

**Reports:**
- Daily reports: `/teacher/daily-reports`
- Observations: `/teacher/observations`
- Portfolios: `/teacher/portfolios`

**Leave:**
- Requests: `/teacher/leave`
- New request: `/teacher/leave/new`

### Parent Navigation

**Dashboard:** `/parent/dashboard`

**Children:**
- List: `/parent/children`
- Details: `/parent/children/[id]`

**Lunch:**
- Order lunch: `/parent/lunch`

**Billing:**
- View bills: `/parent/billing`
- Bill details: `/parent/billing/[id]`

**Fees:**
- View fees: `/parent/fees`
- Fee details: `/parent/fees/[id]`

**Parent Work:**
- Dashboard: `/parent/work`
- Task details: `/parent/work/tasks/[id]`

**Attendance:**
- View attendance: `/parent/attendance`

**Absences:**
- Notify absence: `/parent/absences/new`
- View absences: `/parent/absences`

**Communication:**
- Messages: `/parent/messages`
- Reports: `/parent/daily-reports`
- Observations: `/parent/observations`

### Kitchen Navigation

**Dashboard:** `/kitchen/dashboard`

**Menus:**
- List: `/kitchen/menus`
- Create: `/kitchen/menus/new`

**Orders:**
- View orders: `/kitchen/orders`

---

## 🗄️ Database Architecture

### Core Tables

**`profiles`**
- User accounts (extends Supabase auth.users)
- Roles: admin, teacher, parent, kitchen, support
- Basic info: name, email, phone, avatar

**`groups`**
- Class/group definitions
- Age ranges (U3, Ü3)
- Capacity limits
- `educator_id` (primary teacher - backward compatibility)

**`children`**
- Child information
- Linked to groups via `group_id`
- Linked to parents via `parent_ids` (array)
- Status: active, inactive, pending

**`group_teachers`**
- Many-to-many relationship between groups and teachers
- Roles: primary, assistant, support
- Date ranges (start_date, end_date)
- Notes

**`attendance`**
- Daily attendance records
- Status: present, absent, late, early_pickup
- Check-in/check-out times
- `recorded_by` (teacher who marked it)
- `check_in_method` (manual, bulk, check_in_out)

**`lunch_menus`**
- Available meals
- Date-specific
- Allergen information
- Nutritional info

**`lunch_orders`**
- Parent orders
- Linked to child and menu
- Status: pending, confirmed, prepared, served

**`monthly_billing`**
- Generated bills per child per month
- Total amount
- Status: pending, paid, overdue

**`lunch_billing_items`**
- Daily breakdown of billable items
- Links to orders and attendance
- Tracks informed absences (refundable)

**`parent_work_tasks`**
- Available tasks for parents
- Hourly rates
- Task types
- Assignment status

**`parent_work_submissions`**
- Parent work submissions
- Hours worked
- Auto-calculated payment amount
- Approval status

**`parent_work_payments`**
- Payment records
- Payment status and method

### Relationships

```
groups ←→ group_teachers ←→ profiles (teachers)
groups ← children
children ←→ profiles (parents via parent_ids array)
children → attendance
children → lunch_orders
children → monthly_billing
parent_work_tasks → parent_work_submissions → parent_work_payments
```

---

## 🔒 Security & Permissions

### Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:

**Admins:**
- Full access to all data

**Teachers:**
- Can view/manage children in assigned groups
- Can mark attendance for assigned groups
- Can view their own group assignments

**Parents:**
- Can view only their own children
- Can view their children's attendance
- Can create lunch orders for their children
- Can view their own bills and fees
- Can submit parent work for themselves

**Kitchen:**
- Can view all lunch orders
- Can manage menus

### Middleware Protection

Routes are protected by:
1. **Auth middleware**: Ensures user is logged in
2. **Role middleware**: Verifies user has required role
3. **Route guards**: Prevents unauthorized access

Example:
```typescript
definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})
```

---

## 📊 Key Workflows Summary

### 1. Complete Child Enrollment Flow
1. Admin creates child → assigns to group
2. Admin assigns teachers to group
3. Teachers can now see child in their dashboard
4. Parents can see child in their dashboard
5. Attendance can be marked
6. Lunches can be ordered
7. Bills are generated monthly

### 2. Complete Attendance → Billing Flow
1. Teacher marks attendance (present/absent)
2. Parent orders lunch (optional)
3. Parent notifies absence if needed (optional)
4. End of month: Admin generates bills
5. System calculates:
   - Present days → Bill
   - Ordered lunch → Bill
   - Informed absence → Don't bill (refund)
   - Uninformed absence → Bill
6. Admin reviews and marks as paid

### 3. Complete Parent Work Flow
1. Admin creates task with hourly rate
2. Task appears in parent dashboard
3. Parent submits work with hours worked
4. Admin reviews and approves
5. System calculates payment (hours × rate)
6. Admin creates payment record
7. Payment marked as completed
8. Parent sees earnings in dashboard

---

## 🚀 Getting Started

### For Admins:
1. Login at `/login`
2. Navigate to Dashboard: `/admin/dashboard`
3. Start by:
   - Creating groups: `/admin/groups/new`
   - Adding teachers: `/admin/staff/new`
   - Assigning teachers to groups: `/admin/groups/[id]/assign-teachers`
   - Enrolling children: `/admin/children/new`
   - Setting lunch pricing: `/admin/lunch/pricing`

### For Teachers:
1. Login at `/login`
2. Navigate to Dashboard: `/teacher/dashboard`
3. View assigned groups and children
4. Mark attendance: `/teacher/attendance`

### For Parents:
1. Login at `/login`
2. Navigate to Dashboard: `/parent/dashboard`
3. View children, order lunches, submit parent work

---

## 📞 Support & Troubleshooting

### Common Issues:

**1. Teacher can't see children:**
- Check if teacher is assigned to group: `/admin/groups/[id]/assign-teachers`
- Verify group assignment on child: `/admin/children/[id]`

**2. Bills showing €0.00:**
- Check lunch pricing is set: `/admin/lunch/pricing`
- Verify attendance is being marked
- Check if child was present or ordered lunch

**3. Parent can't submit work:**
- Verify task exists and is "open" or "assigned" to them
- Check parent is logged in with correct role

**4. Attendance not saving:**
- Check RLS policies in Supabase
- Verify teacher is assigned to child's group
- Check database connection

---

## 📝 Notes

- All dates are stored in UTC and displayed in local timezone
- Payments are in EUR (€)
- System supports multiple parents per child
- System supports multiple teachers per group
- All financial calculations are done server-side for security
- Database triggers handle automatic calculations (payment amounts, etc.)

---

**Last Updated:** {{ current_date }}
**Version:** 1.0.0
