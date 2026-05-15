<?php

declare(strict_types=1);

function cpg_migration_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function cpg_migration_contains(string $sql, string $needle, string $message): void {
    cpg_migration_test_assert(strpos($sql, $needle) !== false, $message);
}

$migrationPath = __DIR__ . '/../../db/migrations/006_access_control_foundation_draft.sql';
$sql = file_get_contents($migrationPath);
cpg_migration_test_assert(is_string($sql), 'access-control migration draft should be readable');

cpg_migration_contains($sql, 'DRAFT ONLY: do not apply to production', 'draft-only production warning should be present');
cpg_migration_contains($sql, 'Depends on 001_create_registration_foundation.sql', 'dependency on registration foundation should be documented');
cpg_migration_contains($sql, 'BEGIN;', 'migration draft should use an explicit transaction start');
cpg_migration_contains($sql, 'COMMIT;', 'migration draft should use an explicit transaction commit');

$forbiddenFragments = [
    'DROP TABLE',
    'DROP SCHEMA',
    'TRUNCATE ',
    'DELETE FROM',
    'ALTER TABLE crewportglobal.users DROP',
    'ALTER TABLE crewportglobal.user_roles DROP',
];

foreach ($forbiddenFragments as $fragment) {
    cpg_migration_test_assert(
        stripos($sql, $fragment) === false,
        "migration draft should not contain forbidden fragment: {$fragment}"
    );
}

$requiredTables = [
    'access_groups',
    'access_group_members',
    'access_roles',
    'access_group_roles',
    'access_permissions',
    'access_role_permissions',
    'access_audit_events',
    'admin_email_codes',
    'admin_sessions',
];

foreach ($requiredTables as $table) {
    cpg_migration_contains(
        $sql,
        "CREATE TABLE IF NOT EXISTS crewportglobal.{$table}",
        "missing idempotent table definition for {$table}"
    );
}

$requiredIndexes = [
    'access_group_members_active_group_user_uidx',
    'access_group_members_user_idx',
    'access_group_roles_active_group_role_uidx',
    'access_group_roles_role_idx',
    'access_role_permissions_role_permission_scope_uidx',
    'access_role_permissions_permission_idx',
    'access_audit_events_created_at_idx',
    'access_audit_events_actor_idx',
    'access_audit_events_target_user_idx',
    'access_audit_events_event_type_idx',
    'admin_email_codes_active_user_purpose_idx',
    'admin_sessions_active_user_idx',
];

foreach ($requiredIndexes as $index) {
    cpg_migration_contains($sql, "CREATE INDEX IF NOT EXISTS {$index}", "missing index {$index}");
}

cpg_migration_contains($sql, "group_type IN ('public', 'external', 'internal', 'administration', 'system')", 'group type constraint should be present');
cpg_migration_contains($sql, "role_type IN ('public', 'external', 'internal', 'administration', 'system')", 'role type constraint should be present');
cpg_migration_contains($sql, "scope IN ('public', 'own', 'company', 'assigned', 'queue', 'all_operational', 'system')", 'role permission scope constraint should be present');
cpg_migration_contains($sql, "purpose IN ('admin_access')", 'admin email code purpose constraint should be present');
cpg_migration_contains($sql, 'attempt_count >= 0', 'admin email code attempt count constraint should be present');

$requiredGroups = [
    'public_visitors',
    'registered_users',
    'registered_seafarers',
    'registered_employers',
    'shipowners',
    'crewing_managers',
    'company_representatives',
    'company_admins',
    'support_team',
    'verification_team',
    'review_team',
    'complaint_team',
    'billing_team',
    'read_only_auditors',
    'platform_administrators',
    'platform_owners',
    'ai_assistants',
];

$requiredRoles = [
    'public_visitor',
    'registered_user',
    'seafarer',
    'employer',
    'shipowner',
    'crewing_manager',
    'company_representative',
    'company_admin',
    'support_operator',
    'verifier',
    'reviewer',
    'complaint_operator',
    'billing_operator',
    'read_only_auditor',
    'platform_administrator',
    'project_owner',
    'ai_assistant',
];

$requiredPermissions = [
    'view_public_pages',
    'view_public_vacancies',
    'view_public_documents',
    'register_account',
    'login_account',
    'view_own_profile',
    'edit_own_profile',
    'submit_own_profile_for_review',
    'view_own_review_status',
    'view_own_applications',
    'apply_to_vacancy',
    'withdraw_own_application',
    'view_own_company',
    'edit_own_company',
    'create_vacancy',
    'edit_own_vacancy',
    'submit_vacancy_for_review',
    'view_own_vacancies',
    'view_presented_candidates',
    'update_employer_shortlist_status',
    'view_support_queue',
    'view_limited_user_summary',
    'create_support_note',
    'request_missing_information',
    'route_case_to_operator',
    'view_verification_queue',
    'view_seafarer_documents',
    'view_company_documents',
    'view_vessel_documents',
    'mark_document_under_review',
    'mark_document_verified',
    'mark_document_rejected',
    'request_document_correction',
    'create_verification_note',
    'view_review_queue',
    'start_human_review',
    'approve_seafarer_profile',
    'reject_seafarer_profile',
    'return_profile_for_correction',
    'approve_company_profile',
    'approve_vacancy_request',
    'approve_candidate_presentation',
    'create_review_note',
    'view_complaint_queue',
    'create_complaint_record',
    'update_complaint_status',
    'escalate_complaint',
    'close_complaint',
    'view_complaint_history',
    'view_billing_accounts',
    'view_service_entitlements',
    'update_billing_review_status',
    'create_billing_exception_request',
    'view_billing_audit',
    'view_admin_console',
    'view_users',
    'view_groups',
    'view_roles',
    'view_permissions',
    'manage_user_groups',
    'manage_group_roles',
    'revoke_operator_access',
    'suspend_user',
    'view_access_audit',
    'approve_access_policy_change',
    'approve_high_risk_exception',
    'assign_platform_administrator',
    'view_full_audit_log',
    'emergency_revoke_access',
];

foreach ($requiredGroups as $group) {
    cpg_migration_contains($sql, "('{$group}',", "missing seed group {$group}");
}

foreach ($requiredRoles as $role) {
    cpg_migration_contains($sql, "('{$role}',", "missing seed role {$role}");
}

foreach ($requiredPermissions as $permission) {
    cpg_migration_contains($sql, "('{$permission}',", "missing seed permission {$permission}");
}

$requiredRolePermissionMappings = [
    ['seafarer', 'view_own_profile', 'own'],
    ['seafarer', 'apply_to_vacancy', 'own'],
    ['employer', 'create_vacancy', 'company'],
    ['shipowner', 'view_own_company', 'company'],
    ['support_operator', 'view_support_queue', 'queue'],
    ['verifier', 'view_verification_queue', 'queue'],
    ['reviewer', 'approve_vacancy_request', 'queue'],
    ['complaint_operator', 'close_complaint', 'queue'],
    ['billing_operator', 'view_billing_accounts', 'queue'],
    ['read_only_auditor', 'view_access_audit', 'all_operational'],
    ['platform_administrator', 'manage_user_groups', 'system'],
    ['project_owner', 'assign_platform_administrator', 'system'],
    ['project_owner', 'emergency_revoke_access', 'system'],
];

foreach ($requiredRolePermissionMappings as [$role, $permission, $scope]) {
    cpg_migration_contains(
        $sql,
        "('{$role}', '{$permission}', '{$scope}')",
        "missing role-permission mapping {$role}/{$permission}/{$scope}"
    );
}

fwrite(STDOUT, "Access-control migration draft tests passed\n");
