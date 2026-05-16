<?php

declare(strict_types=1);

function cpg_admin_contract_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$contractPath = __DIR__ . '/../contracts/registration-drafts.openapi.yaml';
$yaml = file_get_contents($contractPath);
cpg_admin_contract_test_assert(is_string($yaml), 'OpenAPI contract should be readable');

$requiredFragments = [
    '/admin/access/email-code/request:',
    'operationId: requestAdminAccessEmailCode',
    '#/components/schemas/AdminEmailCodeRequest',
    '#/components/schemas/AdminEmailCodeRequestAcceptedResponse',
    '/admin/access/email-code/verify:',
    'operationId: verifyAdminAccessEmailCode',
    '#/components/schemas/AdminEmailCodeVerifyRequest',
    '#/components/schemas/AdminAccessSessionResponse',
    '#/components/schemas/AdminAccessDisabledResponse',
    '/admin/access/team-links:',
    'operationId: readProtectedTeamLinks',
    '#/components/schemas/TeamLinksResponse',
    'enum: [group_membership]',
    '/admin/access/management:',
    'operationId: readAdminAccessManagement',
    '#/components/schemas/AdminAccessManagementResponse',
    '/admin/access/users:',
    'operationId: createAdminAccessUser',
    '#/components/schemas/AdminCreateUserRequest',
    '/admin/access/group-members:',
    'operationId: addAdminAccessGroupMember',
    '#/components/schemas/AdminAddGroupMemberRequest',
    'enum: [admin_access]',
    "pattern: '^[0-9]{6}$'",
    'enum: [600]',
    'enum: [admin_access_flow_not_enabled]',
];

foreach ($requiredFragments as $fragment) {
    cpg_admin_contract_test_assert(
        strpos($yaml, $fragment) !== false,
        "OpenAPI contract is missing fragment: {$fragment}"
    );
}

fwrite(STDOUT, "Admin access contract tests passed\n");
