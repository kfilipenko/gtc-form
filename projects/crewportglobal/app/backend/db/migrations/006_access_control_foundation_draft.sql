-- CPG-ACCESS-001 Phase 1 draft only.
-- Access-control foundation for CrewPortGlobal.
-- DRAFT ONLY: do not apply to production without separate Project Owner approval.
-- Depends on 001_create_registration_foundation.sql for crewportglobal.users.

BEGIN;

CREATE SCHEMA IF NOT EXISTS crewportglobal;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION crewportglobal.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS crewportglobal.access_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,
  group_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_groups_group_code_not_blank_chk CHECK (length(trim(group_code)) > 0),
  CONSTRAINT access_groups_group_type_chk CHECK (
    group_type IN ('public', 'external', 'internal', 'administration', 'system')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT UNIQUE NOT NULL,
  role_name TEXT NOT NULL,
  role_type TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_roles_role_code_not_blank_chk CHECK (length(trim(role_code)) > 0),
  CONSTRAINT access_roles_role_type_chk CHECK (
    role_type IN ('public', 'external', 'internal', 'administration', 'system')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code TEXT UNIQUE NOT NULL,
  permission_name TEXT NOT NULL,
  permission_area TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_permissions_permission_code_not_blank_chk CHECK (length(trim(permission_code)) > 0),
  CONSTRAINT access_permissions_permission_area_not_blank_chk CHECK (length(trim(permission_area)) > 0)
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_group_members (
  group_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES crewportglobal.access_groups(group_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  membership_state TEXT NOT NULL DEFAULT 'active',
  granted_by_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  revoked_by_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_group_members_state_chk CHECK (membership_state IN ('active', 'revoked')),
  CONSTRAINT access_group_members_revoked_at_chk CHECK (
    (membership_state = 'revoked' AND revoked_at IS NOT NULL)
    OR (membership_state = 'active' AND revoked_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_group_roles (
  group_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES crewportglobal.access_groups(group_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES crewportglobal.access_roles(role_id) ON DELETE CASCADE,
  assignment_state TEXT NOT NULL DEFAULT 'active',
  granted_by_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  revoked_by_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_group_roles_state_chk CHECK (assignment_state IN ('active', 'revoked')),
  CONSTRAINT access_group_roles_revoked_at_chk CHECK (
    (assignment_state = 'revoked' AND revoked_at IS NOT NULL)
    OR (assignment_state = 'active' AND revoked_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_role_permissions (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES crewportglobal.access_roles(role_id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES crewportglobal.access_permissions(permission_id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_role_permissions_scope_chk CHECK (
    scope IN ('public', 'own', 'company', 'assigned', 'queue', 'all_operational', 'system')
  )
);

CREATE TABLE IF NOT EXISTS crewportglobal.access_audit_events (
  access_audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  target_user_id UUID NULL REFERENCES crewportglobal.users(user_id) ON DELETE SET NULL,
  target_group_id UUID NULL REFERENCES crewportglobal.access_groups(group_id) ON DELETE SET NULL,
  target_role_id UUID NULL REFERENCES crewportglobal.access_roles(role_id) ON DELETE SET NULL,
  target_permission_id UUID NULL REFERENCES crewportglobal.access_permissions(permission_id) ON DELETE SET NULL,
  previous_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_audit_events_event_type_not_blank_chk CHECK (length(trim(event_type)) > 0)
);

CREATE TABLE IF NOT EXISTS crewportglobal.admin_email_codes (
  admin_email_code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'admin_access',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT admin_email_codes_purpose_chk CHECK (purpose IN ('admin_access')),
  CONSTRAINT admin_email_codes_attempt_count_chk CHECK (attempt_count >= 0),
  CONSTRAINT admin_email_codes_code_hash_not_blank_chk CHECK (length(trim(code_hash)) > 0)
);

CREATE TABLE IF NOT EXISTS crewportglobal.admin_sessions (
  admin_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES crewportglobal.users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  last_used_at TIMESTAMPTZ NULL,
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT admin_sessions_expiry_chk CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS access_group_members_active_group_user_uidx
  ON crewportglobal.access_group_members (group_id, user_id)
  WHERE membership_state = 'active';

CREATE INDEX IF NOT EXISTS access_group_members_user_idx
  ON crewportglobal.access_group_members (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS access_group_roles_active_group_role_uidx
  ON crewportglobal.access_group_roles (group_id, role_id)
  WHERE assignment_state = 'active';

CREATE INDEX IF NOT EXISTS access_group_roles_role_idx
  ON crewportglobal.access_group_roles (role_id);

CREATE UNIQUE INDEX IF NOT EXISTS access_role_permissions_role_permission_scope_uidx
  ON crewportglobal.access_role_permissions (role_id, permission_id, scope);

CREATE INDEX IF NOT EXISTS access_role_permissions_permission_idx
  ON crewportglobal.access_role_permissions (permission_id);

CREATE INDEX IF NOT EXISTS access_audit_events_created_at_idx
  ON crewportglobal.access_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS access_audit_events_actor_idx
  ON crewportglobal.access_audit_events (actor_user_id);

CREATE INDEX IF NOT EXISTS access_audit_events_target_user_idx
  ON crewportglobal.access_audit_events (target_user_id);

CREATE INDEX IF NOT EXISTS access_audit_events_event_type_idx
  ON crewportglobal.access_audit_events (event_type);

CREATE INDEX IF NOT EXISTS admin_email_codes_active_user_purpose_idx
  ON crewportglobal.admin_email_codes (user_id, purpose, expires_at DESC)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_sessions_active_user_idx
  ON crewportglobal.admin_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS access_groups_set_updated_at ON crewportglobal.access_groups;
CREATE TRIGGER access_groups_set_updated_at
BEFORE UPDATE ON crewportglobal.access_groups
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS access_roles_set_updated_at ON crewportglobal.access_roles;
CREATE TRIGGER access_roles_set_updated_at
BEFORE UPDATE ON crewportglobal.access_roles
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS access_permissions_set_updated_at ON crewportglobal.access_permissions;
CREATE TRIGGER access_permissions_set_updated_at
BEFORE UPDATE ON crewportglobal.access_permissions
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS access_group_members_set_updated_at ON crewportglobal.access_group_members;
CREATE TRIGGER access_group_members_set_updated_at
BEFORE UPDATE ON crewportglobal.access_group_members
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

DROP TRIGGER IF EXISTS access_group_roles_set_updated_at ON crewportglobal.access_group_roles;
CREATE TRIGGER access_group_roles_set_updated_at
BEFORE UPDATE ON crewportglobal.access_group_roles
FOR EACH ROW
EXECUTE FUNCTION crewportglobal.set_updated_at();

INSERT INTO crewportglobal.access_groups (group_code, group_name, group_type, description)
VALUES
  ('public_visitors', 'Public visitors', 'public', 'Unauthenticated public access model.'),
  ('registered_users', 'Registered users', 'external', 'Base group for authenticated users.'),
  ('registered_seafarers', 'Registered seafarers', 'external', 'Seafarers managing their own profile and applications.'),
  ('registered_employers', 'Registered employers', 'external', 'Employers managing company and vacancy workflows.'),
  ('shipowners', 'Shipowners', 'external', 'Shipowner users and companies.'),
  ('crewing_managers', 'Crewing managers', 'external', 'Crewing manager organizations.'),
  ('company_representatives', 'Company representatives', 'external', 'Users linked to a company.'),
  ('company_admins', 'Company admins', 'external', 'Users allowed to administer their own company profile.'),
  ('support_team', 'Support team', 'internal', 'First-line user assistance.'),
  ('verification_team', 'Verification team', 'internal', 'Evidence and document verification.'),
  ('review_team', 'Review team', 'internal', 'Human workflow decisions.'),
  ('complaint_team', 'Complaint team', 'internal', 'Complaint and dispute handling.'),
  ('billing_team', 'Billing team', 'internal', 'Billing and entitlement review.'),
  ('read_only_auditors', 'Read-only auditors', 'internal', 'Read-only compliance and operational visibility.'),
  ('platform_administrators', 'Platform administrators', 'administration', 'Access-management administration.'),
  ('platform_owners', 'Platform owners', 'administration', 'Final project governance and exceptions.'),
  ('ai_assistants', 'AI assistants', 'system', 'Non-human assistant identity for logs and drafts.')
ON CONFLICT (group_code) DO UPDATE SET
  group_name = EXCLUDED.group_name,
  group_type = EXCLUDED.group_type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO crewportglobal.access_roles (role_code, role_name, role_type, description)
VALUES
  ('public_visitor', 'Public visitor', 'public', 'Unauthenticated public browsing.'),
  ('registered_user', 'Registered user', 'external', 'Base authenticated external user.'),
  ('seafarer', 'Seafarer', 'external', 'Create and manage own seafarer profile and applications.'),
  ('employer', 'Employer', 'external', 'Manage own company and vacancy drafts.'),
  ('shipowner', 'Shipowner', 'external', 'Manage shipowner company context and vessel or vacancy data.'),
  ('crewing_manager', 'Crewing manager', 'external', 'Manage crewing company context and vacancy requests.'),
  ('company_representative', 'Company representative', 'external', 'Act for a linked company within assigned company scope.'),
  ('company_admin', 'Company admin', 'external', 'Manage company-side users and company records within company scope.'),
  ('support_operator', 'Support operator', 'internal', 'Assist users and collect missing information without final decisions.'),
  ('verifier', 'Verifier', 'internal', 'Verify documents, evidence, company and vessel information.'),
  ('reviewer', 'Reviewer', 'internal', 'Make controlled human-review workflow decisions.'),
  ('complaint_operator', 'Complaint operator', 'internal', 'Handle complaints and disputes.'),
  ('billing_operator', 'Billing operator', 'internal', 'Review billing accounts and service entitlements.'),
  ('read_only_auditor', 'Read-only auditor', 'internal', 'Read-only review of queues, records and audit events.'),
  ('platform_administrator', 'Platform administrator', 'administration', 'Manage users, groups and role assignment.'),
  ('project_owner', 'Project owner', 'administration', 'Approve policy, exceptions and administrator appointment.'),
  ('ai_assistant', 'AI assistant', 'system', 'Produce drafts and summaries without final authority.')
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  role_type = EXCLUDED.role_type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO crewportglobal.access_permissions (permission_code, permission_name, permission_area, description)
VALUES
  ('view_public_pages', 'View public pages', 'public', 'View public application pages.'),
  ('view_public_vacancies', 'View public vacancies', 'public', 'View public vacancy board and vacancy details.'),
  ('view_public_documents', 'View public documents', 'public', 'View public documents and policies.'),
  ('register_account', 'Register account', 'public', 'Open account registration.'),
  ('login_account', 'Login account', 'public', 'Open login flow.'),
  ('view_own_profile', 'View own profile', 'seafarer', 'View current user seafarer profile.'),
  ('edit_own_profile', 'Edit own profile', 'seafarer', 'Edit current user seafarer profile.'),
  ('submit_own_profile_for_review', 'Submit own profile for review', 'seafarer', 'Submit own profile for human review.'),
  ('view_own_review_status', 'View own review status', 'seafarer', 'View own review state and correction reason.'),
  ('view_own_applications', 'View own applications', 'seafarer', 'View own vacancy applications.'),
  ('apply_to_vacancy', 'Apply to vacancy', 'seafarer', 'Apply to public vacancy as current seafarer.'),
  ('withdraw_own_application', 'Withdraw own application', 'seafarer', 'Withdraw own active vacancy application.'),
  ('view_own_company', 'View own company', 'employer', 'View company records linked to current user.'),
  ('edit_own_company', 'Edit own company', 'employer', 'Edit company records linked to current user.'),
  ('create_vacancy', 'Create vacancy', 'employer', 'Create vacancy request for linked company.'),
  ('edit_own_vacancy', 'Edit own vacancy', 'employer', 'Edit vacancy request for linked company.'),
  ('submit_vacancy_for_review', 'Submit vacancy for review', 'employer', 'Submit vacancy request for human review.'),
  ('view_own_vacancies', 'View own vacancies', 'employer', 'View vacancy requests linked to current company.'),
  ('view_presented_candidates', 'View presented candidates', 'employer', 'View candidates presented to linked company.'),
  ('update_employer_shortlist_status', 'Update employer shortlist status', 'employer', 'Update employer-side candidate shortlist state.'),
  ('view_support_queue', 'View support queue', 'support', 'View support queue.'),
  ('view_limited_user_summary', 'View limited user summary', 'support', 'View limited non-sensitive user summary.'),
  ('create_support_note', 'Create support note', 'support', 'Create support note.'),
  ('request_missing_information', 'Request missing information', 'support', 'Request missing information from user.'),
  ('route_case_to_operator', 'Route case to operator', 'support', 'Route case to another operator role.'),
  ('view_verification_queue', 'View verification queue', 'verification', 'View verification queue.'),
  ('view_seafarer_documents', 'View seafarer documents', 'verification', 'View seafarer document evidence.'),
  ('view_company_documents', 'View company documents', 'verification', 'View company document evidence.'),
  ('view_vessel_documents', 'View vessel documents', 'verification', 'View vessel document evidence.'),
  ('mark_document_under_review', 'Mark document under review', 'verification', 'Mark evidence under review.'),
  ('mark_document_verified', 'Mark document verified', 'verification', 'Mark evidence verified.'),
  ('mark_document_rejected', 'Mark document rejected', 'verification', 'Mark evidence rejected.'),
  ('request_document_correction', 'Request document correction', 'verification', 'Request document correction.'),
  ('create_verification_note', 'Create verification note', 'verification', 'Create verification note.'),
  ('view_review_queue', 'View review queue', 'review', 'View human review queue.'),
  ('start_human_review', 'Start human review', 'review', 'Start human review.'),
  ('approve_seafarer_profile', 'Approve seafarer profile', 'review', 'Approve seafarer profile.'),
  ('reject_seafarer_profile', 'Reject seafarer profile', 'review', 'Reject seafarer profile.'),
  ('return_profile_for_correction', 'Return profile for correction', 'review', 'Return profile for correction.'),
  ('approve_company_profile', 'Approve company profile', 'review', 'Approve company profile.'),
  ('approve_vacancy_request', 'Approve vacancy request', 'review', 'Approve vacancy request.'),
  ('approve_candidate_presentation', 'Approve candidate presentation', 'review', 'Approve candidate presentation.'),
  ('create_review_note', 'Create review note', 'review', 'Create review note.'),
  ('view_complaint_queue', 'View complaint queue', 'complaint', 'View complaint queue.'),
  ('create_complaint_record', 'Create complaint record', 'complaint', 'Create complaint record.'),
  ('update_complaint_status', 'Update complaint status', 'complaint', 'Update complaint status.'),
  ('escalate_complaint', 'Escalate complaint', 'complaint', 'Escalate complaint.'),
  ('close_complaint', 'Close complaint', 'complaint', 'Close complaint with resolution note.'),
  ('view_complaint_history', 'View complaint history', 'complaint', 'View complaint history.'),
  ('view_billing_accounts', 'View billing accounts', 'billing', 'View billing accounts.'),
  ('view_service_entitlements', 'View service entitlements', 'billing', 'View service entitlements.'),
  ('update_billing_review_status', 'Update billing review status', 'billing', 'Update billing review status.'),
  ('create_billing_exception_request', 'Create billing exception request', 'billing', 'Create billing exception request.'),
  ('view_billing_audit', 'View billing audit', 'billing', 'View billing audit.'),
  ('view_admin_console', 'View admin console', 'administration', 'Open /admin/access/.'),
  ('view_users', 'View users', 'administration', 'View users in admin console.'),
  ('view_groups', 'View groups', 'administration', 'View access groups.'),
  ('view_roles', 'View roles', 'administration', 'View access roles.'),
  ('view_permissions', 'View permissions', 'administration', 'View access permissions.'),
  ('manage_user_groups', 'Manage user groups', 'administration', 'Add or revoke user group memberships.'),
  ('manage_group_roles', 'Manage group roles', 'administration', 'Assign or revoke roles on groups.'),
  ('revoke_operator_access', 'Revoke operator access', 'administration', 'Revoke internal operator access.'),
  ('suspend_user', 'Suspend user', 'administration', 'Suspend user where policy permits.'),
  ('view_access_audit', 'View access audit', 'administration', 'View access audit events.'),
  ('approve_access_policy_change', 'Approve access policy change', 'project_owner', 'Approve access-control policy changes.'),
  ('approve_high_risk_exception', 'Approve high-risk exception', 'project_owner', 'Approve high-risk operational exceptions.'),
  ('assign_platform_administrator', 'Assign platform administrator', 'project_owner', 'Assign Platform Administrator.'),
  ('view_full_audit_log', 'View full audit log', 'project_owner', 'View full audit log.'),
  ('emergency_revoke_access', 'Emergency revoke access', 'project_owner', 'Emergency revoke access.')
ON CONFLICT (permission_code) DO UPDATE SET
  permission_name = EXCLUDED.permission_name,
  permission_area = EXCLUDED.permission_area,
  description = EXCLUDED.description,
  updated_at = now();

WITH group_role_seed(group_code, role_code) AS (
  VALUES
    ('public_visitors', 'public_visitor'),
    ('registered_users', 'registered_user'),
    ('registered_seafarers', 'seafarer'),
    ('registered_employers', 'employer'),
    ('shipowners', 'shipowner'),
    ('crewing_managers', 'crewing_manager'),
    ('company_representatives', 'company_representative'),
    ('company_admins', 'company_admin'),
    ('support_team', 'support_operator'),
    ('verification_team', 'verifier'),
    ('review_team', 'reviewer'),
    ('complaint_team', 'complaint_operator'),
    ('billing_team', 'billing_operator'),
    ('read_only_auditors', 'read_only_auditor'),
    ('platform_administrators', 'platform_administrator'),
    ('platform_owners', 'project_owner'),
    ('ai_assistants', 'ai_assistant')
)
INSERT INTO crewportglobal.access_group_roles (group_id, role_id, reason)
SELECT groups.group_id, roles.role_id, 'Initial CPG-ACCESS-001 group-role seed'
FROM group_role_seed seed
JOIN crewportglobal.access_groups groups ON groups.group_code = seed.group_code
JOIN crewportglobal.access_roles roles ON roles.role_code = seed.role_code
ON CONFLICT DO NOTHING;

WITH role_permission_seed(role_code, permission_code, scope) AS (
  VALUES
    ('public_visitor', 'view_public_pages', 'public'),
    ('public_visitor', 'view_public_vacancies', 'public'),
    ('public_visitor', 'view_public_documents', 'public'),
    ('public_visitor', 'register_account', 'public'),
    ('public_visitor', 'login_account', 'public'),
    ('registered_user', 'view_public_pages', 'public'),
    ('registered_user', 'view_public_vacancies', 'public'),
    ('registered_user', 'view_public_documents', 'public'),
    ('registered_user', 'login_account', 'public'),
    ('seafarer', 'view_own_profile', 'own'),
    ('seafarer', 'edit_own_profile', 'own'),
    ('seafarer', 'submit_own_profile_for_review', 'own'),
    ('seafarer', 'view_own_review_status', 'own'),
    ('seafarer', 'view_own_applications', 'own'),
    ('seafarer', 'apply_to_vacancy', 'own'),
    ('seafarer', 'withdraw_own_application', 'own'),
    ('employer', 'view_own_company', 'company'),
    ('employer', 'edit_own_company', 'company'),
    ('employer', 'create_vacancy', 'company'),
    ('employer', 'edit_own_vacancy', 'company'),
    ('employer', 'submit_vacancy_for_review', 'company'),
    ('employer', 'view_own_vacancies', 'company'),
    ('employer', 'view_presented_candidates', 'company'),
    ('employer', 'update_employer_shortlist_status', 'company'),
    ('shipowner', 'view_own_company', 'company'),
    ('shipowner', 'edit_own_company', 'company'),
    ('shipowner', 'create_vacancy', 'company'),
    ('shipowner', 'edit_own_vacancy', 'company'),
    ('shipowner', 'submit_vacancy_for_review', 'company'),
    ('shipowner', 'view_own_vacancies', 'company'),
    ('shipowner', 'view_presented_candidates', 'company'),
    ('shipowner', 'update_employer_shortlist_status', 'company'),
    ('crewing_manager', 'view_own_company', 'company'),
    ('crewing_manager', 'edit_own_company', 'company'),
    ('crewing_manager', 'create_vacancy', 'company'),
    ('crewing_manager', 'edit_own_vacancy', 'company'),
    ('crewing_manager', 'submit_vacancy_for_review', 'company'),
    ('crewing_manager', 'view_own_vacancies', 'company'),
    ('crewing_manager', 'view_presented_candidates', 'company'),
    ('crewing_manager', 'update_employer_shortlist_status', 'company'),
    ('company_representative', 'view_own_company', 'company'),
    ('company_representative', 'edit_own_company', 'company'),
    ('company_representative', 'create_vacancy', 'company'),
    ('company_representative', 'edit_own_vacancy', 'company'),
    ('company_representative', 'submit_vacancy_for_review', 'company'),
    ('company_representative', 'view_own_vacancies', 'company'),
    ('company_representative', 'view_presented_candidates', 'company'),
    ('company_representative', 'update_employer_shortlist_status', 'company'),
    ('company_admin', 'view_own_company', 'company'),
    ('company_admin', 'edit_own_company', 'company'),
    ('company_admin', 'create_vacancy', 'company'),
    ('company_admin', 'edit_own_vacancy', 'company'),
    ('company_admin', 'submit_vacancy_for_review', 'company'),
    ('company_admin', 'view_own_vacancies', 'company'),
    ('company_admin', 'view_presented_candidates', 'company'),
    ('company_admin', 'update_employer_shortlist_status', 'company'),
    ('support_operator', 'view_support_queue', 'queue'),
    ('support_operator', 'view_limited_user_summary', 'queue'),
    ('support_operator', 'create_support_note', 'assigned'),
    ('support_operator', 'request_missing_information', 'assigned'),
    ('support_operator', 'route_case_to_operator', 'assigned'),
    ('verifier', 'view_verification_queue', 'queue'),
    ('verifier', 'view_seafarer_documents', 'queue'),
    ('verifier', 'view_company_documents', 'queue'),
    ('verifier', 'view_vessel_documents', 'queue'),
    ('verifier', 'mark_document_under_review', 'queue'),
    ('verifier', 'mark_document_verified', 'queue'),
    ('verifier', 'mark_document_rejected', 'queue'),
    ('verifier', 'request_document_correction', 'queue'),
    ('verifier', 'create_verification_note', 'queue'),
    ('reviewer', 'view_review_queue', 'queue'),
    ('reviewer', 'start_human_review', 'queue'),
    ('reviewer', 'approve_seafarer_profile', 'queue'),
    ('reviewer', 'reject_seafarer_profile', 'queue'),
    ('reviewer', 'return_profile_for_correction', 'queue'),
    ('reviewer', 'approve_company_profile', 'queue'),
    ('reviewer', 'approve_vacancy_request', 'queue'),
    ('reviewer', 'approve_candidate_presentation', 'queue'),
    ('reviewer', 'create_review_note', 'queue'),
    ('complaint_operator', 'view_complaint_queue', 'queue'),
    ('complaint_operator', 'create_complaint_record', 'queue'),
    ('complaint_operator', 'update_complaint_status', 'queue'),
    ('complaint_operator', 'escalate_complaint', 'queue'),
    ('complaint_operator', 'close_complaint', 'queue'),
    ('complaint_operator', 'view_complaint_history', 'queue'),
    ('billing_operator', 'view_billing_accounts', 'queue'),
    ('billing_operator', 'view_service_entitlements', 'queue'),
    ('billing_operator', 'update_billing_review_status', 'queue'),
    ('billing_operator', 'create_billing_exception_request', 'queue'),
    ('billing_operator', 'view_billing_audit', 'queue'),
    ('read_only_auditor', 'view_support_queue', 'all_operational'),
    ('read_only_auditor', 'view_limited_user_summary', 'all_operational'),
    ('read_only_auditor', 'view_verification_queue', 'all_operational'),
    ('read_only_auditor', 'view_seafarer_documents', 'all_operational'),
    ('read_only_auditor', 'view_company_documents', 'all_operational'),
    ('read_only_auditor', 'view_vessel_documents', 'all_operational'),
    ('read_only_auditor', 'view_review_queue', 'all_operational'),
    ('read_only_auditor', 'view_complaint_queue', 'all_operational'),
    ('read_only_auditor', 'view_complaint_history', 'all_operational'),
    ('read_only_auditor', 'view_billing_accounts', 'all_operational'),
    ('read_only_auditor', 'view_service_entitlements', 'all_operational'),
    ('read_only_auditor', 'view_billing_audit', 'all_operational'),
    ('read_only_auditor', 'view_access_audit', 'all_operational'),
    ('platform_administrator', 'view_admin_console', 'system'),
    ('platform_administrator', 'view_users', 'system'),
    ('platform_administrator', 'view_groups', 'system'),
    ('platform_administrator', 'view_roles', 'system'),
    ('platform_administrator', 'view_permissions', 'system'),
    ('platform_administrator', 'manage_user_groups', 'system'),
    ('platform_administrator', 'manage_group_roles', 'system'),
    ('platform_administrator', 'revoke_operator_access', 'system'),
    ('platform_administrator', 'suspend_user', 'system'),
    ('platform_administrator', 'view_access_audit', 'system'),
    ('project_owner', 'view_admin_console', 'system'),
    ('project_owner', 'view_users', 'system'),
    ('project_owner', 'view_groups', 'system'),
    ('project_owner', 'view_roles', 'system'),
    ('project_owner', 'view_permissions', 'system'),
    ('project_owner', 'manage_user_groups', 'system'),
    ('project_owner', 'manage_group_roles', 'system'),
    ('project_owner', 'revoke_operator_access', 'system'),
    ('project_owner', 'suspend_user', 'system'),
    ('project_owner', 'view_access_audit', 'system'),
    ('project_owner', 'approve_access_policy_change', 'system'),
    ('project_owner', 'approve_high_risk_exception', 'system'),
    ('project_owner', 'assign_platform_administrator', 'system'),
    ('project_owner', 'view_full_audit_log', 'system'),
    ('project_owner', 'emergency_revoke_access', 'system')
)
INSERT INTO crewportglobal.access_role_permissions (role_id, permission_id, scope)
SELECT roles.role_id, permissions.permission_id, seed.scope
FROM role_permission_seed seed
JOIN crewportglobal.access_roles roles ON roles.role_code = seed.role_code
JOIN crewportglobal.access_permissions permissions ON permissions.permission_code = seed.permission_code
ON CONFLICT DO NOTHING;

COMMIT;

-- Rollback assumption for review:
-- This draft creates independent access-control tables plus seed data.
-- A future rollback draft may drop these tables in reverse dependency order
-- only before backend enforcement depends on them and only after Project Owner approval.
