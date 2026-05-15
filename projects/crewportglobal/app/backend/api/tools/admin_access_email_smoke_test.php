#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_email_delivery.php';

function cpg_admin_access_smoke_env_value(string $key): ?string {
    $value = getenv($key);
    return is_string($value) && trim($value) !== '' ? trim($value) : null;
}

function cpg_admin_access_smoke_json(array $payload, int $exitCode): never {
    fwrite(STDOUT, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    exit($exitCode);
}

$options = getopt('', ['env-file::', 'to::', 'send']);
if (!is_array($options)) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => 'admin_access_smoke_invalid_options',
    ], 2);
}

$sendRequested = array_key_exists('send', $options);
if (!$sendRequested) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => 'admin_access_smoke_send_flag_required',
        'message' => 'Run with --send for a controlled SMTP smoke test.',
    ], 2);
}

$envFile = is_string($options['env-file'] ?? null) && trim((string) $options['env-file']) !== ''
    ? trim((string) $options['env-file'])
    : CPG_ADMIN_ACCESS_PROTECTED_ENV_FILE;

$loaded = cpg_admin_access_load_protected_env_file($envFile, true);
if (($loaded['ok'] ?? false) !== true) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => $loaded['error'] ?? 'admin_access_env_file_load_failed',
        'env_file' => $envFile,
    ], 2);
}

$recipient = is_string($options['to'] ?? null) && trim((string) $options['to']) !== ''
    ? trim((string) $options['to'])
    : (
        cpg_admin_access_smoke_env_value('CREWPORTGLOBAL_ADMIN_ACCESS_TEST_RECIPIENT')
        ?? cpg_admin_access_smoke_env_value('CPG_ADMIN_ACCESS_TEST_RECIPIENT')
    );

if (!is_string($recipient) || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => 'admin_access_smoke_recipient_required',
        'env_file' => $envFile,
        'loaded_keys' => $loaded['loaded_keys'] ?? [],
    ], 2);
}

putenv(CPG_ADMIN_ACCESS_EMAIL_ENABLED_ENV . '=true');
putenv(CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV . '=' . CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY);
putenv(CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_ENV . '=true');
$_ENV[CPG_ADMIN_ACCESS_EMAIL_ENABLED_ENV] = 'true';
$_ENV[CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV] = CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY;
$_ENV[CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_ENV] = 'true';
$_SERVER[CPG_ADMIN_ACCESS_EMAIL_ENABLED_ENV] = 'true';
$_SERVER[CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV] = CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY;
$_SERVER[CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_ENV] = 'true';

$status = cpg_admin_access_email_delivery_status();
if (($status['ok'] ?? false) !== true) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => $status['error'] ?? 'admin_access_email_delivery_not_ready',
        'mode' => $status['mode'] ?? null,
        'missing_config' => $status['missing_config'] ?? [],
        'env_file' => $envFile,
        'loaded_keys' => $loaded['loaded_keys'] ?? [],
    ], 2);
}

$delivery = cpg_admin_access_create_email_delivery();
if (!$delivery instanceof CpgAdminAccessEmailDelivery) {
    cpg_admin_access_smoke_json([
        'ok' => false,
        'error' => 'admin_access_email_delivery_adapter_unavailable',
        'mode' => $status['mode'] ?? null,
        'env_file' => $envFile,
        'loaded_keys' => $loaded['loaded_keys'] ?? [],
    ], 2);
}

$message = cpg_admin_email_code_message($recipient, cpg_admin_generate_email_code(), cpg_admin_now());
$result = $delivery->sendAdminEmailCode($message);

cpg_admin_access_smoke_json([
    'ok' => ($result['ok'] ?? false) === true,
    'delivery_status' => $result['delivery_status'] ?? null,
    'mode' => $result['mode'] ?? ($status['mode'] ?? null),
    'masked_to' => $result['masked_to'] ?? cpg_admin_mask_email($recipient),
    'from_email' => $result['from_email'] ?? null,
    'smtp_host' => $result['smtp_host'] ?? null,
    'smtp_port' => $result['smtp_port'] ?? null,
    'smtp_security' => $result['smtp_security'] ?? null,
    'real_send_performed' => ($result['real_send_performed'] ?? false) === true,
    'env_file' => $envFile,
    'loaded_keys' => $loaded['loaded_keys'] ?? [],
], ($result['ok'] ?? false) === true ? 0 : 1);
