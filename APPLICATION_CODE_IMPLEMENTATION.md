# Application Code Implementation - Status

## ✅ Completed

### 1. Billing Generation Updates
**File:** `server/api/admin/lunch/billing/generate.post.ts`

**Features Added:**
- ✅ Support for flat_monthly billing type
- ✅ Cancellation deadline checking (from `lunch_settings`)
- ✅ Contract-based billing (checks `child_contracts`)
- ✅ Enhanced billing reasons tracking:
  - `present` - Child was present
  - `ordered` - Lunch was ordered
  - `cancellation_after_deadline` - Cancelled too late
  - `flat_rate_allocation` - Monthly flat rate
  - `uninformed_absence` - Absent without notification
- ✅ Cancellation timestamp tracking
- ✅ Grace period support

**Logic:**
1. Checks child's contract for billing type
2. If `flat_monthly`: Creates single billing item with flat rate
3. If `per_meal` or `hybrid`: Calculates day-by-day
4. Checks `lunch_settings` for cancellation deadline
5. Validates cancellation timestamps against deadline
6. Tracks all billing reasons for transparency

### 2. Stores Created
- ✅ `stores/applications.ts` - Application and waitlist management
- ✅ `stores/contracts.ts` - Child contract management
- ✅ `stores/consents.ts` - DSGVO consent management

### 3. Pages Created

#### Public Pages
- ✅ `/apply` - Public application form
  - Child information
  - Betreuungsumfang selection
  - Parent information
  - Kita selection

#### Admin Pages
- ✅ `/admin/applications` - Application management
  - List all applications
  - Filter by status
  - Update application status (offer, accept, reject)
  - View application details
  
- ✅ `/admin/consents` - Consent management (DSGVO)
  - View all consents
  - Filter by child
  - Grant/revoke consents
  - Track consent history

- ✅ `/admin/contracts` - Contract management
  - List all contracts
  - Filter by status
  - View contract details
  - Create/edit contracts

## 📋 Still To Do

### 1. Staff Management Pages
**Priority:** Medium

**Pages Needed:**
- `/admin/staff/qualifications` - Manage staff qualifications
- `/admin/staff/rota` - Daily staff assignments
- `/admin/staff/schedules` - Employment schedules

**Features:**
- Add/edit qualifications
- Track certificate expiry
- Daily rota management
- Betreuungsschlüssel calculation
- Replacement staff tracking

### 2. Additional Application Pages
**Priority:** Medium

**Pages Needed:**
- `/admin/applications/[id]` - Application detail view
- `/admin/applications/waitlist` - Waitlist management
- `/apply/status` - Public status check (with application number)

### 3. Contract Pages
**Priority:** Medium

**Pages Needed:**
- `/admin/contracts/new` - Create new contract
- `/admin/contracts/[id]` - Contract detail view
- `/admin/contracts/[id]/edit` - Edit contract

### 4. Parent Consent View
**Priority:** Low

**Pages Needed:**
- `/parent/consents` - Parents can view/manage their children's consents

### 5. Query Updates for kita_id
**Priority:** High

**Files to Update:**
- All existing queries need `kita_id` filters
- Update RLS checks to use kita membership
- Add kita_id to all child/group queries

**Example:**
```typescript
// Before
const { data } = await supabase
  .from('children')
  .select('*')
  .eq('status', 'active')

// After
const { data } = await supabase
  .from('children')
  .select('*')
  .eq('status', 'active')
  .eq('kita_id', userKitaId) // Add kita filter
```

## 🔧 Implementation Notes

### Billing Generation Logic

The updated billing generation now:

1. **Checks Contract First:**
   ```typescript
   const contract = await getChildContract(child.id)
   const billingType = contract?.lunch_billing_type || 'per_meal'
   ```

2. **Flat Monthly:**
   - Creates single billing item
   - Uses `lunch_flat_rate_amount` from contract
   - No day-by-day calculation

3. **Per-Meal with Deadlines:**
   - Checks `lunch_settings` for deadline time
   - Validates cancellation timestamps
   - Applies grace period
   - Tracks `cancellation_deadline_met`

4. **Billing Reasons:**
   - All items have `billing_reason` field
   - Transparent tracking for parents
   - Supports audit trails

### Application Flow

1. **Public Application:**
   - Parent fills form at `/apply`
   - Creates application with status `new`
   - No login required

2. **Admin Review:**
   - Admin views at `/admin/applications`
   - Can change status: `under_review` → `offered` → `accepted`
   - When accepted, create child and contract

3. **Waitlist:**
   - Applications can be added to waitlist
   - Position tracking
   - Priority scoring

### Consent Management

1. **Consent Types:**
   - Photo/Video
   - Messaging
   - Emergency Data
   - Third-Party Tools
   - Data Processing
   - Publication

2. **Workflow:**
   - Admin or parent grants consent
   - Timestamp recorded
   - Can be revoked (with timestamp)
   - Full audit trail

### Contract Management

1. **Contract Fields:**
   - Betreuungsumfang (25/35/45/Ganztag/Halbtag)
   - Fee category (standard/reduced/waived/subsidized)
   - Lunch billing type
   - Subsidy information
   - Date ranges

2. **Auto-Generated:**
   - Contract numbers (CT-YYYY-####)
   - Links to billing system

## 🚀 Next Steps

1. **Update Existing Queries** (High Priority)
   - Add kita_id filters everywhere
   - Update RLS checks
   - Test multi-tenant isolation

2. **Complete Staff Management** (Medium Priority)
   - Create qualification pages
   - Build rota management
   - Add schedule views

3. **Complete Application Flow** (Medium Priority)
   - Detail pages
   - Waitlist management
   - Status check for parents

4. **Testing** (High Priority)
   - Test billing with flat rates
   - Test cancellation deadlines
   - Test multi-tenant isolation
   - Test consent workflows

## 📝 Files Modified/Created

### Modified
- `server/api/admin/lunch/billing/generate.post.ts` - Enhanced billing logic

### Created
- `stores/applications.ts`
- `stores/contracts.ts`
- `stores/consents.ts`
- `pages/apply.vue`
- `pages/admin/applications/index.vue`
- `pages/admin/consents/index.vue`
- `pages/admin/contracts/index.vue`

## ⚠️ Important Notes

1. **kita_id Required:**
   - All new queries must include kita_id
   - Existing queries need updates
   - RLS policies enforce kita isolation

2. **Billing Changes:**
   - Flat rates bypass day-by-day calculation
   - Cancellation deadlines are enforced
   - All billing items have reasons

3. **DSGVO Compliance:**
   - All consents are tracked
   - Timestamps for grant/revoke
   - Full audit trail available

4. **Multi-Tenant:**
   - Each kita is isolated
   - Users belong to specific kita
   - RLS enforces separation
