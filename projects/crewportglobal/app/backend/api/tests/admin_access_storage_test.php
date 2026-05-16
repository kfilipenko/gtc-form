<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_flow.php';

function cpg_admin_storage_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$ownerUserId = '11111111-1111-4111-8111-111111111111';
$fixedNow = new DateTimeImmutable('2026-05-15T12:00:00+00:00');
$metadata = [
    'ip_address' => '127.0.0.1',
    'user_agent' => 'admin-access-storage-test',
];

$storage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => $ownerUserId,
        'email' => 'Owner@CrewPortGlobal.com',
        'is_active' => true,
        'groups' => ['owners'],
        'roles' => ['project_owner'],
        'permissions' => ['view_admin_console'],
    ],
]);

$request = cpg_admin_access_request_code_with_storage(
    ['email' => 'owner@crewportglobal.com'],
    $storage,
    true,
    $fixedNow,
    $metadata,
    static fn (): string => '123456'
);

cpg_admin_storage_test_assert(
    ($request['status'] ?? null) === 202,
    'storage-backed admin code request should return accepted'
);
cpg_admin_storage_test_assert(
    !str_contains(json_encode($request, JSON_THROW_ON_ERROR), '123456'),
    'storage-backed admin code request must not expose the clear code'
);
cpg_admin_storage_test_assert(
    ($request['payload']['storage_status'] ?? null) === 'handled_by_storage_adapter',
    'storage-backed admin code request should expose generic storage status only'
);

$codes = $storage->adminEmailCodes();
cpg_admin_storage_test_assert(count($codes) === 1, 'eligible admin code request should store one code hash');
cpg_admin_storage_test_assert(
    ($codes[0]['user_id'] ?? null) === $ownerUserId,
    'stored admin code should belong to the owner user'
);
cpg_admin_storage_test_assert(
    ($codes[0]['code_hash'] ?? null) !== '123456',
    'stored admin code should contain only a password hash'
);
cpg_admin_storage_test_assert(
    cpg_admin_verify_email_code('123456', (string) ($codes[0]['code_hash'] ?? '')),
    'stored admin code hash should verify with the expected code'
);
cpg_admin_storage_test_assert(
    ($codes[0]['expires_at'] ?? null) === '2026-05-15T12:10:00+00:00',
    'stored admin code should expire after 10 minutes'
);

$wrongVerify = cpg_admin_access_verify_code_with_storage(
    ['email' => 'owner@crewportglobal.com', 'code' => '000000'],
    $storage,
    true,
    new DateTimeImmutable('2026-05-15T12:01:00+00:00'),
    $metadata
);

cpg_admin_storage_test_assert(
    ($wrongVerify['status'] ?? null) === 401,
    'wrong admin code should return unauthorized'
);
cpg_admin_storage_test_assert(
    ($wrongVerify['payload']['attempts_remaining'] ?? null) === 4,
    'wrong admin code should decrement attempts remaining'
);
cpg_admin_storage_test_assert(
    ($storage->adminEmailCodes()[0]['attempt_count'] ?? null) === 1,
    'wrong admin code should increment stored attempt count'
);

$validVerify = cpg_admin_access_verify_code_with_storage(
    ['email' => 'owner@crewportglobal.com', 'code' => '123456'],
    $storage,
    true,
    new DateTimeImmutable('2026-05-15T12:02:00+00:00'),
    $metadata
);

cpg_admin_storage_test_assert(
    ($validVerify['status'] ?? null) === 200,
    'valid admin code should create an admin session response'
);
cpg_admin_storage_test_assert(
    ($validVerify['payload']['admin_session_expires_at'] ?? null) === '2026-05-15T12:32:00+00:00',
    'admin session should expire after 30 minutes'
);
$sessionToken = (string) ($validVerify['payload']['admin_session_token'] ?? '');
cpg_admin_storage_test_assert(
    cpg_admin_access_normalize_session_token($sessionToken) === $sessionToken,
    'valid admin code should return an admin session token'
);
cpg_admin_storage_test_assert(
    ($storage->adminEmailCodes()[0]['used_at'] ?? null) === '2026-05-15T12:02:00+00:00',
    'valid admin code should be marked used'
);
cpg_admin_storage_test_assert(
    count($storage->adminSessions()) === 1,
    'valid admin code should create one admin session'
);
$sessionSummary = cpg_admin_access_session_summary_with_storage(
    $storage,
    $sessionToken,
    new DateTimeImmutable('2026-05-15T12:03:00+00:00')
);
cpg_admin_storage_test_assert(
    ($sessionSummary['status'] ?? null) === 200,
    'active admin session should return a console summary'
);
cpg_admin_storage_test_assert(
    ($sessionSummary['payload']['user']['email'] ?? null) === 'owner@crewportglobal.com',
    'console summary should include current user email'
);
cpg_admin_storage_test_assert(
    in_array('view_admin_console', $sessionSummary['payload']['effective_permissions'] ?? [], true),
    'console summary should include effective permissions'
);
$revokeSession = cpg_admin_access_revoke_session_with_storage(
    $storage,
    $sessionToken,
    new DateTimeImmutable('2026-05-15T12:04:00+00:00'),
    $metadata
);
cpg_admin_storage_test_assert(
    ($revokeSession['status'] ?? null) === 200,
    'admin session revoke should succeed'
);
cpg_admin_storage_test_assert(
    cpg_admin_access_session_summary_with_storage(
        $storage,
        $sessionToken,
        new DateTimeImmutable('2026-05-15T12:05:00+00:00')
    )['status'] === 401,
    'revoked admin session should not return a console summary'
);

