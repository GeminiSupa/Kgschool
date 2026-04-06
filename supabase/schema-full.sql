-- =============================================================================
-- KG School — consolidated schema (single file). Built by supabase/build-schema-full.sh
-- 2026-04-06T12:57:39Z
-- Run: reset-public-schema.sql then this file once.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- >>> FILE: supabase/schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'kitchen', 'support')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age_range TEXT NOT NULL, -- e.g., "U3", "Ü3"
  educator_id UUID REFERENCES profiles(id),
  capacity INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  group_id UUID REFERENCES groups(id),
  parent_ids UUID[] DEFAULT ARRAY[]::UUID[],
  photo_url TEXT,
  enrollment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_pickup')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, date)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  group_id UUID REFERENCES groups(id),
  educator_id UUID REFERENCES profiles(id),
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lunch menus table
CREATE TABLE IF NOT EXISTS lunch_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  meal_name TEXT NOT NULL,
  description TEXT,
  allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
  nutritional_info JSONB DEFAULT '{}'::JSONB,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Lunch orders table
CREATE TABLE IF NOT EXISTS lunch_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES lunch_menus(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'prepared', 'served')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, menu_id)
);

-- Allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  allergen_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  items JSONB DEFAULT '[]'::JSONB,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_group_id ON children(group_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_ids ON children USING GIN(parent_ids);
CREATE INDEX IF NOT EXISTS idx_attendance_child_date ON attendance(child_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_child ON lunch_orders(child_id);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_menu ON lunch_orders(menu_id);
CREATE INDEX IF NOT EXISTS idx_allergies_child ON allergies(child_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Drop existing policies first to allow re-running this script
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Idempotent: allow re-running this script without "policy already exists"
DROP POLICY IF EXISTS "Parents can view their own children" ON children;
DROP POLICY IF EXISTS "Admins can manage all children" ON children;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can view menus" ON lunch_menus;
DROP POLICY IF EXISTS "Kitchen staff and admins can manage menus" ON lunch_menus;
DROP POLICY IF EXISTS "Parents can view and manage their children's orders" ON lunch_orders;
DROP POLICY IF EXISTS "Parents can view their children's allergies" ON allergies;

-- Children policies
CREATE POLICY "Parents can view their own children" ON children
  FOR SELECT USING (
    auth.uid() = ANY(parent_ids) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Admins can manage all children" ON children
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Groups policies
CREATE POLICY "Authenticated users can view groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Attendance policies
CREATE POLICY "Parents can view their children's attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = attendance.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Teachers and admins can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Lunch menus policies
CREATE POLICY "Authenticated users can view menus" ON lunch_menus
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Kitchen staff and admins can manage menus" ON lunch_menus
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

-- Lunch orders policies
CREATE POLICY "Parents can view and manage their children's orders" ON lunch_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = lunch_orders.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

-- Allergies policies
CREATE POLICY "Parents can view their children's allergies" ON allergies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = allergies.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Functions and triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/schema-educational.sql

-- Educational Features Schema
-- Run this after the main schema.sql

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  age_range TEXT NOT NULL, -- e.g., "U3", "Ü3"
  teacher_id UUID REFERENCES profiles(id),
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, group_id, day_of_week, start_time)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  assigned_to_group_id UUID REFERENCES groups(id),
  assigned_to_children UUID[] DEFAULT ARRAY[]::UUID[],
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  assigned_to_group_id UUID REFERENCES groups(id),
  max_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table (for assignments and exams)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5, 2),
  feedback TEXT,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, child_id),
  UNIQUE(exam_id, child_id),
  CHECK (
    (assignment_id IS NOT NULL AND exam_id IS NULL) OR
    (assignment_id IS NULL AND exam_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_group ON courses(group_id);
CREATE INDEX IF NOT EXISTS idx_timetables_course ON timetables(course_id);
CREATE INDEX IF NOT EXISTS idx_timetables_group ON timetables(group_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(assigned_to_group_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_group ON exams(assigned_to_group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_child ON submissions(child_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Courses policies
CREATE POLICY "Authenticated users can view courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can manage their courses" ON courses
  FOR ALL USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Timetables policies
CREATE POLICY "Authenticated users can view timetables" ON timetables
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can manage timetables" ON timetables
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Assignments policies
CREATE POLICY "Parents can view assignments for their children" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE (children.group_id = assignments.assigned_to_group_id OR children.id = ANY(assignments.assigned_to_children))
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Teachers and admins can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Exams policies
CREATE POLICY "Parents can view exams for their children" ON exams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.group_id = exams.assigned_to_group_id
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Teachers and admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Submissions policies
CREATE POLICY "Parents can view their children's submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = submissions.child_id
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Teachers and admins can manage submissions" ON submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/schema-kita-features.sql

-- Kindergarten (Kita) Features Schema
-- This replaces school-oriented features (courses, assignments, exams, timetables)
-- Run this after the main schema.sql

-- Observations table (Beobachtungen)
-- Teachers document observations about individual children
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  observer_id UUID NOT NULL REFERENCES profiles(id),
  observation_date DATE NOT NULL,
  context TEXT, -- Where/when the observation took place
  description TEXT NOT NULL, -- What was observed
  development_area TEXT, -- e.g., "Social", "Motor", "Language", "Cognitive", "Emotional"
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Reports table (Tagesberichte)
-- Group daily reports shared with parents
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  educator_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- What happened today
  activities TEXT[], -- List of activities done
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  weather TEXT, -- Weather information
  special_events TEXT, -- Any special events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, report_date)
);

-- Development Documentation table (Entwicklungsdokumentation)
-- Track child development milestones and progress
CREATE TABLE IF NOT EXISTS development_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  documented_by UUID NOT NULL REFERENCES profiles(id),
  documentation_date DATE NOT NULL,
  development_area TEXT NOT NULL, -- "Social", "Motor", "Language", "Cognitive", "Emotional", "Creative"
  milestone TEXT NOT NULL, -- What milestone/achievement
  description TEXT, -- Detailed description
  evidence TEXT[], -- Photos, videos, or other evidence
  next_steps TEXT, -- What to work on next
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table (Portfolios)
-- Collection of child's work, photos, and achievements
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  portfolio_type TEXT NOT NULL CHECK (portfolio_type IN ('artwork', 'photo', 'achievement', 'activity', 'milestone', 'other')),
  content TEXT, -- Description of the portfolio item
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[], -- Photos, documents
  date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Routines table (Tagesablauf)
-- Daily routine schedule for groups (NOT class schedules)
CREATE TABLE IF NOT EXISTS daily_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  routine_name TEXT NOT NULL, -- e.g., "Morning Circle", "Free Play", "Nap Time"
  start_time TIME NOT NULL,
  end_time TIME,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- NULL = every day, 0=Sunday, 6=Saturday
  description TEXT,
  location TEXT, -- e.g., "Indoor", "Outdoor", "Gym", "Room 1"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Themes table (Bildungsbereiche/Themen)
-- Project themes and learning areas (NOT subjects like Math/Science)
CREATE TABLE IF NOT EXISTS learning_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id),
  title TEXT NOT NULL, -- e.g., "Nature", "Art", "Music", "Movement", "Language"
  description TEXT,
  start_date DATE,
  end_date DATE,
  educator_id UUID REFERENCES profiles(id),
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  activities TEXT[], -- Activities related to this theme
  learning_areas TEXT[], -- Which development areas this theme covers
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'planned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nap/Rest Records table (Ruhezeiten)
-- Track which children napped and for how long
CREATE TABLE IF NOT EXISTS nap_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  nap_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  notes TEXT, -- e.g., "slept well", "restless", "didn't sleep"
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, nap_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_observations_child ON observations(child_id);
CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_observations_observer ON observations(observer_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_group ON daily_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_development_docs_child ON development_docs(child_id);
CREATE INDEX IF NOT EXISTS idx_development_docs_date ON development_docs(documentation_date);
CREATE INDEX IF NOT EXISTS idx_portfolios_child ON portfolios(child_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_date ON portfolios(date);
CREATE INDEX IF NOT EXISTS idx_daily_routines_group ON daily_routines(group_id);
CREATE INDEX IF NOT EXISTS idx_learning_themes_group ON learning_themes(group_id);
CREATE INDEX IF NOT EXISTS idx_learning_themes_status ON learning_themes(status);
CREATE INDEX IF NOT EXISTS idx_nap_records_child ON nap_records(child_id);
CREATE INDEX IF NOT EXISTS idx_nap_records_date ON nap_records(nap_date);

-- Enable RLS
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nap_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist, then create new ones

-- Observations policies
DROP POLICY IF EXISTS "Parents can view observations for their children" ON observations;
CREATE POLICY "Parents can view observations for their children" ON observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = observations.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can create observations" ON observations;
CREATE POLICY "Teachers and admins can create observations" ON observations
  FOR INSERT WITH CHECK (
    auth.uid() = observer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can update observations" ON observations;
CREATE POLICY "Teachers and admins can update observations" ON observations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Daily Reports policies
DROP POLICY IF EXISTS "Parents can view daily reports for their children's groups" ON daily_reports;
CREATE POLICY "Parents can view daily reports for their children's groups" ON daily_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.group_id = daily_reports.group_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON daily_reports;
CREATE POLICY "Teachers and admins can manage daily reports" ON daily_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Development Documentation policies
DROP POLICY IF EXISTS "Parents can view development docs for their children" ON development_docs;
CREATE POLICY "Parents can view development docs for their children" ON development_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = development_docs.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can manage development docs" ON development_docs;
CREATE POLICY "Teachers and admins can manage development docs" ON development_docs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Portfolios policies
DROP POLICY IF EXISTS "Parents can view portfolios for their children" ON portfolios;
CREATE POLICY "Parents can view portfolios for their children" ON portfolios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = portfolios.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can manage portfolios" ON portfolios;
CREATE POLICY "Teachers and admins can manage portfolios" ON portfolios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Daily Routines policies
DROP POLICY IF EXISTS "Authenticated users can view daily routines" ON daily_routines;
CREATE POLICY "Authenticated users can view daily routines" ON daily_routines
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers and admins can manage daily routines" ON daily_routines;
CREATE POLICY "Teachers and admins can manage daily routines" ON daily_routines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Learning Themes policies
DROP POLICY IF EXISTS "Parents can view learning themes for their children's groups" ON learning_themes;
CREATE POLICY "Parents can view learning themes for their children's groups" ON learning_themes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.group_id = learning_themes.group_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can manage learning themes" ON learning_themes;
CREATE POLICY "Teachers and admins can manage learning themes" ON learning_themes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Nap Records policies
DROP POLICY IF EXISTS "Parents can view nap records for their children" ON nap_records;
CREATE POLICY "Parents can view nap records for their children" ON nap_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = nap_records.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Teachers and admins can manage nap records" ON nap_records;
CREATE POLICY "Teachers and admins can manage nap records" ON nap_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Triggers for updated_at
-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_observations_updated_at ON observations;
CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON daily_reports;
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_development_docs_updated_at ON development_docs;
CREATE TRIGGER update_development_docs_updated_at BEFORE UPDATE ON development_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_routines_updated_at ON daily_routines;
CREATE TRIGGER update_daily_routines_updated_at BEFORE UPDATE ON daily_routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_themes_updated_at ON learning_themes;
CREATE TRIGGER update_learning_themes_updated_at BEFORE UPDATE ON learning_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/schema-leave-requests.sql

-- Migration: Add leave requests and absence submissions tables
-- This migration adds support for parent leave requests and teacher absence submissions

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'other')),
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Absence submissions table
CREATE TABLE IF NOT EXISTS absence_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify attendance table to link to leave requests and absence submissions
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS leave_request_id UUID REFERENCES leave_requests(id),
  ADD COLUMN IF NOT EXISTS absence_submission_id UUID REFERENCES absence_submissions(id);

-- Modify lunch_orders table for German Kita billing model
ALTER TABLE lunch_orders
  ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS deadline_passed BOOLEAN DEFAULT FALSE;

-- Update lunch_orders status check constraint to include 'cancelled'
ALTER TABLE lunch_orders DROP CONSTRAINT IF EXISTS lunch_orders_status_check;
ALTER TABLE lunch_orders 
  ADD CONSTRAINT lunch_orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'prepared', 'served', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_child ON leave_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_parent ON leave_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absence_submissions_attendance ON absence_submissions(attendance_id);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_auto_created ON lunch_orders(auto_created);
CREATE INDEX IF NOT EXISTS idx_attendance_leave_request ON attendance(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_attendance_absence_submission ON attendance(absence_submission_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_submissions ENABLE ROW LEVEL SECURITY;

-- Leave requests policies
CREATE POLICY "Parents can view their own leave requests" ON leave_requests
  FOR SELECT USING (
    auth.uid() = parent_id OR
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = leave_requests.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Parents can create leave requests for their children" ON leave_requests
  FOR INSERT WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = leave_requests.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Admins can update leave requests" ON leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Absence submissions policies
CREATE POLICY "Teachers and admins can view absence submissions" ON absence_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')) OR
    EXISTS (
      SELECT 1 FROM attendance 
      JOIN children ON children.id = attendance.child_id
      WHERE attendance.id = absence_submissions.attendance_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins can create absence submissions" ON absence_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Update lunch_orders policies to allow cancellation
CREATE POLICY "Parents can cancel their children's orders before deadline" ON lunch_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = lunch_orders.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Function to update updated_at timestamp for leave_requests
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/migrations/add-german-kita-features.sql

-- Migration: Add German Kita Features
-- This migration adds multi-tenant architecture, contracts, waitlist, DSGVO compliance, and German-specific features

-- ============================================================================
-- 1. MULTI-TENANT ARCHITECTURE (Organizations & Kitas)
-- ============================================================================

-- Organizations table (Träger)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Kitas table (locations)
CREATE TABLE IF NOT EXISTS kitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB,
  phone TEXT,
  email TEXT,
  capacity_total INTEGER,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members (who belongs to which organization/kita)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('super_admin', 'admin', 'manager', 'staff', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, profile_id),
  UNIQUE(kita_id, profile_id)
);

-- Add organization_id and kita_id to existing tables
ALTER TABLE groups ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_kita_id UUID REFERENCES kitas(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CONTRACTS & BETREUUNGSUMFANG
-- ============================================================================

-- Child contracts table
CREATE TABLE IF NOT EXISTS child_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  betreuung_hours_type TEXT NOT NULL CHECK (betreuung_hours_type IN ('25', '35', '45', 'ganztag', 'halbtag')),
  fee_category TEXT NOT NULL CHECK (fee_category IN ('standard', 'reduced', 'waived', 'subsidized')),
  lunch_obligation BOOLEAN DEFAULT TRUE,
  lunch_billing_type TEXT NOT NULL DEFAULT 'per_meal' CHECK (lunch_billing_type IN ('flat_monthly', 'per_meal', 'hybrid')),
  lunch_flat_rate_amount DECIMAL(10, 2),
  subsidy_type TEXT CHECK (subsidy_type IN ('BuT', 'BremenPass', 'Geschwisterrabatt', 'Landeszuschuss', 'other')),
  subsidy_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, start_date)
);

-- ============================================================================
-- 3. WAITLIST & APPLICATIONS
-- ============================================================================

-- Applications table (before enrollment)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  child_first_name TEXT NOT NULL,
  child_last_name TEXT NOT NULL,
  child_date_of_birth DATE NOT NULL,
  preferred_start_date DATE NOT NULL,
  betreuung_hours_type TEXT NOT NULL CHECK (betreuung_hours_type IN ('25', '35', '45', 'ganztag', 'halbtag')),
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  address JSONB,
  priority_kita_ids UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'offered', 'accepted', 'rejected', 'withdrawn')),
  offered_place_date DATE,
  accepted_date DATE,
  rejected_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist positions
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  priority_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. IMPROVED LUNCH BILLING (Flat Rates & Cancellation Deadlines)
-- ============================================================================

-- Lunch settings per kita
CREATE TABLE IF NOT EXISTS lunch_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  cancellation_deadline_time TIME NOT NULL DEFAULT '08:00:00',
  grace_minutes INTEGER DEFAULT 0,
  default_billing_type TEXT NOT NULL DEFAULT 'per_meal' CHECK (default_billing_type IN ('flat_monthly', 'per_meal', 'hybrid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kita_id)
);

-- Food flat rates (monthly fixed amounts)
CREATE TABLE IF NOT EXISTS food_flat_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  age_range TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- lunch_billing_items extra columns: applied in add-lunch-billing.sql (after CREATE TABLE)

-- ============================================================================
-- 5. DSGVO COMPLIANCE (Consents, Data Retention, Access Logs)
-- ============================================================================

-- Consents table
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('photo', 'messaging', 'emergency_data', 'third_party_tools', 'data_processing', 'publication')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, consent_type)
);

-- Data retention settings
CREATE TABLE IF NOT EXISTS data_retention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('child_data', 'attendance', 'billing', 'photos', 'reports')),
  retention_years INTEGER NOT NULL DEFAULT 10,
  anonymize_after_years INTEGER,
  auto_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kita_id, data_type)
);

-- Access logs (who accessed what data)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('child', 'attendance', 'billing', 'contract', 'application', 'parent_work')),
  resource_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. PARENT WORK AS QUOTA SYSTEM
