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
    ($defaultStatus['error'] ?? null) === 'admin_email_delivery_disabled',
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
    ($disabledResponse['payload']['error'] ?? null) === 'admin_email_delivery_disabled',
    'disabled email delivery response should use explicit not-configured error'
);

$incompleteStatus = cpg_admin_access_email_delivery_status([
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED' => 'true',
]);
cpg_admin_email_delivery_test_assert(
    ($incompleteStatus['mode'] ?? null) === 'smtp_configured_but_not_sent',
    'enabled email delivery should default to SMTP-not-sent mode'
);
cpg_admin_email_delivery_test_assert(
    ($incompleteStatus['error'] ?? null) === 'admin_email_delivery_config_incomplete',
    'enabled email delivery without server-only password should be config incomplete'
);
cpg_admin_email_delivery_test_assert(
    in_array('password', $incompleteStatus['missing_config'] ?? [], true),
    'SMTP config validation should require password presence without exposing password'
);

$invalidStatus = cpg_admin_access_email_delivery_status([
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED' => 'true',
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'provider',
]);
cpg_admin_email_delivery_test_assert(
    ($invalidStatus['error'] ?? null) === 'admin_email_delivery_mode_invalid',
    'unsupported email delivery mode should be invalid until a real provider is approved'
);
cpg_admin_email_delivery_test_assert(
    cpg_admin_access_create_email_delivery([
        'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED' => 'true',
        'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'provider',
    ]) === null,
    'invalid email delivery mode should not create an adapter'
);

$tempEnvFile = tempnam(sys_get_temp_dir(), 'cpg-admin-env-');
cpg_admin_email_delivery_test_assert(is_string($tempEnvFile), 'temporary env file should be available');
file_put_contents($tempEnvFile, "CPG_ADMIN_ACCESS_TEST_ENV_KEY=\"secret-value\"\n");
$loadedEnv = cpg_admin_access_load_protected_env_file($tempEnvFile, true);
cpg_admin_email_delivery_test_assert(
    ($loadedEnv['ok'] ?? false) === true,
    'protected env loader should load readable env files'
);
cpg_admin_email_delivery_test_assert(
    in_array('CPG_ADMIN_ACCESS_TEST_ENV_KEY', $loadedEnv['loaded_keys'] ?? [], true),
    'protected env loader should report loaded keys without values'
);
cpg_admin_email_delivery_test_assert(
    getenv('CPG_ADMIN_ACCESS_TEST_ENV_KEY') === 'secret-value',
    'protected env loader should make values available to runtime without returning them'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($loadedEnv, JSON_THROW_ON_ERROR), 'secret-value'),
    'protected env loader result must not expose loaded secret values'
);
putenv('CPG_ADMIN_ACCESS_TEST_ENV_KEY');
unset($_ENV['CPG_ADMIN_ACCESS_TEST_ENV_KEY'], $_SERVER['CPG_ADMIN_ACCESS_TEST_ENV_KEY']);
unlink($tempEnvFile);

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
cpg_admin_email_delivery_test_assert(
    ($message['subject'] ?? null) === 'CrewPortGlobal admin access code',
    'admin access email subject should match the approved subject'
);
cpg_admin_email_delivery_test_assert(
    str_contains((string) ($message['body_text'] ?? ''), 'Your CrewPortGlobal admin access code is: 123456'),
    'admin access email body should contain the approved code line'
);
cpg_admin_email_delivery_test_assert(
    str_contains((string) ($message['body_text'] ?? ''), 'If you did not request this code, ignore this message.'),
    'admin access email body should contain ignore-this-message safety line'
);
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

$smtpEnv = [
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED' => 'true',
    'CREWPORTGLOBAL_SMTP_HOST' => 'smtp.timeweb.ru',
    'CREWPORTGLOBAL_SMTP_PORT' => '465',
    'CREWPORTGLOBAL_SMTP_SECURITY' => 'ssl',
    'CREWPORTGLOBAL_SMTP_USERNAME' => 'not_reply@crewportglobal.com',
    'CREWPORTGLOBAL_SMTP_PASSWORD' => 'present-for-validation-only',
    'CREWPORTGLOBAL_SMTP_FROM_EMAIL' => 'not_reply@crewportglobal.com',
    'CREWPORTGLOBAL_SMTP_FROM_NAME' => 'CrewPortGlobal Security',
];
$smtpStatus = cpg_admin_access_email_delivery_status($smtpEnv);
cpg_admin_email_delivery_test_assert(
    ($smtpStatus['mode'] ?? null) === 'smtp_configured_but_not_sent',
    'complete SMTP config should remain not-sent until send flag is separately enabled'
);
cpg_admin_email_delivery_test_assert(
    ($smtpStatus['code'] ?? null) === 'admin_email_delivery_send_not_enabled',
    'complete SMTP config should expose send-not-enabled result code'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($smtpStatus, JSON_THROW_ON_ERROR), 'present-for-validation-only'),
    'SMTP status must not expose SMTP password'
);

