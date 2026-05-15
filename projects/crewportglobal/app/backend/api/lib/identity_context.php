<?php

declare(strict_types=1);

const CPG_IDENTITY_BOUNDARY_ANONYMOUS = 'anonymous';
const CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN = 'temporary_operator_token';
const CPG_IDENTITY_BOUNDARY_ACCOUNT_SESSION = 'account_session';
const CPG_IDENTITY_BOUNDARY_ADMIN_SESSION = 'admin_session';

function cpg_identity_normalize_uuid(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $uuid = strtolower(trim($value));
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuid) === 1
        ? $uuid
        : null;
}

function cpg_identity_normalize_email(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $email = strtolower(trim($value));
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
}

function cpg_identity_bool(mixed $value): bool {
    if (is_bool($value)) {
        return $value;
    }

    if (is_int($value)) {
        return $value === 1;
    }

    if (is_string($value)) {
        return in_array(strtolower(trim($value)), ['1', 't', 'true', 'yes'], true);
    }

    return false;
}

function cpg_identity_anonymous(): array {
    return [
        'boundary' => CPG_IDENTITY_BOUNDARY_ANONYMOUS,
        'user_id' => null,
        'email' => null,
        'actor_label' => 'anonymous',
        'is_authenticated_user' => false,
        'is_active_user' => false,
        'is_temporary_operator' => false,
        'is_admin_session' => false,
        'can_load_permissions' => false,
        'permission_mode' => 'none',
    ];
}

function cpg_identity_temporary_operator_token(string $actorLabel = 'temporary_operator_token'): array {
    return [
        'boundary' => CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN,
        'user_id' => null,
        'email' => null,
        'actor_label' => $actorLabel,
        'is_authenticated_user' => false,
        'is_active_user' => false,
        'is_temporary_operator' => true,
        'is_admin_session' => false,
        'can_load_permissions' => false,
        'permission_mode' => CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN,
    ];
}

function cpg_identity_account_session(array $userRow, string $boundary = CPG_IDENTITY_BOUNDARY_ACCOUNT_SESSION): ?array {
    $userId = cpg_identity_normalize_uuid($userRow['user_id'] ?? null);
    if ($userId === null) {
        return null;
    }

    $isAdminSession = $boundary === CPG_IDENTITY_BOUNDARY_ADMIN_SESSION;
    $isActiveUser = cpg_identity_bool($userRow['is_active'] ?? false);

    return [
        'boundary' => $isAdminSession ? CPG_IDENTITY_BOUNDARY_ADMIN_SESSION : CPG_IDENTITY_BOUNDARY_ACCOUNT_SESSION,
        'user_id' => $userId,
        'email' => cpg_identity_normalize_email($userRow['email'] ?? null),
        'actor_label' => $userId,
        'is_authenticated_user' => true,
        'is_active_user' => $isActiveUser,
        'is_temporary_operator' => false,
        'is_admin_session' => $isAdminSession,
        'can_load_permissions' => $isActiveUser,
        'permission_mode' => 'permission_check',
    ];
}

function cpg_identity_user_id(array $identity): ?string {
    return cpg_identity_normalize_uuid($identity['user_id'] ?? null);
}

function cpg_identity_can_load_permissions(array $identity): bool {
    return cpg_identity_user_id($identity) !== null
        && (($identity['can_load_permissions'] ?? false) === true);
}

function cpg_identity_permission_mode(array $identity): string {
    $mode = $identity['permission_mode'] ?? 'none';
    return is_string($mode) && $mode !== '' ? $mode : 'none';
}
