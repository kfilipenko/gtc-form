<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access_email_delivery.php';
require_once __DIR__ . '/bootstrap.php';

const CPG_REGISTRATION_PUBLIC_FLOW_ENABLED_ENV = 'CREWPORTGLOBAL_REGISTRATION_PUBLIC_FLOW_ENABLED';
const CPG_REGISTRATION_EMAIL_ENABLED_ENV = 'CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED';
const CPG_REGISTRATION_EMAIL_DELIVERY_MODE_ENV = 'CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE';
const CPG_REGISTRATION_SMTP_SEND_ENABLED_ENV = 'CREWPORTGLOBAL_REGISTRATION_SMTP_SEND_ENABLED';
const CPG_REGISTRATION_LINK_SECRET_ENV = 'CREWPORTGLOBAL_REGISTRATION_LINK_SECRET';
const CPG_REGISTRATION_PUBLIC_BASE_URL_ENV = 'CREWPORTGLOBAL_PUBLIC_BASE_URL';
const CPG_REGISTRATION_EMAIL_MODE_DISABLED = 'disabled';
const CPG_REGISTRATION_EMAIL_MODE_CAPTURE = 'capture';
const CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT = 'smtp_configured_but_not_sent';
const CPG_REGISTRATION_EMAIL_MODE_SMTP_READY = 'smtp_send_ready';
const CPG_REGISTRATION_LINK_TTL_SECONDS = 3600;

function cpg_registration_env_value(string $name, ?array $env = null): ?string {
    if (is_array($env) && array_key_exists($name, $env)) {
        $value = $env[$name];
        return is_string($value) ? trim($value) : null;
    }

    $value = getenv($name);
    return is_string($value) ? trim($value) : null;
}

function cpg_registration_bool_env(string $name, ?array $env = null): bool {
    $value = cpg_registration_env_value($name, $env);
    if ($value === null) {
        return false;
    }

    return in_array(strtolower($value), ['1', 'true', 'yes', 'on', 'enabled'], true);
}

function cpg_registration_public_flow_enabled(?array $env = null): bool {
    return cpg_registration_bool_env(CPG_REGISTRATION_PUBLIC_FLOW_ENABLED_ENV, $env);
}

function cpg_registration_email_enabled(?array $env = null): bool {
    return cpg_registration_bool_env(CPG_REGISTRATION_EMAIL_ENABLED_ENV, $env);
}

function cpg_registration_smtp_send_enabled(?array $env = null): bool {
    return cpg_registration_bool_env(CPG_REGISTRATION_SMTP_SEND_ENABLED_ENV, $env);
}

function cpg_registration_email_delivery_mode(?array $env = null): string {
    $value = cpg_registration_env_value(CPG_REGISTRATION_EMAIL_DELIVERY_MODE_ENV, $env);
    if ($value === null || $value === '') {
        return CPG_REGISTRATION_EMAIL_MODE_DISABLED;
    }

    $normalized = strtolower($value);
    if (in_array($normalized, ['0', 'false', 'off', 'none', 'disabled'], true)) {
        return CPG_REGISTRATION_EMAIL_MODE_DISABLED;
    }
    if (in_array($normalized, ['capture', 'test', 'test_capture'], true)) {
        return CPG_REGISTRATION_EMAIL_MODE_CAPTURE;
    }
    if (in_array($normalized, ['smtp_configured_but_not_sent', 'smtp_not_sent', 'smtp'], true)) {
        return CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT;
    }
    if (in_array($normalized, ['smtp_send_ready', 'smtp_ready'], true)) {
        return CPG_REGISTRATION_EMAIL_MODE_SMTP_READY;
    }

    return 'invalid';
}

