-- ProjectOwner: CrewPortGlobal
-- PackageFile: 005_crewport_test_queries.sql
-- PackageRole: planning_only_validation_queries
-- ExecutionPolicy: do_not_execute_without_explicit_manual_approval
-- Notes:
--   1. Planning artifact only.
--   2. Do not apply on production DB.
--   3. Do not apply on test DB.
--   4. Do not change global auth schema from this workstream.
--   5. Do not change current Stripe workflow from this workstream.
--   6. Smoke inserts below are rollback-safe examples for a future explicitly approved review session.

-- 1. Schema and object presence checks

SELECT n.nspname AS schema_name
FROM pg_namespace n
WHERE n.nspname = 'crewport';

SELECT c.relkind, COUNT(*) AS object_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'crewport'
  AND c.relkind IN ('r', 'v')
GROUP BY c.relkind
ORDER BY c.relkind;

SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'crewport'
  AND c.relkind = 'r'
ORDER BY c.relname;

SELECT c.relname AS view_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'crewport'
  AND c.relkind = 'v'
ORDER BY c.relname;

-- 2. Foreign-key inventory

SELECT
  con.conname AS fk_name,
  src.relname AS source_table,
  dst.relname AS target_table
FROM pg_constraint con
JOIN pg_class src ON src.oid = con.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class dst ON dst.oid = con.confrelid
JOIN pg_namespace dst_ns ON dst_ns.oid = dst.relnamespace
WHERE con.contype = 'f'
  AND src_ns.nspname = 'crewport'
  AND dst_ns.nspname = 'crewport'
ORDER BY src.relname, con.conname;

-- 3. Trigger presence checks

SELECT
  cls.relname AS table_name,
  trg.tgname AS trigger_name
FROM pg_trigger trg
JOIN pg_class cls ON cls.oid = trg.tgrelid
JOIN pg_namespace n ON n.oid = cls.relnamespace
WHERE n.nspname = 'crewport'
  AND NOT trg.tgisinternal
ORDER BY cls.relname, trg.tgname;

-- 4. View smoke reads

SELECT * FROM crewport.seafarer_readiness LIMIT 10;
SELECT * FROM crewport.business_readiness LIMIT 10;
SELECT * FROM crewport.open_crew_requests LIMIT 10;
SELECT * FROM crewport.match_review_queue LIMIT 10;
SELECT * FROM crewport.project_entitlements LIMIT 10;

-- 5. Rollback-safe smoke onboarding and matching example

BEGIN;

INSERT INTO crewport.physical_persons (
  person_id,
  gtc_user_id,
  primary_email,
  primary_email_verification_state,
  primary_email_verified_at,
  full_name,
  given_name,
  family_name,
  nationality_code,
  residence_country_code,
  phone_e164,
  registration_source,
  onboarding_channel,
  lifecycle_state
) VALUES
  (
    '11111111-1111-4111-8111-111111111111'::uuid,
    NULL,
    'test.seafarer@crewportglobal.example',
    'verified',
    now(),
    'Test Seafarer',
    'Test',
    'Seafarer',
    'PH',
    'PH',
    '+639000000001',
    'crewport_public',
    'web',
    'active'
  ),
  (
    '22222222-2222-4222-8222-222222222222'::uuid,
    NULL,
    'test.rep@crewportglobal.example',
    'verified',
    now(),
    'Test Representative',
    'Test',
    'Representative',
    'AE',
    'AE',
    '+971500000002',
    'business_invite',
    'web',
    'active'
  );

INSERT INTO crewport.seafarers (
  seafarer_id,
  person_id,
  registration_state,
  availability_state,
  rank_code,
  department_code,
  years_experience,
  current_location,
  summary
) VALUES (
  '33333333-3333-4333-8333-333333333333'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'active',
  'available',
  'master',
  'deck',
  8.50,
  'Manila',
  'Rollback-safe seafarer smoke example'
);

INSERT INTO crewport.seafarer_documents (
  document_id,
  seafarer_id,
  document_type,
  document_number,
  issuing_country_code,
  issued_at,
  expires_at,
  verification_state,
  file_storage_key
) VALUES (
  '44444444-4444-4444-8444-444444444444'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  'passport',
  'P-TEST-0001',
  'PH',
  DATE '2025-01-01',
  DATE '2030-01-01',
  'verified',
  'planning/test/passport-0001.pdf'
);

INSERT INTO crewport.business_clients (
  business_client_id,
  legal_name,
  trading_name,
  registration_number,
  jurisdiction_code,
  country_code,
  company_type,
  website_url,
  primary_business_email,
  primary_phone_e164,
  registered_address_line_1,
  registered_city,
  registered_postal_code,
  registered_country_code,
  operating_address_line_1,
  operating_city,
  operating_postal_code,
  operating_country_code,
  operational_role,
  onboarding_state,
  verification_state
) VALUES (
  '55555555-5555-4555-8555-555555555555'::uuid,
  'Test Ship Management LLC',
  'Test Ship Mgmt',
  'REG-TEST-001',
  'AE',
  'AE',
  'llc',
  'https://test-ship-mgmt.example',
  'ops@test-ship-mgmt.example',
  '+971500000003',
  'Harbor Street 1',
  'Dubai',
  '00001',
  'AE',
  'Operations Quay 2',
  'Dubai',
  '00002',
  'AE',
  'ship_manager',
  'active',
  'verified'
);

