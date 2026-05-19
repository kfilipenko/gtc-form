-- CPG-SEAFARER-018
-- Versioned seafarer consent events for purpose-specific approval guards.
-- Idempotent migration: safe to re-run.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.seafarer_consent_events (
  consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seafarer_profile_id UUID REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE CASCADE,
  draft_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  text_version TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  accepted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  source_page TEXT NOT NULL,
  actor_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'owner',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seafarer_consent_events_type_chk CHECK (
    consent_type IN (
      'profile_review',
      'matching_preparation',
      'employer_sharing',
      'document_verification',
      'sensitive_medical_processing',
      'reference_contact_verification'
    )
  ),
  CONSTRAINT seafarer_consent_events_actor_type_chk CHECK (
    actor_type IN ('owner', 'transition_owner', 'operator', 'team', 'system')
  ),
  CONSTRAINT seafarer_consent_events_action_chk CHECK (
    accepted_at IS NOT NULL OR withdrawn_at IS NOT NULL
  ),
  CONSTRAINT seafarer_consent_events_language_chk CHECK (
    language ~ '^[a-z]{2}(-[A-Z]{2})?$'
  )
);

CREATE INDEX IF NOT EXISTS seafarer_consent_events_draft_type_idx
  ON crewportglobal.seafarer_consent_events (draft_id, consent_type, accepted_at DESC, withdrawn_at DESC);

CREATE INDEX IF NOT EXISTS seafarer_consent_events_profile_type_idx
  ON crewportglobal.seafarer_consent_events (seafarer_profile_id, consent_type, accepted_at DESC)
  WHERE seafarer_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS seafarer_consent_events_active_idx
  ON crewportglobal.seafarer_consent_events (draft_id, consent_type)
  WHERE accepted_at IS NOT NULL AND withdrawn_at IS NULL;

COMMIT;