-- ============================================================================

-- Parent work quota (required hours per year)
CREATE TABLE IF NOT EXISTS parent_work_quota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  required_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
  completed_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
  remaining_hours DECIMAL(5, 2) GENERATED ALWAYS AS (required_hours - completed_hours) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- parent_work_tasks / parent_work_submissions extra columns: applied in add-parent-work-system.sql
-- (those tables are created there; parent_work_quota above must exist first for submission FKs)

-- ============================================================================
-- 7. STAFF MANAGEMENT (Qualifications, Schedules, Betreuungsschlüssel)
-- ============================================================================

-- Staff qualifications
CREATE TABLE IF NOT EXISTS staff_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_type TEXT NOT NULL CHECK (qualification_type IN ('Erzieher', 'Kinderpfleger', 'Heilpädagoge', 'Fachkraft', 'Praktikant', 'other')),
  certificate_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff schedules (Vollzeit/Teilzeit, Stundenumfang)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kita_id UUID NOT NULL REFERENCES kitas(id) ON DELETE CASCADE,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('vollzeit', 'teilzeit', 'minijob')),
  weekly_hours DECIMAL(4, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  group_assignments UUID[] DEFAULT ARRAY[]::UUID[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff rota (daily assignments)
CREATE TABLE IF NOT EXISTS staff_rota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_absence BOOLEAN DEFAULT FALSE,
  absence_type TEXT CHECK (absence_type IN ('sick', 'vacation', 'training', 'other')),
  replacement_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, group_id, date)
);

-- Betreuungsschlüssel tracking (staff-child ratio per group)
CREATE TABLE IF NOT EXISTS care_ratios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  staff_count INTEGER NOT NULL,
  child_count INTEGER NOT NULL,
  ratio DECIMAL(4, 2) GENERATED ALWAYS AS (CASE WHEN child_count > 0 THEN staff_count::DECIMAL / child_count ELSE 0 END) STORED,
  target_ratio DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, date)
);

-- ============================================================================
-- 8. CHILD GUARDIANS (Better than parent_ids array)
-- ============================================================================

-- Child guardians table (replaces parent_ids array for better RLS)
CREATE TABLE IF NOT EXISTS child_guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('parent', 'step_parent', 'legal_guardian', 'grandparent', 'other')),
  is_primary BOOLEAN DEFAULT FALSE,
  has_custody BOOLEAN DEFAULT TRUE,
  custody_notes TEXT,
  emergency_contact BOOLEAN DEFAULT FALSE,
  can_pickup BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, guardian_id)
);

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_groups_kita_id ON groups(kita_id);
CREATE INDEX IF NOT EXISTS idx_children_kita_id ON children(kita_id);
-- Note: attendance already has index on (child_id, date) from schema.sql
-- Additional index for kita-based queries can be created via join if needed
CREATE INDEX IF NOT EXISTS idx_contracts_child_kita ON child_contracts(child_id, kita_id);
CREATE INDEX IF NOT EXISTS idx_applications_kita_status ON applications(kita_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_kita_position ON waitlist(kita_id, position);
CREATE INDEX IF NOT EXISTS idx_consents_child_type ON consents(child_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_resource ON access_logs(user_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_rota_group_date ON staff_rota(group_id, date);
CREATE INDEX IF NOT EXISTS idx_care_ratios_group_date ON care_ratios(group_id, date);
CREATE INDEX IF NOT EXISTS idx_child_guardians_child ON child_guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_child_guardians_guardian ON child_guardians(guardian_id);

-- ============================================================================
-- 10. RLS POLICIES FOR MULTI-TENANT SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_flat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_guardians ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's kita_id
CREATE OR REPLACE FUNCTION get_user_kita_id(user_id UUID)
RETURNS UUID AS $$
  SELECT kita_id FROM organization_members WHERE profile_id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user belongs to kita
CREATE OR REPLACE FUNCTION user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE profile_id = user_id AND kita_id = target_kita_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: Super admins can manage all, org admins can manage their org
CREATE POLICY "Super admins can manage all organizations" ON organizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Kitas: Users can view/manage kitas they belong to
CREATE POLICY "Users can view kitas they belong to" ON kitas
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage kitas they belong to" ON kitas
  FOR ALL USING (
    user_belongs_to_kita(auth.uid(), id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Organization members: Users can view members of their kita
CREATE POLICY "Users can view members of their kita" ON organization_members
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Child contracts: Users can view contracts for children in their kita
CREATE POLICY "Users can view contracts in their kita" ON child_contracts
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    EXISTS (SELECT 1 FROM child_guardians WHERE child_id = child_contracts.child_id AND guardian_id = auth.uid())
  );

-- Applications: Parents can view their own, staff can view in their kita
CREATE POLICY "Users can view applications in their kita" ON applications
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), kita_id) OR
    parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Consents: Parents can view their children's consents, staff in their kita
CREATE POLICY "Users can view consents in their kita" ON consents
  FOR SELECT USING (
    user_belongs_to_kita(auth.uid(), (SELECT kita_id FROM children WHERE id = consents.child_id)) OR
    EXISTS (SELECT 1 FROM child_guardians WHERE child_id = consents.child_id AND guardian_id = auth.uid())
  );

-- Access logs: Users can view their own logs, admins can view all in their kita
CREATE POLICY "Users can view their own access logs" ON access_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') AND
     EXISTS (SELECT 1 FROM children WHERE id = access_logs.resource_id AND kita_id = get_user_kita_id(auth.uid())))
  );

-- Child guardians: Parents can view their own, staff can view in their kita
CREATE POLICY "Users can view guardians in their kita" ON child_guardians
  FOR SELECT USING (
    guardian_id = auth.uid() OR
    user_belongs_to_kita(auth.uid(), (SELECT kita_id FROM children WHERE id = child_guardians.child_id))
  );

-- ============================================================================
-- 11. TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- parent_work_quota trigger on parent_work_submissions: see add-parent-work-system.sql
-- (parent_work_submissions is created there)

