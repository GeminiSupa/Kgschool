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