function cpg_registration_email_delivery_status(?array $env = null): array {
    if (!cpg_registration_email_enabled($env)) {
        return [
            'ok' => false,
            'mode' => CPG_REGISTRATION_EMAIL_MODE_DISABLED,
            'code' => 'registration_email_delivery_disabled',
            'error' => 'registration_email_delivery_disabled',
        ];
    }

    $mode = cpg_registration_email_delivery_mode($env);
    if ($mode === CPG_REGISTRATION_EMAIL_MODE_CAPTURE) {
        return [
            'ok' => true,
            'mode' => CPG_REGISTRATION_EMAIL_MODE_CAPTURE,
            'code' => 'captured_test_only',
            'error' => null,
        ];
    }

    if ($mode === CPG_REGISTRATION_EMAIL_MODE_DISABLED) {
        $mode = CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT;
    }

    if (in_array($mode, [CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT, CPG_REGISTRATION_EMAIL_MODE_SMTP_READY], true)) {
        $config = cpg_admin_access_smtp_config($env);
        $missing = cpg_admin_access_smtp_config_missing_keys($config);
        if ($missing !== []) {
            return [
                'ok' => false,
                'mode' => CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT,
                'code' => 'registration_email_delivery_config_incomplete',
                'error' => 'registration_email_delivery_config_incomplete',
                'missing_config' => $missing,
                'smtp' => cpg_admin_access_smtp_config_safe_summary($config),
            ];
        }

        $sendReady = $mode === CPG_REGISTRATION_EMAIL_MODE_SMTP_READY && cpg_registration_smtp_send_enabled($env);
        return [
            'ok' => true,
            'mode' => $sendReady ? CPG_REGISTRATION_EMAIL_MODE_SMTP_READY : CPG_REGISTRATION_EMAIL_MODE_SMTP_NOT_SENT,
            'code' => $sendReady ? 'registration_email_delivery_message_ready' : 'registration_email_delivery_send_not_enabled',
            'error' => null,
            'smtp' => cpg_admin_access_smtp_config_safe_summary($config),
        ];
    }

    return [
        'ok' => false,
        'mode' => $mode,
        'code' => 'registration_email_delivery_mode_invalid',
        'error' => 'registration_email_delivery_mode_invalid',
    ];
}

function cpg_registration_link_secret(?array $env = null): ?string {
    $secret = cpg_registration_env_value(CPG_REGISTRATION_LINK_SECRET_ENV, $env);
    if ($secret === null || strlen($secret) < 32) {
        return null;
    }

    return $secret;
}

function cpg_registration_base64url_encode(string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function cpg_registration_base64url_decode(string $value): ?string {
    $normalized = strtr($value, '-_', '+/');
    $padding = strlen($normalized) % 4;
    if ($padding > 0) {
        $normalized .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode($normalized, true);
    return is_string($decoded) ? $decoded : null;
}

function cpg_registration_signing_payload(array $payload): string {
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('Unable to encode registration confirmation token');
    }

    return cpg_registration_base64url_encode($json);
}

function cpg_registration_create_confirmation_token(
    string $userId,
    string $email,
    int $now,
    string $secret
): string {
    $payload = [
        'purpose' => 'registration_email_confirmation',
        'uid' => $userId,
        'email' => strtolower($email),
        'exp' => $now + CPG_REGISTRATION_LINK_TTL_SECONDS,
        'nonce' => bin2hex(random_bytes(8)),
    ];
    $encodedPayload = cpg_registration_signing_payload($payload);
    $signature = cpg_registration_base64url_encode(hash_hmac('sha256', $encodedPayload, $secret, true));

    return $encodedPayload . '.' . $signature;
}

function cpg_registration_verify_confirmation_token(string $token, int $now, string $secret): array {
    $parts = explode('.', $token);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
        return ['ok' => false, 'error' => 'registration_confirmation_token_invalid'];
    }

    [$encodedPayload, $providedSignature] = $parts;
    $expectedSignature = cpg_registration_base64url_encode(hash_hmac('sha256', $encodedPayload, $secret, true));
    if (!hash_equals($expectedSignature, $providedSignature)) {
        return ['ok' => false, 'error' => 'registration_confirmation_token_invalid'];
    }

    $json = cpg_registration_base64url_decode($encodedPayload);
    $payload = is_string($json) ? json_decode($json, true) : null;
    if (!is_array($payload)) {
        return ['ok' => false, 'error' => 'registration_confirmation_token_invalid'];
    }

    if (($payload['purpose'] ?? null) !== 'registration_email_confirmation') {
        return ['ok' => false, 'error' => 'registration_confirmation_token_invalid'];
    }

    $expiresAt = $payload['exp'] ?? null;
    if (!is_int($expiresAt) || $expiresAt < $now) {
        return ['ok' => false, 'error' => 'registration_confirmation_token_expired'];
    }

    $userId = api_normalize_uuid($payload['uid'] ?? null);
    $email = api_normalize_email($payload['email'] ?? null);
    if ($userId === null || $email === null) {
        return ['ok' => false, 'error' => 'registration_confirmation_token_invalid'];
    }

    return [
        'ok' => true,
        'user_id' => $userId,
        'email' => $email,
        'expires_at' => gmdate('c', $expiresAt),
    ];
}

