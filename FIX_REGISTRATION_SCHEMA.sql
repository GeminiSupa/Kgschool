-- SQL to set up Multi-Tenant Architecture (Organizations & Kitas)
-- Run this in your Supabase SQL Editor if you get the "Failed to create organization" error.

-- 1. Organizations table (Träger)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address JSONB,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kitas table (Locations)
CREATE TABLE IF NOT EXISTS public.kitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB,
  phone TEXT,
  email TEXT,
  capacity_total INTEGER,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Organization members (Linking users to Orgs and Kitas)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kita_id UUID REFERENCES public.kitas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, profile_id),
  UNIQUE(kita_id, profile_id)
);

-- 4. Ensure profiles has default_kita_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_kita_id UUID REFERENCES public.kitas(id) ON DELETE SET NULL;
