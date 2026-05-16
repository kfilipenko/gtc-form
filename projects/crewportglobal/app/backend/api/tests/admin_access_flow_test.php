<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_flow.php';

function cpg_admin_flow_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$fixedNow = new DateTimeImmutable('2026-05-15T12:00:00+00:00');

$disabledRequest = cpg_admin_access_request_code_skeleton(['email' => 'admin@example.com'], false, $fixedNow);
cpg_admin_flow_test_assert(
    ($disabledRequest['status'] ?? null) === 503,
    'admin access code request skeleton should be disabled by default'
);
cpg_admin_flow_test_assert(
    ($disabledRequest['payload']['error'] ?? null) === 'admin_access_flow_not_enabled',
    'disabled admin access code request should return explicit disabled error'
);

$invalidRequest = cpg_admin_access_request_code_skeleton(['email' => 'not-an-email'], true, $fixedNow);
cpg_admin_flow_test_assert(
    ($invalidRequest['status'] ?? null) === 400,
    'admin access code request skeleton should reject invalid email when enabled'
);
cpg_admin_flow_test_assert(
    ($invalidRequest['payload']['error'] ?? null) === 'invalid_admin_email',
    'invalid admin access request email should use invalid_admin_email error'
);

$validRequest = cpg_admin_access_request_code_skeleton(['email' => 'Admin.User@CrewPortGlobal.com'], true, $fixedNow);
cpg_admin_flow_test_assert(
    ($validRequest['status'] ?? null) === 202,
    'admin access code request skeleton should return accepted contract when enabled'
);
cpg_admin_flow_test_assert(
    ($validRequest['payload']['masked_email'] ?? null) === 'a***r@crewportglobal.com',
    'admin access code request skeleton should mask normalized email'
);
cpg_admin_flow_test_assert(
    ($validRequest['payload']['delivery_status'] ?? null) === 'not_sent_skeleton',
    'admin access code request skeleton must not send email'
);
cpg_admin_flow_test_assert(
    ($validRequest['payload']['storage_status'] ?? null) === 'not_stored_skeleton',
    'admin access code request skeleton must not write storage'
);
cpg_admin_flow_test_assert(
    !str_contains(json_encode($validRequest, JSON_THROW_ON_ERROR), '123456'),
    'admin access code request skeleton should not expose a clear code'
);

$disabledVerify = cpg_admin_access_verify_code_skeleton(['email' => 'admin@example.com', 'code' => '123456'], false);
cpg_admin_flow_test_assert(
    ($disabledVerify['status'] ?? null) === 503,
    'admin access verify skeleton should be disabled by default'
);

$invalidCode = cpg_admin_access_verify_code_skeleton(['email' => 'admin@example.com', 'code' => '12345A'], true);
cpg_admin_flow_test_assert(
    ($invalidCode['status'] ?? null) === 400,
    'admin access verify skeleton should reject invalid code'
);
cpg_admin_flow_test_assert(
    ($invalidCode['payload']['error'] ?? null) === 'invalid_admin_code',
    'invalid admin access verify code should use invalid_admin_code error'
);

$validVerify = cpg_admin_access_verify_code_skeleton(['email' => 'admin@example.com', 'code' => '123456'], true);
cpg_admin_flow_test_assert(
    ($validVerify['status'] ?? null) === 501,
    'admin access verify skeleton should not claim verification before storage is configured'
);
cpg_admin_flow_test_assert(
    ($validVerify['payload']['error'] ?? null) === 'admin_access_storage_not_configured',
    'admin access verify skeleton should expose storage-not-configured boundary'
);

$storage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => '11111111-1111-4111-8111-111111111111',
        'email' => 'owner@example.com',
        'is_active' => true,
        'roles' => ['project_owner'],
        'groups' => ['owners'],
        'permissions' => ['view_admin_console'],
    ],
]);
$delivery = new CpgAdminAccessCaptureEmailDelivery();
$requestWithDelivery = cpg_admin_access_request_code_with_storage_and_delivery(
    ['email' => 'owner@example.com'],
    $storage,
    $delivery,
    true,
    $fixedNow,
    ['ip_address' => '127.0.0.1', 'user_agent' => 'flow-test'],
    static fn (): string => '123456'
);
cpg_admin_flow_test_assert(
    ($requestWithDelivery['status'] ?? null) === 202,
    'admin access request with storage and delivery should return accepted'
);
cpg_admin_flow_test_assert(
    ($requestWithDelivery['payload']['delivery_status'] ?? null) === 'captured_test_only',
    'admin access request should call delivery for eligible admin users'
);
cpg_admin_flow_test_assert(
    count($storage->adminEmailCodes()) === 1,
    'admin access request should store exactly one hash-only code'
);
cpg_admin_flow_test_assert(
    !str_contains(json_encode($requestWithDelivery, JSON_THROW_ON_ERROR), '123456'),
    'admin access request with delivery must not expose the clear code'
);

