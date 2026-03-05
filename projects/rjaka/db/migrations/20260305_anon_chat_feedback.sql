-- mirror from db/migrations/20260305_anon_chat_feedback.sql
ALTER TABLE IF EXISTS anon_chat_messages
  ADD COLUMN IF NOT EXISTS feedback_like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_dislike_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_updated_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_anon_chat_messages_feedback_updated
  ON anon_chat_messages (feedback_updated_at DESC NULLS LAST);
