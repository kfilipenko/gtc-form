-- userid
CREATE TABLE userid (
  gtc_user_id TEXT,
  uuid TEXT,
  created_at TEXT
);

-- emailaccounts
CREATE TABLE emailaccounts (
  gtc_user_id TEXT,
  email TEXT,
  password TEXT,
  created_at TEXT,
  verified BOOLEAN
);

-- google_oauth
CREATE TABLE google_oauth (
  gtc_user_id TEXT,
  google_id TEXT,
  email TEXT,
  name TEXT,
  picture TEXT,
  locale TEXT,
  created_at TEXT
);

-- telegram_accounts
CREATE TABLE telegram_accounts (
  gtc_user_id TEXT,
  telegram_id TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TEXT
);

-- github_accounts
CREATE TABLE github_accounts (
  gtc_user_id TEXT,
  github_id TEXT,
  username TEXT,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT
);

-- wix_accounts
CREATE TABLE wix_accounts (
  gtc_user_id TEXT,
  wix_id TEXT,
  email TEXT,
  name TEXT,
  created_at TEXT
);

-- tilda_accounts
CREATE TABLE tilda_accounts (
  gtc_user_id TEXT,
  tilda_id TEXT,
  email TEXT,
  name TEXT,
  created_at TEXT
);

-- user_history
CREATE TABLE user_history (
  gtc_user_id TEXT,
  source TEXT,
  prompt TEXT,
  timestamp TEXT,
  executionMode TEXT
);

-- extensions required for UUID helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- chats: SQL persistence for web conversations
CREATE TABLE IF NOT EXISTS chats (
  chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtc_user_id BIGINT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- chat_messages: transcript for each chat
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  gtc_user_id BIGINT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at);
