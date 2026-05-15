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

fwrite(STDOUT, "Admin access flow skeleton tests passed\n");