-- Auto-create access log on sensitive operations
CREATE OR REPLACE FUNCTION log_child_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' THEN
    INSERT INTO access_logs (user_id, resource_type, resource_id, action)
    VALUES (auth.uid(), 'child', NEW.id, 'view');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Access logging for SELECT requires views or application-level logging
-- This is a placeholder - implement in application code for better control

-- ============================================================================
-- 12. MIGRATION HELPERS (Backfill existing data)
-- ============================================================================

-- Function to create default kita for existing data
CREATE OR REPLACE FUNCTION create_default_kita_for_existing_data()
RETURNS UUID AS $$
DECLARE
  default_org_id UUID;
  default_kita_id UUID;
BEGIN
  -- Create default organization
  INSERT INTO organizations (name, legal_name)
  VALUES ('Default Organization', 'Default Organization')
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_org_id;
  
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id FROM organizations LIMIT 1;
  END IF;
  
  -- Create default kita
  INSERT INTO kitas (organization_id, name, capacity_total)
  VALUES (default_org_id, 'Default Kita', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_kita_id;
  
  IF default_kita_id IS NULL THEN
    SELECT id INTO default_kita_id FROM kitas LIMIT 1;
  END IF;
  
  -- Update existing groups and children
  UPDATE groups SET kita_id = default_kita_id WHERE kita_id IS NULL;
  UPDATE children SET kita_id = default_kita_id WHERE kita_id IS NULL;
  
  RETURN default_kita_id;
END;
$$ LANGUAGE plpgsql;

-- Run migration helper (comment out after first run)
-- SELECT create_default_kita_for_existing_data();

-- >>> FILE: supabase/migrations/20260328_enhance_user_profiles.sql

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

-- >>> FILE: supabase/migrations/20260327_add_compliance_audit_and_data_requests.sql

-- Compliance schema for municipal/public-sector readiness.
-- Adds:
-- 1) consent event logging
-- 2) immutable-style audit/security event log
-- 3) data subject rights request tracking (DSR)

create extension if not exists pgcrypto;

