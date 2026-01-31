-- Allow authenticated users (and the app when user is logged in) to insert syllabus data.
-- This lets seedSyllabus() in the app populate subjects, units, topics when tables are empty.
-- Public read is already in 20250101000000_initial.sql (SELECT USING true).

CREATE POLICY "subjects_insert" ON subjects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "units_insert" ON units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "topics_insert" ON topics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
