-- CPG-AUTH-003
-- Password credential and user session foundation for CrewPortGlobal.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.user_credentials (
  credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  login_email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_updated_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_credentials_login_email_chk CHECK (position('@' in login_email) > 1),
  CONSTRAINT user_credentials_password_hash_chk CHECK (length(password_hash) > 20),
  CONSTRAINT user_credentials_failed_login_attempts_chk CHECK (failed_login_attempts >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_login_email_uidx
  ON crewportglobal.user_credentials (lower(login_email));

CREATE INDEX IF NOT EXISTS user_credentials_user_idx
  ON crewportglobal.user_credentials (user_id);

CREATE TABLE IF NOT EXISTS crewportglobal.user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT user_sessions_token_hash_chk CHECK (length(session_token_hash) >= 32),
  CONSTRAINT user_sessions_expiry_chk CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS user_sessions_user_idx
  ON crewportglobal.user_sessions (user_id);

CREATE INDEX IF NOT EXISTS user_sessions_active_lookup_idx
  ON crewportglobal.user_sessions (session_token_hash, expires_at)
  WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS user_credentials_set_updated_at ON crewportglobal.user_credentials;
CREATE TRIGGER user_credentials_set_updated_at
BEFORE UPDATE ON crewportglobal.user_credentials
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
