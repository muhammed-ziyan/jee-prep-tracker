-- Ensure mock_tests and mock_test_subjects have exact schema expected by the app (snake_case).
-- Run this if you get PostgREST "column not found in schema cache" errors.

-- 0. Create mock_tests if it doesn't exist (correct schema from the start)
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 300,
  notes TEXT
);

-- Enable RLS if not already
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_tests_own" ON mock_tests;
CREATE POLICY "mock_tests_own" ON mock_tests FOR ALL USING (auth.uid() = user_id);

-- 1. mock_tests: fix columns on existing table (snake_case, test_date)
DO $$
BEGIN
  -- Rename "date" to "test_date" if it exists (reserved word fix)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'date') THEN
    ALTER TABLE mock_tests RENAME COLUMN date TO test_date;
  END IF;

  -- Add test_date if missing (e.g. table created without it)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'test_date') THEN
    ALTER TABLE mock_tests ADD COLUMN test_date DATE;
    UPDATE mock_tests SET test_date = CURRENT_DATE WHERE test_date IS NULL;
    ALTER TABLE mock_tests ALTER COLUMN test_date SET NOT NULL;
  END IF;

  -- Rename common wrong names to snake_case if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'maxscore') THEN
    ALTER TABLE mock_tests RENAME COLUMN maxscore TO max_score;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'totalscore') THEN
    ALTER TABLE mock_tests RENAME COLUMN totalscore TO total_score;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'userid') THEN
    ALTER TABLE mock_tests RENAME COLUMN userid TO user_id;
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'title') THEN
    ALTER TABLE mock_tests ADD COLUMN title TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'total_score') THEN
    ALTER TABLE mock_tests ADD COLUMN total_score INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'max_score') THEN
    ALTER TABLE mock_tests ADD COLUMN max_score INTEGER NOT NULL DEFAULT 300;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'notes') THEN
    ALTER TABLE mock_tests ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 2. mock_test_subjects: ensure extra columns exist
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT NULL;
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS unit_ids INTEGER[] DEFAULT NULL;
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS negative_marks INTEGER NOT NULL DEFAULT 0;

-- 3. Notify PostgREST to reload schema cache (Supabase handles this on migration; if self-hosted, may need to reload)
NOTIFY pgrst, 'reload schema';
