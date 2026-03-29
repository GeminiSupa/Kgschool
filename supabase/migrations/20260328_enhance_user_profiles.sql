-- Migration to enhance user profiles and add document management

-- 1. Extend public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create public.employment_details for staff
CREATE TABLE IF NOT EXISTS public.employment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE,
  qualifications TEXT,
  weekly_hours INTEGER,
  contract_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for employment_details
ALTER TABLE public.employment_details ENABLE ROW LEVEL SECURITY;

-- Admins can view and edit all employment details
DROP POLICY IF EXISTS "Admins can manage all employment details" ON public.employment_details;
CREATE POLICY "Admins can manage all employment details"
ON public.employment_details
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Users can view their own employment details
DROP POLICY IF EXISTS "Users can view own employment details" ON public.employment_details;
CREATE POLICY "Users can view own employment details"
ON public.employment_details
FOR SELECT
USING (profile_id = auth.uid());


-- 3. Create public.user_documents for tracking uploaded files
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kita_id UUID REFERENCES public.kitas(id) ON DELETE SET NULL,
  document_type VARCHAR(255) NOT NULL, -- e.g., 'Arbeitsvertrag', 'Gesundheitszeugnis'
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Admins can view and edit all user documents
DROP POLICY IF EXISTS "Admins can manage all user documents" ON public.user_documents;
CREATE POLICY "Admins can manage all user documents"
ON public.user_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Users can view their own documents
DROP POLICY IF EXISTS "Users can view own user documents" ON public.user_documents;
CREATE POLICY "Users can view own user documents"
ON public.user_documents
FOR SELECT
USING (profile_id = auth.uid());


-- 4. Setup Storage Bucket for 'user-documents'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'user-documents' Bucket
-- Admins can read, write, update, delete any file in 'user-documents'
DROP POLICY IF EXISTS "Admins have full access to user-documents" ON storage.objects;
CREATE POLICY "Admins have full access to user-documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Users can read their own files in 'user-documents' (assuming path includes their profile_id)
DROP POLICY IF EXISTS "Users can view their own documents in storage" ON storage.objects;
CREATE POLICY "Users can view their own documents in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
