<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';
require_once __DIR__ . '/admin_access_email_delivery.php';
require_once __DIR__ . '/admin_access_storage.php';

const CPG_ADMIN_ACCESS_FLOW_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED';
const CPG_ADMIN_ACCESS_FLOW_LEGACY_ENV = 'CPG_ADMIN_ACCESS_FLOW_ENABLED';
const CPG_ADMIN_ACCESS_OWNER_GROUP = 'owners';
const CPG_ADMIN_ACCESS_PLATFORM_ADMIN_GROUP = 'platform_administrators';
const CPG_ADMIN_ACCESS_TEAM_GROUP = 'cpg_team';
const CPG_ADMIN_ACCESS_REQUIRED_PERMISSION = 'view_admin_console';
const CPG_ADMIN_ACCESS_MANAGE_GROUPS_PERMISSION = 'manage_user_groups';
const CPG_ADMIN_ACCESS_ASSIGNABLE_GROUP_TYPES = ['internal', 'administration'];
const CPG_ADMIN_ACCESS_UNASSIGNABLE_GROUPS = [
    'public_visitors',
    'registered_users',
    'registered_seafarers',
    'registered_employers',
    'platform_owners',
    'ai_assistants',
];
const CPG_ADMIN_ACCESS_TEAM_LINKS = [
    [
        'label' => 'CrewPortGlobal public site',
        'url' => 'https://crewportglobal.com/',
    ],
    [
        'label' => 'Register',
        'url' => 'https://crewportglobal.com/register/',
    ],
    [
        'label' => 'Create Profile',
        'url' => 'https://crewportglobal.com/create-profile/',
    ],
    [
        'label' => 'Post Vacancy',
        'url' => 'https://crewportglobal.com/post-vacancy/',
    ],
    [
        'label' => 'Operator Queue',
        'url' => 'https://crewportglobal.com/verify/',
    ],
    [
        'label' => 'GitHub repository',
        'url' => 'https://github.com/kfilipenko/gtc-form',
    ],
    [
        'label' => 'Main implementation issue',
        'url' => 'https://github.com/kfilipenko/gtc-form/issues/8',
    ],
];

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

function cpg_admin_access_normalize_session_token(mixed $token): ?string {
    if (!is_string($token)) {
        return null;
    }

    $normalized = strtolower(trim($token));
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $normalized) === 1
        ? $normalized
        : null;
}

function cpg_admin_access_normalize_display_name(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $normalized = trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    if ($normalized === '') {
        return null;
    }

    return mb_substr($normalized, 0, 160);
}

function cpg_admin_access_normalize_group_code(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $normalized = strtolower(trim($value));
    return preg_match('/^[a-z0-9_]{2,80}$/', $normalized) === 1 ? $normalized : null;
}

