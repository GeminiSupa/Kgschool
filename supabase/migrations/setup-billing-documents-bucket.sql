-- Migration: Setup billing-documents storage bucket with RLS policies
-- This bucket should be PRIVATE (not public) for security

-- Note: Bucket creation must be done manually in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Name: billing-documents
-- Public: NO (unchecked - keep it private)
-- File size limit: 10 MB (or your preference)
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel

-- After creating the bucket manually, run this SQL to set up RLS policies:

-- Enable RLS on the bucket (if not already enabled)
-- Note: RLS is automatically enabled when bucket is created as private

-- Policy: Admins can upload billing documents
DROP POLICY IF EXISTS "Admins can upload billing documents" ON storage.objects;
CREATE POLICY "Admins can upload billing documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'billing-documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admins can update billing documents
DROP POLICY IF EXISTS "Admins can update billing documents" ON storage.objects;
CREATE POLICY "Admins can update billing documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'billing-documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admins can delete billing documents
DROP POLICY IF EXISTS "Admins can delete billing documents" ON storage.objects;
CREATE POLICY "Admins can delete billing documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'billing-documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admins and parents can view billing documents
-- Parents can only view documents for their children's bills
DROP POLICY IF EXISTS "Admins and parents can view billing documents" ON storage.objects;
CREATE POLICY "Admins and parents can view billing documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'billing-documents' AND
  (
    -- Admins can view all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Parents can view if the document path matches their child's billing document
    EXISTS (
      SELECT 1 FROM monthly_billing mb
      JOIN children c ON c.id = mb.child_id
      WHERE mb.document_url = storage.objects.name
        AND auth.uid() = ANY(c.parent_ids)
    )
  )
);
