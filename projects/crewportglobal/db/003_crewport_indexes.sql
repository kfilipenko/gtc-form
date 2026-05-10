-- ProjectOwner: CrewPortGlobal
-- PackageFile: 003_crewport_indexes.sql
-- PackageRole: planning_only_indexes
-- ExecutionPolicy: do_not_execute_without_explicit_manual_approval
-- Notes:
--   1. Planning artifact only.
--   2. Do not apply on production DB.
--   3. Do not apply on test DB.
--   4. Do not change global auth schema from this workstream.
--   5. Do not change current Stripe workflow from this workstream.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_physical_persons_email
  ON crewport.physical_persons (lower(primary_email));
CREATE INDEX IF NOT EXISTS idx_crewport_physical_persons_gtc_user
  ON crewport.physical_persons (gtc_user_id)
  WHERE gtc_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crewport_user_roles_person
  ON crewport.user_roles (person_id, role_code, assignment_state);
CREATE INDEX IF NOT EXISTS idx_crewport_user_roles_business
  ON crewport.user_roles (business_client_id, role_code, assignment_state)
  WHERE business_client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_user_roles_active
  ON crewport.user_roles (
    person_id,
    COALESCE(business_client_id, '00000000-0000-0000-0000-000000000000'::uuid),
    role_code
  )
  WHERE assignment_state = 'active';

CREATE INDEX IF NOT EXISTS idx_crewport_seafarers_registration_state
  ON crewport.seafarers (registration_state);
CREATE INDEX IF NOT EXISTS idx_crewport_seafarers_rank_department
  ON crewport.seafarers (rank_code, department_code);

CREATE INDEX IF NOT EXISTS idx_crewport_seafarer_documents_owner
  ON crewport.seafarer_documents (seafarer_id, document_type);
CREATE INDEX IF NOT EXISTS idx_crewport_seafarer_documents_expiry
  ON crewport.seafarer_documents (expires_at);
CREATE INDEX IF NOT EXISTS idx_crewport_seafarer_documents_verification_state
  ON crewport.seafarer_documents (verification_state);

CREATE INDEX IF NOT EXISTS idx_crewport_business_clients_state
  ON crewport.business_clients (onboarding_state, verification_state);
CREATE INDEX IF NOT EXISTS idx_crewport_business_clients_registration_number
  ON crewport.business_clients (registration_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_business_clients_identity_active
  ON crewport.business_clients (jurisdiction_code, lower(registration_number))
  WHERE registration_number IS NOT NULL
    AND onboarding_state <> 'draft';

CREATE INDEX IF NOT EXISTS idx_crewport_company_representatives_business
  ON crewport.company_representatives (business_client_id, is_primary, invitation_state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_company_representatives_one_primary
  ON crewport.company_representatives (business_client_id)
  WHERE is_primary = true
    AND invitation_state <> 'revoked';

CREATE INDEX IF NOT EXISTS idx_crewport_representative_documents_owner
  ON crewport.representative_documents (representative_id, document_type);

CREATE INDEX IF NOT EXISTS idx_crewport_business_documents_owner
  ON crewport.business_documents (business_client_id, document_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_vessels_imo_number
  ON crewport.vessels (imo_number)
  WHERE imo_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_vessels_mmsi
  ON crewport.vessels (mmsi)
  WHERE mmsi IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crewport_business_client_vessels_business
  ON crewport.business_client_vessels (business_client_id, relationship_state);
CREATE INDEX IF NOT EXISTS idx_crewport_business_client_vessels_vessel
  ON crewport.business_client_vessels (vessel_id, relationship_state);

CREATE INDEX IF NOT EXISTS idx_crewport_vessel_documents_owner
  ON crewport.vessel_documents (vessel_id, document_type);

CREATE INDEX IF NOT EXISTS idx_crewport_crew_requests_state
  ON crewport.crew_requests (request_state, needed_by_date);
CREATE INDEX IF NOT EXISTS idx_crewport_crew_requests_business_client
  ON crewport.crew_requests (business_client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crewport_request_positions_request
  ON crewport.crew_request_positions (crew_request_id, status);
CREATE INDEX IF NOT EXISTS idx_crewport_request_positions_rank
  ON crewport.crew_request_positions (rank_code, department_code);

CREATE INDEX IF NOT EXISTS idx_crewport_candidate_matches_queue
  ON crewport.candidate_matches (review_queue_state, created_at);
CREATE INDEX IF NOT EXISTS idx_crewport_candidate_matches_state
  ON crewport.candidate_matches (match_state, score DESC NULLS LAST);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_candidate_matches_current_attempt
  ON crewport.candidate_matches (crew_request_position_id, seafarer_id)
  WHERE is_current_attempt = true;

CREATE INDEX IF NOT EXISTS idx_crewport_verification_events_subject
  ON crewport.verification_events (subject_type, subject_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crewport_verification_events_outcome
  ON crewport.verification_events (outcome, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_crewport_consent_records_person
  ON crewport.consent_records (person_id, consent_type, accepted_at DESC)
  WHERE person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crewport_consent_records_business
  ON crewport.consent_records (business_client_id, consent_type, accepted_at DESC)
  WHERE business_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crewport_billing_accounts_scope
  ON crewport.billing_accounts (account_scope, account_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_billing_accounts_person
  ON crewport.billing_accounts (person_id)
  WHERE person_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crewport_billing_accounts_business
  ON crewport.billing_accounts (business_client_id)
  WHERE business_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crewport_service_entitlements_status
  ON crewport.service_entitlements (entitlement_status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_crewport_service_entitlements_billing_account
  ON crewport.service_entitlements (billing_account_id, entitlement_code);

CREATE INDEX IF NOT EXISTS idx_crewport_complaint_records_status
  ON crewport.complaint_records (complaint_status, severity, received_at DESC);

COMMIT;