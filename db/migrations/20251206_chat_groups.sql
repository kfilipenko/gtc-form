-- Stage 2 • Persistent chat groups
-- Adds reusable group metadata per gtc_user_id along with a linking table.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS chat_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtc_user_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_group_links (
  chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES chat_groups(group_id) ON DELETE CASCADE,
  gtc_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_groups_owner ON chat_groups(gtc_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_groups_owner_name ON chat_groups(gtc_user_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_chat_group_links_owner ON chat_group_links(gtc_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_links_group ON chat_group_links(group_id);

COMMIT;
