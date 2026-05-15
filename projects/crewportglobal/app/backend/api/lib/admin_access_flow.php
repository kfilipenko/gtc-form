<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';
require_once __DIR__ . '/admin_access_email_delivery.php';
require_once __DIR__ . '/admin_access_storage.php';

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

function cpg_admin_access_string_list(mixed $value): array {
    if (is_array($value)) {
        return array_values(array_filter(array_map(
            static fn (mixed $item): string => strtolower(trim((string) $item)),
            $value
        )));
    }

    if (is_string($value)) {
        return array_values(array_filter(array_map(
            static fn (string $item): string => strtolower(trim($item)),
            preg_split('/[,;\s]+/', $value) ?: []
        )));
    }

    return [];
}

function cpg_admin_access_user_is_active(array $user): bool {
    return cpg_admin_access_storage_normalize_bool($user['is_active'] ?? true, true)
        && cpg_admin_access_storage_normalize_bool($user['account_enabled'] ?? true, true);
}

function cpg_admin_access_user_id(array $user): ?string {
    if (!isset($user['user_id']) || !is_string($user['user_id'])) {
        return null;
    }

    $userId = trim($user['user_id']);
    return $userId === '' ? null : $userId;
}

function cpg_admin_access_user_can_receive_admin_code(array $user): bool {
    if (cpg_admin_access_user_id($user) === null || !cpg_admin_access_user_is_active($user)) {
        return false;
    }

    $permissions = cpg_admin_access_string_list($user['permissions'] ?? []);
    if (in_array('view_admin_console', $permissions, true)) {
        return true;
    }

    $roles = cpg_admin_access_string_list($user['roles'] ?? ($user['role_codes'] ?? []));
    if (array_intersect($roles, ['platform_administrator', 'project_owner']) !== []) {
        return true;
    }

    $groups = cpg_admin_access_string_list($user['groups'] ?? ($user['group_codes'] ?? []));
    return array_intersect($groups, ['platform_administrators', 'platform_owners']) !== [];
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

function cpg_admin_access_request_code_with_storage(
    array $body,
    CpgAdminAccessStorage $storage,
    ?bool $enabled = null,
    ?DateTimeImmutable $now = null,
    array $metadata = [],
    ?callable $codeGenerator = null
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

    $base = $now ?? cpg_admin_now();
    $maskedEmail = cpg_admin_mask_email($email);
    $user = $storage->findAdminUserByEmail($email);
    $canReceiveCode = is_array($user) && cpg_admin_access_user_can_receive_admin_code($user);
    $userId = is_array($user) ? cpg_admin_access_user_id($user) : null;

    if ($canReceiveCode) {
        $code = (string) (($codeGenerator ?? 'cpg_admin_generate_email_code')());
        $codeHash = cpg_admin_hash_email_code($code);
        $expiresAt = cpg_admin_email_code_expires_at($base);

        $storage->storeAdminEmailCode([
            'user_id' => (string) $userId,
            'code_hash' => $codeHash,
            'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
            'expires_at' => $expiresAt,
            'attempt_count' => 0,
            'created_at' => cpg_admin_format_time($base),
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
        ]);

        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => (string) $userId,
            'event_type' => 'admin_email_code_requested',
            'new_value' => [
                'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
                'masked_email' => $maskedEmail,
                'expires_at' => $expiresAt,
            ],
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);
    } else {
        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => $userId,
            'event_type' => 'admin_email_code_request_rejected',
            'new_value' => [
                'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
                'masked_email' => $maskedEmail,
            ],
            'reason' => 'admin_access_not_eligible',
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);
    }

    return cpg_admin_access_response(202, [
        'ok' => true,
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'masked_email' => $maskedEmail,
        'expires_in_seconds' => CPG_ADMIN_EMAIL_CODE_TTL_SECONDS,
        'code_length' => CPG_ADMIN_EMAIL_CODE_LENGTH,
        'delivery_status' => 'not_sent_storage_adapter',
        'storage_status' => 'handled_by_storage_adapter',
        'message' => 'If the account is eligible, an admin access code will be prepared for email delivery.',
    ]);
}