$reuseVerify = cpg_admin_access_verify_code_with_storage(
    ['email' => 'owner@crewportglobal.com', 'code' => '123456'],
    $storage,
    true,
    new DateTimeImmutable('2026-05-15T12:03:00+00:00'),
    $metadata
);
cpg_admin_storage_test_assert(
    ($reuseVerify['status'] ?? null) === 401,
    'used admin code should not be reusable'
);

$notAdminStorage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => '22222222-2222-4222-8222-222222222222',
        'email' => 'user@example.com',
        'is_active' => true,
        'roles' => ['seafarer'],
    ],
]);
$notAdminRequest = cpg_admin_access_request_code_with_storage(
    ['email' => 'user@example.com'],
    $notAdminStorage,
    true,
    $fixedNow,
    $metadata,
    static fn (): string => '654321'
);
cpg_admin_storage_test_assert(
    ($notAdminRequest['status'] ?? null) === 202,
    'non-admin request should keep a generic accepted response'
);
cpg_admin_storage_test_assert(
    count($notAdminStorage->adminEmailCodes()) === 0,
    'non-admin request should not store an admin email code'
);

$directPermissionStorage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => '33333333-3333-4333-8333-333333333333',
        'email' => 'permission-only@example.com',
        'is_active' => true,
        'permissions' => ['view_admin_console'],
    ],
]);
$directPermissionRequest = cpg_admin_access_request_code_with_storage(
    ['email' => 'permission-only@example.com'],
    $directPermissionStorage,
    true,
    $fixedNow,
    $metadata,
    static fn (): string => '111111'
);
cpg_admin_storage_test_assert(
    ($directPermissionRequest['status'] ?? null) === 202 && count($directPermissionStorage->adminEmailCodes()) === 0,
    'direct permission without approved group membership must not store an admin email code'
);

$directRoleStorage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => '44444444-4444-4444-8444-444444444444',
        'email' => 'role-only@example.com',
        'is_active' => true,
        'roles' => ['project_owner'],
    ],
]);
$directRoleRequest = cpg_admin_access_request_code_with_storage(
    ['email' => 'role-only@example.com'],
    $directRoleStorage,
    true,
    $fixedNow,
    $metadata,
    static fn (): string => '111111'
);
cpg_admin_storage_test_assert(
    ($directRoleRequest['status'] ?? null) === 202 && count($directRoleStorage->adminEmailCodes()) === 0,
    'direct role without approved group membership must not store an admin email code'
);

$limitStorage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => $ownerUserId,
        'email' => 'owner@crewportglobal.com',
        'groups' => ['owners'],
        'roles' => ['project_owner'],
    ],
]);
cpg_admin_access_request_code_with_storage(
    ['email' => 'owner@crewportglobal.com'],
    $limitStorage,
    true,
    $fixedNow,
    $metadata,
    static fn (): string => '222222'
);
for ($attempt = 0; $attempt < 5; $attempt += 1) {
    cpg_admin_access_verify_code_with_storage(
        ['email' => 'owner@crewportglobal.com', 'code' => '999999'],
        $limitStorage,
        true,
        new DateTimeImmutable('2026-05-15T12:01:00+00:00'),
        $metadata
    );
}
$exceeded = cpg_admin_access_verify_code_with_storage(
    ['email' => 'owner@crewportglobal.com', 'code' => '222222'],
    $limitStorage,
    true,
    new DateTimeImmutable('2026-05-15T12:02:00+00:00'),
    $metadata
);
cpg_admin_storage_test_assert(
    ($exceeded['status'] ?? null) === 429,
    'admin code should reject verification after maximum failed attempts'
);

$eventTypes = array_map(static fn (array $event): string => (string) ($event['event_type'] ?? ''), $storage->auditEvents());
cpg_admin_storage_test_assert(
    in_array('admin_email_code_requested', $eventTypes, true),
    'storage-backed flow should audit code requests'
);
cpg_admin_storage_test_assert(
    in_array('admin_email_code_verify_failed', $eventTypes, true),
    'storage-backed flow should audit failed verification'
);
cpg_admin_storage_test_assert(
    in_array('admin_email_code_verified', $eventTypes, true),
    'storage-backed flow should audit successful verification'
);

fwrite(STDOUT, "Admin access storage adapter tests passed\n");
