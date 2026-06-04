-- CPG-BIZ-097
-- Contract Agreement Workspace schema SQL draft.
--
-- IMPORTANT:
-- This file is documentation-only and MUST NOT be executed without a separate
-- Project Owner approval and migration review.
--
-- Intended future location after approval:
-- projects/crewportglobal/app/backend/db/migrations/018_contract_workspace_schema.sql

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.master_contract_templates (
  master_contract_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code TEXT NOT NULL,
  template_version TEXT NOT NULL,
  template_title TEXT NOT NULL,
  authoritative_language CHAR(2) NOT NULL DEFAULT 'en',
  template_status TEXT NOT NULL DEFAULT 'draft',
  template_hash TEXT,
  approved_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  superseded_by_template_id UUID REFERENCES crewportglobal.master_contract_templates(master_contract_template_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT master_contract_templates_language_chk CHECK (
    authoritative_language = 'en'
  ),
  CONSTRAINT master_contract_templates_status_chk CHECK (
    template_status IN ('draft', 'legal_review', 'approved', 'superseded', 'archived')
  ),
  CONSTRAINT master_contract_templates_hash_chk CHECK (
    template_hash IS NULL OR template_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS master_contract_templates_code_version_uidx
  ON crewportglobal.master_contract_templates (template_code, template_version);

CREATE INDEX IF NOT EXISTS master_contract_templates_status_idx
  ON crewportglobal.master_contract_templates (template_status, created_at DESC);

CREATE TABLE IF NOT EXISTS crewportglobal.master_contract_clauses (
  master_contract_clause_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_contract_template_id UUID NOT NULL REFERENCES crewportglobal.master_contract_templates(master_contract_template_id) ON DELETE CASCADE,
  clause_id TEXT NOT NULL,
  clause_order INTEGER NOT NULL,
  clause_title TEXT NOT NULL,
  fixed_clause_text TEXT NOT NULL,
  variable_field_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  clause_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT master_contract_clauses_clause_id_chk CHECK (
    clause_id ~ '^MC-[0-9]{3}$'
  ),
  CONSTRAINT master_contract_clauses_order_chk CHECK (
    clause_order > 0
  ),
  CONSTRAINT master_contract_clauses_fields_array_chk CHECK (
    jsonb_typeof(variable_field_codes) = 'array'
  ),
  CONSTRAINT master_contract_clauses_hash_chk CHECK (
    clause_hash IS NULL OR clause_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS master_contract_clauses_template_clause_uidx
  ON crewportglobal.master_contract_clauses (master_contract_template_id, clause_id);

CREATE UNIQUE INDEX IF NOT EXISTS master_contract_clauses_template_order_uidx
  ON crewportglobal.master_contract_clauses (master_contract_template_id, clause_order);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_field_catalogs (
  contract_field_catalog_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_code TEXT NOT NULL,
  catalog_version TEXT NOT NULL,
  catalog_title TEXT NOT NULL,
  catalog_status TEXT NOT NULL DEFAULT 'draft',
  approved_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_field_catalogs_status_chk CHECK (
    catalog_status IN ('draft', 'review', 'approved', 'superseded', 'archived')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_field_catalogs_code_version_uidx
  ON crewportglobal.contract_field_catalogs (catalog_code, catalog_version);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_field_catalog_values (
  contract_field_catalog_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_field_catalog_id UUID NOT NULL REFERENCES crewportglobal.contract_field_catalogs(contract_field_catalog_id) ON DELETE CASCADE,
  value_code TEXT NOT NULL,
  value_label TEXT NOT NULL,
  value_description TEXT,
  value_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_control_exception BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_field_catalog_values_order_chk CHECK (
    value_order > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_field_catalog_values_catalog_code_uidx
  ON crewportglobal.contract_field_catalog_values (contract_field_catalog_id, value_code);

CREATE INDEX IF NOT EXISTS contract_field_catalog_values_active_idx
  ON crewportglobal.contract_field_catalog_values (contract_field_catalog_id, is_active, value_order);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_workspace_instances (
  contract_workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_number TEXT NOT NULL,
  workspace_status TEXT NOT NULL DEFAULT 'draft_from_platform_data',
  master_contract_template_id UUID NOT NULL REFERENCES crewportglobal.master_contract_templates(master_contract_template_id) ON DELETE RESTRICT,
  contract_field_catalog_id UUID NOT NULL REFERENCES crewportglobal.contract_field_catalogs(contract_field_catalog_id) ON DELETE RESTRICT,
  seafarer_profile_id UUID NOT NULL REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE RESTRICT,
  employer_company_id UUID NOT NULL REFERENCES crewportglobal.employer_companies(company_id) ON DELETE RESTRICT,
  vessel_id UUID NOT NULL REFERENCES crewportglobal.vessels(vessel_id) ON DELETE RESTRICT,
  vacancy_request_id UUID NOT NULL REFERENCES crewportglobal.vacancy_requests(vacancy_request_id) ON DELETE RESTRICT,
  shortlist_draft_id UUID REFERENCES crewportglobal.operator_shortlist_drafts(shortlist_draft_id) ON DELETE SET NULL,
  vacancy_application_id UUID REFERENCES crewportglobal.vacancy_applications(vacancy_application_id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  assigned_group_code TEXT,
  assigned_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  blocked_reason_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_hash TEXT,
  source_snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT contract_workspace_instances_status_chk CHECK (
    workspace_status IN (
      'draft_from_platform_data',
      'prepare_fields',
      'blocked_missing_data',
      'blocked_catalog_exception',
      'party_review',
      'correction_requested',
      'ready_for_signature',
      'signed_pending_generation',
      'generated',
      'voided',
      'superseded'
    )
  ),
  CONSTRAINT contract_workspace_instances_blockers_object_chk CHECK (
    jsonb_typeof(blocked_reason_snapshot) = 'object'
  ),
  CONSTRAINT contract_workspace_instances_preview_hash_chk CHECK (
    preview_hash IS NULL OR preview_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT contract_workspace_instances_source_hash_chk CHECK (
    source_snapshot_hash IS NULL OR source_snapshot_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_workspace_instances_number_uidx
  ON crewportglobal.contract_workspace_instances (workspace_number);

CREATE INDEX IF NOT EXISTS contract_workspace_instances_vacancy_idx
  ON crewportglobal.contract_workspace_instances (vacancy_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_workspace_instances_seafarer_idx
  ON crewportglobal.contract_workspace_instances (seafarer_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_workspace_instances_employer_idx
  ON crewportglobal.contract_workspace_instances (employer_company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_workspace_instances_status_idx
  ON crewportglobal.contract_workspace_instances (workspace_status, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_workspace_instances_assignment_idx
  ON crewportglobal.contract_workspace_instances (assigned_group_code, assigned_user_id, workspace_status);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_embedded_field_values (
  contract_embedded_field_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_workspace_id UUID NOT NULL REFERENCES crewportglobal.contract_workspace_instances(contract_workspace_id) ON DELETE CASCADE,
  field_code TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  choice_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_object_type TEXT,
  source_object_id UUID,
  source_field_code TEXT,
  source_status_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_code TEXT,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_value TEXT,
  requiredness TEXT NOT NULL DEFAULT 'required',
  completion_status TEXT NOT NULL DEFAULT 'missing',
  last_changed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  last_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_embedded_field_values_field_code_chk CHECK (
    field_code ~ '^C-[0-9]+[.][0-9]+$'
  ),
  CONSTRAINT contract_embedded_field_values_clause_id_chk CHECK (
    clause_id ~ '^MC-[0-9]{3}$'
  ),
  CONSTRAINT contract_embedded_field_values_choice_type_chk CHECK (
    choice_type IN (
      'single',
      'multiple',
      'linked_record',
      'computed',
      'date',
      'number',
      'money',
      'text_controlled',
      'document_reference',
      'signature'
    )
  ),
  CONSTRAINT contract_embedded_field_values_source_type_chk CHECK (
    source_type IN ('catalog', 'linked_record', 'computed', 'controlled_input', 'document_reference')
  ),
  CONSTRAINT contract_embedded_field_values_source_object_type_chk CHECK (
    source_object_type IS NULL OR source_object_type IN (
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request',
      'shortlist_draft',
      'vacancy_application',
      'uploaded_document',
      'contract_workspace'
    )
  ),
  CONSTRAINT contract_embedded_field_values_source_status_object_chk CHECK (
    jsonb_typeof(source_status_snapshot) = 'object'
  ),
  CONSTRAINT contract_embedded_field_values_value_object_chk CHECK (
    jsonb_typeof(value_json) = 'object'
  ),
  CONSTRAINT contract_embedded_field_values_requiredness_chk CHECK (
    requiredness IN ('required', 'conditional', 'optional')
  ),
  CONSTRAINT contract_embedded_field_values_completion_status_chk CHECK (
    completion_status IN ('missing', 'draft', 'ready', 'blocked', 'approved')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_embedded_field_values_workspace_field_uidx
  ON crewportglobal.contract_embedded_field_values (contract_workspace_id, field_code);

CREATE INDEX IF NOT EXISTS contract_embedded_field_values_clause_idx
  ON crewportglobal.contract_embedded_field_values (contract_workspace_id, clause_id);

CREATE INDEX IF NOT EXISTS contract_embedded_field_values_status_idx
  ON crewportglobal.contract_embedded_field_values (completion_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS contract_embedded_field_values_source_idx
  ON crewportglobal.contract_embedded_field_values (source_object_type, source_object_id);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_workspace_party_approvals (
  contract_workspace_party_approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_workspace_id UUID NOT NULL REFERENCES crewportglobal.contract_workspace_instances(contract_workspace_id) ON DELETE CASCADE,
  party_type TEXT NOT NULL,
  party_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL DEFAULT 'not_requested',
  approved_preview_hash TEXT,
  approval_note TEXT,
  ip_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_workspace_party_approvals_party_type_chk CHECK (
    party_type IN ('seafarer', 'employer', 'platform_reviewer', 'control')
  ),
  CONSTRAINT contract_workspace_party_approvals_status_chk CHECK (
    approval_status IN ('not_requested', 'requested', 'approved', 'rejected', 'correction_requested', 'withdrawn')
  ),
  CONSTRAINT contract_workspace_party_approvals_hash_chk CHECK (
    approved_preview_hash IS NULL OR approved_preview_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT contract_workspace_party_approvals_ip_context_object_chk CHECK (
    jsonb_typeof(ip_context) = 'object'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contract_workspace_party_approvals_workspace_party_uidx
  ON crewportglobal.contract_workspace_party_approvals (
    contract_workspace_id,
    party_type,
    COALESCE(party_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS contract_workspace_party_approvals_status_idx
  ON crewportglobal.contract_workspace_party_approvals (approval_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS crewportglobal.generated_contract_instances (
  generated_contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_workspace_id UUID NOT NULL REFERENCES crewportglobal.contract_workspace_instances(contract_workspace_id) ON DELETE RESTRICT,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  document_reference TEXT,
  master_contract_template_id UUID NOT NULL REFERENCES crewportglobal.master_contract_templates(master_contract_template_id) ON DELETE RESTRICT,
  contract_field_catalog_id UUID NOT NULL REFERENCES crewportglobal.contract_field_catalogs(contract_field_catalog_id) ON DELETE RESTRICT,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot_hash TEXT NOT NULL,
  generated_document_hash TEXT NOT NULL,
  generated_status TEXT NOT NULL DEFAULT 'generated',
  generated_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  superseded_by_generated_contract_id UUID REFERENCES crewportglobal.generated_contract_instances(generated_contract_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT generated_contract_instances_source_object_chk CHECK (
    jsonb_typeof(source_snapshot) = 'object'
  ),
  CONSTRAINT generated_contract_instances_source_hash_chk CHECK (
    source_snapshot_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT generated_contract_instances_document_hash_chk CHECK (
    generated_document_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT generated_contract_instances_status_chk CHECK (
    generated_status IN ('generated', 'signature_pending', 'signed', 'voided', 'superseded')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS generated_contract_instances_workspace_active_uidx
  ON crewportglobal.generated_contract_instances (contract_workspace_id)
  WHERE generated_status IN ('generated', 'signature_pending', 'signed');

CREATE INDEX IF NOT EXISTS generated_contract_instances_status_idx
  ON crewportglobal.generated_contract_instances (generated_status, generated_at DESC);

CREATE TABLE IF NOT EXISTS crewportglobal.contract_generation_audit_events (
  contract_generation_audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  contract_workspace_id UUID REFERENCES crewportglobal.contract_workspace_instances(contract_workspace_id) ON DELETE SET NULL,
  generated_contract_id UUID REFERENCES crewportglobal.generated_contract_instances(generated_contract_id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  actor_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  field_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot_hash TEXT,
  preview_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contract_generation_audit_events_event_type_chk CHECK (
    event_type IN (
      'contract_workspace_created',
      'contract_workspace_field_changed',
      'contract_workspace_guard_recomputed',
      'contract_workspace_review_requested',
      'contract_workspace_party_approved',
      'contract_workspace_party_correction_requested',
      'contract_workspace_blocked',
      'contract_workspace_preview_generated',
      'contract_instance_generated',
      'contract_workspace_voided',
      'contract_workspace_superseded'
    )
  ),
  CONSTRAINT contract_generation_audit_events_actor_context_object_chk CHECK (
    jsonb_typeof(actor_context) = 'object'
  ),
  CONSTRAINT contract_generation_audit_events_field_codes_array_chk CHECK (
    jsonb_typeof(field_codes) = 'array'
  ),
  CONSTRAINT contract_generation_audit_events_payload_object_chk CHECK (
    jsonb_typeof(event_payload) = 'object'
  ),
  CONSTRAINT contract_generation_audit_events_source_hash_chk CHECK (
    source_snapshot_hash IS NULL OR source_snapshot_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT contract_generation_audit_events_preview_hash_chk CHECK (
    preview_hash IS NULL OR preview_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE INDEX IF NOT EXISTS contract_generation_audit_events_workspace_idx
  ON crewportglobal.contract_generation_audit_events (contract_workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_generation_audit_events_generated_idx
  ON crewportglobal.contract_generation_audit_events (generated_contract_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contract_generation_audit_events_event_type_idx
  ON crewportglobal.contract_generation_audit_events (event_type, created_at DESC);

DROP TRIGGER IF EXISTS master_contract_templates_set_updated_at ON crewportglobal.master_contract_templates;
CREATE TRIGGER master_contract_templates_set_updated_at
BEFORE UPDATE ON crewportglobal.master_contract_templates
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS master_contract_clauses_set_updated_at ON crewportglobal.master_contract_clauses;
CREATE TRIGGER master_contract_clauses_set_updated_at
BEFORE UPDATE ON crewportglobal.master_contract_clauses
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS contract_field_catalogs_set_updated_at ON crewportglobal.contract_field_catalogs;
CREATE TRIGGER contract_field_catalogs_set_updated_at
BEFORE UPDATE ON crewportglobal.contract_field_catalogs
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS contract_field_catalog_values_set_updated_at ON crewportglobal.contract_field_catalog_values;
CREATE TRIGGER contract_field_catalog_values_set_updated_at
BEFORE UPDATE ON crewportglobal.contract_field_catalog_values
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS contract_workspace_instances_set_updated_at ON crewportglobal.contract_workspace_instances;
CREATE TRIGGER contract_workspace_instances_set_updated_at
BEFORE UPDATE ON crewportglobal.contract_workspace_instances
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS contract_embedded_field_values_set_updated_at ON crewportglobal.contract_embedded_field_values;
CREATE TRIGGER contract_embedded_field_values_set_updated_at
BEFORE UPDATE ON crewportglobal.contract_embedded_field_values
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS contract_workspace_party_approvals_set_updated_at ON crewportglobal.contract_workspace_party_approvals;
CREATE TRIGGER contract_workspace_party_approvals_set_updated_at
BEFORE UPDATE ON crewportglobal.contract_workspace_party_approvals
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS generated_contract_instances_set_updated_at ON crewportglobal.generated_contract_instances;
CREATE TRIGGER generated_contract_instances_set_updated_at
BEFORE UPDATE ON crewportglobal.generated_contract_instances
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
