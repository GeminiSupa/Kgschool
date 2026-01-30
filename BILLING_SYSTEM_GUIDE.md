# Billing System Guide

## 📋 Overview

The billing system allows:
- **Admins** to create, edit, and manage billing for all children
- **Parents** to view their children's bills and receive notifications when bills are updated

## 🔐 Access Control

### Parents
- Can view bills for their own children only (enforced by RLS)
- Can download billing documents
- Receive notifications when bills are updated
- Access via: `/parent/billing`

### Admins
- Can view and edit all bills
- Can generate monthly billing
- Can edit bill details (amounts, status, dates, notes)
- Can upload billing documents
- Access via: `/admin/lunch/billing`

## 📱 Parent Features

### Viewing Bills
1. **Dashboard**: Click "💰 Billing" from parent dashboard
2. **Billing List**: See all bills for your children
   - Shows: Child name, period, amounts, status, due date
   - Click "View Details" to see full bill
3. **Bill Details**: 
   - View all billing items (daily breakdown)
   - Download PDF documents
   - See refund information

### Notifications
- Parents receive notifications when:
  - Bill is created
  - Bill is updated (if admin checks "Notify parent")
  - Bill status changes
- Notifications appear in the notifications panel
- Click notification to go directly to the bill

## ⚙️ Admin Features

### Generating Bills
1. Go to `/admin/lunch/billing/generate`
2. Select month and year
3. Click "Generate Billing"
4. System automatically:
   - Calculates billable days (based on timetable)
   - Checks lunch orders and attendance
   - Applies pricing
   - Handles informed/uninformed absences

### Editing Bills

#### Quick Edit Amount
- **Path**: `/admin/lunch/billing/[id]/edit-amount`
- **Use**: Quick way to adjust total, paid, and refund amounts
- **Access**: Click "💰 Quick Edit Amount" button

#### Full Edit
- **Path**: `/admin/lunch/billing/[id]/edit`
- **Use**: Edit all bill details:
  - Total amount
  - Paid amount
  - Refund amount
  - Status (pending/paid/overdue/cancelled)
  - Due date
  - Billing date
  - Notes
  - **Notify parent** checkbox
- **Access**: Click "✏️ Edit Bill" button

### Bill Management
- **Mark as Paid**: Quick button to mark bill as paid
- **Upload Document**: Upload PDF/Excel billing documents
- **View Items**: See daily breakdown of billing items

## 🔔 Notification System

### When Parents Get Notified
1. **Bill Created**: When admin generates a new bill
2. **Bill Updated**: When admin edits bill and checks "Notify parent"
3. **Status Changed**: When bill status changes (e.g., to "paid")

### Notification Content
- **Title**: "Billing Updated"
- **Message**: Shows period, total amount, and new status
- **Link**: Direct link to the bill detail page

## 📊 Billing Calculation

### How Bills Are Calculated
1. **Timetable Check**: Only billable days (configured per group) are included
2. **Lunch Orders**: Days with orders are billable
3. **Attendance**: Days when child was present are billable
4. **Absences**:
   - **Informed** (before deadline): Refundable, not billable
   - **Uninformed**: Billable
5. **Pricing**: Uses group's lunch price per meal

### Billing Items
Each bill contains daily items showing:
- Date
- Price per meal
- Type (Order/Informed Absence/Uninformed Absence)
- Refundable status
- Refunded status

## 🛠️ Technical Details

### RLS Policies
- **Parents**: Can only view bills for their children
- **Admins**: Can view and manage all bills
- Policies are in: `supabase/migrations/add-lunch-billing.sql`

### API Endpoints
- `POST /api/admin/lunch/billing/[id]/update` - Quick amount update
- `POST /api/admin/lunch/billing/[id]/update-full` - Full bill update with notifications
- `GET /api/admin/lunch/billing/get-document` - Get signed URL for documents

### Stores
- `stores/billing.ts` - Manages billing data
  - `fetchBills()` - For admins (all bills)
  - `fetchBillsForParent()` - For parents (filtered by RLS)
  - `fetchBillById()` - Get single bill
  - `fetchBillingItems()` - Get daily items

## 📝 Best Practices

### For Admins
1. **Set up pricing first**: Configure lunch pricing before generating bills
2. **Set up timetables**: Configure billable days per group
3. **Generate monthly**: Generate bills at the end of each month
4. **Review before notifying**: Check bills before notifying parents
5. **Upload documents**: Upload PDFs for parents to download

### For Parents
1. **Check regularly**: Visit billing page to see new bills
2. **Review items**: Check daily breakdown to understand charges
3. **Download documents**: Save PDFs for your records
4. **Notify absences**: Inform absences early to get refunds

## 🔧 Troubleshooting

### Parents can't see bills
- Check RLS policies are applied
- Verify parent is linked to child (`parent_ids` array)
- Check child has bills generated

### Bills showing €0.00
- Set up lunch pricing for the group
- Check timetable configuration
- Verify lunch orders or attendance exist

### Notifications not working
- Check notifications table RLS policies
- Verify parent IDs are correct in children table
- Check admin checked "Notify parent" when editing

## 📍 Navigation

### Parent Sidebar
- 💰 Billing → `/parent/billing`

### Admin Sidebar
- 💰 Billing → `/admin/lunch/billing`
- 📅 Timetables → `/admin/lunch/billing/timetable`
- ⚙️ Config → `/admin/lunch/billing/config`
