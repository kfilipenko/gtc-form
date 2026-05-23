-- CPG-DEMAND-013
-- Internal operator shortlist drafts before employer-facing presentation.
-- Additive/idempotent migration: safe to re-run after 015.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.operator_shortlist_drafts (
  shortlist_draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_request_id UUID NOT NULL REFERENCES crewportglobal.vacancy_requests(vacancy_request_id) ON DELETE CASCADE,
  created_by_operator_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_model TEXT NOT NULL,
  search_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_guard_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_status TEXT NOT NULL DEFAULT 'draft',
  employer_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT operator_shortlist_drafts_status_chk CHECK (
    draft_status IN ('draft', 'needs_review', 'approved_internal', 'rejected', 'archived')
  ),
  CONSTRAINT operator_shortlist_drafts_internal_only_chk CHECK (
    employer_visible IS FALSE
  ),
  CONSTRAINT operator_shortlist_drafts_operator_context_object_chk CHECK (
    jsonb_typeof(created_by_operator_context) = 'object'
  ),
  CONSTRAINT operator_shortlist_drafts_search_snapshot_object_chk CHECK (
    jsonb_typeof(search_snapshot) = 'object'
  ),
  CONSTRAINT operator_shortlist_drafts_guard_snapshot_object_chk CHECK (
    jsonb_typeof(approval_guard_snapshot) = 'object'
  )
);

CREATE INDEX IF NOT EXISTS operator_shortlist_drafts_vacancy_idx
  ON crewportglobal.operator_shortlist_drafts (vacancy_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operator_shortlist_drafts_status_idx
  ON crewportglobal.operator_shortlist_drafts (draft_status, created_at DESC);

CREATE TABLE IF NOT EXISTS crewportglobal.operator_shortlist_candidates (
  shortlist_candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_draft_id UUID NOT NULL REFERENCES crewportglobal.operator_shortlist_drafts(shortlist_draft_id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE RESTRICT,
  candidate_search_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  match_level TEXT,
  blocker_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_guard_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  operator_decision TEXT NOT NULL DEFAULT 'hold',
  operator_note TEXT,
  employer_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operator_shortlist_candidates_decision_chk CHECK (
    operator_decision IN ('include', 'hold', 'exclude')
  ),
  CONSTRAINT operator_shortlist_candidates_match_level_chk CHECK (
    match_level IS NULL OR match_level IN ('match_ready', 'review_possible', 'blocked')
  ),
  CONSTRAINT operator_shortlist_candidates_internal_only_chk CHECK (
    employer_visible IS FALSE
  ),
  CONSTRAINT operator_shortlist_candidates_search_result_object_chk CHECK (
    jsonb_typeof(candidate_search_result) = 'object'
  ),
  CONSTRAINT operator_shortlist_candidates_blocker_codes_array_chk CHECK (
    jsonb_typeof(blocker_codes) = 'array'
  ),
  CONSTRAINT operator_shortlist_candidates_guard_result_object_chk CHECK (
    jsonb_typeof(approval_guard_result) = 'object'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS operator_shortlist_candidates_draft_candidate_uidx
  ON crewportglobal.operator_shortlist_candidates (shortlist_draft_id, candidate_user_id);

CREATE INDEX IF NOT EXISTS operator_shortlist_candidates_candidate_idx
  ON crewportglobal.operator_shortlist_candidates (candidate_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operator_shortlist_candidates_decision_idx
  ON crewportglobal.operator_shortlist_candidates (operator_decision, created_at DESC);

COMMIT;