function cpg_registration_public_base_url(?array $env = null): string {
    $configured = cpg_registration_env_value(CPG_REGISTRATION_PUBLIC_BASE_URL_ENV, $env);
    if (is_string($configured) && preg_match('#^https?://[A-Za-z0-9.-]+(?::[0-9]+)?$#', $configured) === 1) {
        return rtrim($configured, '/');
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'crewportglobal.com';
    if (!is_string($host) || preg_match('/^[A-Za-z0-9.-]+(?::[0-9]+)?$/', $host) !== 1) {
        $host = 'crewportglobal.com';
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null;
    $https = $_SERVER['HTTPS'] ?? null;
    $scheme = $forwardedProto === 'https' || ($https !== null && strtolower((string) $https) !== 'off') ? 'https' : 'http';

    return $scheme . '://' . $host;
}

function cpg_registration_confirmation_url(string $token, ?array $env = null): string {
    return cpg_registration_public_base_url($env) . '/register/confirm/?token=' . rawurlencode($token);
}

function cpg_registration_email_message(string $to, string $confirmationUrl, string $expiresAt): array {
    return [
        'to' => strtolower($to),
        'subject' => 'CrewPortGlobal registration link',
        'body_text' => "Open this link to continue CrewPortGlobal registration:\n\n"
            . $confirmationUrl
            . "\n\nThis link expires in 60 minutes.\n"
            . "If you did not request this registration, ignore this message.\n",
        'expires_at' => $expiresAt,
    ];
}

function cpg_registration_send_email_message(array $message, ?array $env = null): array {
    $status = cpg_registration_email_delivery_status($env);
    if (($status['ok'] ?? false) !== true) {
        return [
            'ok' => false,
            'delivery_status' => $status['code'] ?? 'registration_email_delivery_disabled',
            'error' => $status['error'] ?? 'registration_email_delivery_disabled',
            'missing_config' => $status['missing_config'] ?? [],
        ];
    }

    $to = api_normalize_email($message['to'] ?? null);
    $subject = isset($message['subject']) && is_string($message['subject']) ? trim($message['subject']) : '';
    $bodyText = isset($message['body_text']) && is_string($message['body_text']) ? $message['body_text'] : '';
    $expiresAt = isset($message['expires_at']) && is_string($message['expires_at']) ? trim($message['expires_at']) : '';
    if ($to === null || $subject === '' || trim($bodyText) === '' || $expiresAt === '') {
        return [
            'ok' => false,
            'delivery_status' => 'registration_email_message_invalid',
            'error' => 'registration_email_message_invalid',
        ];
    }

    if (($status['mode'] ?? null) === CPG_REGISTRATION_EMAIL_MODE_CAPTURE) {
        return [
            'ok' => true,
            'delivery_status' => 'captured_test_only',
            'masked_to' => cpg_admin_mask_email($to),
            'expires_at' => $expiresAt,
            'real_send_performed' => false,
        ];
    }

    $config = cpg_admin_access_smtp_config($env);
    $safeConfig = cpg_admin_access_smtp_config_safe_summary($config);
    $prepared = [
        'envelope' => [
            'from_email' => (string) ($safeConfig['from_email'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_EMAIL),
            'from_name' => (string) ($safeConfig['from_name'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_NAME),
            'to' => $to,
            'subject' => $subject,
        ],
        'headers' => [
            'From' => sprintf(
                '%s <%s>',
                (string) ($safeConfig['from_name'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_NAME),
                (string) ($safeConfig['from_email'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_EMAIL)
            ),
            'To' => $to,
            'Subject' => $subject,
            'Content-Type' => 'text/plain; charset=UTF-8',
        ],
        'body_text' => $bodyText,
        'expires_at' => $expiresAt,
    ];

    if (($status['mode'] ?? null) !== CPG_REGISTRATION_EMAIL_MODE_SMTP_READY) {
        return [
            'ok' => true,
            'delivery_status' => 'registration_email_delivery_send_not_enabled',
            'masked_to' => cpg_admin_mask_email($to),
            'expires_at' => $expiresAt,
            'real_send_performed' => false,
        ];
    }

    try {
        $messageId = cpg_admin_access_smtp_send_prepared_message($prepared, $config);
        return [
            'ok' => true,
            'delivery_status' => 'registration_email_delivery_sent',
            'masked_to' => cpg_admin_mask_email($to),
            'expires_at' => $expiresAt,
            'message_id' => $messageId,
            'real_send_performed' => true,
        ];
    } catch (Throwable) {
        return [
            'ok' => false,
            'delivery_status' => 'registration_email_delivery_failed',
            'error' => 'registration_email_delivery_failed',
            'masked_to' => cpg_admin_mask_email($to),
            'expires_at' => $expiresAt,
            'real_send_performed' => false,
        ];
    }
}
