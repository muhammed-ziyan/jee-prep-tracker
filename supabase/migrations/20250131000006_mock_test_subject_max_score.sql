-- Add per-subject max score for tests with multiple subjects.
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT NULL;

COMMENT ON COLUMN mock_test_subjects.max_score IS 'Max marks for this subject in this test; used when test has multiple subjects.';

NOTIFY pgrst, 'reload schema';
