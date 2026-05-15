<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';

const CPG_ADMIN_ACCESS_FLOW_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED';
const CPG_ADMIN_ACCESS_FLOW_LEGACY_ENV = 'CPG_ADMIN_ACCESS_FLOW_ENABLED';

function cpg_admin_access_bool_env(string $name): bool {
    $value = getenv($name);
    if (!is_string($value)) {
        return false;
    }

    return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
}

function cpg_admin_access_flow_enabled(): bool {
    return cpg_admin_access_bool_env(CPG_ADMIN_ACCESS_FLOW_ENV)
        || cpg_admin_access_bool_env(CPG_ADMIN_ACCESS_FLOW_LEGACY_ENV);
}

function cpg_admin_access_response(int $status, array $payload): array {
    return [
        'status' => $status,
        'payload' => $payload,
    ];
}

function cpg_admin_access_disabled_response(): array {
    return cpg_admin_access_response(503, [
        'ok' => false,
        'error' => 'admin_access_flow_not_enabled',
        'message' => 'Admin access email-code flow is not enabled yet',
    ]);
}

function cpg_admin_access_normalize_email(mixed $email): ?string {
    if (!is_string($email)) {
        return null;
    }

    $normalized = strtolower(trim($email));
    return filter_var($normalized, FILTER_VALIDATE_EMAIL) ? $normalized : null;
}

function cpg_admin_access_request_code_skeleton(
    array $body,
    ?bool $enabled = null,
    ?DateTimeImmutable $now = null
): array {
    if (($enabled ?? cpg_admin_access_flow_enabled()) !== true) {
        return cpg_admin_access_disabled_response();
    }

    $email = cpg_admin_access_normalize_email($body['email'] ?? null);
    if ($email === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_admin_email',
            'message' => 'A valid email is required',
        ]);
    }

    return cpg_admin_access_response(202, [
        'ok' => true,
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'masked_email' => cpg_admin_mask_email($email),
        'expires_in_seconds' => CPG_ADMIN_EMAIL_CODE_TTL_SECONDS,
        'code_length' => CPG_ADMIN_EMAIL_CODE_LENGTH,
        'delivery_status' => 'not_sent_skeleton',
        'storage_status' => 'not_stored_skeleton',
        'expires_at' => cpg_admin_email_code_expires_at($now),
        'message' => 'If the account is eligible, an admin access code will be sent when storage and email delivery are enabled.',
    ]);
}

function cpg_admin_access_verify_code_skeleton(array $body, ?bool $enabled = null): array {
    if (($enabled ?? cpg_admin_access_flow_enabled()) !== true) {
        return cpg_admin_access_disabled_response();
    }

    $email = cpg_admin_access_normalize_email($body['email'] ?? null);
    if ($email === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_admin_email',
            'message' => 'A valid email is required',
        ]);
    }

    $code = cpg_admin_normalize_email_code($body['code'] ?? null);
    if ($code === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_admin_code',
            'message' => 'A valid 6-digit code is required',
        ]);
    }

    return cpg_admin_access_response(501, [
        'ok' => false,
        'error' => 'admin_access_storage_not_configured',
        'message' => 'Admin email-code storage is not enabled yet',
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'masked_email' => cpg_admin_mask_email($email),
    ]);
}