create table if not exists public.compliance_consent_events (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  subject_profile_id uuid null references public.profiles(id) on delete set null,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  consent_type text not null,
  legal_basis text null,
  status text not null check (status in ('granted', 'withdrawn', 'expired')),
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_consent_events_kita_id
  on public.compliance_consent_events (kita_id);
create index if not exists idx_compliance_consent_events_subject
  on public.compliance_consent_events (subject_profile_id);
create index if not exists idx_compliance_consent_events_type_status
  on public.compliance_consent_events (consent_type, status);

create table if not exists public.compliance_audit_events (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  actor_role text null,
  event_type text not null,
  resource_type text null,
  resource_id text null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  message text null,
  ip_address text null,
  user_agent text null,
  event_data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_audit_events_kita_id
  on public.compliance_audit_events (kita_id);
create index if not exists idx_compliance_audit_events_type
  on public.compliance_audit_events (event_type);
create index if not exists idx_compliance_audit_events_occurred_at
  on public.compliance_audit_events (occurred_at desc);
create index if not exists idx_compliance_audit_events_severity
  on public.compliance_audit_events (severity);

create table if not exists public.compliance_data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  requester_profile_id uuid null references public.profiles(id) on delete set null,
  request_type text not null check (request_type in ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  status text not null default 'new' check (status in ('new', 'in_review', 'completed', 'rejected')),
  request_channel text not null default 'portal',
  details text null,
  due_date date null,
  resolved_at timestamptz null,
  resolved_by_profile_id uuid null references public.profiles(id) on delete set null,
  resolution_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compliance_dsr_kita_id
  on public.compliance_data_subject_requests (kita_id);
create index if not exists idx_compliance_dsr_requester
  on public.compliance_data_subject_requests (requester_profile_id);
create index if not exists idx_compliance_dsr_status
  on public.compliance_data_subject_requests (status);
create index if not exists idx_compliance_dsr_due_date
  on public.compliance_data_subject_requests (due_date);

create or replace function public.set_compliance_dsr_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_compliance_dsr_updated_at on public.compliance_data_subject_requests;
create trigger trg_compliance_dsr_updated_at
before update on public.compliance_data_subject_requests
for each row
execute function public.set_compliance_dsr_updated_at();

alter table public.compliance_consent_events enable row level security;
alter table public.compliance_audit_events enable row level security;
alter table public.compliance_data_subject_requests enable row level security;

drop policy if exists "consent_admin_all" on public.compliance_consent_events;
create policy "consent_admin_all"
on public.compliance_consent_events
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "consent_subject_read_own" on public.compliance_consent_events;
create policy "consent_subject_read_own"
on public.compliance_consent_events
for select
to authenticated
using (subject_profile_id = auth.uid());

drop policy if exists "consent_authenticated_insert" on public.compliance_consent_events;
create policy "consent_authenticated_insert"
on public.compliance_consent_events
for insert
to authenticated
with check (true);

drop policy if exists "audit_admin_read" on public.compliance_audit_events;
create policy "audit_admin_read"
on public.compliance_audit_events
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "audit_authenticated_insert" on public.compliance_audit_events;
create policy "audit_authenticated_insert"
on public.compliance_audit_events
for insert
to authenticated
with check (actor_profile_id is null or actor_profile_id = auth.uid());

drop policy if exists "dsr_admin_all" on public.compliance_data_subject_requests;
create policy "dsr_admin_all"
on public.compliance_data_subject_requests
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "dsr_requester_read_own" on public.compliance_data_subject_requests;
create policy "dsr_requester_read_own"
on public.compliance_data_subject_requests
for select
to authenticated
using (requester_profile_id = auth.uid());

drop policy if exists "dsr_requester_insert_own" on public.compliance_data_subject_requests;
create policy "dsr_requester_insert_own"
on public.compliance_data_subject_requests
for insert
to authenticated
with check (requester_profile_id = auth.uid());


-- >>> FILE: supabase/migrations/add-academic-calendar.sql

-- Migration: Add Academic Calendar for Holidays and Vacations
-- Only admins can manage holidays/vacations

-- Academic calendar table
CREATE TABLE IF NOT EXISTS academic_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  holiday_type TEXT NOT NULL CHECK (holiday_type IN ('holiday', 'vacation', 'closure', 'training', 'other')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('yearly', 'monthly', 'weekly')),
  affects_billing BOOLEAN DEFAULT TRUE, -- Whether this holiday affects billing
  affects_attendance BOOLEAN DEFAULT TRUE, -- Whether attendance should be tracked
  kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE, -- NULL means applies to all Kitas
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_academic_calendar_dates ON academic_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_kita ON academic_calendar(kita_id);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_type ON academic_calendar(holiday_type);

-- Function to check if a date is a holiday
CREATE OR REPLACE FUNCTION is_holiday(p_date DATE, p_kita_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM academic_calendar
  WHERE p_date >= start_date
    AND p_date <= end_date
    AND (kita_id IS NULL OR kita_id = p_kita_id);
  
  RETURN v_count > 0;
END;
$$;

-- Function to get all holidays in a date range
CREATE OR REPLACE FUNCTION get_holidays(p_start_date DATE, p_end_date DATE, p_kita_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  holiday_type TEXT,
  affects_billing BOOLEAN,
  affects_attendance BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.title,
    ac.description,
    ac.start_date,
    ac.end_date,
    ac.holiday_type,
    ac.affects_billing,
    ac.affects_attendance
  FROM academic_calendar ac
  WHERE ac.start_date <= p_end_date
    AND ac.end_date >= p_start_date
    AND (ac.kita_id IS NULL OR ac.kita_id = p_kita_id)
  ORDER BY ac.start_date;
END;
$$;

-- Enable RLS
ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage, everyone can view
CREATE POLICY "Admins can manage academic calendar" ON academic_calendar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view academic calendar" ON academic_calendar
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_academic_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_academic_calendar_updated_at
  BEFORE UPDATE ON academic_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_calendar_updated_at();

-- Insert some common German holidays (example)
-- These can be managed via the admin UI
-- INSERT INTO academic_calendar (title, start_date, end_date, holiday_type, is_recurring, recurring_pattern, affects_billing, affects_attendance, created_by)
-- VALUES 
--   ('Weihnachtsferien', '2024-12-23', '2025-01-06', 'vacation', TRUE, 'yearly', TRUE, TRUE, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
--   ('Sommerferien', '2025-07-15', '2025-08-15', 'vacation', TRUE, 'yearly', TRUE, TRUE, (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- >>> FILE: supabase/migrations/add-parent-work-system.sql

-- Migration: Add Parent Work (Eltern Arbeit) System
-- This migration adds tables for managing parent work tasks and payments

-- 1. Parent Work Tasks Table
CREATE TABLE IF NOT EXISTS parent_work_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('cleaning', 'cooking', 'maintenance', 'gardening', 'administration', 'other')),
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_hours DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES profiles(id),
  assigned_date DATE,
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extra columns (from add-german-kita-features; table must exist first)
ALTER TABLE parent_work_tasks ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'direct_payment' CHECK (payment_type IN ('direct_payment', 'fee_credit', 'voluntary'));
ALTER TABLE parent_work_tasks ADD COLUMN IF NOT EXISTS kita_id UUID REFERENCES kitas(id) ON DELETE CASCADE;

-- 2. Parent Work Submissions Table
CREATE TABLE IF NOT EXISTS parent_work_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES parent_work_tasks(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  hours_worked DECIMAL(5, 2) NOT NULL,
  work_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_amount DECIMAL(10, 2),
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link submissions to quota (parent_work_quota is created in add-german-kita-features, which runs before this migration)
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS quota_id UUID REFERENCES parent_work_quota(id) ON DELETE SET NULL;
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS fee_credit_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_work_submissions ADD COLUMN IF NOT EXISTS fee_credit_amount DECIMAL(10, 2);

-- 3. Parent Work Payments Table
CREATE TABLE IF NOT EXISTS parent_work_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES parent_work_submissions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_status ON parent_work_tasks(status);
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_assigned_to ON parent_work_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_parent_work_tasks_type ON parent_work_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_task ON parent_work_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_parent ON parent_work_submissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_submissions_status ON parent_work_submissions(status);
CREATE INDEX IF NOT EXISTS idx_parent_work_payments_submission ON parent_work_payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_parent_work_payments_status ON parent_work_payments(status);

-- Enable RLS
ALTER TABLE parent_work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_work_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_work_tasks
-- Admins can manage all tasks
CREATE POLICY "Admins can manage all parent work tasks" ON parent_work_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view tasks assigned to them
CREATE POLICY "Parents can view assigned tasks" ON parent_work_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can update tasks assigned to them
CREATE POLICY "Parents can update assigned tasks" ON parent_work_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for parent_work_submissions
-- Admins can manage all submissions
CREATE POLICY "Admins can manage all parent work submissions" ON parent_work_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view and create their own submissions
CREATE POLICY "Parents can manage their own submissions" ON parent_work_submissions
  FOR ALL USING (
    parent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for parent_work_payments
-- Admins can manage all payments
CREATE POLICY "Admins can manage all parent work payments" ON parent_work_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view payments for their submissions
CREATE POLICY "Parents can view their payment records" ON parent_work_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_work_submissions 
      WHERE id = parent_work_payments.submission_id 
      AND parent_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create function to calculate payment amount
CREATE OR REPLACE FUNCTION calculate_parent_work_payment(
  p_task_id UUID,
  p_hours_worked DECIMAL
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_hourly_rate DECIMAL(10, 2);
BEGIN
  SELECT hourly_rate INTO v_hourly_rate
  FROM parent_work_tasks
  WHERE id = p_task_id;
  
  RETURN COALESCE(v_hourly_rate, 0) * p_hours_worked;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update payment amount when submission is created/updated
CREATE OR REPLACE FUNCTION update_parent_work_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_amount = calculate_parent_work_payment(NEW.task_id, NEW.hours_worked);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_amount
  BEFORE INSERT OR UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_work_payment_amount();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parent_work_tasks_updated_at
  BEFORE UPDATE ON parent_work_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_parent_work_submissions_updated_at
  BEFORE UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_parent_work_payments_updated_at
  BEFORE UPDATE ON parent_work_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update parent_work_quota when a submission is approved (from add-german-kita-features)
CREATE OR REPLACE FUNCTION update_parent_work_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.quota_id IS NOT NULL THEN
    UPDATE parent_work_quota
    SET completed_hours = completed_hours + NEW.hours_worked
    WHERE id = NEW.quota_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_parent_work_quota ON parent_work_submissions;
CREATE TRIGGER trigger_update_parent_work_quota
  AFTER UPDATE ON parent_work_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_work_quota();

-- >>> FILE: supabase/migrations/add-lunch-billing.sql

-- Migration: Add Lunch Billing System Tables
-- This migration adds tables for lunch billing, absence tracking, and refunds

-- 1. Lunch Pricing Table
CREATE TABLE IF NOT EXISTS lunch_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  price_per_meal DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, effective_from)
);

-- 2. Billing Configuration Table
CREATE TABLE IF NOT EXISTS billing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Absence Notifications Table
CREATE TABLE IF NOT EXISTS absence_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notified_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deadline_met BOOLEAN NOT NULL DEFAULT FALSE,
  notification_method TEXT CHECK (notification_method IN ('app', 'email', 'phone')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, absence_date)
);

-- 4. Monthly Billing Table
CREATE TABLE IF NOT EXISTS monthly_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, month, year)
);

-- 5. Lunch Billing Items Table
CREATE TABLE IF NOT EXISTS lunch_billing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES monthly_billing(id) ON DELETE CASCADE,
  order_id UUID REFERENCES lunch_orders(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_price DECIMAL(10, 2) NOT NULL,
  is_informed_absence BOOLEAN NOT NULL DEFAULT FALSE,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  refund_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extra columns (were in add-german-kita-features; must run after table exists)
ALTER TABLE lunch_billing_items ADD COLUMN IF NOT EXISTS cancellation_deadline_met BOOLEAN;
ALTER TABLE lunch_billing_items ADD COLUMN IF NOT EXISTS billing_reason TEXT CHECK (billing_reason IN ('present', 'ordered', 'cancellation_after_deadline', 'flat_rate_allocation', 'uninformed_absence'));
ALTER TABLE lunch_billing_items ADD COLUMN IF NOT EXISTS cancellation_timestamp TIMESTAMP WITH TIME ZONE;

-- Update existing tables
ALTER TABLE lunch_orders ADD COLUMN IF NOT EXISTS billing_item_id UUID REFERENCES lunch_billing_items(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS lunch_price_per_meal DECIMAL(10, 2);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lunch_pricing_group ON lunch_pricing(group_id);
CREATE INDEX IF NOT EXISTS idx_lunch_pricing_dates ON lunch_pricing(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_absence_notifications_child ON absence_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_absence_notifications_date ON absence_notifications(absence_date);
CREATE INDEX IF NOT EXISTS idx_monthly_billing_child ON monthly_billing(child_id);
CREATE INDEX IF NOT EXISTS idx_monthly_billing_month_year ON monthly_billing(year, month);
CREATE INDEX IF NOT EXISTS idx_lunch_billing_items_billing ON lunch_billing_items(billing_id);
CREATE INDEX IF NOT EXISTS idx_lunch_billing_items_date ON lunch_billing_items(date);
CREATE INDEX IF NOT EXISTS idx_lunch_orders_billing_item ON lunch_orders(billing_item_id);

-- Enable RLS on all new tables
ALTER TABLE lunch_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_billing_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lunch_pricing
CREATE POLICY "Admins and kitchen can view pricing" ON lunch_pricing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage pricing" ON lunch_pricing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for billing_config
CREATE POLICY "Admins can view config" ON billing_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage config" ON billing_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for absence_notifications
CREATE POLICY "Parents can view their children's absence notifications" ON absence_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = absence_notifications.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Parents can create absence notifications" ON absence_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = absence_notifications.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) AND
    notified_by = auth.uid()
  );

CREATE POLICY "Admins can manage absence notifications" ON absence_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for monthly_billing
CREATE POLICY "Parents can view their children's bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = monthly_billing.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage billing" ON monthly_billing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for lunch_billing_items
CREATE POLICY "Parents can view their children's billing items" ON lunch_billing_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_billing mb
      JOIN children c ON c.id = mb.child_id
      WHERE mb.id = lunch_billing_items.billing_id
      AND auth.uid() = ANY(c.parent_ids)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'kitchen'))
  );

CREATE POLICY "Admins can manage billing items" ON lunch_billing_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Helper Functions

-- Function to check if absence notification deadline was met
CREATE OR REPLACE FUNCTION check_informed_absence_deadline(
  p_absence_date DATE,
  p_notification_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deadline_hours INTEGER;
  v_deadline_time TIMESTAMP WITH TIME ZONE;
  v_absence_8am TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get configured deadline hours (default to 16 hours if not set)
  SELECT COALESCE(
    (SELECT value::INTEGER FROM billing_config WHERE key = 'informed_absence_deadline_hours'),
    16
  ) INTO v_deadline_hours;
  
  -- Calculate 8 AM on absence date
  v_absence_8am := (p_absence_date::TIMESTAMP WITH TIME ZONE) + INTERVAL '8 hours';
  
  -- Calculate deadline time (deadline_hours before 8 AM on absence date)
  v_deadline_time := v_absence_8am - (v_deadline_hours || ' hours')::INTERVAL;
  
  -- Check if notification was before deadline
  RETURN p_notification_time < v_deadline_time;
END;
$$;

-- Function to get current lunch price for a group
CREATE OR REPLACE FUNCTION get_group_lunch_price(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_price DECIMAL(10, 2);
BEGIN
  -- First check groups table for quick reference
  SELECT lunch_price_per_meal INTO v_price
  FROM groups
  WHERE id = p_group_id;
  
  -- If not set in groups table, check lunch_pricing table
  IF v_price IS NULL THEN
    SELECT price_per_meal INTO v_price
    FROM lunch_pricing
    WHERE group_id = p_group_id
      AND effective_from <= p_date
      AND (effective_to IS NULL OR effective_to >= p_date)
    ORDER BY effective_from DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_price, 0);
END;
$$;

-- Function to calculate monthly billing for a child
CREATE OR REPLACE FUNCTION calculate_monthly_billing(
  p_child_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE(
  billable_days INTEGER,
  refundable_days INTEGER,
  total_amount DECIMAL(10, 2),
  refund_amount DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id UUID;
  v_price_per_meal DECIMAL(10, 2);
  v_start_date DATE;
  v_end_date DATE;
  v_billable_count INTEGER := 0;
  v_refundable_count INTEGER := 0;
  v_current_date DATE;
  v_has_order BOOLEAN;
  v_has_informed_absence BOOLEAN;
  v_deadline_met BOOLEAN;
BEGIN
  -- Get child's group
  SELECT group_id INTO v_group_id
  FROM children
  WHERE id = p_child_id;
  
  IF v_group_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get price for the group
  v_price_per_meal := get_group_lunch_price(v_group_id);
  
  -- Calculate date range for the month
  v_start_date := DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1));
  v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
  
  -- Loop through each day in the month (excluding weekends)
  v_current_date := v_start_date;
  WHILE v_current_date <= v_end_date LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
      -- Check if there's a lunch order for this date
      SELECT EXISTS(
        SELECT 1 FROM lunch_orders lo
        JOIN lunch_menus lm ON lm.id = lo.menu_id
        WHERE lo.child_id = p_child_id
          AND lm.date = v_current_date
          AND lo.status != 'cancelled'
      ) INTO v_has_order;
      
      -- Check if there's an informed absence
      SELECT EXISTS(
        SELECT 1 FROM absence_notifications an
        WHERE an.child_id = p_child_id
          AND an.absence_date = v_current_date
          AND an.deadline_met = TRUE
      ) INTO v_has_informed_absence;
      
      IF v_has_order THEN
        -- Has order, so billable
        v_billable_count := v_billable_count + 1;
      ELSIF v_has_informed_absence THEN
        -- Informed absence before deadline, refundable
        v_refundable_count := v_refundable_count + 1;
      ELSE
        -- Uninformed absence, still billable
        v_billable_count := v_billable_count + 1;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN QUERY SELECT
    v_billable_count,
    v_refundable_count,
    (v_billable_count * v_price_per_meal)::DECIMAL(10, 2),
    (v_refundable_count * v_price_per_meal)::DECIMAL(10, 2);
END;
$$;

-- Insert default billing config
INSERT INTO billing_config (key, value, description)
VALUES 
  ('informed_absence_deadline_hours', '16', 'Hours before 8 AM on absence date that parent must notify (default: 16 hours = day before by 4 PM)')
ON CONFLICT (key) DO NOTHING;

-- Add trigger to update updated_at for lunch_pricing
CREATE TRIGGER update_lunch_pricing_updated_at BEFORE UPDATE ON lunch_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update updated_at for monthly_billing
CREATE TRIGGER update_monthly_billing_updated_at BEFORE UPDATE ON monthly_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/migrations/add-billing-audit-log.sql

-- Billing Audit Log table to track all billing adjustments
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_id UUID NOT NULL REFERENCES monthly_billing(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES profiles(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('amount', 'status', 'payment', 'refund')),
  previous_total_amount NUMERIC(10, 2),
  new_total_amount NUMERIC(10, 2),
  previous_paid_amount NUMERIC(10, 2),
  new_paid_amount NUMERIC(10, 2),
  previous_refund_amount NUMERIC(10, 2),
  new_refund_amount NUMERIC(10, 2),
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_billing_id ON billing_audit_log(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_adjusted_by ON billing_audit_log(adjusted_by);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created_at ON billing_audit_log(created_at);

-- Enable RLS
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all audit logs
CREATE POLICY "Admins can view all billing audit logs" ON billing_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view audit logs for their children's bills
CREATE POLICY "Parents can view audit logs for their children's bills" ON billing_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_billing mb
      JOIN children c ON c.id = mb.child_id
      WHERE mb.id = billing_audit_log.billing_id
      AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- >>> FILE: supabase/migrations/add-teacher-leave-requests.sql

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Teacher Leave Requests table
CREATE TABLE IF NOT EXISTS teacher_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'other')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_teacher_id ON teacher_leave_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_status ON teacher_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_dates ON teacher_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_teacher_leave_requests_reviewed_by ON teacher_leave_requests(reviewed_by);

-- Enable RLS
ALTER TABLE teacher_leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Teachers can view their own leave requests
CREATE POLICY "Teachers can view their own leave requests" ON teacher_leave_requests
  FOR SELECT USING (teacher_id = auth.uid());

-- Teachers can create their own leave requests
CREATE POLICY "Teachers can create their own leave requests" ON teacher_leave_requests
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own pending leave requests
CREATE POLICY "Teachers can update their own pending requests" ON teacher_leave_requests
  FOR UPDATE USING (
    teacher_id = auth.uid() AND status = 'pending'
  );

-- Admins can view all leave requests
CREATE POLICY "Admins can view all teacher leave requests" ON teacher_leave_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all leave requests
CREATE POLICY "Admins can update all teacher leave requests" ON teacher_leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger to update updated_at
CREATE TRIGGER update_teacher_leave_requests_updated_at BEFORE UPDATE ON teacher_leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/migrations/enhance-group-teacher-assignment.sql

-- Group Teachers junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS group_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'assistant', 'support')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, teacher_id, start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_teachers_group_id ON group_teachers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_teachers_teacher_id ON group_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_group_teachers_role ON group_teachers(role);
CREATE INDEX IF NOT EXISTS idx_group_teachers_dates ON group_teachers(start_date, end_date);

-- Enable RLS
ALTER TABLE group_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all group-teacher assignments
CREATE POLICY "Admins can manage all group-teacher assignments" ON group_teachers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view their own group assignments
CREATE POLICY "Teachers can view their own group assignments" ON group_teachers
  FOR SELECT USING (teacher_id = auth.uid());

-- Support staff can view group assignments
CREATE POLICY "Support staff can view group assignments" ON group_teachers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view group assignments for their children's groups
CREATE POLICY "Parents can view group assignments for their children's groups" ON group_teachers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.group_id = group_teachers.group_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_group_teachers_updated_at BEFORE UPDATE ON group_teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active teachers for a group
CREATE OR REPLACE FUNCTION get_active_group_teachers(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  teacher_id UUID,
  role TEXT,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.teacher_id,
    gt.role,
    p.full_name
  FROM group_teachers gt
  JOIN profiles p ON p.id = gt.teacher_id
  WHERE gt.group_id = p_group_id
    AND gt.start_date <= CURRENT_DATE
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY 
    CASE gt.role
      WHEN 'primary' THEN 1
      WHEN 'assistant' THEN 2
      WHEN 'support' THEN 3
    END,
    p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- >>> FILE: supabase/migrations/add-monthly-fees-system.sql

-- Fee Configuration table
CREATE TABLE IF NOT EXISTS fee_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'lunch', 'activities', 'other')),
  group_id UUID REFERENCES groups(id),
  amount DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Fees table
CREATE TABLE IF NOT EXISTS monthly_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'lunch', 'activities', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Payments table (for partial payments and payment history)
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_id UUID NOT NULL REFERENCES monthly_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_config_group_id ON fee_config(group_id);
CREATE INDEX IF NOT EXISTS idx_fee_config_dates ON fee_config(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_child_id ON monthly_fees(child_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_month_year ON monthly_fees(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_fee_id ON fee_payments(fee_id);

-- Enable RLS
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_config
-- Admins can manage all fee configs
CREATE POLICY "Admins can manage all fee configs" ON fee_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view fee configs (read-only)
CREATE POLICY "Parents can view fee configs" ON fee_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for monthly_fees
-- Admins can manage all fees
CREATE POLICY "Admins can manage all monthly fees" ON monthly_fees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view and pay their children's fees
CREATE POLICY "Parents can view their children's fees" ON monthly_fees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = monthly_fees.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

CREATE POLICY "Parents can update their children's fees" ON monthly_fees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = monthly_fees.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- RLS Policies for fee_payments
-- Admins can manage all payments
CREATE POLICY "Admins can manage all fee payments" ON fee_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parents can view payments for their children's fees
CREATE POLICY "Parents can view their children's fee payments" ON fee_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monthly_fees
      JOIN children ON children.id = monthly_fees.child_id
      WHERE monthly_fees.id = fee_payments.fee_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Parents can create payments for their children's fees
CREATE POLICY "Parents can create payments for their children's fees" ON fee_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM monthly_fees
      JOIN children ON children.id = monthly_fees.child_id
      WHERE monthly_fees.id = fee_payments.fee_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Triggers to update updated_at
CREATE TRIGGER update_fee_config_updated_at BEFORE UPDATE ON fee_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_fees_updated_at BEFORE UPDATE ON monthly_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current fee config for a group and fee type
CREATE OR REPLACE FUNCTION get_current_fee_config(p_group_id UUID, p_fee_type TEXT)
RETURNS TABLE (
  id UUID,
  amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.amount
  FROM fee_config fc
  WHERE fc.group_id = p_group_id
    AND fc.fee_type = p_fee_type
    AND fc.effective_from <= CURRENT_DATE
    AND (fc.effective_to IS NULL OR fc.effective_to >= CURRENT_DATE)
  ORDER BY fc.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- >>> FILE: supabase/migrations/add-staff-assignments.sql

-- Staff Assignments table for many-to-many relationship between children and staff
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('primary_teacher', 'assistant_teacher', 'support_staff')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, staff_id, assignment_type, start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_assignments_child_id ON staff_assignments(child_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_type ON staff_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_dates ON staff_assignments(start_date, end_date);

-- Enable RLS
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all assignments
CREATE POLICY "Admins can manage all staff assignments" ON staff_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view assignments for their children
CREATE POLICY "Teachers can view assignments for their children" ON staff_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = staff_assignments.child_id
      AND EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = children.group_id
        AND groups.educator_id = auth.uid()
      )
    ) OR
    staff_assignments.staff_id = auth.uid()
  );

-- Support staff can view assignments
CREATE POLICY "Support staff can view assignments" ON staff_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view assignments for their children
CREATE POLICY "Parents can view assignments for their children" ON staff_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = staff_assignments.child_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_staff_assignments_updated_at BEFORE UPDATE ON staff_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/migrations/migrate-existing-assignments.sql

-- Migration script to convert existing educator_id assignments to group_teachers table
-- This maintains backward compatibility while moving to the new many-to-many system

-- Step 1: Migrate existing groups.educator_id to group_teachers
INSERT INTO group_teachers (group_id, teacher_id, role, start_date, created_at, updated_at)
SELECT 
  id as group_id,
  educator_id as teacher_id,
  'primary' as role,
  COALESCE(created_at::date, CURRENT_DATE) as start_date,
  created_at,
  updated_at
FROM groups
WHERE educator_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates if migration runs multiple times
    SELECT 1 FROM group_teachers gt
    WHERE gt.group_id = groups.id
      AND gt.teacher_id = groups.educator_id
      AND gt.role = 'primary'
      AND gt.start_date = COALESCE(groups.created_at::date, CURRENT_DATE)
  );

-- Step 2: Update any staff_assignments that should be group assignments
-- This handles cases where individual child-teacher assignments should become group assignments
INSERT INTO group_teachers (group_id, teacher_id, role, start_date, created_at, updated_at)
SELECT DISTINCT
  c.group_id,
  sa.staff_id as teacher_id,
  CASE 
    WHEN sa.assignment_type = 'primary_teacher' THEN 'primary'
    WHEN sa.assignment_type = 'assistant_teacher' THEN 'assistant'
    ELSE 'support'
  END as role,
  COALESCE(sa.start_date, CURRENT_DATE) as start_date,
  sa.created_at,
  sa.updated_at
FROM staff_assignments sa
JOIN children c ON c.id = sa.child_id
WHERE c.group_id IS NOT NULL
  AND sa.assignment_type IN ('primary_teacher', 'assistant_teacher')
  AND (sa.end_date IS NULL OR sa.end_date >= CURRENT_DATE)
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM group_teachers gt
    WHERE gt.group_id = c.group_id
      AND gt.teacher_id = sa.staff_id
      AND gt.role = CASE 
        WHEN sa.assignment_type = 'primary_teacher' THEN 'primary'
        WHEN sa.assignment_type = 'assistant_teacher' THEN 'assistant'
        ELSE 'support'
      END
      AND gt.start_date = COALESCE(sa.start_date, CURRENT_DATE)
  );

-- Step 3: Ensure groups.educator_id matches the primary teacher in group_teachers
-- This maintains backward compatibility
UPDATE groups g
SET educator_id = (
  SELECT teacher_id
  FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY gt.start_date DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
)
AND (g.educator_id IS NULL OR g.educator_id != (
  SELECT teacher_id
  FROM group_teachers gt
  WHERE gt.group_id = g.id
    AND gt.role = 'primary'
    AND (gt.end_date IS NULL OR gt.end_date >= CURRENT_DATE)
  ORDER BY gt.start_date DESC
  LIMIT 1
));

-- Step 4: Create a function to sync educator_id when group_teachers change
-- This will be called by triggers to keep educator_id in sync
CREATE OR REPLACE FUNCTION sync_group_educator_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Update groups.educator_id when primary teacher changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'primary' AND (NEW.end_date IS NULL OR NEW.end_date >= CURRENT_DATE) THEN
      UPDATE groups
      SET educator_id = NEW.teacher_id
      WHERE id = NEW.group_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'primary') THEN
    -- If primary teacher removed, set to another primary or null
    UPDATE groups
    SET educator_id = (
      SELECT teacher_id
      FROM group_teachers
      WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        AND role = 'primary'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND id != COALESCE(NEW.id, OLD.id)
      ORDER BY start_date DESC
      LIMIT 1
    )
    WHERE id = COALESCE(NEW.group_id, OLD.group_id)
      AND educator_id = COALESCE(OLD.teacher_id, NEW.teacher_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers to keep educator_id in sync
DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_insert ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_insert
  AFTER INSERT ON group_teachers
  FOR EACH ROW
  WHEN (NEW.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_update ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_update
  AFTER UPDATE ON group_teachers
  FOR EACH ROW
  WHEN (NEW.role = 'primary' OR OLD.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

DROP TRIGGER IF EXISTS sync_educator_on_group_teacher_delete ON group_teachers;
CREATE TRIGGER sync_educator_on_group_teacher_delete
  AFTER DELETE ON group_teachers
  FOR EACH ROW
  WHEN (OLD.role = 'primary')
  EXECUTE FUNCTION sync_group_educator_id();

-- Step 6: Verify migration
DO $$
DECLARE
  migrated_count INTEGER;
  groups_with_educator INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM group_teachers
  WHERE role = 'primary';

  SELECT COUNT(*) INTO groups_with_educator
  FROM groups
  WHERE educator_id IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Primary teacher assignments in group_teachers: %', migrated_count;
  RAISE NOTICE '  - Groups with educator_id: %', groups_with_educator;
END $$;

-- >>> FILE: supabase/migrations/add-payroll-system.sql

-- Staff Salary Configuration table
CREATE TABLE IF NOT EXISTS staff_salary_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_salary DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, effective_from)
);

-- Staff Payroll table
CREATE TABLE IF NOT EXISTS staff_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2),
  overtime_amount DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  net_salary DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, month, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salary_config_staff_id ON staff_salary_config(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_config_dates ON staff_salary_config(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_staff_id ON staff_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_month_year ON staff_payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_status ON staff_payroll(status);

-- Enable RLS
ALTER TABLE staff_salary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_salary_config
-- Admins can manage all salary configs
CREATE POLICY "Admins can manage all salary configs" ON staff_salary_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff can view their own salary configs
CREATE POLICY "Staff can view their own salary configs" ON staff_salary_config
  FOR SELECT USING (staff_id = auth.uid());

-- RLS Policies for staff_payroll
-- Admins can manage all payroll
CREATE POLICY "Admins can manage all payroll" ON staff_payroll
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff can view their own payroll
CREATE POLICY "Staff can view their own payroll" ON staff_payroll
  FOR SELECT USING (staff_id = auth.uid());

-- Triggers to update updated_at
CREATE TRIGGER update_staff_salary_config_updated_at BEFORE UPDATE ON staff_salary_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_payroll_updated_at BEFORE UPDATE ON staff_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current salary config for a staff member
CREATE OR REPLACE FUNCTION get_current_salary_config(p_staff_id UUID)
RETURNS TABLE (
  id UUID,
  staff_id UUID,
  base_salary DECIMAL,
  hourly_rate DECIMAL,
  overtime_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.staff_id,
    sc.base_salary,
    sc.hourly_rate,
    sc.overtime_multiplier
  FROM staff_salary_config sc
  WHERE sc.staff_id = p_staff_id
    AND sc.effective_from <= CURRENT_DATE
    AND (sc.effective_to IS NULL OR sc.effective_to >= CURRENT_DATE)
  ORDER BY sc.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- >>> FILE: supabase/migrations/add-support-staff-permissions.sql

-- Update RLS policies to allow support staff to view children (read-only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Support staff can view all children" ON children;

-- Support staff can view all children (read-only)
CREATE POLICY "Support staff can view all children" ON children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Support staff can manage attendance
-- This is already covered by the existing "Teachers and admins can manage attendance" policy
-- But we'll add a specific one for support staff
DROP POLICY IF EXISTS "Support staff can manage attendance" ON attendance;

CREATE POLICY "Support staff can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Support staff can send messages
-- This is already covered by existing message policies, but ensure support can send to parents
-- The existing "Users can send messages" policy should work, but let's verify support can view profiles

-- Support staff can view basic child information (already covered by children view policy above)

-- >>> FILE: supabase/migrations/enhance-attendance-system.sql

-- Add new columns to attendance table
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS check_in_method TEXT CHECK (check_in_method IN ('manual', 'bulk', 'check_in_out'));

-- Create attendance_logs table for audit trail
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('check_in', 'check_out', 'status_change', 'created', 'updated')),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by ON attendance(recorded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_attendance_id ON attendance_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_performed_by ON attendance_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp);

-- Enable RLS on attendance_logs
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_logs
-- Admins can view all logs
CREATE POLICY "Admins can view all attendance logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Teachers can view logs for their children
CREATE POLICY "Teachers can view logs for their children" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance
      JOIN children ON children.id = attendance.child_id
      JOIN groups ON groups.id = children.group_id
      WHERE attendance.id = attendance_logs.attendance_id
      AND groups.educator_id = auth.uid()
    )
  );

-- Support staff can view logs
CREATE POLICY "Support staff can view logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'support')
  );

-- Parents can view logs for their children
CREATE POLICY "Parents can view logs for their children" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance
      JOIN children ON children.id = attendance.child_id
      WHERE attendance.id = attendance_logs.attendance_id
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Function to log attendance changes
CREATE OR REPLACE FUNCTION log_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO attendance_logs (
    attendance_id,
    action,
    performed_by,
    old_value,
    new_value
  ) VALUES (
    NEW.id,
    CASE
      WHEN OLD.id IS NULL THEN 'created'
      WHEN OLD.status != NEW.status THEN 'status_change'
      WHEN OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN 'check_in'
      WHEN OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN 'check_out'
      ELSE 'updated'
    END,
    COALESCE(NEW.recorded_by, auth.uid()),
    CASE
      WHEN OLD.id IS NULL THEN NULL
      WHEN OLD.status != NEW.status THEN OLD.status
      ELSE NULL
    END,
    CASE
      WHEN OLD.id IS NULL THEN NEW.status
      WHEN OLD.status != NEW.status THEN NEW.status
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log attendance changes
DROP TRIGGER IF EXISTS attendance_change_log ON attendance;
CREATE TRIGGER attendance_change_log
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION log_attendance_change();

-- >>> FILE: supabase/migrations/add-billing-timetable.sql

-- Migration: Add Billing Timetable Configuration
-- Allows admins to configure which days of the week are billable

-- Add billing_timetable table
CREATE TABLE IF NOT EXISTS billing_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  monday BOOLEAN NOT NULL DEFAULT TRUE,
  tuesday BOOLEAN NOT NULL DEFAULT TRUE,
  wednesday BOOLEAN NOT NULL DEFAULT TRUE,
  thursday BOOLEAN NOT NULL DEFAULT TRUE,
  friday BOOLEAN NOT NULL DEFAULT TRUE,
  saturday BOOLEAN NOT NULL DEFAULT FALSE,
  sunday BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, effective_from)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_billing_timetable_group ON billing_timetable(group_id);
CREATE INDEX IF NOT EXISTS idx_billing_timetable_dates ON billing_timetable(effective_from, effective_to);

-- Enable RLS
ALTER TABLE billing_timetable ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage billing timetable" ON billing_timetable
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view billing timetable" ON billing_timetable
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to get billable days for a group on a specific date
CREATE OR REPLACE FUNCTION get_billable_days(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_timetable RECORD;
  v_days INTEGER[] := ARRAY[]::INTEGER[];
  v_day_of_week INTEGER;
BEGIN
  -- Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get timetable for the group
  SELECT * INTO v_timetable
  FROM billing_timetable
  WHERE group_id = p_group_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- If no timetable found, use default (Mon-Fri)
  IF v_timetable IS NULL THEN
    RETURN ARRAY[1, 2, 3, 4, 5]; -- Monday to Friday
  END IF;
  
  -- Build array of billable days based on timetable
  -- Convert to PostgreSQL day format: 0=Sunday, 1=Monday, ..., 6=Saturday
  IF v_timetable.monday THEN
    v_days := array_append(v_days, 1);
  END IF;
  IF v_timetable.tuesday THEN
    v_days := array_append(v_days, 2);
  END IF;
  IF v_timetable.wednesday THEN
    v_days := array_append(v_days, 3);
  END IF;
  IF v_timetable.thursday THEN
    v_days := array_append(v_days, 4);
  END IF;
  IF v_timetable.friday THEN
    v_days := array_append(v_days, 5);
  END IF;
  IF v_timetable.saturday THEN
    v_days := array_append(v_days, 6);
  END IF;
  IF v_timetable.sunday THEN
    v_days := array_append(v_days, 0);
  END IF;
  
  RETURN v_days;
END;
$$;

-- Function to check if a date is billable for a group
CREATE OR REPLACE FUNCTION is_billable_day(p_group_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_billable_days INTEGER[];
  v_day_of_week INTEGER;
BEGIN
  v_billable_days := get_billable_days(p_group_id, p_date);
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  RETURN v_day_of_week = ANY(v_billable_days);
END;
$$;

-- Add trigger to update updated_at
CREATE TRIGGER update_billing_timetable_updated_at BEFORE UPDATE ON billing_timetable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> FILE: supabase/migrations/fix-monthly-billing-rls.sql

-- Fix RLS policies for monthly_billing to ensure admins can update
-- This fixes potential recursion issues in the policy check

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can view their children's bills" ON monthly_billing;
DROP POLICY IF EXISTS "Admins can manage billing" ON monthly_billing;

-- Recreate with better structure to avoid recursion
CREATE POLICY "Parents can view their children's bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = monthly_billing.child_id 
      AND auth.uid() = ANY(children.parent_ids)
    )
  );

-- Use a helper function approach to avoid recursion
CREATE POLICY "Admins can view all bills" ON monthly_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bills" ON monthly_billing
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert bills" ON monthly_billing
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete bills" ON monthly_billing
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- >>> FILE: supabase/migrations/20260331120000_fix_rls_recursion_security_helpers.sql

-- Fix PostgreSQL error 42P17: infinite recursion in policy for relation "profiles".
-- Cause: policies call is_admin() -> get_user_role() -> SELECT from profiles, which re-evaluates profiles RLS.
-- Same risk: user_belongs_to_kita() / get_user_kita_id() reading organization_members while org RLS calls those helpers.
-- Fix: SECURITY DEFINER + SET LOCAL row_security = off for the internal lookups (restored when the function returns).

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT u.raw_user_meta_data->>'role' INTO v_role
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_role IS NOT NULL AND btrim(v_role) <> '' THEN
    RETURN v_role;
  END IF;

  SET LOCAL row_security = off;
  SELECT p.role INTO v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_kita_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kita UUID;
BEGIN
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SET LOCAL row_security = off;
  SELECT om.kita_id INTO v_kita
  FROM public.organization_members om
  WHERE om.profile_id = user_id
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at NULLS LAST
  LIMIT 1;

  RETURN v_kita;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL OR target_kita_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.profile_id = user_id
      AND om.kita_id IS NOT NULL
      AND om.kita_id = target_kita_id
  );
END;
$$;

-- >>> FILE: supabase/migrations/20260401120000_fix_profiles_rls_recursion_role_helpers.sql

-- Fix PostgreSQL 42P17: infinite recursion in policy for relation "profiles".
-- Cause: is_admin(), is_teacher(), etc. read public.profiles while RLS is already
-- evaluating policies on profiles — each EXISTS re-enters profiles RLS.
-- Fix: same pattern as 20260331120000_fix_rls_recursion_security_helpers.sql:
-- SECURITY DEFINER + SET LOCAL row_security = off around internal reads.
--
-- Also replace get_user_kita_id() (no-arg) so it does not hit organization_members
-- RLS in a way that can chain back into profiles (defensive).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'admin' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'teacher' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'teacher'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') IN ('admin', 'teacher') INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_kitchen()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'kitchen' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'kitchen'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta boolean;
BEGIN
  SELECT (u.raw_user_meta_data->>'role') = 'support' INTO v_meta
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_meta IS NOT NULL THEN
    RETURN v_meta;
  END IF;

  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'support'
  );
END;
$$;

-- Zero-arg overload used by 20260331_fix_multi_tenancy_rls.sql policies on groups, children, profiles, etc.
CREATE OR REPLACE FUNCTION public.get_user_kita_id()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kita uuid;
BEGIN
  SET LOCAL row_security = off;
  SELECT om.kita_id
  INTO v_kita
  FROM public.organization_members om
  WHERE om.profile_id = auth.uid()
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at DESC NULLS LAST
  LIMIT 1;

  RETURN v_kita;
END;
$$;

-- >>> FILE: supabase/migrations/20260329120000_tenant_isolation_rls.sql

-- Tenant isolation: admins/staff only see data for Kitas they belong to (organization_members).
-- Run via Supabase migrations or paste into SQL Editor.
-- Prereqs: organization_members, kitas, user_belongs_to_kita(), get_user_kita_id(), is_admin(), is_teacher(), is_admin_or_teacher(), is_admin_or_kitchen(), is_support or role checks

-- Ensure helpers exist (idempotent if already applied from add-german-kita-features)
CREATE OR REPLACE FUNCTION public.get_user_kita_id(user_id UUID)
RETURNS UUID AS $$
  SELECT om.kita_id
  FROM public.organization_members om
  WHERE om.profile_id = user_id
    AND om.kita_id IS NOT NULL
  ORDER BY om.created_at NULLS LAST
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_belongs_to_kita(user_id UUID, target_kita_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.profile_id = user_id
      AND om.kita_id IS NOT NULL
      AND om.kita_id = target_kita_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;

CREATE POLICY "Org members can view their organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  );

CREATE POLICY "Kita admins can manage their organization" ON public.organizations
  FOR ALL USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  )
  WITH CHECK (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.kitas k
      INNER JOIN public.organization_members om ON om.kita_id = k.id AND om.profile_id = auth.uid()
      WHERE k.organization_id = organizations.id
    )
  );

