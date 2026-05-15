<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access.php';

function cpg_admin_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$fixedNow = new DateTimeImmutable('2026-05-15T12:00:00+00:00');

for ($index = 0; $index < 20; $index += 1) {
    $code = cpg_admin_generate_email_code();
    cpg_admin_test_assert(
        preg_match('/^[0-9]{6}$/', $code) === 1,
        'generated admin email code should contain exactly 6 digits'
    );
}

cpg_admin_test_assert(
    cpg_admin_normalize_email_code(' 123 456 ') === '123456',
    'admin email code normalization should remove whitespace'
);
cpg_admin_test_assert(
    cpg_admin_normalize_email_code('12345') === null,
    'admin email code normalization should reject short codes'
);
cpg_admin_test_assert(
    cpg_admin_normalize_email_code('12345A') === null,
    'admin email code normalization should reject non-numeric codes'
);

$hash = cpg_admin_hash_email_code('123456');
cpg_admin_test_assert(
    cpg_admin_verify_email_code('123456', $hash),
    'admin email code hash should verify the matching code'
);
cpg_admin_test_assert(
    !cpg_admin_verify_email_code('654321', $hash),
    'admin email code hash should reject a different code'
);

$codeExpiresAt = cpg_admin_email_code_expires_at($fixedNow);
cpg_admin_test_assert(
    $codeExpiresAt === '2026-05-15T12:10:00+00:00',
    'admin email code expiry should be 10 minutes'
);
cpg_admin_test_assert(
    !cpg_admin_is_expired($codeExpiresAt, new DateTimeImmutable('2026-05-15T12:09:59+00:00')),
    'admin email code should be valid before expiry'
);
cpg_admin_test_assert(
    cpg_admin_is_expired($codeExpiresAt, new DateTimeImmutable('2026-05-15T12:10:00+00:00')),
    'admin email code should expire at the expiry instant'
);

$sessionExpiresAt = cpg_admin_session_expires_at($fixedNow);
cpg_admin_test_assert(
    $sessionExpiresAt === '2026-05-15T12:30:00+00:00',
    'admin session expiry should be 30 minutes'
);

cpg_admin_test_assert(
    cpg_admin_attempts_remaining(0) === 5,
    'fresh admin email code should have five attempts'
);
cpg_admin_test_assert(
    cpg_admin_attempts_remaining(5) === 0,
    'admin email code should have no attempts after the maximum'
);
cpg_admin_test_assert(
    cpg_admin_can_verify_email_code(4, $codeExpiresAt, new DateTimeImmutable('2026-05-15T12:09:00+00:00')),
    'admin email code should allow final attempt before expiry'
);
cpg_admin_test_assert(
    !cpg_admin_can_verify_email_code(5, $codeExpiresAt, new DateTimeImmutable('2026-05-15T12:09:00+00:00')),
    'admin email code should reject attempts after maximum'
);
cpg_admin_test_assert(
    !cpg_admin_can_verify_email_code(0, $codeExpiresAt, new DateTimeImmutable('2026-05-15T12:11:00+00:00')),
    'admin email code should reject attempts after expiry'
);

cpg_admin_test_assert(
    cpg_admin_mask_email('Project.Owner@CrewPortGlobal.com') === 'p***r@crewportglobal.com',
    'admin email masking should preserve only minimal local-part data'
);

$message = cpg_admin_email_code_message('admin@example.com', '123456', $fixedNow);
cpg_admin_test_assert(
    ($message['purpose'] ?? null) === 'admin_access',
    'admin email message should carry admin_access purpose'
);
cpg_admin_test_assert(
    ($message['to'] ?? null) === 'admin@example.com',
    'admin email message should normalize recipient email'
);
cpg_admin_test_assert(
    str_contains((string) ($message['body_text'] ?? ''), '123456'),
    'admin email message should include the one-time code'
);
cpg_admin_test_assert(
    ($message['expires_at'] ?? null) === '2026-05-15T12:10:00+00:00',
    'admin email message should include code expiry'
);

fwrite(STDOUT, "Admin access tests passed\n");