$verifyWithStorage = cpg_admin_access_verify_code_with_storage(
    ['email' => 'owner@example.com', 'code' => '123456'],
    $storage,
    true,
    $fixedNow,
    ['ip_address' => '127.0.0.1', 'user_agent' => 'flow-test']
);
cpg_admin_flow_test_assert(
    ($verifyWithStorage['status'] ?? null) === 200,
    'admin access verify with storage should accept the correct code'
);
$sessionToken = (string) ($verifyWithStorage['payload']['admin_session_token'] ?? '');
cpg_admin_flow_test_assert(
    cpg_admin_access_normalize_session_token($sessionToken) === $sessionToken,
    'admin access verify should return a valid session token'
);
cpg_admin_flow_test_assert(
    count($storage->adminSessions()) === 1,
    'admin access verify should create one admin session'
);
$summary = cpg_admin_access_session_summary_with_storage(
    $storage,
    $sessionToken,
    $fixedNow,
    5
);
cpg_admin_flow_test_assert(
    ($summary['status'] ?? null) === 200,
    'admin access session summary should return a console payload for active sessions'
);
cpg_admin_flow_test_assert(
    ($summary['payload']['user']['status'] ?? null) === 'Project Owner',
    'admin access session summary should show Project Owner status'
);
cpg_admin_flow_test_assert(
    in_array('owners', $summary['payload']['groups'] ?? [], true),
    'admin access session summary should expose active groups'
);
cpg_admin_flow_test_assert(
    in_array('project_owner', $summary['payload']['roles'] ?? [], true),
    'admin access session summary should expose active roles'
);
cpg_admin_flow_test_assert(
    in_array('view_admin_console', $summary['payload']['effective_permissions'] ?? [], true),
    'admin access session summary should expose effective permissions'
);

$teamLinks = cpg_admin_access_team_links_with_storage(
    $storage,
    $sessionToken,
    $fixedNow
);
cpg_admin_flow_test_assert(
    ($teamLinks['status'] ?? null) === 200,
    'owner group sessions should be allowed to view protected team links'
);
cpg_admin_flow_test_assert(
    ($teamLinks['payload']['access_model']['mode'] ?? null) === 'group_membership',
    'team links should report group membership access mode'
);

$teamStorage = new CpgAdminAccessMemoryStorage([
    [
        'user_id' => '22222222-2222-4222-8222-222222222222',
        'email' => 'team@example.com',
        'is_active' => true,
        'groups' => ['cpg_team'],
    ],
]);
$teamRequest = cpg_admin_access_request_code_with_storage(
    ['email' => 'team@example.com'],
    $teamStorage,
    true,
    $fixedNow,
    ['ip_address' => '127.0.0.1', 'user_agent' => 'team-flow-test'],
    static fn (): string => '654321'
);
cpg_admin_flow_test_assert(
    ($teamRequest['status'] ?? null) === 202 && count($teamStorage->adminEmailCodes()) === 1,
    'cpg_team group members should be able to request a protected team access code'
);
$teamVerify = cpg_admin_access_verify_code_with_storage(
    ['email' => 'team@example.com', 'code' => '654321'],
    $teamStorage,
    true,
    new DateTimeImmutable('2026-05-15T12:01:00+00:00'),
    ['ip_address' => '127.0.0.1', 'user_agent' => 'team-flow-test']
);
$teamSessionToken = (string) ($teamVerify['payload']['admin_session_token'] ?? '');
cpg_admin_flow_test_assert(
    cpg_admin_access_normalize_session_token($teamSessionToken) === $teamSessionToken,
    'cpg_team group verification should create a protected session token'
);
cpg_admin_flow_test_assert(
    cpg_admin_access_session_summary_with_storage($teamStorage, $teamSessionToken, new DateTimeImmutable('2026-05-15T12:02:00+00:00'))['status'] === 401,
    'cpg_team group sessions must not open the admin console without admin permissions'
);
cpg_admin_flow_test_assert(
    cpg_admin_access_team_links_with_storage($teamStorage, $teamSessionToken, new DateTimeImmutable('2026-05-15T12:02:00+00:00'))['status'] === 200,
    'cpg_team group sessions should open protected team links'
);
cpg_admin_flow_test_assert(
    cpg_admin_access_management_snapshot_with_storage($teamStorage, $teamSessionToken, new DateTimeImmutable('2026-05-15T12:02:00+00:00'))['status'] === 403,
    'cpg_team group sessions must not manage users or memberships'
);

$revoked = cpg_admin_access_revoke_session_with_storage(
    $storage,
    $sessionToken,
    new DateTimeImmutable('2026-05-15T12:05:00+00:00')
);
cpg_admin_flow_test_assert(
    ($revoked['status'] ?? null) === 200,
    'admin access session revoke should return success'
);
cpg_admin_flow_test_assert(
    cpg_admin_access_session_summary_with_storage($storage, $sessionToken, new DateTimeImmutable('2026-05-15T12:06:00+00:00'))['status'] === 401,
    'revoked admin access session should be rejected'
);

fwrite(STDOUT, "Admin access flow skeleton tests passed\n");
