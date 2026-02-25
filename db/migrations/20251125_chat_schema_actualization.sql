-- Stage 1 • Chat SQL schema actualization
-- This migration can be executed multiple times; it additive-aligns the production schema
-- with the canonical definition documented in docs/chat_sql_persistence.md.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Rename legacy chat_messages (id/user_id/message/timestamp) if it lacks the new columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_messages'
      AND column_name = 'message_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.chat_messages RENAME TO chat_messages_legacy';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS chats (
  chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtc_user_id BIGINT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  gtc_user_id BIGINT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalize column types on existing installs
ALTER TABLE chats
  ALTER COLUMN chat_id TYPE UUID USING chat_id::uuid,
  ALTER COLUMN gtc_user_id TYPE BIGINT USING gtc_user_id::bigint,
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz,
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::timestamptz,
  ALTER COLUMN is_deleted SET DEFAULT FALSE,
  ALTER COLUMN chat_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE chat_messages
  ALTER COLUMN message_id TYPE UUID USING message_id::uuid,
  ALTER COLUMN chat_id TYPE UUID USING chat_id::uuid,
  ALTER COLUMN gtc_user_id TYPE BIGINT USING gtc_user_id::bigint,
  ALTER COLUMN role TYPE TEXT,
  ALTER COLUMN content TYPE TEXT,
  ALTER COLUMN metadata TYPE JSONB USING (
    CASE
      WHEN metadata IS NULL THEN '{}'::jsonb
      ELSE metadata::text::jsonb
    END
  ),
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz,
  ALTER COLUMN message_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_role_check,
  ADD CONSTRAINT chat_messages_role_check CHECK (role IN ('user','assistant','system'));

ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at);

COMMIT;
