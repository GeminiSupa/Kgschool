# Supabase Storage Bucket Setup for Billing Documents

## Bucket Configuration

### Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Configure as follows:

**Bucket Name:** `billing-documents`

**Public bucket:** ❌ **NO** (unchecked - keep it **PRIVATE**)

**File size limit:** `10 MB` (or your preference)

**Allowed MIME types:** 
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel .xlsx)
- `application/vnd.ms-excel` (Excel .xls)

### Why Private?

Billing documents contain sensitive financial information and should only be accessible to:
- **Admins** - Can upload, view, and manage all documents
- **Parents** - Can only view documents for their own children's bills

### Setup RLS Policies

After creating the bucket, run the SQL migration:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/setup-billing-documents-bucket.sql
```

This will create RLS policies that:
- Allow admins to upload, update, and delete documents
- Allow admins and parents to view documents (parents only for their children's bills)

## How It Works

1. **Upload**: Admin uploads document → stored in private bucket → file path saved in `monthly_billing.document_url`

2. **Download**: When user requests document:
   - System checks permissions (admin or parent of child)
   - Generates a **signed URL** (valid for 1 hour)
   - User can download using the signed URL

3. **Security**: 
   - Documents are never publicly accessible
   - Signed URLs expire after 1 hour
   - RLS policies enforce access control

## Testing

1. Upload a billing document as admin
2. Try to access the document as a parent (should work for their child's bills)
3. Try to access another parent's document (should fail)
4. Verify signed URLs expire after 1 hour