INSERT INTO crewport.user_roles (
  user_role_id,
  person_id,
  business_client_id,
  role_code,
  assignment_state,
  granted_at
) VALUES
  (
    '66666666-6666-4666-8666-666666666661'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    NULL,
    'seafarer',
    'active',
    now()
  ),
  (
    '66666666-6666-4666-8666-666666666662'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '55555555-5555-4555-8555-555555555555'::uuid,
    'business_representative',
    'active',
    now()
  );

INSERT INTO crewport.company_representatives (
  representative_id,
  business_client_id,
  person_id,
  role_title,
  authority_type,
  invitation_state,
  verification_state,
  is_primary
) VALUES (
  '77777777-7777-4777-8777-777777777777'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  'Crewing Manager',
  'crewing_manager',
  'accepted',
  'verified',
  true
);

INSERT INTO crewport.representative_documents (
  representative_document_id,
  representative_id,
  document_type,
  document_number,
  issued_at,
  expires_at,
  verification_state,
  file_storage_key
) VALUES (
  '88888888-8888-4888-8888-888888888881'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'authority_letter',
  'AUTH-TEST-01',
  DATE '2025-01-01',
  DATE '2027-01-01',
  'verified',
  'planning/test/authority-letter-01.pdf'
);

INSERT INTO crewport.business_documents (
  business_document_id,
  business_client_id,
  document_type,
  document_number,
  issued_by,
  issued_at,
  expires_at,
  verification_state,
  file_storage_key
) VALUES (
  '88888888-8888-4888-8888-888888888882'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  'trade_license',
  'TL-TEST-01',
  'Dubai Maritime Authority',
  DATE '2025-01-01',
  DATE '2026-12-31',
  'verified',
  'planning/test/trade-license-01.pdf'
);

INSERT INTO crewport.vessels (
  vessel_id,
  vessel_name,
  imo_number,
  call_sign,
  mmsi,
  vessel_type,
  flag_code,
  port_of_registry,
  registry_country_code,
  owner_name,
  manager_name,
  ownership_context,
  verification_state
) VALUES (
  '99999999-9999-4999-8999-999999999999'::uuid,
  'MV Test Horizon',
  'IMO1234567',
  'A1BC2',
  '123456789',
  'bulk_carrier',
  'PA',
  'Panama',
  'PA',
  'Test Owner SA',
  'Test Ship Management LLC',
  'managed_for_owner',
  'verified'
);

INSERT INTO crewport.business_client_vessels (
  business_client_vessel_id,
  business_client_id,
  vessel_id,
  relationship_type,
  relationship_state,
  is_primary,
  effective_from,
  notes
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  '99999999-9999-4999-8999-999999999999'::uuid,
  'manager',
  'active',
  true,
  DATE '2025-01-01',
  'Rollback-safe business-vessel relationship example'
);

INSERT INTO crewport.vessel_documents (
  vessel_document_id,
  vessel_id,
  document_type,
  document_number,
  issued_by,
  issued_at,
  expires_at,
  verification_state,
  file_storage_key
) VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  '99999999-9999-4999-8999-999999999999'::uuid,
  'registry_certificate',
  'REG-CERT-01',
  'Panama Registry',
  DATE '2025-01-01',
  DATE '2026-12-31',
  'verified',
  'planning/test/registry-certificate-01.pdf'
);

INSERT INTO crewport.crew_requests (
  crew_request_id,
  business_client_id,
  requested_by_representative_id,
  vessel_id,
  request_code,
  title,
  request_state,
  priority,
  needed_by_date,
  embarkation_window_start,
  embarkation_window_end,
  port_of_joining,
  notes,
  verification_gate
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  '99999999-9999-4999-8999-999999999999'::uuid,
  'REQ-TEST-0001',
  'Master for MV Test Horizon',
  'open',
  'high',
  DATE '2026-06-15',
  DATE '2026-06-01',
  DATE '2026-06-20',
  'Singapore',
  'Rollback-safe open crew request example',
  'cleared'
);

INSERT INTO crewport.crew_request_positions (
  crew_request_position_id,
  crew_request_id,
  rank_code,
  department_code,
  quantity,
  contract_duration_months,
  wage_currency,
  wage_amount,
  minimum_experience_months,
  status,
  requirement_payload
) VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
  'master',
  'deck',
  1,
  6,
  'USD',
  12000.00,
  48,
  'open',
  '{"english_level":"advanced","licenses":["master_unlimited"]}'::jsonb
);

