-- CPG-BIZ-127
-- Idempotent test agent seed for shipowner-agent framework offer flow.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH test_user AS (
  INSERT INTO crewportglobal.users (
    email,
    display_name,
    email_verified_at,
    registration_status,
    is_active
  ) VALUES (
    'test.agent@crewportglobal.test',
    'CPG Test Agent Manager',
    now(),
    'approved',
    TRUE
  )
  ON CONFLICT ((lower(email)))
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email_verified_at = COALESCE(crewportglobal.users.email_verified_at, EXCLUDED.email_verified_at),
    registration_status = 'approved',
    is_active = TRUE
  RETURNING user_id
),
credential_upsert AS (
  INSERT INTO crewportglobal.user_credentials (
    user_id,
    login_email,
    password_hash,
    is_active
  )
  SELECT
    user_id,
    'test.agent@crewportglobal.test',
    crypt('TestAgent#2026', gen_salt('bf', 10)),
    TRUE
  FROM test_user
  ON CONFLICT (user_id)
  DO UPDATE SET
    login_email = EXCLUDED.login_email,
    is_active = TRUE
  RETURNING user_id
),
role_upsert AS (
  INSERT INTO crewportglobal.user_roles (
    user_id,
    role,
    source
  )
  SELECT
    user_id,
    'crewing_manager',
    'cpg_biz_127_test_agent_seed'
  FROM test_user
  ON CONFLICT (user_id, role)
  DO NOTHING
  RETURNING user_id
),
test_agent AS (
  INSERT INTO crewportglobal.agent_organizations (
    agent_code,
    agent_display_name,
    organization_kind,
    agent_status,
    authority_status,
    platform_service_agreement_status,
    default_routing_enabled,
    public_listing_allowed,
    approved_by_user_id,
    approved_at,
    created_by_user_id,
    metadata
  )
  SELECT
    'TEST_AGENT_001',
    'CPG Test Agent Company',
    'external_crewing',
    'verified',
    'verified',
    'accepted',
    FALSE,
    TRUE,
    user_id,
    now(),
    user_id,
    '{"seed":"CPG-BIZ-127","purpose":"shipowner_agent_framework_offer_flow"}'::jsonb
  FROM test_user
  ON CONFLICT (agent_code)
  DO UPDATE SET
    agent_display_name = EXCLUDED.agent_display_name,
    agent_status = 'verified',
    authority_status = 'verified',
    platform_service_agreement_status = 'accepted',
    public_listing_allowed = TRUE,
    approved_at = COALESCE(crewportglobal.agent_organizations.approved_at, now()),
    metadata = crewportglobal.agent_organizations.metadata || EXCLUDED.metadata
  RETURNING agent_organization_id
),
agent_user_upsert AS (
  INSERT INTO crewportglobal.agent_users (
    agent_organization_id,
    user_id,
    agent_user_role,
    membership_status,
    granted_by_user_id,
    granted_at,
    metadata
  )
  SELECT
    ta.agent_organization_id,
    tu.user_id,
    'manager',
    'active',
    tu.user_id,
    now(),
    '{"seed":"CPG-BIZ-127"}'::jsonb
  FROM test_agent ta
  CROSS JOIN test_user tu
  ON CONFLICT (agent_organization_id, user_id)
  WHERE membership_status = 'active'
  DO UPDATE SET
    agent_user_role = 'manager',
    membership_status = 'active',
    granted_at = COALESCE(crewportglobal.agent_users.granted_at, now()),
    revoked_at = NULL,
    metadata = crewportglobal.agent_users.metadata || EXCLUDED.metadata
  RETURNING agent_organization_id, user_id
)
INSERT INTO crewportglobal.agent_authority_documents (
  agent_organization_id,
  authority_type,
  authority_scope_type,
  authority_status,
  valid_from,
  reviewed_by_user_id,
  reviewed_at,
  review_note,
  source_reference,
  scope_snapshot,
  metadata,
  created_by_user_id
)
SELECT
  au.agent_organization_id,
  'platform_service_agreement',
  'platform',
  'verified',
  CURRENT_DATE,
  au.user_id,
  now(),
  'Seeded verified platform service agreement for CPG-BIZ-127 test agent.',
  'CPG-BIZ-127-SEED-TEST-AGENT',
  '{"scope":"platform","seed":"CPG-BIZ-127"}'::jsonb,
  '{"seed":"CPG-BIZ-127"}'::jsonb,
  au.user_id
FROM agent_user_upsert au
WHERE NOT EXISTS (
  SELECT 1
  FROM crewportglobal.agent_authority_documents aad
  WHERE aad.agent_organization_id = au.agent_organization_id
    AND aad.authority_type = 'platform_service_agreement'
    AND aad.authority_scope_type = 'platform'
    AND aad.authority_status = 'verified'
    AND aad.archived_at IS NULL
);

COMMIT;