-- ---------------------------------------------------------------------------
-- kitas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view kitas they belong to" ON public.kitas;
DROP POLICY IF EXISTS "Users can manage kitas they belong to" ON public.kitas;

CREATE POLICY "Users can view kitas they belong to" ON public.kitas
  FOR SELECT USING (public.user_belongs_to_kita(auth.uid(), id));

CREATE POLICY "Users can manage kitas they belong to" ON public.kitas
  FOR ALL USING (public.user_belongs_to_kita(auth.uid(), id))
  WITH CHECK (public.user_belongs_to_kita(auth.uid(), id));

-- ---------------------------------------------------------------------------
-- organization_members (remove global admin bypass)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view members of their kita" ON public.organization_members;

CREATE POLICY "Users can view members of their kita" ON public.organization_members
  FOR SELECT USING (
    public.user_belongs_to_kita(auth.uid(), kita_id)
    OR profile_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "Teachers can view children in their groups" ON public.children;
DROP POLICY IF EXISTS "Support staff can view all children" ON public.children;

CREATE POLICY "Parents can view their own children" ON public.children
  FOR SELECT USING (auth.uid() = ANY (parent_ids));

CREATE POLICY "Admins manage children in their kita" ON public.children
  FOR ALL USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

CREATE POLICY "Teachers view children in their kita and groups" ON public.children
  FOR SELECT USING (
    public.is_teacher()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
    AND group_id IN (SELECT g.id FROM public.groups g WHERE g.educator_id = auth.uid())
  );

CREATE POLICY "Support staff view children in their kita" ON public.children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Teachers can view their assigned groups" ON public.groups;

CREATE POLICY "Users view groups by kita or assignment" ON public.groups
  FOR SELECT USING (
    (
      kita_id IS NOT NULL
      AND public.user_belongs_to_kita(auth.uid(), kita_id)
    )
    OR (
      public.is_teacher()
      AND educator_id = auth.uid()
      AND (
        kita_id IS NULL
        OR public.user_belongs_to_kita(auth.uid(), kita_id)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = groups.id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Admins manage groups in their kita" ON public.groups
  FOR ALL USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

-- ---------------------------------------------------------------------------
-- profiles (admin no longer global)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins view profiles in their kita" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
    AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.profile_id = profiles.id
          AND public.user_belongs_to_kita(auth.uid(), om.kita_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.child_guardians cg
        INNER JOIN public.children c ON c.id = cg.child_id
        WHERE cg.guardian_id = profiles.id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
      OR (
        profiles.default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), profiles.default_kita_id)
      )
    )
  );

CREATE POLICY "Admins manage profiles in their kita" ON public.profiles
  FOR ALL USING (
    public.is_admin()
    AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.profile_id = profiles.id
          AND public.user_belongs_to_kita(auth.uid(), om.kita_id)
      )
      OR (
        profiles.default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), profiles.default_kita_id)
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    AND (
      id = auth.uid()
      OR (
        default_kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), default_kita_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Support staff can manage attendance" ON public.attendance;

CREATE POLICY "Parents can view their children's attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins manage attendance in their kita" ON public.attendance
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

CREATE POLICY "Support staff manage attendance in their kita" ON public.attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'support')
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = attendance.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

