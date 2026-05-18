-- CPG-CABINET-027
-- Protected profile photo metadata for CrewPortGlobal user cabinet.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.user_profile_photos (
  profile_photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_root TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  safe_extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash TEXT NOT NULL,
  upload_state TEXT NOT NULL,
  scan_status TEXT NOT NULL,
  scan_checked_at TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_by_profile_photo_id UUID REFERENCES crewportglobal.user_profile_photos(profile_photo_id) ON DELETE SET NULL,
  replaces_profile_photo_id UUID REFERENCES crewportglobal.user_profile_photos(profile_photo_id) ON DELETE SET NULL,
  hidden_from_user_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_profile_photos_upload_state_chk CHECK (
    upload_state IN (
      'quarantine_pending_scan',
      'stored_protected',
      'scan_failed',
      'upload_rejected',
      'replaced_hidden',
      'deleted_with_account'
    )
  ),
  CONSTRAINT user_profile_photos_scan_status_chk CHECK (
    scan_status IN ('pending', 'clean', 'infected', 'scan_error', 'blocked')
  ),
  CONSTRAINT user_profile_photos_safe_extension_chk CHECK (
    safe_extension IN ('jpg', 'jpeg', 'png', 'webp')
  ),
  CONSTRAINT user_profile_photos_mime_type_chk CHECK (
    mime_type IN ('image/jpeg', 'image/png', 'image/webp')
  ),
  CONSTRAINT user_profile_photos_file_size_chk CHECK (
    file_size_bytes > 0 AND file_size_bytes <= 5242880
  ),
  CONSTRAINT user_profile_photos_sha256_hash_chk CHECK (
    sha256_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profile_photos_current_uidx
  ON crewportglobal.user_profile_photos (user_id)
  WHERE is_current = TRUE
    AND hidden_from_user_at IS NULL
    AND upload_state = 'stored_protected'
    AND scan_status = 'clean';

CREATE INDEX IF NOT EXISTS user_profile_photos_user_idx
  ON crewportglobal.user_profile_photos (user_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS user_profile_photos_scan_status_idx
  ON crewportglobal.user_profile_photos (scan_status);

CREATE INDEX IF NOT EXISTS user_profile_photos_sha256_hash_idx
  ON crewportglobal.user_profile_photos (sha256_hash);

DROP TRIGGER IF EXISTS user_profile_photos_set_updated_at ON crewportglobal.user_profile_photos;
CREATE TRIGGER user_profile_photos_set_updated_at
BEFORE UPDATE ON crewportglobal.user_profile_photos
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
