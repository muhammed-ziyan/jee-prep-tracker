-- Mock test: scope (class 11/12/full) and unit selection per subject; negative marks per subject
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT NULL;
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS unit_ids INTEGER[] DEFAULT NULL;
ALTER TABLE mock_test_subjects ADD COLUMN IF NOT EXISTS negative_marks INTEGER NOT NULL DEFAULT 0;