function cpg_admin_access_normalize_reason(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $normalized = trim(preg_replace('/\s+/', ' ', $value) ?? $value);
    if ($normalized === '') {
        return null;
    }

    return mb_substr($normalized, 0, 500);
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

function cpg_admin_access_role_status(array $session): string {
    $roles = cpg_admin_access_string_list($session['roles'] ?? []);
    if (in_array('project_owner', $roles, true)) {
        return 'Project Owner';
    }

    if (in_array('platform_administrator', $roles, true)) {
        return 'Platform Administrator';
    }

    return 'Admin user';
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

    $groups = cpg_admin_access_string_list($user['groups'] ?? ($user['group_codes'] ?? []));
    if (array_intersect($groups, [CPG_ADMIN_ACCESS_OWNER_GROUP, CPG_ADMIN_ACCESS_PLATFORM_ADMIN_GROUP]) === []) {
        return false;
    }

    $permissions = cpg_admin_access_string_list($user['permissions'] ?? []);
    if (in_array(CPG_ADMIN_ACCESS_REQUIRED_PERMISSION, $permissions, true)) {
        return true;
    }

    $roles = cpg_admin_access_string_list($user['roles'] ?? ($user['role_codes'] ?? []));
    return array_intersect($roles, ['platform_administrator', 'project_owner']) !== [];
}

function cpg_admin_access_user_can_view_team_links(array $user): bool {
    if (cpg_admin_access_user_id($user) === null || !cpg_admin_access_user_is_active($user)) {
        return false;
    }

    $groups = cpg_admin_access_string_list($user['groups'] ?? ($user['group_codes'] ?? []));
    return array_intersect($groups, [CPG_ADMIN_ACCESS_OWNER_GROUP, CPG_ADMIN_ACCESS_TEAM_GROUP]) !== [];
}

function cpg_admin_access_user_can_receive_protected_code(array $user): bool {
    return cpg_admin_access_user_can_receive_admin_code($user)
        || cpg_admin_access_user_can_view_team_links($user);
}

function cpg_admin_access_user_can_manage_group_members(array $user): bool {
    if (cpg_admin_access_user_id($user) === null || !cpg_admin_access_user_is_active($user)) {
        return false;
    }

    $groups = cpg_admin_access_string_list($user['groups'] ?? ($user['group_codes'] ?? []));
    if (!in_array(CPG_ADMIN_ACCESS_OWNER_GROUP, $groups, true)) {
        return false;
    }

    $permissions = cpg_admin_access_string_list($user['permissions'] ?? []);
    if (in_array(CPG_ADMIN_ACCESS_MANAGE_GROUPS_PERMISSION, $permissions, true)) {
        return true;
    }

    $roles = cpg_admin_access_string_list($user['roles'] ?? ($user['role_codes'] ?? []));
    return in_array('project_owner', $roles, true);
}

function cpg_admin_access_group_is_assignable(array $group): bool {
    $groupCode = cpg_admin_access_normalize_group_code($group['group_code'] ?? null);
    if ($groupCode === null || in_array($groupCode, CPG_ADMIN_ACCESS_UNASSIGNABLE_GROUPS, true)) {
        return false;
    }

    if (!cpg_admin_access_storage_normalize_bool($group['is_active'] ?? true, true)) {
        return false;
    }

    $groupType = strtolower(trim((string) ($group['group_type'] ?? '')));
    return in_array($groupType, CPG_ADMIN_ACCESS_ASSIGNABLE_GROUP_TYPES, true);
}

function cpg_admin_access_management_session(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null
): array {
    $normalizedToken = cpg_admin_access_normalize_session_token($sessionToken);
    if ($normalizedToken === null) {
        return [
            null,
            cpg_admin_access_response(401, [
                'ok' => false,
                'error' => 'admin_session_required',
                'message' => 'Admin session is required',
            ]),
        ];
    }

    $base = $now ?? cpg_admin_now();
    $session = $storage->findActiveAdminSession($normalizedToken, $base);
    if (!is_array($session)) {
        return [
            null,
            cpg_admin_access_response(401, [
                'ok' => false,
                'error' => 'admin_session_invalid',
                'message' => 'Admin session is invalid or expired',
            ]),
        ];
    }

    if (!cpg_admin_access_user_can_manage_group_members($session)) {
        return [
            null,
            cpg_admin_access_response(403, [
                'ok' => false,
                'error' => 'manage_user_groups_required',
                'message' => 'Managing users and group memberships requires owners group membership',
            ]),
        ];
    }

    return [$session, null];
}

function cpg_admin_access_assignable_groups(array $snapshot): array {
    return array_values(array_filter(
        is_array($snapshot['groups'] ?? null) ? $snapshot['groups'] : [],
        'cpg_admin_access_group_is_assignable'
    ));
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
    $canReceiveCode = is_array($user) && cpg_admin_access_user_can_receive_protected_code($user);
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
    $canReceiveCode = is_array($user) && cpg_admin_access_user_can_receive_protected_code($user);
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
    if (!is_array($user) || !cpg_admin_access_user_can_receive_protected_code($user)) {
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
    $session = $storage->createAdminSession([
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
        'admin_session_token' => (string) ($session['admin_session_id'] ?? ''),
        'admin_session_expires_at' => $sessionExpiresAt,
    ]);
}

function cpg_admin_access_session_summary_with_storage(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null,
    int $auditLimit = 10
): array {
    $normalizedToken = cpg_admin_access_normalize_session_token($sessionToken);
    if ($normalizedToken === null) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'admin_session_required',
            'message' => 'Admin session is required',
        ]);
    }

    $base = $now ?? cpg_admin_now();
    $session = $storage->findActiveAdminSession($normalizedToken, $base);
    if (!is_array($session) || !cpg_admin_access_user_can_receive_admin_code($session)) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'admin_session_invalid',
            'message' => 'Admin session is invalid or expired',
        ]);
    }

    $groups = cpg_admin_access_string_list($session['groups'] ?? []);
    $roles = cpg_admin_access_string_list($session['roles'] ?? []);
    $permissions = cpg_admin_access_string_list($session['permissions'] ?? []);
    sort($groups);
    sort($roles);
    sort($permissions);

    return cpg_admin_access_response(200, [
        'ok' => true,
        'user' => [
            'user_id' => (string) ($session['user_id'] ?? ''),
            'email' => (string) ($session['email'] ?? ''),
            'status' => cpg_admin_access_role_status($session),
            'is_active' => cpg_admin_access_user_is_active($session),
        ],
        'admin_session' => [
            'created_at' => (string) ($session['created_at'] ?? ''),
            'expires_at' => (string) ($session['expires_at'] ?? ''),
            'last_used_at' => $session['last_used_at'] ?? null,
        ],
        'groups' => $groups,
        'roles' => $roles,
        'effective_permissions' => $permissions,
        'recent_access_audit_events' => $storage->readRecentAccessAuditEvents($auditLimit),
        'notice' => 'Group and role management will be implemented in the next phase.',
    ]);
}

