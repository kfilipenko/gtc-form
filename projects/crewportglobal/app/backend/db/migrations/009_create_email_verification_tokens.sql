-- CPG-AUTH-004
-- Email verification, account activation and verified cabinet access foundation.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE crewportglobal.users
  ADD COLUMN IF NOT EXISTS email_verification_status TEXT NOT NULL DEFAULT 'unverified';

ALTER TABLE crewportglobal.users
  DROP CONSTRAINT IF EXISTS users_email_verification_status_chk;

ALTER TABLE crewportglobal.users
  ADD CONSTRAINT users_email_verification_status_chk CHECK (
    email_verification_status IN (
      'unverified',
      'pending',
      'verified',
      'verification_expired'
    )
  );

UPDATE crewportglobal.users
SET email_verification_status = CASE
  WHEN email_verified_at IS NOT NULL THEN 'verified'
  WHEN email_verification_status IS NULL THEN 'unverified'
  ELSE email_verification_status
END;

CREATE TABLE IF NOT EXISTS crewportglobal.email_verification_tokens (
  email_verification_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'account_email_verification',
  token_state TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  delivery_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT email_verification_tokens_email_chk CHECK (position('@' in email) > 1),
  CONSTRAINT email_verification_tokens_hash_chk CHECK (length(verification_token_hash) >= 32),
  CONSTRAINT email_verification_tokens_purpose_chk CHECK (
    purpose IN ('account_email_verification')
  ),
  CONSTRAINT email_verification_tokens_state_chk CHECK (
    token_state IN ('pending', 'used', 'expired', 'revoked')
  ),
  CONSTRAINT email_verification_tokens_expires_chk CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx
  ON crewportglobal.email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS email_verification_tokens_email_idx
  ON crewportglobal.email_verification_tokens (lower(email));

CREATE INDEX IF NOT EXISTS email_verification_tokens_pending_idx
  ON crewportglobal.email_verification_tokens (user_id, expires_at)
  WHERE token_state = 'pending';

DROP TRIGGER IF EXISTS email_verification_tokens_set_updated_at ON crewportglobal.email_verification_tokens;
CREATE TRIGGER email_verification_tokens_set_updated_at
BEFORE UPDATE ON crewportglobal.email_verification_tokens
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
