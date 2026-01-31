-- Syllabus scope: Class 11 / Class 12 (for filtering). "Whole" = no filter.
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_class_11 BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_class_12 BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing rows so they appear in both filters (whole)
UPDATE topics SET is_class_11 = true, is_class_12 = true WHERE is_class_11 IS NULL OR is_class_12 IS NULL;

-- Index for fast filtered syllabus load
CREATE INDEX IF NOT EXISTS idx_topics_unit_scope ON topics(unit_id, is_class_11, is_class_12);
