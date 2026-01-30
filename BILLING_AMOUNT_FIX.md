# Fixing Billing Amounts Showing €0.00

## 🔍 Why Amounts Are €0.00

The billing system calculates amounts based on:
1. **Lunch Pricing** - Price per meal for each group
2. **Lunch Orders** - Days when child ordered lunch
3. **Attendance** - Days when child was present (now synced)
4. **Absence Notifications** - Informed vs uninformed absences

If amounts are €0.00, it usually means:
- ❌ No lunch pricing is set up for the child's group
- ❌ No lunch orders exist for that period
- ❌ Child was absent for all days

## ✅ Solutions

### Solution 1: Set Up Lunch Pricing (Recommended)

1. Go to **`/admin/lunch/pricing`**
2. Click **"New Pricing"**
3. Select the group
4. Enter price per meal (e.g., €3.50)
5. Set effective date
6. Save

**Or set price directly on group:**
- Go to `/admin/groups`
- Edit a group
- Set "Lunch Price Per Meal" field
- Save

### Solution 2: Sync with Attendance (Already Implemented)

The billing system now checks attendance:
- ✅ If child was **present** → Bill them (even without order)
- ✅ If child **ordered lunch** → Bill them
- ✅ If child was **absent (uninformed)** → Bill them
- ✅ If child was **absent (informed)** → Don't bill (refundable)

### Solution 3: Manually Edit Amounts

1. Go to billing list: `/admin/lunch/billing`
2. Click on a bill to view details
3. Click **"✏️ Edit Amount"** button
4. Enter the correct total amount
5. Save

## 🔧 How Billing Works Now

### Automatic Calculation:
1. **For each day in the month:**
   - Check if child ordered lunch → Bill
   - Check if child was present (attendance) → Bill
   - Check if informed absence → Don't bill (refund next month)
   - Otherwise → Bill (uninformed absence)

2. **Price lookup:**
   - First: Check `groups.lunch_price_per_meal`
   - Second: Check `lunch_pricing` table for group
   - If both are 0/null → Amount will be €0.00

3. **Total calculation:**
   - Sum of all billable days × price per meal
   - Minus refundable days (informed absences)

## 📋 Quick Checklist

- [ ] Set lunch pricing for all groups (`/admin/lunch/pricing`)
- [ ] Verify attendance is being recorded
- [ ] Generate bills (`/admin/lunch/billing/generate`)
- [ ] Check if amounts are correct
- [ ] Manually adjust if needed (`Edit Amount` button)

## 🎯 Best Practice Workflow

1. **Before month starts:**
   - Set lunch pricing for all groups
   - Verify pricing is correct

2. **During the month:**
   - Parents order lunches
   - Attendance is recorded
   - Parents notify absences (if needed)

3. **At month end:**
   - Generate bills (`/admin/lunch/billing/generate`)
   - Review amounts
   - Manually adjust if needed
   - Upload billing documents
   - Mark as paid when received

4. **Next month:**
   - Process refunds for informed absences
   - Generate new bills

## ⚠️ Important Notes

- **Pricing must be set** before generating bills
- **Attendance sync** helps catch days when child was present but didn't order
- **Manual adjustment** is available if automatic calculation is wrong
- **Zero amounts** are highlighted in red with warning icons
