-- CPG-BIZ-127
-- Agent framework agreement offer and participant notification ledger.
--
-- Additive runtime schema for shipowner-to-agent framework offer,
-- checkbox acceptance, platform-side authority/assignment activation and
-- durable participant notifications. No seed data.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crewportglobal.agent_framework_agreement_offers (
  agent_framework_agreement_offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_number TEXT NOT NULL,
  shipowner_user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE RESTRICT,
  shipowner_company_id UUID NOT NULL REFERENCES crewportglobal.employer_companies(company_id) ON DELETE RESTRICT,
  agent_organization_id UUID NOT NULL REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE RESTRICT,
  represented_object_type TEXT NOT NULL DEFAULT 'employer_company',
  represented_object_id UUID NOT NULL,
  offer_status TEXT NOT NULL DEFAULT 'sent',
  framework_terms_status TEXT NOT NULL DEFAULT 'offered',
  authority_status TEXT NOT NULL DEFAULT 'pending',
  commercial_terms_status TEXT NOT NULL DEFAULT 'commercial_terms_pending',
  framework_template_code TEXT NOT NULL DEFAULT 'CPG-BIZ-132',
  framework_template_version TEXT NOT NULL DEFAULT '1.0',
  signature_method TEXT NOT NULL DEFAULT 'checkbox_acceptance',
  acceptance_text TEXT NOT NULL DEFAULT 'I agree to the Shipowner-Agent Agreement, authority document / power of attorney, mandatory appendices and CrewPortGlobal portal appointment rules. I understand that commercial terms are agreed separately unless fixed in a Service Order, commercial addendum, request or approved price-basis record.',
  delegated_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  contract_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_authority_document_id UUID REFERENCES crewportglobal.agent_authority_documents(agent_authority_document_id) ON DELETE SET NULL,
  agent_object_assignment_id UUID REFERENCES crewportglobal.agent_object_assignments(agent_object_assignment_id) ON DELETE SET NULL,
  offered_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CONSTRAINT agent_framework_offers_number_chk CHECK (length(trim(offer_number)) > 0),
  CONSTRAINT agent_framework_offers_object_type_chk CHECK (
    represented_object_type IN (
      'employer_company',
      'vessel',
      'vacancy_request',
      'contract_workspace'
    )
  ),
  CONSTRAINT agent_framework_offers_status_chk CHECK (
    offer_status IN (
      'draft',
      'sent',
      'accepted',
      'activated',
      'rejected',
      'expired',
      'cancelled'
    )
  ),
  CONSTRAINT agent_framework_offers_framework_status_chk CHECK (
    framework_terms_status IN (
      'offered',
      'accepted',
      'rejected',
      'expired',
      'revoked'
    )
  ),
  CONSTRAINT agent_framework_offers_authority_status_chk CHECK (
    authority_status IN (
      'pending',
      'issued_recorded',
      'verified',
      'limited',
      'rejected',
      'revoked'
    )
  ),
  CONSTRAINT agent_framework_offers_commercial_status_chk CHECK (
    commercial_terms_status IN (
      'commercial_terms_pending',
      'free_until_commercial_agreement',
      'service_order_accepted',
      'commercial_terms_accepted',
      'not_required',
      'rejected'
    )
  ),
  CONSTRAINT agent_framework_offers_signature_method_chk CHECK (
    signature_method IN (
      'checkbox_acceptance',
      'digital_signature',
      'uploaded_signed_pdf',
      'control_review'
    )
  ),
  CONSTRAINT agent_framework_offers_delegated_scope_object_chk CHECK (
    jsonb_typeof(delegated_scope) = 'object'
  ),
  CONSTRAINT agent_framework_offers_contract_snapshot_object_chk CHECK (
    jsonb_typeof(contract_snapshot) = 'object'
  ),
  CONSTRAINT agent_framework_offers_metadata_object_chk CHECK (
    jsonb_typeof(metadata) = 'object'
  ),
  CONSTRAINT agent_framework_offers_accepted_chk CHECK (
    (offer_status IN ('accepted', 'activated') AND framework_terms_status = 'accepted' AND accepted_at IS NOT NULL)
    OR offer_status NOT IN ('accepted', 'activated')
  ),
  CONSTRAINT agent_framework_offers_activated_chk CHECK (
    (offer_status = 'activated' AND activated_at IS NOT NULL AND source_authority_document_id IS NOT NULL AND agent_object_assignment_id IS NOT NULL)
    OR offer_status <> 'activated'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_framework_offers_number_uidx
  ON crewportglobal.agent_framework_agreement_offers (offer_number);

CREATE INDEX IF NOT EXISTS agent_framework_offers_shipowner_idx
  ON crewportglobal.agent_framework_agreement_offers (shipowner_company_id, offer_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_framework_offers_agent_idx
  ON crewportglobal.agent_framework_agreement_offers (agent_organization_id, offer_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_framework_offers_object_idx
  ON crewportglobal.agent_framework_agreement_offers (represented_object_type, represented_object_id, offer_status);

CREATE UNIQUE INDEX IF NOT EXISTS agent_framework_offers_open_object_agent_uidx
  ON crewportglobal.agent_framework_agreement_offers (shipowner_company_id, agent_organization_id, represented_object_type, represented_object_id)
  WHERE offer_status IN ('sent', 'accepted');

CREATE TABLE IF NOT EXISTS crewportglobal.participant_notification_ledger (
  participant_notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  recipient_agent_organization_id UUID REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE SET NULL,
  represented_object_type TEXT NOT NULL,
  represented_object_id UUID NOT NULL,
  agent_framework_agreement_offer_id UUID REFERENCES crewportglobal.agent_framework_agreement_offers(agent_framework_agreement_offer_id) ON DELETE SET NULL,
  agent_object_assignment_id UUID REFERENCES crewportglobal.agent_object_assignments(agent_object_assignment_id) ON DELETE SET NULL,
  agent_organization_id UUID REFERENCES crewportglobal.agent_organizations(agent_organization_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_stage TEXT NOT NULL,
  safe_summary TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'view',
  delivery_status TEXT NOT NULL DEFAULT 'recorded',
  document_reference_id UUID,
  payload_hash TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT participant_notification_recipient_chk CHECK (
    recipient_user_id IS NOT NULL OR recipient_agent_organization_id IS NOT NULL
  ),
  CONSTRAINT participant_notification_object_type_chk CHECK (
    represented_object_type IN (
      'person_user',
      'seafarer_profile',
      'employer_company',
      'vessel',
      'vacancy_request',
      'contract_workspace',
      'agent_framework_agreement_offer'
    )
  ),
  CONSTRAINT participant_notification_event_type_chk CHECK (length(trim(event_type)) > 0),
  CONSTRAINT participant_notification_event_stage_chk CHECK (length(trim(event_stage)) > 0),
  CONSTRAINT participant_notification_summary_chk CHECK (length(trim(safe_summary)) > 0),
  CONSTRAINT participant_notification_action_type_chk CHECK (
    action_type IN (
      'view',
      'accept',
      'reject',
      'review',
      'revoke',
      'replace',
      'control_review'
    )
  ),
  CONSTRAINT participant_notification_delivery_status_chk CHECK (
    delivery_status IN (
      'recorded',
      'delivered',
      'read',
      'failed',
      'suppressed'
    )
  ),
  CONSTRAINT participant_notification_payload_object_chk CHECK (
    jsonb_typeof(payload) = 'object'
  ),
  CONSTRAINT participant_notification_payload_hash_chk CHECK (
    payload_hash IS NULL OR payload_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE INDEX IF NOT EXISTS participant_notification_recipient_user_idx
  ON crewportglobal.participant_notification_ledger (recipient_user_id, created_at DESC)
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS participant_notification_recipient_agent_idx
  ON crewportglobal.participant_notification_ledger (recipient_agent_organization_id, created_at DESC)
  WHERE recipient_agent_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS participant_notification_offer_idx
  ON crewportglobal.participant_notification_ledger (agent_framework_agreement_offer_id, created_at DESC)
  WHERE agent_framework_agreement_offer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS participant_notification_assignment_idx
  ON crewportglobal.participant_notification_ledger (agent_object_assignment_id, created_at DESC)
  WHERE agent_object_assignment_id IS NOT NULL;

DROP TRIGGER IF EXISTS agent_framework_offers_set_updated_at ON crewportglobal.agent_framework_agreement_offers;
CREATE TRIGGER agent_framework_offers_set_updated_at
BEFORE UPDATE ON crewportglobal.agent_framework_agreement_offers
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

COMMIT;