$smtpDelivery = cpg_admin_access_create_email_delivery($smtpEnv);
cpg_admin_email_delivery_test_assert(
    $smtpDelivery instanceof CpgAdminAccessSmtpPreparedEmailDelivery,
    'complete SMTP config should create prepared SMTP delivery adapter'
);
$smtpResult = $smtpDelivery->sendAdminEmailCode($message);
cpg_admin_email_delivery_test_assert(
    ($smtpResult['delivery_status'] ?? null) === 'admin_email_delivery_send_not_enabled',
    'prepared SMTP delivery should not send without send flag'
);
cpg_admin_email_delivery_test_assert(
    ($smtpResult['from_email'] ?? null) === 'not_reply@crewportglobal.com',
    'prepared SMTP delivery should use approved sender mailbox'
);
cpg_admin_email_delivery_test_assert(
    ($smtpResult['smtp_host'] ?? null) === 'smtp.timeweb.ru' && ($smtpResult['smtp_port'] ?? null) === 465,
    'prepared SMTP delivery should use approved Timeweb SMTP endpoint'
);
cpg_admin_email_delivery_test_assert(
    ($smtpResult['real_send_performed'] ?? null) === false,
    'prepared SMTP delivery must not perform real SMTP send'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($smtpResult, JSON_THROW_ON_ERROR), '123456'),
    'prepared SMTP delivery result must not expose clear code'
);
cpg_admin_email_delivery_test_assert(
    !str_contains(json_encode($smtpResult, JSON_THROW_ON_ERROR), 'present-for-validation-only'),
    'prepared SMTP delivery result must not expose SMTP password'
);

$sendReadyStatus = cpg_admin_access_email_delivery_status(array_merge($smtpEnv, [
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'smtp_send_ready',
    'CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED' => 'true',
]));
cpg_admin_email_delivery_test_assert(
    ($sendReadyStatus['mode'] ?? null) === 'smtp_send_ready',
    'SMTP send-ready mode should require explicit send flag'
);
cpg_admin_email_delivery_test_assert(
    ($sendReadyStatus['code'] ?? null) === 'admin_email_delivery_message_ready',
    'SMTP send-ready mode should expose message-ready result code'
);
$sendReadyDelivery = cpg_admin_access_create_email_delivery(array_merge($smtpEnv, [
    'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE' => 'smtp_send_ready',
    'CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED' => 'true',
]));
cpg_admin_email_delivery_test_assert(
    $sendReadyDelivery instanceof CpgAdminAccessSmtpPreparedEmailDelivery,
    'SMTP send-ready mode should create SMTP delivery adapter without sending during construction'
);

$source = file_get_contents(__DIR__ . '/../public/index.php');
cpg_admin_email_delivery_test_assert(is_string($source), 'public index should be readable');
cpg_admin_email_delivery_test_assert(
    str_contains($source, "require_once __DIR__ . '/../lib/admin_access_email_delivery.php';"),
    'public route should include email delivery after runtime activation approval'
);
cpg_admin_email_delivery_test_assert(
    str_contains($source, 'cpg_admin_access_create_email_delivery()'),
    'public route should create email delivery only after runtime gates'
);

$deliverySource = file_get_contents(__DIR__ . '/../lib/admin_access_email_delivery.php');
cpg_admin_email_delivery_test_assert(is_string($deliverySource), 'email delivery source should be readable');
cpg_admin_email_delivery_test_assert(
    preg_match('/(?<![A-Za-z0-9_])mail\s*\(/', $deliverySource) !== 1,
    'email delivery adapter must not use PHP mail()'
);
cpg_admin_email_delivery_test_assert(
    !str_contains($deliverySource, 'fsockopen('),
    'email delivery adapter must not use fsockopen for SMTP'
);
cpg_admin_email_delivery_test_assert(
    str_contains($deliverySource, 'stream_socket_client(')
        && str_contains($deliverySource, 'cpg_admin_access_smtp_send_prepared_message('),
    'email delivery adapter should keep the real SMTP path explicit and isolated'
);

fwrite(STDOUT, "Admin access email delivery tests passed\n");