-- ---------------------------------------------------------------------------
-- leave_requests & absence_submissions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins can update leave requests" ON public.leave_requests;

CREATE POLICY "Parents can view their own leave requests" ON public.leave_requests
  FOR SELECT USING (
    auth.uid() = parent_id
    OR EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = leave_requests.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = leave_requests.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Admins update leave requests in their kita" ON public.leave_requests
  FOR UPDATE USING (
    public.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = leave_requests.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Teachers and admins can view absence submissions" ON public.absence_submissions;
DROP POLICY IF EXISTS "Teachers and admins can create absence submissions" ON public.absence_submissions;

CREATE POLICY "Teachers and admins view absence submissions in their kita" ON public.absence_submissions
  FOR SELECT USING (
    (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.attendance a
        INNER JOIN public.children c ON c.id = a.child_id
        WHERE a.id = absence_submissions.attendance_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.attendance a
      INNER JOIN public.children c ON c.id = a.child_id
      WHERE a.id = absence_submissions.attendance_id
        AND auth.uid() = ANY (c.parent_ids)
    )
  );

CREATE POLICY "Teachers and admins create absence submissions in their kita" ON public.absence_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by
    AND public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.attendance a
      INNER JOIN public.children c ON c.id = a.child_id
      WHERE a.id = absence_submissions.attendance_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Kita feature tables (observations, reports, themes, etc.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view observations for their children" ON public.observations;
DROP POLICY IF EXISTS "Teachers and admins can create observations" ON public.observations;
DROP POLICY IF EXISTS "Teachers and admins can update observations" ON public.observations;

CREATE POLICY "Parents can view observations for their children" ON public.observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = observations.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins create observations in their kita" ON public.observations
  FOR INSERT WITH CHECK (
    auth.uid() = observer_id
    AND public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

CREATE POLICY "Teachers and admins update observations in their kita" ON public.observations
  FOR UPDATE USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = observations.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view daily reports for their children's groups" ON public.daily_reports;
DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON public.daily_reports;

CREATE POLICY "Parents can view daily reports for their children's groups" ON public.daily_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = daily_reports.group_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = daily_reports.group_id
          AND g.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage daily reports in their kita" ON public.daily_reports
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_reports.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_reports.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view development docs for their children" ON public.development_docs;
DROP POLICY IF EXISTS "Teachers and admins can manage development docs" ON public.development_docs;

CREATE POLICY "Parents can view development docs for their children" ON public.development_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = development_docs.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage development docs in their kita" ON public.development_docs
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = development_docs.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view portfolios for their children" ON public.portfolios;
DROP POLICY IF EXISTS "Teachers and admins can manage portfolios" ON public.portfolios;

CREATE POLICY "Parents can view portfolios for their children" ON public.portfolios
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = portfolios.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage portfolios in their kita" ON public.portfolios
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = portfolios.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view daily routines" ON public.daily_routines;
DROP POLICY IF EXISTS "Teachers and admins can manage daily routines" ON public.daily_routines;

CREATE POLICY "Users view daily routines for their group context" ON public.daily_routines
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND (
          (
            g.kita_id IS NOT NULL
            AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
          )
          OR EXISTS (
            SELECT 1
            FROM public.children c
            WHERE c.group_id = g.id
              AND auth.uid() = ANY (c.parent_ids)
          )
        )
    )
  );

CREATE POLICY "Teachers and admins manage daily routines in their kita" ON public.daily_routines
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = daily_routines.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view learning themes for their children's groups" ON public.learning_themes;
DROP POLICY IF EXISTS "Teachers and admins can manage learning themes" ON public.learning_themes;

CREATE POLICY "Parents can view learning themes for their children's groups" ON public.learning_themes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.group_id = learning_themes.group_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = learning_themes.group_id
          AND g.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage learning themes in their kita" ON public.learning_themes
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = learning_themes.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = learning_themes.group_id
        AND g.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), g.kita_id)
    )
  );

