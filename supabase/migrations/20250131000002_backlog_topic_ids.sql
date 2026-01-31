-- Support multiple topics per backlog item (topic-wise "clubbed" card)
ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS topic_ids INTEGER[] DEFAULT NULL;

-- Backfill: existing rows with topic_id get topic_ids = ARRAY[topic_id]
UPDATE backlog_items SET topic_ids = ARRAY[topic_id] WHERE topic_id IS NOT NULL AND (topic_ids IS NULL OR topic_ids = '{}');
