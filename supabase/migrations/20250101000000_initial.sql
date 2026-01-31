-- JEE Prep Tracker: Supabase schema (snake_case columns)
-- Run in Supabase SQL Editor or via Supabase CLI

-- Subjects (Physics, Chemistry, Maths)
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Units (chapters under a subject)
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Topics (under a unit)
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  unit_id INTEGER NOT NULL REFERENCES units(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  is_important BOOLEAN DEFAULT false,
  weightage TEXT
);

-- User topic progress (links to auth.users via user_id)
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  last_revised_at TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id),
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revision schedule
CREATE TABLE IF NOT EXISTS revision_schedules (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ
);

-- Backlog items
CREATE TABLE IF NOT EXISTS backlog_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  type TEXT NOT NULL DEFAULT 'concept' CHECK (type IN ('concept', 'practice', 'forgetting')),
  deadline TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock tests (id as UUID to match Supabase conventions and avoid FK type mismatch)
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  total_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  notes TEXT
);

-- Mock test subject scores
CREATE TABLE IF NOT EXISTS mock_test_subjects (
  id SERIAL PRIMARY KEY,
  mock_test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  score INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unattempted_count INTEGER DEFAULT 0
);

-- Enable RLS on all user-data tables
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_subjects ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own rows
CREATE POLICY "user_topic_progress_own" ON user_topic_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "study_sessions_own" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "revision_schedules_own" ON revision_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "backlog_items_own" ON backlog_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mock_tests_own" ON mock_tests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mock_test_subjects_own" ON mock_test_subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM mock_tests m WHERE m.id = mock_test_id AND m.user_id = auth.uid())
);

-- Public read for syllabus (subjects, units, topics)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read" ON subjects FOR SELECT USING (true);
CREATE POLICY "units_read" ON units FOR SELECT USING (true);
CREATE POLICY "topics_read" ON topics FOR SELECT USING (true);

-- Syllabus is seeded by the app (seedSyllabus) with full JEE Main Paper 1 syllabus.