INSERT INTO crewport.candidate_matches (
  candidate_match_id,
  crew_request_position_id,
  seafarer_id,
  attempt_no,
  is_current_attempt,
  supersedes_candidate_match_id,
  match_state,
  review_queue_state,
  score,
  scoring_source,
  reviewer_gtc_user_id,
  reviewer_crewport_user_id,
  review_notes
) VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  1,
  true,
  NULL,
  'pending_review',
  'pending',
  0.9234,
  'planning_smoke_test',
  NULL,
  NULL,
  'Rollback-safe candidate match example'
);

INSERT INTO crewport.consent_records (
  consent_record_id,
  person_id,
  business_client_id,
  consent_type,
  consent_version,
  consent_scope,
  accepted_at,
  evidence_source,
  evidence_payload
) VALUES (
  'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  NULL,
  'privacy_policy',
  'v1',
  'privacy',
  now(),
  'web',
  '{"ip":"127.0.0.1","source":"planning_smoke"}'::jsonb
);

INSERT INTO crewport.billing_accounts (
  billing_account_id,
  account_scope,
  person_id,
  business_client_id,
  account_status,
  billing_email,
  invoice_currency,
  external_processor,
  external_customer_ref
) VALUES (
  'f2f2f2f2-f2f2-42f2-82f2-f2f2f2f2f2f2'::uuid,
  'business_client',
  NULL,
  '55555555-5555-4555-8555-555555555555'::uuid,
  'active',
  'billing@test-ship-mgmt.example',
  'USD',
  'manual_planning_only',
  'CUST-TEST-0001'
);

INSERT INTO crewport.service_entitlements (
  entitlement_id,
  billing_account_id,
  entitlement_code,
  subject_type,
  subject_id,
  entitlement_status,
  starts_at,
  ends_at,
  source_ref,
  metadata
) VALUES (
  'f3f3f3f3-f3f3-43f3-83f3-f3f3f3f3f3f3'::uuid,
  'f2f2f2f2-f2f2-42f2-82f2-f2f2f2f2f2f2'::uuid,
  'crew_request_access',
  'business_client',
  '55555555-5555-4555-8555-555555555555'::uuid,
  'active',
  now(),
  now() + interval '30 days',
  'planning_smoke_test',
  '{"tier":"stage1"}'::jsonb
);

INSERT INTO crewport.complaint_records (
  complaint_record_id,
  complaint_code,
  complaint_type,
  complaint_status,
  severity,
  submitted_by_person_id,
  submitted_by_business_client_id,
  related_crew_request_id,
  related_candidate_match_id,
  summary,
  details
) VALUES (
  'f4f4f4f4-f4f4-44f4-84f4-f4f4f4f4f4f4'::uuid,
  'CMP-TEST-0001',
  'workflow',
  'open',
  'standard',
  '11111111-1111-4111-8111-111111111111'::uuid,
  NULL,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
  'Rollback-safe complaint smoke example',
  'Smoke insert for complaint lifecycle planning review'
);

INSERT INTO crewport.verification_events (
  verification_event_id,
  subject_type,
  subject_id,
  event_type,
  outcome,
  actor_type,
  actor_gtc_user_id,
  actor_crewport_user_id,
  notes,
  payload
) VALUES
  (
    'f5f5f5f5-f5f5-45f5-85f5-f5f5f5f5f5f1'::uuid,
    'seafarer',
    '33333333-3333-4333-8333-333333333333'::uuid,
    'document_review_completed',
    'passed',
    'system',
    NULL,
    NULL,
    'Smoke seafarer verification event',
    '{"source":"planning_smoke"}'::jsonb
  ),
  (
    'f5f5f5f5-f5f5-45f5-85f5-f5f5f5f5f5f2'::uuid,
    'business_client',
    '55555555-5555-4555-8555-555555555555'::uuid,
    'kyb_review_completed',
    'passed',
    'system',
    NULL,
    NULL,
    'Smoke business verification event',
    '{"source":"planning_smoke"}'::jsonb
  );

SELECT seafarer_id, readiness_state
FROM crewport.seafarer_readiness
WHERE seafarer_id = '33333333-3333-4333-8333-333333333333'::uuid;

SELECT business_client_id, readiness_state, representative_count, verified_business_document_count
FROM crewport.business_readiness
WHERE business_client_id = '55555555-5555-4555-8555-555555555555'::uuid;

SELECT request_code, business_client_name, position_status
FROM crewport.open_crew_requests
WHERE crew_request_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid;

SELECT candidate_match_id, attempt_no, is_current_attempt, seafarer_readiness_state
FROM crewport.match_review_queue
WHERE candidate_match_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid;

SELECT entitlement_code, entitlement_status, business_client_name
FROM crewport.project_entitlements
WHERE entitlement_id = 'f3f3f3f3-f3f3-43f3-83f3-f3f3f3f3f3f3'::uuid;

ROLLBACK;

-- 6. Trigger metadata smoke example
--    The trigger function uses now(), which is transaction-scoped in PostgreSQL.
--    Presence can be checked safely via catalog queries above.
--    Observing a changed updated_at value requires a separately approved committed test flow.