-- ProjectOwner: CrewPortGlobal
-- PackageFile: 004_crewport_views.sql
-- PackageRole: planning_only_views
-- ExecutionPolicy: do_not_execute_without_explicit_manual_approval
-- Notes:
--   1. Planning artifact only.
--   2. Do not apply on production DB.
--   3. Do not apply on test DB.
--   4. Do not change global auth schema from this workstream.
--   5. Do not change current Stripe workflow from this workstream.

BEGIN;

CREATE OR REPLACE VIEW crewport.seafarer_readiness AS
SELECT
  s.seafarer_id,
  p.person_id,
  p.crewport_user_id,
  p.gtc_user_id,
  p.full_name,
  p.primary_email,
  p.primary_email_verification_state,
  s.registration_state,
  s.availability_state,
  s.rank_code,
  s.department_code,
  COUNT(d.document_id) AS document_count,
  COUNT(*) FILTER (WHERE d.verification_state = 'verified') AS verified_document_count,
  COUNT(*) FILTER (WHERE d.verification_state IN ('pending', 'received', 'under_review')) AS pending_document_count,
  MIN(d.expires_at) FILTER (WHERE d.expires_at IS NOT NULL) AS earliest_document_expiry,
  CASE
    WHEN p.primary_email_verification_state = 'verified'
      AND s.registration_state IN ('active', 'under_review')
      AND COUNT(d.document_id) > 0
      AND COUNT(*) FILTER (WHERE d.verification_state = 'verified') > 0
    THEN 'ready_for_matching_review'
    WHEN COUNT(d.document_id) = 0 THEN 'missing_documents'
    ELSE 'incomplete'
  END AS readiness_state
FROM crewport.seafarers s
JOIN crewport.physical_persons p ON p.person_id = s.person_id
LEFT JOIN crewport.seafarer_documents d ON d.seafarer_id = s.seafarer_id
GROUP BY s.seafarer_id, p.person_id, p.crewport_user_id, p.gtc_user_id, p.full_name, p.primary_email, p.primary_email_verification_state, s.registration_state, s.availability_state, s.rank_code, s.department_code;

CREATE OR REPLACE VIEW crewport.business_readiness AS
SELECT
  bc.business_client_id,
  bc.legal_name,
  bc.trading_name,
  bc.registration_number,
  bc.operational_role,
  bc.onboarding_state,
  bc.verification_state,
  COUNT(DISTINCT cr.representative_id) AS representative_count,
  COUNT(DISTINCT cr.representative_id) FILTER (WHERE cr.verification_state = 'verified') AS verified_representative_count,
  COUNT(DISTINCT bd.business_document_id) AS business_document_count,
  COUNT(DISTINCT bd.business_document_id) FILTER (WHERE bd.verification_state = 'verified') AS verified_business_document_count,
  COUNT(DISTINCT bcv.vessel_id) FILTER (WHERE bcv.relationship_state = 'active') AS vessel_count,
  COUNT(DISTINCT bcv.vessel_id) FILTER (WHERE bcv.relationship_state = 'active' AND v.verification_state = 'verified') AS verified_vessel_count,
  CASE
    WHEN bc.verification_state = 'verified'
      AND COUNT(DISTINCT cr.representative_id) FILTER (WHERE cr.verification_state = 'verified') > 0
      AND COUNT(DISTINCT bd.business_document_id) FILTER (WHERE bd.verification_state = 'verified') > 0
    THEN 'ready_for_requests'
    WHEN bc.onboarding_state = 'draft' THEN 'draft'
    ELSE 'incomplete'
  END AS readiness_state
FROM crewport.business_clients bc
LEFT JOIN crewport.company_representatives cr ON cr.business_client_id = bc.business_client_id
LEFT JOIN crewport.business_documents bd ON bd.business_client_id = bc.business_client_id
LEFT JOIN crewport.business_client_vessels bcv ON bcv.business_client_id = bc.business_client_id
LEFT JOIN crewport.vessels v ON v.vessel_id = bcv.vessel_id
GROUP BY bc.business_client_id, bc.legal_name, bc.trading_name, bc.registration_number, bc.operational_role, bc.onboarding_state, bc.verification_state;

CREATE OR REPLACE VIEW crewport.open_crew_requests AS
SELECT
  r.crew_request_id,
  r.request_code,
  r.title,
  r.request_state,
  r.priority,
  r.needed_by_date,
  r.embarkation_window_start,
  r.embarkation_window_end,
  r.port_of_joining,
  bc.business_client_id,
  bc.legal_name AS business_client_name,
  v.vessel_name,
  rp.crew_request_position_id,
  rp.rank_code,
  rp.department_code,
  rp.quantity,
  rp.status AS position_status
FROM crewport.crew_requests r
JOIN crewport.business_clients bc ON bc.business_client_id = r.business_client_id
LEFT JOIN crewport.vessels v ON v.vessel_id = r.vessel_id
LEFT JOIN crewport.crew_request_positions rp ON rp.crew_request_id = r.crew_request_id
WHERE r.request_state IN ('open', 'under_review')
  AND rp.status IN ('open', 'shortlisting');

CREATE OR REPLACE VIEW crewport.match_review_queue AS
SELECT
  cm.candidate_match_id,
  cm.review_queue_state,
  cm.match_state,
  cm.attempt_no,
  cm.is_current_attempt,
  cm.score,
  cm.created_at,
  rp.crew_request_position_id,
  rp.rank_code,
  rp.department_code,
  r.crew_request_id,
  r.request_code,
  bc.legal_name AS business_client_name,
  s.seafarer_id,
  p.crewport_user_id,
  p.full_name,
  sr.readiness_state AS seafarer_readiness_state
FROM crewport.candidate_matches cm
JOIN crewport.crew_request_positions rp ON rp.crew_request_position_id = cm.crew_request_position_id
JOIN crewport.crew_requests r ON r.crew_request_id = rp.crew_request_id
JOIN crewport.business_clients bc ON bc.business_client_id = r.business_client_id
JOIN crewport.seafarers s ON s.seafarer_id = cm.seafarer_id
JOIN crewport.physical_persons p ON p.person_id = s.person_id
LEFT JOIN crewport.seafarer_readiness sr ON sr.seafarer_id = s.seafarer_id
WHERE cm.review_queue_state IN ('pending', 'in_review')
  AND cm.is_current_attempt = true;

CREATE OR REPLACE VIEW crewport.project_entitlements AS
SELECT
  se.entitlement_id,
  se.entitlement_code,
  se.entitlement_status,
  se.starts_at,
  se.ends_at,
  ba.billing_account_id,
  ba.account_scope,
  ba.account_status,
  ba.invoice_currency,
  ba.external_processor,
  ba.external_customer_ref,
  pp.crewport_user_id,
  pp.gtc_user_id,
  bc.business_client_id,
  bc.legal_name AS business_client_name
FROM crewport.service_entitlements se
JOIN crewport.billing_accounts ba ON ba.billing_account_id = se.billing_account_id
LEFT JOIN crewport.physical_persons pp ON pp.person_id = ba.person_id
LEFT JOIN crewport.business_clients bc ON bc.business_client_id = ba.business_client_id;

COMMIT;