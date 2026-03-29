-- REGISTER KITA SQL SETUP
-- Run this in your Supabase SQL Editor to ensure the necessary tables exist for the Kita Registration Flow.

-- 1. Create the `kitas` (Tenants) Table
CREATE TABLE IF NOT EXISTS public.kitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for kitas
ALTER TABLE public.kitas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read kitas (useful for the /apply page dropdown)
DROP POLICY IF EXISTS "Anyone can view kitas" ON public.kitas;
CREATE POLICY "Anyone can view kitas" 
ON public.kitas FOR SELECT 
USING (true);

-- ==========================================

-- 2. Create the `profiles` Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent',
  phone TEXT,
  kita_id UUID REFERENCES public.kitas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles can be read by users themselves
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- ==========================================

-- 3. Create the `organization_members` Table
CREATE TABLE IF NOT EXISTS public.organization_members (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  kita_id UUID REFERENCES public.kitas(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (profile_id, kita_id)
);

-- Enable RLS for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
CREATE POLICY "Users can view their own memberships" 
ON public.organization_members FOR SELECT 
USING (auth.uid() = profile_id);

-- ==========================================

-- 4. Enable Supabase Auth Trigger to automatically create a profile if needed
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), 
    'parent'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