DROP POLICY IF EXISTS "Parents can view nap records for their children" ON public.nap_records;
DROP POLICY IF EXISTS "Teachers and admins can manage nap records" ON public.nap_records;

CREATE POLICY "Parents can view nap records for their children" ON public.nap_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND auth.uid() = ANY (c.parent_ids)
    )
    OR (
      public.is_admin_or_teacher()
      AND EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = nap_records.child_id
          AND c.kita_id IS NOT NULL
          AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
      )
    )
  );

CREATE POLICY "Teachers and admins manage nap records in their kita" ON public.nap_records
  FOR ALL USING (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  )
  WITH CHECK (
    public.is_admin_or_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = nap_records.child_id
        AND c.kita_id IS NOT NULL
        AND public.user_belongs_to_kita(auth.uid(), c.kita_id)
    )
  );

-- >>> FILE: supabase/migrations/add-teacher-filtering-functions.sql

-- Migration: Add teacher-specific filtering functions
-- This adds functions to help teachers see only their assigned groups' data

-- Function to check if current user is assigned as educator to a group
CREATE OR REPLACE FUNCTION is_educator_of_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_educator_id UUID;
BEGIN
  v_user_role := get_user_role();
  
  -- Admins can see all groups
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Teachers can only see their assigned groups
  IF v_user_role = 'teacher' THEN
    SELECT educator_id INTO v_educator_id
    FROM groups
    WHERE id = p_group_id;
    
    RETURN v_educator_id = auth.uid();
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to get all group IDs where current user is educator
CREATE OR REPLACE FUNCTION get_teacher_group_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_group_ids UUID[];
BEGIN
  v_user_role := get_user_role();
  
  -- Admins see all groups (return empty array means no filter)
  IF v_user_role = 'admin' THEN
    RETURN ARRAY[]::UUID[];
  END IF;
  
  -- Teachers see only their groups
  IF v_user_role = 'teacher' THEN
    SELECT ARRAY_AGG(id) INTO v_group_ids
    FROM groups
    WHERE educator_id = auth.uid();
    
    RETURN COALESCE(v_group_ids, ARRAY[]::UUID[]);
  END IF;
  
  RETURN ARRAY[]::UUID[];
END;
$$;

-- Update children policy to allow teachers to see children in their groups
DROP POLICY IF EXISTS "Teachers can view children in their groups" ON children;
CREATE POLICY "Teachers can view children in their groups" ON children
  FOR SELECT USING (
    auth.uid() = ANY(parent_ids) OR
    is_admin() OR
    (is_teacher() AND group_id IN (SELECT id FROM groups WHERE educator_id = auth.uid()))
  );

-- Update groups policy to allow teachers to view their assigned groups
DROP POLICY IF EXISTS "Teachers can view their assigned groups" ON groups;
CREATE POLICY "Teachers can view their assigned groups" ON groups
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_admin() OR
      (is_teacher() AND educator_id = auth.uid())
    )
  );

-- >>> FILE: supabase/migrations/20260330120000_profiles_ensure_self_select_rls.sql

-- Every authenticated user must be able to SELECT their own profiles row (hydration after login).
-- Without this, RLS can block fetchProfile when admin/tenant policies do not match yet.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- >>> FILE: supabase/migrations/20260331_fix_multi_tenancy_rls.sql

-- Cleanup and Fix Multi-tenancy RLS
-- This script ensures all tables are strictly isolated by kita_id or ownership.

-- 1. Ensure helper functions are robust and in public schema
CREATE OR REPLACE FUNCTION public.get_user_kita_id()
RETURNS UUID AS $$
  SELECT kita_id FROM public.organization_members 
  WHERE profile_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. GROUPS TABLE FIX
-- Drop the broad authenticated policy that causes leaks
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users view groups by kita or assignment" ON public.groups;

CREATE POLICY "Users view groups in their kita" ON public.groups
  FOR SELECT USING (
    kita_id = public.get_user_kita_id()
    OR EXISTS (
      SELECT 1 FROM public.children c 
      WHERE c.group_id = groups.id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 3. PROFILES TABLE FIX
-- Ensure admins can only see profiles in their own kita
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view profiles in their kita" ON public.profiles;

CREATE POLICY "Admins view profiles in their kita" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.profile_id = profiles.id 
      AND om.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE auth.uid() = ANY(c.parent_ids) AND profiles.id = ANY(c.parent_ids)
    )
  );

-- 4. CHILDREN TABLE FIX
DROP POLICY IF EXISTS "Staff can view kita children" ON public.children;
DROP POLICY IF EXISTS "Admins manage children in their kita" ON public.children;

CREATE POLICY "Staff view kita children" ON public.children
  FOR SELECT USING (kita_id = public.get_user_kita_id());

CREATE POLICY "Parents view own children" ON public.children
  FOR SELECT USING (auth.uid() = ANY(parent_ids));

-- 5. DAILY REPORTS FIX
DROP POLICY IF EXISTS "Parents can view daily reports for their children's groups" ON public.daily_reports;
DROP POLICY IF EXISTS "Teachers and admins can manage daily reports" ON public.daily_reports;

CREATE POLICY "Strict daily reports isolation" ON public.daily_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = daily_reports.group_id AND g.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.group_id = daily_reports.group_id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 6. ATTENDANCE FIX
DROP POLICY IF EXISTS "Staff can view kita attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;

CREATE POLICY "Strict attendance isolation" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = attendance.child_id AND c.kita_id = public.get_user_kita_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = attendance.child_id AND auth.uid() = ANY(c.parent_ids)
    )
  );