function cpg_admin_access_management_snapshot_with_storage(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null
): array {
    [$session, $error] = cpg_admin_access_management_session($storage, $sessionToken, $now);
    if ($error !== null) {
        return $error;
    }

    $snapshot = $storage->readAccessManagementSnapshot();
    $assignableGroups = cpg_admin_access_assignable_groups($snapshot);

    return cpg_admin_access_response(200, [
        'ok' => true,
        'current_user' => [
            'user_id' => (string) ($session['user_id'] ?? ''),
            'email' => (string) ($session['email'] ?? ''),
            'groups' => cpg_admin_access_string_list($session['groups'] ?? []),
        ],
        'users' => is_array($snapshot['users'] ?? null) ? $snapshot['users'] : [],
        'groups' => is_array($snapshot['groups'] ?? null) ? $snapshot['groups'] : [],
        'assignable_groups' => $assignableGroups,
        'allowed_actions' => [
            'create_user',
            'add_user_to_group',
        ],
        'notice' => 'This phase allows user creation and group membership assignment only.',
    ]);
}

function cpg_admin_access_create_user_with_storage(
    array $body,
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null,
    array $metadata = []
): array {
    [$session, $error] = cpg_admin_access_management_session($storage, $sessionToken, $now);
    if ($error !== null) {
        return $error;
    }

    $email = cpg_admin_access_normalize_email($body['email'] ?? null);
    if ($email === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_user_email',
            'message' => 'A valid user email is required',
        ]);
    }

    $displayName = cpg_admin_access_normalize_display_name($body['display_name'] ?? $body['name'] ?? null);
    $base = $now ?? cpg_admin_now();
    $user = $storage->createAccessUser([
        'email' => $email,
        'display_name' => $displayName,
        'registration_status' => 'draft',
    ]);
    if ($user === []) {
        return cpg_admin_access_response(500, [
            'ok' => false,
            'error' => 'admin_user_create_failed',
            'message' => 'Unable to create or confirm user',
        ]);
    }

    $storage->writeAdminAccessAuditEvent([
        'actor_user_id' => (string) ($session['user_id'] ?? ''),
        'event_type' => ($user['created'] ?? false) ? 'admin_user_created' : 'admin_user_confirmed',
        'target_user_id' => (string) ($user['user_id'] ?? ''),
        'new_value' => [
            'email' => cpg_admin_mask_email($email),
            'display_name_present' => $displayName !== null,
            'created' => (bool) ($user['created'] ?? false),
        ],
        'reason' => cpg_admin_access_normalize_reason($body['reason'] ?? null),
        'ip_address' => $metadata['ip_address'] ?? null,
        'user_agent' => $metadata['user_agent'] ?? null,
        'created_at' => cpg_admin_format_time($base),
    ]);

    return cpg_admin_access_response(($user['created'] ?? false) ? 201 : 200, [
        'ok' => true,
        'user' => [
            'user_id' => (string) ($user['user_id'] ?? ''),
            'email' => (string) ($user['email'] ?? $email),
            'display_name' => $user['display_name'] ?? null,
            'registration_status' => (string) ($user['registration_status'] ?? 'draft'),
            'is_active' => cpg_admin_access_storage_normalize_bool($user['is_active'] ?? true, true),
            'created' => (bool) ($user['created'] ?? false),
        ],
    ]);
}

