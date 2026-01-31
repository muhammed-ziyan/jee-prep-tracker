-- Avoid PostgREST schema cache issue with reserved word "date"
-- Only rename if "date" exists (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mock_tests' AND column_name = 'date'
  ) THEN
    ALTER TABLE mock_tests RENAME COLUMN date TO test_date;
  END IF;
END $$;
