<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/identity_context.php';

function cpg_identity_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$anonymous = cpg_identity_anonymous();
cpg_identity_test_assert(
    cpg_identity_permission_mode($anonymous) === 'none',
    'anonymous identity should not have a permission mode'
);
cpg_identity_test_assert(
    !cpg_identity_can_load_permissions($anonymous),
    'anonymous identity must not load permissions'
);

$temporaryOperator = cpg_identity_temporary_operator_token('operator_review_queue');
cpg_identity_test_assert(
    ($temporaryOperator['is_temporary_operator'] ?? null) === true,
    'temporary operator token identity should be marked as temporary operator'
);
cpg_identity_test_assert(
    cpg_identity_permission_mode($temporaryOperator) === 'temporary_operator_token',
    'temporary operator token identity should expose temporary token permission mode'
);
cpg_identity_test_assert(
    !cpg_identity_can_load_permissions($temporaryOperator),
    'temporary operator token identity must not load user permissions'
);
cpg_identity_test_assert(
    cpg_identity_user_id($temporaryOperator) === null,
    'temporary operator token identity must not pretend to be a named user'
);

$activeAccount = cpg_identity_account_session([
    'user_id' => '11111111-1111-4111-8111-111111111111',
    'email' => ' Operator.Example@CrewPortGlobal.com ',
    'is_active' => 't',
]);
cpg_identity_test_assert(
    is_array($activeAccount),
    'active account session should produce identity context'
);
cpg_identity_test_assert(
    cpg_identity_user_id($activeAccount) === '11111111-1111-4111-8111-111111111111',
    'active account session should expose normalized user_id'
);
cpg_identity_test_assert(
    ($activeAccount['email'] ?? null) === 'operator.example@crewportglobal.com',
    'active account session should normalize email'
);
cpg_identity_test_assert(
    cpg_identity_can_load_permissions($activeAccount),
    'active account session should be allowed to load permissions'
);

$inactiveAccount = cpg_identity_account_session([
    'user_id' => '22222222-2222-4222-8222-222222222222',
    'email' => 'inactive@example.com',
    'is_active' => false,
]);
cpg_identity_test_assert(
    is_array($inactiveAccount),
    'inactive account session should still produce an auditable identity context'
);
cpg_identity_test_assert(
    !cpg_identity_can_load_permissions($inactiveAccount),
    'inactive account session must not load permissions'
);

$adminSession = cpg_identity_account_session([
    'user_id' => '33333333-3333-4333-8333-333333333333',
    'email' => 'admin@example.com',
    'is_active' => true,
], CPG_IDENTITY_BOUNDARY_ADMIN_SESSION);
cpg_identity_test_assert(
    ($adminSession['is_admin_session'] ?? null) === true,
    'admin session boundary should be represented explicitly'
);
cpg_identity_test_assert(
    cpg_identity_can_load_permissions($adminSession),
    'active admin session should load permissions'
);

cpg_identity_test_assert(
    cpg_identity_account_session(['user_id' => 'not-a-uuid', 'is_active' => true]) === null,
    'invalid account session user_id should be rejected'
);

fwrite(STDOUT, "Identity context tests passed\n");
