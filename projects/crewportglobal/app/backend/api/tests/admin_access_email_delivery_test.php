<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_email_delivery.php';

function cpg_admin_email_delivery_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$defaultStatus = cpg_admin_access_email_delivery_status([]);
cpg_admin_email_delivery_test_assert(
    ($defaultStatus['mode'] ?? null) === 'disabled',
    'admin access email delivery should default to disabled mode'
);
cpg_admin_email_delivery_test_assert(
    ($defaultStatus['error'] ?? null) === 'admin_access_email_delivery_not_configured',
    'disabled email delivery should expose not-configured error'
);
cpg_admin_email_delivery_test_assert(
    cpg_admin_access_create_email_delivery([]) === null,
    'disabled email delivery should not create an adapter'
);

$disabledResponse = cpg_admin_access_email_delivery_disabled_response([]);
cpg_admin_email_delivery_test_assert(
    ($disabledResponse['status'] ?? null) === 503,
    'disabled email delivery response should use HTTP 503'
);
cpg_admin_email_delivery_test_assert(
    ($disabledResponse['payload']['error'] ?? null) === 'admin_access_email_delivery_not_configured',
    'disabled email delivery response should use explicit not-configured error'
);

$invalidStatus = cpg_admin_access_email_delivery_status([
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'smtp',
]);
cpg_admin_email_delivery_test_assert(
    ($invalidStatus['error'] ?? null) === 'admin_access_email_delivery_mode_invalid',
    'unsupported email delivery mode should be invalid until a real provider is approved'
);
cpg_admin_email_delivery_test_assert(
    cpg_admin_access_create_email_delivery(['CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'smtp']) === null,
    'invalid email delivery mode should not create an adapter'
);

$sinkMessages = [];
$delivery = cpg_admin_access_create_email_delivery([
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'capture',
], static function (array $message) use (&$sinkMessages): void {
    $sinkMessages[] = $message;
});

cpg_admin_email_delivery_test_assert(
    $delivery instanceof CpgAdminAccessCaptureEmailDelivery,
    'capture mode should create capture delivery adapter'
);
cpg_admin_email_delivery_test_assert(
    count($delivery->capturedMessages()) === 0 && count($sinkMessages) === 0,
    'creating capture delivery adapter must not send a message'
);

$fixedNow = new DateTimeImmutable('2026-05-15T12:00:00+00:00');
$message = cpg_admin_email_code_message('Owner@CrewPortGlobal.com', '123456', $fixedNow);
$summary = cpg_admin_access_email_delivery_safe_summary($message);
cpg_admin_email_delivery_test_assert(
    ($summary['masked_to'] ?? null) === 'o***r@crewportglobal.com',
    'delivery safe summary should mask recipient email'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($summary, JSON_THROW_ON_ERROR), '123456'),
    'delivery safe summary must not expose the clear code'
);

$result = $delivery->sendAdminEmailCode($message);
cpg_admin_email_delivery_test_assert(
    ($result['delivery_status'] ?? null) === 'captured_test_only',
    'capture delivery should report test-only capture status'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($result, JSON_THROW_ON_ERROR), '123456'),
    'capture delivery result must not expose the clear code'
);
cpg_admin_email_delivery_test_assert(
    count($delivery->capturedMessages()) === 1 && count($sinkMessages) === 1,
    'capture delivery should store exactly one message when send is called'
);
cpg_admin_email_delivery_test_assert(
    str_contains((string) ($delivery->capturedMessages()[0]['body_text'] ?? ''), '123456'),
    'capture delivery stores clear code only inside test-only captured message payload'
);

$source = file_get_contents(__DIR__ . '/../public/index.php');
cpg_admin_email_delivery_test_assert(is_string($source), 'public index should be readable');
cpg_admin_email_delivery_test_assert(
    !str_contains($source, "require_once __DIR__ . '/../lib/admin_access_email_delivery.php';"),
    'public route must not include email delivery until runtime activation is approved'
);
cpg_admin_email_delivery_test_assert(
    !str_contains($source, 'cpg_admin_access_create_email_delivery('),
    'public route must not create email delivery until runtime activation is approved'
);

fwrite(STDOUT, "Admin access email delivery tests passed\n");
