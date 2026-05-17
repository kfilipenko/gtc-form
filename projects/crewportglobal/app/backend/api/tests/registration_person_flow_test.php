<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/registration_person_flow.php';

function cpg_registration_person_flow_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "Assertion failed: {$message}\n");
        exit(1);
    }
}

$secret = str_repeat('a', 64);
$userId = '11111111-1111-4111-8111-111111111111';
$email = 'Person@Example.com';
$now = 1770000000;

$token = cpg_registration_create_confirmation_token($userId, $email, $now, $secret);
$verified = cpg_registration_verify_confirmation_token($token, $now + 30, $secret);
cpg_registration_person_flow_test_assert(($verified['ok'] ?? false) === true, 'confirmation token should verify');
cpg_registration_person_flow_test_assert(($verified['user_id'] ?? null) === $userId, 'confirmation token should carry user id');
cpg_registration_person_flow_test_assert(($verified['email'] ?? null) === 'person@example.com', 'confirmation token should normalize email');

$expired = cpg_registration_verify_confirmation_token($token, $now + CPG_REGISTRATION_LINK_TTL_SECONDS + 1, $secret);
cpg_registration_person_flow_test_assert(($expired['error'] ?? null) === 'registration_confirmation_token_expired', 'expired token should fail');

$tampered = $token . 'x';
$tamperedResult = cpg_registration_verify_confirmation_token($tampered, $now + 30, $secret);
cpg_registration_person_flow_test_assert(($tamperedResult['error'] ?? null) === 'registration_confirmation_token_invalid', 'tampered token should fail');

$defaultStatus = cpg_registration_email_delivery_status([]);
cpg_registration_person_flow_test_assert(($defaultStatus['error'] ?? null) === 'registration_email_delivery_disabled', 'registration email should default to disabled');

$captureEnv = [
    'CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED' => 'true',
    'CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE' => 'capture',
];
$captureStatus = cpg_registration_email_delivery_status($captureEnv);
cpg_registration_person_flow_test_assert(($captureStatus['mode'] ?? null) === CPG_REGISTRATION_EMAIL_MODE_CAPTURE, 'capture mode should be supported');

$message = cpg_registration_email_message(
    'person@example.com',
    'https://crewportglobal.com/register/confirm/?token=redacted',
    gmdate('c', $now + CPG_REGISTRATION_LINK_TTL_SECONDS)
);
$captureResult = cpg_registration_send_email_message($message, $captureEnv);
cpg_registration_person_flow_test_assert(($captureResult['delivery_status'] ?? null) === 'captured_test_only', 'capture delivery should not send email');
cpg_registration_person_flow_test_assert(($captureResult['real_send_performed'] ?? true) === false, 'capture delivery should report no real send');

$smtpEnv = [
    'CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED' => 'true',
    'CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE' => 'smtp_send_ready',
    'CREWPORTGLOBAL_SMTP_HOST' => 'smtp.timeweb.ru',
    'CREWPORTGLOBAL_SMTP_PORT' => '465',
    'CREWPORTGLOBAL_SMTP_SECURITY' => 'ssl',
    'CREWPORTGLOBAL_SMTP_USERNAME' => 'not_reply@crewportglobal.com',
    'CREWPORTGLOBAL_SMTP_PASSWORD' => 'present-for-validation-only',
    'CREWPORTGLOBAL_SMTP_FROM_EMAIL' => 'not_reply@crewportglobal.com',
    'CREWPORTGLOBAL_SMTP_FROM_NAME' => 'CrewPortGlobal Security',
];
$smtpStatus = cpg_registration_email_delivery_status($smtpEnv);
cpg_registration_person_flow_test_assert(($smtpStatus['code'] ?? null) === 'registration_email_delivery_send_not_enabled', 'SMTP send must require explicit registration send flag');

$sendReadyStatus = cpg_registration_email_delivery_status(array_merge($smtpEnv, [
    'CREWPORTGLOBAL_REGISTRATION_SMTP_SEND_ENABLED' => 'true',
]));
cpg_registration_person_flow_test_assert(($sendReadyStatus['code'] ?? null) === 'registration_email_delivery_message_ready', 'SMTP send-ready should require explicit flag');
cpg_registration_person_flow_test_assert(!str_contains(json_encode($sendReadyStatus, JSON_THROW_ON_ERROR), 'present-for-validation-only'), 'SMTP password must not appear in status');

$publicIndex = file_get_contents(__DIR__ . '/../public/index.php');
cpg_registration_person_flow_test_assert(is_string($publicIndex), 'public index should be readable');
cpg_registration_person_flow_test_assert(str_contains($publicIndex, '/registration/person/request'), 'public index should expose person registration request route');
cpg_registration_person_flow_test_assert(str_contains($publicIndex, '/registration/person/confirm'), 'public index should expose person registration confirm route');

echo "registration_person_flow_test passed\n";