function cpg_admin_access_add_group_member_with_storage(
    array $body,
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null,
    array $metadata = []
): array {
    [$session, $error] = cpg_admin_access_management_session($storage, $sessionToken, $now);
    if ($error !== null) {
        return $error;
    }

    $email = cpg_admin_access_normalize_email($body['email'] ?? null);
    if ($email === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_user_email',
            'message' => 'A valid user email is required',
        ]);
    }

    $groupCode = cpg_admin_access_normalize_group_code($body['group_code'] ?? null);
    if ($groupCode === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_group_code',
            'message' => 'A valid group_code is required',
        ]);
    }

    $snapshot = $storage->readAccessManagementSnapshot();
    $assignableGroups = cpg_admin_access_assignable_groups($snapshot);
    $targetGroup = null;
    foreach ($assignableGroups as $group) {
        if (($group['group_code'] ?? null) === $groupCode) {
            $targetGroup = $group;
            break;
        }
    }

    if ($targetGroup === null) {
        return cpg_admin_access_response(403, [
            'ok' => false,
            'error' => 'group_not_assignable',
            'message' => 'This group cannot be assigned through the current console phase',
        ]);
    }

    $reason = cpg_admin_access_normalize_reason($body['reason'] ?? null)
        ?? 'Project Owner group membership assignment.';
    $base = $now ?? cpg_admin_now();
    $membership = $storage->addAccessGroupMember([
        'email' => $email,
        'group_code' => $groupCode,
        'granted_by_user_id' => (string) ($session['user_id'] ?? ''),
        'reason' => $reason,
    ]);

    if ($membership === []) {
        return cpg_admin_access_response(404, [
            'ok' => false,
            'error' => 'user_or_group_not_found',
            'message' => 'User or group was not found',
        ]);
    }

    $storage->writeAdminAccessAuditEvent([
        'actor_user_id' => (string) ($session['user_id'] ?? ''),
        'event_type' => ($membership['created'] ?? false) ? 'admin_group_member_added' : 'admin_group_member_confirmed',
        'target_user_id' => (string) ($membership['user_id'] ?? ''),
        'target_group_id' => (string) ($membership['group_id'] ?? ''),
        'new_value' => [
            'email' => cpg_admin_mask_email($email),
            'group_code' => $groupCode,
            'created' => (bool) ($membership['created'] ?? false),
        ],
        'reason' => $reason,
        'ip_address' => $metadata['ip_address'] ?? null,
        'user_agent' => $metadata['user_agent'] ?? null,
        'created_at' => cpg_admin_format_time($base),
    ]);

    return cpg_admin_access_response(($membership['created'] ?? false) ? 201 : 200, [
        'ok' => true,
        'membership' => [
            'group_member_id' => (string) ($membership['group_member_id'] ?? ''),
            'user_id' => (string) ($membership['user_id'] ?? ''),
            'email' => (string) ($membership['email'] ?? $email),
            'group_id' => (string) ($membership['group_id'] ?? ''),
            'group_code' => (string) ($membership['group_code'] ?? $groupCode),
            'membership_state' => (string) ($membership['membership_state'] ?? 'active'),
            'created' => (bool) ($membership['created'] ?? false),
        ],
    ]);
}

function cpg_admin_access_revoke_session_with_storage(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null,
    array $metadata = []
): array {
    $normalizedToken = cpg_admin_access_normalize_session_token($sessionToken);
    if ($normalizedToken === null) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'admin_session_required',
            'message' => 'Admin session is required',
        ]);
    }

    $base = $now ?? cpg_admin_now();
    $session = $storage->findActiveAdminSession($normalizedToken, $base);
    if (!is_array($session)) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'admin_session_invalid',
            'message' => 'Admin session is invalid or expired',
        ]);
    }

    $revoked = $storage->revokeAdminSession($normalizedToken, $base);
    if (!is_array($revoked)) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'admin_session_invalid',
            'message' => 'Admin session is invalid or expired',
        ]);
    }

    $storage->writeAdminAccessAuditEvent([
        'actor_user_id' => (string) ($session['user_id'] ?? ''),
        'event_type' => 'admin_session_revoked',
        'new_value' => [
            'masked_email' => cpg_admin_mask_email((string) ($session['email'] ?? '')),
            'revoked_at' => cpg_admin_format_time($base),
        ],
        'ip_address' => $metadata['ip_address'] ?? null,
        'user_agent' => $metadata['user_agent'] ?? null,
        'created_at' => cpg_admin_format_time($base),
    ]);

    return cpg_admin_access_response(200, [
        'ok' => true,
        'revoked_at' => cpg_admin_format_time($base),
    ]);
}

function cpg_admin_access_team_links_with_storage(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null
): array {
    $normalizedToken = cpg_admin_access_normalize_session_token($sessionToken);
    if ($normalizedToken === null) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'team_session_required',
            'message' => 'Team session is required',
        ]);
    }

    $base = $now ?? cpg_admin_now();
    $session = $storage->findActiveAdminSession($normalizedToken, $base);
    if (!is_array($session)) {
        return cpg_admin_access_response(401, [
            'ok' => false,
            'error' => 'team_session_invalid',
            'message' => 'Team session is invalid or expired',
        ]);
    }

    if (!cpg_admin_access_user_can_view_team_links($session)) {
        return cpg_admin_access_response(403, [
            'ok' => false,
            'error' => 'team_access_group_required',
            'message' => 'Team links require owners or cpg_team group membership',
        ]);
    }

    $groups = cpg_admin_access_string_list($session['groups'] ?? []);
    sort($groups);

    return cpg_admin_access_response(200, [
        'ok' => true,
        'user' => [
            'user_id' => (string) ($session['user_id'] ?? ''),
            'email' => (string) ($session['email'] ?? ''),
            'groups' => $groups,
        ],
        'access_model' => [
            'mode' => 'group_membership',
            'allowed_groups' => [CPG_ADMIN_ACCESS_OWNER_GROUP, CPG_ADMIN_ACCESS_TEAM_GROUP],
        ],
        'links' => CPG_ADMIN_ACCESS_TEAM_LINKS,
    ]);
}