-- 7. Ensure kt@kg.com is correctly setup (Example/Seed fix)
-- This ensures the user has a kita_id if they are staff
DO $$
DECLARE
  target_user_id UUID;
  first_kita_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'kt@kg.com';
  SELECT id INTO first_kita_id FROM public.kitas LIMIT 1;
  
  IF target_user_id IS NOT NULL AND first_kita_id IS NOT NULL THEN
    INSERT INTO public.organization_members (profile_id, kita_id, org_role, organization_id)
    SELECT target_user_id, first_kita_id, 'staff', organization_id
    FROM public.kitas WHERE id = first_kita_id
    ON CONFLICT DO NOTHING;
    
    UPDATE public.profiles SET default_kita_id = first_kita_id WHERE id = target_user_id AND default_kita_id IS NULL;
  END IF;
END $$;

-- >>> FILE: supabase/migrations/20260331_storage_setup.sql

-- 1. Create the avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects (usually enabled by default in Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Delete existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 4. Create new strict policies
-- Anyone can view avatars (Public)
CREATE POLICY "Public Access to Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
-- Path format: <user_id>/avatar.jpg
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- >>> FILE: supabase/migrations/diagnose-and-fix-avatars.sql

-- Comprehensive diagnostic and fix for avatars bucket
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: DIAGNOSTIC - Check if bucket exists
-- ============================================
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE EXCEPTION 'ERROR: avatars bucket does not exist! Please create it manually in Supabase Dashboard > Storage > New Bucket. Name: avatars, Public: YES';
  ELSE
    RAISE NOTICE '✓ Bucket "avatars" exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Check current policies
-- ============================================
SELECT 
  'Current Storage Policies:' as info,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as action
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 3: Drop all existing avatar policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- ============================================
-- STEP 4: Create new policies with proper syntax
-- ============================================

-- Policy 1: Users can INSERT (upload) files to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 2: Users can UPDATE files in their own folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 3: Users can DELETE files in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 4: Anyone (including anonymous) can SELECT (view) avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- STEP 5: Verify policies were created
-- ============================================
SELECT 
  '✓ Policies Created:' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- ============================================
-- STEP 6: Test policy logic (replace with your user ID)
-- ============================================
-- Uncomment and replace YOUR_USER_ID to test:
-- SELECT 
--   auth.uid() as current_user_id,
--   'avatars' = 'avatars' as bucket_check,
--   (string_to_array('YOUR_USER_ID/avatar.jpg', '/'))[1] = auth.uid()::text as path_check;

-- ============================================
-- STEP 7: Ensure profiles table update policy exists
-- ============================================
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

SELECT '✓ Profile update policy verified' as status;

-- >>> FILE: supabase/migrations/fix-avatar-upload-rls.sql

-- Fix RLS policies for avatar uploads
-- This ensures users can upload their own avatars and update their profile

-- 1. Ensure storage bucket policies are correct
-- Drop and recreate storage policies for avatars bucket

-- Policy: Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 2. Ensure profiles table allows users to update their own profile (including avatar_url)
-- This should already exist, but let's make sure it's correct
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- >>> FILE: supabase/migrations/fix-avatar-upload-rls-v2.sql

-- Comprehensive fix for avatar upload RLS issues
-- Run this in Supabase SQL Editor

-- First, check if bucket exists (this will fail if bucket doesn't exist, which is expected)
-- You need to create the bucket manually in Supabase Dashboard first:
-- Storage > New Bucket > Name: "avatars", Public: YES

-- Drop all existing policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Policy 1: Users can upload files to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 2: Users can update files in their own folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 3: Users can delete files in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 4: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Verify profiles table update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Test query to verify policies (run as authenticated user)
-- SELECT * FROM storage.objects WHERE bucket_id = 'avatars';

-- >>> FILE: supabase/migrations/fix-profiles-policies-safe.sql

-- Safe migration: Drop and recreate profiles policies
-- This can be run multiple times without errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Use helper function if it exists, otherwise use direct check
DO $$
BEGIN
  -- Check if helper function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    -- Use helper function
    EXECUTE 'CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (is_admin())';
    
    EXECUTE 'CREATE POLICY "Admins can manage all profiles" ON profiles
      FOR ALL USING (is_admin())';
  ELSE
    -- Fallback to direct check
    CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "Admins can manage all profiles" ON profiles
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- >>> FILE: supabase/migrations/20260402120000_get_my_profile_hydration_rpc.sql

-- Client hydration for auth: read own profiles row + organization_members without
-- triggering profiles RLS (avoids 42P17 when policies still recurse despite helper fixes).
-- SECURITY DEFINER runs as function owner; SET LOCAL row_security = off skips RLS for these reads.
-- Only returns rows for auth.uid() — safe to expose to authenticated role.

CREATE OR REPLACE FUNCTION public.get_my_profile_hydration()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof jsonb;
  om jsonb;
BEGIN
  SET LOCAL row_security = off;

  SELECT to_jsonb(p.*)
  INTO prof
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF prof IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('kita_id', om.kita_id)),
    '[]'::jsonb
  )
  INTO om
  FROM public.organization_members om
  WHERE om.profile_id = auth.uid();

  RETURN prof || jsonb_build_object('organization_members', COALESCE(om, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile_hydration() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile_hydration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_hydration() TO service_role;

COMMENT ON FUNCTION public.get_my_profile_hydration() IS
  'Returns profiles row + organization_members for auth.uid(); bypasses RLS for hydration only.';

-- >>> FILE: supabase/migrations/20260403120000_fix_children_groups_rls_recursion.sql

-- Fix 42P17 infinite recursion on public.children (and stabilize public.groups).
-- Cause: groups SELECT policy contained EXISTS (SELECT 1 FROM children ...), while
-- children policies referenced groups (e.g. teacher subquery). RLS re-entered children ↔ groups.
-- Fix: SECURITY DEFINER helpers with SET LOCAL row_security = off for internal reads, and
-- replace direct cross-table policy embeds with those helpers.

CREATE OR REPLACE FUNCTION public.parent_has_child_in_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RETURN FALSE;
  END IF;
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.children c
    WHERE c.group_id = p_group_id
      AND auth.uid() = ANY (c.parent_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.group_educator_is_me(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RETURN FALSE;
  END IF;
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = p_group_id
      AND g.educator_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.parent_has_child_in_group(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.group_educator_is_me(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.parent_has_child_in_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_educator_is_me(uuid) TO authenticated;

-- groups: stop embedding children scans that re-trigger children RLS
DROP POLICY IF EXISTS "Users view groups in their kita" ON public.groups;

CREATE POLICY "Users view groups in their kita" ON public.groups
  FOR SELECT USING (
    kita_id = public.get_user_kita_id()
    OR public.parent_has_child_in_group(id)
  );

-- children: drop overlapping policies from various migrations, then recreate without groups subquery
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
DROP POLICY IF EXISTS "Parents view own children" ON public.children;
DROP POLICY IF EXISTS "Staff can view kita children" ON public.children;
DROP POLICY IF EXISTS "Staff view kita children" ON public.children;
DROP POLICY IF EXISTS "Admins manage children in their kita" ON public.children;
DROP POLICY IF EXISTS "Teachers view children in their kita and groups" ON public.children;
DROP POLICY IF EXISTS "Teachers view assigned children" ON public.children;
DROP POLICY IF EXISTS "Support staff view children in their kita" ON public.children;
DROP POLICY IF EXISTS "Support staff can view all children" ON public.children;
DROP POLICY IF EXISTS "Admins can manage all children" ON public.children;
DROP POLICY IF EXISTS "children_select_staff" ON public.children;
DROP POLICY IF EXISTS "children_select_parents" ON public.children;
DROP POLICY IF EXISTS "children_select_teachers" ON public.children;
DROP POLICY IF EXISTS "children_select_support" ON public.children;
DROP POLICY IF EXISTS "children_admin_manage" ON public.children;

CREATE POLICY "children_select_staff" ON public.children
  FOR SELECT USING (
    kita_id IS NOT NULL
    AND kita_id = public.get_user_kita_id()
  );

CREATE POLICY "children_select_parents" ON public.children
  FOR SELECT USING (auth.uid() = ANY (parent_ids));

CREATE POLICY "children_select_teachers" ON public.children
  FOR SELECT USING (
    public.is_teacher()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
    AND public.group_educator_is_me(group_id)
  );

CREATE POLICY "children_select_support" ON public.children
  FOR SELECT USING (
    public.is_support()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

CREATE POLICY "children_admin_manage" ON public.children
  FOR ALL
  USING (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  )
  WITH CHECK (
    public.is_admin()
    AND kita_id IS NOT NULL
    AND public.user_belongs_to_kita(auth.uid(), kita_id)
  );

-- >>> FILE: supabase/migrations/20260404120000_alter_rls_helpers_volatile.sql

-- PostgreSQL 0A000: SET LOCAL is not allowed in STABLE/IMMUTABLE functions.
-- Helpers that use SET row_security = off / SET LOCAL must be VOLATILE.

ALTER FUNCTION public.is_admin() VOLATILE;
ALTER FUNCTION public.is_teacher() VOLATILE;
ALTER FUNCTION public.is_admin_or_teacher() VOLATILE;
ALTER FUNCTION public.is_kitchen() VOLATILE;
ALTER FUNCTION public.is_support() VOLATILE;

ALTER FUNCTION public.get_user_kita_id() VOLATILE;

ALTER FUNCTION public.get_user_role() VOLATILE;
ALTER FUNCTION public.get_user_kita_id(uuid) VOLATILE;
ALTER FUNCTION public.user_belongs_to_kita(uuid, uuid) VOLATILE;

ALTER FUNCTION public.get_my_profile_hydration() VOLATILE;

ALTER FUNCTION public.parent_has_child_in_group(uuid) VOLATILE;
ALTER FUNCTION public.group_educator_is_me(uuid) VOLATILE;

-- >>> FILE: supabase/migrations/setup-avatars-bucket.sql

-- Migration: Setup avatars storage bucket with RLS policies
-- This bucket should be PUBLIC for easy access to profile pictures

-- Note: Bucket creation must be done manually in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Name: avatars
-- Public: YES (checked - make it public for easy access)
-- File size limit: 2 MB (or your preference)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- After creating the bucket manually, run this SQL to set up RLS policies:

-- Policy: Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- >>> FILE: supabase/migrations/setup-billing-documents-bucket.sql

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

-- >>> FILE: sql/tenant_site_builder.sql

-- Multi-tenant website/page-builder minimal schema (Postgres + Supabase RLS)
-- Apply this in your Supabase SQL editor.

create table if not exists public.kita_sites (
  kita_id uuid primary key references public.kitas(id) on delete cascade,
  slug text unique not null,
  published boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kita_sites enable row level security;

-- Admins of a kita can manage that kita's site config.
-- (PostgreSQL has no CREATE POLICY IF NOT EXISTS — drop then create for idempotent runs.)
drop policy if exists "kita_sites_admin_manage" on public.kita_sites;
create policy "kita_sites_admin_manage"
on public.kita_sites
for all
using (
  exists (
    select 1
    from public.organization_members om
    join public.profiles p on p.id = om.profile_id
    where om.profile_id = auth.uid()
      and om.kita_id = kita_sites.kita_id
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    join public.profiles p on p.id = om.profile_id
    where om.profile_id = auth.uid()
      and om.kita_id = kita_sites.kita_id
      and p.role = 'admin'
  )
);

-- Public can read published sites by slug.
drop policy if exists "kita_sites_public_read_published" on public.kita_sites;
create policy "kita_sites_public_read_published"
on public.kita_sites
for select
using (published = true);

