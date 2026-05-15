<?php

declare(strict_types=1);

const CPG_ACCESS_SCOPES = [
    'public',
    'own',
    'company',
    'assigned',
    'queue',
    'all_operational',
    'system',
];

const CPG_OPERATOR_QUEUE_VIEW_PERMISSIONS = [
    'seafarer_profile' => 'view_verification_queue',
    'company_verification' => 'view_verification_queue',
    'vacancy_request' => 'view_review_queue',
    'vacancy_application' => 'view_review_queue',
];

const CPG_OPERATOR_QUEUE_ACTION_PERMISSIONS = [
    'seafarer_profile' => [
        'start_review' => 'start_human_review',
        'needs_correction' => 'return_profile_for_correction',
        'reviewed' => 'approve_seafarer_profile',
    ],
    'company_verification' => [
        'start_review' => 'mark_document_under_review',
        'needs_correction' => 'request_document_correction',
        'reviewed' => 'approve_company_profile',
    ],
    'vacancy_request' => [
        'start_review' => 'start_human_review',
        'needs_correction' => 'create_review_note',
        'reviewed' => 'approve_vacancy_request',
    ],
    'vacancy_application' => [
        'start_review' => 'start_human_review',
        'needs_correction' => 'create_review_note',
        'reviewed' => 'approve_candidate_presentation',
    ],
];

function cpg_access_normalize_scope(mixed $scope): ?string {
    if (!is_string($scope)) {
        return null;
    }

    $normalized = trim($scope);
    return in_array($normalized, CPG_ACCESS_SCOPES, true) ? $normalized : null;
}

function cpg_access_scope_allows(string $grantedScope, string $requiredScope): bool {
    if ($grantedScope === $requiredScope) {
        return true;
    }

    if ($grantedScope === 'all_operational') {
        return in_array($requiredScope, ['assigned', 'queue', 'all_operational'], true);
    }

    return false;
}

function cpg_access_permission_allows(array $permission, string $permissionCode, string $requiredScope): bool {
    $grantedCode = $permission['permission_code'] ?? null;
    $grantedScope = cpg_access_normalize_scope($permission['scope'] ?? null);
    $normalizedRequiredScope = cpg_access_normalize_scope($requiredScope);

    return is_string($grantedCode)
        && $grantedCode === $permissionCode
        && $grantedScope !== null
        && $normalizedRequiredScope !== null
        && cpg_access_scope_allows($grantedScope, $normalizedRequiredScope);
}

function cpg_access_effective_permissions_allow(array $effectivePermissions, string $permissionCode, string $requiredScope): bool {
    foreach ($effectivePermissions as $permission) {
        if (is_array($permission) && cpg_access_permission_allows($permission, $permissionCode, $requiredScope)) {
            return true;
        }
    }

    return false;
}

function cpg_access_load_effective_permissions(string $userId): array {
    if (!function_exists('api_query')) {
        throw new RuntimeException('api_query is required to load effective permissions');
    }

    $result = api_query(
        'SELECT DISTINCT p.permission_code, rp.scope
         FROM crewportglobal.access_group_members gm
         JOIN crewportglobal.access_group_roles gr
           ON gr.group_id = gm.group_id
          AND gr.assignment_state = $2
         JOIN crewportglobal.access_roles r
           ON r.role_id = gr.role_id
          AND r.is_active = TRUE
         JOIN crewportglobal.access_role_permissions rp
           ON rp.role_id = r.role_id
         JOIN crewportglobal.access_permissions p
           ON p.permission_id = rp.permission_id
          AND p.is_active = TRUE
         WHERE gm.user_id = $1
           AND gm.membership_state = $2',
        [$userId, 'active']
    );

    $permissions = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $permissions[] = [
            'permission_code' => (string) $row['permission_code'],
            'scope' => (string) $row['scope'],
        ];
    }

    return $permissions;
}

function cpg_access_forbidden(string $permissionCode, string $requiredScope): void {
    if (function_exists('api_error')) {
        api_error(403, 'permission_denied', sprintf('Permission %s with %s scope is required', $permissionCode, $requiredScope));
    }

    throw new RuntimeException(sprintf('Permission %s with %s scope is required', $permissionCode, $requiredScope));
}

function cpg_access_require_permission(string $userId, string $permissionCode, string $requiredScope): array {
    $effectivePermissions = cpg_access_load_effective_permissions($userId);
    if (!cpg_access_effective_permissions_allow($effectivePermissions, $permissionCode, $requiredScope)) {
        cpg_access_forbidden($permissionCode, $requiredScope);
    }

    return $effectivePermissions;
}

function cpg_access_operator_queue_view_permission(string $queueType): ?string {
    return CPG_OPERATOR_QUEUE_VIEW_PERMISSIONS[$queueType] ?? null;
}

function cpg_access_operator_queue_action_permission(string $queueType, string $decision): ?string {
    return CPG_OPERATOR_QUEUE_ACTION_PERMISSIONS[$queueType][$decision] ?? null;
}

function cpg_access_write_audit_event(array $event): void {
    if (!function_exists('api_query')) {
        throw new RuntimeException('api_query is required to write access audit events');
    }

    api_query(
        'INSERT INTO crewportglobal.access_audit_events (
             actor_user_id,
             event_type,
             target_user_id,
             target_group_id,
             target_role_id,
             target_permission_id,
             previous_value,
             new_value,
             reason,
             ip_address,
             user_agent
         ) VALUES (
             $1::uuid,
             $2,
             $3::uuid,
             $4::uuid,
             $5::uuid,
             $6::uuid,
             COALESCE($7::jsonb, \'{}\'::jsonb),
             COALESCE($8::jsonb, \'{}\'::jsonb),
             $9,
             $10::inet,
             $11
         )',
        [
            $event['actor_user_id'] ?? null,
            $event['event_type'] ?? 'access_event',
            $event['target_user_id'] ?? null,
            $event['target_group_id'] ?? null,
            $event['target_role_id'] ?? null,
            $event['target_permission_id'] ?? null,
            json_encode($event['previous_value'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            json_encode($event['new_value'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $event['reason'] ?? null,
            $event['ip_address'] ?? null,
            $event['user_agent'] ?? null,
        ]
    );
}
