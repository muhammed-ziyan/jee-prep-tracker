-- Clear old (grouped) syllabus data so the app can reseed with split topics on next /api/syllabus.
-- Keeps subjects; removes units and topics. User progress/revision/backlog that reference topics are cleared or unlinked.

-- Remove rows that reference topics (FK constraints)
DELETE FROM user_topic_progress;
DELETE FROM revision_schedules;
UPDATE backlog_items SET topic_id = NULL WHERE topic_id IS NOT NULL;

-- Remove topics then units (subjects stay so seedSyllabus will repopulate units + topics)
DELETE FROM topics;
DELETE FROM units;
