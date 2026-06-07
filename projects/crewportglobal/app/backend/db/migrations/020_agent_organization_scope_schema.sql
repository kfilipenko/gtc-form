-- CPG-BIZ-113
-- Agent Organization and Access Scope runtime schema.
--
-- Approved for runtime migration after CPG-BIZ-111/112 agent role
-- separation, authority evidence, duplicate/account-claim and
-- agent-created object-scope review.
--
-- Additive schema only. No seed data.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.agent_organizations (
  agent_organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_company_id UUID REFERENCES crewportglobal.employer_companies(company_id) ON DELETE SET NULL,
  agent_code TEXT NOT NULL,
  agent_display_name TEXT NOT NULL,
  organization_kind TEXT NOT NULL DEFAULT 'external_crewing',
  agent_status TEXT NOT NULL DEFAULT 'draft',
  authority_status TEXT NOT NULL DEFAULT 'not_submitted',
  platform_service_agreement_status TEXT NOT NULL DEFAULT 'not_accepted',
  default_routing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  public_listing_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  suspended_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT agent_organizations_code_chk CHECK (
    agent_code ~ '^[A-Z0-9][A-Z0-9_-]{2,63}$'
  ),
  CONSTRAINT agent_organizations_kind_chk CHECK (
    organization_kind IN ('gtc_operated', 'external_crewing', 'shipowner_internal', 'other')
  ),
  CONSTRAINT agent_organizations_status_chk CHECK (
    agent_status IN (
      'draft',
      'submitted_for_review',
      'under_review',
      'verified',
      'limited',
      'suspended',
      'rejected',
      'archived'
    )
  ),
  CONSTRAINT agent_organizations_authority_status_chk CHECK (
    authority_status IN (
      'not_submitted',
      'submitted',
      'under_review',
      'verified',
      'limited',
      'expired',
      'rejected',
      'revoked'
    )
  ),
  CONSTRAINT agent_organizations_platform_agreement_status_chk CHECK (
    platform_service_agreement_status IN (
      'not_accepted',
      'accepted',
      'superseded',
      'revoked'
    )
  ),
  CONSTRAINT agent_organizations_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT agent_organizations_approved_status_chk CHECK (
    (agent_status IN ('verified', 'limited') AND approved_at IS NOT NULL)
    OR agent_status NOT IN ('verified', 'limited')
  ),
  CONSTRAINT agent_organizations_suspended_status_chk CHECK (
    (agent_status = 'suspended' AND suspended_at IS NOT NULL)
    OR agent_status <> 'suspended'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_organizations_code_uidx
  ON crewportglobal.agent_organizations (agent_code);

CREATE INDEX IF NOT EXISTS agent_organizations_company_idx
  ON crewportglobal.agent_organizations (linked_company_id);

CREATE INDEX IF NOT EXISTS agent_organizations_status_idx
  ON crewportglobal.agent_organizations (agent_status, authority_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_organizations_default_routing_idx
  ON crewportglobal.agent_organizations (default_routing_enabled, agent_status)
  WHERE default_routing_enabled IS TRUE;

CREATE TABLE IF NOT EXISTS crewportglobal.agent_users (
  agent_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_organization_id UUID NOT NULL REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  agent_user_role TEXT NOT NULL DEFAULT 'operator',
  membership_status TEXT NOT NULL DEFAULT 'invited',
  granted_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  revoked_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_users_role_chk CHECK (
    agent_user_role IN ('owner', 'manager', 'operator', 'reviewer', 'viewer')
  ),
  CONSTRAINT agent_users_status_chk CHECK (
    membership_status IN ('invited', 'active', 'suspended', 'revoked')
  ),
  CONSTRAINT agent_users_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT agent_users_active_grant_chk CHECK (
    (membership_status = 'active' AND granted_at IS NOT NULL AND revoked_at IS NULL)
    OR membership_status <> 'active'
  ),
  CONSTRAINT agent_users_revoked_chk CHECK (
    (membership_status = 'revoked' AND revoked_at IS NOT NULL)
    OR membership_status <> 'revoked'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_users_active_agent_user_uidx
  ON crewportglobal.agent_users (agent_organization_id, user_id)
  WHERE membership_status = 'active';

CREATE INDEX IF NOT EXISTS agent_users_user_idx
  ON crewportglobal.agent_users (user_id, membership_status);

CREATE INDEX IF NOT EXISTS agent_users_agent_idx
  ON crewportglobal.agent_users (agent_organization_id, membership_status, agent_user_role);

CREATE TABLE IF NOT EXISTS crewportglobal.agent_authority_documents (
  agent_authority_document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_organization_id UUID NOT NULL REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE CASCADE,
  document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  authority_type TEXT NOT NULL,
  authority_scope_type TEXT NOT NULL DEFAULT 'platform',
  authority_scope_object_id UUID,
  authority_status TEXT NOT NULL DEFAULT 'draft',
  valid_from DATE,
  valid_until DATE,
  reviewed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  source_reference TEXT,
  scope_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT agent_authority_documents_type_chk CHECK (
    authority_type IN (
      'platform_service_agreement',
      'shipowner_agency_agreement',
      'vessel_authority',
      'seafarer_authorization',
      'company_registration',
      'representative_authority',
      'power_of_attorney',
      'data_processing_authority',
      'other'
    )
  ),
  CONSTRAINT agent_authority_documents_scope_type_chk CHECK (
    authority_scope_type IN (
      'platform',
      'company',
      'vessel',
      'seafarer_profile',
      'vacancy_request',
      'contract_workspace',
      'multiple',
      'other'
    )
  ),
  CONSTRAINT agent_authority_documents_status_chk CHECK (
    authority_status IN (
      'draft',
      'submitted',
      'under_review',
      'verified',
      'limited',
      'rejected',
      'expired',
      'revoked',
      'superseded'
    )
  ),
  CONSTRAINT agent_authority_documents_validity_chk CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT agent_authority_documents_scope_snapshot_object_chk CHECK (
    jsonb_typeof(scope_snapshot) = 'object'
  ),
  CONSTRAINT agent_authority_documents_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT agent_authority_documents_reviewed_status_chk CHECK (
    (authority_status IN ('verified', 'limited', 'rejected', 'expired', 'revoked') AND reviewed_at IS NOT NULL)
    OR authority_status NOT IN ('verified', 'limited', 'rejected', 'expired', 'revoked')
  )
);

CREATE INDEX IF NOT EXISTS agent_authority_documents_agent_idx
  ON crewportglobal.agent_authority_documents (agent_organization_id, authority_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_authority_documents_document_idx
  ON crewportglobal.agent_authority_documents (document_id);

CREATE INDEX IF NOT EXISTS agent_authority_documents_scope_idx
  ON crewportglobal.agent_authority_documents (authority_scope_type, authority_scope_object_id, authority_status);

CREATE TABLE IF NOT EXISTS crewportglobal.agent_object_creation_requests (
  agent_object_creation_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_organization_id UUID NOT NULL REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE CASCADE,
  requested_by_agent_user_id UUID REFERENCES crewportglobal.agent_users(agent_user_id) ON DELETE SET NULL,
  intended_object_type TEXT NOT NULL,
  represented_party_type TEXT NOT NULL,
  represented_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  represented_company_id UUID REFERENCES crewportglobal.employer_companies(company_id) ON DELETE SET NULL,
  represented_seafarer_profile_id UUID REFERENCES crewportglobal.seafarer_profiles(seafarer_profile_id) ON DELETE SET NULL,
  represented_vessel_id UUID REFERENCES crewportglobal.vessels(vessel_id) ON DELETE SET NULL,
  source_authority_document_id UUID REFERENCES crewportglobal.agent_authority_documents(agent_authority_document_id) ON DELETE SET NULL,
  creation_status TEXT NOT NULL DEFAULT 'draft',
  duplicate_check_status TEXT NOT NULL DEFAULT 'not_run',
  created_object_type TEXT,
  created_object_id UUID,
  object_safe_summary TEXT,
  submitted_payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicate_match_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_note TEXT,
  reviewed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT agent_object_creation_requests_intended_type_chk CHECK (
    intended_object_type IN (
      'person_user',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request'
    )
  ),
  CONSTRAINT agent_object_creation_requests_party_type_chk CHECK (
    represented_party_type IN (
      'seafarer',
      'shipowner',
      'employer_company',
      'vessel_owner',
      'vessel_operator',
      'ship_manager',
      'crew_manager',
      'unknown'
    )
  ),
  CONSTRAINT agent_object_creation_requests_status_chk CHECK (
    creation_status IN (
      'draft',
      'submitted',
      'duplicate_check_required',
      'duplicate_found',
      'evidence_requested',
      'approved_to_create',
      'created_linked',
      'blocked_duplicate',
      'rejected',
      'cancelled'
    )
  ),
  CONSTRAINT agent_object_creation_requests_duplicate_status_chk CHECK (
    duplicate_check_status IN (
      'not_run',
      'no_match',
      'possible_match',
      'confirmed_duplicate',
      'review_required',
      'cleared'
    )
  ),
  CONSTRAINT agent_object_creation_requests_created_type_chk CHECK (
    created_object_type IS NULL OR created_object_type IN (
      'person_user',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request'
    )
  ),
  CONSTRAINT agent_object_creation_requests_created_link_chk CHECK (
    (creation_status = 'created_linked' AND created_object_type IS NOT NULL AND created_object_id IS NOT NULL)
    OR creation_status <> 'created_linked'
  ),
  CONSTRAINT agent_object_creation_requests_reviewed_status_chk CHECK (
    (
      creation_status IN ('approved_to_create', 'created_linked', 'blocked_duplicate', 'rejected')
      AND reviewed_at IS NOT NULL
    )
    OR creation_status NOT IN ('approved_to_create', 'created_linked', 'blocked_duplicate', 'rejected')
  ),
  CONSTRAINT agent_object_creation_requests_payload_object_chk CHECK (
    jsonb_typeof(submitted_payload_snapshot) = 'object'
  ),
  CONSTRAINT agent_object_creation_requests_duplicate_snapshot_object_chk CHECK (
    jsonb_typeof(duplicate_match_snapshot) = 'object'
  ),
  CONSTRAINT agent_object_creation_requests_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_agent_idx
  ON crewportglobal.agent_object_creation_requests (agent_organization_id, creation_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_intended_type_idx
  ON crewportglobal.agent_object_creation_requests (intended_object_type, creation_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_duplicate_idx
  ON crewportglobal.agent_object_creation_requests (duplicate_check_status, creation_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_created_object_idx
  ON crewportglobal.agent_object_creation_requests (created_object_type, created_object_id)
  WHERE created_object_type IS NOT NULL AND created_object_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_represented_user_idx
  ON crewportglobal.agent_object_creation_requests (represented_user_id, creation_status)
  WHERE represented_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_object_creation_requests_represented_company_idx
  ON crewportglobal.agent_object_creation_requests (represented_company_id, creation_status)
  WHERE represented_company_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crewportglobal.agent_object_assignments (
  agent_object_assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_organization_id UUID NOT NULL REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'proposed',
  assignment_source TEXT NOT NULL DEFAULT 'platform_control',
  visibility_scope TEXT NOT NULL DEFAULT 'ordinary_execution',
  data_responsibility_status TEXT NOT NULL DEFAULT 'agent_responsible',
  source_authority_document_id UUID REFERENCES crewportglobal.agent_authority_documents(agent_authority_document_id) ON DELETE SET NULL,
  source_creation_request_id UUID REFERENCES crewportglobal.agent_object_creation_requests(agent_object_creation_request_id) ON DELETE SET NULL,
  assigned_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  assigned_agent_user_id UUID REFERENCES crewportglobal.agent_users(agent_user_id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  replaced_by_assignment_id UUID REFERENCES crewportglobal.agent_object_assignments(agent_object_assignment_id) ON DELETE SET NULL,
  replacement_reason TEXT,
  object_safe_summary TEXT,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT agent_object_assignments_object_type_chk CHECK (
    object_type IN (
      'person_user',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request',
      'vacancy_application',
      'shortlist_draft',
      'shortlist_candidate',
      'contract_workspace',
      'voyage_support_record'
    )
  ),
  CONSTRAINT agent_object_assignments_status_chk CHECK (
    assignment_status IN (
      'proposed',
      'active',
      'limited',
      'suspended',
      'reassigned',
      'revoked',
      'expired',
      'archived'
    )
  ),
  CONSTRAINT agent_object_assignments_source_chk CHECK (
    assignment_source IN (
      'default_routing',
      'authority_document',
      'platform_control',
      'claim_resolution',
      'migration',
      'manual_control'
    )
  ),
  CONSTRAINT agent_object_assignments_visibility_scope_chk CHECK (
    visibility_scope IN ('ordinary_execution', 'limited_execution', 'control_only', 'audit_only')
  ),
  CONSTRAINT agent_object_assignments_responsibility_chk CHECK (
    data_responsibility_status IN ('agent_responsible', 'platform_control', 'owner_responsible', 'shared_review')
  ),
  CONSTRAINT agent_object_assignments_validity_chk CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT agent_object_assignments_active_assigned_at_chk CHECK (
    (assignment_status IN ('active', 'limited') AND assigned_at IS NOT NULL)
    OR assignment_status NOT IN ('active', 'limited')
  ),
  CONSTRAINT agent_object_assignments_snapshot_object_chk CHECK (
    jsonb_typeof(source_snapshot) = 'object'
  ),
  CONSTRAINT agent_object_assignments_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_object_assignments_active_object_uidx
  ON crewportglobal.agent_object_assignments (object_type, object_id)
  WHERE assignment_status IN ('active', 'limited');

CREATE INDEX IF NOT EXISTS agent_object_assignments_agent_idx
  ON crewportglobal.agent_object_assignments (agent_organization_id, assignment_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_object_assignments_object_idx
  ON crewportglobal.agent_object_assignments (object_type, object_id, assignment_status);

CREATE INDEX IF NOT EXISTS agent_object_assignments_creation_request_idx
  ON crewportglobal.agent_object_assignments (source_creation_request_id)
  WHERE source_creation_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_object_assignments_user_idx
  ON crewportglobal.agent_object_assignments (assigned_agent_user_id, assignment_status)
  WHERE assigned_agent_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crewportglobal.account_object_claims (
  account_object_claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_type TEXT NOT NULL,
  claimant_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  claimant_agent_organization_id UUID REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE SET NULL,
  target_object_type TEXT,
  target_object_id UUID,
  claimed_email TEXT,
  claimed_company_registration_number TEXT,
  claimed_country_code CHAR(2),
  claimed_imo_number TEXT,
  claimed_document_hash TEXT,
  duplicate_match_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_document_id UUID REFERENCES crewportglobal.uploaded_documents(document_id) ON DELETE SET NULL,
  claim_status TEXT NOT NULL DEFAULT 'submitted',
  reviewed_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT,
  linked_assignment_id UUID REFERENCES crewportglobal.agent_object_assignments(agent_object_assignment_id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_object_claims_type_chk CHECK (
    claim_type IN (
      'person_account',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request',
      'agent_authority'
    )
  ),
  CONSTRAINT account_object_claims_target_type_chk CHECK (
    target_object_type IS NULL OR target_object_type IN (
      'person_user',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request',
      'agent_organization'
    )
  ),
  CONSTRAINT account_object_claims_status_chk CHECK (
    claim_status IN (
      'submitted',
      'under_review',
      'evidence_requested',
      'approved_linked',
      'approved_new_record',
      'rejected',
      'cancelled',
      'blocked_duplicate',
      'limited_pending'
    )
  ),
  CONSTRAINT account_object_claims_claimant_chk CHECK (
    claimant_user_id IS NOT NULL OR claimant_agent_organization_id IS NOT NULL
  ),
  CONSTRAINT account_object_claims_country_code_chk CHECK (
    claimed_country_code IS NULL OR claimed_country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT account_object_claims_imo_chk CHECK (
    claimed_imo_number IS NULL OR claimed_imo_number ~ '^[0-9]{7}$'
  ),
  CONSTRAINT account_object_claims_doc_hash_chk CHECK (
    claimed_document_hash IS NULL OR claimed_document_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT account_object_claims_email_chk CHECK (
    claimed_email IS NULL OR position('@' in claimed_email) > 1
  ),
  CONSTRAINT account_object_claims_duplicate_snapshot_object_chk CHECK (
    jsonb_typeof(duplicate_match_snapshot) = 'object'
  ),
  CONSTRAINT account_object_claims_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT account_object_claims_review_status_chk CHECK (
    (claim_status IN ('approved_linked', 'approved_new_record', 'rejected', 'blocked_duplicate') AND reviewed_at IS NOT NULL)
    OR claim_status NOT IN ('approved_linked', 'approved_new_record', 'rejected', 'blocked_duplicate')
  )
);

CREATE INDEX IF NOT EXISTS account_object_claims_status_idx
  ON crewportglobal.account_object_claims (claim_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS account_object_claims_claimant_user_idx
  ON crewportglobal.account_object_claims (claimant_user_id, claim_status)
  WHERE claimant_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_object_claims_claimant_agent_idx
  ON crewportglobal.account_object_claims (claimant_agent_organization_id, claim_status)
  WHERE claimant_agent_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_object_claims_target_idx
  ON crewportglobal.account_object_claims (target_object_type, target_object_id, claim_status)
  WHERE target_object_type IS NOT NULL AND target_object_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_object_claims_email_idx
  ON crewportglobal.account_object_claims (lower(claimed_email))
  WHERE claimed_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_object_claims_company_reg_idx
  ON crewportglobal.account_object_claims (claimed_company_registration_number, claimed_country_code)
  WHERE claimed_company_registration_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_object_claims_imo_idx
  ON crewportglobal.account_object_claims (claimed_imo_number)
  WHERE claimed_imo_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS crewportglobal.agent_scope_audit_events (
  agent_scope_audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  agent_organization_id UUID REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE SET NULL,
  agent_user_id UUID REFERENCES crewportglobal.agent_users(agent_user_id) ON DELETE SET NULL,
  agent_object_creation_request_id UUID REFERENCES crewportglobal.agent_object_creation_requests(agent_object_creation_request_id) ON DELETE SET NULL,
  agent_object_assignment_id UUID REFERENCES crewportglobal.agent_object_assignments(agent_object_assignment_id) ON DELETE SET NULL,
  account_object_claim_id UUID REFERENCES crewportglobal.account_object_claims(account_object_claim_id) ON DELETE SET NULL,
  target_object_type TEXT,
  target_object_id UUID,
  previous_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_scope_audit_events_type_chk CHECK (length(trim(event_type)) > 0),
  CONSTRAINT agent_scope_audit_events_previous_object_chk CHECK (
    jsonb_typeof(previous_value) = 'object'
  ),
  CONSTRAINT agent_scope_audit_events_new_object_chk CHECK (
    jsonb_typeof(new_value) = 'object'
  )
);

CREATE INDEX IF NOT EXISTS agent_scope_audit_events_created_idx
  ON crewportglobal.agent_scope_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS agent_scope_audit_events_agent_idx
  ON crewportglobal.agent_scope_audit_events (agent_organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_scope_audit_events_creation_request_idx
  ON crewportglobal.agent_scope_audit_events (agent_object_creation_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_scope_audit_events_assignment_idx
  ON crewportglobal.agent_scope_audit_events (agent_object_assignment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_scope_audit_events_claim_idx
  ON crewportglobal.agent_scope_audit_events (account_object_claim_id, created_at DESC);

DROP TRIGGER IF EXISTS agent_organizations_set_updated_at ON crewportglobal.agent_organizations;
CREATE TRIGGER agent_organizations_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_organizations
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS agent_users_set_updated_at ON crewportglobal.agent_users;
CREATE TRIGGER agent_users_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_users
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS agent_authority_documents_set_updated_at ON crewportglobal.agent_authority_documents;
CREATE TRIGGER agent_authority_documents_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_authority_documents
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS agent_object_creation_requests_set_updated_at ON crewportglobal.agent_object_creation_requests;
CREATE TRIGGER agent_object_creation_requests_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_object_creation_requests
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS agent_object_assignments_set_updated_at ON crewportglobal.agent_object_assignments;
CREATE TRIGGER agent_object_assignments_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_object_assignments
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS account_object_claims_set_updated_at ON crewportglobal.account_object_claims;
CREATE TRIGGER account_object_claims_set_updated_at
BEFORE UPDATE ON crewportglobal.account_object_claims
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
