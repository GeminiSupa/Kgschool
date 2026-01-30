# Lunch Billing System Guide

## 📍 Where to Find Lunch Billing

### Admin Access
1. **Sidebar Navigation**: Click on **"💰 Abrechnung"** (Billing) in the admin sidebar
2. **Direct URL**: `/admin/lunch/billing`
3. **From Lunch Menus**: Go to `/admin/lunch/menus` and you'll see billing options

### Available Pages

#### 1. **Billing List** (`/admin/lunch/billing`)
- View all monthly bills
- Filter by month, year, and status
- See total amounts, paid amounts, and refunds
- Click "View" to see bill details

#### 2. **Generate Billing** (`/admin/lunch/billing/generate`)
- Manually generate monthly bills for all children
- Select month and year
- System calculates:
  - Billable days (days with lunch orders)
  - Informed absences (money not deducted)
  - Uninformed absences (money still deducted)
  - Total amount per child

#### 3. **Billing Configuration** (`/admin/lunch/billing/config`)
- Set absence notification deadline (hours before lunch)
- Set refund processing day of month
- Configure billing rules

#### 4. **Bill Details** (`/admin/lunch/billing/[id]`)
- View individual bill details
- See all billing items (daily charges)
- Upload billing documents (PDFs)
- Mark bills as paid
- Download documents

#### 5. **Refunds** (`/admin/lunch/billing/refunds`)
- View all refundable items (informed absences)
- Process refunds for a specific month
- See refund status and amounts

#### 6. **Reports** (`/admin/lunch/billing/reports`)
- Generate billing reports
- Filter by date range, group, or child
- Export data for accounting

### Parent Access

#### 1. **My Bills** (`/parent/billing`)
- View all your children's bills
- See payment status
- Download billing documents
- View refund information

#### 2. **Bill Details** (`/parent/billing/[id]`)
- View detailed bill information
- See daily charges
- Download documents
- Check refund status

## 🔧 How It Works

### 1. **Lunch Pricing**
- Set prices per group: `/admin/lunch/pricing`
- Prices can vary by group and date
- Effective date determines when price applies

### 2. **Absence Notifications**
- Parents notify absences: `/parent/absences/new`
- Must notify before deadline (configurable)
- Informed absences = refundable
- Uninformed absences = still charged

### 3. **Billing Generation**
- Admin generates bills monthly
- System calculates:
  - Days with lunch orders = billable
  - Informed absences = not charged (refunded next month)
  - Uninformed absences = still charged
- Creates `monthly_billing` and `lunch_billing_items` records

### 4. **Refund Processing**
- Admin processes refunds monthly
- Only informed absences are refundable
- Refunds are applied to next month's bill
- Or can be returned to parent account

## 📋 Quick Checklist

- [ ] Set up lunch pricing (`/admin/lunch/pricing`)
- [ ] Configure billing settings (`/admin/lunch/billing/config`)
- [ ] Generate monthly bills (`/admin/lunch/billing/generate`)
- [ ] Upload billing documents (`/admin/lunch/billing/[id]`)
- [ ] Process refunds (`/admin/lunch/billing/refunds`)
- [ ] Parents can view bills (`/parent/billing`)

## 🚀 Getting Started

1. **First Time Setup:**
   - Go to `/admin/lunch/pricing` and set prices for each group
   - Go to `/admin/lunch/billing/config` and set deadlines
   - Go to `/admin/lunch/billing/generate` and generate bills for current month

2. **Monthly Process:**
   - Generate bills at start of month
   - Upload billing documents
   - Process refunds from previous month
   - Mark bills as paid when received

3. **Parent Actions:**
   - Notify absences before deadline
   - View bills at `/parent/billing`
   - Download documents
   - Check refund status

## 🔍 Troubleshooting

### Bills not generating?
- Check if lunch pricing is set up
- Check if children have lunch orders
- Check billing configuration

### Refunds not showing?
- Ensure absence notifications were submitted before deadline
- Check if refunds have been processed
- Verify billing items are marked as refundable

### Documents not uploading?
- Check if `billing-documents` bucket exists in Storage
- Verify RLS policies are set up (see `STORAGE_BUCKET_SETUP.md`)
