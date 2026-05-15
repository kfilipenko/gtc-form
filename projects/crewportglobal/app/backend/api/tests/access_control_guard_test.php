<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/access_control.php';

function cpg_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function cpg_test_permissions(array $pairs): array {
    return array_map(
        static fn (array $pair): array => [
            'permission_code' => $pair[0],
            'scope' => $pair[1],
        ],
        $pairs
    );
}

$seafarerPermissions = cpg_test_permissions([
    ['view_own_profile', 'own'],
    ['edit_own_profile', 'own'],
    ['apply_to_vacancy', 'own'],
]);

cpg_test_assert(
    cpg_access_effective_permissions_allow($seafarerPermissions, 'view_own_profile', 'own'),
    'seafarer should view own profile'
);
cpg_test_assert(
    !cpg_access_effective_permissions_allow($seafarerPermissions, 'view_own_profile', 'company'),
    'seafarer own permission must not satisfy company scope'
);
cpg_test_assert(
    !cpg_access_effective_permissions_allow($seafarerPermissions, 'approve_vacancy_request', 'queue'),
    'seafarer must not approve vacancy requests'
);

$platformAdministratorPermissions = cpg_test_permissions([
    ['view_admin_console', 'system'],
    ['view_users', 'system'],
    ['manage_user_groups', 'system'],
]);

cpg_test_assert(
    cpg_access_effective_permissions_allow($platformAdministratorPermissions, 'manage_user_groups', 'system'),
    'platform administrator should manage user groups'
);
cpg_test_assert(
    !cpg_access_effective_permissions_allow($platformAdministratorPermissions, 'approve_vacancy_request', 'queue'),
    'platform administrator should not receive business approval rights by default'
);

$readOnlyAuditorPermissions = cpg_test_permissions([
    ['view_review_queue', 'all_operational'],
]);

cpg_test_assert(
    cpg_access_effective_permissions_allow($readOnlyAuditorPermissions, 'view_review_queue', 'queue'),
    'all_operational read permission should satisfy queue viewing'
);
cpg_test_assert(
    !cpg_access_effective_permissions_allow($readOnlyAuditorPermissions, 'start_human_review', 'queue'),
    'read-only auditor must not start human review without action permission'
);

cpg_test_assert(
    cpg_access_operator_queue_view_permission('company_verification') === 'view_verification_queue',
    'company verification should map to verification queue view permission'
);
cpg_test_assert(
    cpg_access_operator_queue_view_permission('vacancy_application') === 'view_review_queue',
    'vacancy application should map to review queue view permission'
);
cpg_test_assert(
    cpg_access_operator_queue_action_permission('vacancy_application', 'reviewed') === 'approve_candidate_presentation',
    'reviewed vacancy application should require candidate presentation approval'
);
cpg_test_assert(
    cpg_access_operator_queue_action_permission('seafarer_profile', 'needs_correction') === 'return_profile_for_correction',
    'seafarer correction should require return-profile permission'
);
cpg_test_assert(
    cpg_access_operator_queue_action_requirement('company_verification', 'reviewed') === [
        'permission_code' => 'approve_company_profile',
        'scope' => 'queue',
    ],
    'company verification final approval should be represented as a queue-scoped requirement'
);
cpg_test_assert(
    cpg_access_operator_queue_action_permission('unknown_queue', 'reviewed') === null,
    'unknown queue type should not map to permission'
);

fwrite(STDOUT, "Access control guard tests passed\n");