function cpg_admin_access_request_code_with_storage_and_delivery(
    array $body,
    CpgAdminAccessStorage $storage,
    CpgAdminAccessEmailDelivery $delivery,
    ?bool $enabled = null,
    ?DateTimeImmutable $now = null,
    array $metadata = [],
    ?callable $codeGenerator = null
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

    $base = $now ?? cpg_admin_now();
    $maskedEmail = cpg_admin_mask_email($email);
    $user = $storage->findAdminUserByEmail($email);
    $canReceiveCode = is_array($user) && cpg_admin_access_user_can_receive_admin_code($user);
    $userId = is_array($user) ? cpg_admin_access_user_id($user) : null;
    $deliveryStatus = 'not_sent_not_eligible';

    if ($canReceiveCode) {
        $code = (string) (($codeGenerator ?? 'cpg_admin_generate_email_code')());
        $codeHash = cpg_admin_hash_email_code($code);
        $expiresAt = cpg_admin_email_code_expires_at($base);

        $storage->storeAdminEmailCode([
            'user_id' => (string) $userId,
            'code_hash' => $codeHash,
            'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
            'expires_at' => $expiresAt,
            'attempt_count' => 0,
            'created_at' => cpg_admin_format_time($base),
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
        ]);

        $deliveryResult = $delivery->sendAdminEmailCode(cpg_admin_email_code_message($email, $code, $base));
        $deliveryStatus = (string) ($deliveryResult['delivery_status'] ?? 'admin_email_delivery_unknown');

        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => (string) $userId,
            'event_type' => 'admin_email_code_requested',
            'new_value' => [
                'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
                'masked_email' => $maskedEmail,
                'expires_at' => $expiresAt,
                'delivery_status' => $deliveryStatus,
            ],
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);
    } else {
        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => $userId,
            'event_type' => 'admin_email_code_request_rejected',
            'new_value' => [
                'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
                'masked_email' => $maskedEmail,
            ],
            'reason' => 'admin_access_not_eligible',
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);
    }

    return cpg_admin_access_response(202, [
        'ok' => true,
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'masked_email' => $maskedEmail,
        'expires_in_seconds' => CPG_ADMIN_EMAIL_CODE_TTL_SECONDS,
        'code_length' => CPG_ADMIN_EMAIL_CODE_LENGTH,
        'delivery_status' => $canReceiveCode ? $deliveryStatus : 'handled_if_eligible',
        'storage_status' => $canReceiveCode ? 'stored_hash_only' : 'handled_if_eligible',
        'message' => 'If the account is eligible, an admin access code has been sent.',
    ]);
}

function cpg_admin_access_verify_code_with_storage(
    array $body,
    CpgAdminAccessStorage $storage,
    ?bool $enabled = null,
    ?DateTimeImmutable $now = null,
    array $metadata = []
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

    $code = cpg_admin_normalize_email_code($body['code'] ?? null);
    if ($code === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_admin_code',
            'message' => 'A valid 6-digit code is required',
        ]);
    }

    $base = $now ?? cpg_admin_now();
    $user = $storage->findAdminUserByEmail($email);
    $userId = is_array($user) ? cpg_admin_access_user_id($user) : null;
    if (!is_array($user) || !cpg_admin_access_user_can_receive_admin_code($user)) {
        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => $userId,
            'event_type' => 'admin_email_code_verify_rejected',
            'reason' => 'admin_access_not_eligible',
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);

        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'invalid_admin_code',
            'message' => 'Invalid or expired admin access code',
        ]);
    }

    $record = $storage->findPendingAdminEmailCode($userId, CPG_ADMIN_ACCESS_PURPOSE, $base);
    if ($record === null) {
        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => $userId,
            'event_type' => 'admin_email_code_verify_rejected',
            'reason' => 'admin_email_code_not_found',
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);

        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'invalid_admin_code',
            'message' => 'Invalid or expired admin access code',
        ]);
    }

    $attemptCount = (int) ($record['attempt_count'] ?? 0);
    $adminEmailCodeId = (string) $record['admin_email_code_id'];
    if (!cpg_admin_can_verify_email_code($attemptCount, $record['expires_at'] ?? null, $base)) {
        return cpg_admin_access_response(429, [
            'ok' => false,
            'error' => 'admin_email_code_attempts_exceeded',
            'message' => 'Admin access code verification attempts exceeded',
        ]);
    }

    if (!cpg_admin_verify_email_code($code, (string) ($record['code_hash'] ?? ''))) {
        $updated = $storage->incrementAdminEmailCodeAttempts($adminEmailCodeId);
        $storage->writeAdminAccessAuditEvent([
            'actor_user_id' => $userId,
            'event_type' => 'admin_email_code_verify_failed',
            'new_value' => [
                'attempt_count' => (int) ($updated['attempt_count'] ?? 0),
                'attempts_remaining' => cpg_admin_attempts_remaining((int) ($updated['attempt_count'] ?? 0)),
            ],
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'created_at' => cpg_admin_format_time($base),
        ]);

        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'invalid_admin_code',
            'message' => 'Invalid or expired admin access code',
            'attempts_remaining' => cpg_admin_attempts_remaining((int) ($updated['attempt_count'] ?? 0)),
        ]);
    }

    $storage->markAdminEmailCodeUsed($adminEmailCodeId, $base);
    $sessionExpiresAt = cpg_admin_session_expires_at($base);
    $storage->createAdminSession([
        'user_id' => $userId,
        'created_at' => cpg_admin_format_time($base),
        'expires_at' => $sessionExpiresAt,
        'ip_address' => $metadata['ip_address'] ?? null,
        'user_agent' => $metadata['user_agent'] ?? null,
    ]);
    $storage->writeAdminAccessAuditEvent([
        'actor_user_id' => $userId,
        'event_type' => 'admin_email_code_verified',
        'new_value' => [
            'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
            'admin_session_expires_at' => $sessionExpiresAt,
        ],
        'ip_address' => $metadata['ip_address'] ?? null,
        'user_agent' => $metadata['user_agent'] ?? null,
        'created_at' => cpg_admin_format_time($base),
    ]);

    return cpg_admin_access_response(200, [
        'ok' => true,
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'admin_session_expires_at' => $sessionExpiresAt,
    ]);
}
