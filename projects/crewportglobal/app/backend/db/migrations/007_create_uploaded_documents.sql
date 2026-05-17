-- CPG-DOC-022
-- Protected uploaded document metadata for CrewPortGlobal.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.uploaded_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  draft_id UUID NOT NULL,
  card_id UUID,
  form_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_root TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  safe_extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash TEXT NOT NULL,
  upload_state TEXT NOT NULL,
  review_status TEXT NOT NULL,
  scan_status TEXT NOT NULL,
  scan_checked_at TIMESTAMPTZ,
  valid_from DATE,
  valid_until DATE,
  uploaded_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_by_document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  replaces_document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  hidden_from_user_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  assigned_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uploaded_documents_form_type_chk CHECK (
    form_type IN ('seafarer', 'employer', 'vessel')
  ),
  CONSTRAINT uploaded_documents_upload_state_chk CHECK (
    upload_state IN (
      'draft_selected',
      'upload_received',
      'quarantine_pending_scan',
      'scan_passed',
      'scan_failed',
      'stored_protected',
      'upload_rejected',
      'replaced_hidden',
      'deleted_with_card_or_account'
    )
  ),
  CONSTRAINT uploaded_documents_review_status_chk CHECK (
    review_status IN (
      'not_submitted',
      'pending_human_review',
      'under_review',
      'verified',
      'rejected',
      'correction_requested',
      'superseded'
    )
  ),
  CONSTRAINT uploaded_documents_scan_status_chk CHECK (
    scan_status IN (
      'not_scanned',
      'pending',
      'clean',
      'infected',
      'scan_error',
      'blocked'
    )
  ),
  CONSTRAINT uploaded_documents_safe_extension_chk CHECK (
    safe_extension IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
  ),
  CONSTRAINT uploaded_documents_file_size_chk CHECK (
    file_size_bytes > 0 AND file_size_bytes <= 10485760
  ),
  CONSTRAINT uploaded_documents_sha256_hash_chk CHECK (
    sha256_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT uploaded_documents_validity_order_chk CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
  )
);

CREATE INDEX IF NOT EXISTS uploaded_documents_draft_id_idx
  ON crewportglobal.uploaded_documents (draft_id);

CREATE INDEX IF NOT EXISTS uploaded_documents_form_type_idx
  ON crewportglobal.uploaded_documents (form_type);

CREATE INDEX IF NOT EXISTS uploaded_documents_document_type_idx
  ON crewportglobal.uploaded_documents (document_type);

CREATE INDEX IF NOT EXISTS uploaded_documents_review_status_idx
  ON crewportglobal.uploaded_documents (review_status);

CREATE INDEX IF NOT EXISTS uploaded_documents_scan_status_idx
  ON crewportglobal.uploaded_documents (scan_status);

CREATE INDEX IF NOT EXISTS uploaded_documents_sha256_hash_idx
  ON crewportglobal.uploaded_documents (sha256_hash);

CREATE INDEX IF NOT EXISTS uploaded_documents_uploaded_at_idx
  ON crewportglobal.uploaded_documents (uploaded_at DESC);

CREATE INDEX IF NOT EXISTS uploaded_documents_visible_document_idx
  ON crewportglobal.uploaded_documents (draft_id, form_type, document_type, uploaded_at DESC)
  WHERE hidden_from_user_at IS NULL
    AND upload_state NOT IN ('replaced_hidden', 'deleted_with_card_or_account');

DROP TRIGGER IF EXISTS uploaded_documents_set_updated_at ON crewportglobal.uploaded_documents;
CREATE TRIGGER uploaded_documents_set_updated_at
BEFORE UPDATE ON crewportglobal.uploaded_documents
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
