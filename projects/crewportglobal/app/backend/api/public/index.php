<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/access_control.php';
require_once __DIR__ . '/../lib/admin_access_email_delivery.php';
require_once __DIR__ . '/../lib/admin_access_flow.php';
require_once __DIR__ . '/../lib/admin_access_storage_factory.php';
require_once __DIR__ . '/../lib/document_uploads.php';
require_once __DIR__ . '/../lib/identity_context.php';
require_once __DIR__ . '/../lib/questionnaire_schema.php';
require_once __DIR__ . '/../lib/questionnaire_completeness.php';
require_once __DIR__ . '/../lib/reference_catalogs.php';
require_once __DIR__ . '/../lib/registration_person_flow.php';
require_once __DIR__ . '/../lib/user_auth.php';
require_once __DIR__ . '/../lib/user_email_verification.php';
require_once __DIR__ . '/../lib/user_profile_photos.php';

const REG_DRAFT_STATUSES = ['draft', 'submitted_for_human_review'];
const ADMIN_ACCESS_PUBLIC_ROUTES_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';
const ADMIN_ACCESS_PUBLIC_ROUTES_LEGACY_ENV = 'CPG_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';

function request_path(): string {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    foreach (['/api/v1', '/app/backend/api/public'] as $prefix) {
        if (str_starts_with($path, $prefix)) {
            $trimmed = substr($path, strlen($prefix));
            return $trimmed === '' ? '/' : $trimmed;
        }
    }

    return $path;
}

function request_header_value(string $name): ?string {
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    $value = $_SERVER[$serverKey] ?? null;
    if (!is_string($value)) {
        return null;
    }

    $trimmed = trim($value);
    return $trimmed === '' ? null : $trimmed;
}

function operator_access_token(): ?string {
    foreach (['CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN', 'CPG_OPERATOR_ACCESS_TOKEN'] as $envName) {
        $value = getenv($envName);
        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }
    }

    return null;
}

function request_operator_token(): ?string {
    $headerToken = request_header_value('X-CPG-Operator-Token');
    if ($headerToken !== null) {
        return $headerToken;
    }

    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (is_string($authorization) && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches) === 1) {
        $token = trim($matches[1]);
        return $token === '' ? null : $token;
    }

    return null;
}

function require_operator_access(): void {
    $expected = operator_access_token();
    if ($expected === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    $provided = request_operator_token();
    if ($provided === null || !hash_equals($expected, $provided)) {
        api_error(401, 'operator_access_required', 'Operator access token is required');
    }
}

function require_operator_or_team_access(): array {
    $expected = operator_access_token();
    $provided = request_operator_token();
    if ($expected !== null && $provided !== null && hash_equals($expected, $provided)) {
        return [
            'access_model' => 'temporary_operator_token',
            'actor_label' => 'operator_document_review_queue',
            'actor_user_id' => null,
            'groups' => [],
            'roles' => [],
            'permissions' => [],
        ];
    }

    $namedAccess = operator_named_session_access_from_request();
    if (is_array($namedAccess)) {
        return $namedAccess;
    }

    $adminToken = admin_access_session_token();
    if ($expected === null && $adminToken === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    api_error(401, 'operator_or_team_access_required', 'Operator or approved team access is required');
}

function operator_temporary_token_access(string $actorLabel = 'temporary_operator_token'): array {
    return [
        'access_model' => CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN,
        'actor_label' => $actorLabel,
        'actor_user_id' => null,
        'groups' => [],
        'roles' => [],
        'permissions' => [],
    ];
}

function operator_named_session_access_from_request(): ?array {
    $adminToken = admin_access_session_token();
    $normalizedAdminToken = $adminToken === null ? null : api_normalize_uuid($adminToken);
    if ($normalizedAdminToken !== null) {
        admin_access_load_runtime_env();
        if (admin_access_public_flow_enabled()) {
            $storage = admin_access_storage_or_response();
            $session = $storage->findActiveAdminSession($normalizedAdminToken, cpg_admin_now());
            if (is_array($session) && cpg_admin_access_user_can_view_team_links($session)) {
                return [
                    'access_model' => 'team_admin_session',
                    'actor_label' => (string) ($session['email'] ?? 'team_session'),
                    'actor_user_id' => (string) ($session['user_id'] ?? ''),
                    'groups' => $session['groups'] ?? [],
                    'roles' => $session['roles'] ?? [],
                    'permissions' => $session['permissions'] ?? [],
                ];
            }
        }
    }

    return operator_account_session_access_from_request();
}

function operator_account_session_access_from_request(): ?array {
    $session = cpg_auth_find_active_session();
    if (!is_array($session) || !is_string($session['user_id'] ?? null) || (string) $session['user_id'] === '') {
        return null;
    }

    $result = api_query(
        'SELECT u.user_id::text AS user_id,
                lower(u.email) AS email,
                u.is_active,
                COALESCE(array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL), ARRAY[]::text[]) AS permissions,
                COALESCE(array_agg(DISTINCT r.role_code) FILTER (WHERE r.role_code IS NOT NULL), ARRAY[]::text[]) AS roles,
                COALESCE(array_agg(DISTINCT g.group_code) FILTER (WHERE g.group_code IS NOT NULL), ARRAY[]::text[]) AS groups
         FROM crewportglobal.users u
         LEFT JOIN crewportglobal.access_group_members gm
           ON gm.user_id = u.user_id
          AND gm.membership_state = $2
         LEFT JOIN crewportglobal.access_groups g
           ON g.group_id = gm.group_id
          AND g.is_active = TRUE
         LEFT JOIN crewportglobal.access_group_roles gr
           ON gr.group_id = g.group_id
          AND gr.assignment_state = $2
         LEFT JOIN crewportglobal.access_roles r
           ON r.role_id = gr.role_id
          AND r.is_active = TRUE
         LEFT JOIN crewportglobal.access_role_permissions rp
           ON rp.role_id = r.role_id
         LEFT JOIN crewportglobal.access_permissions p
           ON p.permission_id = rp.permission_id
          AND p.is_active = TRUE
         WHERE u.user_id = $1
         GROUP BY u.user_id, u.email, u.is_active
         LIMIT 1',
        [(string) $session['user_id'], 'active']
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        return null;
    }

    $access = [
        'access_model' => 'account_team_session',
        'actor_label' => (string) ($row['email'] ?? ($session['email'] ?? 'account_session')),
        'actor_user_id' => (string) ($row['user_id'] ?? $session['user_id']),
        'user_id' => (string) ($row['user_id'] ?? $session['user_id']),
        'email' => (string) ($row['email'] ?? ($session['email'] ?? '')),
        'groups' => cpg_admin_access_pg_text_list($row['groups'] ?? []),
        'roles' => cpg_admin_access_pg_text_list($row['roles'] ?? []),
        'permissions' => cpg_admin_access_pg_text_list($row['permissions'] ?? []),
        'is_active' => cpg_admin_access_storage_normalize_bool($row['is_active'] ?? true, true),
    ];

    return cpg_admin_access_user_can_view_team_links($access) ? $access : null;
}

function resolve_operator_or_named_session_access(string $temporaryActorLabel = 'temporary_operator_token'): array {
    $expected = operator_access_token();
    $provided = request_operator_token();
    if ($expected !== null && $provided !== null && hash_equals($expected, $provided)) {
        return operator_temporary_token_access($temporaryActorLabel);
    }

    $namedAccess = operator_named_session_access_from_request();
    if (is_array($namedAccess)) {
        return $namedAccess;
    }

    if ($expected === null && admin_access_session_token() === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    api_error(401, 'operator_access_required', 'Operator access token or approved team session is required');
}

function operator_access_model(?array $access): string {
    if (is_array($access) && is_string($access['access_model'] ?? null) && $access['access_model'] !== '') {
        return (string) $access['access_model'];
    }

    if (is_array($access) && is_string($access['mode'] ?? null) && $access['mode'] !== '') {
        return (string) $access['mode'];
    }

    return CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN;
}

function operator_access_string_list(?array $access, string $key): array {
    if (!is_array($access)) {
        return [];
    }

    $value = $access[$key] ?? [];
    if (function_exists('cpg_admin_access_string_list')) {
        return cpg_admin_access_string_list($value);
    }

    if (!is_array($value)) {
        return [];
    }

    return array_values(array_filter(array_map(
        static fn(mixed $item): string => strtolower(trim((string) $item)),
        $value
    )));
}

function operator_access_has_owner_override(?array $access): bool {
    $groups = operator_access_string_list($access, 'groups');
    $roles = operator_access_string_list($access, 'roles');

    return array_intersect($groups, ['owners', 'platform_owners', 'platform_administrators']) !== []
        || array_intersect($roles, ['project_owner', 'platform_administrator']) !== [];
}

function operator_access_has_permission(?array $access, string $permissionCode): bool {
    if ($permissionCode === '') {
        return false;
    }

    if (operator_access_model($access) === CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN) {
        return true;
    }

    if (operator_access_has_owner_override($access)) {
        return true;
    }

    return in_array($permissionCode, operator_access_string_list($access, 'permissions'), true);
}

function operator_queue_capability_for_access(array $requirement, ?array $access): array {
    $permissionCode = is_string($requirement['permission_code'] ?? null) ? (string) $requirement['permission_code'] : null;
    $scope = is_string($requirement['scope'] ?? null) ? (string) $requirement['scope'] : null;

    return [
        'permission_code' => $permissionCode,
        'scope' => $scope,
        'allowed' => $permissionCode !== null && operator_access_has_permission($access, $permissionCode),
    ];
}

function operator_queue_access_contract(string $queueType, ?array $access = null): ?array {
    $mode = operator_access_model($access);
    if ($mode === CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN && !is_array($access)) {
        $identity = cpg_identity_temporary_operator_token('operator_review_queue');
        return cpg_access_operator_queue_capabilities($queueType, null, true, cpg_identity_permission_mode($identity));
    }

    $viewRequirement = cpg_access_operator_queue_view_requirement($queueType);
    if ($viewRequirement === null) {
        return null;
    }

    $matrix = cpg_access_operator_queue_permission_matrix();
    $actions = [];
    foreach (($matrix[$queueType]['actions'] ?? []) as $decision => $requirement) {
        if (is_string($decision) && is_array($requirement)) {
            $actions[$decision] = operator_queue_capability_for_access($requirement, $access);
        }
    }

    return [
        'mode' => $mode,
        'view' => operator_queue_capability_for_access($viewRequirement, $access),
        'actions' => $actions,
    ];
}

function operator_access_can_view_queue_type(string $queueType, ?array $access = null): bool {
    $contract = operator_queue_access_contract($queueType, $access);
    return is_array($contract) && (($contract['view']['allowed'] ?? false) === true);
}

function operator_access_can_view_any_operator_queue(?array $access = null): bool {
    foreach (array_keys(cpg_access_operator_queue_permission_matrix()) as $queueType) {
        if (is_string($queueType) && operator_access_can_view_queue_type($queueType, $access)) {
            return true;
        }
    }

    return false;
}

function require_operator_or_team_queue_access(): array {
    $access = resolve_operator_or_named_session_access('operator_review_queue');
    if (!operator_access_can_view_any_operator_queue($access)) {
        api_json(403, [
            'ok' => false,
            'error' => 'operator_queue_permission_required',
            'message' => 'Operator queue access requires at least one queue view permission',
            'access_model' => operator_access_model($access),
        ]);
    }

    return $access;
}

function require_operator_queue_type_access(string $queueType): array {
    $access = resolve_operator_or_named_session_access('operator_review_queue');
    if (!operator_access_can_view_queue_type($queueType, $access)) {
        api_json(403, [
            'ok' => false,
            'error' => 'operator_queue_permission_required',
            'message' => 'Operator queue access requires the configured queue view permission',
            'queue_type' => $queueType,
            'operator_access' => operator_queue_access_contract($queueType, $access),
            'access_model' => operator_access_model($access),
        ]);
    }

    return $access;
}

function require_operator_queue_decision_access(string $queueType, string $decision, array $access): void {
    $contract = operator_queue_access_contract($queueType, $access);
    $action = is_array($contract['actions'][$decision] ?? null) ? $contract['actions'][$decision] : null;
    if (($action['allowed'] ?? false) !== true) {
        api_json(403, [
            'ok' => false,
            'error' => 'operator_queue_action_permission_required',
            'message' => 'Operator queue decision requires the configured group permission',
            'queue_type' => $queueType,
            'decision' => $decision,
            'operator_access' => $contract,
            'access_model' => operator_access_model($access),
        ]);
    }
}

function operator_legacy_queue_access_contract(string $queueType): ?array {
    $identity = cpg_identity_temporary_operator_token('operator_review_queue');
    return cpg_access_operator_queue_capabilities($queueType, null, true, cpg_identity_permission_mode($identity));
}

function operator_workflow_operation_requirements(): array {
    return [
        'create_internal_shortlist_draft' => [
            'operation_label' => 'Create internal shortlist draft',
            'target_group_code' => 'review_team',
            'target_role_code' => 'reviewer',
            'required_permission_code' => 'view_review_queue',
            'scope' => 'queue',
        ],
        'approve_internal_shortlist' => [
            'operation_label' => 'Approve internal shortlist',
            'target_group_code' => 'review_team',
            'target_role_code' => 'reviewer',
            'required_permission_code' => 'approve_candidate_presentation',
            'scope' => 'queue',
        ],
        'create_review_applications' => [
            'operation_label' => 'Create internal review applications',
            'target_group_code' => 'review_team',
            'target_role_code' => 'reviewer',
            'required_permission_code' => 'start_human_review',
            'scope' => 'queue',
        ],
        'review_candidate_presentation' => [
            'operation_label' => 'Review candidate presentation',
            'target_group_code' => 'review_team',
            'target_role_code' => 'reviewer',
            'required_permission_code' => 'approve_candidate_presentation',
            'scope' => 'queue',
        ],
        'review_seafarer_profile_completeness' => [
            'operation_label' => 'Review seafarer profile completeness',
            'target_group_code' => 'verification_team',
            'target_role_code' => 'verifier',
            'required_permission_code' => 'view_verification_queue',
            'scope' => 'queue',
        ],
        'review_company_verification' => [
            'operation_label' => 'Review company verification',
            'target_group_code' => 'verification_team',
            'target_role_code' => 'verifier',
            'required_permission_code' => 'view_verification_queue',
            'scope' => 'queue',
        ],
        'request_vacancy_deletion' => [
            'operation_label' => 'Request vacancy deletion',
            'target_group_code' => 'review_team',
            'target_role_code' => 'reviewer',
            'required_permission_code' => 'approve_vacancy_request',
            'scope' => 'queue',
        ],
        'confirm_vacancy_deletion' => [
            'operation_label' => 'Confirm vacancy deletion',
            'target_group_code' => 'owners',
            'target_role_code' => 'project_owner',
            'required_permission_code' => 'approve_access_policy_change',
            'scope' => 'queue',
        ],
        'reject_vacancy_deletion' => [
            'operation_label' => 'Reject vacancy deletion',
            'target_group_code' => 'owners',
            'target_role_code' => 'project_owner',
            'required_permission_code' => 'approve_access_policy_change',
            'scope' => 'queue',
        ],
    ];
}

function operator_workflow_operation_requirement(string $operationCode): ?array {
    $requirements = operator_workflow_operation_requirements();
    return isset($requirements[$operationCode]) && is_array($requirements[$operationCode])
        ? $requirements[$operationCode]
        : null;
}

function operator_workflow_operation_contract(string $operationCode, ?array $access = null): array {
    $requirement = operator_workflow_operation_requirement($operationCode) ?? [];
    $mode = operator_access_model($access);
    $requiredPermission = is_string($requirement['required_permission_code'] ?? null)
        ? (string) $requirement['required_permission_code']
        : '';
    $allowed = is_array($access) && array_key_exists('allowed', $access)
        ? ($access['allowed'] === true)
        : true;
    if ($mode !== CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN) {
        $allowed = $allowed && operator_access_has_permission($access, $requiredPermission);
    }

    return [
        'operation_code' => $operationCode,
        'operation_label' => is_string($requirement['operation_label'] ?? null) ? $requirement['operation_label'] : $operationCode,
        'target_group_code' => is_string($requirement['target_group_code'] ?? null) ? $requirement['target_group_code'] : null,
        'target_role_code' => is_string($requirement['target_role_code'] ?? null) ? $requirement['target_role_code'] : null,
        'required_permission_code' => is_string($requirement['required_permission_code'] ?? null) ? $requirement['required_permission_code'] : null,
        'scope' => is_string($requirement['scope'] ?? null) ? $requirement['scope'] : null,
        'mode' => $mode,
        'allowed' => $allowed,
        'permission_boundary' => $mode === CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN
            ? 'temporary_operator_token_compatibility'
            : 'group_permission_check',
        'actor_label' => is_string($access['actor_label'] ?? null) ? (string) $access['actor_label'] : 'temporary_operator_token',
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'groups' => operator_access_string_list($access, 'groups'),
        'roles' => operator_access_string_list($access, 'roles'),
        'permissions' => operator_access_string_list($access, 'permissions'),
    ];
}

function operator_workflow_actor_context(?array $access, string $operationCode): array {
    $contract = operator_workflow_operation_contract($operationCode, $access);
    return [
        'operation_code' => $operationCode,
        'access_model' => $contract['mode'],
        'actor_label' => $contract['actor_label'],
        'actor_user_id' => $contract['actor_user_id'],
        'target_group_code' => $contract['target_group_code'],
        'target_role_code' => $contract['target_role_code'],
        'required_permission_code' => $contract['required_permission_code'],
        'scope' => $contract['scope'],
        'permission_boundary' => $contract['permission_boundary'],
    ];
}

function operator_queue_decision_actor_context(?array $access, string $queueType, string $decision): array {
    $contract = operator_queue_access_contract($queueType, $access);
    $actions = is_array($contract['actions'] ?? null) ? $contract['actions'] : [];
    $action = is_array($actions[$decision] ?? null) ? $actions[$decision] : [];
    $targetGroup = in_array($queueType, ['vacancy_request', 'vacancy_application'], true)
        ? 'review_team'
        : (in_array($queueType, ['seafarer_profile', 'company_verification'], true) ? 'verification_team' : null);
    $targetRole = $targetGroup === 'review_team'
        ? 'reviewer'
        : ($targetGroup === 'verification_team' ? 'verifier' : null);
    $mode = operator_access_model($access);

    return [
        'operation_code' => 'operator_review_queue_status',
        'decision' => $decision,
        'queue_type' => $queueType,
        'access_model' => $mode,
        'actor_label' => is_string($access['actor_label'] ?? null) ? (string) $access['actor_label'] : 'temporary_operator_token',
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'target_group_code' => $targetGroup,
        'target_role_code' => $targetRole,
        'required_permission_code' => is_string($action['permission_code'] ?? null) ? (string) $action['permission_code'] : null,
        'scope' => is_string($action['scope'] ?? null) ? (string) $action['scope'] : null,
        'permission_boundary' => $mode === CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN
            ? 'temporary_operator_token_compatibility'
            : 'group_permission_check',
    ];
}

function operator_workflow_session_allows_operation(array $session, array $requirement): bool {
    $groups = function_exists('cpg_admin_access_string_list')
        ? cpg_admin_access_string_list($session['groups'] ?? [])
        : [];
    $permissions = function_exists('cpg_admin_access_string_list')
        ? cpg_admin_access_string_list($session['permissions'] ?? [])
        : [];
    $roles = function_exists('cpg_admin_access_string_list')
        ? cpg_admin_access_string_list($session['roles'] ?? [])
        : [];

    $targetGroup = is_string($requirement['target_group_code'] ?? null) ? (string) $requirement['target_group_code'] : '';
    $requiredPermission = is_string($requirement['required_permission_code'] ?? null) ? (string) $requirement['required_permission_code'] : '';
    $groupAllowed = $targetGroup !== '' && in_array($targetGroup, $groups, true);
    $ownerOverride = array_intersect($groups, ['owners', 'platform_owners', 'platform_administrators']) !== []
        || array_intersect($roles, ['project_owner', 'platform_administrator']) !== [];
    $permissionAllowed = $requiredPermission !== '' && in_array($requiredPermission, $permissions, true);

    return ($groupAllowed && $permissionAllowed) || $ownerOverride;
}

function require_operator_workflow_operation_access(string $operationCode): array {
    $requirement = operator_workflow_operation_requirement($operationCode);
    if ($requirement === null) {
        api_error(500, 'workflow_operation_requirement_missing', 'Workflow operation requirement is not configured');
    }

    $expected = operator_access_token();
    $provided = request_operator_token();
    if ($expected !== null && $provided !== null && hash_equals($expected, $provided)) {
        return operator_workflow_operation_contract($operationCode, [
            'access_model' => CPG_IDENTITY_BOUNDARY_TEMPORARY_OPERATOR_TOKEN,
            'actor_label' => 'temporary_operator_token',
            'actor_user_id' => null,
            'allowed' => true,
        ]);
    }

    $adminToken = admin_access_session_token();
    if ($adminToken !== null) {
        admin_access_load_runtime_env();
        if (admin_access_public_flow_enabled()) {
            $storage = admin_access_storage_or_response();
            $session = $storage->findActiveAdminSession($adminToken, cpg_admin_now());
            if (is_array($session) && operator_workflow_session_allows_operation($session, $requirement)) {
                return operator_workflow_operation_contract($operationCode, [
                    'access_model' => 'team_admin_session',
                    'actor_label' => (string) ($session['email'] ?? 'team_session'),
                    'actor_user_id' => (string) ($session['user_id'] ?? ''),
                    'allowed' => true,
                    'groups' => $session['groups'] ?? [],
                    'roles' => $session['roles'] ?? [],
                    'permissions' => $session['permissions'] ?? [],
                ]);
            }

            api_json(403, [
                'ok' => false,
                'error' => 'workflow_operation_permission_required',
                'message' => 'This operation requires the configured group and permission',
                'operation_access' => operator_workflow_operation_contract($operationCode, [
                    'access_model' => 'team_admin_session',
                    'actor_label' => is_array($session) ? (string) ($session['email'] ?? 'team_session') : 'team_session',
                    'actor_user_id' => is_array($session) ? (string) ($session['user_id'] ?? '') : null,
                    'allowed' => false,
                    'groups' => is_array($session) ? ($session['groups'] ?? []) : [],
                    'roles' => is_array($session) ? ($session['roles'] ?? []) : [],
                    'permissions' => is_array($session) ? ($session['permissions'] ?? []) : [],
                ]),
            ]);
        }
    }

    $accountAccess = operator_account_session_access_from_request();
    if (is_array($accountAccess)) {
        if (operator_workflow_session_allows_operation($accountAccess, $requirement)) {
            return operator_workflow_operation_contract($operationCode, array_merge($accountAccess, [
                'allowed' => true,
            ]));
        }

        api_json(403, [
            'ok' => false,
            'error' => 'workflow_operation_permission_required',
            'message' => 'This operation requires the configured group and permission',
            'operation_access' => operator_workflow_operation_contract($operationCode, array_merge($accountAccess, [
                'allowed' => false,
            ])),
        ]);
    }

    if ($expected === null && $adminToken === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    api_error(401, 'operator_access_required', 'Operator access token or approved team session is required');
}

function operator_computed_workflow_operation(
    string $operationCode,
    bool $available,
    array $blockers = [],
    array $extra = [],
    ?array $access = null
): array {
    return array_merge([
        'operation_code' => $operationCode,
        'operation_status' => $available ? 'available' : 'blocked',
        'is_visible' => true,
        'is_executable' => $available,
        'computed_from' => 'current_data_state',
        'blockers' => array_values($blockers),
        'required_access' => operator_workflow_operation_contract($operationCode, $access),
    ], $extra);
}

function admin_access_public_routes_enabled(): bool {
    return cpg_admin_access_bool_env(ADMIN_ACCESS_PUBLIC_ROUTES_ENV)
        || cpg_admin_access_bool_env(ADMIN_ACCESS_PUBLIC_ROUTES_LEGACY_ENV);
}

function admin_access_public_flow_enabled(): bool {
    return admin_access_public_routes_enabled() && cpg_admin_access_flow_enabled();
}

function admin_access_load_runtime_env(): void {
    cpg_admin_access_load_protected_env_file();
}

function admin_access_api_response(array $response): void {
    $status = $response['status'] ?? 500;
    $payload = $response['payload'] ?? [
        'ok' => false,
        'error' => 'admin_access_response_error',
        'message' => 'Invalid admin access response',
    ];

    api_json(is_int($status) ? $status : 500, is_array($payload) ? $payload : []);
}

function admin_access_request_metadata(): array {
    return [
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    ];
}

function admin_access_session_token(): ?string {
    $headerToken = request_header_value('X-CPG-Admin-Session');
    if ($headerToken !== null) {
        return $headerToken;
    }

    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (is_string($authorization) && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches) === 1) {
        $token = trim($matches[1]);
        return $token === '' ? null : $token;
    }

    return null;
}

function admin_access_storage_or_response(): CpgAdminAccessStorage {
    $storageDisabled = cpg_admin_access_storage_factory_disabled_response();
    if ($storageDisabled !== null) {
        admin_access_api_response($storageDisabled);
    }

    $storage = cpg_admin_access_create_storage();
    if (!$storage instanceof CpgAdminAccessStorage) {
        admin_access_api_response(cpg_admin_access_response(503, [
            'ok' => false,
            'error' => 'admin_access_storage_not_configured',
            'message' => 'Admin access storage is not configured yet',
        ]));
    }

    return $storage;
}

function handle_post_admin_access_email_code_request(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $deliveryDisabled = cpg_admin_access_email_delivery_disabled_response();
    if ($deliveryDisabled !== null) {
        admin_access_api_response($deliveryDisabled);
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    $delivery = cpg_admin_access_create_email_delivery();
    if (!$storage instanceof CpgAdminAccessStorage || !$delivery instanceof CpgAdminAccessEmailDelivery) {
        admin_access_api_response(cpg_admin_access_response(503, [
            'ok' => false,
            'error' => 'admin_access_runtime_not_configured',
            'message' => 'Admin access runtime is not configured',
        ]));
    }

    admin_access_api_response(cpg_admin_access_request_code_with_storage_and_delivery(
        $body,
        $storage,
        $delivery,
        true,
        null,
        admin_access_request_metadata()
    ));
}

function handle_post_admin_access_email_code_verify(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();

    admin_access_api_response(cpg_admin_access_verify_code_with_storage(
        $body,
        $storage,
        true,
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_session(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_session_summary_with_storage(
        $storage,
        admin_access_session_token(),
        null,
        12
    ));
}

function handle_post_admin_access_session_revoke(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_revoke_session_with_storage(
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_team_links(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    if (admin_access_session_token() === null) {
        $accountAccess = operator_account_session_access_from_request();
        if (is_array($accountAccess)) {
            $groups = cpg_admin_access_string_list($accountAccess['groups'] ?? []);
            sort($groups);

            api_json(200, [
                'ok' => true,
                'user' => [
                    'user_id' => (string) ($accountAccess['actor_user_id'] ?? ''),
                    'email' => (string) ($accountAccess['actor_label'] ?? ''),
                    'groups' => $groups,
                ],
                'access_model' => [
                    'mode' => 'account_group_membership',
                    'allowed_groups' => [
                        CPG_ADMIN_ACCESS_OWNER_GROUP,
                        CPG_ADMIN_ACCESS_TEAM_GROUP,
                        CPG_ADMIN_ACCESS_REVIEW_TEAM_GROUP,
                        CPG_ADMIN_ACCESS_VERIFICATION_TEAM_GROUP,
                    ],
                ],
                'links' => CPG_ADMIN_ACCESS_TEAM_LINKS,
            ]);
        }
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_team_links_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_get_admin_access_management(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_management_snapshot_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_post_admin_access_user(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_create_user_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_post_admin_access_group_member(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_add_group_member_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_reference_catalogs(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_reference_catalog_admin_snapshot_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_patch_admin_access_reference_catalog_publication(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_reference_catalog_publication_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function registration_person_runtime_or_error(): void {
    admin_access_load_runtime_env();
    if (!cpg_registration_public_flow_enabled()) {
        api_error(503, 'registration_person_flow_disabled', 'Registration person flow is not enabled');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    $deliveryStatus = cpg_registration_email_delivery_status();
    if (($deliveryStatus['ok'] ?? false) !== true) {
        api_json(503, [
            'ok' => false,
            'error' => $deliveryStatus['error'] ?? 'registration_email_delivery_disabled',
            'message' => 'Registration email delivery is not configured',
            'missing_config' => $deliveryStatus['missing_config'] ?? [],
        ]);
    }
}

function normalize_registration_person_text(mixed $value, int $maxLength): ?string {
    if (!is_string($value)) {
        return null;
    }

    $text = trim($value);
    if ($text === '') {
        return null;
    }

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function handle_post_registration_person_request(): void {
    registration_person_runtime_or_error();
    $body = api_decode_json_body();

    $email = api_normalize_email($body['email'] ?? null);
    $fullName = normalize_registration_person_text($body['full_name'] ?? null, 240);
    $phone = normalize_registration_person_text($body['phone'] ?? null, 80);
    $country = normalize_registration_person_text($body['country'] ?? null, 120);
    $language = normalize_registration_person_text($body['language'] ?? null, 12) ?? 'en';
    $termsAccepted = ($body['terms_accepted'] ?? false) === true;
    $consentAccepted = ($body['consent_accepted'] ?? false) === true;

    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }
    if ($fullName === null || $phone === null || $country === null || !$termsAccepted || !$consentAccepted) {
        api_error(400, 'registration_person_required_fields_missing', 'full_name, phone, country and both consents are required');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    api_tx_begin();
    try {
        $userResult = api_query(
            "INSERT INTO crewportglobal.users (email, display_name, registration_status)
             VALUES ($1, $2, 'draft')
             ON CONFLICT ((lower(email)))
             DO UPDATE SET
               display_name = COALESCE(NULLIF(crewportglobal.users.display_name, ''), EXCLUDED.display_name),
               registration_status = CASE
                 WHEN crewportglobal.users.registration_status = 'approved' THEN crewportglobal.users.registration_status
                 ELSE 'draft'
               END,
               updated_at = now()
             RETURNING user_id, email, display_name, email_verified_at",
            [$email, $fullName]
        );
        $userRow = pg_fetch_assoc($userResult);
        if (!is_array($userRow)) {
            api_tx_rollback();
            api_error(500, 'registration_person_upsert_failed', 'Unable to create or update person record');
        }

        $userId = (string) $userRow['user_id'];
        $now = time();
        $token = cpg_registration_create_confirmation_token($userId, $email, $now, $secret);
        $expiresAt = gmdate('c', $now + CPG_REGISTRATION_LINK_TTL_SECONDS);
        $confirmationUrl = cpg_registration_confirmation_url($token);
        $message = cpg_registration_email_message($email, $confirmationUrl, $expiresAt);
        $delivery = cpg_registration_send_email_message($message);

        $deliveryStatusCode = (string) ($delivery['delivery_status'] ?? '');
        if (($delivery['ok'] ?? false) !== true
            || !in_array($deliveryStatusCode, ['registration_email_delivery_sent', 'captured_test_only'], true)
        ) {
            api_tx_rollback();
            api_json(502, [
                'ok' => false,
                'error' => $delivery['error'] ?? 'registration_email_delivery_failed',
                'message' => 'Unable to send registration confirmation email',
                'delivery_status' => $deliveryStatusCode,
            ]);
        }

        write_audit_event('person_registration_email_requested', $userId, null, null, [
            'email' => $email,
            'phone_present' => $phone !== null,
            'country' => $country,
            'language' => $language,
            'terms_accepted' => $termsAccepted,
            'consent_accepted' => $consentAccepted,
            'delivery_status' => $delivery['delivery_status'] ?? null,
            'expires_at' => $expiresAt,
        ], 'public_person_registration');

        api_tx_commit();

        api_json(202, [
            'ok' => true,
            'status' => 'registration_email_confirmation_sent',
            'person_id' => $userId,
            'masked_email' => cpg_admin_mask_email($email),
            'email_verified' => $userRow['email_verified_at'] !== null,
            'delivery_status' => $delivery['delivery_status'] ?? null,
            'next_step' => 'open_email_confirmation_link',
            'expires_at' => $expiresAt,
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'registration_person_request_failed', $error->getMessage());
    }
}

function handle_post_registration_person_confirm(): void {
    admin_access_load_runtime_env();
    if (!cpg_registration_public_flow_enabled()) {
        api_error(503, 'registration_person_flow_disabled', 'Registration person flow is not enabled');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    $body = api_decode_json_body();
    $token = isset($body['token']) && is_string($body['token']) ? trim($body['token']) : '';
    if ($token === '') {
        api_error(400, 'registration_confirmation_token_required', 'token is required');
    }

    $verifiedToken = cpg_registration_verify_confirmation_token($token, time(), $secret);
    if (($verifiedToken['ok'] ?? false) !== true) {
        api_error(400, (string) ($verifiedToken['error'] ?? 'registration_confirmation_token_invalid'), 'Registration confirmation token is invalid or expired');
    }

    $userId = (string) $verifiedToken['user_id'];
    $email = (string) $verifiedToken['email'];

    api_tx_begin();
    try {
        $userResult = api_query(
            'UPDATE crewportglobal.users
             SET email_verified_at = COALESCE(email_verified_at, now()),
                 updated_at = now()
             WHERE user_id = $1 AND lower(email) = lower($2)
             RETURNING user_id, email, display_name, email_verified_at',
            [$userId, $email]
        );
        $userRow = pg_fetch_assoc($userResult);
        if (!is_array($userRow)) {
            api_tx_rollback();
            api_error(404, 'registration_person_not_found', 'Registration person record was not found');
        }

        api_query(
            'INSERT INTO crewportglobal.user_auth_identities (user_id, provider, provider_subject, is_primary)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (user_id, provider)
             DO UPDATE SET
               provider_subject = EXCLUDED.provider_subject,
               is_primary = TRUE,
               updated_at = now()',
            [$userId, 'email', $email]
        );

        write_audit_event('person_registration_email_confirmed', $userId, null, null, [
            'email' => $email,
            'confirmed_at' => $userRow['email_verified_at'] ?? gmdate('c'),
        ], 'public_person_registration');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'status' => 'registration_email_confirmed',
            'person_id' => $userId,
            'email' => $email,
            'display_name' => $userRow['display_name'] ?? null,
            'email_verified_at' => $userRow['email_verified_at'],
            'next_url' => '/register/next/',
            'next_step' => 'continue_registration_sequence',
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'registration_person_confirm_failed', $error->getMessage());
    }
}

function handle_post_auth_register_password(): void {
    admin_access_load_runtime_env();
    $body = api_decode_json_body();
    $email = api_normalize_email($body['email'] ?? null);
    $password = cpg_auth_normalize_password($body['password'] ?? null);
    $confirmPassword = isset($body['confirm_password']) ? cpg_auth_normalize_password($body['confirm_password']) : $password;
    $role = api_normalize_role($body['role'] ?? null);
    $termsAccepted = ($body['terms_accepted'] ?? false) === true;
    $consentAccepted = ($body['consent_accepted'] ?? false) === true;

    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }
    if ($password === null) {
        api_error(400, 'invalid_password', 'password must be between 8 and 200 characters');
    }
    if ($confirmPassword === null || !hash_equals($password, $confirmPassword)) {
        api_error(400, 'password_confirmation_mismatch', 'password confirmation does not match');
    }
    if ($role === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }
    if (!$termsAccepted || !$consentAccepted) {
        api_error(400, 'registration_consents_required', 'terms_accepted and consent_accepted are required');
    }

    $existingCredential = api_query(
        'SELECT credential_id
         FROM crewportglobal.user_credentials
         WHERE lower(login_email) = lower($1)
         LIMIT 1',
        [$email]
    );
    if (is_array(pg_fetch_assoc($existingCredential))) {
        api_error(409, 'credential_already_exists', 'An account with this email already has password credentials');
    }

    api_tx_begin();
    try {
        [$userId, $createdRole] = upsert_user_and_role([
            'role' => $role,
            'email' => $email,
            'full_name' => $body['full_name'] ?? null,
        ]);

        api_query(
            'INSERT INTO crewportglobal.user_auth_identities (user_id, provider, provider_subject, is_primary)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (user_id, provider)
             DO UPDATE SET
               provider_subject = EXCLUDED.provider_subject,
               is_primary = TRUE,
               updated_at = now()',
            [$userId, 'email', $email]
        );

        if ($createdRole === 'seafarer') {
            upsert_seafarer_profile($userId, $body, $email);
        } else {
            [$companyId, $vesselId] = upsert_company_context($userId, $createdRole, $body);
            upsert_vacancy_request($userId, $companyId, $vesselId, $body);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $credentialResult = api_query(
            'INSERT INTO crewportglobal.user_credentials (user_id, login_email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO NOTHING
             RETURNING credential_id',
            [$userId, $email, $passwordHash]
        );
        if (!is_array(pg_fetch_assoc($credentialResult))) {
            api_tx_rollback();
            api_error(409, 'credential_already_exists', 'An account with this email already has password credentials');
        }

        $session = cpg_auth_create_session($userId);
        $emailVerification = cpg_email_verification_create_and_send(
            $userId,
            $email,
            'password_registration'
        );

        write_audit_event('password_credential_registered', $userId, null, null, [
            'role' => $createdRole,
            'login_email' => $email,
            'session_created' => true,
            'email_verification_status' => $emailVerification['email_verification_status'] ?? 'pending',
            'email_delivery_status' => $emailVerification['email_delivery_status'] ?? 'not_configured',
        ], 'auth_password_session');

        $draft = build_draft_response($userId);
        api_tx_commit();

        api_json(201, [
            'ok' => true,
            'status' => 'password_credential_registered',
            'user' => cpg_auth_public_user_payload([
                'user_id' => $userId,
                'email' => $email,
                'display_name' => $body['full_name'] ?? null,
                'email_verified_at' => null,
                'email_verification_status' => $emailVerification['email_verification_status'] ?? 'pending',
                'registration_status' => $draft['status'] ?? 'draft',
            ], $createdRole),
            'session' => [
                'expires_at' => $session['expires_at'],
            ],
            'email_verification' => $emailVerification,
            'draft_id' => $draft['draft_id'],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'auth_register_password_failed', $error->getMessage());
    }
}

function handle_post_auth_login(): void {
    $body = api_decode_json_body();
    $email = api_normalize_email($body['email'] ?? null);
    $password = is_string($body['password'] ?? null) ? (string) $body['password'] : '';

    if ($email === null || $password === '') {
        api_error(401, 'invalid_login', 'Invalid email or password');
    }

    $result = api_query(
        'SELECT c.credential_id,
                c.user_id,
                c.password_hash,
                c.is_active AS credential_active,
                u.email,
                u.display_name,
                u.email_verified_at,
                u.email_verification_status,
                u.registration_status,
                u.is_active AS user_active
         FROM crewportglobal.user_credentials c
         JOIN crewportglobal.users u ON u.user_id = c.user_id
         WHERE lower(c.login_email) = lower($1)
         LIMIT 1',
        [$email]
    );
    $row = pg_fetch_assoc($result);
    $valid = is_array($row)
        && ($row['credential_active'] === 't' || $row['credential_active'] === true)
        && ($row['user_active'] === 't' || $row['user_active'] === true)
        && password_verify($password, (string) $row['password_hash']);

    if (!$valid) {
        if (is_array($row)) {
            api_query(
                'UPDATE crewportglobal.user_credentials
                 SET failed_login_attempts = failed_login_attempts + 1,
                     last_failed_login_at = now()
                 WHERE credential_id = $1',
                [(string) $row['credential_id']]
            );
        }
        api_error(401, 'invalid_login', 'Invalid email or password');
    }

    $userId = (string) $row['user_id'];
    $role = read_role_for_user($userId);
    if ($role === null) {
        api_error(403, 'account_role_missing', 'Account role is not configured');
    }

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.user_credentials
             SET failed_login_attempts = 0,
                 last_failed_login_at = NULL,
                 last_login_at = now()
             WHERE credential_id = $1',
            [(string) $row['credential_id']]
        );

        $session = cpg_auth_create_session($userId);
        write_audit_event('password_login_succeeded', $userId, null, null, [
            'login_email' => $email,
        ], 'auth_password_session');

        $draft = build_draft_response($userId);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'authenticated' => true,
            'user' => cpg_auth_public_user_payload($row, $role),
            'session' => [
                'expires_at' => $session['expires_at'],
            ],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'auth_login_failed', $error->getMessage());
    }
}

function handle_post_auth_logout(): void {
    $session = cpg_auth_find_active_session();
    if ($session !== null) {
        write_audit_event('password_session_logged_out', (string) $session['user_id'], null, null, [
            'session_id' => (string) $session['session_id'],
        ], 'auth_password_session');
    }

    cpg_auth_revoke_current_session();

    api_json(200, [
        'ok' => true,
        'authenticated' => false,
        'status' => 'logged_out',
    ]);
}

function handle_get_auth_me(): void {
    $session = cpg_auth_find_active_session();
    if ($session === null) {
        api_json(200, [
            'ok' => true,
            'authenticated' => false,
        ]);
    }

    $userId = (string) $session['user_id'];
    $role = read_role_for_user($userId);
    $draft = null;
    if ($role !== null) {
        $draft = build_draft_response($userId);
    }

    api_json(200, [
        'ok' => true,
        'authenticated' => true,
        'user' => cpg_auth_public_user_payload($session, $role),
        'session' => [
            'expires_at' => $session['expires_at'],
        ],
        'draft' => $draft,
    ]);
}

function handle_post_auth_email_send_verification(string $source): void {
    admin_access_load_runtime_env();
    $session = cpg_auth_find_active_session();
    if ($session === null) {
        api_error(401, 'authentication_required', 'Authentication is required');
    }

    $userId = (string) $session['user_id'];
    $status = cpg_email_verification_user_status($userId);
    if (($status['email_verified'] ?? false) === true) {
        api_json(200, [
            'ok' => true,
            'status' => 'email_already_verified',
            'email_verification' => $status,
        ]);
    }

    api_tx_begin();
    try {
        $emailVerification = cpg_email_verification_create_and_send(
            $userId,
            (string) $status['email'],
            $source
        );
        api_tx_commit();

        api_json(202, [
            'ok' => true,
            'status' => 'email_verification_pending',
            'email_verification' => $emailVerification,
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'email_verification_send_failed', $error->getMessage());
    }
}

function handle_post_auth_email_verify(): void {
    $body = api_decode_json_body();
    $token = isset($body['token']) && is_string($body['token']) ? trim($body['token']) : '';
    if ($token === '') {
        api_error(400, 'email_verification_token_required', 'verification token is required');
    }

    api_tx_begin();
    try {
        $result = cpg_email_verification_verify_token($token);
        $userRow = $result['user'];
        $userId = (string) $userRow['user_id'];
        $role = read_role_for_user($userId);
        $draft = $role === null ? null : build_draft_response($userId);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'status' => 'email_verified',
            'user' => cpg_auth_public_user_payload($userRow, $role),
            'email_verification' => $result['email_verification'],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'email_verification_failed', $error->getMessage());
    }
}

function read_role_for_user(string $userId): ?string {
    $result = api_query(
        'SELECT role FROM crewportglobal.user_roles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? (string) $row['role'] : null;
}

function read_roles_for_user(string $userId): array {
    $result = api_query(
        'SELECT role FROM crewportglobal.user_roles WHERE user_id = $1 ORDER BY created_at ASC',
        [$userId]
    );

    $roles = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        if (is_array($row) && is_string($row['role'] ?? null) && $row['role'] !== '') {
            $roles[] = (string) $row['role'];
        }
    }

    return array_values(array_unique($roles));
}

function resolve_registration_draft_role(string $userId, ?string $preferredRole = null): ?string {
    $roles = read_roles_for_user($userId);
    if ($roles === []) {
        return null;
    }

    if ($preferredRole !== null && in_array($preferredRole, $roles, true)) {
        return $preferredRole;
    }

    return $roles[0];
}

function read_primary_company_for_user(string $userId): ?array {
    $result = api_query(
        'SELECT ec.company_id, ec.company_name, ec.registration_number, ec.country_code, ec.company_type, ec.verification_status,
                cu.role_in_company, cu.is_primary_contact
         FROM crewportglobal.company_users cu
         JOIN crewportglobal.employer_companies ec ON ec.company_id = cu.company_id
         WHERE cu.user_id = $1
         ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
         LIMIT 1',
        [$userId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function normalize_role_in_company(mixed $value): string {
    if (!is_string($value)) {
        return 'manager';
    }

    $normalized = trim(strtolower($value));
    $allowed = ['owner', 'manager', 'recruiter', 'viewer'];
    return in_array($normalized, $allowed, true) ? $normalized : 'manager';
}

function read_latest_vessel_for_company(string $companyId): ?array {
    $result = api_query(
        'SELECT vessel_id,
                vessel_name,
                vessel_type,
                vessel_type_value_id,
                vessel_type_label,
                imo_number,
                flag_country_code
         FROM crewportglobal.vessels
         WHERE company_id = $1
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1',
        [$companyId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function read_latest_vacancy_for_company(string $companyId, ?string $userId = null): ?array {
    $result = api_query(
        'SELECT vacancy_request_id,
                company_id,
                vessel_id,
                created_by_user_id,
                vacancy_title,
                rank,
                department,
                vessel_type,
                required_rank_value_id,
                required_rank_label,
                vessel_type_value_id,
                vessel_type_label,
                join_date,
                contract_duration,
                contract_duration_value,
                contract_duration_unit,
                required_passport_validity_days,
                required_seaman_book_validity_days,
                required_medical_validity_days,
                salary_min_usd,
                salary_max_usd,
                salary_text,
                currency,
                employer_country_code,
                requirements,
                demand_workspace,
                publication_status,
                created_at,
                updated_at
         FROM crewportglobal.vacancy_requests
         WHERE company_id = $1
           AND ($2::uuid IS NULL OR created_by_user_id = $2::uuid)
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1',
        [$companyId, $userId]
    );

    $row = pg_fetch_assoc($result);
    if (is_array($row)) {
        $row['demand_workspace'] = cpg_decode_json_object(is_string($row['demand_workspace'] ?? null) ? $row['demand_workspace'] : null);
    }
    return is_array($row) ? $row : null;
}

function normalize_optional_text(mixed $value, int $maxLength = 2000): ?string {
    if (!is_string($value)) {
        return null;
    }

    $text = trim($value);
    if ($text === '') {
        return null;
    }

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function normalize_country_code(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $countryCode = strtoupper(trim($value));
    return preg_match('/^[A-Z]{2}$/', $countryCode) ? $countryCode : null;
}

function normalize_date_value(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $date = trim($value);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;
}

function normalize_allowed_document_value(mixed $value, array $allowed): ?string {
    if (!is_string($value)) {
        return null;
    }

    $normalized = trim(strtolower($value));
    return in_array($normalized, $allowed, true) ? $normalized : null;
}

function normalize_text_fields(array $source, array $fields, int $maxLength = 240): array {
    $result = [];
    foreach ($fields as $field) {
        $value = normalize_optional_text($source[$field] ?? null, $maxLength);
        if ($value !== null) {
            $result[$field] = $value;
        }
    }
    return $result;
}

function normalize_date_fields(array $source, array $fields): array {
    $result = [];
    foreach ($fields as $field) {
        $value = normalize_date_value($source[$field] ?? null);
        if ($value !== null) {
            $result[$field] = $value;
        }
    }
    return $result;
}

function normalize_boolean_fields(array $source, array $fields): array {
    $result = [];
    foreach ($fields as $field) {
        if (!array_key_exists($field, $source)) {
            continue;
        }

        $value = $source[$field];
        if (is_bool($value)) {
            $result[$field] = $value;
            continue;
        }

        if (is_int($value)) {
            $result[$field] = $value === 1;
            continue;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if (in_array($normalized, ['true', '1', 'yes', 'y', 'i_confirm', 'i_agree'], true)) {
                $result[$field] = true;
            } elseif (in_array($normalized, ['false', '0', 'no', 'n', 'i_decline', 'i_disagree'], true)) {
                $result[$field] = false;
            }
        }
    }
    return $result;
}

function normalize_csv_text_list(mixed $value, int $maxItems = 12, int $maxItemLength = 160): array {
    if (!is_string($value) && !is_array($value)) {
        return [];
    }

    $items = [];
    $rawItems = is_array($value) ? $value : explode(',', $value);
    foreach ($rawItems as $item) {
        $clean = normalize_optional_text($item, $maxItemLength);
        if ($clean !== null) {
            $items[] = $clean;
        }
    }

    return array_slice(array_values(array_unique($items)), 0, $maxItems);
}

function normalize_seafarer_workspace_metadata(mixed $value): array {
    if (!is_array($value)) {
        return [];
    }

    $workspace = [];

    $personal = $value['personal_details'] ?? null;
    if (is_array($personal)) {
        $personalData = array_merge(
            normalize_text_fields($personal, ['place_of_birth', 'gender', 'civil_status'], 160),
            normalize_date_fields($personal, ['date_of_birth'])
        );
        if ($personalData !== []) {
            $workspace['personal_details'] = $personalData;
        }
    }

    $nameComponents = $value['name_components'] ?? null;
    if (is_array($nameComponents)) {
        $nameData = normalize_text_fields($nameComponents, [
            'surname',
            'first_name',
            'middle_name',
            'citizenship',
            'religion',
        ], 240);
        if ($nameData !== []) {
            $workspace['name_components'] = $nameData;
        }
    }

    $contact = $value['contact_and_addresses'] ?? null;
    if (is_array($contact)) {
        $contactData = array_merge(
            normalize_text_fields($contact, [
                'permanent_address',
                'residence_country',
                'residence_city',
                'nearest_airport',
                'secondary_mobile_number',
                'home_phone',
                'emergency_contact_name',
                'emergency_contact_relation',
                'emergency_contact_phone',
            ], 500)
        );
        if ($contactData !== []) {
            $workspace['contact_and_addresses'] = $contactData;
        }
    }

    $addressDetails = $value['address_details'] ?? null;
    if (is_array($addressDetails)) {
        $addressData = normalize_text_fields($addressDetails, [
            'permanent_street',
            'permanent_house',
                'permanent_flat',
                'permanent_region',
                'permanent_post_code',
                'permanent_comments',
                'registration_street',
                'registration_house',
                'registration_flat',
                'registration_city',
                'registration_country',
                'registration_region',
                'registration_post_code',
                'registration_comments',
            ], 500);
        if ($addressData !== []) {
            $workspace['address_details'] = $addressData;
        }
    }

    $familyDetails = $value['family_details'] ?? null;
    if (is_array($familyDetails)) {
        $familyData = array_merge(
            normalize_text_fields($familyDetails, [
                'kin_surname',
                'kin_first_name',
                'kin_middle_name',
                'kin_gender',
                'kin_relation',
                'kin_mobile',
                'kin_home_phone',
                'kin_email',
                'kin_address',
                'children_records',
            ], 1200),
            normalize_date_fields($familyDetails, ['kin_birthdate'])
        );
        if ($familyData !== []) {
            $workspace['family_details'] = $familyData;
        }
    }

    $physicalDetails = $value['physical_details'] ?? null;
    if (is_array($physicalDetails)) {
        $physicalData = normalize_text_fields($physicalDetails, [
            'height_cm',
            'weight_kg',
            'hair_colour',
            'eyes_colour',
            'uniform_size',
            'shoes_size',
        ], 160);
        if ($physicalData !== []) {
            $workspace['physical_details'] = $physicalData;
        }
    }

    $identityDocuments = $value['identity_documents'] ?? null;
    if (is_array($identityDocuments)) {
        $identityData = array_merge(
            normalize_text_fields($identityDocuments, [
                'civil_passport_series',
                'civil_passport_number',
                'civil_passport_authority',
                'foreign_passport_series',
                'foreign_passport_number',
                'foreign_passport_authority',
                'seafarer_id_series',
                'seafarer_id_number',
                'seafarer_id_authority',
                'seamans_book_series',
                'seamans_book_number',
                'seamans_book_authority',
                'usa_visa_type',
                'usa_visa_post',
                'schengen_visa_number',
                'schengen_visa_post',
            ], 500),
            normalize_date_fields($identityDocuments, [
                'civil_passport_issued',
                'foreign_passport_issued',
                'foreign_passport_expiry',
                'seafarer_id_issued',
                'seafarer_id_expiry',
                'seamans_book_issued',
                'seamans_book_expiry',
                'usa_visa_issued',
                'usa_visa_expiry',
                'schengen_visa_issued',
                'schengen_visa_expiry',
            ])
        );
        if ($identityData !== []) {
            $workspace['identity_documents'] = $identityData;
        }
    }

    $qualification = $value['qualifications'] ?? null;
    if (is_array($qualification)) {
        $qualificationData = array_merge(
            normalize_text_fields($qualification, [
                'coc_type',
                'coc_number',
                'coc_issuing_country',
                'education_institution',
                'education_grade',
            ], 240),
            normalize_date_fields($qualification, ['coc_expiry'])
        );
        $trainingCourses = normalize_csv_text_list($qualification['training_courses'] ?? null, 20, 220);
        if ($trainingCourses !== []) {
            $qualificationData['training_courses'] = $trainingCourses;
        }
        if ($qualificationData !== []) {
            $workspace['qualifications'] = $qualificationData;
        }
    }

    $qualificationDetails = $value['qualification_details'] ?? null;
    if (is_array($qualificationDetails)) {
        $qualificationDetailsData = array_merge(
            normalize_text_fields($qualificationDetails, [
                'coc_institute',
                'education_specialisation',
                'education_comments',
                'endorsement_type',
                'endorsement_institute',
                'endorsement_number',
                'endorsement_comments',
                'training_institute',
                'training_number',
                'training_comments',
            ], 500),
            normalize_date_fields($qualificationDetails, [
                'coc_issued',
                'education_from',
                'education_to',
                'education_issued_on',
                'endorsement_issued',
                'endorsement_expiry',
                'training_issued',
                'training_expiry',
            ])
        );
        if ($qualificationDetailsData !== []) {
            $workspace['qualification_details'] = $qualificationDetailsData;
        }
    }

    $seaService = $value['sea_service'] ?? null;
    if (is_array($seaService)) {
        $seaServiceData = array_merge(
            normalize_text_fields($seaService, [
                'last_vessel_name',
                'last_vessel_type',
                'last_rank',
                'flag_country',
                'management_company',
                'engine_type',
                'engine_power',
                'deadweight',
                'sea_service_history',
            ], 240),
            normalize_date_fields($seaService, ['service_from', 'service_to'])
        );
        if ($seaServiceData !== []) {
            $workspace['sea_service'] = $seaServiceData;
        }
    }

    $references = $value['previous_employer_references'] ?? null;
    if (is_array($references)) {
        $referenceData = normalize_text_fields($references, [
            'reference_company_1',
            'reference_person_1',
            'reference_phone_1',
            'reference_email_1',
            'reference_company_2',
            'reference_person_2',
            'reference_phone_2',
            'reference_email_2',
        ], 320);
        if ($referenceData !== []) {
            $workspace['previous_employer_references'] = $referenceData;
        }
    }

    $medicalHistory = $value['medical_history'] ?? null;
    if (is_array($medicalHistory)) {
        $medicalData = normalize_text_fields($medicalHistory, [
            'signed_off_sick',
            'sick_details',
            'injury_details',
            'operated',
            'surgery_details',
        ], 1200);
        if ($medicalData !== []) {
            $workspace['medical_history'] = $medicalData;
        }
    }

    $publication = $value['matching_publication'] ?? null;
    if (is_array($publication)) {
        $publicationData = normalize_text_fields($publication, [
            'information_source',
            'candidate_summary',
            'publish_to_matching',
            'data_processing_confirmation',
        ], 1200);
        if ($publicationData !== []) {
            $workspace['matching_publication'] = $publicationData;
        }
    }

    $consentDetails = $value['consent_details'] ?? null;
    if (is_array($consentDetails)) {
        $consentData = array_merge(
            normalize_text_fields($consentDetails, [
                'obligation_place',
                'obligation_confirmation',
                'agreement_value',
                'consent_bundle_version',
                'source_comments',
            ], 1000),
            normalize_date_fields($consentDetails, [
                'obligation_date',
                'agreement_date',
            ]),
            normalize_boolean_fields($consentDetails, [
                'agreement_confirmed',
                'personal_data_consent',
                'no_fee_acknowledged',
                'optional_services_acknowledged',
                'data_accuracy_confirmed',
                'complaint_policy_acknowledged',
            ])
        );
        if ($consentData !== []) {
            $workspace['consent_details'] = $consentData;
        }
    }

    return $workspace;
}

function normalize_seafarer_document_metadata(array $body): ?string {
    $rawMetadata = $body['document_metadata'] ?? null;
    if (!is_array($rawMetadata)) {
        return null;
    }

    $metadata = [];
    $certificateStatus = normalize_allowed_document_value(
        $rawMetadata['certificate_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $stcwStatus = normalize_allowed_document_value(
        $rawMetadata['stcw_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $visaStatus = normalize_allowed_document_value(
        $rawMetadata['visa_status'] ?? null,
        ['unknown', 'not_required', 'required', 'ready']
    );
    $passportExpiry = normalize_date_value($rawMetadata['passport_expiry'] ?? null);
    $medicalExpiry = normalize_date_value($rawMetadata['medical_expiry'] ?? null);
    $notes = normalize_optional_text($rawMetadata['notes'] ?? null, 1200);

    if ($certificateStatus !== null) {
        $metadata['certificate_status'] = $certificateStatus;
    }
    if ($stcwStatus !== null) {
        $metadata['stcw_status'] = $stcwStatus;
    }
    if ($passportExpiry !== null) {
        $metadata['passport_expiry'] = $passportExpiry;
    }
    if ($medicalExpiry !== null) {
        $metadata['medical_expiry'] = $medicalExpiry;
    }
    if ($visaStatus !== null) {
        $metadata['visa_status'] = $visaStatus;
    }
    if ($notes !== null) {
        $metadata['notes'] = $notes;
    }

    $workspace = normalize_seafarer_workspace_metadata($rawMetadata['seafarer_workspace'] ?? null);
    if ($workspace !== []) {
        $metadata['seafarer_workspace'] = $workspace;
    }

    if ($metadata === []) {
        return null;
    }

    $json = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? null : $json;
}

function cpg_normalize_seafarer_document_readiness(array $payload): array {
    $metadata = [];
    $certificateStatus = normalize_allowed_document_value(
        $payload['certificate_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $stcwStatus = normalize_allowed_document_value(
        $payload['stcw_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $visaStatus = normalize_allowed_document_value(
        $payload['visa_status'] ?? null,
        ['unknown', 'not_required', 'required', 'ready']
    );
    $passportExpiry = normalize_date_value($payload['passport_expiry'] ?? null);
    $medicalExpiry = normalize_date_value($payload['medical_expiry'] ?? null);
    $notes = normalize_optional_text($payload['notes'] ?? null, 1200);

    if ($certificateStatus !== null) {
        $metadata['certificate_status'] = $certificateStatus;
    }
    if ($stcwStatus !== null) {
        $metadata['stcw_status'] = $stcwStatus;
    }
    if ($passportExpiry !== null) {
        $metadata['passport_expiry'] = $passportExpiry;
    }
    if ($medicalExpiry !== null) {
        $metadata['medical_expiry'] = $medicalExpiry;
    }
    if ($visaStatus !== null) {
        $metadata['visa_status'] = $visaStatus;
    }
    if ($notes !== null) {
        $metadata['notes'] = $notes;
    }

    return $metadata;
}

function cpg_seafarer_workspace_tables_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $result = api_query(
        "SELECT count(*)::int AS table_count
         FROM information_schema.tables
         WHERE table_schema = 'crewportglobal'
           AND table_name IN (
             'seafarer_person_details',
             'seafarer_emergency_contacts',
             'seafarer_education_records',
             'seafarer_certificates',
             'seafarer_training_records',
             'seafarer_sea_service_records',
             'seafarer_medical_declarations',
             'seafarer_matching_preferences',
             'seafarer_publication_snapshots'
           )"
    );
    $row = pg_fetch_assoc($result);
    $ready = is_array($row) && (int) $row['table_count'] === 9;
    return $ready;
}

function cpg_decode_json_object(?string $json): array {
    if ($json === null || trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function cpg_workspace_section(array $workspace, string $key): array {
    $value = $workspace[$key] ?? null;
    return is_array($value) ? $value : [];
}

function cpg_workspace_text(array $source, string $key, int $maxLength = 500): ?string {
    return normalize_optional_text($source[$key] ?? null, $maxLength);
}

function cpg_workspace_date(array $source, string $key): ?string {
    return normalize_date_value($source[$key] ?? null);
}

function cpg_workspace_country_code(array $source, string $key): ?string {
    return normalize_country_code($source[$key] ?? null);
}

function cpg_workspace_number(mixed $value): ?float {
    if (!is_numeric($value)) {
        return null;
    }
    $number = (float) $value;
    return $number >= 0 ? $number : null;
}

function cpg_workspace_reference_value_id(?string $catalogCode, ?string $label): ?string {
    if ($catalogCode === null || $label === null || trim($label) === '') {
        return null;
    }

    $result = api_query(
        "SELECT rv.reference_value_id
         FROM crewportglobal.reference_catalog_values rv
         JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
         WHERE rc.catalog_code = $1
           AND rc.is_active = TRUE
           AND rc.publication_state = 'published'
           AND rv.is_active = TRUE
           AND rv.publication_state = 'published'
           AND (
             lower(rv.display_name) = lower($2)
             OR lower(rv.source_value) = lower($2)
             OR lower(rv.value_code) = lower($2)
           )
         ORDER BY rv.sort_order ASC, rv.display_name ASC
         LIMIT 1",
        [$catalogCode, $label]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? (string) $row['reference_value_id'] : null;
}

function cpg_workspace_json(array $payload): string {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? '{}' : $json;
}

function cpg_pg_text_array_literal(array $items): string {
    $quoted = [];
    foreach ($items as $item) {
        if (!is_string($item)) {
            continue;
        }
        $quoted[] = '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $item) . '"';
    }
    return '{' . implode(',', $quoted) . '}';
}

function cpg_pg_text_array_values(mixed $value): array {
    if (is_array($value)) {
        return array_values(array_filter(array_map(static fn($item): string => trim((string) $item), $value), static fn(string $item): bool => $item !== ''));
    }
    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $text = trim($value);
    if ($text[0] === '{' && substr($text, -1) === '}') {
        $text = substr($text, 1, -1);
    }
    if ($text === '') {
        return [];
    }

    return array_values(array_filter(array_map(static function (string $item): string {
        $item = trim($item);
        if (strlen($item) >= 2 && $item[0] === '"' && substr($item, -1) === '"') {
            $item = substr($item, 1, -1);
        }
        return str_replace(['\\"', '\\\\'], ['"', '\\'], trim($item));
    }, str_getcsv($text)), static fn(string $item): bool => $item !== ''));
}

function cpg_workspace_repeated_lines(mixed $value, int $maxRows = 30, int $maxLength = 1200): array {
    if (is_array($value)) {
        $rows = [];
        foreach ($value as $item) {
            if (is_array($item)) {
                $rows[] = $item;
                continue;
            }
            $line = normalize_optional_text($item, $maxLength);
            if ($line !== null) {
                $rows[] = $line;
            }
        }
        return array_slice($rows, 0, $maxRows);
    }

    $text = normalize_optional_text($value, $maxLength);
    if ($text === null) {
        return [];
    }

    $rows = preg_split('/\r\n|\r|\n/', $text) ?: [];
    $rows = array_values(array_filter(array_map(
        static fn (string $line): ?string => normalize_optional_text($line, $maxLength),
        $rows
    )));

    return array_slice($rows, 0, $maxRows);
}

function cpg_workspace_row_parts(string $line, int $maxParts): array {
    $delimiter = str_contains($line, '|') ? '/\|/' : '/,/';
    $parts = preg_split($delimiter, $line) ?: [];
    $normalized = [];
    foreach ($parts as $part) {
        $normalized[] = normalize_optional_text($part, 240);
    }
    while (count($normalized) < $maxParts) {
        $normalized[] = null;
    }
    return array_slice($normalized, 0, $maxParts);
}

function cpg_workspace_record_has_values(array $record, array $ignoredKeys = ['source_row', 'source_key', 'source_index', 'source_card']): bool {
    foreach ($record as $key => $value) {
        if (in_array((string) $key, $ignoredKeys, true)) {
            continue;
        }
        if (is_array($value) && cpg_workspace_record_has_values($value, $ignoredKeys)) {
            return true;
        }
        if (!is_array($value) && normalize_optional_text($value, 2000) !== null) {
            return true;
        }
    }
    return false;
}

function cpg_workspace_clean_record(array $record): array {
    $clean = [];
    foreach ($record as $key => $value) {
        if (is_array($value)) {
            $nested = cpg_workspace_clean_record($value);
            if ($nested !== []) {
                $clean[$key] = $nested;
            }
            continue;
        }
        if ($value !== null && $value !== '') {
            $clean[$key] = $value;
        }
    }
    return $clean;
}

function cpg_normalize_children_records(array $familyDetails): array {
    $records = [];
    foreach (cpg_workspace_repeated_lines($familyDetails['children_records'] ?? null, 20, 1200) as $index => $line) {
        if (!is_string($line)) {
            continue;
        }
        $lowerLine = strtolower(trim($line));
        if (in_array($lowerLine, ['no children', 'none', 'n/a', 'na'], true)) {
            continue;
        }
        [$surname, $firstName, $middleName, $relation, $birthdate, $gender] = cpg_workspace_row_parts($line, 6);
        $record = cpg_workspace_clean_record([
            'source_key' => 'children_records',
            'source_index' => $index + 1,
            'source_card' => 'PERS-008',
            'surname' => $surname,
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'relation' => $relation,
            'birthdate' => normalize_date_value((string) ($birthdate ?? '')),
            'birthdate_text' => normalize_date_value((string) ($birthdate ?? '')) === null ? $birthdate : null,
            'gender' => $gender,
            'source_row' => $line,
        ]);
        if (cpg_workspace_record_has_values($record)) {
            $records[] = $record;
        }
    }
    return $records;
}

function cpg_normalize_identity_document_records(array $identity): array {
    $definitions = [
        [
            'document_kind' => 'civil_passport',
            'source_card' => 'QUAL-001',
            'series' => $identity['civil_passport_series'] ?? null,
            'number' => $identity['civil_passport_number'] ?? null,
            'issued_at' => $identity['civil_passport_issued'] ?? null,
            'issuing_authority' => $identity['civil_passport_authority'] ?? null,
        ],
        [
            'document_kind' => 'foreign_passport',
            'source_card' => 'QUAL-001',
            'series' => $identity['foreign_passport_series'] ?? null,
            'number' => $identity['foreign_passport_number'] ?? null,
            'issued_at' => $identity['foreign_passport_issued'] ?? null,
            'expires_at' => $identity['foreign_passport_expiry'] ?? null,
            'issuing_authority' => $identity['foreign_passport_authority'] ?? null,
        ],
        [
            'document_kind' => 'seafarer_id',
            'source_card' => 'QUAL-001',
            'series' => $identity['seafarer_id_series'] ?? null,
            'number' => $identity['seafarer_id_number'] ?? null,
            'issued_at' => $identity['seafarer_id_issued'] ?? null,
            'expires_at' => $identity['seafarer_id_expiry'] ?? null,
            'issuing_authority' => $identity['seafarer_id_authority'] ?? null,
        ],
        [
            'document_kind' => 'seamans_book',
            'source_card' => 'QUAL-001',
            'series' => $identity['seamans_book_series'] ?? null,
            'number' => $identity['seamans_book_number'] ?? null,
            'issued_at' => $identity['seamans_book_issued'] ?? null,
            'expires_at' => $identity['seamans_book_expiry'] ?? null,
            'issuing_authority' => $identity['seamans_book_authority'] ?? null,
        ],
        [
            'document_kind' => 'usa_visa',
            'source_card' => 'QUAL-001',
            'visa_type' => $identity['usa_visa_type'] ?? null,
            'issued_at' => $identity['usa_visa_issued'] ?? null,
            'expires_at' => $identity['usa_visa_expiry'] ?? null,
            'issuing_post' => $identity['usa_visa_post'] ?? null,
        ],
        [
            'document_kind' => 'schengen_visa',
            'source_card' => 'QUAL-001',
            'number' => $identity['schengen_visa_number'] ?? null,
            'issued_at' => $identity['schengen_visa_issued'] ?? null,
            'expires_at' => $identity['schengen_visa_expiry'] ?? null,
            'issuing_post' => $identity['schengen_visa_post'] ?? null,
        ],
    ];

    return array_values(array_filter(array_map(
        static fn (array $record): array => cpg_workspace_clean_record($record),
        $definitions
    ), static fn (array $record): bool => cpg_workspace_record_has_values($record, ['document_kind', 'source_card'])));
}

function cpg_normalize_education_records(array $qualifications, array $details): array {
    $record = cpg_workspace_clean_record([
        'source_key' => 'education_records',
        'source_index' => 1,
        'source_card' => 'QUAL-002',
        'institution_name' => $qualifications['education_institution'] ?? null,
        'start_date' => $details['education_from'] ?? null,
        'completion_date' => $details['education_to'] ?? null,
        'field_of_study' => $details['education_specialisation'] ?? null,
        'grade_label' => $qualifications['education_grade'] ?? null,
        'issued_at' => $details['education_issued_on'] ?? null,
        'comments' => $details['education_comments'] ?? null,
    ]);

    return cpg_workspace_record_has_values($record) ? [$record] : [];
}

function cpg_normalize_coc_certificate_records(array $qualifications, array $details): array {
    $record = cpg_workspace_clean_record([
        'source_key' => 'coc_certificate_records',
        'source_index' => 1,
        'source_card' => 'QUAL-003',
        'certificate_group' => 'competency',
        'certificate_type_label' => $qualifications['coc_type'] ?? null,
        'issuing_authority' => $details['coc_institute'] ?? null,
        'certificate_number' => $qualifications['coc_number'] ?? null,
        'issuing_country_code' => normalize_country_code($qualifications['coc_issuing_country'] ?? null),
        'issued_at' => $details['coc_issued'] ?? null,
        'expires_at' => $qualifications['coc_expiry'] ?? null,
        'comments' => $details['coc_comments'] ?? null,
    ]);

    return cpg_workspace_record_has_values($record, ['source_key', 'source_index', 'source_card', 'certificate_group']) ? [$record] : [];
}

function cpg_normalize_endorsement_records(array $details): array {
    $record = cpg_workspace_clean_record([
        'source_key' => 'endorsement_records',
        'source_index' => 1,
        'source_card' => 'QUAL-004',
        'certificate_group' => 'endorsement',
        'certificate_type_label' => $details['endorsement_type'] ?? null,
        'issuing_authority' => $details['endorsement_institute'] ?? null,
        'certificate_number' => $details['endorsement_number'] ?? null,
        'issued_at' => $details['endorsement_issued'] ?? null,
        'expires_at' => $details['endorsement_expiry'] ?? null,
        'comments' => $details['endorsement_comments'] ?? null,
    ]);

    return cpg_workspace_record_has_values($record, ['source_key', 'source_index', 'source_card', 'certificate_group']) ? [$record] : [];
}

function cpg_normalize_training_course_records(array $qualifications, array $details): array {
    $courseLabels = normalize_csv_text_list($qualifications['training_courses'] ?? null, 40, 220);
    $records = [];
    foreach ($courseLabels as $index => $courseLabel) {
        $record = cpg_workspace_clean_record([
            'source_key' => 'training_course_records',
            'source_index' => $index + 1,
            'source_card' => 'QUAL-005',
            'training_type_label' => $courseLabel,
            'issuing_center' => $details['training_institute'] ?? null,
            'certificate_number' => $details['training_number'] ?? null,
            'issued_at' => $details['training_issued'] ?? null,
            'expires_at' => $details['training_expiry'] ?? null,
            'comments' => $details['training_comments'] ?? null,
        ]);
        if (cpg_workspace_record_has_values($record)) {
            $records[] = $record;
        }
    }
    return $records;
}

function cpg_normalize_sea_service_records(array $seaService, array $flatProfile): array {
    $records = [];
    $primary = cpg_workspace_clean_record([
        'source_key' => 'latest_sea_service',
        'source_index' => 1,
        'source_card' => 'EXP-001',
        'vessel_name' => $seaService['last_vessel_name'] ?? null,
        'vessel_type_label' => $seaService['last_vessel_type'] ?? null,
        'deadweight' => $seaService['deadweight'] ?? null,
        'engine_type' => $seaService['engine_type'] ?? null,
        'engine_power' => $seaService['engine_power'] ?? null,
        'flag_country_code' => normalize_country_code($seaService['flag_country'] ?? null),
        'management_company' => $seaService['management_company'] ?? null,
        'rank_label' => $seaService['last_rank'] ?? null,
        'department' => normalize_optional_text($flatProfile['department'] ?? null, 40),
        'service_from' => $seaService['service_from'] ?? null,
        'service_to' => $seaService['service_to'] ?? null,
    ]);
    if (cpg_workspace_record_has_values($primary, ['source_key', 'source_index', 'source_card', 'department'])) {
        $records[] = $primary;
    }

    foreach (cpg_workspace_repeated_lines($seaService['sea_service_history'] ?? null, 30, 1600) as $index => $line) {
        if (!is_string($line)) {
            continue;
        }
        [$vesselName, $vesselType, $deadweight, $engineType, $enginePower, $flagCountry, $company, $rank, $from, $to] = cpg_workspace_row_parts($line, 10);
        $record = cpg_workspace_clean_record([
            'source_key' => 'sea_service_history',
            'source_index' => $index + 1,
            'source_card' => 'EXP-001',
            'vessel_name' => $vesselName,
            'vessel_type_label' => $vesselType,
            'deadweight' => $deadweight,
            'engine_type' => $engineType,
            'engine_power' => $enginePower,
            'flag_country_code' => normalize_country_code((string) ($flagCountry ?? '')),
            'flag_country_label' => normalize_country_code((string) ($flagCountry ?? '')) === null ? $flagCountry : null,
            'management_company' => $company,
            'rank_label' => $rank,
            'department' => normalize_optional_text($flatProfile['department'] ?? null, 40),
            'service_from' => normalize_date_value((string) ($from ?? '')),
            'service_from_text' => normalize_date_value((string) ($from ?? '')) === null ? $from : null,
            'service_to' => normalize_date_value((string) ($to ?? '')),
            'service_to_text' => normalize_date_value((string) ($to ?? '')) === null ? $to : null,
            'source_row' => $line,
        ]);
        if (cpg_workspace_record_has_values($record)) {
            $records[] = $record;
        }
    }

    return $records;
}

function cpg_normalize_previous_employer_reference_records(array $references): array {
    $records = [];
    for ($index = 1; $index <= 2; $index++) {
        $record = cpg_workspace_clean_record([
            'source_key' => 'previous_employer_reference',
            'source_index' => $index,
            'source_card' => 'EXP-002',
            'company_name' => $references["reference_company_{$index}"] ?? null,
            'person_in_charge' => $references["reference_person_{$index}"] ?? null,
            'telephone' => $references["reference_phone_{$index}"] ?? null,
            'email' => $references["reference_email_{$index}"] ?? null,
        ]);
        if (cpg_workspace_record_has_values($record)) {
            $records[] = $record;
        }
    }
    return $records;
}

function cpg_normalize_medical_declaration_records(array $medical): array {
    $definitions = [
        [
            'source_key' => 'signed_off_sick',
            'source_index' => 1,
            'source_card' => 'MED-001',
            'question' => 'Signed off sick',
            'answer' => $medical['signed_off_sick'] ?? null,
            'details' => $medical['sick_details'] ?? null,
        ],
        [
            'source_key' => 'injury_last_10_years',
            'source_index' => 2,
            'source_card' => 'MED-001',
            'question' => 'Injury / health problem during last 10 years',
            'details' => $medical['injury_details'] ?? null,
        ],
        [
            'source_key' => 'operated',
            'source_index' => 3,
            'source_card' => 'MED-001',
            'question' => 'Operated',
            'answer' => $medical['operated'] ?? null,
            'details' => $medical['surgery_details'] ?? null,
        ],
    ];

    return array_values(array_filter(array_map(
        static fn (array $record): array => cpg_workspace_clean_record($record),
        $definitions
    ), static fn (array $record): bool => cpg_workspace_record_has_values($record, ['source_key', 'source_index', 'source_card', 'question'])));
}

function cpg_source_card_document_type_map(): array {
    return [
        'passport_or_id' => ['QUAL-001'],
        'seamans_book' => ['QUAL-001'],
        'certificate_of_competency' => ['QUAL-003'],
        'stcw_certificate' => ['QUAL-005'],
        'training_certificate' => ['QUAL-005'],
        'language_certificate' => ['QUAL-005'],
        'experience_record' => ['EXP-001'],
        'medical_certificate' => ['MED-001'],
        'other_professional_evidence' => ['QUAL-004', 'QUAL-005'],
        'maritime_cv' => ['EXP-001', 'EXP-002'],
    ];
}

function cpg_seafarer_source_repeated_records(array $documentMetadata, array $flatProfile = []): array {
    $workspace = isset($documentMetadata['seafarer_workspace']) && is_array($documentMetadata['seafarer_workspace'])
        ? normalize_seafarer_workspace_metadata($documentMetadata['seafarer_workspace'])
        : [];

    $family = cpg_workspace_section($workspace, 'family_details');
    $identity = cpg_workspace_section($workspace, 'identity_documents');
    $qualifications = cpg_workspace_section($workspace, 'qualifications');
    $qualificationDetails = cpg_workspace_section($workspace, 'qualification_details');
    $seaService = cpg_workspace_section($workspace, 'sea_service');
    $references = cpg_workspace_section($workspace, 'previous_employer_references');
    $medical = cpg_workspace_section($workspace, 'medical_history');

    return [
        'children_records' => cpg_normalize_children_records($family),
        'identity_documents_and_visas' => cpg_normalize_identity_document_records($identity),
        'education_records' => cpg_normalize_education_records($qualifications, $qualificationDetails),
        'coc_certificates' => cpg_normalize_coc_certificate_records($qualifications, $qualificationDetails),
        'endorsements' => cpg_normalize_endorsement_records($qualificationDetails),
        'training_courses' => cpg_normalize_training_course_records($qualifications, $qualificationDetails),
        'sea_service_history' => cpg_normalize_sea_service_records($seaService, $flatProfile),
        'previous_employer_references' => cpg_normalize_previous_employer_reference_records($references),
        'medical_declarations' => cpg_normalize_medical_declaration_records($medical),
    ];
}

function cpg_seafarer_source_card_document_links(string $userId): array {
    $documentsByCard = [];
    foreach (cpg_seafarer_review_card_codes() as $cardCode) {
        if (preg_match('/^(PERS|QUAL|EXP|MED)-\d{3}$/', $cardCode) === 1) {
            $documentsByCard[$cardCode] = [];
        }
    }

    $typeMap = cpg_source_card_document_type_map();
    $documents = cpg_fetch_all_assoc(
        "SELECT document_id::text AS document_id,
                document_type,
                original_filename,
                file_size_bytes,
                scan_status,
                review_status,
                uploaded_at::text AS uploaded_at
         FROM crewportglobal.uploaded_documents
         WHERE draft_id = $1::uuid
           AND form_type = 'seafarer'
           AND hidden_from_user_at IS NULL
         ORDER BY uploaded_at DESC",
        [$userId]
    );

    foreach ($documents as $document) {
        $cards = $typeMap[(string) ($document['document_type'] ?? '')] ?? [];
        foreach ($cards as $cardCode) {
            if (!isset($documentsByCard[$cardCode])) {
                $documentsByCard[$cardCode] = [];
            }
            $documentsByCard[$cardCode][] = [
                'document_id' => $document['document_id'],
                'document_type' => $document['document_type'],
                'original_filename' => $document['original_filename'],
                'file_size_bytes' => isset($document['file_size_bytes']) ? (int) $document['file_size_bytes'] : null,
                'scan_status' => $document['scan_status'],
                'review_status' => $document['review_status'],
                'uploaded_at' => $document['uploaded_at'],
            ];
        }
    }

    return $documentsByCard;
}

function cpg_normalize_visibility_scope(mixed $value, string $default = 'owner_full'): string {
    if (!is_string($value)) {
        return $default;
    }

    $scope = trim($value);
    return in_array($scope, ['owner_full', 'operator_general', 'cabinet_summary', 'employer_candidate'], true)
        ? $scope
        : $default;
}

function cpg_seafarer_source_card_visibility_map(): array {
    return [
        'PERS-001' => 'system_only',
        'PERS-002' => 'public_candidate_summary',
        'PERS-003' => 'operator_review',
        'PERS-004' => 'operator_review',
        'PERS-005' => 'operator_review',
        'PERS-006' => 'employer_after_candidate_consent',
        'PERS-007' => 'internal_compliance',
        'PERS-008' => 'internal_compliance',
        'PERS-009' => 'operator_review',
        'QUAL-001' => 'operator_review',
        'QUAL-002' => 'operator_review',
        'QUAL-003' => 'employer_after_candidate_consent',
        'QUAL-004' => 'employer_after_candidate_consent',
        'QUAL-005' => 'employer_after_candidate_consent',
        'EXP-001' => 'employer_after_candidate_consent',
        'EXP-002' => 'internal_compliance',
        'MED-001' => 'restricted_medical',
        'MED-002' => 'internal_compliance',
        'MED-003' => 'internal_compliance',
        'MED-004' => 'internal_compliance',
        'MED-005' => 'system_only',
    ];
}

function cpg_seafarer_field_visibility_matrix(): array {
    return [
        'name_components.surname' => 'operator_review',
        'name_components.first_name' => 'operator_review',
        'name_components.middle_name' => 'operator_review',
        'name_components.citizenship' => 'public_candidate_summary',
        'name_components.religion' => 'internal_compliance',
        'contact_and_addresses.residence_country' => 'public_candidate_summary',
        'contact_and_addresses.residence_city' => 'public_candidate_summary',
        'contact_and_addresses.nearest_airport' => 'public_candidate_summary',
        'contact_and_addresses.secondary_mobile_number' => 'operator_review',
        'contact_and_addresses.home_phone' => 'operator_review',
        'address_details.*' => 'operator_review',
        'family_details.kin_*' => 'internal_compliance',
        'family_details.children_records' => 'internal_compliance',
        'physical_details.height_cm' => 'operator_review',
        'physical_details.weight_kg' => 'operator_review',
        'physical_details.hair_colour' => 'internal_compliance',
        'physical_details.eyes_colour' => 'internal_compliance',
        'physical_details.uniform_size' => 'operator_review',
        'physical_details.shoes_size' => 'operator_review',
        'identity_documents.*_number' => 'operator_review',
        'identity_documents.*_series' => 'operator_review',
        'identity_documents.*_authority' => 'operator_review',
        'identity_documents.*_post' => 'operator_review',
        'identity_documents.*_expiry' => 'employer_after_candidate_consent',
        'qualifications.*' => 'employer_after_candidate_consent',
        'qualification_details.*' => 'employer_after_candidate_consent',
        'sea_service.*' => 'employer_after_candidate_consent',
        'previous_employer_references.*' => 'internal_compliance',
        'medical_history.*' => 'restricted_medical',
        'matching_publication.candidate_summary' => 'employer_after_candidate_consent',
        'matching_publication.publish_to_matching' => 'internal_compliance',
        'matching_publication.data_processing_confirmation' => 'internal_compliance',
        'consent_details.*' => 'internal_compliance',
    ];
}

function cpg_seafarer_consent_event_model(): array {
    return [
        'implementation_status' => cpg_seafarer_consent_table_ready()
            ? 'implemented_additive_table_api'
            : 'planned_migration_required',
        'required_consent_types' => cpg_seafarer_consent_types(),
        'required_fields' => [
            'consent_id',
            'seafarer_profile_id',
            'draft_id',
            'consent_type',
            'purpose',
            'legal_basis',
            'text_version',
            'language',
            'accepted_at',
            'withdrawn_at',
            'source_page',
            'actor_user_id',
        ],
        'current_boundary' => 'Current confirmation fields remain saved, but they are not treated as a final all-purpose consent event model.',
    ];
}

function cpg_seafarer_consent_types(): array {
    return [
        'profile_review',
        'matching_preparation',
        'employer_sharing',
        'document_verification',
        'sensitive_medical_processing',
        'reference_contact_verification',
    ];
}

function cpg_seafarer_required_presentation_consent_types(): array {
    return ['matching_preparation', 'employer_sharing'];
}

function cpg_seafarer_consent_purpose(string $consentType): string {
    return match ($consentType) {
        'profile_review' => 'Human review of seafarer profile data',
        'matching_preparation' => 'Preparation of a reviewed matching summary',
        'employer_sharing' => 'Sharing an approved employer-safe candidate summary',
        'document_verification' => 'Verification of uploaded document readiness',
        'sensitive_medical_processing' => 'Restricted processing of medical declaration details',
        'reference_contact_verification' => 'Verification of previous-employer reference contacts',
        default => 'CrewPortGlobal seafarer consent event',
    };
}

function cpg_normalize_seafarer_consent_type(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $type = trim($value);
    return in_array($type, cpg_seafarer_consent_types(), true) ? $type : null;
}

function cpg_seafarer_consent_table_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $result = api_query("SELECT to_regclass('crewportglobal.seafarer_consent_events') AS table_name");
    $row = pg_fetch_assoc($result);
    $ready = is_array($row) && is_string($row['table_name'] ?? null) && $row['table_name'] !== '';
    return $ready;
}

function cpg_seafarer_profile_id_for_user(string $userId): ?string {
    $profile = cpg_fetch_one_assoc(
        'SELECT seafarer_profile_id
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );

    return $profile !== null && isset($profile['seafarer_profile_id'])
        ? (string) $profile['seafarer_profile_id']
        : null;
}

function cpg_seafarer_active_consent_events(string $userId): array {
    if (!cpg_seafarer_consent_table_ready()) {
        return [];
    }

    $result = api_query(
        "SELECT DISTINCT ON (consent_type)
                consent_id,
                seafarer_profile_id,
                draft_id,
                consent_type,
                purpose,
                legal_basis,
                text_version,
                language,
                accepted_at,
                withdrawn_at,
                source_page,
                actor_user_id,
                actor_type,
                metadata,
                created_at,
                updated_at
         FROM crewportglobal.seafarer_consent_events
         WHERE draft_id = $1
           AND accepted_at IS NOT NULL
           AND withdrawn_at IS NULL
         ORDER BY consent_type, accepted_at DESC, created_at DESC",
        [$userId]
    );

    $events = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $events[(string) $row['consent_type']] = [
            'consent_id' => $row['consent_id'],
            'seafarer_profile_id' => $row['seafarer_profile_id'],
            'draft_id' => $row['draft_id'],
            'consent_type' => $row['consent_type'],
            'purpose' => $row['purpose'],
            'legal_basis' => $row['legal_basis'],
            'text_version' => $row['text_version'],
            'language' => $row['language'],
            'accepted_at' => $row['accepted_at'],
            'withdrawn_at' => $row['withdrawn_at'],
            'source_page' => $row['source_page'],
            'actor_user_id' => $row['actor_user_id'],
            'actor_type' => $row['actor_type'],
            'metadata' => cpg_decode_json_object($row['metadata'] ?? null),
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    return $events;
}

function cpg_seafarer_consent_summary(string $userId): array {
    $active = cpg_seafarer_active_consent_events($userId);
    return [
        'store_ready' => cpg_seafarer_consent_table_ready(),
        'required_consent_types' => cpg_seafarer_consent_types(),
        'required_for_employer_presentation' => cpg_seafarer_required_presentation_consent_types(),
        'active_consent_types' => array_keys($active),
        'active_consents' => array_values($active),
    ];
}

function cpg_write_seafarer_consent_event(
    string $userId,
    string $consentType,
    string $accessModel,
    array $body
): array {
    if (!cpg_seafarer_consent_table_ready()) {
        api_error(503, 'seafarer_consent_store_missing', 'Seafarer consent event table is not available');
    }

    $profileId = cpg_seafarer_profile_id_for_user($userId);
    if ($profileId === null) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    $purpose = normalize_optional_text($body['purpose'] ?? null, 500) ?? cpg_seafarer_consent_purpose($consentType);
    $legalBasis = normalize_optional_text($body['legal_basis'] ?? null, 160) ?? 'explicit_consent';
    $textVersion = normalize_optional_text($body['text_version'] ?? null, 120) ?? 'cpg-seafarer-consent-2026-05-19';
    $language = normalize_optional_text($body['language'] ?? null, 16) ?? 'en';
    if (!preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $language)) {
        api_error(400, 'invalid_consent_language', 'language must use a short language tag such as en or ru');
    }
    $sourcePage = normalize_optional_text($body['source_page'] ?? null, 240) ?? 'api';
    $metadata = isset($body['metadata']) && is_array($body['metadata']) ? $body['metadata'] : [];
    $actorType = $accessModel === 'authenticated_session' ? 'owner' : 'transition_owner';

    $result = api_query(
        'INSERT INTO crewportglobal.seafarer_consent_events (
             seafarer_profile_id,
             draft_id,
             consent_type,
             purpose,
             legal_basis,
             text_version,
             language,
             accepted_at,
             source_page,
             actor_user_id,
             actor_type,
             metadata
         ) VALUES (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6,
             $7,
             now(),
             $8,
             $9,
             $10,
             $11::jsonb
         )
         RETURNING consent_id, consent_type, purpose, legal_basis, text_version, language, accepted_at, withdrawn_at, source_page, actor_type',
        [
            $profileId,
            $userId,
            $consentType,
            $purpose,
            $legalBasis,
            $textVersion,
            $language,
            $sourcePage,
            $userId,
            $actorType,
            cpg_workspace_json($metadata),
        ]
    );

    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(500, 'seafarer_consent_event_failed', 'Unable to record seafarer consent event');
    }

    write_audit_event('seafarer_consent_event_recorded', $userId, null, null, [
        'consent_id' => $row['consent_id'],
        'consent_type' => $consentType,
        'purpose' => $purpose,
        'legal_basis' => $legalBasis,
        'text_version' => $textVersion,
        'language' => $language,
        'source_page' => $sourcePage,
        'actor_type' => $actorType,
        'access_model' => $accessModel,
    ], 'seafarer_consent_events');

    return [
        'consent_id' => $row['consent_id'],
        'consent_type' => $row['consent_type'],
        'purpose' => $row['purpose'],
        'legal_basis' => $row['legal_basis'],
        'text_version' => $row['text_version'],
        'language' => $row['language'],
        'accepted_at' => $row['accepted_at'],
        'withdrawn_at' => $row['withdrawn_at'],
        'source_page' => $row['source_page'],
        'actor_type' => $row['actor_type'],
    ];
}

function cpg_withdraw_seafarer_consent(string $userId, string $consentType, string $accessModel, array $body): array {
    if (!cpg_seafarer_consent_table_ready()) {
        api_error(503, 'seafarer_consent_store_missing', 'Seafarer consent event table is not available');
    }

    $reason = normalize_optional_text($body['reason'] ?? null, 500);
    $result = api_query(
        "UPDATE crewportglobal.seafarer_consent_events
         SET withdrawn_at = now(),
             updated_at = now(),
             metadata = metadata || $3::jsonb
         WHERE draft_id = $1
           AND consent_type = $2
           AND accepted_at IS NOT NULL
           AND withdrawn_at IS NULL
         RETURNING consent_id, consent_type, withdrawn_at",
        [
            $userId,
            $consentType,
            cpg_workspace_json([
                'withdraw_reason' => $reason,
                'withdraw_access_model' => $accessModel,
            ]),
        ]
    );

    $withdrawn = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $withdrawn[] = [
            'consent_id' => $row['consent_id'],
            'consent_type' => $row['consent_type'],
            'withdrawn_at' => $row['withdrawn_at'],
        ];
    }

    write_audit_event('seafarer_consent_event_withdrawn', $userId, null, null, [
        'consent_type' => $consentType,
        'withdrawn_count' => count($withdrawn),
        'reason' => $reason,
        'access_model' => $accessModel,
    ], 'seafarer_consent_events');

    return $withdrawn;
}

function cpg_seafarer_document_metadata_for_scope(array $metadata, string $scope): array {
    if ($scope === 'owner_full') {
        return $metadata;
    }

    $safeKeys = ['certificate_status', 'stcw_status', 'passport_expiry', 'medical_expiry', 'visa_status'];
    $safe = [];
    foreach ($safeKeys as $key) {
        if (isset($metadata[$key]) && $metadata[$key] !== '') {
            $safe[$key] = $metadata[$key];
        }
    }
    $safe['visibility_scope'] = $scope;
    $safe['sensitive_fields_redacted'] = true;
    return $safe;
}

function cpg_seafarer_public_document_summary(mixed $metadata): array {
    $decoded = is_string($metadata)
        ? cpg_decode_json_object($metadata)
        : (is_array($metadata) ? $metadata : []);
    return cpg_seafarer_document_metadata_for_scope($decoded, 'employer_candidate');
}

function cpg_approval_add_blocker(array &$blockers, string $code, string $message, array $details = []): void {
    $blocker = [
        'code' => $code,
        'message' => $message,
    ];
    if ($details !== []) {
        $blocker['details'] = $details;
    }
    $blockers[] = $blocker;
}

function cpg_employer_payload_forbidden_keys(): array {
    return [
        'document_metadata',
        'seafarer_workspace',
        'source_repeated_records',
        'source_card_document_links',
        'sensitive_payload',
        'medical_history',
        'children_records',
        'religion',
        'manager_notes',
        'authorization_rank',
        'authorization_type_of_ship',
        'authorization_date',
        'crewing_manager_name',
        'crewing_manager_signature',
        'previous_employer_references',
        'reference_person_1',
        'reference_phone_1',
        'reference_email_1',
        'contact_email',
        'contact_phone',
        'seafarer_email',
    ];
}

function cpg_payload_forbidden_key_hits(mixed $value, array $forbiddenKeys, string $path = ''): array {
    if (!is_array($value)) {
        return [];
    }

    $hits = [];
    foreach ($value as $key => $child) {
        $keyText = is_string($key) ? $key : (string) $key;
        $childPath = $path === '' ? $keyText : $path . '.' . $keyText;
        if (in_array($keyText, $forbiddenKeys, true)) {
            $hits[] = $childPath;
        }
        foreach (cpg_payload_forbidden_key_hits($child, $forbiddenKeys, $childPath) as $hit) {
            $hits[] = $hit;
        }
    }

    return array_values(array_unique($hits));
}

function cpg_employer_candidate_payload_probe(array $row): array {
    return [
        'vacancy_application_id' => $row['vacancy_application_id'] ?? null,
        'vacancy_request_id' => $row['vacancy_request_id'] ?? null,
        'application_status' => $row['application_status'] ?? null,
        'candidate_note' => $row['candidate_note'] ?? null,
        'seafarer_user_id' => $row['seafarer_user_id'] ?? null,
        'display_name' => $row['display_name'] ?? $row['seafarer_display_name'] ?? null,
        'primary_rank' => $row['primary_rank'] ?? null,
        'department' => $row['seafarer_department'] ?? $row['department'] ?? null,
        'availability_status' => $row['availability_status'] ?? null,
        'availability_date' => $row['availability_date'] ?? null,
        'country_code' => $row['seafarer_country_code'] ?? $row['country_code'] ?? null,
        'document_summary' => cpg_seafarer_public_document_summary($row['document_metadata'] ?? null),
        'candidate_visibility_scope' => 'employer_after_candidate_consent',
        'vacancy_title' => $row['vacancy_title'] ?? null,
        'vacancy_rank' => $row['vacancy_rank'] ?? null,
        'vacancy_department' => $row['vacancy_department'] ?? null,
    ];
}

function cpg_seafarer_presentation_required_source_cards(): array {
    return [
        'PERS-002',
        'PERS-003',
        'PERS-006',
        'QUAL-001',
        'QUAL-003',
        'QUAL-005',
        'EXP-001',
        'MED-003',
        'document_readiness',
        'matching_publication',
    ];
}

function cpg_vacancy_application_approval_guard(string $applicationId): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.seafarer_user_id,
            va.candidate_note,
            va.application_status,
            su.display_name AS seafarer_display_name,
            sp.seafarer_profile_id,
            sp.primary_rank,
            sp.department AS seafarer_department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code AS seafarer_country_code,
            sp.review_status AS seafarer_review_status,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department,
            vr.publication_status,
            ec.verification_status
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         WHERE va.vacancy_application_id = $1
         LIMIT 1",
        [$applicationId]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(404, 'review_item_not_found', 'Vacancy application review item not found');
    }

    $blockers = [];
    $warnings = [];
    $documentMetadata = cpg_decode_json_object(is_string($row['document_metadata'] ?? null) ? $row['document_metadata'] : null);
    $documentSummary = cpg_seafarer_public_document_summary($documentMetadata);
    $cardReviewStates = cpg_seafarer_workspace_card_review_states($row['document_metadata'] ?? null);
    $activeConsents = cpg_seafarer_active_consent_events((string) $row['seafarer_user_id']);
    $activeConsentTypes = array_keys($activeConsents);

    if (($row['verification_status'] ?? '') !== 'verified') {
        cpg_approval_add_blocker($blockers, 'company_not_verified', 'Employer company must be verified before candidate presentation');
    }
    if (($row['publication_status'] ?? '') !== 'published') {
        cpg_approval_add_blocker($blockers, 'vacancy_not_published', 'Vacancy request must be published before candidate presentation');
    }

    foreach ([
        'primary_rank' => 'Candidate rank is required',
        'seafarer_department' => 'Candidate department is required',
        'availability_status' => 'Candidate availability status is required',
    ] as $field => $message) {
        if (!cpg_seafarer_workspace_value_present($row[$field] ?? null)) {
            cpg_approval_add_blocker($blockers, 'critical_professional_data_missing', $message, ['field' => $field]);
        }
    }

    foreach ([
        'certificate_status' => 'COC / certificate readiness status must be ready',
        'stcw_status' => 'STCW / training readiness status must be ready',
    ] as $field => $message) {
        if (!cpg_readiness_status_is_ready($documentSummary[$field] ?? null)) {
            cpg_approval_add_blocker($blockers, 'document_readiness_not_ready', $message, ['field' => $field]);
        }
    }
    foreach ([
        'passport_expiry' => 'Passport expiry is required',
        'medical_expiry' => 'Medical certificate expiry is required',
        'visa_status' => 'Visa readiness is required',
    ] as $field => $message) {
        if (!cpg_seafarer_workspace_value_present($documentSummary[$field] ?? null)) {
            cpg_approval_add_blocker($blockers, 'document_summary_missing', $message, ['field' => $field]);
        }
    }

    if (!cpg_seafarer_consent_table_ready()) {
        cpg_approval_add_blocker($blockers, 'consent_event_store_missing', 'Versioned consent event store is not available');
    } else {
        foreach (cpg_seafarer_required_presentation_consent_types() as $consentType) {
            if (!isset($activeConsents[$consentType])) {
                cpg_approval_add_blocker($blockers, 'missing_active_consent', 'Required consent is missing or withdrawn', [
                    'consent_type' => $consentType,
                ]);
            }
        }
    }

    foreach ($cardReviewStates as $cardCode => $state) {
        if (($state['review_status'] ?? null) !== 'correction_requested') {
            continue;
        }
        cpg_approval_add_blocker($blockers, 'unresolved_source_card_correction', 'Unresolved source-card correction blocks candidate presentation', [
            'card_code' => $cardCode,
            'card_name' => cpg_seafarer_review_card_name((string) $cardCode) ?? (string) $cardCode,
        ]);
    }

    foreach (cpg_seafarer_presentation_required_source_cards() as $cardCode) {
        if (!isset($cardReviewStates[$cardCode])) {
            $warnings[] = [
                'code' => 'source_card_not_individually_reviewed',
                'message' => 'Source card has no explicit review event yet; current slice blocks unresolved corrections and requires operator presentation action',
                'details' => [
                    'card_code' => $cardCode,
                    'card_name' => cpg_seafarer_review_card_name($cardCode) ?? $cardCode,
                ],
            ];
        }
    }

    $payloadProbe = cpg_employer_candidate_payload_probe($row);
    $forbiddenHits = cpg_payload_forbidden_key_hits($payloadProbe, cpg_employer_payload_forbidden_keys());
    if ($forbiddenHits !== []) {
        cpg_approval_add_blocker($blockers, 'unsafe_employer_payload', 'Employer-facing payload probe contains forbidden fields', [
            'fields' => $forbiddenHits,
        ]);
    }

    $status = $blockers === [] ? 'ready_for_operator_approval' : 'blocked';
    return [
        'approval_status' => $status,
        'approval_blockers' => $blockers,
        'approval_warnings' => $warnings,
        'required_consent_types' => cpg_seafarer_required_presentation_consent_types(),
        'active_consent_types' => $activeConsentTypes,
        'required_source_cards' => cpg_seafarer_presentation_required_source_cards(),
        'employer_payload_probe' => [
            'visibility_scope' => 'employer_candidate',
            'forbidden_fields_absent' => $forbiddenHits === [],
            'document_summary_keys' => array_keys($documentSummary),
        ],
        'restricted_medical_access' => [
            'general_operator_details_visible' => false,
            'required_capabilities' => [
                'seafarer.medical.read_restricted',
                'seafarer.medical.request_correction',
                'seafarer.medical.verify_restricted',
            ],
        ],
    ];
}

function cpg_seafarer_mask_source_record(string $recordGroup, array $record, string $scope): array {
    if ($scope === 'owner_full') {
        return $record;
    }

    $base = [
        'source_card' => $record['source_card'] ?? null,
        'source_index' => $record['source_index'] ?? null,
        'visibility_class' => cpg_seafarer_source_card_visibility_map()[(string) ($record['source_card'] ?? '')] ?? 'operator_review',
        'restricted_summary' => true,
    ];

    return match ($recordGroup) {
        'children_records' => cpg_workspace_clean_record($base + [
            'record_type' => 'child_record',
            'record_status' => 'restricted_family_record',
        ]),
        'identity_documents_and_visas' => cpg_workspace_clean_record($base + [
            'document_kind' => $record['document_kind'] ?? null,
            'issued_at' => $record['issued_at'] ?? null,
            'expires_at' => $record['expires_at'] ?? null,
        ]),
        'previous_employer_references' => cpg_workspace_clean_record($base + [
            'company_name' => $record['company_name'] ?? null,
            'record_status' => 'reference_contact_details_restricted',
        ]),
        'medical_declarations' => cpg_workspace_clean_record($base + [
            'record_type' => 'medical_declaration',
            'record_status' => 'restricted_medical_details_hidden',
        ]),
        default => $record,
    };
}

function cpg_seafarer_source_repeated_records_for_scope(array $records, string $scope): array {
    if ($scope === 'owner_full') {
        return $records;
    }

    $masked = [];
    foreach ($records as $group => $items) {
        if (!is_array($items)) {
            $masked[$group] = [];
            continue;
        }
        $masked[$group] = array_map(
            static fn (array $record): array => cpg_seafarer_mask_source_record((string) $group, $record, $scope),
            array_values(array_filter($items, 'is_array'))
        );
    }
    return $masked;
}

function cpg_seafarer_source_card_document_links_for_scope(array $links, string $scope): array {
    if ($scope === 'owner_full') {
        return $links;
    }

    $safe = [];
    foreach ($links as $cardCode => $documents) {
        $safe[$cardCode] = [];
        if (!is_array($documents)) {
            continue;
        }
        foreach ($documents as $document) {
            if (!is_array($document)) {
                continue;
            }
            $safe[$cardCode][] = cpg_workspace_clean_record([
                'document_type' => $document['document_type'] ?? null,
                'file_size_bytes' => $document['file_size_bytes'] ?? null,
                'scan_status' => $document['scan_status'] ?? null,
                'review_status' => $document['review_status'] ?? null,
                'uploaded_at' => $document['uploaded_at'] ?? null,
                'visibility_class' => cpg_seafarer_source_card_visibility_map()[(string) $cardCode] ?? 'operator_review',
            ]);
        }
    }
    return $safe;
}

function cpg_seafarer_workspace_summary_for_scope(array $workspace, string $scope): array {
    $scope = cpg_normalize_visibility_scope($scope);
    $workspace['visibility_scope'] = $scope;
    $workspace['source_card_visibility'] = cpg_seafarer_source_card_visibility_map();
    $workspace['field_visibility'] = cpg_seafarer_field_visibility_matrix();
    $workspace['consent_event_model'] = cpg_seafarer_consent_event_model();

    if ($scope === 'owner_full') {
        return $workspace;
    }

    if (isset($workspace['source_repeated_records']) && is_array($workspace['source_repeated_records'])) {
        $workspace['source_repeated_records'] = cpg_seafarer_source_repeated_records_for_scope($workspace['source_repeated_records'], $scope);
    }
    if (isset($workspace['source_card_document_links']) && is_array($workspace['source_card_document_links'])) {
        $workspace['source_card_document_links'] = cpg_seafarer_source_card_document_links_for_scope($workspace['source_card_document_links'], $scope);
    }

    if (isset($workspace['person_details']) && is_array($workspace['person_details'])) {
        unset($workspace['person_details']['permanent_address']);
    }
    if (isset($workspace['emergency_contacts']) && is_array($workspace['emergency_contacts'])) {
        $workspace['emergency_contacts'] = array_map(static function (array $contact): array {
            return cpg_workspace_clean_record([
                'relation_label' => $contact['relation_label'] ?? null,
                'is_primary' => $contact['is_primary'] ?? null,
                'review_status' => $contact['review_status'] ?? null,
                'updated_at' => $contact['updated_at'] ?? null,
                'visibility_class' => 'internal_compliance',
                'restricted_summary' => true,
            ]);
        }, array_values(array_filter($workspace['emergency_contacts'], 'is_array')));
    }
    if (isset($workspace['matching_preferences']) && is_array($workspace['matching_preferences'])) {
        unset($workspace['matching_preferences']['information_source_label']);
    }

    return $workspace;
}

function cpg_sync_seafarer_workspace_from_metadata(string $userId, ?string $documentMetadataJson, array $flatProfile): void {
    if (!cpg_seafarer_workspace_tables_ready()) {
        return;
    }

    $metadata = cpg_decode_json_object($documentMetadataJson);
    $workspace = isset($metadata['seafarer_workspace']) && is_array($metadata['seafarer_workspace'])
        ? $metadata['seafarer_workspace']
        : [];
    if ($workspace === []) {
        return;
    }

    $profileResult = api_query(
        'SELECT seafarer_profile_id
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    $profileRow = pg_fetch_assoc($profileResult);
    if (!is_array($profileRow)) {
        return;
    }

    $profileId = (string) $profileRow['seafarer_profile_id'];
    $draftId = $userId;
    $personal = cpg_workspace_section($workspace, 'personal_details');
    $contact = cpg_workspace_section($workspace, 'contact_and_addresses');
    $family = cpg_workspace_section($workspace, 'family_details');
    $identity = cpg_workspace_section($workspace, 'identity_documents');
    $qualifications = cpg_workspace_section($workspace, 'qualifications');
    $qualificationDetails = cpg_workspace_section($workspace, 'qualification_details');
    $seaService = cpg_workspace_section($workspace, 'sea_service');
    $previousEmployerReferences = cpg_workspace_section($workspace, 'previous_employer_references');
    $medicalHistory = cpg_workspace_section($workspace, 'medical_history');
    $publication = cpg_workspace_section($workspace, 'matching_publication');
    $sourceRepeatedRecords = cpg_seafarer_source_repeated_records($metadata, $flatProfile);

    if ($personal !== [] || $contact !== [] || isset($flatProfile['nationality_code']) || isset($flatProfile['residence_country_code'])) {
        $genderLabel = cpg_workspace_text($personal, 'gender', 160);
        $civilStatusLabel = cpg_workspace_text($personal, 'civil_status', 160);
        $residenceCityLabel = cpg_workspace_text($contact, 'residence_city', 240);
        $nearestAirportLabel = cpg_workspace_text($contact, 'nearest_airport', 240);
        $nationalityCode = normalize_country_code($flatProfile['nationality_code'] ?? null);
        $residenceCountryCode = normalize_country_code($flatProfile['residence_country_code'] ?? null);

        api_query(
            'INSERT INTO crewportglobal.seafarer_person_details (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               date_of_birth,
               place_of_birth,
               gender_value_id,
               gender_label,
               civil_status_value_id,
               civil_status_label,
               nationality_code,
               residence_country_code,
               residence_city_value_id,
               residence_city_label,
               permanent_address,
               nearest_airport_value_id,
               nearest_airport_label,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::date, $5, $6::uuid, $7, $8::uuid, $9, $10, $11,
               $12::uuid, $13, $14, $15::uuid, $16, $17, $18, $19::jsonb
             )
             ON CONFLICT (seafarer_profile_id)
             DO UPDATE SET
               source_draft_id = EXCLUDED.source_draft_id,
               date_of_birth = EXCLUDED.date_of_birth,
               place_of_birth = EXCLUDED.place_of_birth,
               gender_value_id = EXCLUDED.gender_value_id,
               gender_label = EXCLUDED.gender_label,
               civil_status_value_id = EXCLUDED.civil_status_value_id,
               civil_status_label = EXCLUDED.civil_status_label,
               nationality_code = COALESCE(EXCLUDED.nationality_code, crewportglobal.seafarer_person_details.nationality_code),
               residence_country_code = COALESCE(EXCLUDED.residence_country_code, crewportglobal.seafarer_person_details.residence_country_code),
               residence_city_value_id = EXCLUDED.residence_city_value_id,
               residence_city_label = EXCLUDED.residence_city_label,
               permanent_address = EXCLUDED.permanent_address,
               nearest_airport_value_id = EXCLUDED.nearest_airport_value_id,
               nearest_airport_label = EXCLUDED.nearest_airport_label,
               record_state = EXCLUDED.record_state,
               review_status = EXCLUDED.review_status,
               metadata = EXCLUDED.metadata,
               updated_at = now()',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_date($personal, 'date_of_birth'),
                cpg_workspace_text($personal, 'place_of_birth', 160),
                cpg_workspace_reference_value_id('gender_values', $genderLabel),
                $genderLabel,
                cpg_workspace_reference_value_id('civil_status_values', $civilStatusLabel),
                $civilStatusLabel,
                $nationalityCode,
                $residenceCountryCode,
                cpg_workspace_reference_value_id('cities', $residenceCityLabel),
                $residenceCityLabel,
                cpg_workspace_text($contact, 'permanent_address', 500),
                cpg_workspace_reference_value_id('airports', $nearestAirportLabel),
                $nearestAirportLabel,
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_person_details']),
            ]
        );
    }

    $emergencyName = cpg_workspace_text($contact, 'emergency_contact_name', 240);
    if ($emergencyName !== null) {
        $relationLabel = cpg_workspace_text($contact, 'emergency_contact_relation', 160);
        api_query(
            'INSERT INTO crewportglobal.seafarer_emergency_contacts (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               contact_name,
               relation_value_id,
               relation_label,
               contact_phone,
               is_primary,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7, TRUE, $8, $9, $10::jsonb
             )
             ON CONFLICT (seafarer_profile_id) WHERE is_primary
             DO UPDATE SET
               source_draft_id = EXCLUDED.source_draft_id,
               contact_name = EXCLUDED.contact_name,
               relation_value_id = EXCLUDED.relation_value_id,
               relation_label = EXCLUDED.relation_label,
               contact_phone = EXCLUDED.contact_phone,
               record_state = EXCLUDED.record_state,
               review_status = EXCLUDED.review_status,
               metadata = EXCLUDED.metadata,
               updated_at = now()',
            [
                $profileId,
                $userId,
                $draftId,
                $emergencyName,
                cpg_workspace_reference_value_id('relation_types', $relationLabel),
                $relationLabel,
                cpg_workspace_text($contact, 'emergency_contact_phone', 160),
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_primary_emergency_contact']),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_education_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_primary_education'",
        [$profileId]
    );
    foreach ($sourceRepeatedRecords['education_records'] as $educationRecord) {
        $institutionLabel = normalize_optional_text($educationRecord['institution_name'] ?? null, 240);
        $gradeLabel = normalize_optional_text($educationRecord['grade_label'] ?? null, 160);
        api_query(
            'INSERT INTO crewportglobal.seafarer_education_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               institution_value_id,
               institution_name,
               grade_value_id,
               grade_label,
               field_of_study,
               start_date,
               completion_date,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::uuid, $5, $6::uuid, $7, $8, $9::date, $10::date, $11, $12, $13::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_reference_value_id('education_institutions', $institutionLabel),
                $institutionLabel,
                cpg_workspace_reference_value_id('education_grades', $gradeLabel),
                $gradeLabel,
                normalize_optional_text($educationRecord['field_of_study'] ?? null, 240),
                normalize_date_value((string) ($educationRecord['start_date'] ?? '')),
                normalize_date_value((string) ($educationRecord['completion_date'] ?? '')),
                'submitted',
                'pending_human_review',
                cpg_workspace_json([
                    'source_key' => 'workspace_primary_education',
                    'source_card' => 'QUAL-002',
                    'issued_at' => $educationRecord['issued_at'] ?? null,
                    'comments' => $educationRecord['comments'] ?? null,
                ]),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_certificates
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' IN ('workspace_primary_coc', 'workspace_endorsement')",
        [$profileId]
    );
    foreach (array_merge($sourceRepeatedRecords['coc_certificates'], $sourceRepeatedRecords['endorsements']) as $certificateRecord) {
        $certificateTypeLabel = normalize_optional_text($certificateRecord['certificate_type_label'] ?? null, 240);
        $certificateGroup = normalize_optional_text($certificateRecord['certificate_group'] ?? null, 80) ?? 'competency';
        $certificateSourceKey = $certificateGroup === 'endorsement' ? 'workspace_endorsement' : 'workspace_primary_coc';
        api_query(
            'INSERT INTO crewportglobal.seafarer_certificates (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               certificate_group,
               certificate_type_value_id,
               certificate_type_label,
               certificate_number,
               issuing_authority,
               issuing_country_code,
               issued_at,
               expires_at,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7, $8, $9, $10::date, $11::date, $12, $13, $14::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                $certificateGroup,
                cpg_workspace_reference_value_id(
                    $certificateGroup === 'endorsement' ? 'national_document_types' : 'certificate_of_competence_types',
                    $certificateTypeLabel
                ),
                $certificateTypeLabel,
                normalize_optional_text($certificateRecord['certificate_number'] ?? null, 160),
                normalize_optional_text($certificateRecord['issuing_authority'] ?? null, 240),
                normalize_country_code($certificateRecord['issuing_country_code'] ?? null),
                normalize_date_value((string) ($certificateRecord['issued_at'] ?? '')),
                normalize_date_value((string) ($certificateRecord['expires_at'] ?? '')),
                'submitted',
                'pending_human_review',
                cpg_workspace_json([
                    'source_key' => $certificateSourceKey,
                    'source_card' => $certificateGroup === 'endorsement' ? 'QUAL-004' : 'QUAL-003',
                    'comments' => $certificateRecord['comments'] ?? null,
                ]),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_training_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_training_course'",
        [$profileId]
    );
    foreach ($sourceRepeatedRecords['training_courses'] as $trainingRecord) {
        $courseLabel = normalize_optional_text($trainingRecord['training_type_label'] ?? null, 220);
        api_query(
            'INSERT INTO crewportglobal.seafarer_training_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               training_type_value_id,
               training_type_label,
               certificate_number,
               issuing_center,
               issued_at,
               expires_at,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::uuid, $5, $6, $7, $8::date, $9::date, $10, $11, $12::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_reference_value_id('training_course_types', $courseLabel),
                $courseLabel,
                normalize_optional_text($trainingRecord['certificate_number'] ?? null, 160),
                normalize_optional_text($trainingRecord['issuing_center'] ?? null, 240),
                normalize_date_value((string) ($trainingRecord['issued_at'] ?? '')),
                normalize_date_value((string) ($trainingRecord['expires_at'] ?? '')),
                'submitted',
                'pending_human_review',
                cpg_workspace_json([
                    'source_key' => 'workspace_training_course',
                    'source_card' => 'QUAL-005',
                    'source_index' => $trainingRecord['source_index'] ?? null,
                    'comments' => $trainingRecord['comments'] ?? null,
                ]),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_sea_service_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' IN ('workspace_latest_sea_service', 'workspace_sea_service_history')",
        [$profileId]
    );
    foreach ($sourceRepeatedRecords['sea_service_history'] as $seaServiceRecord) {
        $vesselName = normalize_optional_text($seaServiceRecord['vessel_name'] ?? null, 240);
        $vesselTypeLabel = normalize_optional_text($seaServiceRecord['vessel_type_label'] ?? null, 240);
        $rankLabel = normalize_optional_text($seaServiceRecord['rank_label'] ?? null, 240);
        $sourceKey = ($seaServiceRecord['source_key'] ?? null) === 'sea_service_history'
            ? 'workspace_sea_service_history'
            : 'workspace_latest_sea_service';
        $department = normalize_optional_text($seaServiceRecord['department'] ?? null, 40);
        if (!in_array($department, ['deck', 'engine', 'catering', 'other'], true)) {
            $department = null;
        }
        api_query(
            'INSERT INTO crewportglobal.seafarer_sea_service_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               vessel_name,
               vessel_type_value_id,
               vessel_type_label,
               rank_value_id,
               rank_label,
               department,
               flag_country_code,
               service_from,
               service_to,
               management_company,
               engine_type,
               deadweight,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7::uuid, $8, $9, $10,
               $11::date, $12::date, $13, $14, $15, $16, $17, $18::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                $vesselName,
                cpg_workspace_reference_value_id('vessel_types', $vesselTypeLabel),
                $vesselTypeLabel,
                cpg_workspace_reference_value_id('seafarer_positions', $rankLabel),
                $rankLabel,
                $department,
                normalize_country_code($seaServiceRecord['flag_country_code'] ?? null),
                normalize_date_value((string) ($seaServiceRecord['service_from'] ?? '')),
                normalize_date_value((string) ($seaServiceRecord['service_to'] ?? '')),
                normalize_optional_text($seaServiceRecord['management_company'] ?? null, 240),
                normalize_optional_text($seaServiceRecord['engine_type'] ?? null, 160),
                normalize_optional_text($seaServiceRecord['deadweight'] ?? null, 160),
                'submitted',
                'pending_human_review',
                cpg_workspace_json([
                    'source_key' => $sourceKey,
                    'source_card' => 'EXP-001',
                    'source_index' => $seaServiceRecord['source_index'] ?? null,
                    'engine_power' => $seaServiceRecord['engine_power'] ?? null,
                    'source_row' => $seaServiceRecord['source_row'] ?? null,
                    'service_from_text' => $seaServiceRecord['service_from_text'] ?? null,
                    'service_to_text' => $seaServiceRecord['service_to_text'] ?? null,
                ]),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_medical_declarations
         WHERE seafarer_profile_id = $1
           AND declaration_scope = 'platform_readiness'
           AND sensitive_payload->>'source_key' = 'workspace_medical_history'",
        [$profileId]
    );
    $medicalDeclarations = $sourceRepeatedRecords['medical_declarations'];
    if ($medicalDeclarations !== [] || isset($metadata['medical_expiry'])) {
        $hasMedicalConcern = false;
        foreach ($medicalDeclarations as $declaration) {
            $answer = strtolower((string) ($declaration['answer'] ?? ''));
            $details = normalize_optional_text($declaration['details'] ?? null, 1200);
            if (in_array($answer, ['yes', 'true', '1'], true) || $details !== null) {
                $hasMedicalConcern = true;
                break;
            }
        }
        $consentStatus = ($publication['data_processing_confirmation'] ?? null) === 'i_confirm'
            ? 'granted'
            : 'not_declared';
        api_query(
            'INSERT INTO crewportglobal.seafarer_medical_declarations (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               declaration_scope,
               medical_certificate_expires_at,
               fitness_status,
               consent_status,
               sensitive_payload,
               record_state,
               review_status
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::date, $6, $7, $8::jsonb, $9, $10
             )',
            [
                $profileId,
                $userId,
                $draftId,
                'platform_readiness',
                normalize_date_value((string) ($metadata['medical_expiry'] ?? '')),
                $hasMedicalConcern ? 'requires_review' : 'not_declared',
                $consentStatus,
                cpg_workspace_json([
                    'source_key' => 'workspace_medical_history',
                    'source_card' => 'MED-001',
                    'declarations' => $medicalDeclarations,
                ]),
                'submitted',
                'pending_human_review',
            ]
        );
    }

    $preferredVesselTypeLabels = [];
    if (isset($flatProfile['preferred_vessel_types']) && is_array($flatProfile['preferred_vessel_types'])) {
        foreach ($flatProfile['preferred_vessel_types'] as $label) {
            $clean = normalize_optional_text($label, 160);
            if ($clean !== null) {
                $preferredVesselTypeLabels[] = $clean;
            }
        }
    }
    $preferredVesselTypeLabels = array_values(array_unique($preferredVesselTypeLabels));
    $preferredVesselTypeValues = array_map(
        fn (string $label): array => [
            'label' => $label,
            'reference_value_id' => cpg_workspace_reference_value_id('vessel_types', $label),
        ],
        $preferredVesselTypeLabels
    );
    $informationSourceLabel = cpg_workspace_text($publication, 'information_source', 240);
    $publishToMatching = cpg_workspace_text($publication, 'publish_to_matching', 20) ?? 'unknown';
    if (!in_array($publishToMatching, ['unknown', 'yes', 'no'], true)) {
        $publishToMatching = 'unknown';
    }
    $dataProcessingConfirmation = cpg_workspace_text($publication, 'data_processing_confirmation', 40) ?? 'not_confirmed';
    if (!in_array($dataProcessingConfirmation, ['not_confirmed', 'i_confirm', 'i_decline'], true)) {
        $dataProcessingConfirmation = 'not_confirmed';
    }

    api_query(
        'INSERT INTO crewportglobal.seafarer_matching_preferences (
           seafarer_profile_id,
           user_id,
           source_draft_id,
           preferred_vessel_type_values,
           preferred_vessel_type_labels,
           expected_compensation_usd,
           availability_date,
           availability_status,
           candidate_summary,
           information_source_value_id,
           information_source_label,
           publish_to_matching,
           data_processing_confirmation,
           record_state,
           review_status,
           metadata
         ) VALUES (
           $1, $2, $3::uuid, $4::jsonb, $5::text[], $6, $7::date, $8, $9, $10::uuid,
           $11, $12, $13, $14, $15, $16::jsonb
         )
         ON CONFLICT (seafarer_profile_id)
         DO UPDATE SET
           source_draft_id = EXCLUDED.source_draft_id,
           preferred_vessel_type_values = EXCLUDED.preferred_vessel_type_values,
           preferred_vessel_type_labels = EXCLUDED.preferred_vessel_type_labels,
           expected_compensation_usd = EXCLUDED.expected_compensation_usd,
           availability_date = EXCLUDED.availability_date,
           availability_status = EXCLUDED.availability_status,
           candidate_summary = EXCLUDED.candidate_summary,
           information_source_value_id = EXCLUDED.information_source_value_id,
           information_source_label = EXCLUDED.information_source_label,
           publish_to_matching = EXCLUDED.publish_to_matching,
           data_processing_confirmation = EXCLUDED.data_processing_confirmation,
           record_state = EXCLUDED.record_state,
           review_status = EXCLUDED.review_status,
           metadata = EXCLUDED.metadata,
           updated_at = now()',
        [
            $profileId,
            $userId,
            $draftId,
            cpg_workspace_json($preferredVesselTypeValues),
            cpg_pg_text_array_literal($preferredVesselTypeLabels),
            cpg_workspace_number($flatProfile['salary_expectation_usd'] ?? null),
            normalize_date_value($flatProfile['availability_date'] ?? null),
            in_array(($flatProfile['availability_status'] ?? 'unknown'), ['unknown', 'available_now', 'available_later'], true)
                ? (string) ($flatProfile['availability_status'] ?? 'unknown')
                : 'unknown',
            cpg_workspace_text($publication, 'candidate_summary', 1200),
            cpg_workspace_reference_value_id('information_source_values', $informationSourceLabel),
            $informationSourceLabel,
            $publishToMatching,
            $dataProcessingConfirmation,
            'submitted',
            'pending_human_review',
            cpg_workspace_json(['source_key' => 'workspace_matching_preferences']),
        ]
    );
}

function cpg_fetch_one_assoc(string $sql, array $params): ?array {
    $result = api_query($sql, $params);
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function cpg_fetch_all_assoc(string $sql, array $params): array {
    $result = api_query($sql, $params);
    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = $row;
    }
    return $items;
}

function cpg_seafarer_workspace_card_review_states(mixed $documentMetadata): array {
    $metadata = cpg_decode_json_object(is_string($documentMetadata) ? $documentMetadata : null);
    $states = isset($metadata['seafarer_workspace_card_reviews']) && is_array($metadata['seafarer_workspace_card_reviews'])
        ? $metadata['seafarer_workspace_card_reviews']
        : [];
    $normalized = [];

    foreach (cpg_seafarer_review_card_codes() as $code) {
        $state = isset($states[$code]) && is_array($states[$code]) ? $states[$code] : [];
        if ($state === []) {
            continue;
        }

        $normalized[$code] = [
            'card_code' => $code,
            'card_name' => cpg_seafarer_review_card_name($code),
            'review_status' => is_string($state['review_status'] ?? null) ? $state['review_status'] : null,
            'review_note' => is_string($state['review_note'] ?? null) ? $state['review_note'] : null,
            'review_decision' => is_string($state['review_decision'] ?? null) ? $state['review_decision'] : null,
            'review_updated_at' => is_string($state['review_updated_at'] ?? null) ? $state['review_updated_at'] : null,
        ];
    }

    return $normalized;
}

function cpg_read_seafarer_workspace_summary(string $userId): array {
    if (!cpg_seafarer_workspace_tables_ready()) {
        return [
            'schema_ready' => false,
            'message' => 'Structured seafarer workspace tables are not available yet.',
        ];
    }

    $profile = cpg_fetch_one_assoc(
        'SELECT seafarer_profile_id, user_id, first_name, primary_rank, department, contact_phone, contact_email, review_status, document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    if ($profile === null) {
        return [
            'schema_ready' => true,
            'has_profile' => false,
        ];
    }

    $profileId = (string) $profile['seafarer_profile_id'];
    $documentMetadata = cpg_decode_json_object($profile['document_metadata'] ?? null);
    $flatProfile = [
        'department' => $profile['department'] ?? null,
    ];
    return [
        'schema_ready' => true,
        'has_profile' => true,
        'profile_id' => $profileId,
        'first_name' => $profile['first_name'] ?? null,
        'primary_rank' => $profile['primary_rank'] ?? null,
        'department' => $profile['department'] ?? null,
        'contact_phone' => $profile['contact_phone'] ?? null,
        'contact_email' => $profile['contact_email'] ?? null,
        'review_status' => $profile['review_status'] ?? null,
        'card_review_states' => cpg_seafarer_workspace_card_review_states($profile['document_metadata'] ?? null),
        'source_repeated_records' => cpg_seafarer_source_repeated_records($documentMetadata, $flatProfile),
        'source_card_document_links' => cpg_seafarer_source_card_document_links((string) $profile['user_id']),
        'person_details' => cpg_fetch_one_assoc(
            'SELECT date_of_birth, place_of_birth, gender_label, civil_status_label,
                    nationality_code, residence_country_code, residence_city_label,
                    permanent_address, nearest_airport_label, review_status, updated_at
             FROM crewportglobal.seafarer_person_details
             WHERE seafarer_profile_id = $1
             LIMIT 1',
            [$profileId]
        ),
        'emergency_contacts' => cpg_fetch_all_assoc(
            'SELECT contact_name, relation_label, contact_phone, is_primary, review_status, updated_at
             FROM crewportglobal.seafarer_emergency_contacts
             WHERE seafarer_profile_id = $1
             ORDER BY is_primary DESC, updated_at DESC',
            [$profileId]
        ),
        'education_records' => cpg_fetch_all_assoc(
            'SELECT institution_name, grade_label, field_of_study, country_code, completion_date, review_status, updated_at
             FROM crewportglobal.seafarer_education_records
             WHERE seafarer_profile_id = $1
             ORDER BY completion_date DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'certificates' => cpg_fetch_all_assoc(
            'SELECT certificate_group, certificate_type_label, certificate_number, issuing_country_code, expires_at, review_status, updated_at
             FROM crewportglobal.seafarer_certificates
             WHERE seafarer_profile_id = $1
             ORDER BY certificate_group ASC, expires_at DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'training_records' => cpg_fetch_all_assoc(
            'SELECT training_type_label, certificate_number, issuing_center, expires_at, review_status, updated_at
             FROM crewportglobal.seafarer_training_records
             WHERE seafarer_profile_id = $1
             ORDER BY expires_at DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'sea_service_records' => cpg_fetch_all_assoc(
            'SELECT vessel_name, vessel_type_label, rank_label, department, flag_country_code,
                    service_from, service_to, management_company, engine_type, deadweight, review_status, updated_at
             FROM crewportglobal.seafarer_sea_service_records
             WHERE seafarer_profile_id = $1
             ORDER BY service_to DESC NULLS LAST, service_from DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'medical_declarations' => cpg_fetch_all_assoc(
            'SELECT declaration_scope, medical_certificate_expires_at, fitness_status, consent_status, review_status, updated_at
             FROM crewportglobal.seafarer_medical_declarations
             WHERE seafarer_profile_id = $1
             ORDER BY updated_at DESC',
            [$profileId]
        ),
        'matching_preferences' => cpg_fetch_one_assoc(
            'SELECT preferred_vessel_type_values, preferred_vessel_type_labels, expected_compensation_usd,
                    availability_date, availability_status, candidate_summary, information_source_label,
                    publish_to_matching, data_processing_confirmation, review_status, updated_at
             FROM crewportglobal.seafarer_matching_preferences
             WHERE seafarer_profile_id = $1
             LIMIT 1',
            [$profileId]
        ),
    ];
}

function cpg_seafarer_workspace_value_present(mixed $value): bool {
    if (is_array($value)) {
        return count($value) > 0;
    }

    return $value !== null && trim((string) $value) !== '';
}

function cpg_workspace_section_data(array $workspace, string $section): array {
    return isset($workspace[$section]) && is_array($workspace[$section]) ? $workspace[$section] : [];
}

function cpg_workspace_combined_data(array $workspace, array $sections): array {
    $combined = [];
    foreach ($sections as $section) {
        $data = cpg_workspace_section_data($workspace, $section);
        if ($data !== []) {
            $combined = array_merge($combined, $data);
        }
    }
    return $combined;
}

function cpg_seafarer_missing_source_fields(array $data, array $fieldLabels): array {
    $missing = [];
    foreach ($fieldLabels as $field => $label) {
        if (!cpg_seafarer_workspace_value_present($data[$field] ?? null)) {
            $missing[] = is_string($label) ? $label : (string) $field;
        }
    }
    return $missing;
}

function cpg_seafarer_workspace_review_card(string $code, string $name, array $missing, array $reviewState = [], array $extra = []): array {
    $missing = array_values(array_unique(array_filter($missing, static fn ($item) => is_string($item) && $item !== '')));

    $card = [
        'card_code' => $code,
        'card_name' => $name,
        'status' => count($missing) === 0 ? 'complete' : 'incomplete',
        'missing' => $missing,
    ];

    foreach (['review_status', 'review_note', 'review_decision', 'review_updated_at'] as $key) {
        if (isset($reviewState[$key]) && $reviewState[$key] !== '') {
            $card[$key] = $reviewState[$key];
        }
    }

    foreach ($extra as $key => $value) {
        $card[$key] = $value;
    }

    return $card;
}

function cpg_readiness_status_is_ready(mixed $value): bool {
    return is_string($value) && strtolower(trim($value)) === 'ready';
}

function cpg_seafarer_workspace_review_readiness(array $workspace, array $documentMetadata): array {
    if (($workspace['schema_ready'] ?? false) !== true || ($workspace['has_profile'] ?? false) !== true) {
        return [];
    }

    $cardReviewStates = isset($workspace['card_review_states']) && is_array($workspace['card_review_states'])
        ? $workspace['card_review_states']
        : [];
    $personDetails = is_array($workspace['person_details'] ?? null) ? $workspace['person_details'] : [];
    $emergencyContacts = is_array($workspace['emergency_contacts'] ?? null) ? $workspace['emergency_contacts'] : [];
    $certificates = is_array($workspace['certificates'] ?? null) ? $workspace['certificates'] : [];
    $trainingRecords = is_array($workspace['training_records'] ?? null) ? $workspace['training_records'] : [];
    $seaServiceRecords = is_array($workspace['sea_service_records'] ?? null) ? $workspace['sea_service_records'] : [];
    $matchingPreferences = is_array($workspace['matching_preferences'] ?? null) ? $workspace['matching_preferences'] : [];
    $sourceWorkspace = isset($documentMetadata['seafarer_workspace']) && is_array($documentMetadata['seafarer_workspace'])
        ? normalize_seafarer_workspace_metadata($documentMetadata['seafarer_workspace'])
        : [];

    $primaryEmergency = $emergencyContacts[0] ?? [];
    $primaryCertificate = $certificates[0] ?? [];
    $latestSeaService = $seaServiceRecords[0] ?? [];
    $personalSource = cpg_workspace_combined_data($sourceWorkspace, ['personal_details', 'name_components']);
    $contactSource = cpg_workspace_section_data($sourceWorkspace, 'contact_and_addresses');
    $addressSource = cpg_workspace_section_data($sourceWorkspace, 'address_details');
    $familySource = cpg_workspace_section_data($sourceWorkspace, 'family_details');
    $physicalSource = cpg_workspace_section_data($sourceWorkspace, 'physical_details');
    $identitySource = cpg_workspace_section_data($sourceWorkspace, 'identity_documents');
    $qualificationSource = cpg_workspace_combined_data($sourceWorkspace, ['qualifications', 'qualification_details']);
    $seaServiceSource = cpg_workspace_section_data($sourceWorkspace, 'sea_service');
    $previousEmployerSource = cpg_workspace_section_data($sourceWorkspace, 'previous_employer_references');
    $medicalSource = cpg_workspace_section_data($sourceWorkspace, 'medical_history');
    $publicationSource = cpg_workspace_section_data($sourceWorkspace, 'matching_publication');
    $consentSource = cpg_workspace_section_data($sourceWorkspace, 'consent_details');

    $card = static function (string $code, array $missing, array $extra = []) use ($cardReviewStates): array {
        return cpg_seafarer_workspace_review_card(
            $code,
            cpg_seafarer_review_card_name($code) ?? $code,
            $missing,
            $cardReviewStates[$code] ?? [],
            $extra
        );
    };

    $sourceCardExtra = static function (string $sheet, string $section, bool $userActionable = true): array {
        return [
            'source_model' => 'standard_excel',
            'source_sheet' => $sheet,
            'source_section' => $section,
            'user_actionable' => $userActionable,
        ];
    };

    $sourceCards = [
        $card('PERS-001', cpg_seafarer_missing_source_fields($sourceWorkspace, [
            'employee_id_number' => 'Employee ID Number',
        ]), $sourceCardExtra('PERS', 'Employee ID number', false)),
        $card('PERS-002', array_values(array_filter([
            cpg_seafarer_workspace_value_present($workspace['primary_rank'] ?? null) ? null : 'Position apply for',
            cpg_seafarer_workspace_value_present($matchingPreferences['preferred_vessel_type_labels'] ?? null) ? null : 'Type of Vessel',
        ])), $sourceCardExtra('PERS', 'Position request')),
        $card('PERS-003', cpg_seafarer_missing_source_fields($personalSource, [
            'surname' => 'Surname',
            'first_name' => 'First Name',
            'middle_name' => 'Middle Name',
            'place_of_birth' => 'Place of birth',
            'date_of_birth' => 'Date of birth',
            'citizenship' => 'Citizenship',
            'gender' => 'Gender',
            'civil_status' => 'Civil status',
            'religion' => 'Religion',
        ]), $sourceCardExtra('PERS', 'Personal details')),
        $card('PERS-004', cpg_seafarer_missing_source_fields(array_merge($contactSource, $addressSource), [
            'permanent_street' => 'Street',
            'permanent_house' => 'House',
            'permanent_flat' => 'Flat',
            'permanent_comments' => 'Comments',
            'residence_city' => 'City',
            'residence_country' => 'Country',
            'permanent_region' => 'Region',
            'nearest_airport' => 'Airport',
            'permanent_post_code' => 'Post code',
        ]), $sourceCardExtra('PERS', 'Permanent address')),
        $card('PERS-005', cpg_seafarer_missing_source_fields($addressSource, [
            'registration_street' => 'Street',
            'registration_house' => 'House',
            'registration_flat' => 'Flat',
            'registration_comments' => 'Comments',
            'registration_city' => 'City',
            'registration_country' => 'Country',
            'registration_region' => 'Region',
        ]), $sourceCardExtra('PERS', 'Registration address')),
        $card('PERS-006', array_values(array_filter([
            cpg_seafarer_workspace_value_present($workspace['contact_phone'] ?? null) ? null : 'Primary Mobile Number',
            cpg_seafarer_workspace_value_present($contactSource['secondary_mobile_number'] ?? null) ? null : 'Secondary Mobile Number',
            cpg_seafarer_workspace_value_present($contactSource['home_phone'] ?? null) ? null : 'Home Phone',
            cpg_seafarer_workspace_value_present($workspace['contact_email'] ?? null) ? null : 'E-mail',
        ])), $sourceCardExtra('PERS', 'Contact details')),
        $card('PERS-007', cpg_seafarer_missing_source_fields($familySource, [
            'kin_surname' => 'Surname',
            'kin_first_name' => 'First name',
            'kin_middle_name' => 'Middle name',
            'kin_birthdate' => 'Birthdate',
            'kin_gender' => 'Gender',
            'kin_address' => 'Street / house / flat / city / country',
            'kin_relation' => 'Relation',
            'kin_mobile' => 'Mobile',
            'kin_home_phone' => 'Home Phone',
            'kin_email' => 'E-mail',
        ]), $sourceCardExtra('PERS', 'Next of kin / beneficiary')),
        $card('PERS-008', cpg_seafarer_missing_source_fields($familySource, [
            'children_records' => 'Repeated child rows',
        ]), $sourceCardExtra('PERS', 'Children records')),
        $card('PERS-009', cpg_seafarer_missing_source_fields($physicalSource, [
            'height_cm' => 'Height',
            'weight_kg' => 'Weight',
            'hair_colour' => 'Hair colour',
            'eyes_colour' => 'Eyes colour',
            'uniform_size' => 'Uniform size',
            'shoes_size' => 'Shoes size',
        ]), $sourceCardExtra('PERS', 'Physical details')),
        $card('QUAL-001', cpg_seafarer_missing_source_fields($identitySource, [
            'civil_passport_series' => 'Civil Passport Series',
            'civil_passport_number' => 'Civil Passport No',
            'civil_passport_issued' => 'Civil Passport Issued',
            'civil_passport_authority' => 'Civil Passport Authority',
            'foreign_passport_series' => 'Foreign Passport Series',
            'foreign_passport_number' => 'Foreign Passport No',
            'foreign_passport_issued' => 'Foreign Passport Issued',
            'foreign_passport_expiry' => 'Foreign Passport Expiry',
            'foreign_passport_authority' => 'Foreign Passport Authority',
            'seafarer_id_series' => "Seafarer's ID Series",
            'seafarer_id_number' => "Seafarer's ID No",
            'seafarer_id_issued' => "Seafarer's ID Issued",
            'seafarer_id_expiry' => "Seafarer's ID Expiry",
            'seafarer_id_authority' => "Seafarer's ID Authority",
            'seamans_book_series' => "Seaman's Book Series",
            'seamans_book_number' => "Seaman's Book No",
            'seamans_book_issued' => "Seaman's Book Issued",
            'seamans_book_authority' => "Seaman's Book Authority",
            'usa_visa_type' => 'USA VISA type',
            'usa_visa_issued' => 'USA VISA Issued',
            'usa_visa_expiry' => 'USA VISA Expiry',
            'usa_visa_post' => 'USA VISA Issuing Post Name',
            'schengen_visa_number' => 'Schengen VISA No. of Visa',
            'schengen_visa_issued' => 'Schengen VISA Issued',
            'schengen_visa_expiry' => 'Schengen VISA Expiry',
            'schengen_visa_post' => 'Schengen VISA Issuing Post Name',
        ]), $sourceCardExtra('QUAL', 'National identity documents / visa')),
        $card('QUAL-002', cpg_seafarer_missing_source_fields($qualificationSource, [
            'education_institution' => 'Name of maritime educational institution',
            'education_from' => 'Period From',
            'education_to' => 'Period To',
            'education_specialisation' => 'Specialisation',
            'education_grade' => 'Grade',
            'education_issued_on' => 'Issued On',
            'education_comments' => 'Comments',
        ]), $sourceCardExtra('QUAL', 'Education')),
        $card('QUAL-003', cpg_seafarer_missing_source_fields($qualificationSource, [
            'coc_type' => 'Type',
            'coc_institute' => 'Institute',
            'coc_number' => 'Number',
            'coc_issued' => 'Issued',
            'coc_expiry' => 'Expiry',
            'coc_comments' => 'Comments',
        ]), $sourceCardExtra('QUAL', 'Certificate of competence')),
        $card('QUAL-004', cpg_seafarer_missing_source_fields($qualificationSource, [
            'endorsement_type' => 'Type',
            'endorsement_institute' => 'Authority',
            'endorsement_number' => 'Number',
            'endorsement_issued' => 'Issued',
            'endorsement_expiry' => 'Expiry',
            'endorsement_comments' => 'Comments',
        ]), $sourceCardExtra('QUAL', 'National documents / endorsements')),
        $card('QUAL-005', cpg_seafarer_missing_source_fields($qualificationSource, [
            'training_courses' => 'Type',
            'training_institute' => 'Institute',
            'training_number' => 'Number',
            'training_issued' => 'Issued',
            'training_expiry' => 'Expiry',
            'training_comments' => 'Comments',
        ]), $sourceCardExtra('QUAL', 'Training courses')),
        $card('EXP-001', cpg_seafarer_missing_source_fields($seaServiceSource, [
            'last_vessel_name' => 'Name of vessel',
            'last_vessel_type' => 'Vessel Type',
            'deadweight' => 'Deadweight',
            'engine_type' => 'Engine Type',
            'engine_power' => 'Engine Power (kW)',
            'flag_country' => 'Flag',
            'management_company' => 'Management Company or Crew Agent',
            'last_rank' => 'Rank',
            'service_from' => 'From',
            'service_to' => 'To',
        ]), $sourceCardExtra('EXPERIENCE', 'Sea service')),
        $card('EXP-002', cpg_seafarer_missing_source_fields($previousEmployerSource, [
            'reference_company_1' => 'Company Name',
            'reference_person_1' => 'Person in charge',
            'reference_phone_1' => 'Telephone',
            'reference_email_1' => 'E-mail',
        ]), $sourceCardExtra('EXPERIENCE', 'Previous employer details for reference')),
        $card('MED-001', cpg_seafarer_missing_source_fields($medicalSource, [
            'signed_off_sick' => 'Signed off sick',
            'sick_details' => 'Illness / injury / accident details',
            'injury_details' => 'Injury / health problem during last 10 years',
            'operated' => 'Operated',
            'surgery_details' => 'Surgery details',
        ]), $sourceCardExtra('MEDICAL', 'Medical history')),
        $card('MED-002', cpg_seafarer_missing_source_fields($consentSource, [
            'obligation_date' => 'Date',
            'obligation_place' => 'Place',
            'obligation_confirmation' => 'Confirmation',
        ]), $sourceCardExtra('MEDICAL', "Seafarer's obligation")),
        $card('MED-003', cpg_seafarer_missing_source_fields(array_merge($publicationSource, $consentSource), [
            'agreement_date' => 'Date',
            'agreement_value' => 'Agreement',
            'data_processing_confirmation' => 'Personal data processing confirmation',
        ]), $sourceCardExtra('MEDICAL', 'Personal data processing agreement')),
        $card('MED-004', cpg_seafarer_missing_source_fields(array_merge($publicationSource, $consentSource), [
            'information_source' => 'How you heard about company',
            'source_comments' => 'Comments',
        ]), $sourceCardExtra('MEDICAL', 'Information source and comments')),
        $card('MED-005', cpg_seafarer_missing_source_fields($sourceWorkspace, [
            'manager_notes' => "Manager's notes",
            'authorization_rank' => 'Rank',
            'authorization_type_of_ship' => 'Type of ship',
            'authorization_date' => 'Date',
            'crewing_manager_name' => 'Name of Crewing manager',
            'crewing_manager_signature' => 'Signature of Crewing manager',
        ]), $sourceCardExtra('MEDICAL', 'Authorization for pre-employment process', false)),
    ];

    $personalMissing = [];
    if (!cpg_seafarer_workspace_value_present($personDetails['date_of_birth'] ?? null)) {
        $personalMissing[] = 'date_of_birth';
    }
    if (!cpg_seafarer_workspace_value_present($personDetails['residence_city_label'] ?? null)) {
        $personalMissing[] = 'residence_city';
    }
    if (!is_array($primaryEmergency)
        || !cpg_seafarer_workspace_value_present($primaryEmergency['contact_name'] ?? null)
        || !cpg_seafarer_workspace_value_present($primaryEmergency['contact_phone'] ?? null)
    ) {
        $personalMissing[] = 'primary_emergency_contact';
    }

    $qualificationMissing = [];
    if (!is_array($primaryCertificate) || !cpg_seafarer_workspace_value_present($primaryCertificate['certificate_number'] ?? null)) {
        $qualificationMissing[] = 'certificate_of_competency';
    }
    if (count($trainingRecords) === 0) {
        $qualificationMissing[] = 'training_records';
    }

    $seaServiceMissing = [];
    if (!is_array($latestSeaService) || !cpg_seafarer_workspace_value_present($latestSeaService['vessel_name'] ?? null)) {
        $seaServiceMissing[] = 'latest_sea_service_record';
    }

    $matchingMissing = [];
    if (!cpg_seafarer_workspace_value_present($matchingPreferences['candidate_summary'] ?? null)) {
        $matchingMissing[] = 'candidate_summary';
    }
    if (($matchingPreferences['data_processing_confirmation'] ?? null) !== 'i_confirm') {
        $matchingMissing[] = 'data_processing_confirmation';
    }
    if (!cpg_seafarer_workspace_value_present($matchingPreferences['publish_to_matching'] ?? null)) {
        $matchingMissing[] = 'matching_publication_choice';
    }

    $documentMissing = [];
    if (!cpg_readiness_status_is_ready($documentMetadata['certificate_status'] ?? null)) {
        $documentMissing[] = 'coc_document_status_ready';
    }
    if (!cpg_readiness_status_is_ready($documentMetadata['stcw_status'] ?? null)) {
        $documentMissing[] = 'stcw_training_status_ready';
    }
    if (!cpg_seafarer_workspace_value_present($documentMetadata['passport_expiry'] ?? null)) {
        $documentMissing[] = 'passport_expiry';
    }
    if (!cpg_seafarer_workspace_value_present($documentMetadata['medical_expiry'] ?? null)) {
        $documentMissing[] = 'medical_expiry';
    }
    if (!cpg_seafarer_workspace_value_present($documentMetadata['visa_status'] ?? null)) {
        $documentMissing[] = 'visa_readiness';
    }

    $legacyExtra = [
        'legacy_fallback' => true,
        'source_model' => 'legacy_aggregated_fallback',
        'user_actionable' => true,
    ];

    $legacyCards = [
        cpg_seafarer_workspace_review_card('personal_contact', 'Personal and contact details', $personalMissing, $cardReviewStates['personal_contact'] ?? [], $legacyExtra),
        cpg_seafarer_workspace_review_card('qualifications', 'Qualifications and training', $qualificationMissing, $cardReviewStates['qualifications'] ?? [], $legacyExtra),
        cpg_seafarer_workspace_review_card('sea_service', 'Sea-service record', $seaServiceMissing, $cardReviewStates['sea_service'] ?? [], $legacyExtra),
        cpg_seafarer_workspace_review_card('matching_publication', 'Matching and publication consent', $matchingMissing, $cardReviewStates['matching_publication'] ?? [], $legacyExtra),
        cpg_seafarer_workspace_review_card('document_readiness', 'Document readiness metadata', $documentMissing, $cardReviewStates['document_readiness'] ?? [], $legacyExtra),
    ];

    return array_merge($sourceCards, $legacyCards);
}

function cpg_seafarer_workspace_allowed_sections(): array {
    return [
        'personal_details',
        'name_components',
        'contact_and_addresses',
        'address_details',
        'family_details',
        'physical_details',
        'identity_documents',
        'qualifications',
        'qualification_details',
        'sea_service',
        'previous_employer_references',
        'medical_history',
        'matching_publication',
        'consent_details',
    ];
}

function cpg_normalize_seafarer_workspace_section(string $section, mixed $payload): array {
    if (!in_array($section, cpg_seafarer_workspace_allowed_sections(), true) || !is_array($payload)) {
        return [];
    }

    $normalized = normalize_seafarer_workspace_metadata([$section => $payload]);
    return isset($normalized[$section]) && is_array($normalized[$section]) ? $normalized[$section] : [];
}

function cpg_decode_json_array_field(mixed $value): array {
    if (is_array($value)) {
        return $value;
    }
    if (!is_string($value) || trim($value) === '') {
        return [];
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function cpg_seafarer_profile_sync_context(string $userId): array {
    $result = api_query(
        'SELECT department,
                nationality_code,
                residence_country_code,
                availability_status,
                availability_date,
                preferred_vessel_types,
                salary_expectation_usd,
                document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    return [
        'department' => $row['department'] ?? null,
        'nationality_code' => $row['nationality_code'] ?? null,
        'residence_country_code' => $row['residence_country_code'] ?? null,
        'availability_status' => $row['availability_status'] ?? 'unknown',
        'availability_date' => $row['availability_date'] ?? null,
        'preferred_vessel_types' => cpg_decode_json_array_field($row['preferred_vessel_types'] ?? null),
        'salary_expectation_usd' => $row['salary_expectation_usd'] ?? null,
        'document_metadata' => $row['document_metadata'] ?? null,
    ];
}

function cpg_resolve_seafarer_workspace_user(array $body = []): array {
    $session = cpg_auth_find_active_session();
    $userId = null;
    $accessModel = 'none';
    $actor = is_string($body['actor'] ?? null)
        ? strtolower(trim((string) $body['actor']))
        : (is_string($_GET['actor'] ?? null) ? strtolower(trim((string) $_GET['actor'])) : '');
    $agentFormRequested = $actor === 'agent'
        || is_string($body['assignment_id'] ?? null)
        || is_string($_GET['assignment_id'] ?? null);

    if ($session !== null && !$agentFormRequested) {
        $userId = (string) $session['user_id'];
        $accessModel = 'authenticated_session';
    } else {
        $draftId = '';
        if (isset($body['draft_id']) && is_string($body['draft_id'])) {
            $draftId = $body['draft_id'];
        } elseif (isset($_GET['draft_id']) && is_string($_GET['draft_id'])) {
            $draftId = $_GET['draft_id'];
        }
        $userId = api_normalize_uuid($draftId);
        if ($userId !== null) {
            $accessModel = $agentFormRequested ? 'agent_assignment_draft_context' : 'draft_id_transition';
        }
    }

    if ($userId === null) {
        api_error(401, 'seafarer_workspace_access_required', 'Authenticated session or draft_id is required');
    }

    $role = read_role_for_user($userId);
    if ($role !== 'seafarer') {
        api_error(403, 'seafarer_workspace_not_available', 'Seafarer workspace is available only for seafarer profiles');
    }

    return [$userId, $accessModel];
}

function normalize_department_value(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $department = trim(strtolower($value));
    return in_array($department, ['deck', 'engine', 'catering', 'hotel', 'other'], true) ? $department : null;
}

function normalize_currency_value(mixed $value): string {
    if (!is_string($value)) {
        return 'USD';
    }

    $currency = strtoupper(trim($value));
    return preg_match('/^[A-Z]{3}$/', $currency) ? $currency : 'USD';
}

function normalize_money_value(mixed $value): ?float {
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $amount = (float) $value;
    return $amount >= 0 ? $amount : null;
}

function normalize_positive_decimal_value(mixed $value): ?float {
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $number = (float) $value;
    return $number > 0 ? $number : null;
}

function normalize_nonnegative_integer_value(mixed $value): ?int {
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $number = (int) $value;
    return $number >= 0 ? $number : null;
}

function normalize_contract_duration_unit(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $unit = strtolower(trim($value));
    $aliases = [
        'day' => 'day',
        'days' => 'day',
        'd' => 'day',
        'week' => 'week',
        'weeks' => 'week',
        'w' => 'week',
        'month' => 'month',
        'months' => 'month',
        'm' => 'month',
        'year' => 'year',
        'years' => 'year',
        'y' => 'year',
    ];

    return $aliases[$unit] ?? null;
}

function parse_contract_duration_text(?string $text): array {
    if ($text === null || trim($text) === '') {
        return [null, null];
    }

    if (preg_match('/^\s*([0-9]+(?:\.[0-9]+)?)\s*(day|days|d|week|weeks|w|month|months|m|year|years|y)\b/i', $text, $matches) !== 1) {
        return [null, null];
    }

    $value = normalize_positive_decimal_value($matches[1] ?? null);
    $unit = normalize_contract_duration_unit($matches[2] ?? null);

    return [$value, $unit];
}

function normalize_json_object_payload(mixed $value): array {
    return is_array($value) ? $value : [];
}

function normalize_demand_requirement_kind(mixed $value): string {
    if (!is_string($value)) {
        return 'must_have';
    }

    $kind = strtolower(trim(str_replace('-', '_', $value)));
    return match ($kind) {
        'nice_to_have', 'nice', 'optional', 'preferred' => 'nice_to_have',
        'disqualifying', 'disqualifier', 'exclude', 'blocked' => 'disqualifying',
        default => 'must_have',
    };
}

function demand_requirement_catalog_for_group(string $group): ?string {
    return match ($group) {
        'rank' => 'seafarer_positions',
        'vessel_type' => 'vessel_types',
        'coc' => 'certificate_of_competence_types',
        'endorsement' => 'national_document_types',
        'training' => 'training_course_types',
        'visa' => 'national_document_types',
        default => null,
    };
}

function demand_requirement_key_slug(?string $value): string {
    if ($value === null || trim($value) === '') {
        return '';
    }

    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '_', $slug) ?? '';
    $slug = trim($slug, '_');
    return substr($slug, 0, 80);
}

function normalize_demand_requirement_key(
    string $group,
    string $kind,
    ?string $label,
    array $metadata,
    int $index
): string {
    $slugSource = $label;
    if (($slugSource === null || trim($slugSource) === '') && isset($metadata['language'])) {
        $slugSource = (string) $metadata['language'];
    }
    if (($slugSource === null || trim($slugSource) === '') && isset($metadata['minimum_months'])) {
        $slugSource = (string) $metadata['minimum_months'] . '_months';
    }

    $slug = demand_requirement_key_slug($slugSource);
    if ($slug === '') {
        $slug = 'item_' . (string) $index;
    }

    return substr($group . '_' . $kind . '_' . $slug, 0, 120);
}

function normalize_requirement_metadata_value(mixed $value): mixed {
    if (is_string($value)) {
        return normalize_optional_text($value, 500);
    }
    if (is_int($value) || is_float($value) || is_bool($value)) {
        return $value;
    }
    if (is_array($value)) {
        $normalized = [];
        foreach ($value as $key => $item) {
            if (!is_string($key)) {
                continue;
            }
            $normalizedValue = normalize_requirement_metadata_value($item);
            if ($normalizedValue !== null && $normalizedValue !== '') {
                $normalized[$key] = $normalizedValue;
            }
        }
        return $normalized;
    }
    return null;
}

function normalize_requirement_metadata(array $source): array {
    $metadata = [];
    foreach ($source as $key => $value) {
        if (!is_string($key)) {
            continue;
        }
        $normalizedValue = normalize_requirement_metadata_value($value);
        if ($normalizedValue !== null && $normalizedValue !== '' && $normalizedValue !== []) {
            $metadata[$key] = $normalizedValue;
        }
    }
    return $metadata;
}

function normalize_demand_requirement_item(
    string $group,
    string $kind,
    ?string $label,
    array $metadata,
    string $sourceColumn,
    int $index
): ?array {
    $label = normalize_optional_text($label, 500);
    if ($label === null && $metadata === []) {
        return null;
    }

    $catalogCode = demand_requirement_catalog_for_group($group);
    $referenceValueId = $catalogCode !== null && $label !== null
        ? cpg_workspace_reference_value_id($catalogCode, $label)
        : null;

    return [
        'requirement_group' => $group,
        'requirement_kind' => $kind,
        'requirement_key' => normalize_demand_requirement_key($group, $kind, $label, $metadata, $index),
        'reference_catalog_code' => $catalogCode,
        'reference_value_id' => $referenceValueId,
        'requirement_label' => $label,
        'minimum_validity_days' => normalize_nonnegative_integer_value($metadata['minimum_validity_days'] ?? null),
        'source_column' => $sourceColumn,
        'metadata' => $metadata,
    ];
}

function normalize_demand_requirement_list(mixed $value): array {
    if ($value === null || $value === '') {
        return [];
    }

    if (is_array($value)) {
        if ($value === []) {
            return [];
        }
        $isList = array_keys($value) === range(0, count($value) - 1);
        return $isList ? $value : [$value];
    }

    return [$value];
}

function normalize_labeled_demand_requirements(
    mixed $value,
    string $group,
    string $kind,
    string $sourceColumn
): array {
    $items = [];
    $index = 0;
    foreach (normalize_demand_requirement_list($value) as $rawItem) {
        $index++;
        $metadata = ['source_column' => $sourceColumn];
        $label = null;
        $itemKind = $kind;

        if (is_string($rawItem) || is_numeric($rawItem)) {
            $label = (string) $rawItem;
        } elseif (is_array($rawItem)) {
            $metadata = array_merge($metadata, normalize_requirement_metadata($rawItem));
            foreach (['requirement_label', 'label', 'display_name', 'name', 'value', 'title'] as $labelKey) {
                $candidate = normalize_optional_text($rawItem[$labelKey] ?? null, 500);
                if ($candidate !== null) {
                    $label = $candidate;
                    break;
                }
            }
            $itemKind = normalize_demand_requirement_kind($rawItem['requirement_kind'] ?? $rawItem['kind'] ?? $kind);
        }

        $item = normalize_demand_requirement_item($group, $itemKind, $label, $metadata, $sourceColumn, $index);
        if ($item !== null) {
            $items[] = $item;
        }
    }

    return $items;
}

function normalize_language_demand_requirements(mixed $value, string $sourceColumn): array {
    $items = [];
    $index = 0;
    foreach (normalize_demand_requirement_list($value) as $rawItem) {
        $index++;
        $metadata = ['source_column' => $sourceColumn];
        $label = null;
        $kind = 'must_have';

        if (is_string($rawItem)) {
            $label = $rawItem;
            $metadata['language'] = $rawItem;
        } elseif (is_array($rawItem)) {
            $metadata = array_merge($metadata, normalize_requirement_metadata($rawItem));
            $language = normalize_optional_text($rawItem['language'] ?? $rawItem['name'] ?? $rawItem['value'] ?? null, 120);
            $level = normalize_optional_text($rawItem['level'] ?? $rawItem['required_level'] ?? null, 120);
            $kind = normalize_demand_requirement_kind($rawItem['requirement_kind'] ?? $rawItem['kind'] ?? null);
            if ($language !== null) {
                $metadata['language'] = $language;
            }
            if ($level !== null) {
                $metadata['level'] = $level;
            }
            $label = trim(implode(' ', array_filter([$language, $level], static fn ($part): bool => $part !== null && $part !== '')));
        }

        $item = normalize_demand_requirement_item('language', $kind, $label, $metadata, $sourceColumn, $index);
        if ($item !== null) {
            $items[] = $item;
        }
    }

    return $items;
}

function normalize_sea_service_demand_requirements(mixed $value, string $sourceColumn): array {
    $items = [];
    $index = 0;
    foreach (normalize_demand_requirement_list($value) as $rawItem) {
        $index++;
        $metadata = ['source_column' => $sourceColumn];
        $kind = 'must_have';
        $months = null;
        $rank = null;
        $vesselType = null;

        if (is_numeric($rawItem)) {
            $months = normalize_nonnegative_integer_value($rawItem);
        } elseif (is_array($rawItem)) {
            $metadata = array_merge($metadata, normalize_requirement_metadata($rawItem));
            $kind = normalize_demand_requirement_kind($rawItem['requirement_kind'] ?? $rawItem['kind'] ?? null);
            $months = normalize_nonnegative_integer_value($rawItem['months'] ?? $rawItem['minimum_months'] ?? $rawItem['required_months'] ?? null);
            $rank = normalize_optional_text($rawItem['rank'] ?? null, 160);
            $vesselType = normalize_optional_text($rawItem['vessel_type'] ?? null, 160);
        }

        if ($months !== null) {
            $metadata['minimum_months'] = $months;
        }
        if ($rank !== null) {
            $metadata['rank'] = $rank;
            $metadata['rank_value_id'] = cpg_workspace_reference_value_id('seafarer_positions', $rank);
        }
        if ($vesselType !== null) {
            $metadata['vessel_type'] = $vesselType;
            $metadata['vessel_type_value_id'] = cpg_workspace_reference_value_id('vessel_types', $vesselType);
        }

        $labelParts = [];
        if ($months !== null) {
            $labelParts[] = (string) $months . ' months';
        }
        if ($rank !== null) {
            $labelParts[] = $rank;
        }
        if ($vesselType !== null) {
            $labelParts[] = $vesselType;
        }
        $labelParts[] = 'sea service';

        $item = normalize_demand_requirement_item(
            'sea_service',
            $kind,
            implode(' ', $labelParts),
            $metadata,
            $sourceColumn,
            $index
        );
        if ($item !== null) {
            $items[] = $item;
        }
    }

    return $items;
}

function normalize_direct_demand_requirement_items(mixed $value, string $sourceColumn): array {
    $items = [];
    $index = 0;
    foreach (normalize_demand_requirement_list($value) as $rawItem) {
        if (!is_array($rawItem)) {
            continue;
        }
        $index++;
        $group = normalize_optional_text($rawItem['requirement_group'] ?? $rawItem['group'] ?? null, 80);
        if ($group === null || !in_array($group, ['coc', 'endorsement', 'training', 'visa', 'language', 'sea_service', 'general'], true)) {
            continue;
        }
        $kind = normalize_demand_requirement_kind($rawItem['requirement_kind'] ?? $rawItem['kind'] ?? null);
        $label = normalize_optional_text(
            $rawItem['requirement_label'] ?? $rawItem['label'] ?? $rawItem['display_name'] ?? $rawItem['value'] ?? null,
            500
        );
        $metadata = array_merge(['source_column' => $sourceColumn], normalize_requirement_metadata($rawItem));
        $item = normalize_demand_requirement_item($group, $kind, $label, $metadata, $sourceColumn, $index);
        if ($item !== null) {
            $items[] = $item;
        }
    }

    return $items;
}

function normalize_demand_requirement_payload_items(array $vacancyBody): array {
    $fieldMap = [
        'required_coc_values' => ['coc', 'must_have'],
        'required_endorsement_values' => ['endorsement', 'must_have'],
        'required_training_values' => ['training', 'must_have'],
        'required_visa_values' => ['visa', 'must_have'],
        'must_have_requirements' => ['general', 'must_have'],
        'nice_to_have_requirements' => ['general', 'nice_to_have'],
        'disqualifying_requirements' => ['general', 'disqualifying'],
    ];

    $provided = false;
    $items = [];
    foreach ($fieldMap as $fieldName => [$group, $kind]) {
        if (array_key_exists($fieldName, $vacancyBody)) {
            $provided = true;
            $items = array_merge(
                $items,
                normalize_labeled_demand_requirements($vacancyBody[$fieldName], $group, $kind, 'vacancy.' . $fieldName)
            );
        }
    }

    if (array_key_exists('required_language_levels', $vacancyBody)) {
        $provided = true;
        $items = array_merge(
            $items,
            normalize_language_demand_requirements($vacancyBody['required_language_levels'], 'vacancy.required_language_levels')
        );
    }

    if (array_key_exists('required_sea_service_months', $vacancyBody)) {
        $provided = true;
        $items = array_merge(
            $items,
            normalize_sea_service_demand_requirements($vacancyBody['required_sea_service_months'], 'vacancy.required_sea_service_months')
        );
    }

    if (array_key_exists('demand_requirement_items', $vacancyBody)) {
        $provided = true;
        $items = array_merge(
            $items,
            normalize_direct_demand_requirement_items($vacancyBody['demand_requirement_items'], 'vacancy.demand_requirement_items')
        );
    }

    return [
        'provided' => $provided,
        'items' => $items,
    ];
}

function normalize_vacancy_payload(array $body): ?array {
    $vacancyBody = $body['vacancy'] ?? null;
    if (!is_array($vacancyBody)) {
        return null;
    }

    $vesselBody = $body['vessel'] ?? [];
    if (!is_array($vesselBody)) {
        $vesselBody = [];
    }

    $title = normalize_optional_text($vacancyBody['vacancy_title'] ?? $vacancyBody['title'] ?? null, 240);
    $rank = normalize_optional_text($vacancyBody['rank'] ?? null, 160);
    if ($rank === null) {
        $rank = $title;
    }

    $department = normalize_department_value($vacancyBody['department'] ?? null);
    $vesselType = normalize_optional_text($vacancyBody['vessel_type'] ?? $vesselBody['vessel_type'] ?? null, 160);
    $joinDate = normalize_date_value($vacancyBody['join_date'] ?? null);
    $contractDuration = normalize_optional_text($vacancyBody['contract_duration'] ?? $vacancyBody['duration'] ?? null, 160);
    $durationValue = normalize_positive_decimal_value($vacancyBody['contract_duration_value'] ?? null);
    $durationUnit = normalize_contract_duration_unit($vacancyBody['contract_duration_unit'] ?? null);
    if ($durationValue === null || $durationUnit === null) {
        [$parsedDurationValue, $parsedDurationUnit] = parse_contract_duration_text($contractDuration);
        $durationValue = $durationValue ?? $parsedDurationValue;
        $durationUnit = $durationUnit ?? $parsedDurationUnit;
    }
    $salaryMinUsd = normalize_money_value($vacancyBody['salary_min_usd'] ?? null);
    $salaryMaxUsd = normalize_money_value($vacancyBody['salary_max_usd'] ?? null);

    if ($salaryMinUsd !== null && $salaryMaxUsd !== null && $salaryMaxUsd < $salaryMinUsd) {
        api_error(400, 'invalid_salary_range', 'salary_max_usd must be greater than or equal to salary_min_usd');
    }

    $salaryText = normalize_optional_text($vacancyBody['salary_text'] ?? null, 160);
    $currency = normalize_currency_value($vacancyBody['currency'] ?? null);
    $employerCountryCode = normalize_country_code($vacancyBody['employer_country_code'] ?? $body['country_code'] ?? null);
    $requirements = normalize_optional_text($vacancyBody['requirements'] ?? null, 4000);
    $requiredRankValueId = cpg_workspace_reference_value_id('seafarer_positions', $rank);
    $vesselTypeValueId = cpg_workspace_reference_value_id('vessel_types', $vesselType);
    $passportValidityDays = normalize_nonnegative_integer_value($vacancyBody['required_passport_validity_days'] ?? null);
    $seamanBookValidityDays = normalize_nonnegative_integer_value($vacancyBody['required_seaman_book_validity_days'] ?? null);
    $medicalValidityDays = normalize_nonnegative_integer_value($vacancyBody['required_medical_validity_days'] ?? null);
    $structuredRequirementPayload = normalize_demand_requirement_payload_items($vacancyBody);
    $structuredRequirementItems = $structuredRequirementPayload['items'];
    $structuredRequirementsProvided = (bool) $structuredRequirementPayload['provided'];
    $demandWorkspace = normalize_json_object_payload($vacancyBody['demand_workspace'] ?? null);
    $demandWorkspace['legacy'] = array_filter([
        'rank_text' => $rank,
        'vessel_type_text' => $vesselType,
        'contract_duration_text' => $contractDuration,
        'requirements_text' => $requirements,
    ], static fn ($value): bool => $value !== null && $value !== '');
    if ($structuredRequirementsProvided) {
        $demandWorkspace['structured_requirements'] = $structuredRequirementItems;
    }
    $demandWorkspace['matching_foundation'] = array_filter([
        'required_rank_catalog_linked' => $requiredRankValueId !== null,
        'vessel_type_catalog_linked' => $vesselTypeValueId !== null,
        'contract_duration_structured' => $durationValue !== null && $durationUnit !== null,
        'structured_requirements_ready' => count($structuredRequirementItems) > 0,
    ], static fn ($value): bool => $value !== null);

    $meaningfulValues = [
        $title,
        $rank,
        $department,
        $vesselType,
        $joinDate,
        $contractDuration,
        $salaryMinUsd,
        $salaryMaxUsd,
        $salaryText,
        $requirements,
        count($structuredRequirementItems) > 0 ? 'structured_requirements' : null,
    ];

    $hasMeaningfulVacancyData = false;
    foreach ($meaningfulValues as $value) {
        if ($value !== null && $value !== '') {
            $hasMeaningfulVacancyData = true;
            break;
        }
    }

    if (!$hasMeaningfulVacancyData) {
        return null;
    }

    return [
        'vacancy_title' => $title,
        'rank' => $rank,
        'department' => $department,
        'vessel_type' => $vesselType,
        'join_date' => $joinDate,
        'contract_duration' => $contractDuration,
        'contract_duration_value' => $durationValue,
        'contract_duration_unit' => $durationUnit,
        'salary_min_usd' => $salaryMinUsd,
        'salary_max_usd' => $salaryMaxUsd,
        'salary_text' => $salaryText,
        'currency' => $currency,
        'employer_country_code' => $employerCountryCode,
        'requirements' => $requirements,
        'required_rank_value_id' => $requiredRankValueId,
        'required_rank_label' => $rank,
        'vessel_type_value_id' => $vesselTypeValueId,
        'vessel_type_label' => $vesselType,
        'required_passport_validity_days' => $passportValidityDays,
        'required_seaman_book_validity_days' => $seamanBookValidityDays,
        'required_medical_validity_days' => $medicalValidityDays,
        'structured_requirements_provided' => $structuredRequirementsProvided,
        'structured_requirement_items' => $structuredRequirementItems,
        'demand_workspace' => $demandWorkspace,
    ];
}

function demand_matching_foundation_summary(array $vacancy): array {
    $demandWorkspace = is_array($vacancy['demand_workspace'] ?? null) ? $vacancy['demand_workspace'] : [];
    $structuredRequirements = $demandWorkspace['structured_requirements'] ?? null;

    return [
        'required_rank_catalog_linked' => !empty($vacancy['required_rank_value_id']),
        'vessel_type_catalog_linked' => !empty($vacancy['vessel_type_value_id']),
        'contract_duration_structured' => ($vacancy['contract_duration_value'] ?? null) !== null
            && ($vacancy['contract_duration_unit'] ?? null) !== null,
        'validity_thresholds_ready' => ($vacancy['required_passport_validity_days'] ?? null) !== null
            || ($vacancy['required_seaman_book_validity_days'] ?? null) !== null
            || ($vacancy['required_medical_validity_days'] ?? null) !== null,
        'structured_requirements_ready' => is_array($structuredRequirements) && count($structuredRequirements) > 0,
    ];
}

function upsert_demand_requirement_item(
    string $vacancyRequestId,
    string $requirementGroup,
    ?string $catalogCode,
    ?string $referenceValueId,
    ?string $requirementLabel,
    string $sourceColumn,
    string $requirementKey = 'primary',
    string $requirementKind = 'must_have',
    ?int $minimumValidityDays = null,
    string $source = 'legacy_mapping',
    array $metadataExtra = []
): void {
    if ($referenceValueId === null && ($requirementLabel === null || trim($requirementLabel) === '')) {
        return;
    }

    $metadata = array_merge(['source_column' => $sourceColumn], $metadataExtra);

    api_query(
        "INSERT INTO crewportglobal.demand_requirement_items (
           vacancy_request_id,
           requirement_group,
           requirement_key,
           requirement_kind,
           reference_catalog_code,
           reference_value_id,
           requirement_label,
           minimum_validity_days,
           source,
           metadata
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6::uuid,
           $7,
           $8,
           $9,
           $10::jsonb
         )
         ON CONFLICT (vacancy_request_id, requirement_group, source, requirement_key)
         WHERE record_state = 'active'
         DO UPDATE SET
           requirement_kind = EXCLUDED.requirement_kind,
           reference_catalog_code = EXCLUDED.reference_catalog_code,
           reference_value_id = EXCLUDED.reference_value_id,
           requirement_label = EXCLUDED.requirement_label,
           minimum_validity_days = EXCLUDED.minimum_validity_days,
           metadata = EXCLUDED.metadata,
           updated_at = now()",
        [
            $vacancyRequestId,
            $requirementGroup,
            $requirementKey,
            $requirementKind,
            $catalogCode,
            $referenceValueId,
            $requirementLabel,
            $minimumValidityDays,
            $source,
            cpg_workspace_json($metadata),
        ]
    );
}

function sync_demand_requirement_items(string $vacancyRequestId, array $vacancy): void {
    upsert_demand_requirement_item(
        $vacancyRequestId,
        'rank',
        'seafarer_positions',
        $vacancy['required_rank_value_id'],
        $vacancy['required_rank_label'],
        'vacancy_requests.rank'
    );

    upsert_demand_requirement_item(
        $vacancyRequestId,
        'vessel_type',
        'vessel_types',
        $vacancy['vessel_type_value_id'],
        $vacancy['vessel_type_label'],
        'vacancy_requests.vessel_type'
    );

    if (!($vacancy['structured_requirements_provided'] ?? false)) {
        return;
    }

    api_query(
        "UPDATE crewportglobal.demand_requirement_items
         SET record_state = 'archived',
             updated_at = now()
         WHERE vacancy_request_id = $1
           AND source = 'operator_structured'
           AND record_state = 'active'",
        [$vacancyRequestId]
    );

    foreach (($vacancy['structured_requirement_items'] ?? []) as $item) {
        if (!is_array($item)) {
            continue;
        }
        upsert_demand_requirement_item(
            $vacancyRequestId,
            (string) $item['requirement_group'],
            is_string($item['reference_catalog_code'] ?? null) ? (string) $item['reference_catalog_code'] : null,
            is_string($item['reference_value_id'] ?? null) ? (string) $item['reference_value_id'] : null,
            is_string($item['requirement_label'] ?? null) ? (string) $item['requirement_label'] : null,
            is_string($item['source_column'] ?? null) ? (string) $item['source_column'] : 'vacancy.structured_requirements',
            is_string($item['requirement_key'] ?? null) ? (string) $item['requirement_key'] : 'item',
            normalize_demand_requirement_kind($item['requirement_kind'] ?? null),
            normalize_nonnegative_integer_value($item['minimum_validity_days'] ?? null),
            'operator_structured',
            is_array($item['metadata'] ?? null) ? $item['metadata'] : []
        );
    }
}

function read_demand_requirement_items(string $vacancyRequestId): array {
    $result = api_query(
        "SELECT
            dri.demand_requirement_item_id,
            dri.vacancy_request_id,
            dri.requirement_group,
            dri.requirement_key,
            dri.requirement_kind,
            dri.reference_catalog_code,
            dri.reference_value_id,
            dri.requirement_label,
            dri.minimum_validity_days,
            dri.source,
            dri.record_state,
            dri.metadata,
            rv.display_name AS reference_display_name,
            rv.value_code AS reference_value_code,
            dri.created_at,
            dri.updated_at
         FROM crewportglobal.demand_requirement_items dri
         LEFT JOIN crewportglobal.reference_catalog_values rv ON rv.reference_value_id = dri.reference_value_id
         WHERE dri.vacancy_request_id = $1
           AND dri.record_state = 'active'
         ORDER BY
           CASE dri.requirement_group
             WHEN 'rank' THEN 1
             WHEN 'vessel_type' THEN 2
             WHEN 'coc' THEN 3
             WHEN 'endorsement' THEN 4
             WHEN 'training' THEN 5
             WHEN 'visa' THEN 6
             WHEN 'language' THEN 7
             WHEN 'sea_service' THEN 8
             WHEN 'general' THEN 9
             ELSE 99
           END,
           dri.requirement_kind ASC,
           dri.created_at ASC",
        [$vacancyRequestId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $row['metadata'] = cpg_decode_json_object(is_string($row['metadata'] ?? null) ? $row['metadata'] : null);
        $items[] = $row;
    }

    return $items;
}

function cpg_pg_bool(mixed $value): bool {
    return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
}

function cpg_candidate_search_limit(): int {
    $raw = $_GET['limit'] ?? null;
    if (!is_string($raw) || trim($raw) === '') {
        return 25;
    }

    $limit = (int) $raw;
    if ($limit < 1) {
        return 1;
    }
    if ($limit > 100) {
        return 100;
    }

    return $limit;
}

function cpg_candidate_search_add_issue(array &$issues, string $code, string $message, array $details = []): void {
    $issue = [
        'code' => $code,
        'message' => $message,
    ];
    if ($details !== []) {
        $issue['details'] = $details;
    }
    $issues[] = $issue;
}

function cpg_operator_candidate_search_readiness(array $vacancy, array $requirementItems = []): array {
    $blockers = [];
    $warnings = [];

    if (empty($vacancy['required_rank_value_id'])) {
        cpg_candidate_search_add_issue(
            $blockers,
            'demand_rank_not_catalog_linked',
            'Vacancy rank is not linked to the published seafarer_positions catalog'
        );
    }
    if (empty($vacancy['vessel_type_value_id'])) {
        cpg_candidate_search_add_issue(
            $blockers,
            'demand_vessel_type_not_catalog_linked',
            'Vacancy vessel type is not linked to the published vessel_types catalog'
        );
    }
    if (($vacancy['verification_status'] ?? '') !== 'verified') {
        cpg_candidate_search_add_issue(
            $warnings,
            'company_not_verified',
            'Company is not verified; search results must remain internal'
        );
    }
    if (($vacancy['publication_status'] ?? '') !== 'published') {
        cpg_candidate_search_add_issue(
            $warnings,
            'vacancy_not_published',
            'Vacancy is not published; search results must remain internal'
        );
    }

    foreach ($requirementItems as $item) {
        if (!is_array($item) || ($item['requirement_kind'] ?? null) !== 'must_have') {
            continue;
        }
        $group = $item['requirement_group'] ?? null;
        if (in_array($group, ['visa', 'language', 'general'], true)) {
            cpg_candidate_search_add_issue(
                $warnings,
                'structured_requirement_manual_review_required',
                'Some structured demand requirements are captured but not yet used as automatic blockers',
                [
                    'requirement_group' => $group,
                    'requirement_key' => $item['requirement_key'] ?? null,
                ]
            );
        }
    }

    return [
        'status' => $blockers === [] ? 'search_ready' : 'blocked',
        'blockers' => $blockers,
        'warnings' => $warnings,
    ];
}

function cpg_candidate_search_date_lte(?string $candidateDate, ?string $targetDate): ?bool {
    if ($candidateDate === null || trim($candidateDate) === '' || $targetDate === null || trim($targetDate) === '') {
        return null;
    }

    $candidateTime = strtotime($candidateDate);
    $targetTime = strtotime($targetDate);
    if ($candidateTime === false || $targetTime === false) {
        return null;
    }

    return $candidateTime <= $targetTime;
}

function cpg_candidate_search_normalized_text(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }
    $normalized = trim($value);
    return $normalized === '' ? null : strtolower($normalized);
}

function cpg_candidate_search_expiry_validity(?string $expiryDate, ?string $anchorDate, mixed $requiredDays): array {
    if ($requiredDays === null || $requiredDays === '') {
        return [
            'required' => false,
            'matched' => null,
        ];
    }

    $minimumDays = max(0, (int) $requiredDays);
    $anchorText = is_string($anchorDate) && trim($anchorDate) !== '' ? trim($anchorDate) : gmdate('Y-m-d');
    $expiryText = is_string($expiryDate) && trim($expiryDate) !== '' ? trim($expiryDate) : null;
    if ($expiryText === null) {
        return [
            'required' => true,
            'matched' => false,
            'expiry_date' => null,
            'anchor_date' => $anchorText,
            'minimum_validity_days' => $minimumDays,
            'remaining_days' => null,
            'failure_reason' => 'expiry_missing',
        ];
    }

    try {
        $expiry = new DateTimeImmutable($expiryText);
        $anchor = new DateTimeImmutable($anchorText);
    } catch (Exception) {
        return [
            'required' => true,
            'matched' => false,
            'expiry_date' => $expiryText,
            'anchor_date' => $anchorText,
            'minimum_validity_days' => $minimumDays,
            'remaining_days' => null,
            'failure_reason' => 'expiry_invalid',
        ];
    }

    $remainingDays = (int) floor(($expiry->getTimestamp() - $anchor->getTimestamp()) / 86400);
    $matched = $remainingDays >= $minimumDays;

    return [
        'required' => true,
        'matched' => $matched,
        'expiry_date' => $expiryText,
        'anchor_date' => $anchorText,
        'minimum_validity_days' => $minimumDays,
        'remaining_days' => $remainingDays,
        'failure_reason' => $matched ? null : 'validity_below_requirement',
    ];
}

function cpg_candidate_search_requirement_items(array $items, string $group, string $kind = 'must_have'): array {
    return array_values(array_filter($items, static function (array $item) use ($group, $kind): bool {
        return ($item['requirement_group'] ?? null) === $group
            && ($item['requirement_kind'] ?? null) === $kind
            && ($item['record_state'] ?? 'active') === 'active';
    }));
}

function cpg_candidate_search_text_matches(mixed $left, mixed $right): bool {
    $leftText = cpg_candidate_search_normalized_text($left);
    $rightText = cpg_candidate_search_normalized_text($right);
    return $leftText !== null && $rightText !== null && $leftText === $rightText;
}

function cpg_candidate_search_value_matches(?string $requiredValueId, ?string $requiredLabel, array $candidateItem): bool {
    $candidateValueId = is_string($candidateItem['value_id'] ?? null) ? (string) $candidateItem['value_id'] : null;
    if ($requiredValueId !== null && $candidateValueId !== null && strcasecmp($requiredValueId, $candidateValueId) === 0) {
        return true;
    }

    return cpg_candidate_search_text_matches($requiredLabel, $candidateItem['label'] ?? null);
}

function cpg_candidate_search_catalog_requirements(array $requiredItems, array $candidateItems): array {
    if ($requiredItems === []) {
        return [
            'required' => false,
            'matched' => null,
            'required_count' => 0,
            'matched_count' => 0,
            'missing' => [],
        ];
    }

    $missing = [];
    $matched = [];
    foreach ($requiredItems as $requiredItem) {
        $requiredValueId = is_string($requiredItem['reference_value_id'] ?? null) ? (string) $requiredItem['reference_value_id'] : null;
        $requiredLabel = is_string($requiredItem['requirement_label'] ?? null) ? (string) $requiredItem['requirement_label'] : null;
        $hasMatch = false;
        foreach ($candidateItems as $candidateItem) {
            if (!is_array($candidateItem)) {
                continue;
            }
            if (cpg_candidate_search_value_matches($requiredValueId, $requiredLabel, $candidateItem)) {
                $hasMatch = true;
                break;
            }
        }
        if ($hasMatch) {
            $matched[] = [
                'requirement_key' => $requiredItem['requirement_key'] ?? null,
                'requirement_label' => $requiredLabel,
                'reference_value_id' => $requiredValueId,
            ];
        } else {
            $missing[] = [
                'requirement_key' => $requiredItem['requirement_key'] ?? null,
                'requirement_label' => $requiredLabel,
                'reference_catalog_code' => $requiredItem['reference_catalog_code'] ?? null,
                'reference_value_id' => $requiredValueId,
            ];
        }
    }

    return [
        'required' => true,
        'matched' => $missing === [],
        'required_count' => count($requiredItems),
        'matched_count' => count($matched),
        'missing' => $missing,
        'matched_requirements' => $matched,
    ];
}

function cpg_candidate_search_service_months(mixed $serviceFrom, mixed $serviceTo): int {
    if (!is_string($serviceFrom) || !is_string($serviceTo) || trim($serviceFrom) === '' || trim($serviceTo) === '') {
        return 0;
    }

    try {
        $from = new DateTimeImmutable($serviceFrom);
        $to = new DateTimeImmutable($serviceTo);
    } catch (Exception) {
        return 0;
    }

    if ($to < $from) {
        return 0;
    }

    $diff = $from->diff($to);
    $months = ($diff->y * 12) + $diff->m;
    if ($diff->d >= 15) {
        $months++;
    }

    return max(0, $months);
}

function cpg_candidate_search_sea_service_record_matches(array $requiredItem, array $candidateItem): bool {
    $metadata = is_array($requiredItem['metadata'] ?? null) ? $requiredItem['metadata'] : [];

    $requiredRankValueId = is_string($metadata['rank_value_id'] ?? null) ? (string) $metadata['rank_value_id'] : null;
    $requiredRankLabel = is_string($metadata['rank'] ?? null) ? (string) $metadata['rank'] : null;
    if ($requiredRankValueId !== null || $requiredRankLabel !== null) {
        if (!cpg_candidate_search_value_matches($requiredRankValueId, $requiredRankLabel, [
            'value_id' => $candidateItem['rank_value_id'] ?? null,
            'label' => $candidateItem['rank_label'] ?? null,
        ])) {
            return false;
        }
    }

    $requiredVesselTypeValueId = is_string($metadata['vessel_type_value_id'] ?? null) ? (string) $metadata['vessel_type_value_id'] : null;
    $requiredVesselTypeLabel = is_string($metadata['vessel_type'] ?? null) ? (string) $metadata['vessel_type'] : null;
    if ($requiredVesselTypeValueId !== null || $requiredVesselTypeLabel !== null) {
        if (!cpg_candidate_search_value_matches($requiredVesselTypeValueId, $requiredVesselTypeLabel, [
            'value_id' => $candidateItem['vessel_type_value_id'] ?? null,
            'label' => $candidateItem['vessel_type_label'] ?? null,
        ])) {
            return false;
        }
    }

    return true;
}

function cpg_candidate_search_sea_service_requirements(array $requiredItems, array $candidateItems): array {
    if ($requiredItems === []) {
        return [
            'required' => false,
            'matched' => null,
            'required_count' => 0,
            'matched_count' => 0,
            'missing' => [],
        ];
    }

    $missing = [];
    $matched = [];
    foreach ($requiredItems as $requiredItem) {
        $metadata = is_array($requiredItem['metadata'] ?? null) ? $requiredItem['metadata'] : [];
        $minimumMonths = normalize_nonnegative_integer_value($metadata['minimum_months'] ?? null);
        if ($minimumMonths === null) {
            $missing[] = [
                'requirement_key' => $requiredItem['requirement_key'] ?? null,
                'requirement_label' => $requiredItem['requirement_label'] ?? null,
                'reason' => 'minimum_months_missing',
            ];
            continue;
        }

        $matchedMonths = 0;
        foreach ($candidateItems as $candidateItem) {
            if (!is_array($candidateItem) || !cpg_candidate_search_sea_service_record_matches($requiredItem, $candidateItem)) {
                continue;
            }
            $matchedMonths += cpg_candidate_search_service_months(
                $candidateItem['service_from'] ?? null,
                $candidateItem['service_to'] ?? null
            );
        }

        if ($matchedMonths >= $minimumMonths) {
            $matched[] = [
                'requirement_key' => $requiredItem['requirement_key'] ?? null,
                'requirement_label' => $requiredItem['requirement_label'] ?? null,
                'minimum_months' => $minimumMonths,
                'matched_months' => $matchedMonths,
            ];
        } else {
            $missing[] = [
                'requirement_key' => $requiredItem['requirement_key'] ?? null,
                'requirement_label' => $requiredItem['requirement_label'] ?? null,
                'minimum_months' => $minimumMonths,
                'matched_months' => $matchedMonths,
                'reason' => 'matched_months_below_requirement',
            ];
        }
    }

    return [
        'required' => true,
        'matched' => $missing === [],
        'required_count' => count($requiredItems),
        'matched_count' => count($matched),
        'missing' => $missing,
        'matched_requirements' => $matched,
    ];
}

function cpg_candidate_search_match_level(array $blockers, bool $rankMatched, bool $vesselTypeMatched, bool $availabilityMatched): string {
    if ($blockers !== []) {
        return 'blocked';
    }
    if ($rankMatched && $vesselTypeMatched && $availabilityMatched) {
        return 'match_ready';
    }

    return 'review_possible';
}

function cpg_operator_candidate_search_sort_rank(array $candidate): int {
    return match ($candidate['match_level'] ?? 'blocked') {
        'match_ready' => 1,
        'review_possible' => 2,
        default => 3,
    };
}

function read_operator_vacancy_candidate_search(string $vacancyRequestId, int $limit, ?array $access = null): ?array {
    $vacancy = cpg_fetch_one_assoc(
        "SELECT
            vr.vacancy_request_id,
            vr.company_id,
            vr.vessel_id,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            vr.vessel_type,
            vr.required_rank_value_id,
            vr.required_rank_label,
            vr.vessel_type_value_id,
            vr.vessel_type_label,
            vr.join_date,
            vr.contract_duration_value,
            vr.contract_duration_unit,
            vr.required_passport_validity_days,
            vr.required_medical_validity_days,
            vr.publication_status,
            ec.company_name,
            ec.verification_status,
            v.vessel_name
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE vr.vacancy_request_id = $1
         LIMIT 1",
        [$vacancyRequestId]
    );
    if ($vacancy === null) {
        return null;
    }

    $requirementItems = read_demand_requirement_items($vacancyRequestId);
    $cocRequirements = cpg_candidate_search_requirement_items($requirementItems, 'coc');
    $endorsementRequirements = cpg_candidate_search_requirement_items($requirementItems, 'endorsement');
    $trainingRequirements = cpg_candidate_search_requirement_items($requirementItems, 'training');
    $seaServiceRequirements = cpg_candidate_search_requirement_items($requirementItems, 'sea_service');
    $demandReadiness = cpg_operator_candidate_search_readiness($vacancy, $requirementItems);
    $result = api_query(
        "SELECT
            sp.user_id,
            u.display_name,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code,
            sp.review_status,
            sp.document_metadata,
            rank_ref.reference_value_id AS primary_rank_value_id,
            rank_ref.value_code AS primary_rank_value_code,
            rank_ref.display_name AS primary_rank_catalog_display,
            COALESCE(certificates.certificate_items, '[]'::jsonb) AS certificate_items,
            COALESCE(training.training_items, '[]'::jsonb) AS training_items,
            COALESCE(service_records.sea_service_items, '[]'::jsonb) AS sea_service_items,
            COALESCE(preferred_vessel.preferred_vessel_type_match, FALSE) AS preferred_vessel_type_match,
            COALESCE(sea_service.sea_service_vessel_type_match, FALSE) AS sea_service_vessel_type_match,
            existing_application.application_status AS existing_application_status
         FROM crewportglobal.seafarer_profiles sp
         JOIN crewportglobal.users u ON u.user_id = sp.user_id
         LEFT JOIN LATERAL (
             SELECT rv.reference_value_id, rv.value_code, rv.display_name
             FROM crewportglobal.reference_catalog_values rv
             JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
             WHERE rc.catalog_code = 'seafarer_positions'
               AND rv.publication_state = 'published'
               AND sp.primary_rank IS NOT NULL
               AND lower(rv.display_name) = lower(sp.primary_rank)
             ORDER BY rv.sort_order ASC, rv.display_name ASC
             LIMIT 1
         ) rank_ref ON TRUE
         LEFT JOIN LATERAL (
             SELECT jsonb_agg(
                 jsonb_build_object(
                   'group', sc.certificate_group,
                   'value_id', sc.certificate_type_value_id,
                   'label', sc.certificate_type_label,
                   'expires_at', sc.expires_at,
                   'review_status', sc.review_status
                 )
                 ORDER BY sc.certificate_group ASC, sc.expires_at DESC NULLS LAST, sc.updated_at DESC
             ) AS certificate_items
             FROM crewportglobal.seafarer_certificates sc
             WHERE sc.user_id = sp.user_id
               AND sc.record_state IN ('submitted', 'active', 'draft')
               AND sc.review_status <> 'rejected'
         ) certificates ON TRUE
         LEFT JOIN LATERAL (
             SELECT jsonb_agg(
                 jsonb_build_object(
                   'value_id', str.training_type_value_id,
                   'label', str.training_type_label,
                   'expires_at', str.expires_at,
                   'review_status', str.review_status
                 )
                 ORDER BY str.expires_at DESC NULLS LAST, str.updated_at DESC
             ) AS training_items
             FROM crewportglobal.seafarer_training_records str
             WHERE str.user_id = sp.user_id
               AND str.record_state IN ('submitted', 'active', 'draft')
               AND str.review_status <> 'rejected'
         ) training ON TRUE
         LEFT JOIN LATERAL (
             SELECT jsonb_agg(
                 jsonb_build_object(
                   'vessel_type_value_id', ssr.vessel_type_value_id,
                   'vessel_type_label', ssr.vessel_type_label,
                   'rank_value_id', ssr.rank_value_id,
                   'rank_label', ssr.rank_label,
                   'service_from', ssr.service_from,
                   'service_to', ssr.service_to,
                   'review_status', ssr.review_status
                 )
                 ORDER BY ssr.service_to DESC NULLS LAST, ssr.service_from DESC NULLS LAST, ssr.updated_at DESC
             ) AS sea_service_items
             FROM crewportglobal.seafarer_sea_service_records ssr
             WHERE ssr.user_id = sp.user_id
               AND ssr.record_state IN ('submitted', 'active', 'draft')
               AND ssr.review_status <> 'rejected'
         ) service_records ON TRUE
         LEFT JOIN LATERAL (
             SELECT TRUE AS preferred_vessel_type_match
             FROM jsonb_array_elements_text(
                 CASE
                   WHEN jsonb_typeof(sp.preferred_vessel_types) = 'array' THEN sp.preferred_vessel_types
                   ELSE '[]'::jsonb
                 END
             ) preferred(label)
             WHERE $3::text IS NOT NULL
               AND lower(trim(preferred.label)) = lower($3::text)
             LIMIT 1
         ) preferred_vessel ON TRUE
         LEFT JOIN LATERAL (
             SELECT TRUE AS sea_service_vessel_type_match
             FROM crewportglobal.seafarer_sea_service_records ssr
             WHERE ssr.user_id = sp.user_id
               AND ssr.record_state IN ('submitted', 'active', 'draft')
               AND (
                 ($2::uuid IS NOT NULL AND ssr.vessel_type_value_id = $2::uuid)
                 OR ($3::text IS NOT NULL AND ssr.vessel_type_label IS NOT NULL AND lower(ssr.vessel_type_label) = lower($3::text))
               )
             LIMIT 1
         ) sea_service ON TRUE
         LEFT JOIN LATERAL (
             SELECT va.application_status
             FROM crewportglobal.vacancy_applications va
             WHERE va.vacancy_request_id = $1
               AND va.seafarer_user_id = sp.user_id
             LIMIT 1
         ) existing_application ON TRUE
         WHERE sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved')
         ORDER BY sp.updated_at DESC, sp.created_at DESC
         LIMIT 300",
        [
            $vacancyRequestId,
            $vacancy['vessel_type_value_id'] ?? null,
            $vacancy['vessel_type_label'] ?? $vacancy['vessel_type'] ?? null,
        ]
    );

    $candidates = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $blockers = [];
        $warnings = [];
        $matchedDimensions = [];

        $rankMatched = false;
        if (!empty($vacancy['required_rank_value_id']) && !empty($row['primary_rank_value_id'])) {
            $rankMatched = strcasecmp((string) $vacancy['required_rank_value_id'], (string) $row['primary_rank_value_id']) === 0;
        }
        if ($rankMatched) {
            $matchedDimensions[] = 'rank';
        } elseif (empty($row['primary_rank_value_id'])) {
            cpg_candidate_search_add_issue($blockers, 'candidate_rank_not_catalog_linked', 'Candidate rank is not linked to seafarer_positions');
        } else {
            cpg_candidate_search_add_issue($blockers, 'rank_mismatch', 'Candidate rank does not match the vacancy rank');
        }

        $preferredVesselTypeMatched = cpg_pg_bool($row['preferred_vessel_type_match'] ?? null);
        $seaServiceVesselTypeMatched = cpg_pg_bool($row['sea_service_vessel_type_match'] ?? null);
        $vesselTypeMatched = $preferredVesselTypeMatched || $seaServiceVesselTypeMatched;
        if ($vesselTypeMatched) {
            $matchedDimensions[] = 'vessel_type';
        } else {
            cpg_candidate_search_add_issue($blockers, 'vessel_type_mismatch', 'Candidate has no matching preferred or sea-service vessel type');
        }

        $availabilityMatched = false;
        $availabilityStatus = (string) ($row['availability_status'] ?? 'unknown');
        if ($availabilityStatus === 'available_now') {
            $availabilityMatched = true;
        } elseif ($availabilityStatus === 'available_later') {
            $dateComparison = cpg_candidate_search_date_lte($row['availability_date'] ?? null, $vacancy['join_date'] ?? null);
            if ($dateComparison === true) {
                $availabilityMatched = true;
            } elseif ($dateComparison === false) {
                cpg_candidate_search_add_issue($blockers, 'candidate_available_after_join_date', 'Candidate availability date is after the vacancy join date');
            } else {
                cpg_candidate_search_add_issue($warnings, 'availability_date_missing', 'Candidate availability date needs operator review');
            }
        } else {
            cpg_candidate_search_add_issue($blockers, 'availability_unknown', 'Candidate availability status is unknown');
        }
        if ($availabilityMatched) {
            $matchedDimensions[] = 'availability';
        }

        $demandDepartment = cpg_candidate_search_normalized_text($vacancy['department'] ?? null);
        $candidateDepartment = cpg_candidate_search_normalized_text($row['department'] ?? null);
        $departmentMatched = null;
        if ($demandDepartment !== null) {
            $departmentMatched = $candidateDepartment !== null && $candidateDepartment === $demandDepartment;
            if ($departmentMatched) {
                $matchedDimensions[] = 'department';
            } elseif ($candidateDepartment === null) {
                cpg_candidate_search_add_issue($blockers, 'candidate_department_missing', 'Candidate department is missing for a department-specific vacancy');
            } else {
                cpg_candidate_search_add_issue($blockers, 'department_mismatch', 'Candidate department does not match the vacancy department');
            }
        }

        if (($row['review_status'] ?? '') !== 'approved') {
            cpg_candidate_search_add_issue($blockers, 'candidate_not_approved', 'Candidate profile is not approved for matching review');
        }

        $documentSummary = cpg_seafarer_public_document_summary($row['document_metadata'] ?? null);
        $certificateItems = cpg_decode_json_array_field($row['certificate_items'] ?? null);
        $competencyItems = array_values(array_filter($certificateItems, static function (array $item): bool {
            return ($item['group'] ?? null) !== 'endorsement';
        }));
        $endorsementItems = array_values(array_filter($certificateItems, static function (array $item): bool {
            return ($item['group'] ?? null) === 'endorsement';
        }));
        $trainingItems = cpg_decode_json_array_field($row['training_items'] ?? null);
        $seaServiceItems = cpg_decode_json_array_field($row['sea_service_items'] ?? null);

        $cocRequirementResult = cpg_candidate_search_catalog_requirements($cocRequirements, $competencyItems);
        if (($cocRequirementResult['required'] ?? false) === true) {
            if (($cocRequirementResult['matched'] ?? false) === true) {
                $matchedDimensions[] = 'coc_requirements';
            } else {
                cpg_candidate_search_add_issue($blockers, 'coc_requirement_missing', 'Candidate does not satisfy one or more required COC requirements', [
                    'missing' => $cocRequirementResult['missing'] ?? [],
                ]);
            }
        }

        $endorsementRequirementResult = cpg_candidate_search_catalog_requirements($endorsementRequirements, $endorsementItems);
        if (($endorsementRequirementResult['required'] ?? false) === true) {
            if (($endorsementRequirementResult['matched'] ?? false) === true) {
                $matchedDimensions[] = 'endorsement_requirements';
            } else {
                cpg_candidate_search_add_issue($blockers, 'endorsement_requirement_missing', 'Candidate does not satisfy one or more required endorsement requirements', [
                    'missing' => $endorsementRequirementResult['missing'] ?? [],
                ]);
            }
        }

        $trainingRequirementResult = cpg_candidate_search_catalog_requirements($trainingRequirements, $trainingItems);
        if (($trainingRequirementResult['required'] ?? false) === true) {
            if (($trainingRequirementResult['matched'] ?? false) === true) {
                $matchedDimensions[] = 'training_requirements';
            } else {
                cpg_candidate_search_add_issue($blockers, 'training_requirement_missing', 'Candidate does not satisfy one or more required training requirements', [
                    'missing' => $trainingRequirementResult['missing'] ?? [],
                ]);
            }
        }

        $seaServiceRequirementResult = cpg_candidate_search_sea_service_requirements($seaServiceRequirements, $seaServiceItems);
        if (($seaServiceRequirementResult['required'] ?? false) === true) {
            if (($seaServiceRequirementResult['matched'] ?? false) === true) {
                $matchedDimensions[] = 'sea_service_requirements';
            } else {
                cpg_candidate_search_add_issue($blockers, 'sea_service_months_below_requirement', 'Candidate sea-service evidence is below the structured demand requirement', [
                    'missing' => $seaServiceRequirementResult['missing'] ?? [],
                ]);
            }
        }

        $passportValidity = cpg_candidate_search_expiry_validity(
            $documentSummary['passport_expiry'] ?? null,
            $vacancy['join_date'] ?? null,
            $vacancy['required_passport_validity_days'] ?? null
        );
        if (($passportValidity['required'] ?? false) === true) {
            if (($passportValidity['matched'] ?? false) === true) {
                $matchedDimensions[] = 'passport_validity';
            } elseif (($passportValidity['failure_reason'] ?? '') === 'expiry_missing' || ($passportValidity['failure_reason'] ?? '') === 'expiry_invalid') {
                cpg_candidate_search_add_issue($blockers, 'passport_expiry_missing', 'Candidate passport expiry is missing or invalid for the vacancy validity threshold', [
                    'minimum_validity_days' => $passportValidity['minimum_validity_days'] ?? null,
                ]);
            } else {
                cpg_candidate_search_add_issue($blockers, 'passport_validity_below_requirement', 'Candidate passport validity is below the vacancy requirement', [
                    'minimum_validity_days' => $passportValidity['minimum_validity_days'] ?? null,
                    'remaining_days' => $passportValidity['remaining_days'] ?? null,
                ]);
            }
        }

        $medicalValidity = cpg_candidate_search_expiry_validity(
            $documentSummary['medical_expiry'] ?? null,
            $vacancy['join_date'] ?? null,
            $vacancy['required_medical_validity_days'] ?? null
        );
        if (($medicalValidity['required'] ?? false) === true) {
            if (($medicalValidity['matched'] ?? false) === true) {
                $matchedDimensions[] = 'medical_validity';
            } elseif (($medicalValidity['failure_reason'] ?? '') === 'expiry_missing' || ($medicalValidity['failure_reason'] ?? '') === 'expiry_invalid') {
                cpg_candidate_search_add_issue($blockers, 'medical_expiry_missing', 'Candidate medical expiry is missing or invalid for the vacancy validity threshold', [
                    'minimum_validity_days' => $medicalValidity['minimum_validity_days'] ?? null,
                ]);
            } else {
                cpg_candidate_search_add_issue($blockers, 'medical_validity_below_requirement', 'Candidate medical validity is below the vacancy requirement', [
                    'minimum_validity_days' => $medicalValidity['minimum_validity_days'] ?? null,
                    'remaining_days' => $medicalValidity['remaining_days'] ?? null,
                ]);
            }
        }

        foreach (['certificate_status', 'stcw_status'] as $documentField) {
            if (!cpg_readiness_status_is_ready($documentSummary[$documentField] ?? null)) {
                cpg_candidate_search_add_issue($warnings, 'document_readiness_not_ready', 'Candidate document readiness should be reviewed before presentation', [
                    'field' => $documentField,
                ]);
            }
        }

        if (!empty($row['existing_application_status'])) {
            cpg_candidate_search_add_issue($warnings, 'candidate_already_has_application', 'Candidate already has an application for this vacancy', [
                'application_status' => $row['existing_application_status'],
            ]);
        }

        $matchLevel = cpg_candidate_search_match_level($blockers, $rankMatched, $vesselTypeMatched, $availabilityMatched);
        $candidates[] = [
            'candidate_user_id' => $row['user_id'],
            'display_name' => $row['display_name'],
            'primary_rank' => $row['primary_rank'],
            'primary_rank_value_id' => $row['primary_rank_value_id'],
            'primary_rank_value_code' => $row['primary_rank_value_code'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['country_code'],
            'review_status' => $row['review_status'],
            'document_summary' => $documentSummary,
            'match_level' => $matchLevel,
            'matched_dimensions' => $matchedDimensions,
            'blockers' => $blockers,
            'warnings' => $warnings,
            'dimension_results' => [
                'rank' => [
                    'matched' => $rankMatched,
                    'demand_value_id' => $vacancy['required_rank_value_id'] ?? null,
                    'demand_label' => $vacancy['required_rank_label'] ?? $vacancy['rank'] ?? null,
                    'candidate_value_id' => $row['primary_rank_value_id'],
                    'candidate_label' => $row['primary_rank_catalog_display'] ?? $row['primary_rank'],
                    'match_source' => $rankMatched ? 'catalog_exact' : 'catalog_exact_failed',
                ],
                'vessel_type' => [
                    'matched' => $vesselTypeMatched,
                    'demand_value_id' => $vacancy['vessel_type_value_id'] ?? null,
                    'demand_label' => $vacancy['vessel_type_label'] ?? $vacancy['vessel_type'] ?? null,
                    'preferred_vessel_type_match' => $preferredVesselTypeMatched,
                    'sea_service_vessel_type_match' => $seaServiceVesselTypeMatched,
                    'match_source' => $preferredVesselTypeMatched ? 'preferred_vessel_type_text' : ($seaServiceVesselTypeMatched ? 'sea_service_catalog_or_text' : 'not_matched'),
                ],
                'availability' => [
                    'matched' => $availabilityMatched,
                    'candidate_status' => $row['availability_status'],
                    'candidate_date' => $row['availability_date'],
                    'vacancy_join_date' => $vacancy['join_date'],
                ],
                'department' => [
                    'required' => $demandDepartment !== null,
                    'matched' => $departmentMatched,
                    'demand_department' => $vacancy['department'] ?? null,
                    'candidate_department' => $row['department'] ?? null,
                ],
                'coc_requirements' => $cocRequirementResult,
                'endorsement_requirements' => $endorsementRequirementResult,
                'training_requirements' => $trainingRequirementResult,
                'sea_service_requirements' => $seaServiceRequirementResult,
                'passport_validity' => $passportValidity,
                'medical_validity' => $medicalValidity,
            ],
            'side_effects' => [
                'vacancy_application_created' => false,
                'employer_visible' => false,
                'status_changed' => false,
            ],
        ];
    }

    usort($candidates, static function (array $left, array $right): int {
        $level = cpg_operator_candidate_search_sort_rank($left) <=> cpg_operator_candidate_search_sort_rank($right);
        if ($level !== 0) {
            return $level;
        }
        return count($left['blockers'] ?? []) <=> count($right['blockers'] ?? []);
    });

    $limitedCandidates = array_slice($candidates, 0, $limit);

    return [
        'ok' => true,
        'vacancy_request_id' => $vacancyRequestId,
        'access_model' => operator_access_model($access),
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'search_model' => 'cpg-demand-010-structured-requirement-evaluator',
        'search_scope' => 'operator_internal_only',
        'side_effects' => [
            'creates_vacancy_applications' => false,
            'changes_statuses' => false,
            'employer_visible' => false,
            'writes_audit_events' => false,
        ],
        'computed_operations' => [
            operator_computed_workflow_operation(
                'create_internal_shortlist_draft',
                count($limitedCandidates) > 0,
                count($limitedCandidates) > 0 ? [] : [
                    [
                        'code' => 'no_candidate_search_results',
                        'message' => 'Internal shortlist draft can be created only after candidate-search returns candidates',
                    ],
                ],
                [
                    'record_type' => 'vacancy_request',
                    'record_id' => $vacancyRequestId,
                    'next_record_type_if_executed' => 'operator_shortlist_draft',
                    'next_status_if_executed' => 'needs_review',
                    'responsible_group_after_transition' => 'review_team',
                    'computed_from' => 'candidate_search_results',
                ],
                $access
            ),
        ],
        'demand' => [
            'vacancy_request_id' => $vacancy['vacancy_request_id'],
            'vacancy_title' => $vacancy['vacancy_title'],
            'rank' => $vacancy['rank'],
            'required_rank_value_id' => $vacancy['required_rank_value_id'],
            'required_rank_label' => $vacancy['required_rank_label'],
            'department' => $vacancy['department'],
            'vessel_type' => $vacancy['vessel_type'],
            'vessel_type_value_id' => $vacancy['vessel_type_value_id'],
            'vessel_type_label' => $vacancy['vessel_type_label'],
            'join_date' => $vacancy['join_date'],
            'required_passport_validity_days' => $vacancy['required_passport_validity_days'] ?? null,
            'required_medical_validity_days' => $vacancy['required_medical_validity_days'] ?? null,
            'publication_status' => $vacancy['publication_status'],
            'company_name' => $vacancy['company_name'],
            'company_verification_status' => $vacancy['verification_status'],
            'vessel_name' => $vacancy['vessel_name'],
            'demand_matching_foundation' => demand_matching_foundation_summary($vacancy),
        ],
        'demand_readiness' => $demandReadiness,
        'requirement_items' => $requirementItems,
        'candidates' => $limitedCandidates,
        'count' => count($limitedCandidates),
        'total_considered' => count($candidates),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_operator_vacancy_candidate_search(string $vacancyId, ?array $access = null): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $search = read_operator_vacancy_candidate_search($uuid, cpg_candidate_search_limit(), $access);
    if ($search === null) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    api_json(200, $search);
}

function cpg_operator_shortlist_tables_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $result = api_query(
        "SELECT to_regclass('crewportglobal.operator_shortlist_drafts') AS drafts_table,
                to_regclass('crewportglobal.operator_shortlist_candidates') AS candidates_table"
    );
    $row = pg_fetch_assoc($result);
    $ready = is_array($row)
        && is_string($row['drafts_table'] ?? null)
        && $row['drafts_table'] !== ''
        && is_string($row['candidates_table'] ?? null)
        && $row['candidates_table'] !== '';
    return $ready;
}

function cpg_operator_shortlist_decision(mixed $value): ?string {
    if (!is_string($value) || trim($value) === '') {
        return 'include';
    }

    $decision = trim($value);
    return in_array($decision, ['include', 'hold', 'exclude'], true) ? $decision : null;
}

function cpg_operator_shortlist_candidate_requests(array $body): array {
    $raw = $body['candidates'] ?? null;
    if (!is_array($raw) || $raw === []) {
        api_error(400, 'shortlist_candidates_required', 'candidates must be a non-empty array');
    }

    $items = [];
    foreach ($raw as $index => $item) {
        $candidateId = null;
        $decisionValue = null;
        $noteValue = null;
        if (is_string($item)) {
            $candidateId = $item;
        } elseif (is_array($item)) {
            $candidateId = is_string($item['candidate_user_id'] ?? null) ? $item['candidate_user_id'] : null;
            $decisionValue = $item['operator_decision'] ?? $item['decision'] ?? null;
            $noteValue = $item['operator_note'] ?? $item['note'] ?? null;
        }

        $uuid = $candidateId !== null ? api_normalize_uuid($candidateId) : null;
        if ($uuid === null) {
            api_json(400, [
                'ok' => false,
                'error' => 'invalid_shortlist_candidate_id',
                'message' => 'candidate_user_id must be a valid UUID',
                'index' => $index,
            ]);
        }

        $decision = cpg_operator_shortlist_decision($decisionValue);
        if ($decision === null) {
            api_json(400, [
                'ok' => false,
                'error' => 'invalid_shortlist_candidate_decision',
                'message' => 'operator_decision must be include, hold or exclude',
                'candidate_user_id' => $uuid,
            ]);
        }

        $items[$uuid] = [
            'candidate_user_id' => $uuid,
            'operator_decision' => $decision,
            'operator_note' => normalize_optional_text($noteValue, 1000),
        ];
    }

    return array_values($items);
}

function cpg_operator_shortlist_issue_codes(array $issues): array {
    $codes = [];
    foreach ($issues as $issue) {
        if (is_array($issue) && is_string($issue['code'] ?? null) && trim($issue['code']) !== '') {
            $codes[] = trim($issue['code']);
        }
    }
    return array_values(array_unique($codes));
}

function cpg_operator_shortlist_candidate_snapshot(array $candidate): array {
    return cpg_workspace_clean_record([
        'candidate_user_id' => $candidate['candidate_user_id'] ?? null,
        'display_name' => $candidate['display_name'] ?? null,
        'primary_rank' => $candidate['primary_rank'] ?? null,
        'department' => $candidate['department'] ?? null,
        'availability_status' => $candidate['availability_status'] ?? null,
        'availability_date' => $candidate['availability_date'] ?? null,
        'review_status' => $candidate['review_status'] ?? null,
        'document_summary' => is_array($candidate['document_summary'] ?? null) ? $candidate['document_summary'] : [],
        'match_level' => $candidate['match_level'] ?? null,
        'matched_dimensions' => is_array($candidate['matched_dimensions'] ?? null) ? $candidate['matched_dimensions'] : [],
        'blockers' => is_array($candidate['blockers'] ?? null) ? $candidate['blockers'] : [],
        'warnings' => is_array($candidate['warnings'] ?? null) ? $candidate['warnings'] : [],
        'dimension_results' => is_array($candidate['dimension_results'] ?? null) ? $candidate['dimension_results'] : [],
        'side_effects' => is_array($candidate['side_effects'] ?? null) ? $candidate['side_effects'] : [],
    ]);
}

function cpg_operator_shortlist_add_blocker(array &$blockers, string $code, string $message, array $details = []): void {
    cpg_approval_add_blocker($blockers, $code, $message, $details);
}

function cpg_operator_shortlist_candidate_guard(array $candidate): array {
    $blockers = [];
    $warnings = [];
    $candidateId = is_string($candidate['candidate_user_id'] ?? null) ? (string) $candidate['candidate_user_id'] : '';
    $searchBlockerCodes = cpg_operator_shortlist_issue_codes(is_array($candidate['blockers'] ?? null) ? $candidate['blockers'] : []);
    if ($searchBlockerCodes !== []) {
        cpg_operator_shortlist_add_blocker($blockers, 'candidate_search_blocked', 'Candidate search returned hard blockers', [
            'blocker_codes' => $searchBlockerCodes,
        ]);
    }

    $dimensionResults = is_array($candidate['dimension_results'] ?? null) ? $candidate['dimension_results'] : [];
    foreach ([
        'coc_requirements',
        'endorsement_requirements',
        'training_requirements',
        'sea_service_requirements',
    ] as $dimension) {
        $result = is_array($dimensionResults[$dimension] ?? null) ? $dimensionResults[$dimension] : [];
        if (($result['required'] ?? false) !== true || ($result['matched'] ?? null) === true) {
            continue;
        }
        cpg_operator_shortlist_add_blocker($blockers, 'structured_requirement_unmatched', 'Required structured demand dimension is not matched', [
            'dimension' => $dimension,
            'missing' => is_array($result['missing'] ?? null) ? $result['missing'] : [],
        ]);
    }

    if ($candidateId !== '') {
        if (!cpg_seafarer_consent_table_ready()) {
            cpg_operator_shortlist_add_blocker($blockers, 'consent_event_store_missing', 'Versioned consent event store is not available');
        } else {
            $activeConsents = cpg_seafarer_active_consent_events($candidateId);
            if (!isset($activeConsents['matching_preparation'])) {
                cpg_operator_shortlist_add_blocker($blockers, 'missing_matching_preparation_consent', 'Candidate matching-preparation consent is missing or withdrawn');
            }
            if (!isset($activeConsents['employer_sharing'])) {
                cpg_operator_shortlist_add_blocker($blockers, 'missing_employer_sharing_consent', 'Candidate employer-sharing consent is missing or withdrawn');
            }
        }

        $profile = cpg_fetch_one_assoc(
            'SELECT document_metadata
             FROM crewportglobal.seafarer_profiles
             WHERE user_id = $1
             LIMIT 1',
            [$candidateId]
        );
        if ($profile !== null) {
            $cardReviewStates = cpg_seafarer_workspace_card_review_states($profile['document_metadata'] ?? null);
            foreach ($cardReviewStates as $cardCode => $state) {
                if (($state['review_status'] ?? null) !== 'correction_requested') {
                    continue;
                }
                cpg_operator_shortlist_add_blocker($blockers, 'source_card_correction_open', 'Unresolved source-card correction blocks shortlist inclusion', [
                    'card_code' => (string) $cardCode,
                    'card_name' => cpg_seafarer_review_card_name((string) $cardCode) ?? (string) $cardCode,
                ]);
            }
        }
    }

    $snapshot = cpg_operator_shortlist_candidate_snapshot($candidate);
    $forbiddenHits = cpg_payload_forbidden_key_hits($snapshot, cpg_employer_payload_forbidden_keys());
    if ($forbiddenHits !== []) {
        cpg_operator_shortlist_add_blocker($blockers, 'employer_payload_forbidden_field_risk', 'Shortlist candidate snapshot contains forbidden employer-facing fields', [
            'fields' => $forbiddenHits,
        ]);
    }

    $warnings[] = [
        'code' => 'restricted_medical_not_requested',
        'message' => 'General operator shortlist guard does not require restricted medical details',
    ];

    return [
        'approval_status' => $blockers === [] ? 'ready_for_internal_shortlist' : 'blocked',
        'approval_blockers' => $blockers,
        'approval_warnings' => $warnings,
        'required_consent_types' => cpg_seafarer_required_presentation_consent_types(),
        'restricted_medical_access' => [
            'general_operator_details_visible' => false,
            'required_for_this_guard' => false,
        ],
        'employer_visibility' => false,
    ];
}

function cpg_operator_shortlist_draft_status(array $candidateRows): string {
    foreach ($candidateRows as $row) {
        if (($row['operator_decision'] ?? 'hold') !== 'include') {
            return 'needs_review';
        }
        if (($row['approval_guard_result']['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist') {
            return 'needs_review';
        }
    }

    return 'draft';
}

function cpg_operator_shortlist_read(string $shortlistDraftId): ?array {
    $draft = cpg_fetch_one_assoc(
        'SELECT
            shortlist_draft_id,
            vacancy_request_id,
            created_by_operator_context,
            search_model,
            search_snapshot,
            approval_guard_snapshot,
            draft_status,
            employer_visible,
            created_at,
            updated_at,
            archived_at
         FROM crewportglobal.operator_shortlist_drafts
         WHERE shortlist_draft_id = $1
         LIMIT 1',
        [$shortlistDraftId]
    );
    if ($draft === null) {
        return null;
    }

    $candidateRows = cpg_fetch_all_assoc(
        'SELECT
            shortlist_candidate_id,
            shortlist_draft_id,
            candidate_user_id,
            candidate_search_result,
            match_level,
            blocker_codes,
            approval_guard_result,
            operator_decision,
            operator_note,
            employer_visible,
            created_at,
            updated_at
         FROM crewportglobal.operator_shortlist_candidates
         WHERE shortlist_draft_id = $1
         ORDER BY created_at ASC, shortlist_candidate_id ASC',
        [$shortlistDraftId]
    );

    return [
        'shortlist_draft_id' => $draft['shortlist_draft_id'],
        'vacancy_request_id' => $draft['vacancy_request_id'],
        'created_by_operator_context' => cpg_decode_json_object($draft['created_by_operator_context'] ?? null),
        'search_model' => $draft['search_model'],
        'search_snapshot' => cpg_decode_json_object($draft['search_snapshot'] ?? null),
        'approval_guard_snapshot' => cpg_decode_json_object($draft['approval_guard_snapshot'] ?? null),
        'draft_status' => $draft['draft_status'],
        'employer_visible' => cpg_pg_bool($draft['employer_visible'] ?? null),
        'created_at' => $draft['created_at'],
        'updated_at' => $draft['updated_at'],
        'archived_at' => $draft['archived_at'],
        'candidates' => array_map(static function (array $row): array {
            return [
                'shortlist_candidate_id' => $row['shortlist_candidate_id'],
                'shortlist_draft_id' => $row['shortlist_draft_id'],
                'candidate_user_id' => $row['candidate_user_id'],
                'candidate_search_result' => cpg_decode_json_object($row['candidate_search_result'] ?? null),
                'match_level' => $row['match_level'],
                'blocker_codes' => cpg_decode_json_array_field($row['blocker_codes'] ?? null),
                'approval_guard_result' => cpg_decode_json_object($row['approval_guard_result'] ?? null),
                'operator_decision' => $row['operator_decision'],
                'operator_note' => $row['operator_note'],
                'employer_visible' => cpg_pg_bool($row['employer_visible'] ?? null),
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ];
        }, $candidateRows),
    ];
}

function handle_post_operator_vacancy_shortlist_draft(string $vacancyId, ?array $access = null): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }
    if (!cpg_operator_shortlist_tables_ready()) {
        api_error(503, 'operator_shortlist_store_missing', 'Operator shortlist draft tables are not available');
    }

    $body = api_decode_json_body();
    $candidateRequests = cpg_operator_shortlist_candidate_requests($body);
    $search = read_operator_vacancy_candidate_search($uuid, cpg_candidate_search_limit());
    if ($search === null) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    $candidateById = [];
    foreach (($search['candidates'] ?? []) as $candidate) {
        if (is_array($candidate) && is_string($candidate['candidate_user_id'] ?? null)) {
            $candidateById[(string) $candidate['candidate_user_id']] = $candidate;
        }
    }

    $candidateRows = [];
    $includeBlockers = [];
    foreach ($candidateRequests as $request) {
        $candidateId = $request['candidate_user_id'];
        if (!isset($candidateById[$candidateId])) {
            api_json(404, [
                'ok' => false,
                'error' => 'shortlist_candidate_not_in_search_results',
                'message' => 'Candidate is not available in current candidate-search results',
                'candidate_user_id' => $candidateId,
            ]);
        }
        $candidate = $candidateById[$candidateId];
        $guard = cpg_operator_shortlist_candidate_guard($candidate);
        if ($request['operator_decision'] === 'include' && ($guard['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist') {
            $includeBlockers[] = [
                'candidate_user_id' => $candidateId,
                'approval_guard_result' => $guard,
            ];
        }
        $candidateRows[] = [
            'candidate_user_id' => $candidateId,
            'candidate_search_result' => cpg_operator_shortlist_candidate_snapshot($candidate),
            'match_level' => $candidate['match_level'] ?? null,
            'blocker_codes' => cpg_operator_shortlist_issue_codes(is_array($candidate['blockers'] ?? null) ? $candidate['blockers'] : []),
            'approval_guard_result' => $guard,
            'operator_decision' => $request['operator_decision'],
            'operator_note' => $request['operator_note'],
        ];
    }

    if ($includeBlockers !== []) {
        api_json(409, [
            'ok' => false,
            'error' => 'shortlist_guard_blocked',
            'message' => 'One or more requested include decisions are blocked by the internal shortlist guard',
            'blocked_candidates' => $includeBlockers,
            'side_effects' => [
                'created_internal_shortlist_draft' => false,
                'creates_vacancy_applications' => false,
                'changes_statuses' => false,
                'employer_visible' => false,
            ],
        ]);
    }

    $draftStatus = cpg_operator_shortlist_draft_status($candidateRows);
    $approvalGuardSnapshot = [
        'candidate_count' => count($candidateRows),
        'blocked_candidate_count' => count(array_filter($candidateRows, static function (array $row): bool {
            return ($row['approval_guard_result']['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist';
        })),
        'included_candidate_count' => count(array_filter($candidateRows, static function (array $row): bool {
            return ($row['operator_decision'] ?? null) === 'include';
        })),
        'employer_visible' => false,
    ];
    $searchSnapshot = [
        'search_model' => $search['search_model'] ?? null,
        'search_scope' => $search['search_scope'] ?? null,
        'demand' => $search['demand'] ?? [],
        'demand_readiness' => $search['demand_readiness'] ?? [],
        'total_considered' => $search['total_considered'] ?? null,
        'generated_at' => $search['generated_at'] ?? null,
    ];

    api_tx_begin();
    try {
        $result = api_query(
            'INSERT INTO crewportglobal.operator_shortlist_drafts (
                vacancy_request_id,
                created_by_operator_context,
                search_model,
                search_snapshot,
                approval_guard_snapshot,
                draft_status,
                employer_visible
             ) VALUES (
                $1,
                $2::jsonb,
                $3,
                $4::jsonb,
                $5::jsonb,
                $6,
                false
             )
             RETURNING shortlist_draft_id',
            [
                $uuid,
                cpg_workspace_json(operator_workflow_actor_context($access, 'create_internal_shortlist_draft')),
                (string) ($search['search_model'] ?? 'unknown'),
                cpg_workspace_json($searchSnapshot),
                cpg_workspace_json($approvalGuardSnapshot),
                $draftStatus,
            ]
        );
        $draftRow = pg_fetch_assoc($result);
        if (!is_array($draftRow) || !is_string($draftRow['shortlist_draft_id'] ?? null)) {
            api_tx_rollback();
            api_error(500, 'shortlist_draft_create_failed', 'Unable to create internal shortlist draft');
        }
        $shortlistDraftId = (string) $draftRow['shortlist_draft_id'];

        foreach ($candidateRows as $row) {
            api_query(
                'INSERT INTO crewportglobal.operator_shortlist_candidates (
                    shortlist_draft_id,
                    candidate_user_id,
                    candidate_search_result,
                    match_level,
                    blocker_codes,
                    approval_guard_result,
                    operator_decision,
                    operator_note,
                    employer_visible
                 ) VALUES (
                    $1,
                    $2,
                    $3::jsonb,
                    $4,
                    $5::jsonb,
                    $6::jsonb,
                    $7,
                    $8,
                    false
                 )',
                [
                    $shortlistDraftId,
                    $row['candidate_user_id'],
                    cpg_workspace_json($row['candidate_search_result']),
                    $row['match_level'],
                    cpg_workspace_json(array_values($row['blocker_codes'])),
                    cpg_workspace_json($row['approval_guard_result']),
                    $row['operator_decision'],
                    $row['operator_note'],
                ]
            );
        }

        $vacancyContext = cpg_fetch_one_assoc(
            'SELECT created_by_user_id, company_id, vessel_id
             FROM crewportglobal.vacancy_requests
             WHERE vacancy_request_id = $1
             LIMIT 1',
            [$uuid]
        );
        if ($vacancyContext !== null && is_string($vacancyContext['created_by_user_id'] ?? null)) {
            write_audit_event(
                'operator_shortlist_draft_created',
                (string) $vacancyContext['created_by_user_id'],
                is_string($vacancyContext['company_id'] ?? null) ? (string) $vacancyContext['company_id'] : null,
                is_string($vacancyContext['vessel_id'] ?? null) ? (string) $vacancyContext['vessel_id'] : null,
                [
                    'shortlist_draft_id' => $shortlistDraftId,
                    'vacancy_request_id' => $uuid,
                    'draft_status' => $draftStatus,
                    'actor_context' => operator_workflow_actor_context($access, 'create_internal_shortlist_draft'),
                    'candidate_count' => count($candidateRows),
                    'included_candidate_count' => $approvalGuardSnapshot['included_candidate_count'],
                    'blocked_candidate_count' => $approvalGuardSnapshot['blocked_candidate_count'],
                    'employer_visible' => false,
                    'creates_vacancy_applications' => false,
                ],
                'operator_shortlist_draft'
            );
        }

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'shortlist_draft_create_failed', $error->getMessage());
    }

    $draft = cpg_operator_shortlist_read($shortlistDraftId);
    $internalApprovalGuard = is_array($draft) ? cpg_operator_shortlist_internal_approval_guard($draft) : null;
    $reviewApplicationGuard = is_array($draft) ? cpg_operator_shortlist_review_application_guard($draft) : null;
    api_json(201, [
        'ok' => true,
        'shortlist_draft' => $draft,
        'computed_operations' => is_array($draft)
            ? cpg_operator_shortlist_computed_operations($draft, $internalApprovalGuard, $reviewApplicationGuard, $access)
            : [],
        'side_effects' => [
            'created_internal_shortlist_draft' => true,
            'creates_vacancy_applications' => false,
            'changes_statuses' => false,
            'employer_visible' => false,
        ],
    ]);
}

function handle_get_operator_shortlist_draft(string $shortlistDraftId, ?array $access = null): void {
    $uuid = api_normalize_uuid($shortlistDraftId);
    if ($uuid === null) {
        api_error(400, 'invalid_shortlist_draft_id', 'shortlist_draft_id must be a valid UUID');
    }
    if (!cpg_operator_shortlist_tables_ready()) {
        api_error(503, 'operator_shortlist_store_missing', 'Operator shortlist draft tables are not available');
    }

    $draft = cpg_operator_shortlist_read($uuid);
    if ($draft === null) {
        api_error(404, 'shortlist_draft_not_found', 'Internal shortlist draft not found');
    }

    $internalApprovalGuard = cpg_operator_shortlist_internal_approval_guard($draft);
    $reviewApplicationGuard = cpg_operator_shortlist_review_application_guard($draft);
    $computedOperations = cpg_operator_shortlist_computed_operations(
        $draft,
        $internalApprovalGuard,
        $reviewApplicationGuard,
        $access
    );

    api_json(200, [
        'ok' => true,
        'shortlist_draft' => $draft,
        'computed_operations' => $computedOperations,
        'drill_down' => cpg_operator_shortlist_drill_down($draft, $internalApprovalGuard, $reviewApplicationGuard, $computedOperations),
    ]);
}

function cpg_operator_shortlist_list_page_size(): int {
    $raw = $_GET['page_size'] ?? null;
    $pageSize = is_string($raw) && trim($raw) !== '' ? (int) $raw : 25;
    if ($pageSize < 10) {
        return 10;
    }
    if ($pageSize > 100) {
        return 100;
    }
    return $pageSize;
}

function cpg_operator_shortlist_list_page(): int {
    $raw = $_GET['page'] ?? null;
    $page = is_string($raw) && trim($raw) !== '' ? (int) $raw : 1;
    return max(1, $page);
}

function cpg_operator_shortlist_list_status(): string {
    $raw = $_GET['status'] ?? null;
    $status = is_string($raw) && trim($raw) !== '' ? trim($raw) : 'all';
    return in_array($status, ['all', 'draft', 'needs_review', 'approved_internal', 'rejected', 'archived'], true)
        ? $status
        : 'all';
}

function cpg_operator_shortlist_first_next_operation(array $operations): ?array {
    $firstVisible = null;
    foreach ($operations as $operation) {
        if (!is_array($operation)) {
            continue;
        }
        if ($firstVisible === null) {
            $firstVisible = $operation;
        }
        $access = is_array($operation['required_access'] ?? null) ? $operation['required_access'] : [];
        if (($operation['is_executable'] ?? false) === true && ($access['allowed'] ?? true) === true) {
            return $operation;
        }
    }

    return $firstVisible;
}

function cpg_operator_shortlist_task_url(string $shortlistDraftId, ?array $operation): string {
    $operationCode = is_array($operation) && is_string($operation['operation_code'] ?? null)
        ? (string) $operation['operation_code']
        : '';
    $params = [
        'queue_type' => 'operator_shortlist_draft',
        'queue_item_id' => $shortlistDraftId,
        'shortlist_draft_id' => $shortlistDraftId,
    ];
    if ($operationCode !== '') {
        $params['task_operation'] = $operationCode;
    }

    return '/verify/?' . http_build_query($params);
}

function cpg_operator_shortlist_actor_summary(mixed $context): ?array {
    if (!is_array($context)) {
        return null;
    }

    return cpg_workspace_clean_record([
        'operation_code' => $context['operation_code'] ?? null,
        'access_model' => $context['access_model'] ?? ($context['mode'] ?? null),
        'actor_label' => $context['actor_label'] ?? null,
        'actor_user_id' => $context['actor_user_id'] ?? null,
        'target_group_code' => $context['target_group_code'] ?? null,
        'target_role_code' => $context['target_role_code'] ?? null,
        'required_permission_code' => $context['required_permission_code'] ?? null,
        'scope' => $context['scope'] ?? null,
        'permission_boundary' => $context['permission_boundary'] ?? null,
    ]);
}

function cpg_operator_shortlist_audit_events(string $shortlistDraftId): array {
    $rows = cpg_fetch_all_assoc(
        "SELECT event_type,
                source,
                created_at::text AS created_at,
                event_payload::text AS event_payload
         FROM crewportglobal.registration_audit_events
         WHERE event_payload->>'shortlist_draft_id' = $1
         ORDER BY created_at ASC, registration_audit_event_id ASC",
        [$shortlistDraftId]
    );

    return array_values(array_map(static function (array $row): array {
        $payload = cpg_decode_json_object($row['event_payload'] ?? null);
        $actorContext = cpg_operator_shortlist_actor_summary($payload['actor_context'] ?? null);
        return cpg_workspace_clean_record([
            'event_type' => $row['event_type'] ?? null,
            'source' => $row['source'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'actor_context' => $actorContext,
            'decision' => $payload['decision'] ?? null,
            'previous_status' => $payload['previous_status'] ?? null,
            'new_status' => $payload['new_status'] ?? null,
            'candidate_count' => $payload['candidate_count'] ?? null,
            'included_candidate_count' => $payload['included_candidate_count'] ?? null,
            'blocked_candidate_count' => $payload['blocked_candidate_count'] ?? null,
            'created_count' => $payload['created_count'] ?? null,
            'reused_count' => $payload['reused_count'] ?? null,
            'reset_count' => $payload['reset_count'] ?? null,
            'employer_visible' => $payload['employer_visible'] ?? null,
            'creates_vacancy_applications' => $payload['creates_vacancy_applications'] ?? null,
            'changes_application_statuses' => $payload['changes_application_statuses'] ?? null,
        ]);
    }, $rows));
}

function cpg_operator_shortlist_find_audit_event(array $events, string $eventType): ?array {
    $matched = null;
    foreach ($events as $event) {
        if (is_array($event) && ($event['event_type'] ?? null) === $eventType) {
            $matched = $event;
        }
    }

    return $matched;
}

function cpg_operator_shortlist_guard_blocker_codes(array $guard): array {
    $codes = [];
    $blockers = is_array($guard['approval_blockers'] ?? null) ? $guard['approval_blockers'] : [];
    foreach ($blockers as $blocker) {
        if (is_array($blocker) && is_string($blocker['code'] ?? null) && trim((string) $blocker['code']) !== '') {
            $codes[] = trim((string) $blocker['code']);
        } elseif (is_string($blocker) && trim($blocker) !== '') {
            $codes[] = trim($blocker);
        }
    }

    return array_values(array_unique($codes));
}

function cpg_operator_shortlist_code_delta(array $createdCodes, array $currentCodes): array {
    $created = array_values(array_unique(array_filter(array_map('strval', $createdCodes), static fn(string $value): bool => trim($value) !== '')));
    $current = array_values(array_unique(array_filter(array_map('strval', $currentCodes), static fn(string $value): bool => trim($value) !== '')));

    return [
        'unchanged_blockers' => array_values(array_intersect($created, $current)),
        'resolved_blockers' => array_values(array_diff($created, $current)),
        'new_blockers' => array_values(array_diff($current, $created)),
    ];
}

function cpg_operator_shortlist_current_candidate_map(string $vacancyRequestId): array {
    $search = $vacancyRequestId !== '' ? read_operator_vacancy_candidate_search($vacancyRequestId, 100) : null;
    $map = [];
    if (!is_array($search)) {
        return [
            'search_available' => false,
            'candidates' => [],
        ];
    }

    foreach (($search['candidates'] ?? []) as $candidate) {
        if (is_array($candidate) && is_string($candidate['candidate_user_id'] ?? null) && trim((string) $candidate['candidate_user_id']) !== '') {
            $map[(string) $candidate['candidate_user_id']] = $candidate;
        }
    }

    return [
        'search_available' => true,
        'candidates' => $map,
    ];
}

function cpg_operator_shortlist_candidate_drilldown(array $candidate, array $currentCandidateMap): array {
    $candidateId = is_string($candidate['candidate_user_id'] ?? null) ? (string) $candidate['candidate_user_id'] : '';
    $snapshot = is_array($candidate['candidate_search_result'] ?? null) ? $candidate['candidate_search_result'] : [];
    $createdSearchBlockers = array_values(array_filter(array_map('strval', is_array($candidate['blocker_codes'] ?? null) ? $candidate['blocker_codes'] : [])));
    $createdGuard = is_array($candidate['approval_guard_result'] ?? null) ? $candidate['approval_guard_result'] : [];
    $createdGuardBlockers = cpg_operator_shortlist_guard_blocker_codes($createdGuard);
    $currentCandidate = $candidateId !== '' && isset($currentCandidateMap[$candidateId]) && is_array($currentCandidateMap[$candidateId])
        ? $currentCandidateMap[$candidateId]
        : null;

    if ($currentCandidate !== null) {
        $currentSearchBlockers = cpg_operator_shortlist_issue_codes(is_array($currentCandidate['blockers'] ?? null) ? $currentCandidate['blockers'] : []);
        $currentGuard = cpg_operator_shortlist_candidate_guard($currentCandidate);
        $currentGuardBlockers = cpg_operator_shortlist_guard_blocker_codes($currentGuard);
        $currentStatus = 'found_in_current_search';
        $currentMatchLevel = $currentCandidate['match_level'] ?? null;
    } else {
        $currentSearchBlockers = ['candidate_not_in_current_search_results'];
        $currentGuard = [
            'approval_status' => 'blocked',
            'approval_blockers' => [
                [
                    'code' => 'candidate_not_in_current_search_results',
                    'message' => 'Candidate is not present in current candidate-search results',
                ],
            ],
        ];
        $currentGuardBlockers = ['candidate_not_in_current_search_results'];
        $currentStatus = 'missing_from_current_search';
        $currentMatchLevel = null;
    }

    $createdCombined = array_values(array_unique(array_merge($createdSearchBlockers, $createdGuardBlockers)));
    $currentCombined = array_values(array_unique(array_merge($currentSearchBlockers, $currentGuardBlockers)));

    return cpg_workspace_clean_record([
        'candidate_user_id' => $candidateId,
        'display_name' => $snapshot['display_name'] ?? null,
        'operator_decision' => $candidate['operator_decision'] ?? null,
        'match_level_at_creation' => $candidate['match_level'] ?? null,
        'current_match_level' => $currentMatchLevel,
        'employer_visible' => false,
        'creation_blockers' => [
            'search_blocker_codes' => $createdSearchBlockers,
            'approval_status' => $createdGuard['approval_status'] ?? null,
            'approval_blocker_codes' => $createdGuardBlockers,
            'combined_blocker_codes' => $createdCombined,
        ],
        'current_blockers' => [
            'status' => $currentStatus,
            'search_blocker_codes' => $currentSearchBlockers,
            'approval_status' => $currentGuard['approval_status'] ?? null,
            'approval_blocker_codes' => $currentGuardBlockers,
            'combined_blocker_codes' => $currentCombined,
        ],
        'blocker_delta' => cpg_operator_shortlist_code_delta($createdCombined, $currentCombined),
    ]);
}

function cpg_operator_shortlist_drill_down(array $draft, array $internalApprovalGuard, array $reviewApplicationGuard, array $operations): array {
    $draftId = is_string($draft['shortlist_draft_id'] ?? null) ? (string) $draft['shortlist_draft_id'] : '';
    $vacancyId = is_string($draft['vacancy_request_id'] ?? null) ? (string) $draft['vacancy_request_id'] : '';
    $auditEvents = $draftId !== '' ? cpg_operator_shortlist_audit_events($draftId) : [];
    $createdAudit = cpg_operator_shortlist_find_audit_event($auditEvents, 'operator_shortlist_draft_created');
    $approvalAudit = cpg_operator_shortlist_find_audit_event($auditEvents, 'operator_shortlist_internal_approval_recorded');
    $reviewBridgeAudit = cpg_operator_shortlist_find_audit_event($auditEvents, 'operator_shortlist_review_applications_created');
    $approvalSnapshot = is_array($draft['approval_guard_snapshot']['internal_approval'] ?? null)
        ? $draft['approval_guard_snapshot']['internal_approval']
        : null;
    $reviewBridgeSnapshot = is_array($draft['approval_guard_snapshot']['review_application_bridge'] ?? null)
        ? $draft['approval_guard_snapshot']['review_application_bridge']
        : null;
    $currentSearch = cpg_operator_shortlist_current_candidate_map($vacancyId);
    $currentCandidates = is_array($currentSearch['candidates'] ?? null) ? $currentSearch['candidates'] : [];

    $candidateDrilldown = [];
    foreach ((is_array($draft['candidates'] ?? null) ? $draft['candidates'] : []) as $candidate) {
        if (is_array($candidate)) {
            $candidateDrilldown[] = cpg_operator_shortlist_candidate_drilldown($candidate, $currentCandidates);
        }
    }

    return cpg_workspace_clean_record([
        'shortlist_draft_id' => $draftId,
        'vacancy_request_id' => $vacancyId,
        'draft_status' => $draft['draft_status'] ?? null,
        'created' => [
            'created_at' => $draft['created_at'] ?? null,
            'actor_context' => cpg_operator_shortlist_actor_summary($draft['created_by_operator_context'] ?? null),
            'audit_recorded' => $createdAudit !== null,
            'audit_created_at' => $createdAudit['created_at'] ?? null,
        ],
        'internal_approval' => $approvalSnapshot === null ? null : [
            'decision' => $approvalSnapshot['decision'] ?? null,
            'previous_status' => $approvalSnapshot['previous_status'] ?? null,
            'new_status' => $approvalSnapshot['new_status'] ?? null,
            'decided_at' => $approvalSnapshot['decided_at'] ?? null,
            'actor_context' => cpg_operator_shortlist_actor_summary($approvalAudit['actor_context'] ?? null),
            'audit_recorded' => $approvalAudit !== null,
            'audit_created_at' => $approvalAudit['created_at'] ?? null,
        ],
        'review_application_bridge' => $reviewBridgeSnapshot === null ? null : [
            'application_count' => $reviewBridgeSnapshot['application_count'] ?? null,
            'created_count' => $reviewBridgeSnapshot['created_count'] ?? null,
            'reused_count' => $reviewBridgeSnapshot['reused_count'] ?? null,
            'reset_count' => $reviewBridgeSnapshot['reset_count'] ?? null,
            'staged_at' => $reviewBridgeSnapshot['staged_at'] ?? null,
            'actor_context' => cpg_operator_shortlist_actor_summary($reviewBridgeAudit['actor_context'] ?? null),
            'audit_recorded' => $reviewBridgeAudit !== null,
            'audit_created_at' => $reviewBridgeAudit['created_at'] ?? null,
        ],
        'creation_snapshot' => [
            'demand_readiness_status' => $draft['search_snapshot']['demand_readiness']['status'] ?? null,
            'demand_blocker_codes' => cpg_operator_shortlist_issue_codes(
                is_array($draft['search_snapshot']['demand_readiness']['blockers'] ?? null)
                    ? $draft['search_snapshot']['demand_readiness']['blockers']
                    : []
            ),
            'candidate_count' => $draft['approval_guard_snapshot']['candidate_count'] ?? null,
            'included_candidate_count' => $draft['approval_guard_snapshot']['included_candidate_count'] ?? null,
            'blocked_candidate_count' => $draft['approval_guard_snapshot']['blocked_candidate_count'] ?? null,
        ],
        'current_guards' => [
            'candidate_search_available' => $currentSearch['search_available'] ?? false,
            'internal_approval_status' => $internalApprovalGuard['internal_approval_status'] ?? null,
            'internal_approval_blocker_codes' => cpg_operator_shortlist_guard_blocker_codes($internalApprovalGuard),
            'review_application_status' => $reviewApplicationGuard['review_application_status'] ?? null,
            'review_application_blocker_codes' => cpg_operator_shortlist_guard_blocker_codes($reviewApplicationGuard),
        ],
        'computed_operations' => array_map(static function (array $operation): array {
            $access = is_array($operation['required_access'] ?? null) ? $operation['required_access'] : [];
            return cpg_workspace_clean_record([
                'operation_code' => $operation['operation_code'] ?? null,
                'operation_status' => $operation['operation_status'] ?? null,
                'is_executable' => $operation['is_executable'] ?? false,
                'blocker_codes' => cpg_operator_shortlist_issue_codes(is_array($operation['blockers'] ?? null) ? $operation['blockers'] : []),
                'responsible_group' => $access['target_group_code'] ?? null,
                'required_permission' => $access['required_permission_code'] ?? null,
                'access_allowed' => $access['allowed'] ?? null,
            ]);
        }, $operations),
        'candidates' => $candidateDrilldown,
        'audit_events' => $auditEvents,
        'privacy_boundary' => [
            'candidate_contact_fields_excluded' => true,
            'candidate_document_metadata_excluded' => true,
            'operator_notes_excluded' => true,
            'employer_visible' => false,
        ],
    ]);
}

function handle_get_operator_shortlist_drafts(array $access): void {
    if (!cpg_operator_shortlist_tables_ready()) {
        api_error(503, 'operator_shortlist_store_missing', 'Operator shortlist draft tables are not available');
    }

    $status = cpg_operator_shortlist_list_status();
    $page = cpg_operator_shortlist_list_page();
    $pageSize = cpg_operator_shortlist_list_page_size();
    $offset = ($page - 1) * $pageSize;
    $where = ['osd.employer_visible IS FALSE'];
    $params = [];
    if ($status === 'archived') {
        $where[] = "(osd.archived_at IS NOT NULL OR osd.draft_status = 'archived')";
    } elseif ($status !== 'all') {
        $params[] = $status;
        $where[] = 'osd.draft_status = $' . count($params);
    }
    $whereSql = implode(' AND ', $where);

    $countRow = cpg_fetch_one_assoc(
        "SELECT COUNT(*)::int AS total_count
         FROM crewportglobal.operator_shortlist_drafts osd
         WHERE {$whereSql}",
        $params
    );
    $totalCount = (int) ($countRow['total_count'] ?? 0);
    $totalPages = max(1, (int) ceil($totalCount / $pageSize));
    if ($page > $totalPages) {
        $page = $totalPages;
        $offset = ($page - 1) * $pageSize;
    }

    $rowParams = $params;
    $rowParams[] = $pageSize;
    $limitPlaceholder = '$' . count($rowParams);
    $rowParams[] = $offset;
    $offsetPlaceholder = '$' . count($rowParams);

    $rows = cpg_fetch_all_assoc(
        "SELECT osd.shortlist_draft_id::text AS shortlist_draft_id,
                osd.vacancy_request_id::text AS vacancy_request_id,
                osd.created_by_operator_context::text AS created_by_operator_context,
                osd.draft_status,
                osd.employer_visible,
                osd.created_at::text AS created_at,
                osd.updated_at::text AS updated_at,
                osd.archived_at::text AS archived_at,
                vr.vacancy_title,
                vr.rank,
                vr.department,
                vr.publication_status,
                ec.company_name,
                v.vessel_name,
                COALESCE(candidates.candidate_count, 0)::int AS candidate_count,
                COALESCE(candidates.included_candidate_count, 0)::int AS included_candidate_count,
                COALESCE(candidates.hold_candidate_count, 0)::int AS hold_candidate_count,
                COALESCE(candidates.excluded_candidate_count, 0)::int AS excluded_candidate_count,
                COALESCE(candidates.guard_blocked_candidate_count, 0)::int AS guard_blocked_candidate_count,
                COALESCE(candidates.match_ready_candidate_count, 0)::int AS match_ready_candidate_count
         FROM crewportglobal.operator_shortlist_drafts osd
         JOIN crewportglobal.vacancy_requests vr
           ON vr.vacancy_request_id = osd.vacancy_request_id
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v
           ON v.vessel_id = vr.vessel_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*) AS candidate_count,
                  COUNT(*) FILTER (WHERE osc.operator_decision = 'include') AS included_candidate_count,
                  COUNT(*) FILTER (WHERE osc.operator_decision = 'hold') AS hold_candidate_count,
                  COUNT(*) FILTER (WHERE osc.operator_decision = 'exclude') AS excluded_candidate_count,
                  COUNT(*) FILTER (WHERE osc.approval_guard_result->>'approval_status' = 'blocked') AS guard_blocked_candidate_count,
                  COUNT(*) FILTER (WHERE osc.match_level = 'match_ready') AS match_ready_candidate_count
           FROM crewportglobal.operator_shortlist_candidates osc
           WHERE osc.shortlist_draft_id = osd.shortlist_draft_id
         ) candidates ON TRUE
         WHERE {$whereSql}
         ORDER BY osd.updated_at DESC, osd.created_at DESC
         LIMIT {$limitPlaceholder} OFFSET {$offsetPlaceholder}",
        $rowParams
    );

    $safeRows = [];
    foreach ($rows as $row) {
        $draftId = is_string($row['shortlist_draft_id'] ?? null) ? (string) $row['shortlist_draft_id'] : '';
        if ($draftId === '') {
            continue;
        }
        $draft = cpg_operator_shortlist_read($draftId);
        $operations = [];
        if ($draft !== null) {
            $operations = cpg_operator_shortlist_computed_operations(
                $draft,
                cpg_operator_shortlist_internal_approval_guard($draft),
                cpg_operator_shortlist_review_application_guard($draft),
                $access
            );
        }
        $nextOperation = cpg_operator_shortlist_first_next_operation($operations);
        $nextAccess = is_array($nextOperation['required_access'] ?? null) ? $nextOperation['required_access'] : [];
        $safeRows[] = cpg_workspace_clean_record([
            'shortlist_draft_id' => $draftId,
            'vacancy_request_id' => $row['vacancy_request_id'] ?? null,
            'vacancy_title' => $row['vacancy_title'] ?? null,
            'company_name' => $row['company_name'] ?? null,
            'vessel_name' => $row['vessel_name'] ?? null,
            'rank' => $row['rank'] ?? null,
            'department' => $row['department'] ?? null,
            'publication_status' => $row['publication_status'] ?? null,
            'draft_status' => $row['draft_status'] ?? null,
            'employer_visible' => cpg_pg_bool($row['employer_visible'] ?? null),
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
            'archived_at' => $row['archived_at'] ?? null,
            'created_by_operator_context' => cpg_decode_json_object($row['created_by_operator_context'] ?? null),
            'candidate_counts' => [
                'candidate_count' => (int) ($row['candidate_count'] ?? 0),
                'included_candidate_count' => (int) ($row['included_candidate_count'] ?? 0),
                'hold_candidate_count' => (int) ($row['hold_candidate_count'] ?? 0),
                'excluded_candidate_count' => (int) ($row['excluded_candidate_count'] ?? 0),
                'guard_blocked_candidate_count' => (int) ($row['guard_blocked_candidate_count'] ?? 0),
                'match_ready_candidate_count' => (int) ($row['match_ready_candidate_count'] ?? 0),
            ],
            'next_operation' => is_array($nextOperation) ? [
                'operation_code' => $nextOperation['operation_code'] ?? null,
                'operation_label' => $nextOperation['required_access']['operation_label'] ?? ($nextOperation['operation_code'] ?? null),
                'operation_status' => $nextOperation['operation_status'] ?? null,
                'is_executable' => $nextOperation['is_executable'] ?? false,
                'blockers' => is_array($nextOperation['blockers'] ?? null) ? $nextOperation['blockers'] : [],
                'responsible_group' => $nextAccess['target_group_code'] ?? null,
                'responsible_role' => $nextAccess['target_role_code'] ?? null,
                'required_permission' => $nextAccess['required_permission_code'] ?? null,
                'access_allowed' => $nextAccess['allowed'] ?? null,
                'permission_boundary' => $nextAccess['permission_boundary'] ?? null,
                'responsible_group_after_transition' => $nextOperation['responsible_group_after_transition'] ?? null,
            ] : null,
            'all_computed_operations' => array_map(static function (array $operation): array {
                $access = is_array($operation['required_access'] ?? null) ? $operation['required_access'] : [];
                return cpg_workspace_clean_record([
                    'operation_code' => $operation['operation_code'] ?? null,
                    'operation_status' => $operation['operation_status'] ?? null,
                    'is_executable' => $operation['is_executable'] ?? false,
                    'blockers' => is_array($operation['blockers'] ?? null) ? $operation['blockers'] : [],
                    'responsible_group' => $access['target_group_code'] ?? null,
                    'required_permission' => $access['required_permission_code'] ?? null,
                    'access_allowed' => $access['allowed'] ?? null,
                ]);
            }, $operations),
            'task_url' => cpg_operator_shortlist_task_url($draftId, $nextOperation),
        ]);
    }

    api_json(200, [
        'ok' => true,
        'access_model' => operator_access_model($access),
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'status' => $status,
        'page' => $page,
        'page_size' => $pageSize,
        'total_count' => $totalCount,
        'total_pages' => $totalPages,
        'rows' => $safeRows,
        'privacy_boundary' => [
            'candidate_contact_fields_excluded' => true,
            'candidate_document_metadata_excluded' => true,
            'employer_visible' => false,
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_operator_shortlist_approval_decision(mixed $value): ?string {
    if (!is_string($value) || trim($value) === '') {
        return null;
    }

    $decision = trim($value);
    return in_array($decision, ['approve_internal', 'reject'], true) ? $decision : null;
}

function cpg_operator_shortlist_internal_approval_guard(array $draft): array {
    $blockers = [];
    $warnings = [];
    $candidates = is_array($draft['candidates'] ?? null) ? $draft['candidates'] : [];
    $includedCandidates = array_values(array_filter($candidates, static function (array $candidate): bool {
        return ($candidate['operator_decision'] ?? null) === 'include';
    }));

    if (cpg_pg_bool($draft['employer_visible'] ?? null)) {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_employer_visible', 'Internal shortlist draft unexpectedly has employer visibility');
    }

    if (($draft['archived_at'] ?? null) !== null) {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_archived', 'Archived shortlist drafts cannot be internally approved');
    }

    $draftStatus = is_string($draft['draft_status'] ?? null) ? (string) $draft['draft_status'] : '';
    if ($draftStatus === 'archived') {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_archived', 'Archived shortlist drafts cannot be internally approved');
    }
    if ($draftStatus === 'rejected') {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_rejected', 'Rejected shortlist drafts require a future reopen workflow before approval');
    }

    if ($includedCandidates === []) {
        cpg_operator_shortlist_add_blocker($blockers, 'no_included_candidates', 'Internal approval requires at least one included candidate');
    }

    foreach ($candidates as $candidate) {
        if (cpg_pg_bool($candidate['employer_visible'] ?? null)) {
            cpg_operator_shortlist_add_blocker($blockers, 'shortlist_candidate_employer_visible', 'Internal shortlist candidate unexpectedly has employer visibility', [
                'candidate_user_id' => $candidate['candidate_user_id'] ?? null,
            ]);
        }
        if (($candidate['operator_decision'] ?? null) !== 'include') {
            continue;
        }

        $guard = is_array($candidate['approval_guard_result'] ?? null) ? $candidate['approval_guard_result'] : [];
        if (($guard['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist') {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_guard_blocked', 'Included candidate is not ready for internal shortlist approval', [
                'candidate_user_id' => $candidate['candidate_user_id'] ?? null,
                'approval_blockers' => is_array($guard['approval_blockers'] ?? null) ? $guard['approval_blockers'] : [],
            ]);
        }

        $snapshot = is_array($candidate['candidate_search_result'] ?? null) ? $candidate['candidate_search_result'] : [];
        $forbiddenHits = cpg_payload_forbidden_key_hits($snapshot, cpg_employer_payload_forbidden_keys());
        if ($forbiddenHits !== []) {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_forbidden_field_risk', 'Included candidate snapshot contains forbidden employer-facing fields', [
                'candidate_user_id' => $candidate['candidate_user_id'] ?? null,
                'fields' => $forbiddenHits,
            ]);
        }
    }

    $vacancyId = is_string($draft['vacancy_request_id'] ?? null) ? (string) $draft['vacancy_request_id'] : '';
    $currentSearch = $vacancyId !== '' ? read_operator_vacancy_candidate_search($vacancyId, 100) : null;
    $currentCandidates = [];
    if (is_array($currentSearch)) {
        foreach (($currentSearch['candidates'] ?? []) as $candidate) {
            if (is_array($candidate) && is_string($candidate['candidate_user_id'] ?? null)) {
                $currentCandidates[(string) $candidate['candidate_user_id']] = $candidate;
            }
        }
    } else {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_vacancy_not_searchable', 'Vacancy candidate search is not available for internal approval');
    }

    foreach ($includedCandidates as $candidate) {
        $candidateId = is_string($candidate['candidate_user_id'] ?? null) ? (string) $candidate['candidate_user_id'] : '';
        if ($candidateId === '' || !isset($currentCandidates[$candidateId])) {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_not_in_current_search_results', 'Included candidate is no longer present in current candidate-search results', [
                'candidate_user_id' => $candidateId,
            ]);
            continue;
        }

        $currentGuard = cpg_operator_shortlist_candidate_guard($currentCandidates[$candidateId]);
        if (($currentGuard['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist') {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_current_guard_blocked', 'Included candidate no longer passes current internal shortlist guard', [
                'candidate_user_id' => $candidateId,
                'approval_blockers' => is_array($currentGuard['approval_blockers'] ?? null) ? $currentGuard['approval_blockers'] : [],
            ]);
        }
    }

    $warnings[] = [
        'code' => 'internal_approval_only',
        'message' => 'Internal shortlist approval does not create vacancy applications or employer-facing candidate visibility',
    ];

    return [
        'internal_approval_status' => $blockers === [] ? 'ready_for_internal_approval' : 'blocked',
        'approval_blockers' => $blockers,
        'approval_warnings' => $warnings,
        'candidate_count' => count($candidates),
        'included_candidate_count' => count($includedCandidates),
        'held_candidate_count' => count(array_filter($candidates, static function (array $candidate): bool {
            return ($candidate['operator_decision'] ?? null) === 'hold';
        })),
        'excluded_candidate_count' => count(array_filter($candidates, static function (array $candidate): bool {
            return ($candidate['operator_decision'] ?? null) === 'exclude';
        })),
        'employer_visibility' => false,
        'creates_vacancy_applications' => false,
        'changes_application_statuses' => false,
    ];
}

function handle_patch_operator_shortlist_draft_approval(string $shortlistDraftId, ?array $access = null): void {
    $uuid = api_normalize_uuid($shortlistDraftId);
    if ($uuid === null) {
        api_error(400, 'invalid_shortlist_draft_id', 'shortlist_draft_id must be a valid UUID');
    }
    if (!cpg_operator_shortlist_tables_ready()) {
        api_error(503, 'operator_shortlist_store_missing', 'Operator shortlist draft tables are not available');
    }

    $body = api_decode_json_body();
    $decision = cpg_operator_shortlist_approval_decision($body['decision'] ?? $body['action'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_shortlist_approval_decision', 'decision must be approve_internal or reject');
    }
    $note = normalize_optional_text($body['operator_note'] ?? $body['note'] ?? null, 1000);

    $draft = cpg_operator_shortlist_read($uuid);
    if ($draft === null) {
        api_error(404, 'shortlist_draft_not_found', 'Internal shortlist draft not found');
    }

    $previousStatus = is_string($draft['draft_status'] ?? null) ? (string) $draft['draft_status'] : 'unknown';
    $approvalGuard = cpg_operator_shortlist_internal_approval_guard($draft);
    if ($decision === 'approve_internal' && ($approvalGuard['internal_approval_status'] ?? 'blocked') !== 'ready_for_internal_approval') {
        api_json(409, [
            'ok' => false,
            'error' => 'shortlist_internal_approval_blocked',
            'message' => 'Internal shortlist approval guard blocked this draft',
            'internal_approval_guard' => $approvalGuard,
            'side_effects' => [
                'changed_internal_shortlist_status' => false,
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => false,
                'employer_visible' => false,
            ],
        ]);
    }

    $newStatus = $decision === 'approve_internal' ? 'approved_internal' : 'rejected';
    $guardSnapshot = is_array($draft['approval_guard_snapshot'] ?? null) ? $draft['approval_guard_snapshot'] : [];
    $guardSnapshot['internal_approval'] = [
        'decision' => $decision,
        'previous_status' => $previousStatus,
        'new_status' => $newStatus,
        'operator_note' => $note,
        'guard' => $approvalGuard,
        'decided_at' => gmdate('c'),
        'employer_visible' => false,
        'creates_vacancy_applications' => false,
        'changes_application_statuses' => false,
    ];

    $vacancyContext = cpg_fetch_one_assoc(
        'SELECT created_by_user_id, company_id, vessel_id
         FROM crewportglobal.vacancy_requests
         WHERE vacancy_request_id = $1
         LIMIT 1',
        [$draft['vacancy_request_id']]
    );

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.operator_shortlist_drafts
             SET draft_status = $2,
                 approval_guard_snapshot = $3::jsonb,
                 updated_at = now()
             WHERE shortlist_draft_id = $1
               AND employer_visible IS FALSE',
            [$uuid, $newStatus, cpg_workspace_json($guardSnapshot)]
        );

        if ($vacancyContext !== null && is_string($vacancyContext['created_by_user_id'] ?? null)) {
            write_audit_event(
                'operator_shortlist_internal_approval_recorded',
                (string) $vacancyContext['created_by_user_id'],
                is_string($vacancyContext['company_id'] ?? null) ? (string) $vacancyContext['company_id'] : null,
                is_string($vacancyContext['vessel_id'] ?? null) ? (string) $vacancyContext['vessel_id'] : null,
                [
                    'shortlist_draft_id' => $uuid,
                    'vacancy_request_id' => $draft['vacancy_request_id'],
                    'decision' => $decision,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'operator_note' => $note,
                    'actor_context' => operator_workflow_actor_context($access, 'approve_internal_shortlist'),
                    'internal_approval_guard' => $approvalGuard,
                    'employer_visible' => false,
                    'creates_vacancy_applications' => false,
                    'changes_application_statuses' => false,
                ],
                'operator_shortlist_approval'
            );
        }

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'shortlist_internal_approval_failed', $error->getMessage());
    }

    $updatedDraft = cpg_operator_shortlist_read($uuid);
    $reviewApplicationGuard = is_array($updatedDraft) ? cpg_operator_shortlist_review_application_guard($updatedDraft) : null;
    api_json(200, [
        'ok' => true,
        'shortlist_draft' => $updatedDraft,
        'internal_approval_guard' => $approvalGuard,
        'computed_operations' => is_array($updatedDraft)
            ? cpg_operator_shortlist_computed_operations($updatedDraft, $approvalGuard, $reviewApplicationGuard, $access)
            : [],
        'side_effects' => [
            'changed_internal_shortlist_status' => true,
            'creates_vacancy_applications' => false,
            'changes_application_statuses' => false,
            'employer_visible' => false,
        ],
    ]);
}

function cpg_operator_shortlist_review_application_guard(array $draft): array {
    $blockers = [];
    $warnings = [];
    $draftStatus = is_string($draft['draft_status'] ?? null) ? (string) $draft['draft_status'] : '';
    $candidates = is_array($draft['candidates'] ?? null) ? $draft['candidates'] : [];
    $includedCandidates = array_values(array_filter($candidates, static function (array $candidate): bool {
        return ($candidate['operator_decision'] ?? null) === 'include';
    }));

    if ($draftStatus !== 'approved_internal') {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_not_approved_internal', 'Review applications can be staged only from an approved internal shortlist draft', [
            'draft_status' => $draftStatus,
        ]);
    }
    if (cpg_pg_bool($draft['employer_visible'] ?? null)) {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_employer_visible', 'Internal shortlist draft unexpectedly has employer visibility');
    }
    if (($draft['archived_at'] ?? null) !== null || $draftStatus === 'archived') {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_archived', 'Archived shortlist drafts cannot create review applications');
    }
    if ($draftStatus === 'rejected') {
        cpg_operator_shortlist_add_blocker($blockers, 'shortlist_draft_rejected', 'Rejected shortlist drafts cannot create review applications');
    }
    if ($includedCandidates === []) {
        cpg_operator_shortlist_add_blocker($blockers, 'no_included_candidates', 'Review application staging requires at least one included candidate');
    }

    $internalApprovalGuard = cpg_operator_shortlist_internal_approval_guard($draft);
    if (($internalApprovalGuard['internal_approval_status'] ?? 'blocked') !== 'ready_for_internal_approval') {
        cpg_operator_shortlist_add_blocker($blockers, 'internal_approval_guard_not_ready', 'Internal approval guard is no longer ready for this shortlist draft', [
            'approval_blockers' => is_array($internalApprovalGuard['approval_blockers'] ?? null) ? $internalApprovalGuard['approval_blockers'] : [],
        ]);
    }

    $alreadyStagedReviewApplicationCount = 0;
    foreach ($includedCandidates as $candidate) {
        $candidateId = is_string($candidate['candidate_user_id'] ?? null) ? (string) $candidate['candidate_user_id'] : '';
        if ($candidateId === '') {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_id_missing', 'Included shortlist candidate has no candidate user id');
            continue;
        }
        if (cpg_pg_bool($candidate['employer_visible'] ?? null)) {
            cpg_operator_shortlist_add_blocker($blockers, 'shortlist_candidate_employer_visible', 'Internal shortlist candidate unexpectedly has employer visibility', [
                'candidate_user_id' => $candidateId,
            ]);
        }

        $guard = is_array($candidate['approval_guard_result'] ?? null) ? $candidate['approval_guard_result'] : [];
        if (($guard['approval_status'] ?? 'blocked') !== 'ready_for_internal_shortlist') {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_guard_blocked', 'Included candidate is not ready for review application staging', [
                'candidate_user_id' => $candidateId,
                'approval_blockers' => is_array($guard['approval_blockers'] ?? null) ? $guard['approval_blockers'] : [],
            ]);
        }

        $snapshot = is_array($candidate['candidate_search_result'] ?? null) ? $candidate['candidate_search_result'] : [];
        $forbiddenHits = cpg_payload_forbidden_key_hits($snapshot, cpg_employer_payload_forbidden_keys());
        if ($forbiddenHits !== []) {
            cpg_operator_shortlist_add_blocker($blockers, 'included_candidate_forbidden_field_risk', 'Included candidate snapshot contains forbidden employer-facing fields', [
                'candidate_user_id' => $candidateId,
                'fields' => $forbiddenHits,
            ]);
        }

        $existingApplication = cpg_fetch_one_assoc(
            'SELECT vacancy_application_id, application_status
             FROM crewportglobal.vacancy_applications
             WHERE vacancy_request_id = $1
               AND seafarer_user_id = $2
             LIMIT 1',
            [$draft['vacancy_request_id'], $candidateId]
        );
        if ($existingApplication !== null && ($existingApplication['application_status'] ?? null) === 'presented') {
            cpg_operator_shortlist_add_blocker($blockers, 'candidate_already_presented_to_employer', 'Candidate already has an employer-facing presented application for this vacancy', [
                'candidate_user_id' => $candidateId,
                'vacancy_application_id' => $existingApplication['vacancy_application_id'] ?? null,
            ]);
        } elseif ($existingApplication !== null && !in_array((string) ($existingApplication['application_status'] ?? ''), ['withdrawn', 'rejected'], true)) {
            $alreadyStagedReviewApplicationCount++;
        }
    }

    if ($includedCandidates !== [] && $alreadyStagedReviewApplicationCount === count($includedCandidates)) {
        cpg_operator_shortlist_add_blocker($blockers, 'review_applications_already_staged', 'Review applications are already staged for all included candidates');
    }

    $warnings[] = [
        'code' => 'review_application_stage_only',
        'message' => 'This bridge creates or reuses internal vacancy applications for review only; it does not present candidates to employers',
    ];

    return [
        'review_application_status' => $blockers === [] ? 'ready_for_review_application_staging' : 'blocked',
        'approval_blockers' => $blockers,
        'approval_warnings' => $warnings,
        'internal_approval_guard' => $internalApprovalGuard,
        'candidate_count' => count($candidates),
        'included_candidate_count' => count($includedCandidates),
        'employer_visibility' => false,
        'creates_review_applications_only' => true,
        'moves_applications_to_presented' => false,
        'presented_to_employer' => false,
    ];
}

function cpg_operator_shortlist_computed_operations(
    array $draft,
    ?array $internalApprovalGuard = null,
    ?array $reviewApplicationGuard = null,
    ?array $access = null
): array {
    $draftStatus = is_string($draft['draft_status'] ?? null) ? (string) $draft['draft_status'] : '';
    $approvalReady = is_array($internalApprovalGuard)
        && ($internalApprovalGuard['internal_approval_status'] ?? null) === 'ready_for_internal_approval';
    $reviewApplicationReady = is_array($reviewApplicationGuard)
        && ($reviewApplicationGuard['review_application_status'] ?? null) === 'ready_for_review_application_staging';
    $reviewApplicationBlockers = is_array($reviewApplicationGuard['approval_blockers'] ?? null)
        ? $reviewApplicationGuard['approval_blockers']
        : [];

    return [
        operator_computed_workflow_operation(
            'approve_internal_shortlist',
            $draftStatus === 'needs_review' && $approvalReady,
            $approvalReady ? [] : [
                [
                    'code' => 'internal_approval_not_ready',
                    'message' => 'Internal shortlist approval is available only when the current guard is ready',
                ],
            ],
            [
                'record_type' => 'operator_shortlist_draft',
                'record_id' => $draft['shortlist_draft_id'] ?? null,
                'next_status_if_executed' => 'approved_internal',
                'responsible_group_after_transition' => 'review_team',
            ],
            $access
        ),
        operator_computed_workflow_operation(
            'create_review_applications',
            $draftStatus === 'approved_internal' && $reviewApplicationReady,
            $reviewApplicationReady ? [] : $reviewApplicationBlockers,
            [
                'record_type' => 'operator_shortlist_draft',
                'record_id' => $draft['shortlist_draft_id'] ?? null,
                'next_record_type_if_executed' => 'vacancy_application',
                'next_status_if_executed' => 'submitted_for_human_review',
                'responsible_group_after_transition' => 'review_team',
            ],
            $access
        ),
    ];
}

function cpg_operator_vacancy_application_computed_operations(array $detail, ?array $access = null): array {
    $application = is_array($detail['application'] ?? null) ? $detail['application'] : [];
    $approvalGuard = is_array($detail['approval_guard'] ?? null) ? $detail['approval_guard'] : [];
    $applicationStatus = is_string($application['application_status'] ?? null) ? (string) $application['application_status'] : '';
    $requestSource = is_string($application['request_source'] ?? null) ? (string) $application['request_source'] : 'unknown';
    $ready = in_array($applicationStatus, ['submitted_for_human_review', 'in_review'], true)
        && ($approvalGuard['approval_status'] ?? null) === 'ready_for_operator_approval';
    $blockers = is_array($approvalGuard['approval_blockers'] ?? null) ? $approvalGuard['approval_blockers'] : [];
    if (!in_array($applicationStatus, ['submitted_for_human_review', 'in_review'], true)) {
        $blockers[] = [
            'code' => 'vacancy_application_status_not_reviewable',
            'message' => 'Candidate presentation review is available only for submitted or in-review applications',
            'details' => ['application_status' => $applicationStatus],
        ];
    }

    return [
        operator_computed_workflow_operation(
            'review_candidate_presentation',
            $ready,
            $blockers,
            [
                'record_type' => 'vacancy_application',
                'record_id' => $application['vacancy_application_id'] ?? null,
                'current_status' => $applicationStatus,
                'next_status_if_executed' => 'presented',
                'responsible_group_after_transition' => 'employer',
                'presentation_guard_status' => $approvalGuard['approval_status'] ?? null,
                'request_source' => $requestSource,
                'review_handoff' => $requestSource === 'seafarer_initiated_request'
                    ? 'release_incoming_request_to_presented_candidate'
                    : 'approve_candidate_presentation',
            ],
            $access
        ),
    ];
}

function handle_post_operator_shortlist_draft_review_applications(string $shortlistDraftId, ?array $access = null): void {
    $uuid = api_normalize_uuid($shortlistDraftId);
    if ($uuid === null) {
        api_error(400, 'invalid_shortlist_draft_id', 'shortlist_draft_id must be a valid UUID');
    }
    if (!cpg_operator_shortlist_tables_ready()) {
        api_error(503, 'operator_shortlist_store_missing', 'Operator shortlist draft tables are not available');
    }

    $body = api_decode_json_body();
    $note = normalize_optional_text($body['operator_note'] ?? $body['note'] ?? null, 1000);
    $draft = cpg_operator_shortlist_read($uuid);
    if ($draft === null) {
        api_error(404, 'shortlist_draft_not_found', 'Internal shortlist draft not found');
    }

    $reviewApplicationGuard = cpg_operator_shortlist_review_application_guard($draft);
    if (($reviewApplicationGuard['review_application_status'] ?? 'blocked') !== 'ready_for_review_application_staging') {
        api_json(409, [
            'ok' => false,
            'error' => 'shortlist_review_application_guard_blocked',
            'message' => 'Internal shortlist cannot create review applications',
            'review_application_guard' => $reviewApplicationGuard,
            'side_effects' => [
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => false,
                'moves_applications_to_presented' => false,
                'presented_to_employer' => false,
                'employer_visible' => false,
            ],
        ]);
    }

    $includedCandidates = array_values(array_filter($draft['candidates'], static function (array $candidate): bool {
        return ($candidate['operator_decision'] ?? null) === 'include';
    }));
    $vacancyContext = cpg_fetch_one_assoc(
        'SELECT created_by_user_id, company_id, vessel_id
         FROM crewportglobal.vacancy_requests
         WHERE vacancy_request_id = $1
         LIMIT 1',
        [$draft['vacancy_request_id']]
    );

    $applications = [];
    $createdCount = 0;
    $reusedCount = 0;
    $resetCount = 0;

    api_tx_begin();
    try {
        foreach ($includedCandidates as $candidate) {
            $candidateId = (string) $candidate['candidate_user_id'];
            $candidateUser = cpg_fetch_one_assoc(
                'SELECT email
                 FROM crewportglobal.users
                 WHERE user_id = $1
                 LIMIT 1',
                [$candidateId]
            );
            if ($candidateUser === null || !is_string($candidateUser['email'] ?? null) || trim((string) $candidateUser['email']) === '') {
                api_tx_rollback();
                api_error(404, 'shortlist_candidate_user_not_found', 'Included shortlist candidate user not found');
            }

            $existingApplication = cpg_fetch_one_assoc(
                'SELECT vacancy_application_id, application_status
                 FROM crewportglobal.vacancy_applications
                 WHERE vacancy_request_id = $1
                   AND seafarer_user_id = $2
                 LIMIT 1',
                [$draft['vacancy_request_id'], $candidateId]
            );
            $previousStatus = is_array($existingApplication) ? (string) ($existingApplication['application_status'] ?? '') : null;
            $action = 'created';
            if ($existingApplication !== null) {
                $action = in_array($previousStatus, ['withdrawn', 'rejected'], true)
                    ? 'reset_to_submitted_for_human_review'
                    : 'reused';
            }

            $insertResult = api_query(
                "INSERT INTO crewportglobal.vacancy_applications (
                    vacancy_request_id,
                    seafarer_user_id,
                    contact_email,
                    candidate_note,
                    application_status
                 ) VALUES (
                    $1,
                    $2,
                    $3,
                    NULL,
                    'submitted_for_human_review'
                 )
                 ON CONFLICT (vacancy_request_id, seafarer_user_id)
                 DO UPDATE SET
                   application_status = CASE
                     WHEN crewportglobal.vacancy_applications.application_status IN ('withdrawn', 'rejected')
                       THEN 'submitted_for_human_review'
                     ELSE crewportglobal.vacancy_applications.application_status
                   END,
                   updated_at = CASE
                     WHEN crewportglobal.vacancy_applications.application_status IN ('withdrawn', 'rejected')
                       THEN now()
                     ELSE crewportglobal.vacancy_applications.updated_at
                   END
                 RETURNING vacancy_application_id, application_status, created_at, updated_at",
                [$draft['vacancy_request_id'], $candidateId, (string) $candidateUser['email']]
            );
            $applicationRow = pg_fetch_assoc($insertResult);
            if (!is_array($applicationRow)) {
                api_tx_rollback();
                api_error(500, 'shortlist_review_application_create_failed', 'Unable to create review application from internal shortlist');
            }

            if ($action === 'created') {
                $createdCount++;
            } elseif ($action === 'reset_to_submitted_for_human_review') {
                $resetCount++;
            } else {
                $reusedCount++;
            }

            $applications[] = [
                'vacancy_application_id' => $applicationRow['vacancy_application_id'],
                'vacancy_request_id' => $draft['vacancy_request_id'],
                'candidate_user_id' => $candidateId,
                'application_status' => $applicationRow['application_status'],
                'previous_application_status' => $previousStatus,
                'action' => $action,
                'employer_visible' => false,
                'presented_to_employer' => false,
            ];
        }

        $guardSnapshot = is_array($draft['approval_guard_snapshot'] ?? null) ? $draft['approval_guard_snapshot'] : [];
        $guardSnapshot['review_application_bridge'] = [
            'shortlist_draft_id' => $uuid,
            'operator_note' => $note,
            'review_application_guard' => $reviewApplicationGuard,
            'application_count' => count($applications),
            'created_count' => $createdCount,
            'reused_count' => $reusedCount,
            'reset_count' => $resetCount,
            'moved_to_presented_count' => 0,
            'employer_visible' => false,
            'staged_at' => gmdate('c'),
        ];
        api_query(
            'UPDATE crewportglobal.operator_shortlist_drafts
             SET approval_guard_snapshot = $2::jsonb,
                 updated_at = now()
             WHERE shortlist_draft_id = $1
               AND employer_visible IS FALSE',
            [$uuid, cpg_workspace_json($guardSnapshot)]
        );

        if ($vacancyContext !== null && is_string($vacancyContext['created_by_user_id'] ?? null)) {
            write_audit_event(
                'operator_shortlist_review_applications_created',
                (string) $vacancyContext['created_by_user_id'],
                is_string($vacancyContext['company_id'] ?? null) ? (string) $vacancyContext['company_id'] : null,
                is_string($vacancyContext['vessel_id'] ?? null) ? (string) $vacancyContext['vessel_id'] : null,
                [
                    'shortlist_draft_id' => $uuid,
                    'vacancy_request_id' => $draft['vacancy_request_id'],
                    'operator_note' => $note,
                    'actor_context' => operator_workflow_actor_context($access, 'create_review_applications'),
                    'review_application_guard' => $reviewApplicationGuard,
                    'applications' => $applications,
                    'created_count' => $createdCount,
                    'reused_count' => $reusedCount,
                    'reset_count' => $resetCount,
                    'moves_applications_to_presented' => false,
                    'presented_to_employer' => false,
                    'employer_visible' => false,
                ],
                'operator_shortlist_review_application_bridge'
            );
        }

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'shortlist_review_application_create_failed', $error->getMessage());
    }

    api_json(201, [
        'ok' => true,
        'shortlist_draft_id' => $uuid,
        'vacancy_request_id' => $draft['vacancy_request_id'],
        'review_application_guard' => $reviewApplicationGuard,
        'applications' => $applications,
        'computed_operations' => array_map(
            static function (array $application) use ($access): array {
                return operator_computed_workflow_operation(
                    'review_candidate_presentation',
                    ($application['application_status'] ?? null) === 'submitted_for_human_review'
                        || ($application['application_status'] ?? null) === 'in_review',
                    [],
                    [
                        'record_type' => 'vacancy_application',
                        'record_id' => $application['vacancy_application_id'] ?? null,
                        'current_status' => $application['application_status'] ?? null,
                        'next_status_if_executed' => 'presented',
                        'responsible_group_after_transition' => 'employer',
                        'computed_from' => 'bridge_created_review_application',
                    ],
                    $access
                );
            },
            $applications
        ),
        'side_effects' => [
            'creates_vacancy_applications' => $createdCount > 0,
            'created_review_applications_count' => $createdCount,
            'reused_review_applications_count' => $reusedCount,
            'reset_review_applications_count' => $resetCount,
            'changes_existing_application_statuses' => $resetCount > 0,
            'moves_applications_to_presented' => false,
            'presented_to_employer' => false,
            'employer_visible' => false,
        ],
    ]);
}

function upsert_vacancy_request(string $userId, string $companyId, ?string $vesselId, array $body): ?string {
    $vacancy = normalize_vacancy_payload($body);
    if ($vacancy === null) {
        return null;
    }

    if ($vesselId === null) {
        $latestVessel = read_latest_vessel_for_company($companyId);
        if ($latestVessel !== null && isset($latestVessel['vessel_id'])) {
            $vesselId = (string) $latestVessel['vessel_id'];
        }
    }

    $existing = read_latest_vacancy_for_company($companyId, $userId);
    if ($existing !== null && isset($existing['vacancy_request_id'])) {
        $vacancyRequestId = (string) $existing['vacancy_request_id'];
        $result = api_query(
            'UPDATE crewportglobal.vacancy_requests
             SET vessel_id = COALESCE($2::uuid, vessel_id),
                 vacancy_title = COALESCE($3, vacancy_title),
                 rank = COALESCE($4, rank),
                 department = COALESCE($5, department),
                 vessel_type = COALESCE($6, vessel_type),
                 join_date = COALESCE($7::date, join_date),
                 contract_duration = COALESCE($8, contract_duration),
                 contract_duration_value = COALESCE($9, contract_duration_value),
                 contract_duration_unit = COALESCE($10, contract_duration_unit),
                 salary_min_usd = COALESCE($11, salary_min_usd),
                 salary_max_usd = COALESCE($12, salary_max_usd),
                 salary_text = COALESCE($13, salary_text),
                 currency = COALESCE($14, currency),
                 employer_country_code = COALESCE($15, employer_country_code),
                 requirements = COALESCE($16, requirements),
                 required_rank_value_id = CASE WHEN $18::text IS NULL THEN required_rank_value_id ELSE $17::uuid END,
                 required_rank_label = COALESCE($18, required_rank_label),
                 vessel_type_value_id = CASE WHEN $20::text IS NULL THEN vessel_type_value_id ELSE $19::uuid END,
                 vessel_type_label = COALESCE($20, vessel_type_label),
                 required_passport_validity_days = COALESCE($21, required_passport_validity_days),
                 required_seaman_book_validity_days = COALESCE($22, required_seaman_book_validity_days),
                 required_medical_validity_days = COALESCE($23, required_medical_validity_days),
                 demand_workspace = COALESCE(demand_workspace, jsonb_build_object()) || COALESCE($24::jsonb, jsonb_build_object()),
                 publication_status = CASE
                   WHEN publication_status IN (\'submitted_for_human_review\', \'in_review\', \'published\', \'closed\') THEN publication_status
                   ELSE $25
                 END,
                 updated_at = now()
             WHERE vacancy_request_id = $1
             RETURNING vacancy_request_id',
            [
                $vacancyRequestId,
                $vesselId,
                $vacancy['vacancy_title'],
                $vacancy['rank'],
                $vacancy['department'],
                $vacancy['vessel_type'],
                $vacancy['join_date'],
                $vacancy['contract_duration'],
                $vacancy['contract_duration_value'],
                $vacancy['contract_duration_unit'],
                $vacancy['salary_min_usd'],
                $vacancy['salary_max_usd'],
                $vacancy['salary_text'],
                $vacancy['currency'],
                $vacancy['employer_country_code'],
                $vacancy['requirements'],
                $vacancy['required_rank_value_id'],
                $vacancy['required_rank_label'],
                $vacancy['vessel_type_value_id'],
                $vacancy['vessel_type_label'],
                $vacancy['required_passport_validity_days'],
                $vacancy['required_seaman_book_validity_days'],
                $vacancy['required_medical_validity_days'],
                cpg_workspace_json($vacancy['demand_workspace']),
                'draft',
            ]
        );

        $row = pg_fetch_assoc($result);
        if (is_array($row)) {
            sync_demand_requirement_items((string) $row['vacancy_request_id'], $vacancy);
            return (string) $row['vacancy_request_id'];
        }

        return null;
    }

    $result = api_query(
        'INSERT INTO crewportglobal.vacancy_requests (
           company_id,
           vessel_id,
           created_by_user_id,
           vacancy_title,
           rank,
           department,
           vessel_type,
           join_date,
           contract_duration,
           contract_duration_value,
           contract_duration_unit,
           salary_min_usd,
           salary_max_usd,
           salary_text,
           currency,
           employer_country_code,
           requirements,
           required_rank_value_id,
           required_rank_label,
           vessel_type_value_id,
           vessel_type_label,
           required_passport_validity_days,
           required_seaman_book_validity_days,
           required_medical_validity_days,
           demand_workspace,
           publication_status
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8::date,
           $9,
           $10,
           $11,
           $12,
           $13,
           $14,
           $15,
           $16,
           $17,
           $18::uuid,
           $19,
           $20::uuid,
           $21,
           $22,
           $23,
           $24,
           $25::jsonb,
           $26
         )
         RETURNING vacancy_request_id',
        [
            $companyId,
            $vesselId,
            $userId,
            $vacancy['vacancy_title'],
            $vacancy['rank'],
            $vacancy['department'],
            $vacancy['vessel_type'],
            $vacancy['join_date'],
            $vacancy['contract_duration'],
            $vacancy['contract_duration_value'],
            $vacancy['contract_duration_unit'],
            $vacancy['salary_min_usd'],
            $vacancy['salary_max_usd'],
            $vacancy['salary_text'],
            $vacancy['currency'],
            $vacancy['employer_country_code'],
            $vacancy['requirements'],
            $vacancy['required_rank_value_id'],
            $vacancy['required_rank_label'],
            $vacancy['vessel_type_value_id'],
            $vacancy['vessel_type_label'],
            $vacancy['required_passport_validity_days'],
            $vacancy['required_seaman_book_validity_days'],
            $vacancy['required_medical_validity_days'],
            cpg_workspace_json($vacancy['demand_workspace']),
            'draft',
        ]
    );

    $row = pg_fetch_assoc($result);
    if (is_array($row)) {
        sync_demand_requirement_items((string) $row['vacancy_request_id'], $vacancy);
        return (string) $row['vacancy_request_id'];
    }

    return null;
}

function public_vacancy_select_clause(bool $includeInternalIds = false): string {
    $internalColumns = $includeInternalIds ? ',
            vr.company_id,
            vr.vessel_id' : '';

    return "SELECT
            vr.vacancy_request_id,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            COALESCE(vr.vessel_type, v.vessel_type) AS vessel_type,
            vr.required_rank_value_id,
            vr.required_rank_label,
            COALESCE(vr.vessel_type_value_id, v.vessel_type_value_id) AS vessel_type_value_id,
            COALESCE(vr.vessel_type_label, v.vessel_type_label) AS vessel_type_label,
            vr.join_date,
            vr.contract_duration,
            vr.contract_duration_value,
            vr.contract_duration_unit,
            vr.required_passport_validity_days,
            vr.required_seaman_book_validity_days,
            vr.required_medical_validity_days,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            COALESCE(vr.employer_country_code, ec.country_code) AS employer_country_code,
            vr.requirements,
            vr.publication_status,
            vr.created_at,
            vr.updated_at,
            ec.company_name,
            ec.company_type,
            ec.verification_status,
            v.vessel_name,
            v.imo_number{$internalColumns}
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id";
}

function map_public_vacancy_row(array $row): array {
    return [
        'vacancy_request_id' => $row['vacancy_request_id'],
        'vacancy_title' => $row['vacancy_title'],
        'rank' => $row['rank'],
        'department' => $row['department'],
        'vessel_type' => $row['vessel_type'],
        'required_rank_value_id' => $row['required_rank_value_id'] ?? null,
        'required_rank_label' => $row['required_rank_label'] ?? null,
        'vessel_type_value_id' => $row['vessel_type_value_id'] ?? null,
        'vessel_type_label' => $row['vessel_type_label'] ?? null,
        'join_date' => $row['join_date'],
        'contract_duration' => $row['contract_duration'],
        'contract_duration_value' => $row['contract_duration_value'] ?? null,
        'contract_duration_unit' => $row['contract_duration_unit'] ?? null,
        'required_passport_validity_days' => $row['required_passport_validity_days'] ?? null,
        'required_seaman_book_validity_days' => $row['required_seaman_book_validity_days'] ?? null,
        'required_medical_validity_days' => $row['required_medical_validity_days'] ?? null,
        'salary_min_usd' => $row['salary_min_usd'],
        'salary_max_usd' => $row['salary_max_usd'],
        'salary_text' => $row['salary_text'],
        'currency' => $row['currency'],
        'employer_country_code' => $row['employer_country_code'],
        'requirements' => $row['requirements'],
        'publication_status' => $row['publication_status'],
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'],
        'company_name' => $row['company_name'],
        'company_type' => $row['company_type'],
        'verification_status' => $row['verification_status'],
        'vessel_name' => $row['vessel_name'],
        'imo_number' => $row['imo_number'],
        'demand_matching_foundation' => demand_matching_foundation_summary($row),
    ];
}

function read_public_vacancies(): array {
    $result = api_query(
        public_vacancy_select_clause() .
        " WHERE vr.publication_status = 'published'
           AND ec.verification_status = 'verified'
           AND COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'pending_manager_confirmation'
         ORDER BY COALESCE(vr.join_date, CURRENT_DATE + INTERVAL '100 years') ASC,
                  vr.updated_at DESC
         LIMIT 200"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = map_public_vacancy_row($row);
    }

    return $items;
}

function read_public_vacancy_row(string $vacancyId, bool $includeInternalIds = false): ?array {
    $result = api_query(
        public_vacancy_select_clause($includeInternalIds) .
        " WHERE vr.vacancy_request_id = $1
           AND vr.publication_status = 'published'
           AND ec.verification_status = 'verified'
           AND COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'pending_manager_confirmation'
         LIMIT 1",
        [$vacancyId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function read_public_vacancy(string $vacancyId): ?array {
    $row = read_public_vacancy_row($vacancyId);
    return $row === null ? null : map_public_vacancy_row($row);
}

function handle_get_public_vacancies(): void {
    $vacancies = read_public_vacancies();
    api_json(200, [
        'ok' => true,
        'vacancies' => $vacancies,
        'count' => count($vacancies),
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_job_search_norm(mixed $value): string {
    $text = is_string($value) ? $value : (string) ($value ?? '');
    $text = mb_strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/u', ' ', $text);
    return trim((string) preg_replace('/\s+/', ' ', (string) $text));
}

function cpg_job_search_has_any_vessel_type(array $preferredVesselTypes): bool {
    foreach ($preferredVesselTypes as $value) {
        $normalized = cpg_job_search_norm($value);
        if (in_array($normalized, ['any vessel type', 'vessel type not important', 'not important', 'any'], true)) {
            return true;
        }
    }
    return false;
}

function cpg_seafarer_job_match(array $profile, array $row): array {
    $score = 0;
    $hardBlockers = [];
    $softNotes = [];
    $dimensions = [];

    $candidateRank = cpg_job_search_norm($profile['primary_rank'] ?? '');
    $vacancyRank = cpg_job_search_norm($row['required_rank_label'] ?? $row['rank'] ?? '');
    if ($candidateRank === '' || $vacancyRank === '') {
        $hardBlockers[] = 'rank_missing';
        $dimensions['rank'] = 'missing';
    } elseif ($candidateRank === $vacancyRank) {
        $score += 40;
        $dimensions['rank'] = 'match';
    } else {
        $hardBlockers[] = 'rank_mismatch';
        $dimensions['rank'] = 'blocked';
    }

    $candidateDepartment = cpg_job_search_norm($profile['department'] ?? '');
    $vacancyDepartment = cpg_job_search_norm($row['department'] ?? '');
    if ($candidateDepartment === '' || $vacancyDepartment === '') {
        $hardBlockers[] = 'department_missing';
        $dimensions['department'] = 'missing';
    } elseif ($candidateDepartment === $vacancyDepartment) {
        $score += 25;
        $dimensions['department'] = 'match';
    } else {
        $hardBlockers[] = 'department_mismatch';
        $dimensions['department'] = 'blocked';
    }

    $preferredVesselTypes = cpg_pg_text_array_values($profile['preferred_vessel_types'] ?? null);
    $vacancyVesselType = cpg_job_search_norm($row['vessel_type_label'] ?? $row['vessel_type'] ?? '');
    if (cpg_job_search_has_any_vessel_type($preferredVesselTypes)) {
        $score += 15;
        $dimensions['vessel_type'] = 'any';
    } elseif ($vacancyVesselType !== '' && in_array($vacancyVesselType, array_map('cpg_job_search_norm', $preferredVesselTypes), true)) {
        $score += 15;
        $dimensions['vessel_type'] = 'match';
    } elseif (count($preferredVesselTypes) === 0 || $vacancyVesselType === '') {
        $softNotes[] = 'vessel_type_not_comparable';
        $dimensions['vessel_type'] = 'not_comparable';
    } else {
        $softNotes[] = 'vessel_type_preference_mismatch';
        $dimensions['vessel_type'] = 'soft_mismatch';
    }

    $availabilityStatus = cpg_job_search_norm($profile['availability_status'] ?? '');
    $availabilityDate = is_string($profile['availability_date'] ?? null) ? trim((string) $profile['availability_date']) : '';
    $joinDate = is_string($row['join_date'] ?? null) ? trim((string) $row['join_date']) : '';
    if ($availabilityStatus === 'available now') {
        $score += 10;
        $dimensions['availability'] = 'match';
    } elseif ($availabilityDate !== '' && $joinDate !== '' && $availabilityDate <= $joinDate) {
        $score += 10;
        $dimensions['availability'] = 'match';
    } elseif ($availabilityStatus === '' && $availabilityDate === '') {
        $softNotes[] = 'availability_not_set';
        $dimensions['availability'] = 'not_comparable';
    } else {
        $softNotes[] = 'availability_may_not_fit_join_date';
        $dimensions['availability'] = 'soft_mismatch';
    }

    return [
        'match_status' => count($hardBlockers) === 0 ? 'matching_ready' : 'blocked',
        'match_score' => $score,
        'hard_blockers' => array_values(array_unique($hardBlockers)),
        'soft_notes' => array_values(array_unique($softNotes)),
        'dimension_results' => $dimensions,
    ];
}

function cpg_read_seafarer_job_search_profile(string $draftId): ?array {
    $result = api_query(
        "SELECT
            u.user_id,
            u.email,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.preferred_vessel_types,
            sp.salary_expectation_usd,
            sp.review_status
         FROM crewportglobal.users u
         JOIN crewportglobal.user_roles ur ON ur.user_id = u.user_id AND ur.role = 'seafarer'
         JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = u.user_id
         WHERE u.user_id = $1
         LIMIT 1",
        [$draftId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function handle_get_seafarer_job_search(): void {
    $draftId = api_normalize_uuid($_GET['draft_id'] ?? null);
    if ($draftId === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $profile = cpg_read_seafarer_job_search_profile($draftId);
    if ($profile === null) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    $result = api_query(
        "SELECT
            vr.vacancy_request_id,
            COALESCE(NULLIF(vr.vacancy_title, ''), NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, ''), 'Crew request') AS vacancy_title,
            vr.rank,
            vr.required_rank_label,
            vr.department,
            COALESCE(NULLIF(vr.vessel_type_label, ''), NULLIF(vr.vessel_type, ''), NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) AS vessel_type,
            COALESCE(NULLIF(vr.vessel_type_label, ''), NULLIF(v.vessel_type_label, '')) AS vessel_type_label,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.publication_status,
            ec.company_name,
            ec.verification_status,
            v.vessel_name,
            va.vacancy_application_id,
            va.application_status
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN crewportglobal.vacancy_applications va
           ON va.vacancy_request_id = vr.vacancy_request_id
          AND va.seafarer_user_id = $1
         WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'confirmed_deleted'
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 200",
        [$draftId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $match = cpg_seafarer_job_match($profile, $row);
        $existingStatus = is_string($row['application_status'] ?? null) ? (string) $row['application_status'] : null;
        $alreadyRequested = $existingStatus !== null && !in_array($existingStatus, ['withdrawn', 'rejected'], true);
        $isRequestable = ($match['match_status'] ?? '') === 'matching_ready'
            && ($row['publication_status'] ?? '') === 'published'
            && ($row['verification_status'] ?? '') === 'verified'
            && !$alreadyRequested;

        $items[] = array_merge($match, [
            'vacancy_request_id' => $row['vacancy_request_id'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['rank'],
            'required_rank_label' => $row['required_rank_label'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'salary_text' => $row['salary_text'],
            'currency' => $row['currency'],
            'publication_status' => $row['publication_status'],
            'company_name' => $row['company_name'],
            'verification_status' => $row['verification_status'],
            'vessel_name' => $row['vessel_name'],
            'existing_application_id' => $row['vacancy_application_id'],
            'existing_application_status' => $existingStatus,
            'existing_application' => $existingStatus === null ? null : [
                'vacancy_application_id' => $row['vacancy_application_id'],
                'application_status' => $existingStatus,
                'review_status' => $existingStatus,
            ],
            'can_request_contract' => $isRequestable,
            'request_blockers' => array_values(array_filter([
                ($row['publication_status'] ?? '') === 'published' ? null : 'vacancy_not_published',
                ($row['verification_status'] ?? '') === 'verified' ? null : 'company_not_verified',
                ($match['match_status'] ?? '') === 'matching_ready' ? null : 'match_blocked',
                $alreadyRequested ? 'request_already_exists' : null,
            ])),
        ]);
    }

    usort($items, static function (array $left, array $right): int {
        $score = ((int) ($right['match_score'] ?? 0)) <=> ((int) ($left['match_score'] ?? 0));
        if ($score !== 0) {
            return $score;
        }
        return strcmp((string) ($left['join_date'] ?? '9999-12-31'), (string) ($right['join_date'] ?? '9999-12-31'));
    });

    api_json(200, [
        'ok' => true,
        'draft_id' => $draftId,
        'generated_at' => gmdate('c'),
        'official_language' => 'en',
        'privacy_boundary' => [
            'contact_fields_excluded' => true,
            'contract_request_requires_existing_application_flow' => true,
        ],
        'profile_summary' => [
            'primary_rank' => $profile['primary_rank'],
            'department' => $profile['department'],
            'availability_status' => $profile['availability_status'],
            'availability_date' => $profile['availability_date'],
            'preferred_vessel_types' => cpg_pg_text_array_values($profile['preferred_vessel_types'] ?? null),
            'review_status' => $profile['review_status'],
            'email' => $profile['email'],
        ],
        'matching_ready_count' => count(array_filter($items, static fn(array $item): bool => ($item['match_status'] ?? '') === 'matching_ready')),
        'requestable_count' => count(array_filter($items, static fn(array $item): bool => ($item['can_request_contract'] ?? false) === true)),
        'vacancies' => array_slice($items, 0, 50),
    ]);
}

function cpg_public_registry_count_row(): array {
    $result = api_query(
        "SELECT
            (SELECT count(*)::int
             FROM crewportglobal.vacancy_requests vr
             WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'confirmed_deleted') AS vacancy_request_count,
            (SELECT count(*)::int
             FROM crewportglobal.vacancy_requests vr
             LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
             WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'confirmed_deleted'
               AND COALESCE(NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, '')) IS NOT NULL
               AND NULLIF(vr.department, '') IS NOT NULL
               AND COALESCE(NULLIF(vr.vessel_type_label, ''), NULLIF(vr.vessel_type, ''), NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) IS NOT NULL
               AND vr.join_date IS NOT NULL) AS vacancy_request_matching_ready_count,
            (SELECT count(*)::int
             FROM crewportglobal.vessels) AS vessel_count,
            (SELECT count(*)::int
             FROM crewportglobal.vessels v
             WHERE NULLIF(v.vessel_name, '') IS NOT NULL
               AND COALESCE(NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) IS NOT NULL) AS vessel_matching_ready_count,
            (SELECT count(*)::int
             FROM crewportglobal.seafarer_profiles) AS seafarer_count,
            (SELECT count(*)::int
             FROM crewportglobal.seafarer_profiles sp
             WHERE NULLIF(sp.primary_rank, '') IS NOT NULL
               AND NULLIF(sp.department, '') IS NOT NULL
               AND NULLIF(sp.availability_status, '') IS NOT NULL) AS seafarer_matching_ready_count"
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : [];
}

function cpg_public_registry_has_text($value): bool {
    return is_string($value) ? trim($value) !== '' : $value !== null;
}

function cpg_public_registry_readiness(string $kind, array $row): array {
    $blockers = [];

    if ($kind === 'vacancy_request') {
        if (!cpg_public_registry_has_text($row['rank_label'] ?? null)) {
            $blockers[] = 'missing_rank';
        }
        if (!cpg_public_registry_has_text($row['department'] ?? null)) {
            $blockers[] = 'missing_department';
        }
        if (!cpg_public_registry_has_text($row['vessel_type'] ?? null)) {
            $blockers[] = 'missing_vessel_type';
        }
        if (!cpg_public_registry_has_text($row['join_date'] ?? null)) {
            $blockers[] = 'missing_join_date';
        }
    } elseif ($kind === 'vessel') {
        if (!cpg_public_registry_has_text($row['vessel_name'] ?? null)) {
            $blockers[] = 'missing_vessel_name';
        }
        if (!cpg_public_registry_has_text($row['vessel_type'] ?? null)) {
            $blockers[] = 'missing_vessel_type';
        }
    } elseif ($kind === 'seafarer') {
        if (!cpg_public_registry_has_text($row['primary_rank'] ?? null)) {
            $blockers[] = 'missing_rank';
        }
        if (!cpg_public_registry_has_text($row['department'] ?? null)) {
            $blockers[] = 'missing_department';
        }
        if (!cpg_public_registry_has_text($row['availability_status'] ?? null)) {
            $blockers[] = 'missing_availability';
        }
    }

    return [
        'readiness_status' => count($blockers) === 0 ? 'matching_ready' : 'has_blockers',
        'readiness_blockers' => $blockers,
    ];
}

function cpg_public_registry_vacancy_rows(): array {
    $result = api_query(
        "SELECT
            vr.vacancy_request_id,
            COALESCE(NULLIF(vr.vacancy_title, ''), NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, ''), 'Crew request') AS vacancy_title,
            COALESCE(NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, '')) AS rank_label,
            vr.department,
            COALESCE(NULLIF(vr.vessel_type_label, ''), NULLIF(vr.vessel_type, ''), NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) AS vessel_type,
            vr.join_date,
            vr.publication_status,
            ec.company_name,
            v.vessel_name,
            vr.updated_at
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'confirmed_deleted'
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 12"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $item = [
            'vacancy_request_id' => $row['vacancy_request_id'],
            'title' => $row['vacancy_title'],
            'rank_label' => $row['rank_label'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'publication_status' => $row['publication_status'],
            'company_name' => $row['company_name'],
            'vessel_name' => $row['vessel_name'],
            'updated_at' => $row['updated_at'],
        ];
        $items[] = array_merge($item, cpg_public_registry_readiness('vacancy_request', $item));
    }

    return $items;
}

function cpg_public_registry_vessel_rows(): array {
    $result = api_query(
        "SELECT
            v.vessel_id,
            v.vessel_name,
            COALESCE(NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) AS vessel_type,
            v.flag_country_code,
            ec.company_name,
            ec.company_type,
            v.updated_at
         FROM crewportglobal.vessels v
         LEFT JOIN crewportglobal.employer_companies ec ON ec.company_id = v.company_id
         ORDER BY v.updated_at DESC, v.created_at DESC
         LIMIT 12"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $item = [
            'vessel_id' => $row['vessel_id'],
            'vessel_name' => $row['vessel_name'],
            'vessel_type' => $row['vessel_type'],
            'flag_country_code' => $row['flag_country_code'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'updated_at' => $row['updated_at'],
        ];
        $items[] = array_merge($item, cpg_public_registry_readiness('vessel', $item));
    }

    return $items;
}

function cpg_public_registry_seafarer_rows(): array {
    $result = api_query(
        "SELECT
            seafarer_profile_id,
            primary_rank,
            department,
            availability_status,
            country_code,
            nationality_code,
            residence_country_code,
            review_status,
            updated_at
         FROM crewportglobal.seafarer_profiles
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 12"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $item = [
            'seafarer_profile_id' => $row['seafarer_profile_id'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'country_code' => $row['country_code'],
            'nationality_code' => $row['nationality_code'],
            'residence_country_code' => $row['residence_country_code'],
            'review_status' => $row['review_status'],
            'updated_at' => $row['updated_at'],
        ];
        $items[] = array_merge($item, cpg_public_registry_readiness('seafarer', $item));
    }

    return $items;
}

function handle_get_public_registry_summary(): void {
    $counts = cpg_public_registry_count_row();
    $vacancyCount = (int) ($counts['vacancy_request_count'] ?? 0);
    $vesselCount = (int) ($counts['vessel_count'] ?? 0);
    $seafarerCount = (int) ($counts['seafarer_count'] ?? 0);
    $vacancyReadyCount = (int) ($counts['vacancy_request_matching_ready_count'] ?? 0);
    $vesselReadyCount = (int) ($counts['vessel_matching_ready_count'] ?? 0);
    $seafarerReadyCount = (int) ($counts['seafarer_matching_ready_count'] ?? 0);

    api_json(200, [
        'ok' => true,
        'generated_at' => gmdate('c'),
        'privacy_boundary' => [
            'contact_fields_excluded' => true,
            'seafarer_names_excluded' => true,
            'forbidden_fields' => [
                'email',
                'contact_email',
                'seafarer_email',
                'phone',
                'contact_phone',
                'document_metadata',
                'passport_number',
                'medical_details',
            ],
        ],
        'counts' => [
            'vacancy_requests' => $vacancyCount,
            'vessels' => $vesselCount,
            'seafarers' => $seafarerCount,
            'matching_ready' => $vacancyReadyCount + $vesselReadyCount + $seafarerReadyCount,
            'with_blockers' => max(0, ($vacancyCount + $vesselCount + $seafarerCount) - ($vacancyReadyCount + $vesselReadyCount + $seafarerReadyCount)),
        ],
        'samples' => [
            'vacancy_requests' => cpg_public_registry_vacancy_rows(),
            'vessels' => cpg_public_registry_vessel_rows(),
            'seafarers' => cpg_public_registry_seafarer_rows(),
        ],
    ]);
}

function cpg_registry_detail_add_row(array &$rows, string $recordType, string $recordId, string $displayTitle, array $safeColumns, ?string $updatedAt, array $readiness): void {
    $rows[] = [
        'record_type' => $recordType,
        'record_id' => $recordId,
        'display_title' => $displayTitle,
        'updated_at' => $updatedAt,
        'readiness_status' => $readiness['readiness_status'] ?? 'has_blockers',
        'readiness_blockers' => $readiness['readiness_blockers'] ?? [],
        'safe_columns' => $safeColumns,
    ];
}

function cpg_registry_detail_vacancy_rows(): array {
    $result = api_query(
        "SELECT
            vr.vacancy_request_id,
            COALESCE(NULLIF(vr.vacancy_title, ''), NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, ''), 'Crew request') AS vacancy_title,
            COALESCE(NULLIF(vr.required_rank_label, ''), NULLIF(vr.rank, '')) AS rank_label,
            vr.department,
            COALESCE(NULLIF(vr.vessel_type_label, ''), NULLIF(vr.vessel_type, ''), NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) AS vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.publication_status,
            ec.company_name,
            ec.company_type,
            ec.country_code AS employer_country_code,
            v.vessel_name,
            v.flag_country_code,
            vr.updated_at
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'confirmed_deleted'
         ORDER BY vr.updated_at DESC, vr.created_at DESC"
    );

    $rows = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $readinessInput = [
            'rank_label' => $row['rank_label'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
        ];
        cpg_registry_detail_add_row($rows, 'vacancy_request', (string) $row['vacancy_request_id'], (string) $row['vacancy_title'], [
            'rank' => $row['rank_label'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'publication_status' => $row['publication_status'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'employer_country_code' => $row['employer_country_code'],
            'vessel_name' => $row['vessel_name'],
            'flag_country_code' => $row['flag_country_code'],
        ], $row['updated_at'] ?? null, cpg_public_registry_readiness('vacancy_request', $readinessInput));
    }

    return $rows;
}

function cpg_registry_detail_vessel_rows(): array {
    $result = api_query(
        "SELECT
            v.vessel_id,
            v.vessel_name,
            COALESCE(NULLIF(v.vessel_type_label, ''), NULLIF(v.vessel_type, '')) AS vessel_type,
            v.flag_country_code,
            ec.company_name,
            ec.company_type,
            ec.country_code AS employer_country_code,
            v.updated_at
         FROM crewportglobal.vessels v
         LEFT JOIN crewportglobal.employer_companies ec ON ec.company_id = v.company_id
         ORDER BY v.updated_at DESC, v.created_at DESC"
    );

    $rows = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $displayTitle = cpg_public_registry_has_text($row['vessel_name'] ?? null) ? (string) $row['vessel_name'] : 'Vessel profile';
        cpg_registry_detail_add_row($rows, 'vessel', (string) $row['vessel_id'], $displayTitle, [
            'vessel_name' => $row['vessel_name'],
            'vessel_type' => $row['vessel_type'],
            'flag_country_code' => $row['flag_country_code'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'employer_country_code' => $row['employer_country_code'],
        ], $row['updated_at'] ?? null, cpg_public_registry_readiness('vessel', [
            'vessel_name' => $row['vessel_name'],
            'vessel_type' => $row['vessel_type'],
        ]));
    }

    return $rows;
}

function cpg_registry_detail_seafarer_rows(): array {
    $result = api_query(
        "SELECT
            seafarer_profile_id,
            primary_rank,
            department,
            availability_status,
            country_code,
            nationality_code,
            residence_country_code,
            review_status,
            updated_at
         FROM crewportglobal.seafarer_profiles
         ORDER BY updated_at DESC, created_at DESC"
    );

    $rows = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $rank = cpg_public_registry_has_text($row['primary_rank'] ?? null) ? (string) $row['primary_rank'] : 'Seafarer profile';
        cpg_registry_detail_add_row($rows, 'seafarer', (string) $row['seafarer_profile_id'], $rank, [
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'country_code' => $row['country_code'],
            'nationality_code' => $row['nationality_code'],
            'residence_country_code' => $row['residence_country_code'],
            'review_status' => $row['review_status'],
        ], $row['updated_at'] ?? null, cpg_public_registry_readiness('seafarer', [
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
        ]));
    }

    return $rows;
}

function cpg_registry_detail_rows(string $type): array {
    $rows = [];
    if ($type === 'all' || $type === 'vacancy_requests') {
        $rows = array_merge($rows, cpg_registry_detail_vacancy_rows());
    }
    if ($type === 'all' || $type === 'vessels') {
        $rows = array_merge($rows, cpg_registry_detail_vessel_rows());
    }
    if ($type === 'all' || $type === 'seafarers') {
        $rows = array_merge($rows, cpg_registry_detail_seafarer_rows());
    }

    usort($rows, static function (array $left, array $right): int {
        return strcmp((string) ($right['updated_at'] ?? ''), (string) ($left['updated_at'] ?? ''));
    });

    return $rows;
}

function handle_get_operator_registry_detail(array $access): void {
    $type = (string) ($_GET['type'] ?? 'all');
    if (!in_array($type, ['all', 'vacancy_requests', 'vessels', 'seafarers'], true)) {
        api_error(400, 'invalid_registry_type', 'Unsupported registry type filter');
    }

    $readiness = (string) ($_GET['readiness'] ?? 'all');
    if (!in_array($readiness, ['all', 'matching_ready', 'has_blockers'], true)) {
        api_error(400, 'invalid_registry_readiness', 'Unsupported registry readiness filter');
    }

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $pageSize = max(10, min(50, (int) ($_GET['page_size'] ?? 25)));
    $rows = cpg_registry_detail_rows($type);
    if ($readiness !== 'all') {
        $rows = array_values(array_filter($rows, static fn(array $row): bool => ($row['readiness_status'] ?? '') === $readiness));
    }

    $totalCount = count($rows);
    $totalPages = max(1, (int) ceil($totalCount / $pageSize));
    $page = min($page, $totalPages);
    $offset = ($page - 1) * $pageSize;
    $pagedRows = array_slice($rows, $offset, $pageSize);

    api_json(200, [
        'ok' => true,
        'generated_at' => gmdate('c'),
        'access_model' => $access['access_model'] ?? 'unknown',
        'actor_user_id' => $access['actor_user_id'] ?? null,
        'type' => $type,
        'readiness' => $readiness,
        'page' => $page,
        'page_size' => $pageSize,
        'total_count' => $totalCount,
        'total_pages' => $totalPages,
        'counts' => cpg_public_registry_count_row(),
        'rows' => $pagedRows,
        'privacy_boundary' => [
            'protected_view' => true,
            'contact_fields_excluded' => true,
            'seafarer_names_excluded' => true,
            'forbidden_fields' => [
                'email',
                'contact_email',
                'seafarer_email',
                'phone',
                'contact_phone',
                'document_metadata',
                'passport_number',
                'medical_details',
            ],
        ],
    ]);
}

function handle_get_public_vacancy(string $vacancyId): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $vacancy = read_public_vacancy($uuid);
    if ($vacancy === null) {
        api_error(404, 'vacancy_not_found', 'Reviewed public vacancy not found');
    }

    api_json(200, [
        'ok' => true,
        'vacancy' => $vacancy,
        'generated_at' => gmdate('c'),
    ]);
}

function read_seafarer_application_candidate(string $userId): ?array {
    $result = api_query(
        "SELECT
            u.user_id,
            u.email,
            u.display_name,
            sp.review_status,
            sp.primary_rank,
            sp.availability_status
         FROM crewportglobal.users u
         JOIN crewportglobal.user_roles ur ON ur.user_id = u.user_id AND ur.role = 'seafarer'
         JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = u.user_id
         WHERE u.user_id = $1
         LIMIT 1",
        [$userId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function handle_create_vacancy_application(string $vacancyId): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $seafarerDraftId = api_normalize_uuid($body['seafarer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($seafarerDraftId === null) {
        api_error(400, 'invalid_seafarer_draft_id', 'seafarer_draft_id must be a valid UUID');
    }

    $email = api_normalize_email($body['email'] ?? null);
    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }

    $candidateNote = normalize_optional_text($body['candidate_note'] ?? $body['note'] ?? null, 1200);
    $vacancyRow = read_public_vacancy_row($uuid, true);
    if ($vacancyRow === null) {
        api_error(404, 'vacancy_not_found', 'Reviewed public vacancy not found');
    }

    $candidate = read_seafarer_application_candidate($seafarerDraftId);
    if ($candidate === null) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    if (mb_strtolower((string) $candidate['email']) !== $email) {
        api_error(400, 'email_does_not_match_profile', 'email must match the seafarer profile email');
    }

    if (($candidate['review_status'] ?? '') === 'rejected') {
        api_error(400, 'seafarer_profile_not_ready', 'Rejected seafarer profiles cannot apply to vacancies');
    }

    api_tx_begin();
    try {
        $insertResult = api_query(
            "INSERT INTO crewportglobal.vacancy_applications (
                vacancy_request_id,
                seafarer_user_id,
                contact_email,
                candidate_note,
                application_status
             ) VALUES ($1, $2, $3, $4, 'submitted_for_human_review')
             ON CONFLICT (vacancy_request_id, seafarer_user_id)
             DO UPDATE SET
               contact_email = EXCLUDED.contact_email,
               candidate_note = EXCLUDED.candidate_note,
               application_status = CASE
                 WHEN crewportglobal.vacancy_applications.application_status IN ('withdrawn', 'rejected')
                   THEN 'submitted_for_human_review'
                 ELSE crewportglobal.vacancy_applications.application_status
               END,
               updated_at = now()
             RETURNING vacancy_application_id, application_status, created_at, updated_at",
            [$uuid, $seafarerDraftId, $email, $candidateNote]
        );
        $applicationRow = pg_fetch_assoc($insertResult);
        if (!is_array($applicationRow)) {
            api_tx_rollback();
            api_error(500, 'vacancy_application_failed', 'Unable to create vacancy application');
        }

        $companyId = isset($vacancyRow['company_id']) ? (string) $vacancyRow['company_id'] : null;
        $vesselId = isset($vacancyRow['vessel_id']) ? (string) $vacancyRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('vacancy_application_submitted', $seafarerDraftId, $companyId, $vesselId, [
            'vacancy_request_id' => $uuid,
            'vacancy_application_id' => $applicationRow['vacancy_application_id'],
            'application_status' => $applicationRow['application_status'],
            'candidate_review_status' => $candidate['review_status'],
            'candidate_rank' => $candidate['primary_rank'],
        ], 'vacancy_detail_public');

        api_tx_commit();

        api_json(201, [
            'ok' => true,
            'vacancy_request_id' => $uuid,
            'application' => [
                'vacancy_application_id' => $applicationRow['vacancy_application_id'],
                'application_status' => $applicationRow['application_status'],
                'created_at' => $applicationRow['created_at'],
                'updated_at' => $applicationRow['updated_at'],
            ],
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'vacancy_application_failed', $error->getMessage());
    }
}

function read_latest_operator_review_event(string $userId): ?array {
    $result = api_query(
        "SELECT event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                event_payload->>'correction_card_code' AS correction_card_code,
                event_payload->>'correction_card_name' AS correction_card_name,
                created_at
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 1",
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function read_operator_review_history(string $userId): array {
    $result = api_query(
        "SELECT created_at,
                source,
                event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                event_payload->>'correction_card_code' AS correction_card_code,
                event_payload->>'correction_card_name' AS correction_card_name
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 20",
        [$userId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'created_at' => $row['created_at'] ?? null,
            'source' => $row['source'] ?? null,
            'decision' => $row['decision'] ?? null,
            'previous_status' => $row['previous_status'] ?? null,
            'new_status' => $row['new_status'] ?? null,
            'queue_type' => $row['queue_type'] ?? null,
            'role' => $row['role'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'correction_card_code' => $row['correction_card_code'] ?? null,
            'correction_card_name' => $row['correction_card_name'] ?? null,
        ];
    }

    return $items;
}

function read_presented_candidates_for_employer(string $companyId, ?string $vacancyId = null): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.employer_shortlist_status,
            va.employer_action_note,
            va.employer_action_at,
            va.created_at,
            va.updated_at,
            su.user_id AS seafarer_user_id,
            su.display_name,
            su.email AS seafarer_email,
            sp.seafarer_profile_id,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department,
            sc.shortlist_candidate_id,
            sc.shortlist_draft_id
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         LEFT JOIN LATERAL (
           SELECT osc.shortlist_candidate_id,
                  osd.shortlist_draft_id
           FROM crewportglobal.operator_shortlist_candidates osc
           JOIN crewportglobal.operator_shortlist_drafts osd
             ON osd.shortlist_draft_id = osc.shortlist_draft_id
           WHERE osd.vacancy_request_id = va.vacancy_request_id
             AND osc.candidate_user_id = va.seafarer_user_id
             AND osc.operator_decision = 'include'
           ORDER BY osd.updated_at DESC, osc.updated_at DESC
           LIMIT 1
         ) sc ON TRUE
         WHERE vr.company_id = $1
           AND ($2::uuid IS NULL OR va.vacancy_request_id = $2::uuid)
           AND va.application_status = 'presented'
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 50",
        [$companyId, $vacancyId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'application_status' => $row['application_status'],
            'candidate_note' => $row['candidate_note'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'employer_shortlist_status' => $row['employer_shortlist_status'],
            'employer_action_note' => $row['employer_action_note'],
            'employer_action_at' => $row['employer_action_at'],
            'seafarer_user_id' => $row['seafarer_user_id'],
            'seafarer_profile_id' => $row['seafarer_profile_id'],
            'display_name' => $row['display_name'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['country_code'],
            'document_summary' => cpg_seafarer_public_document_summary($row['document_metadata'] ?? null),
            'candidate_visibility_scope' => 'employer_after_candidate_consent',
            'vacancy_title' => $row['vacancy_title'],
            'vacancy_rank' => $row['vacancy_rank'],
            'vacancy_department' => $row['vacancy_department'],
            'shortlist_candidate_id' => $row['shortlist_candidate_id'],
            'shortlist_draft_id' => $row['shortlist_draft_id'],
            'contract_operation' => cpg_contract_proposal_operation_for_presented_candidate($row),
        ];
    }

    return $items;
}

function read_incoming_candidate_requests_for_employer(string $companyId, ?string $vacancyId = null): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.candidate_note,
            va.application_status,
            va.created_at,
            va.updated_at,
            su.user_id AS seafarer_user_id,
            su.display_name,
            sp.seafarer_profile_id,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         WHERE vr.company_id = $1
           AND ($2::uuid IS NULL OR va.vacancy_request_id = $2::uuid)
           AND va.application_status IN ('submitted_for_human_review', 'in_review')
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 50",
        [$companyId, $vacancyId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'application_status' => $row['application_status'],
            'candidate_note' => $row['candidate_note'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'seafarer_user_id' => $row['seafarer_user_id'],
            'seafarer_profile_id' => $row['seafarer_profile_id'],
            'display_name' => $row['display_name'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['country_code'],
            'document_summary' => cpg_seafarer_public_document_summary($row['document_metadata'] ?? null),
            'candidate_visibility_scope' => 'employer_safe_incoming_request',
            'request_source' => 'seafarer_initiated_request',
            'vacancy_title' => $row['vacancy_title'],
            'vacancy_rank' => $row['vacancy_rank'],
            'vacancy_department' => $row['vacancy_department'],
            'handoff_operation' => [
                'operation_code' => 'review_seafarer_initiated_request',
                'visible' => true,
                'enabled' => false,
                'next_action' => 'wait_for_team_review',
                'blockers' => [
                    cpg_contract_proposal_blocker(
                        'team_review_required_before_employer_decision',
                        'A seafarer-initiated request must pass team review before employer contract proposal'
                    ),
                ],
            ],
        ];
    }

    return $items;
}

function read_shipowner_candidate_selection_requests(string $companyId): array {
    $vacancyResult = api_query(
        "SELECT vr.vacancy_request_id::text AS vacancy_request_id,
                vr.vacancy_title,
                vr.rank,
                vr.department,
                vr.vessel_type,
                vr.vessel_type_label,
                vr.join_date::text AS join_date,
                vr.contract_duration,
                vr.contract_duration_value,
                vr.contract_duration_unit,
                vr.salary_min_usd,
                vr.salary_max_usd,
                vr.currency,
                vr.publication_status,
                vr.created_at::text AS created_at,
                vr.updated_at::text AS updated_at,
                v.vessel_name,
                v.vessel_type AS registered_vessel_type,
                v.vessel_type_label AS registered_vessel_type_label,
                v.flag_country_code
         FROM crewportglobal.vacancy_requests vr
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE vr.company_id = $1
           AND vr.publication_status <> 'archived'
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 100",
        [$companyId]
    );

    $presentedCandidates = read_presented_candidates_for_employer($companyId, null);
    $incomingRequests = read_incoming_candidate_requests_for_employer($companyId, null);
    $candidatesByVacancy = [];
    foreach ($presentedCandidates as $candidate) {
        $vacancyId = is_string($candidate['vacancy_request_id'] ?? null) ? $candidate['vacancy_request_id'] : '';
        if ($vacancyId === '') {
            continue;
        }
        if (!isset($candidatesByVacancy[$vacancyId])) {
            $candidatesByVacancy[$vacancyId] = [];
        }
        $candidatesByVacancy[$vacancyId][] = $candidate;
    }
    $incomingByVacancy = [];
    foreach ($incomingRequests as $candidate) {
        $vacancyId = is_string($candidate['vacancy_request_id'] ?? null) ? $candidate['vacancy_request_id'] : '';
        if ($vacancyId === '') {
            continue;
        }
        if (!isset($incomingByVacancy[$vacancyId])) {
            $incomingByVacancy[$vacancyId] = [];
        }
        $incomingByVacancy[$vacancyId][] = $candidate;
    }

    $requests = [];
    while (($row = pg_fetch_assoc($vacancyResult)) !== false) {
        $vacancyId = (string) $row['vacancy_request_id'];
        $candidates = $candidatesByVacancy[$vacancyId] ?? [];
        $incoming = $incomingByVacancy[$vacancyId] ?? [];
        $vesselType = $row['vessel_type_label']
            ?? $row['vessel_type']
            ?? $row['registered_vessel_type_label']
            ?? $row['registered_vessel_type']
            ?? null;

        $requests[] = [
            'vacancy_request_id' => $vacancyId,
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['rank'],
            'department' => $row['department'],
            'vessel_type' => $vesselType,
            'vessel_name' => $row['vessel_name'],
            'flag_country_code' => $row['flag_country_code'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'contract_duration_value' => $row['contract_duration_value'],
            'contract_duration_unit' => $row['contract_duration_unit'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'currency' => $row['currency'],
            'publication_status' => $row['publication_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'incoming_request_count' => count($incoming),
            'presented_candidate_count' => count($candidates),
            'candidate_selection_state' => count($candidates) > 0
                ? 'presented_candidates_available'
                : (count($incoming) > 0 ? 'incoming_seafarer_requests_waiting_review' : 'candidate_presentation_is_being_prepared'),
            'incoming_candidate_requests' => $incoming,
            'presented_candidates' => $candidates,
        ];
    }

    return $requests;
}

function handle_get_shipowner_candidate_selection(): void {
    $draftId = api_normalize_uuid($_GET['draft_id'] ?? null);
    if ($draftId === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $role = read_role_for_user($draftId);
    if ($role === null || $role === 'seafarer') {
        api_error(404, 'shipowner_draft_not_found', 'Shipowner draft not found');
    }

    $company = read_primary_company_for_user($draftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'shipowner_company_not_found', 'Shipowner company not found');
    }

    $companyId = (string) $company['company_id'];

    api_json(200, [
        'ok' => true,
        'draft_id' => $draftId,
        'role' => $role,
        'company' => [
            'company_id' => $companyId,
            'company_name' => $company['company_name'] ?? null,
            'verification_status' => $company['verification_status'] ?? null,
        ],
        'visibility_scope' => 'shipowner_candidate_selection_and_incoming_requests',
        'selection_requests' => read_shipowner_candidate_selection_requests($companyId),
    ]);
}

function cpg_shipowner_agent_context_from_draft(string $draftId): array {
    $role = read_role_for_user($draftId);
    if ($role === null || $role === 'seafarer') {
        api_error(404, 'shipowner_draft_not_found', 'Shipowner draft not found');
    }

    $company = read_primary_company_for_user($draftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'shipowner_company_not_found', 'Shipowner company not found');
    }

    return [
        'draft_id' => $draftId,
        'role' => $role,
        'company_id' => (string) $company['company_id'],
        'company_name' => is_string($company['company_name'] ?? null) ? (string) $company['company_name'] : null,
        'verification_status' => is_string($company['verification_status'] ?? null) ? (string) $company['verification_status'] : null,
    ];
}

function cpg_agent_registered_options(): array {
    if (!cpg_agent_scope_tables_ready()) {
        return [];
    }

    return cpg_fetch_all_assoc(
        "SELECT ao.agent_organization_id::text AS agent_organization_id,
                ao.agent_code,
                ao.agent_display_name,
                ao.organization_kind,
                ao.agent_status,
                ao.authority_status,
                ao.platform_service_agreement_status,
                ao.public_listing_allowed,
                count(au.agent_user_id)::int AS active_user_count
         FROM crewportglobal.agent_organizations ao
         LEFT JOIN crewportglobal.agent_users au
           ON au.agent_organization_id = ao.agent_organization_id
          AND au.membership_status = 'active'
         WHERE ao.agent_status IN ('verified', 'limited')
           AND ao.authority_status IN ('verified', 'limited')
           AND ao.platform_service_agreement_status = 'accepted'
           AND ao.archived_at IS NULL
         GROUP BY ao.agent_organization_id
         ORDER BY ao.public_listing_allowed DESC, ao.agent_display_name ASC
         LIMIT 100",
        []
    );
}

function cpg_agent_framework_offer_public_row(array $row): array {
    return [
        'offer_id' => is_string($row['offer_id'] ?? null) ? (string) $row['offer_id'] : null,
        'offer_number' => is_string($row['offer_number'] ?? null) ? (string) $row['offer_number'] : null,
        'shipowner_user_id' => is_string($row['shipowner_user_id'] ?? null) ? (string) $row['shipowner_user_id'] : null,
        'shipowner_company_id' => is_string($row['shipowner_company_id'] ?? null) ? (string) $row['shipowner_company_id'] : null,
        'shipowner_company_name' => is_string($row['shipowner_company_name'] ?? null) ? (string) $row['shipowner_company_name'] : null,
        'agent_organization_id' => is_string($row['agent_organization_id'] ?? null) ? (string) $row['agent_organization_id'] : null,
        'agent_display_name' => is_string($row['agent_display_name'] ?? null) ? (string) $row['agent_display_name'] : null,
        'represented_object_type' => is_string($row['represented_object_type'] ?? null) ? (string) $row['represented_object_type'] : null,
        'represented_object_id' => is_string($row['represented_object_id'] ?? null) ? (string) $row['represented_object_id'] : null,
        'offer_status' => is_string($row['offer_status'] ?? null) ? (string) $row['offer_status'] : null,
        'framework_terms_status' => is_string($row['framework_terms_status'] ?? null) ? (string) $row['framework_terms_status'] : null,
        'authority_status' => is_string($row['authority_status'] ?? null) ? (string) $row['authority_status'] : null,
        'commercial_terms_status' => is_string($row['commercial_terms_status'] ?? null) ? (string) $row['commercial_terms_status'] : null,
        'framework_template_code' => is_string($row['framework_template_code'] ?? null) ? (string) $row['framework_template_code'] : null,
        'framework_template_version' => is_string($row['framework_template_version'] ?? null) ? (string) $row['framework_template_version'] : null,
        'signature_method' => is_string($row['signature_method'] ?? null) ? (string) $row['signature_method'] : null,
        'acceptance_text' => is_string($row['acceptance_text'] ?? null) ? (string) $row['acceptance_text'] : null,
        'source_authority_document_id' => is_string($row['source_authority_document_id'] ?? null) ? (string) $row['source_authority_document_id'] : null,
        'assignment_id' => is_string($row['assignment_id'] ?? null) ? (string) $row['assignment_id'] : null,
        'offered_at' => is_string($row['offered_at'] ?? null) ? (string) $row['offered_at'] : null,
        'accepted_at' => is_string($row['accepted_at'] ?? null) ? (string) $row['accepted_at'] : null,
        'activated_at' => is_string($row['activated_at'] ?? null) ? (string) $row['activated_at'] : null,
    ];
}

function cpg_agent_framework_offers_for_company(string $companyId): array {
    if (!cpg_agent_framework_tables_ready()) {
        return [];
    }

    $rows = cpg_fetch_all_assoc(
        "SELECT afo.agent_framework_agreement_offer_id::text AS offer_id,
                afo.offer_number,
                afo.shipowner_user_id::text AS shipowner_user_id,
                afo.shipowner_company_id::text AS shipowner_company_id,
                ec.company_name AS shipowner_company_name,
                afo.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                afo.represented_object_type,
                afo.represented_object_id::text AS represented_object_id,
                afo.offer_status,
                afo.framework_terms_status,
                afo.authority_status,
                afo.commercial_terms_status,
                afo.framework_template_code,
                afo.framework_template_version,
                afo.signature_method,
                afo.acceptance_text,
                afo.source_authority_document_id::text AS source_authority_document_id,
                afo.agent_object_assignment_id::text AS assignment_id,
                afo.offered_at::text AS offered_at,
                afo.accepted_at::text AS accepted_at,
                afo.activated_at::text AS activated_at
         FROM crewportglobal.agent_framework_agreement_offers afo
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = afo.agent_organization_id
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = afo.shipowner_company_id
         WHERE afo.shipowner_company_id = $1::uuid
           AND afo.archived_at IS NULL
         ORDER BY afo.updated_at DESC
         LIMIT 100",
        [$companyId]
    );

    return array_map('cpg_agent_framework_offer_public_row', $rows);
}

function cpg_participant_notifications_for_user(string $userId, string $objectType, string $objectId): array {
    if (!cpg_agent_framework_tables_ready()) {
        return [];
    }

    return cpg_fetch_all_assoc(
        "SELECT participant_notification_id::text AS notification_id,
                event_type,
                event_stage,
                safe_summary,
                action_type,
                delivery_status,
                payload_hash,
                created_at::text AS created_at
         FROM crewportglobal.participant_notification_ledger
         WHERE recipient_user_id = $1::uuid
           AND represented_object_type = $2
           AND represented_object_id = $3::uuid
         ORDER BY created_at DESC
         LIMIT 50",
        [$userId, $objectType, $objectId]
    );
}

function cpg_agent_framework_offer_number(): string {
    return 'CPG-AO-' . gmdate('Ymd-His') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
}

function handle_get_employer_agent_assignment_options(): void {
    cpg_agent_require_framework_tables();
    $draftId = api_normalize_uuid($_GET['draft_id'] ?? null);
    if ($draftId === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $context = cpg_shipowner_agent_context_from_draft($draftId);
    api_json(200, [
        'ok' => true,
        'draft_id' => $draftId,
        'company' => [
            'company_id' => $context['company_id'],
            'company_name' => $context['company_name'],
            'verification_status' => $context['verification_status'],
        ],
        'framework_template' => [
            'code' => 'CPG-BIZ-123',
            'version' => '1.3',
            'title' => 'Shipowner-agent framework agreement',
            'acceptance_text' => 'С условиями рамочного договора присоединения согласен',
            'commercial_terms_default_status' => 'commercial_terms_pending',
        ],
        'agents' => cpg_agent_registered_options(),
        'offers' => cpg_agent_framework_offers_for_company($context['company_id']),
        'notifications' => cpg_participant_notifications_for_user($draftId, 'employer_company', $context['company_id']),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_post_employer_agent_framework_offer(): void {
    cpg_agent_require_framework_tables();
    $body = api_decode_json_body();
    $draftId = api_normalize_uuid($body['draft_id'] ?? $body['shipowner_user_id'] ?? null);
    $agentOrganizationId = cpg_agent_nullable_uuid($body['agent_organization_id'] ?? null);
    if ($draftId === null || $agentOrganizationId === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_offer_required_fields_missing',
            'message' => 'draft_id and agent_organization_id are required',
        ]);
    }

    $context = cpg_shipowner_agent_context_from_draft($draftId);
    $agent = cpg_fetch_one_assoc(
        "SELECT agent_organization_id::text AS agent_organization_id,
                agent_display_name,
                agent_status,
                authority_status,
                platform_service_agreement_status
         FROM crewportglobal.agent_organizations
         WHERE agent_organization_id = $1::uuid
           AND agent_status IN ('verified', 'limited')
           AND authority_status IN ('verified', 'limited')
           AND platform_service_agreement_status = 'accepted'
           AND archived_at IS NULL
         LIMIT 1",
        [$agentOrganizationId]
    );
    if (!is_array($agent)) {
        api_json(404, [
            'ok' => false,
            'error' => 'registered_agent_not_found',
            'message' => 'Selected registered agent is not available for appointment offers',
        ]);
    }

    $activeAssignment = cpg_fetch_one_assoc(
        "SELECT aoa.agent_object_assignment_id::text AS assignment_id,
                aoa.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                aoa.assignment_status
         FROM crewportglobal.agent_object_assignments aoa
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aoa.agent_organization_id
         WHERE aoa.object_type = 'employer_company'
           AND aoa.object_id = $1::uuid
           AND aoa.assignment_status IN ('active', 'limited')
           AND aoa.archived_at IS NULL
         LIMIT 1",
        [$context['company_id']]
    );
    if (is_array($activeAssignment)) {
        api_json(409, [
            'ok' => false,
            'error' => 'shipowner_company_already_managed',
            'message' => 'This shipowner company already has an active managing agent assignment',
            'assignment' => $activeAssignment,
        ]);
    }

    $existing = cpg_fetch_one_assoc(
        "SELECT agent_framework_agreement_offer_id::text AS offer_id,
                offer_status
         FROM crewportglobal.agent_framework_agreement_offers
         WHERE shipowner_company_id = $1::uuid
           AND agent_organization_id = $2::uuid
           AND represented_object_type = 'employer_company'
           AND represented_object_id = $1::uuid
           AND offer_status IN ('sent', 'accepted')
           AND archived_at IS NULL
         LIMIT 1",
        [$context['company_id'], $agentOrganizationId]
    );
    if (is_array($existing)) {
        api_json(409, [
            'ok' => false,
            'error' => 'agent_offer_already_open',
            'message' => 'An open offer for this agent and shipowner company already exists',
            'offer' => $existing,
        ]);
    }

    $delegatedScope = cpg_agent_json_object_value($body['delegated_scope'] ?? []);
    if ($delegatedScope === []) {
        $delegatedScope = [
            'objects' => ['company_card'],
            'management_mode' => 'framework_representative_management',
            'commercial_terms_status' => 'commercial_terms_pending',
        ];
    }
    $contractSnapshot = [
        'framework_template_code' => 'CPG-BIZ-123',
        'framework_template_version' => '1.3',
        'agreement_type' => 'framework_adhesion_agreement',
        'acceptance_text' => 'С условиями рамочного договора присоединения согласен',
        'commercial_terms_status' => 'commercial_terms_pending',
        'generated_contract_reference' => '/docs/crewportglobal/324_cpg_biz_123_full_contract_ru_checkbox_radio.md',
    ];

    $offerNumber = cpg_agent_framework_offer_number();
    api_tx_begin();
    try {
        $row = cpg_fetch_one_assoc(
            "INSERT INTO crewportglobal.agent_framework_agreement_offers (
               offer_number,
               shipowner_user_id,
               shipowner_company_id,
               agent_organization_id,
               represented_object_type,
               represented_object_id,
               offer_status,
               framework_terms_status,
               authority_status,
               commercial_terms_status,
               delegated_scope,
               contract_snapshot,
               offered_by_user_id,
               metadata
             ) VALUES (
               $1,
               $2::uuid,
               $3::uuid,
               $4::uuid,
               'employer_company',
               $3::uuid,
               'sent',
               'offered',
               'pending',
               'commercial_terms_pending',
               $5::jsonb,
               $6::jsonb,
               $2::uuid,
               $7::jsonb
             )
             RETURNING agent_framework_agreement_offer_id::text AS offer_id,
                       offer_number,
                       shipowner_user_id::text AS shipowner_user_id,
                       shipowner_company_id::text AS shipowner_company_id,
                       agent_organization_id::text AS agent_organization_id,
                       represented_object_type,
                       represented_object_id::text AS represented_object_id,
                       offer_status,
                       framework_terms_status,
                       authority_status,
                       commercial_terms_status,
                       framework_template_code,
                       framework_template_version,
                       signature_method,
                       acceptance_text,
                       offered_at::text AS offered_at",
            [
                $offerNumber,
                $draftId,
                $context['company_id'],
                $agentOrganizationId,
                cpg_agent_json_object_text($delegatedScope),
                cpg_agent_json_object_text($contractSnapshot),
                cpg_agent_json_object_text(['source' => 'shipowner_agent_assignment_ui']),
            ]
        );
        $offerId = is_array($row) ? (string) ($row['offer_id'] ?? '') : '';
        $summary = 'Shipowner ' . (string) ($context['company_name'] ?? $context['company_id'])
            . ' sent framework agreement offer to agent ' . (string) ($agent['agent_display_name'] ?? $agentOrganizationId);
        $payload = [
            'offer_id' => $offerId,
            'offer_number' => $offerNumber,
            'company_id' => $context['company_id'],
            'agent_organization_id' => $agentOrganizationId,
            'commercial_terms_status' => 'commercial_terms_pending',
            'framework_template_code' => 'CPG-BIZ-123',
            'framework_template_version' => '1.3',
        ];
        cpg_agent_create_participant_notification(
            $draftId,
            null,
            'employer_company',
            $context['company_id'],
            'agent_framework_offer_sent',
            'framework_offer',
            $summary,
            'view',
            $payload,
            $draftId,
            $offerId,
            null,
            $agentOrganizationId
        );
        cpg_agent_create_participant_notification(
            null,
            $agentOrganizationId,
            'employer_company',
            $context['company_id'],
            'agent_framework_offer_received',
            'framework_offer',
            $summary,
            'accept',
            $payload,
            $draftId,
            $offerId,
            null,
            $agentOrganizationId
        );
        cpg_agent_scope_audit_event(
            'agent_framework_offer_sent',
            $draftId,
            $agentOrganizationId,
            null,
            null,
            null,
            'employer_company',
            $context['company_id'],
            [],
            $payload,
            'shipowner sent framework agreement offer to registered agent'
        );

        api_tx_commit();
        api_json(201, [
            'ok' => true,
            'offer' => array_merge(cpg_agent_framework_offer_public_row(array_merge($row ?? [], [
                'agent_display_name' => $agent['agent_display_name'] ?? null,
                'shipowner_company_name' => $context['company_name'],
            ])), [
                'contract_snapshot' => $contractSnapshot,
            ]),
            'notification_summary' => [
                'shipowner_notification_created' => true,
                'agent_notification_created' => true,
            ],
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'agent_offer_create_failed', $error->getMessage());
    }
}

function cpg_agent_framework_offer_rows_for_agent(string $agentOrganizationId, int $limit = 100): array {
    if (!cpg_agent_framework_tables_ready()) {
        return [];
    }

    return cpg_fetch_all_assoc(
        "SELECT afo.agent_framework_agreement_offer_id::text AS offer_id,
                afo.offer_number,
                afo.shipowner_user_id::text AS shipowner_user_id,
                afo.shipowner_company_id::text AS shipowner_company_id,
                ec.company_name AS shipowner_company_name,
                afo.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                afo.represented_object_type,
                afo.represented_object_id::text AS represented_object_id,
                afo.offer_status,
                afo.framework_terms_status,
                afo.authority_status,
                afo.commercial_terms_status,
                afo.framework_template_code,
                afo.framework_template_version,
                afo.signature_method,
                afo.acceptance_text,
                afo.delegated_scope::text AS delegated_scope,
                afo.contract_snapshot::text AS contract_snapshot,
                afo.source_authority_document_id::text AS source_authority_document_id,
                afo.agent_object_assignment_id::text AS assignment_id,
                afo.offered_at::text AS offered_at,
                afo.accepted_at::text AS accepted_at,
                afo.activated_at::text AS activated_at
         FROM crewportglobal.agent_framework_agreement_offers afo
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = afo.agent_organization_id
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = afo.shipowner_company_id
         WHERE afo.agent_organization_id = $1::uuid
           AND afo.archived_at IS NULL
         ORDER BY afo.updated_at DESC
         LIMIT $2",
        [$agentOrganizationId, $limit]
    );
}

function cpg_agent_framework_offer_response_row(array $row): array {
    $public = cpg_agent_framework_offer_public_row($row);
    $public['delegated_scope'] = cpg_agent_json_text_to_object($row['delegated_scope'] ?? null);
    $public['contract_snapshot'] = cpg_agent_json_text_to_object($row['contract_snapshot'] ?? null);
    return $public;
}

function cpg_agent_task_from_framework_offer(array $row): array {
    $offerId = is_string($row['offer_id'] ?? null) ? (string) $row['offer_id'] : '';
    $status = is_string($row['offer_status'] ?? null) ? (string) $row['offer_status'] : '';
    $companyName = cpg_agent_string_value($row['shipowner_company_name'] ?? null, 200) ?? 'shipowner company';
    $templateCode = cpg_agent_string_value($row['framework_template_code'] ?? null, 40) ?? 'CPG-BIZ-123';
    $version = cpg_agent_string_value($row['framework_template_version'] ?? null, 20) ?? '1.3';
    $requiresAction = $status === 'sent';

    return [
        'task_id' => 'agent-framework-offer-' . $offerId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => $requiresAction ? 'accept_shipowner_framework_agreement' : 'track_shipowner_framework_agreement',
        'task_title' => ($requiresAction ? 'Accept shipowner framework agreement offer.' : 'Track shipowner framework agreement.')
            . ' (' . $companyName . '.)',
        'process_stage' => 'Shipowner-agent framework agreement and authority activation',
        'visibility_condition' => 'Visible while a shipowner framework agreement offer is recorded for this agent organization.',
        'task_state' => $requiresAction ? 'agent_action_required' : 'waiting_for_next_stage',
        'framework_offer' => cpg_agent_framework_offer_response_row($row),
        'target_url' => '/agents/#agent-offer-' . rawurlencode($offerId),
        'generated_at' => gmdate('c'),
        'contract_reference' => [
            'template_code' => $templateCode,
            'template_version' => $version,
        ],
    ];
}

function handle_get_agent_framework_agreement_offers(): void {
    cpg_agent_require_framework_tables();
    $access = cpg_agent_access_from_request();
    $rows = cpg_agent_framework_offer_rows_for_agent((string) $access['agent_organization_id'], 100);
    $offers = array_map('cpg_agent_framework_offer_response_row', $rows);

    api_json(200, [
        'ok' => true,
        'agent_organization_id' => $access['agent_organization_id'],
        'agent_display_name' => $access['agent_display_name'],
        'offers' => $offers,
        'count' => count($offers),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_post_agent_framework_agreement_offer_accept(string $offerId): void {
    cpg_agent_require_framework_tables();
    $offerUuid = api_normalize_uuid($offerId);
    if ($offerUuid === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_agent_framework_offer_id',
            'message' => 'Invalid agent framework agreement offer id',
        ]);
    }

    $access = cpg_agent_access_from_request();
    $body = api_decode_json_body();
    $accepted = ($body['framework_terms_accepted'] ?? null) === true || ($body['accepted'] ?? null) === true;
    $acceptanceText = cpg_agent_string_value($body['acceptance_text'] ?? null, 500)
        ?? 'С условиями рамочного договора присоединения согласен';
    if (!$accepted) {
        api_json(400, [
            'ok' => false,
            'error' => 'framework_terms_acceptance_required',
            'message' => 'The agent must confirm agreement with the framework agreement terms',
        ]);
    }

    api_tx_begin();
    try {
        $offer = cpg_fetch_one_assoc(
            "SELECT afo.agent_framework_agreement_offer_id::text AS offer_id,
                    afo.offer_number,
                    afo.shipowner_user_id::text AS shipowner_user_id,
                    afo.shipowner_company_id::text AS shipowner_company_id,
                    ec.company_name AS shipowner_company_name,
                    afo.agent_organization_id::text AS agent_organization_id,
                    ao.agent_display_name,
                    afo.represented_object_type,
                    afo.represented_object_id::text AS represented_object_id,
                    afo.offer_status,
                    afo.framework_terms_status,
                    afo.authority_status,
                    afo.commercial_terms_status,
                    afo.framework_template_code,
                    afo.framework_template_version,
                    afo.signature_method,
                    afo.acceptance_text,
                    afo.delegated_scope::text AS delegated_scope,
                    afo.contract_snapshot::text AS contract_snapshot,
                    afo.source_authority_document_id::text AS source_authority_document_id,
                    afo.agent_object_assignment_id::text AS assignment_id,
                    afo.offered_at::text AS offered_at,
                    afo.accepted_at::text AS accepted_at,
                    afo.activated_at::text AS activated_at
             FROM crewportglobal.agent_framework_agreement_offers afo
             JOIN crewportglobal.agent_organizations ao
               ON ao.agent_organization_id = afo.agent_organization_id
             JOIN crewportglobal.employer_companies ec
               ON ec.company_id = afo.shipowner_company_id
             WHERE afo.agent_framework_agreement_offer_id = $1::uuid
               AND afo.agent_organization_id = $2::uuid
               AND afo.archived_at IS NULL
             FOR UPDATE",
            [$offerUuid, (string) $access['agent_organization_id']]
        );
        if (!is_array($offer)) {
            api_tx_rollback();
            api_json(404, [
                'ok' => false,
                'error' => 'agent_framework_offer_not_found',
                'message' => 'Framework agreement offer is not visible for this agent organization',
            ]);
        }
        if ((string) ($offer['offer_status'] ?? '') === 'activated') {
            api_tx_commit();
            api_json(200, [
                'ok' => true,
                'offer' => cpg_agent_framework_offer_response_row($offer),
                'already_activated' => true,
            ]);
        }
        if ((string) ($offer['offer_status'] ?? '') !== 'sent') {
            api_tx_rollback();
            api_json(409, [
                'ok' => false,
                'error' => 'agent_framework_offer_not_acceptible',
                'message' => 'Only sent framework agreement offers can be accepted',
                'offer_status' => $offer['offer_status'] ?? null,
            ]);
        }

        $objectType = (string) ($offer['represented_object_type'] ?? 'employer_company');
        $objectId = (string) ($offer['represented_object_id'] ?? '');
        $activeAssignment = cpg_fetch_one_assoc(
            "SELECT aoa.agent_object_assignment_id::text AS assignment_id,
                    aoa.agent_organization_id::text AS agent_organization_id,
                    ao.agent_display_name,
                    aoa.assignment_status
             FROM crewportglobal.agent_object_assignments aoa
             JOIN crewportglobal.agent_organizations ao
               ON ao.agent_organization_id = aoa.agent_organization_id
             WHERE aoa.object_type = $1
               AND aoa.object_id = $2::uuid
               AND aoa.assignment_status IN ('active', 'limited')
               AND aoa.archived_at IS NULL
             LIMIT 1",
            [$objectType, $objectId]
        );
        if (is_array($activeAssignment)) {
            api_tx_rollback();
            api_json(409, [
                'ok' => false,
                'error' => 'represented_object_already_managed',
                'message' => 'The represented object already has an active managing agent assignment',
                'assignment' => $activeAssignment,
            ]);
        }

        $scopeSnapshot = [
            'source' => 'agent_framework_offer_acceptance',
            'offer_id' => $offerUuid,
            'offer_number' => $offer['offer_number'] ?? null,
            'represented_object_type' => $objectType,
            'represented_object_id' => $objectId,
            'framework_template_code' => $offer['framework_template_code'] ?? 'CPG-BIZ-123',
            'framework_template_version' => $offer['framework_template_version'] ?? '1.3',
            'acceptance_text' => $acceptanceText,
            'delegated_scope' => cpg_agent_json_text_to_object($offer['delegated_scope'] ?? null),
            'commercial_terms_status' => $offer['commercial_terms_status'] ?? 'commercial_terms_pending',
        ];
        $authority = cpg_fetch_one_assoc(
            "INSERT INTO crewportglobal.agent_authority_documents (
               agent_organization_id,
               authority_type,
               authority_scope_type,
               authority_scope_object_id,
               authority_status,
               valid_from,
               reviewed_by_user_id,
               reviewed_at,
               review_note,
               source_reference,
               scope_snapshot,
               metadata,
               created_by_user_id
             ) VALUES (
               $1::uuid,
               'shipowner_agency_agreement',
               'company',
               $2::uuid,
               'verified',
               CURRENT_DATE,
               $3::uuid,
               now(),
               $4,
               $5,
               $6::jsonb,
               $7::jsonb,
               $8::uuid
             )
             RETURNING agent_authority_document_id::text AS authority_document_id,
                       authority_type,
                       authority_scope_type,
                       authority_scope_object_id::text AS authority_scope_object_id,
                       authority_status,
                       valid_from::text AS valid_from,
                       source_reference",
            [
                (string) $access['agent_organization_id'],
                $objectId,
                (string) $access['actor_user_id'],
                'Automatically verified by shipowner offer and agent checkbox acceptance in CrewPortGlobal.',
                (string) ($offer['offer_number'] ?? ''),
                cpg_agent_json_object_text($scopeSnapshot),
                cpg_agent_json_object_text([
                    'source' => 'agent_framework_offer_acceptance',
                    'signature_method' => 'checkbox_acceptance',
                    'accepted_by_agent_user_id' => (string) $access['agent_user_id'],
                    'accepted_by_user_id' => (string) $access['actor_user_id'],
                    'shipowner_user_id' => (string) ($offer['shipowner_user_id'] ?? ''),
                    'commercial_terms_status' => $offer['commercial_terms_status'] ?? 'commercial_terms_pending',
                ]),
                (string) ($offer['shipowner_user_id'] ?? null),
            ]
        );
        $authorityId = is_array($authority) ? (string) ($authority['authority_document_id'] ?? '') : '';
        $objectSummary = cpg_agent_string_value($offer['shipowner_company_name'] ?? null, 500)
            ?? trim($objectType . ' ' . $objectId);
        $assignment = cpg_fetch_one_assoc(
            "INSERT INTO crewportglobal.agent_object_assignments (
               agent_organization_id,
               object_type,
               object_id,
               assignment_status,
               assignment_source,
               visibility_scope,
               data_responsibility_status,
               source_authority_document_id,
               assigned_by_user_id,
               assigned_agent_user_id,
               assigned_at,
               valid_from,
               object_safe_summary,
               source_snapshot,
               metadata
             ) VALUES (
               $1::uuid,
               $2,
               $3::uuid,
               'active',
               'authority_document',
               'ordinary_execution',
               'agent_responsible',
               $4::uuid,
               $5::uuid,
               $6::uuid,
               now(),
               now(),
               $7,
               $8::jsonb,
               $9::jsonb
             )
             RETURNING agent_object_assignment_id::text AS assignment_id,
                       agent_organization_id::text AS agent_organization_id,
                       object_type,
                       object_id::text AS object_id,
                       assignment_status,
                       assignment_source,
                       visibility_scope,
                       data_responsibility_status,
                       object_safe_summary,
                       assigned_at::text AS assigned_at",
            [
                (string) $access['agent_organization_id'],
                $objectType,
                $objectId,
                $authorityId,
                (string) ($offer['shipowner_user_id'] ?? ''),
                (string) $access['agent_user_id'],
                $objectSummary,
                cpg_agent_json_object_text(array_merge($scopeSnapshot, [
                    'authority_document_id' => $authorityId,
                ])),
                cpg_agent_json_object_text([
                    'source' => 'agent_framework_offer_acceptance',
                    'offer_id' => $offerUuid,
                    'commercial_terms_status' => $offer['commercial_terms_status'] ?? 'commercial_terms_pending',
                    'commercial_terms_required_before_billing' => true,
                ]),
            ]
        );
        $assignmentId = is_array($assignment) ? (string) ($assignment['assignment_id'] ?? '') : '';
        $updatedOffer = cpg_fetch_one_assoc(
            "UPDATE crewportglobal.agent_framework_agreement_offers
             SET offer_status = 'activated',
                 framework_terms_status = 'accepted',
                 authority_status = 'verified',
                 accepted_by_user_id = $2::uuid,
                 accepted_at = now(),
                 activated_at = now(),
                 source_authority_document_id = $3::uuid,
                 agent_object_assignment_id = $4::uuid,
                 status_reason = 'Agent accepted framework agreement terms and platform authority was activated.',
                 metadata = metadata || $5::jsonb
             WHERE agent_framework_agreement_offer_id = $1::uuid
             RETURNING agent_framework_agreement_offer_id::text AS offer_id,
                       offer_number,
                       shipowner_user_id::text AS shipowner_user_id,
                       shipowner_company_id::text AS shipowner_company_id,
                       agent_organization_id::text AS agent_organization_id,
                       represented_object_type,
                       represented_object_id::text AS represented_object_id,
                       offer_status,
                       framework_terms_status,
                       authority_status,
                       commercial_terms_status,
                       framework_template_code,
                       framework_template_version,
                       signature_method,
                       acceptance_text,
                       delegated_scope::text AS delegated_scope,
                       contract_snapshot::text AS contract_snapshot,
                       source_authority_document_id::text AS source_authority_document_id,
                       agent_object_assignment_id::text AS assignment_id,
                       offered_at::text AS offered_at,
                       accepted_at::text AS accepted_at,
                       activated_at::text AS activated_at",
            [
                $offerUuid,
                (string) $access['actor_user_id'],
                $authorityId,
                $assignmentId,
                cpg_agent_json_object_text([
                    'accepted_by_agent_user_id' => (string) $access['agent_user_id'],
                    'accepted_by_user_id' => (string) $access['actor_user_id'],
                    'acceptance_text' => $acceptanceText,
                ]),
            ]
        );

        $summary = 'Agent ' . (string) ($offer['agent_display_name'] ?? $access['agent_display_name'])
            . ' accepted framework agreement and activated management for ' . $objectSummary;
        $payload = [
            'offer_id' => $offerUuid,
            'offer_number' => $offer['offer_number'] ?? null,
            'authority_document_id' => $authorityId,
            'assignment_id' => $assignmentId,
            'represented_object_type' => $objectType,
            'represented_object_id' => $objectId,
            'commercial_terms_status' => $offer['commercial_terms_status'] ?? 'commercial_terms_pending',
        ];
        cpg_agent_create_participant_notification(
            (string) ($offer['shipowner_user_id'] ?? ''),
            null,
            $objectType,
            $objectId,
            'agent_framework_offer_accepted',
            'authority_activation',
            $summary,
            'view',
            $payload,
            (string) $access['actor_user_id'],
            $offerUuid,
            $assignmentId,
            (string) $access['agent_organization_id'],
            $authorityId
        );
        cpg_agent_create_participant_notification(
            null,
            (string) $access['agent_organization_id'],
            $objectType,
            $objectId,
            'agent_assignment_activated',
            'authority_activation',
            $summary,
            'view',
            $payload,
            (string) $access['actor_user_id'],
            $offerUuid,
            $assignmentId,
            (string) $access['agent_organization_id'],
            $authorityId
        );
        cpg_agent_scope_audit_event(
            'agent_framework_offer_accepted',
            (string) $access['actor_user_id'],
            (string) $access['agent_organization_id'],
            (string) $access['agent_user_id'],
            null,
            $assignmentId,
            $objectType,
            $objectId,
            ['offer_status' => $offer['offer_status'] ?? null],
            $payload,
            'agent accepted shipowner framework agreement offer'
        );

        api_tx_commit();
        api_json(200, [
            'ok' => true,
            'offer' => cpg_agent_framework_offer_response_row(array_merge($updatedOffer ?? [], [
                'agent_display_name' => $offer['agent_display_name'] ?? $access['agent_display_name'],
                'shipowner_company_name' => $offer['shipowner_company_name'] ?? null,
            ])),
            'authority' => $authority,
            'assignment' => $assignment,
            'notifications_recorded' => true,
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'agent_framework_offer_accept_failed', $error->getMessage());
    }
}

function cpg_contract_workspace_tables_ready(): bool {
    $row = cpg_fetch_one_assoc(
        "SELECT to_regclass('crewportglobal.contract_workspace_instances') AS workspaces_table,
                to_regclass('crewportglobal.master_contract_templates') AS templates_table,
                to_regclass('crewportglobal.contract_field_catalogs') AS catalogs_table",
        []
    );

    return $row !== null
        && is_string($row['workspaces_table'] ?? null)
        && is_string($row['templates_table'] ?? null)
        && is_string($row['catalogs_table'] ?? null);
}

function cpg_contract_proposal_blocker(string $code, string $message, array $details = []): array {
    $blocker = [
        'code' => $code,
        'message' => $message,
    ];
    if ($details !== []) {
        $blocker['details'] = $details;
    }
    return $blocker;
}

function cpg_contract_latest_approved_template(): ?array {
    if (!cpg_contract_workspace_tables_ready()) {
        return null;
    }

    return cpg_fetch_one_assoc(
        "SELECT master_contract_template_id::text AS master_contract_template_id,
                template_code,
                template_version,
                template_title,
                template_hash
         FROM crewportglobal.master_contract_templates
         WHERE template_status = 'approved'
           AND authoritative_language = 'en'
         ORDER BY approved_at DESC NULLS LAST, updated_at DESC, created_at DESC
         LIMIT 1",
        []
    );
}

function cpg_contract_latest_approved_catalog(): ?array {
    if (!cpg_contract_workspace_tables_ready()) {
        return null;
    }

    return cpg_fetch_one_assoc(
        "SELECT contract_field_catalog_id::text AS contract_field_catalog_id,
                catalog_code,
                catalog_version,
                catalog_title
         FROM crewportglobal.contract_field_catalogs
         WHERE catalog_status = 'approved'
         ORDER BY approved_at DESC NULLS LAST, updated_at DESC, created_at DESC
         LIMIT 1",
        []
    );
}

function cpg_contract_existing_active_workspace(string $vacancyRequestId, string $seafarerProfileId): ?array {
    if (!cpg_contract_workspace_tables_ready()) {
        return null;
    }

    return cpg_fetch_one_assoc(
        "SELECT contract_workspace_id::text AS contract_workspace_id,
                workspace_number,
                workspace_status,
                shortlist_candidate_id::text AS shortlist_candidate_id,
                vacancy_application_id::text AS vacancy_application_id,
                created_at::text AS created_at,
                updated_at::text AS updated_at
         FROM crewportglobal.contract_workspace_instances
         WHERE vacancy_request_id = $1
           AND seafarer_profile_id = $2
           AND archived_at IS NULL
           AND workspace_status NOT IN ('voided', 'superseded')
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1",
        [$vacancyRequestId, $seafarerProfileId]
    );
}

function cpg_contract_proposal_operation_for_presented_candidate(array $row): array {
    $applicationStatus = is_string($row['application_status'] ?? null) ? (string) $row['application_status'] : '';
    $employerStatus = is_string($row['employer_shortlist_status'] ?? null) && trim((string) $row['employer_shortlist_status']) !== ''
        ? trim((string) $row['employer_shortlist_status'])
        : 'presented';
    $vacancyRequestId = is_string($row['vacancy_request_id'] ?? null) ? (string) $row['vacancy_request_id'] : '';
    $seafarerProfileId = is_string($row['seafarer_profile_id'] ?? null) ? (string) $row['seafarer_profile_id'] : '';

    $blockers = [];
    if (!cpg_contract_workspace_tables_ready()) {
        $blockers[] = cpg_contract_proposal_blocker('contract_workspace_store_missing', 'Contract workspace store is not available');
    }
    if ($applicationStatus !== 'presented') {
        $blockers[] = cpg_contract_proposal_blocker('candidate_not_presented', 'Candidate must be presented to employer before contract proposal', [
            'application_status' => $applicationStatus,
        ]);
    }
    if ($employerStatus !== 'proceed_with_candidate') {
        $blockers[] = cpg_contract_proposal_blocker('employer_decision_not_proceed', 'Employer must choose proceed with candidate before contract proposal', [
            'employer_shortlist_status' => $employerStatus,
        ]);
    }

    if ($seafarerProfileId === '') {
        $blockers[] = cpg_contract_proposal_blocker('seafarer_profile_missing', 'Candidate must have a seafarer profile before contract proposal');
    }

    $existing = $vacancyRequestId !== '' && $seafarerProfileId !== ''
        ? cpg_contract_existing_active_workspace($vacancyRequestId, $seafarerProfileId)
        : null;
    $template = cpg_contract_latest_approved_template();
    $catalog = cpg_contract_latest_approved_catalog();
    if ($template === null) {
        $blockers[] = cpg_contract_proposal_blocker('approved_master_contract_template_missing', 'Approved master contract template is required before contract workspace creation');
    }
    if ($catalog === null) {
        $blockers[] = cpg_contract_proposal_blocker('approved_contract_field_catalog_missing', 'Approved contract field catalog is required before contract workspace creation');
    }

    if ($existing !== null) {
        return [
            'operation_code' => 'propose_contract',
            'visible' => true,
            'enabled' => true,
            'next_action' => 'open_existing_contract_workspace',
            'blockers' => [],
            'existing_contract_workspace_id' => $existing['contract_workspace_id'],
            'existing_workspace_status' => $existing['workspace_status'],
            'source_traceability_status' => is_string($row['shortlist_candidate_id'] ?? null)
                ? 'shortlist_candidate_linked'
                : 'degraded_legacy_without_shortlist_candidate',
        ];
    }

    return [
        'operation_code' => 'propose_contract',
        'visible' => !in_array($employerStatus, ['not_suitable'], true),
        'enabled' => $blockers === [],
        'next_action' => 'create_contract_workspace',
        'blockers' => $blockers,
        'existing_contract_workspace_id' => null,
        'source_traceability_status' => is_string($row['shortlist_candidate_id'] ?? null)
            ? 'shortlist_candidate_linked'
            : 'degraded_legacy_without_shortlist_candidate',
    ];
}

function cpg_contract_workspace_source_value(
    string $fieldCode,
    string $clauseId,
    string $label,
    string $choiceType,
    string $sourceType,
    ?string $sourceObjectType,
    ?string $sourceObjectId,
    ?string $sourceFieldCode,
    mixed $value,
    string $requiredness = 'required'
): array {
    $display = null;
    if (is_array($value)) {
        $parts = [];
        foreach ($value as $item) {
            if ($item !== null && trim((string) $item) !== '') {
                $parts[] = trim((string) $item);
            }
        }
        $display = $parts === [] ? null : implode(' / ', $parts);
    } elseif ($value !== null && trim((string) $value) !== '') {
        $display = trim((string) $value);
    }

    return [
        'field_code' => $fieldCode,
        'clause_id' => $clauseId,
        'label' => $label,
        'choice_type' => $choiceType,
        'source_type' => $sourceType,
        'source_object_type' => $sourceObjectType,
        'source_object_id' => $sourceObjectId,
        'source_field_code' => $sourceFieldCode,
        'display_value' => $display,
        'requiredness' => $requiredness,
        'completion_status' => $display === null ? 'missing' : 'ready',
        'source_status_snapshot' => [
            'source_rule' => $sourceType === 'linked_record'
                ? 'verified_source_prefill'
                : 'contractual_choice_required',
        ],
    ];
}

function cpg_contract_workspace_access(string $workspaceId, string $draftId): ?array {
    $role = read_role_for_user($draftId);
    if ($role === null) {
        return null;
    }

    if ($role === 'seafarer') {
        return cpg_fetch_one_assoc(
            "SELECT cwi.contract_workspace_id::text AS contract_workspace_id,
                    cwi.seafarer_profile_id::text AS seafarer_profile_id,
                    'seafarer' AS access_party
             FROM crewportglobal.contract_workspace_instances cwi
             JOIN crewportglobal.seafarer_profiles sp ON sp.seafarer_profile_id = cwi.seafarer_profile_id
             WHERE cwi.contract_workspace_id = $1
               AND sp.user_id = $2
               AND cwi.archived_at IS NULL
             LIMIT 1",
            [$workspaceId, $draftId]
        );
    }

    $company = read_primary_company_for_user($draftId);
    if ($company === null || !isset($company['company_id'])) {
        return null;
    }

    return cpg_fetch_one_assoc(
        "SELECT cwi.contract_workspace_id::text AS contract_workspace_id,
                cwi.employer_company_id::text AS employer_company_id,
                'shipowner' AS access_party
         FROM crewportglobal.contract_workspace_instances cwi
         WHERE cwi.contract_workspace_id = $1
           AND cwi.employer_company_id = $2
           AND cwi.archived_at IS NULL
         LIMIT 1",
        [$workspaceId, (string) $company['company_id']]
    );
}

function cpg_contract_workspace_detail(string $workspaceId): ?array {
    $workspace = cpg_fetch_one_assoc(
        "SELECT cwi.contract_workspace_id::text AS contract_workspace_id,
                cwi.workspace_number,
                cwi.workspace_status,
                cwi.seafarer_profile_id::text AS seafarer_profile_id,
                cwi.employer_company_id::text AS employer_company_id,
                cwi.vessel_id::text AS vessel_id,
                cwi.vacancy_request_id::text AS vacancy_request_id,
                cwi.shortlist_draft_id::text AS shortlist_draft_id,
                cwi.shortlist_candidate_id::text AS shortlist_candidate_id,
                cwi.vacancy_application_id::text AS vacancy_application_id,
                cwi.master_contract_template_id::text AS master_contract_template_id,
                cwi.contract_field_catalog_id::text AS contract_field_catalog_id,
                cwi.assigned_group_code,
                cwi.assigned_user_id::text AS assigned_user_id,
                cwi.blocked_reason_snapshot::text AS blocked_reason_snapshot,
                cwi.preview_hash,
                cwi.source_snapshot_hash,
                cwi.created_at::text AS created_at,
                cwi.updated_at::text AS updated_at,
                mct.template_code,
                mct.template_version,
                mct.template_title,
                mct.template_status,
                cfc.catalog_code,
                cfc.catalog_version,
                cfc.catalog_title,
                cfc.catalog_status,
                sp.first_name AS seafarer_name,
                sp.primary_rank AS seafarer_rank,
                sp.department AS seafarer_department,
                sp.availability_status,
                sp.availability_date::text AS availability_date,
                sp.nationality_code,
                sp.residence_country_code,
                sp.review_status AS seafarer_review_status,
                ec.company_name,
                ec.registration_number,
                ec.country_code AS company_country_code,
                ec.company_type,
                ec.verification_status AS company_verification_status,
                v.vessel_name,
                v.imo_number,
                v.vessel_type,
                v.vessel_type_label,
                v.flag_country_code,
                vr.vacancy_title,
                vr.rank AS request_rank,
                vr.department AS request_department,
                vr.vessel_type AS request_vessel_type,
                vr.vessel_type_label AS request_vessel_type_label,
                vr.join_date::text AS join_date,
                vr.contract_duration,
                vr.contract_duration_value,
                vr.contract_duration_unit,
                vr.salary_min_usd,
                vr.salary_max_usd,
                vr.salary_text,
                vr.currency,
                vr.requirements,
                vr.publication_status,
                va.application_status,
                va.employer_shortlist_status,
                va.employer_action_note,
                va.employer_action_at::text AS employer_action_at
         FROM crewportglobal.contract_workspace_instances cwi
         JOIN crewportglobal.master_contract_templates mct ON mct.master_contract_template_id = cwi.master_contract_template_id
         JOIN crewportglobal.contract_field_catalogs cfc ON cfc.contract_field_catalog_id = cwi.contract_field_catalog_id
         JOIN crewportglobal.seafarer_profiles sp ON sp.seafarer_profile_id = cwi.seafarer_profile_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = cwi.employer_company_id
         JOIN crewportglobal.vessels v ON v.vessel_id = cwi.vessel_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = cwi.vacancy_request_id
         LEFT JOIN crewportglobal.vacancy_applications va ON va.vacancy_application_id = cwi.vacancy_application_id
         WHERE cwi.contract_workspace_id = $1
           AND cwi.archived_at IS NULL
         LIMIT 1",
        [$workspaceId]
    );

    if ($workspace === null) {
        return null;
    }

    $workspace['blocked_reason_snapshot'] = cpg_decode_json_object(is_string($workspace['blocked_reason_snapshot'] ?? null) ? $workspace['blocked_reason_snapshot'] : null);

    $sourceFields = [
        cpg_contract_workspace_source_value('C-1.1', 'MC-001', 'Seafarer', 'linked_record', 'linked_record', 'seafarer_profile', $workspace['seafarer_profile_id'], 'first_name', $workspace['seafarer_name']),
        cpg_contract_workspace_source_value('C-1.2', 'MC-001', 'Seafarer rank', 'linked_record', 'linked_record', 'seafarer_profile', $workspace['seafarer_profile_id'], 'primary_rank', $workspace['seafarer_rank']),
        cpg_contract_workspace_source_value('C-1.3', 'MC-001', 'Seafarer department', 'linked_record', 'linked_record', 'seafarer_profile', $workspace['seafarer_profile_id'], 'department', $workspace['seafarer_department']),
        cpg_contract_workspace_source_value('C-2.1', 'MC-002', 'Shipowner / employer', 'linked_record', 'linked_record', 'employer_company', $workspace['employer_company_id'], 'company_name', $workspace['company_name']),
        cpg_contract_workspace_source_value('C-2.2', 'MC-002', 'Company registration number', 'linked_record', 'linked_record', 'employer_company', $workspace['employer_company_id'], 'registration_number', $workspace['registration_number']),
        cpg_contract_workspace_source_value('C-3.1', 'MC-003', 'Vessel', 'linked_record', 'linked_record', 'vessel', $workspace['vessel_id'], 'vessel_name', $workspace['vessel_name']),
        cpg_contract_workspace_source_value('C-3.2', 'MC-003', 'Vessel type', 'linked_record', 'linked_record', 'vessel', $workspace['vessel_id'], 'vessel_type', $workspace['vessel_type_label'] ?: $workspace['vessel_type']),
        cpg_contract_workspace_source_value('C-3.3', 'MC-003', 'Flag', 'linked_record', 'linked_record', 'vessel', $workspace['vessel_id'], 'flag_country_code', $workspace['flag_country_code']),
        cpg_contract_workspace_source_value('C-4.1', 'MC-004', 'Crew request', 'linked_record', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'vacancy_title', $workspace['vacancy_title']),
        cpg_contract_workspace_source_value('C-4.2', 'MC-004', 'Requested rank', 'linked_record', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'rank', $workspace['request_rank']),
        cpg_contract_workspace_source_value('C-5.1', 'MC-005', 'Joining date', 'date', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'join_date', $workspace['join_date']),
        cpg_contract_workspace_source_value('C-5.2', 'MC-005', 'Contract duration', 'linked_record', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'contract_duration', $workspace['contract_duration'] ?: [$workspace['contract_duration_value'], $workspace['contract_duration_unit']]),
        cpg_contract_workspace_source_value('C-6.1', 'MC-006', 'Salary range', 'money', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'salary_min_usd/salary_max_usd', [$workspace['salary_min_usd'], $workspace['salary_max_usd'], $workspace['currency']]),
        cpg_contract_workspace_source_value('C-6.2', 'MC-006', 'Currency', 'single', 'linked_record', 'vacancy_request', $workspace['vacancy_request_id'], 'currency', $workspace['currency']),
        cpg_contract_workspace_source_value('C-8.1', 'MC-008', 'Joining travel responsibility', 'single', 'catalog', null, null, null, null),
        cpg_contract_workspace_source_value('C-9.1', 'MC-009', 'Return / repatriation responsibility', 'single', 'catalog', null, null, null, null),
    ];

    $storedValues = cpg_fetch_all_assoc(
        "SELECT field_code,
                clause_id,
                choice_type,
                source_type,
                source_object_type,
                source_object_id::text AS source_object_id,
                source_field_code,
                source_status_snapshot::text AS source_status_snapshot,
                value_code,
                value_json::text AS value_json,
                display_value,
                requiredness,
                completion_status,
                updated_at::text AS updated_at
         FROM crewportglobal.contract_embedded_field_values
         WHERE contract_workspace_id = $1
         ORDER BY clause_id, field_code",
        [$workspaceId]
    );

    $storedByCode = [];
    foreach ($storedValues as $value) {
        $value['source_status_snapshot'] = cpg_decode_json_object(is_string($value['source_status_snapshot'] ?? null) ? $value['source_status_snapshot'] : null);
        $value['value_json'] = cpg_decode_json_object(is_string($value['value_json'] ?? null) ? $value['value_json'] : null);
        $storedByCode[(string) $value['field_code']] = $value;
    }

    $embeddedFields = [];
    foreach ($sourceFields as $field) {
        $code = (string) $field['field_code'];
        if (isset($storedByCode[$code])) {
            $field = array_merge($field, $storedByCode[$code]);
        }
        $embeddedFields[] = $field;
    }

    $approvals = cpg_fetch_all_assoc(
        "SELECT party_type,
                approval_status,
                approved_preview_hash,
                approval_note,
                requested_at::text AS requested_at,
                approved_at::text AS approved_at,
                withdrawn_at::text AS withdrawn_at,
                updated_at::text AS updated_at
         FROM crewportglobal.contract_workspace_party_approvals
         WHERE contract_workspace_id = $1
         ORDER BY party_type, updated_at DESC",
        [$workspaceId]
    );

    $clauses = cpg_fetch_all_assoc(
        "SELECT mcc.clause_id,
                mcc.clause_order,
                mcc.clause_title,
                mcc.fixed_clause_text,
                mcc.variable_field_codes::text AS variable_field_codes
         FROM crewportglobal.master_contract_clauses mcc
         WHERE mcc.master_contract_template_id = $1
         ORDER BY mcc.clause_order, mcc.clause_id",
        [$workspace['master_contract_template_id'] ?? null]
    );
    foreach ($clauses as &$clause) {
        $clause['variable_field_codes'] = cpg_decode_json_array_field($clause['variable_field_codes'] ?? null);
    }
    unset($clause);

    if ($clauses === []) {
        $clauses = [
            ['clause_id' => 'MC-001', 'clause_order' => 1, 'clause_title' => 'Parties and verified identity', 'fixed_clause_text' => 'The contract workspace uses verified platform records for the seafarer and shipowner.', 'variable_field_codes' => ['C-1.1', 'C-1.2', 'C-2.1']],
            ['clause_id' => 'MC-003', 'clause_order' => 3, 'clause_title' => 'Vessel and service context', 'fixed_clause_text' => 'Vessel, flag and crew request facts are linked from approved source records.', 'variable_field_codes' => ['C-3.1', 'C-3.2', 'C-3.3', 'C-4.1']],
            ['clause_id' => 'MC-006', 'clause_order' => 6, 'clause_title' => 'Wages and payment terms', 'fixed_clause_text' => 'Wage and payment terms must be completed before party approval.', 'variable_field_codes' => ['C-6.1', 'C-6.2']],
            ['clause_id' => 'MC-008', 'clause_order' => 8, 'clause_title' => 'Joining and repatriation', 'fixed_clause_text' => 'Joining and return responsibility must be selected in the contract context.', 'variable_field_codes' => ['C-8.1', 'C-9.1']],
        ];
    }

    $missingFields = array_values(array_filter($embeddedFields, static fn(array $field): bool => ($field['completion_status'] ?? 'missing') === 'missing'));
    $guardStatus = $missingFields === [] ? 'ready_for_party_review' : 'blocked_missing_embedded_fields';

    return [
        'workspace' => [
            'contract_workspace_id' => $workspace['contract_workspace_id'],
            'workspace_number' => $workspace['workspace_number'],
            'workspace_status' => $workspace['workspace_status'],
            'assigned_group_code' => $workspace['assigned_group_code'],
            'assigned_user_id' => $workspace['assigned_user_id'],
            'source_snapshot_hash' => $workspace['source_snapshot_hash'],
            'preview_hash' => $workspace['preview_hash'],
            'created_at' => $workspace['created_at'],
            'updated_at' => $workspace['updated_at'],
        ],
        'template' => [
            'template_code' => $workspace['template_code'],
            'template_version' => $workspace['template_version'],
            'template_title' => $workspace['template_title'],
            'template_status' => $workspace['template_status'],
        ],
        'catalog' => [
            'catalog_code' => $workspace['catalog_code'],
            'catalog_version' => $workspace['catalog_version'],
            'catalog_title' => $workspace['catalog_title'],
            'catalog_status' => $workspace['catalog_status'],
        ],
        'parties' => [
            'seafarer' => [
                'seafarer_profile_id' => $workspace['seafarer_profile_id'],
                'display_name' => $workspace['seafarer_name'],
                'rank' => $workspace['seafarer_rank'],
                'department' => $workspace['seafarer_department'],
                'availability_status' => $workspace['availability_status'],
                'availability_date' => $workspace['availability_date'],
                'nationality_code' => $workspace['nationality_code'],
                'review_status' => $workspace['seafarer_review_status'],
            ],
            'shipowner' => [
                'company_id' => $workspace['employer_company_id'],
                'company_name' => $workspace['company_name'],
                'registration_number' => $workspace['registration_number'],
                'country_code' => $workspace['company_country_code'],
                'company_type' => $workspace['company_type'],
                'verification_status' => $workspace['company_verification_status'],
            ],
        ],
        'vessel' => [
            'vessel_id' => $workspace['vessel_id'],
            'vessel_name' => $workspace['vessel_name'],
            'imo_number' => $workspace['imo_number'],
            'vessel_type' => $workspace['vessel_type_label'] ?: $workspace['vessel_type'],
            'flag_country_code' => $workspace['flag_country_code'],
        ],
        'crew_request' => [
            'vacancy_request_id' => $workspace['vacancy_request_id'],
            'vacancy_title' => $workspace['vacancy_title'],
            'rank' => $workspace['request_rank'],
            'department' => $workspace['request_department'],
            'vessel_type' => $workspace['request_vessel_type_label'] ?: $workspace['request_vessel_type'],
            'join_date' => $workspace['join_date'],
            'contract_duration' => $workspace['contract_duration'],
            'salary_min_usd' => $workspace['salary_min_usd'],
            'salary_max_usd' => $workspace['salary_max_usd'],
            'currency' => $workspace['currency'],
            'publication_status' => $workspace['publication_status'],
        ],
        'candidate_decision' => [
            'vacancy_application_id' => $workspace['vacancy_application_id'],
            'application_status' => $workspace['application_status'],
            'employer_shortlist_status' => $workspace['employer_shortlist_status'],
            'employer_action_note' => $workspace['employer_action_note'],
            'employer_action_at' => $workspace['employer_action_at'],
            'shortlist_candidate_id' => $workspace['shortlist_candidate_id'],
            'shortlist_draft_id' => $workspace['shortlist_draft_id'],
        ],
        'clauses' => $clauses,
        'embedded_fields' => $embeddedFields,
        'approvals' => $approvals,
        'guard' => [
            'status' => $guardStatus,
            'missing_field_codes' => array_map(static fn(array $field): string => (string) $field['field_code'], $missingFields),
            'blockers' => array_map(static fn(array $field): array => [
                'code' => 'missing_required_field',
                'field_code' => (string) $field['field_code'],
                'label' => (string) $field['label'],
            ], $missingFields),
        ],
        'side_effects' => [
            'generates_contract' => false,
            'signs_contract' => false,
            'changes_employment_status' => false,
            'creates_invoice' => false,
        ],
    ];
}

function handle_get_contract_workspace(string $workspaceId): void {
    $uuid = api_normalize_uuid($workspaceId);
    if ($uuid === null) {
        api_error(400, 'invalid_contract_workspace_id', 'contract_workspace_id must be a valid UUID');
    }

    $draftId = api_normalize_uuid($_GET['draft_id'] ?? null);
    if ($draftId === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    if (cpg_contract_workspace_access($uuid, $draftId) === null) {
        api_error(404, 'contract_workspace_not_found', 'Contract workspace not found for this account');
    }

    $detail = cpg_contract_workspace_detail($uuid);
    if ($detail === null) {
        api_error(404, 'contract_workspace_not_found', 'Contract workspace not found');
    }

    api_json(200, [
        'ok' => true,
        'draft_id' => $draftId,
        'visibility_scope' => 'contract_workspace_party_safe_detail',
        'contract_workspace' => $detail,
    ]);
}

function read_vacancy_applications_for_seafarer(string $userId): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.created_at,
            va.updated_at,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            COALESCE(vr.vessel_type, v.vessel_type) AS vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.publication_status,
            COALESCE(vr.employer_country_code, ec.country_code) AS employer_country_code,
            ec.company_name,
            ec.company_type,
            v.vessel_name,
            CASE
              WHEN sc.shortlist_candidate_id IS NULL THEN 'seafarer_initiated_request'
              ELSE 'internal_shortlist_review_application'
            END AS request_source,
            review_event.event_payload->>'decision' AS review_decision,
            review_event.event_payload->>'new_status' AS review_new_status,
            review_event.event_payload->>'review_note' AS review_note,
            review_event.event_payload->>'review_reason_code' AS review_reason_code,
            review_event.event_payload->>'review_reason_name' AS review_reason_name,
            review_event.created_at AS review_decision_at
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN LATERAL (
           SELECT osc.shortlist_candidate_id
           FROM crewportglobal.operator_shortlist_candidates osc
           JOIN crewportglobal.operator_shortlist_drafts osd
             ON osd.shortlist_draft_id = osc.shortlist_draft_id
           WHERE osd.vacancy_request_id = va.vacancy_request_id
             AND osc.candidate_user_id = va.seafarer_user_id
             AND osc.operator_decision = 'include'
           ORDER BY osd.updated_at DESC, osc.updated_at DESC
           LIMIT 1
         ) sc ON TRUE
         LEFT JOIN LATERAL (
           SELECT event_payload, created_at
           FROM crewportglobal.registration_audit_events
           WHERE event_type = 'operator_review_decision_recorded'
             AND event_payload->>'queue_type' = 'vacancy_application'
             AND event_payload->>'vacancy_application_id' = va.vacancy_application_id::text
           ORDER BY created_at DESC
           LIMIT 1
         ) review_event ON TRUE
         WHERE va.seafarer_user_id = $1
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 50",
        [$userId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'contact_email' => $row['contact_email'],
            'candidate_note' => $row['candidate_note'],
            'application_status' => $row['application_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['rank'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'salary_text' => $row['salary_text'],
            'currency' => $row['currency'],
            'publication_status' => $row['publication_status'],
            'employer_country_code' => $row['employer_country_code'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'vessel_name' => $row['vessel_name'],
            'request_source' => $row['request_source'],
            'review_decision' => $row['review_decision'] ?? null,
            'review_new_status' => $row['review_new_status'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'review_reason_code' => $row['review_reason_code'] ?? null,
            'review_reason_name' => $row['review_reason_name'] ?? null,
            'review_decision_at' => $row['review_decision_at'] ?? null,
        ];
    }

    return $items;
}

function build_draft_response(string $userId, string $visibilityScope = 'owner_full', ?string $preferredRole = null): array {
    $visibilityScope = cpg_normalize_visibility_scope($visibilityScope);
    $userResult = api_query(
        'SELECT user_id,
                email,
                display_name,
                email_verified_at,
                email_verification_status,
                registration_status,
                created_at,
                updated_at
         FROM crewportglobal.users
         WHERE user_id = $1',
        [$userId]
    );
    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    $role = resolve_registration_draft_role($userId, $preferredRole);
    if ($role === null) {
        api_error(500, 'role_missing', 'User role mapping is missing');
    }

    $payload = [];

    if ($role === 'seafarer') {
        $profileResult = api_query(
            'SELECT first_name,
                    last_name,
                    primary_rank,
                    department,
                    availability_status,
                    availability_date,
                    country_code,
                    nationality_code,
                    residence_country_code,
                    preferred_vessel_types,
                    salary_expectation_usd,
                    contact_phone,
                    contact_email,
                    review_status,
                    document_metadata
             FROM crewportglobal.seafarer_profiles
             WHERE user_id = $1',
            [$userId]
        );
        $profile = pg_fetch_assoc($profileResult) ?: [];
        $documentMetadata = cpg_decode_json_object(is_string($profile['document_metadata'] ?? null) ? $profile['document_metadata'] : null);
        $workspaceSummary = cpg_read_seafarer_workspace_summary($userId);
        if ($visibilityScope !== 'owner_full') {
            $profile['document_metadata'] = cpg_workspace_json(cpg_seafarer_document_metadata_for_scope($documentMetadata, $visibilityScope));
        }
        $payload['seafarer_profile'] = $profile;
        $payload['seafarer_workspace_structured'] = cpg_seafarer_workspace_summary_for_scope($workspaceSummary, $visibilityScope);
        $payload['seafarer_review_readiness'] = cpg_seafarer_workspace_review_readiness($workspaceSummary, $documentMetadata);
        $payload['seafarer_consent_summary'] = cpg_seafarer_consent_summary($userId);
        if ($visibilityScope === 'owner_full' || $visibilityScope === 'cabinet_summary') {
            $payload['vacancy_applications'] = read_vacancy_applications_for_seafarer($userId);
        }
    } else {
        $company = read_primary_company_for_user($userId);
        if ($company !== null) {
            $payload['company'] = $company;
            $vessel = read_latest_vessel_for_company((string) $company['company_id']);
            if ($vessel !== null) {
                $payload['vessel'] = $vessel;
            }
            $vacancy = read_latest_vacancy_for_company((string) $company['company_id'], $userId);
            if ($vacancy !== null) {
                $vacancy['demand_matching_foundation'] = demand_matching_foundation_summary($vacancy);
                $payload['vacancy_request'] = $vacancy;
                $payload['demand_requirement_items'] = read_demand_requirement_items((string) $vacancy['vacancy_request_id']);
            }
            $payload['presented_candidates'] = read_presented_candidates_for_employer(
                (string) $company['company_id'],
                $vacancy !== null && isset($vacancy['vacancy_request_id']) ? (string) $vacancy['vacancy_request_id'] : null
            );
        }
    }

    $latestReviewEvent = read_latest_operator_review_event($userId);
    if ($latestReviewEvent !== null) {
        $payload['operator_review'] = $latestReviewEvent;
    }
    $payload['operator_review_history'] = read_operator_review_history($userId);

    return [
        'ok' => true,
        'draft_id' => $userRow['user_id'],
        'role' => $role,
        'email' => $userRow['email'],
        'display_name' => $userRow['display_name'] ?? null,
        'email_verified' => $userRow['email_verified_at'] !== null || (string) $userRow['email_verification_status'] === 'verified',
        'email_verified_at' => $userRow['email_verified_at'] ?? null,
        'email_verification_status' => $userRow['email_verified_at'] !== null
            ? 'verified'
            : (string) $userRow['email_verification_status'],
        'account_activation_status' => ($userRow['email_verified_at'] !== null || (string) $userRow['email_verification_status'] === 'verified')
            ? 'active'
            : 'pending_email_verification',
        'profile_photo' => function_exists('cpg_profile_photo_public_current')
            ? cpg_profile_photo_public_current($userId)
            : null,
        'status' => in_array($userRow['registration_status'], REG_DRAFT_STATUSES, true)
            ? $userRow['registration_status']
            : 'draft',
        'visibility_scope' => $visibilityScope,
        'payload' => $payload,
        'created_at' => $userRow['created_at'],
        'updated_at' => $userRow['updated_at'],
    ];
}

function cpg_agent_form_request_context(?array $body = null): array {
    $actor = null;
    if (is_array($body) && is_string($body['actor'] ?? null)) {
        $actor = strtolower(trim((string) $body['actor']));
    } elseif (is_string($_GET['actor'] ?? null)) {
        $actor = strtolower(trim((string) $_GET['actor']));
    }

    $assignmentInput = null;
    if (is_array($body) && is_string($body['assignment_id'] ?? null)) {
        $assignmentInput = (string) $body['assignment_id'];
    } elseif (is_string($_GET['assignment_id'] ?? null)) {
        $assignmentInput = (string) $_GET['assignment_id'];
    }
    $assignmentId = api_normalize_uuid($assignmentInput);
    $agentRequested = $actor === 'agent' || $assignmentInput !== null;

    if (!$agentRequested) {
        return ['is_agent_context' => false];
    }
    if ($assignmentId === null) {
        api_json(403, [
            'ok' => false,
            'error' => 'agent_assignment_context_required',
            'message' => 'Agent form access requires a valid assignment_id',
        ]);
    }

    $access = cpg_agent_access_from_request();
    $row = cpg_agent_assignment_row_by_id((string) $access['agent_organization_id'], $assignmentId);
    if (!is_array($row)) {
        api_json(404, [
            'ok' => false,
            'error' => 'agent_object_assignment_not_found',
            'message' => 'No active object assignment is visible for this agent organization',
            'assignment_id' => $assignmentId,
        ]);
    }

    $management = cpg_agent_management_block_from_assignment($row);
    if (($management['management_allowed'] ?? false) !== true) {
        api_json(403, [
            'ok' => false,
            'error' => 'agent_assignment_management_blocked',
            'message' => 'Agent assignment is not currently allowed to manage this object',
            'assignment_id' => $assignmentId,
            'management' => $management,
        ]);
    }

    return [
        'is_agent_context' => true,
        'assignment_id' => $assignmentId,
        'access' => $access,
        'assignment' => $row,
        'management' => $management,
    ];
}

function cpg_agent_context_public_payload(array $context): ?array {
    if (($context['is_agent_context'] ?? false) !== true) {
        return null;
    }

    $assignment = is_array($context['assignment'] ?? null) ? $context['assignment'] : [];
    $access = is_array($context['access'] ?? null) ? $context['access'] : [];
    return [
        'actor' => 'agent',
        'access_model' => 'agent_account_session',
        'assignment_id' => $context['assignment_id'] ?? null,
        'agent_organization_id' => $access['agent_organization_id'] ?? null,
        'agent_display_name' => $access['agent_display_name'] ?? null,
        'object_type' => $assignment['object_type'] ?? null,
        'object_id' => $assignment['object_id'] ?? null,
        'management' => $context['management'] ?? null,
    ];
}

function cpg_agent_context_attach_response(array $response, array $context): array {
    $payload = cpg_agent_context_public_payload($context);
    if ($payload !== null) {
        $response['agent_context'] = $payload;
    }
    return $response;
}

function cpg_agent_assignment_draft_source_ids(array $context): array {
    $assignment = is_array($context['assignment'] ?? null) ? $context['assignment'] : [];
    $objectType = is_string($assignment['object_type'] ?? null) ? (string) $assignment['object_type'] : '';
    $objectId = is_string($assignment['object_id'] ?? null) ? (string) $assignment['object_id'] : '';
    if ($objectType === '' || $objectId === '') {
        return [];
    }

    $snapshot = cpg_agent_object_safe_snapshot($objectType, $objectId);
    return is_array($snapshot['source_ids'] ?? null) ? $snapshot['source_ids'] : [];
}

function cpg_agent_enforce_draft_context(array $context, string $draftId, string $role): void {
    if (($context['is_agent_context'] ?? false) !== true) {
        return;
    }

    $assignment = is_array($context['assignment'] ?? null) ? $context['assignment'] : [];
    $objectType = is_string($assignment['object_type'] ?? null) ? (string) $assignment['object_type'] : '';
    $objectId = is_string($assignment['object_id'] ?? null) ? (string) $assignment['object_id'] : '';
    $sourceIds = cpg_agent_assignment_draft_source_ids($context);
    $matches = false;

    if ($objectType === 'person_user' && $objectId === $draftId) {
        $matches = true;
    } elseif ($role === 'seafarer') {
        $matches = $objectType === 'seafarer_profile'
            && is_string($sourceIds['user_id'] ?? null)
            && (string) $sourceIds['user_id'] === $draftId;
    } else {
        $matches = in_array($objectType, ['employer_company', 'vessel', 'vacancy_request'], true)
            && (
                (is_string($sourceIds['primary_user_id'] ?? null) && (string) $sourceIds['primary_user_id'] === $draftId)
                || (is_string($sourceIds['created_by_user_id'] ?? null) && (string) $sourceIds['created_by_user_id'] === $draftId)
            );
    }

    if (!$matches) {
        api_json(403, [
            'ok' => false,
            'error' => 'agent_assignment_draft_mismatch',
            'message' => 'Agent assignment does not authorize access to this draft form context',
            'draft_id' => $draftId,
            'role' => $role,
            'assignment_id' => $context['assignment_id'] ?? null,
            'assignment_object_type' => $objectType,
            'assignment_object_id' => $objectId,
        ]);
    }
}

function cpg_questionnaire_decode_list(mixed $value): array {
    if (is_array($value)) {
        return array_values($value);
    }

    if (is_string($value) && trim($value) !== '') {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? array_values($decoded) : [];
    }

    return [];
}

function cpg_questionnaire_rank_requires_coc(mixed $rank): bool {
    if (!is_string($rank) || trim($rank) === '') {
        return false;
    }

    $normalized = strtolower($rank);
    foreach (['master', 'captain', 'officer', 'engineer', 'eto', 'electro'] as $needle) {
        if (str_contains($normalized, $needle)) {
            return true;
        }
    }

    return false;
}

function cpg_questionnaire_first_present(mixed ...$values): mixed {
    foreach ($values as $value) {
        if (cpg_questionnaire_value_present($value)) {
            return $value;
        }
    }

    return null;
}

function cpg_questionnaire_seafarer_completeness(string $userId, array $userRow): array {
    $profileResult = api_query(
        'SELECT first_name,
                primary_rank,
                department,
                availability_status,
                availability_date,
                nationality_code,
                residence_country_code,
                preferred_vessel_types,
                salary_expectation_usd,
                contact_phone,
                contact_email,
                review_status,
                document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    $profile = pg_fetch_assoc($profileResult) ?: [];
    $metadata = cpg_decode_json_object(is_string($profile['document_metadata'] ?? null) ? (string) $profile['document_metadata'] : null);
    $sourceWorkspace = isset($metadata['seafarer_workspace']) && is_array($metadata['seafarer_workspace'])
        ? $metadata['seafarer_workspace']
        : [];
    $qualification = array_merge(
        cpg_workspace_section($sourceWorkspace, 'qualifications'),
        cpg_workspace_section($sourceWorkspace, 'qualification_details')
    );
    $identity = cpg_workspace_section($sourceWorkspace, 'identity_documents');
    $publication = cpg_workspace_section($sourceWorkspace, 'matching_publication');
    $consent = cpg_workspace_section($sourceWorkspace, 'consent_details');
    $workspace = cpg_read_seafarer_workspace_summary($userId);
    $matchingPreferences = is_array($workspace['matching_preferences'] ?? null) ? $workspace['matching_preferences'] : [];
    $certificates = is_array($workspace['certificates'] ?? null) ? $workspace['certificates'] : [];
    $primaryCertificate = is_array($certificates[0] ?? null) ? $certificates[0] : [];
    $medicalDeclarations = is_array($workspace['medical_declarations'] ?? null) ? $workspace['medical_declarations'] : [];
    $primaryMedical = is_array($medicalDeclarations[0] ?? null) ? $medicalDeclarations[0] : [];
    $dataProcessing = cpg_questionnaire_first_present(
        $matchingPreferences['data_processing_confirmation'] ?? null,
        $publication['data_processing_confirmation'] ?? null,
        $consent['data_processing_confirmation'] ?? null
    );
    $structuredConsentFields = [
        'agreement_confirmed',
        'personal_data_consent',
        'no_fee_acknowledged',
        'optional_services_acknowledged',
        'data_accuracy_confirmed',
        'complaint_policy_acknowledged',
    ];
    $hasStructuredConsent = false;
    $structuredConsentComplete = true;
    foreach ($structuredConsentFields as $field) {
        if (array_key_exists($field, $consent)) {
            $hasStructuredConsent = true;
        }
        if (($consent[$field] ?? false) !== true) {
            $structuredConsentComplete = false;
        }
    }
    $finalConsentReady = $dataProcessing === 'i_confirm' && (!$hasStructuredConsent || $structuredConsentComplete);

    $availabilityStatus = $profile['availability_status'] ?? null;
    $rank = $profile['primary_rank'] ?? null;

    return cpg_questionnaire_completeness_result([
        'object_type' => 'seafarer_profile',
        'object_id' => $userId,
        'role' => 'seafarer',
        'streams' => ['S'],
        'field_values' => [
            'S-1.1' => cpg_questionnaire_first_present($profile['first_name'] ?? null, $userRow['display_name'] ?? null),
            'S-1.2' => $userRow['email'] ?? null,
            'S-1.3' => cpg_questionnaire_first_present($profile['contact_phone'] ?? null),
            'S-1.4' => $rank,
            'S-1.5' => $profile['department'] ?? null,
            'S-1.6' => ($availabilityStatus !== 'unknown') ? $availabilityStatus : null,
            'S-1.7' => $profile['availability_date'] ?? null,
            'S-1.8' => $profile['nationality_code'] ?? null,
            'S-1.9' => $profile['residence_country_code'] ?? null,
            'S-1.10' => $profile['salary_expectation_usd'] ?? null,
            'S-1.11' => cpg_questionnaire_decode_list($profile['preferred_vessel_types'] ?? null),
            'S-6.1' => cpg_questionnaire_first_present($metadata['passport_expiry'] ?? null, $identity['foreign_passport_expiry'] ?? null),
            'S-7.1' => cpg_questionnaire_first_present($qualification['coc_type'] ?? null, $primaryCertificate['certificate_type_label'] ?? null),
            'S-7.2' => cpg_questionnaire_first_present($qualification['coc_issuing_country'] ?? null, $primaryCertificate['issuing_country_code'] ?? null),
            'S-7.3' => cpg_questionnaire_first_present($qualification['coc_expiry'] ?? null, $primaryCertificate['expires_at'] ?? null),
            'S-10.1' => cpg_questionnaire_first_present($metadata['medical_expiry'] ?? null, $primaryMedical['medical_certificate_expires_at'] ?? null),
            'S-11.1' => $finalConsentReady ? $dataProcessing : null,
        ],
        'documents' => cpg_document_read_documents($userId, 'seafarer'),
        'conditions' => [
            'availability_status_is_available_later' => $availabilityStatus === 'available_later',
            'rank_or_request_requires_coc' => cpg_questionnaire_rank_requires_coc($rank),
            'rank_vessel_or_request_requires_training' => false,
            'request_requires_education' => false,
            'request_requires_language_after_field_is_implemented' => false,
            'request_requires_sea_service' => false,
        ],
        'unresolved_corrections' => cpg_questionnaire_unresolved_source_card_corrections($userId, $metadata),
    ]);
}

function cpg_questionnaire_unresolved_source_card_corrections(string $userId, array $metadata): array {
    $states = cpg_seafarer_workspace_card_review_states(cpg_workspace_json($metadata));
    $corrections = [];
    foreach ($states as $cardCode => $state) {
        if (($state['review_status'] ?? null) !== 'correction_requested') {
            continue;
        }
        $corrections[] = [
            'type' => 'source_card_correction',
            'card_code' => $cardCode,
            'card_name' => $state['card_name'] ?? cpg_seafarer_review_card_name((string) $cardCode),
            'review_note' => $state['review_note'] ?? null,
            'target_url' => '/create-profile/?draft_id=' . rawurlencode($userId) . '#profile-section-documents',
        ];
    }
    return $corrections;
}

function cpg_questionnaire_demand_completeness(string $userId, string $role, array $userRow): array {
    $company = read_primary_company_for_user($userId) ?? [];
    $companyId = is_string($company['company_id'] ?? null) ? (string) $company['company_id'] : null;
    $vessel = $companyId !== null ? (read_latest_vessel_for_company($companyId) ?? []) : [];
    $vacancy = $companyId !== null ? (read_latest_vacancy_for_company($companyId, $userId) ?? []) : [];
    $roleInCompany = $company['role_in_company'] ?? null;
    $vesselType = cpg_questionnaire_first_present(
        $vacancy['vessel_type_label'] ?? null,
        $vacancy['vessel_type'] ?? null,
        $vessel['vessel_type_label'] ?? null,
        $vessel['vessel_type'] ?? null
    );

    return cpg_questionnaire_completeness_result([
        'object_type' => 'demand_questionnaire',
        'object_id' => $userId,
        'role' => $role,
        'streams' => ['E', 'V', 'R'],
        'field_values' => [
            'E-1.1' => $userRow['email'] ?? null,
            'E-1.2' => $userRow['display_name'] ?? null,
            'E-1.3' => $role,
            'E-2.1' => $company['company_name'] ?? null,
            'E-2.2' => $company['country_code'] ?? null,
            'E-2.3' => $company['registration_number'] ?? null,
            'E-3.1' => $roleInCompany,
            'V-1.1' => $vessel['vessel_name'] ?? null,
            'V-1.2' => $vessel['imo_number'] ?? null,
            'V-2.1' => cpg_questionnaire_first_present($vesselType, $vessel['vessel_type_label'] ?? null, $vessel['vessel_type'] ?? null),
            'V-2.2' => $vessel['flag_country_code'] ?? null,
            'R-1.1' => cpg_questionnaire_first_present($vacancy['required_rank_label'] ?? null, $vacancy['rank'] ?? null, $vacancy['vacancy_title'] ?? null),
            'R-1.2' => $vacancy['department'] ?? null,
            'R-2.1' => $vesselType,
            'R-3.1' => $vacancy['join_date'] ?? null,
            'R-4.1' => cpg_questionnaire_first_present(
                $vacancy['contract_duration'] ?? null,
                cpg_questionnaire_value_present($vacancy['contract_duration_value'] ?? null)
                    && cpg_questionnaire_value_present($vacancy['contract_duration_unit'] ?? null)
                    ? [$vacancy['contract_duration_value'], $vacancy['contract_duration_unit']]
                    : null
            ),
            'R-4.2' => $vacancy['salary_min_usd'] ?? null,
            'R-4.3' => $vacancy['salary_max_usd'] ?? null,
            'R-4.4' => $vacancy['currency'] ?? null,
        ],
        'documents' => cpg_document_read_documents($userId),
        'conditions' => [
            'representative_is_not_recorded_owner' => $roleInCompany !== 'owner',
            'exact_vessel_is_known' => cpg_questionnaire_value_present($vessel['vessel_name'] ?? null)
                || cpg_questionnaire_value_present($vessel['imo_number'] ?? null),
            'exact_vessel_is_known_or_flag_constraint_is_used' => cpg_questionnaire_value_present($vessel['vessel_name'] ?? null)
                || cpg_questionnaire_value_present($vessel['imo_number'] ?? null)
                || cpg_questionnaire_value_present($vessel['flag_country_code'] ?? null),
            'authority_or_commercial_policy_requires_request_brief' => false,
            'rank_or_request_requires_coc' => cpg_questionnaire_rank_requires_coc($vacancy['rank'] ?? $vacancy['required_rank_label'] ?? null),
            'request_requires_education' => false,
            'rank_vessel_or_request_requires_training' => false,
            'request_requires_sea_service' => false,
            'request_requires_visa_after_field_is_implemented' => false,
            'request_requires_language_after_field_is_implemented' => false,
        ],
        'unresolved_corrections' => [],
    ]);
}

function cpg_registration_draft_completeness(string $draftId, ?string $preferredRole = null): array {
    $userResult = api_query(
        'SELECT user_id,
                email,
                display_name,
                registration_status,
                created_at,
                updated_at
         FROM crewportglobal.users
         WHERE user_id = $1
         LIMIT 1',
        [$draftId]
    );
    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    $role = resolve_registration_draft_role($draftId, $preferredRole);
    if ($role === null) {
        api_error(500, 'role_missing', 'User role mapping is missing');
    }

    $completeness = $role === 'seafarer'
        ? cpg_questionnaire_seafarer_completeness($draftId, $userRow)
        : cpg_questionnaire_demand_completeness($draftId, $role, $userRow);

    return [
        'ok' => true,
        'draft_id' => $draftId,
        'role' => $role,
        'status' => $userRow['registration_status'] ?? null,
        'completeness' => $completeness,
        'side_effects' => [
            'created_operator_task' => false,
            'changed_review_status' => false,
            'changed_publication_status' => false,
            'changed_document_status' => false,
        ],
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_draft_completeness(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }
    $agentContext = cpg_agent_form_request_context();

    $roleParam = $_GET['role'] ?? null;
    $preferredRole = null;
    if ($roleParam !== null) {
        $preferredRole = api_normalize_role($roleParam);
        if ($preferredRole === null) {
            api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
        }
    }

    $role = resolve_registration_draft_role($uuid, $preferredRole);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }
    cpg_agent_enforce_draft_context($agentContext, $uuid, $role);

    api_json(200, cpg_agent_context_attach_response(cpg_registration_draft_completeness($uuid, $role), $agentContext));
}

function cpg_draft_submit_review_blocked_payload(string $draftId, ?string $preferredRole = null): array {
    $result = cpg_registration_draft_completeness($draftId, $preferredRole);
    $result['ok'] = false;
    $result['error'] = 'submit_review_gate_blocked';
    $result['message'] = 'Questionnaire cannot be submitted for operator review until required fields, documents and corrections are complete';
    $result['submit_review_gate'] = [
        'gate_status' => 'blocked',
        'blocker_codes' => array_values(array_unique(array_map(
            static fn(array $item): string => is_string($item['blocker_code'] ?? null) ? (string) $item['blocker_code'] : 'unknown_blocker',
            is_array($result['completeness']['missing_items'] ?? null) ? $result['completeness']['missing_items'] : []
        ))),
        'missing_item_count' => (int) ($result['completeness']['counts']['missing_items'] ?? 0),
        'unresolved_correction_count' => (int) ($result['completeness']['counts']['unresolved_corrections'] ?? 0),
    ];
    $result['side_effects'] = [
        'created_operator_task' => false,
        'changed_review_status' => false,
        'changed_publication_status' => false,
        'changed_company_verification_status' => false,
        'changed_document_status' => false,
    ];
    return $result;
}

function handle_post_draft_submit_review(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $agentContext = cpg_agent_form_request_context($body);
    $requestedRole = array_key_exists('role', $body) ? api_normalize_role($body['role']) : null;
    if (array_key_exists('role', $body) && $requestedRole === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }

    $preflight = cpg_registration_draft_completeness($uuid, $requestedRole);
    $role = is_string($preflight['role'] ?? null) ? (string) $preflight['role'] : '';
    cpg_agent_enforce_draft_context($agentContext, $uuid, $role);
    $completeness = is_array($preflight['completeness'] ?? null) ? $preflight['completeness'] : [];
    if (($completeness['can_submit_to_operator'] ?? false) !== true) {
        api_json(409, cpg_draft_submit_review_blocked_payload($uuid, $requestedRole));
    }

    api_tx_begin();
    try {
        api_query(
            "UPDATE crewportglobal.users
             SET registration_status = 'submitted_for_human_review',
                 updated_at = now()
             WHERE user_id = $1",
            [$uuid]
        );

        $sideEffects = [
            'created_operator_task' => false,
            'computed_operator_task_ready' => true,
            'changed_review_status' => false,
            'changed_publication_status' => false,
            'changed_company_verification_status' => false,
            'changed_document_status' => false,
        ];
        $companyId = null;
        $vesselId = null;
        $vacancyRequestId = null;
        $previousStatuses = [];
        $newStatuses = [];
        $queueTypes = [];

        if ($role === 'seafarer') {
            $current = cpg_fetch_one_assoc(
                'SELECT review_status
                 FROM crewportglobal.seafarer_profiles
                 WHERE user_id = $1
                 LIMIT 1',
                [$uuid]
            );
            if ($current === null) {
                api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
            }
            $previousStatus = (string) ($current['review_status'] ?? '');
            api_query(
                "UPDATE crewportglobal.seafarer_profiles
                 SET review_status = 'submitted_for_human_review',
                     updated_at = now()
                 WHERE user_id = $1",
                [$uuid]
            );
            $previousStatuses['seafarer_profile'] = $previousStatus;
            $newStatuses['seafarer_profile'] = 'submitted_for_human_review';
            $sideEffects['changed_review_status'] = $previousStatus !== 'submitted_for_human_review';
            $queueTypes[] = 'seafarer_profile';
        } else {
            $company = read_primary_company_for_user($uuid);
            if ($company === null || !is_string($company['company_id'] ?? null)) {
                api_error(404, 'company_not_found', 'Company context not found');
            }
            $companyId = (string) $company['company_id'];
            $previousCompanyStatus = (string) ($company['verification_status'] ?? '');
            $newCompanyStatus = $previousCompanyStatus === 'verified' ? 'verified' : 'submitted';
            api_query(
                'UPDATE crewportglobal.employer_companies
                 SET verification_status = $2,
                     updated_at = now()
                 WHERE company_id = $1',
                [$companyId, $newCompanyStatus]
            );
            $previousStatuses['company_verification'] = $previousCompanyStatus;
            $newStatuses['company_verification'] = $newCompanyStatus;
            $sideEffects['changed_company_verification_status'] = $previousCompanyStatus !== $newCompanyStatus;
            if ($newCompanyStatus === 'submitted') {
                $queueTypes[] = 'company_verification';
            }

            $vacancy = read_latest_vacancy_for_company($companyId, $uuid);
            if ($vacancy === null || !is_string($vacancy['vacancy_request_id'] ?? null)) {
                api_error(404, 'vacancy_request_not_found', 'Crew request context not found');
            }
            $vacancyRequestId = (string) $vacancy['vacancy_request_id'];
            $vesselId = is_string($vacancy['vessel_id'] ?? null) && (string) $vacancy['vessel_id'] !== ''
                ? (string) $vacancy['vessel_id']
                : null;
            $previousVacancyStatus = (string) ($vacancy['publication_status'] ?? '');
            $newVacancyStatus = $previousVacancyStatus === 'published' ? 'published' : 'submitted_for_human_review';
            api_query(
                'UPDATE crewportglobal.vacancy_requests
                 SET publication_status = $2,
                     updated_at = now()
                 WHERE vacancy_request_id = $1',
                [$vacancyRequestId, $newVacancyStatus]
            );
            $previousStatuses['vacancy_request'] = $previousVacancyStatus;
            $newStatuses['vacancy_request'] = $newVacancyStatus;
            $sideEffects['changed_publication_status'] = $previousVacancyStatus !== $newVacancyStatus;
            if ($newVacancyStatus === 'submitted_for_human_review') {
                $queueTypes[] = 'vacancy_request';
            }
        }

        write_audit_event('registration_draft_submitted_for_operator_review', $uuid, $companyId, $vesselId, [
            'role' => $role,
            'submit_review_gate' => [
                'gate_status' => 'passed',
                'schema_version' => $completeness['schema_version'] ?? null,
                'overall_status' => $completeness['overall_status'] ?? null,
                'missing_item_count' => (int) ($completeness['counts']['missing_items'] ?? 0),
                'required_field_count' => (int) ($completeness['counts']['required_fields'] ?? 0),
                'required_document_count' => (int) ($completeness['counts']['required_documents'] ?? 0),
                'unresolved_correction_count' => (int) ($completeness['counts']['unresolved_corrections'] ?? 0),
            ],
            'previous_statuses' => $previousStatuses,
            'new_statuses' => $newStatuses,
            'computed_queue_types' => $queueTypes,
            'vacancy_request_id' => $vacancyRequestId,
            'agent_context' => cpg_agent_context_public_payload($agentContext),
        ], 'registration_submit_review_gate');

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'submit_review_failed', $error->getMessage());
    }

    $freshCompleteness = cpg_registration_draft_completeness($uuid, $role);
    $response = build_draft_response($uuid, 'owner_full', $role);
    $response['completeness'] = $freshCompleteness['completeness'] ?? null;
    $response['submit_review_gate'] = [
        'gate_status' => 'passed',
        'submitted_for_operator_review' => true,
    ];
    $response['side_effects'] = $sideEffects;
    $response = cpg_agent_context_attach_response($response, $agentContext);
    api_json(200, $response);
}

function write_audit_event(
    string $eventType,
    string $userId,
    ?string $companyId,
    ?string $vesselId,
    array $eventPayload,
    string $source = 'registration_api'
): void {
    $json = json_encode($eventPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = '{}';
    }

    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

    api_query(
        'INSERT INTO crewportglobal.registration_audit_events (
            event_type, user_id, company_id, vessel_id, actor_user_id, source, event_payload, ip_address, user_agent
         ) VALUES ($1, $2, $3, $4, $2, $5, $6::jsonb, $7::inet, $8)',
        [$eventType, $userId, $companyId, $vesselId, $source, $json, $ipAddress, $userAgent]
    );
}

function upsert_user_and_role(array $body): array {
    $role = api_normalize_role($body['role'] ?? null);
    if ($role === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }

    $email = api_normalize_email($body['email'] ?? null);
    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }

    $displayName = isset($body['full_name']) && is_string($body['full_name'])
        ? trim($body['full_name'])
        : null;
    if ($displayName === '') {
        $displayName = null;
    }

    $userResult = api_query(
        'INSERT INTO crewportglobal.users (email, display_name, registration_status)
         VALUES ($1, $2, $3)
         ON CONFLICT ((lower(email)))
         DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, crewportglobal.users.display_name),
           registration_status = $3,
           updated_at = now()
         RETURNING user_id',
        [$email, $displayName, 'draft']
    );

    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(500, 'user_upsert_failed', 'Unable to create or update user');
    }

    $userId = (string) $userRow['user_id'];

    api_query(
        'INSERT INTO crewportglobal.user_roles (user_id, role, source)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, role)
         DO NOTHING',
        [$userId, $role, 'registration_api']
    );

    return [$userId, $role, $email];
}

function upsert_seafarer_profile(string $userId, array $body, string $email): void {
    $firstName = isset($body['full_name']) && is_string($body['full_name']) ? trim($body['full_name']) : null;
    if ($firstName === '') {
        $firstName = null;
    }

    $availability = null;
    if (isset($body['availability_status']) && is_string($body['availability_status'])) {
        $availability = trim($body['availability_status']);
        if (!in_array($availability, ['unknown', 'available_now', 'available_later'], true)) {
            $availability = null;
        }
    }

    $countryCode = isset($body['country_code']) && is_string($body['country_code'])
        ? strtoupper(trim($body['country_code']))
        : null;
    if ($countryCode !== null && !preg_match('/^[A-Z]{2}$/', $countryCode)) {
        $countryCode = null;
    }

    $rank = isset($body['rank']) && is_string($body['rank']) ? trim($body['rank']) : null;
    if ($rank === '') {
        $rank = null;
    }

    $department = isset($body['department']) && is_string($body['department']) ? trim($body['department']) : null;
    if ($department === '') {
        $department = null;
    }

    $nationalityCode = isset($body['nationality_code']) && is_string($body['nationality_code'])
        ? strtoupper(trim($body['nationality_code']))
        : null;
    if ($nationalityCode !== null && !preg_match('/^[A-Z]{2}$/', $nationalityCode)) {
        $nationalityCode = null;
    }

    $residenceCountryCode = isset($body['residence_country_code']) && is_string($body['residence_country_code'])
        ? strtoupper(trim($body['residence_country_code']))
        : null;
    if ($residenceCountryCode !== null && !preg_match('/^[A-Z]{2}$/', $residenceCountryCode)) {
        $residenceCountryCode = null;
    }

    $availabilityDate = isset($body['availability_date']) && is_string($body['availability_date'])
        ? trim($body['availability_date'])
        : null;
    if ($availabilityDate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $availabilityDate)) {
        $availabilityDate = null;
    }

    $salaryExpectationUsd = null;
    if (isset($body['salary_expectation_usd'])) {
        if (is_numeric($body['salary_expectation_usd'])) {
            $salaryExpectationUsd = (float) $body['salary_expectation_usd'];
            if ($salaryExpectationUsd < 0) {
                $salaryExpectationUsd = null;
            }
        }
    }

    $contactPhone = isset($body['contact_phone']) && is_string($body['contact_phone']) ? trim($body['contact_phone']) : null;
    if ($contactPhone === '') {
        $contactPhone = null;
    }

    $preferredVesselTypes = [];
    if (isset($body['preferred_vessel_types']) && is_array($body['preferred_vessel_types'])) {
        foreach ($body['preferred_vessel_types'] as $item) {
            if (is_string($item)) {
                $clean = trim($item);
                if ($clean !== '') {
                    $preferredVesselTypes[] = $clean;
                }
            }
        }
    }
    $preferredVesselTypes = array_values(array_unique($preferredVesselTypes));
    $preferredVesselTypesJson = json_encode($preferredVesselTypes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($preferredVesselTypesJson === false) {
        $preferredVesselTypesJson = '[]';
    }

    $documentMetadataJson = normalize_seafarer_document_metadata($body);

    api_query(
        'INSERT INTO crewportglobal.seafarer_profiles (
           user_id,
           first_name,
           primary_rank,
           department,
           availability_status,
           country_code,
           nationality_code,
           residence_country_code,
           availability_date,
           preferred_vessel_types,
           salary_expectation_usd,
           contact_phone,
           contact_email,
           document_metadata,
           review_status
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           COALESCE($5, \'unknown\'),
           $6,
           $7,
           $8,
           $9::date,
           $10::jsonb,
           $11,
           $12,
           $13,
           COALESCE($14::jsonb, \'{}\'::jsonb),
           $15
         )
         ON CONFLICT (user_id)
         DO UPDATE SET
           first_name = COALESCE(EXCLUDED.first_name, crewportglobal.seafarer_profiles.first_name),
           primary_rank = COALESCE(EXCLUDED.primary_rank, crewportglobal.seafarer_profiles.primary_rank),
           department = COALESCE(EXCLUDED.department, crewportglobal.seafarer_profiles.department),
           availability_status = COALESCE($5, crewportglobal.seafarer_profiles.availability_status),
           country_code = COALESCE(EXCLUDED.country_code, crewportglobal.seafarer_profiles.country_code),
           nationality_code = COALESCE(EXCLUDED.nationality_code, crewportglobal.seafarer_profiles.nationality_code),
           residence_country_code = COALESCE(EXCLUDED.residence_country_code, crewportglobal.seafarer_profiles.residence_country_code),
           availability_date = COALESCE(EXCLUDED.availability_date, crewportglobal.seafarer_profiles.availability_date),
           preferred_vessel_types = CASE
               WHEN jsonb_array_length(EXCLUDED.preferred_vessel_types) = 0 THEN crewportglobal.seafarer_profiles.preferred_vessel_types
               ELSE EXCLUDED.preferred_vessel_types
           END,
           salary_expectation_usd = COALESCE(EXCLUDED.salary_expectation_usd, crewportglobal.seafarer_profiles.salary_expectation_usd),
           contact_phone = COALESCE(EXCLUDED.contact_phone, crewportglobal.seafarer_profiles.contact_phone),
           contact_email = COALESCE(EXCLUDED.contact_email, crewportglobal.seafarer_profiles.contact_email),
           document_metadata = COALESCE($14::jsonb, crewportglobal.seafarer_profiles.document_metadata),
           review_status = CASE
               WHEN crewportglobal.seafarer_profiles.review_status IN (\'submitted_for_human_review\', \'in_review\', \'approved\') THEN crewportglobal.seafarer_profiles.review_status
               ELSE EXCLUDED.review_status
           END,
           updated_at = now()',
        [
            $userId,
            $firstName,
            $rank,
            $department,
            $availability,
            $countryCode,
            $nationalityCode,
            $residenceCountryCode,
            $availabilityDate,
            $preferredVesselTypesJson,
            $salaryExpectationUsd,
            $contactPhone,
            $email,
            $documentMetadataJson,
            'draft',
        ]
    );

    cpg_sync_seafarer_workspace_from_metadata($userId, $documentMetadataJson, [
        'department' => $department,
        'nationality_code' => $nationalityCode,
        'residence_country_code' => $residenceCountryCode,
        'availability_status' => $availability ?? 'unknown',
        'availability_date' => $availabilityDate,
        'preferred_vessel_types' => $preferredVesselTypes,
        'salary_expectation_usd' => $salaryExpectationUsd,
    ]);
}

function upsert_company_context(string $userId, string $role, array $body): array {
    $companyName = isset($body['company_name']) && is_string($body['company_name'])
        ? trim($body['company_name'])
        : null;
    if ($companyName === null || $companyName === '') {
        $companyName = 'Registration Draft Company';
    }

    $countryCode = isset($body['country_code']) && is_string($body['country_code'])
        ? strtoupper(trim($body['country_code']))
        : null;
    if ($countryCode !== null && !preg_match('/^[A-Z]{2}$/', $countryCode)) {
        $countryCode = null;
    }

    $registrationNumber = isset($body['registration_number']) && is_string($body['registration_number'])
        ? trim($body['registration_number'])
        : null;
    if ($registrationNumber === '') {
        $registrationNumber = null;
    }

    $roleInCompany = normalize_role_in_company($body['role_in_company'] ?? null);

    $existingCompany = read_primary_company_for_user($userId);
    $companyId = null;

    if ($existingCompany !== null) {
        $companyId = (string) $existingCompany['company_id'];
        api_query(
            "UPDATE crewportglobal.employer_companies
             SET company_name = $2,
                 registration_number = COALESCE($3, registration_number),
                 country_code = COALESCE($4, country_code),
                 company_type = CASE WHEN $5 = 'shipowner' THEN 'shipowner'
                                     WHEN $5 = 'crewing_manager' THEN 'crewing_manager'
                                     ELSE 'employer' END,
                 verification_status = CASE
                   WHEN verification_status = 'rejected' THEN 'draft'
                   ELSE verification_status
                 END,
                 updated_at = now()
             WHERE company_id = $1",
            [$companyId, $companyName, $registrationNumber, $countryCode, $role]
        );

        api_query(
            'UPDATE crewportglobal.company_users
             SET role_in_company = $3
             WHERE company_id = $1 AND user_id = $2',
            [$companyId, $userId, $roleInCompany]
        );
    } else {
        $insertResult = api_query(
            "INSERT INTO crewportglobal.employer_companies (
               company_name, registration_number, country_code, company_type, verification_status, created_by_user_id
             ) VALUES (
               $1,
               $2,
               $3,
               CASE WHEN $4 = 'shipowner' THEN 'shipowner'
                    WHEN $4 = 'crewing_manager' THEN 'crewing_manager'
                    ELSE 'employer' END,
               $5,
               $6
             )
             RETURNING company_id",
            [$companyName, $registrationNumber, $countryCode, $role, 'draft', $userId]
        );
        $insertRow = pg_fetch_assoc($insertResult);
        if (!is_array($insertRow)) {
            api_error(500, 'company_upsert_failed', 'Unable to create company draft context');
        }
        $companyId = (string) $insertRow['company_id'];

        api_query(
            'INSERT INTO crewportglobal.company_users (company_id, user_id, role_in_company, is_primary_contact)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (company_id, user_id)
             DO UPDATE SET role_in_company = EXCLUDED.role_in_company',
            [$companyId, $userId, $roleInCompany]
        );
    }

    $vesselBody = $body['vessel'] ?? null;
    $vesselId = null;
    if (is_array($vesselBody)) {
        $vesselName = isset($vesselBody['vessel_name']) && is_string($vesselBody['vessel_name'])
            ? trim($vesselBody['vessel_name'])
            : null;
        $vesselType = isset($vesselBody['vessel_type']) && is_string($vesselBody['vessel_type'])
            ? trim($vesselBody['vessel_type'])
            : null;
        $vesselTypeValueId = cpg_workspace_reference_value_id('vessel_types', $vesselType);
        $flagCountryCode = normalize_country_code($vesselBody['flag_country_code'] ?? $vesselBody['flag_country'] ?? null);
        $imo = isset($vesselBody['imo_number']) && is_string($vesselBody['imo_number'])
            ? trim($vesselBody['imo_number'])
            : null;
        if ($imo !== null) {
            // Accept both "IMO1234567" and "1234567" input forms.
            $imo = strtoupper($imo);
            $imo = preg_replace('/^IMO\s*/', '', $imo);
            $imo = preg_replace('/\D+/', '', $imo ?? '');
            if (!preg_match('/^\d{7}$/', $imo ?? '')) {
                $imo = null;
            }
        }

        if ($vesselName !== null && $vesselName !== '') {
            $vesselInsert = api_query(
                'INSERT INTO crewportglobal.vessels (
                   company_id,
                   vessel_name,
                   vessel_type,
                   vessel_type_value_id,
                   vessel_type_label,
                   flag_country_code,
                   imo_number
                 )
                 VALUES ($1, $2, $3, $4::uuid, $5, $6, $7)
                 ON CONFLICT (imo_number)
                 WHERE imo_number IS NOT NULL
                 DO UPDATE SET
                   company_id = EXCLUDED.company_id,
                   vessel_name = EXCLUDED.vessel_name,
                   vessel_type = EXCLUDED.vessel_type,
                   vessel_type_value_id = EXCLUDED.vessel_type_value_id,
                   vessel_type_label = EXCLUDED.vessel_type_label,
                   flag_country_code = EXCLUDED.flag_country_code,
                   updated_at = now()
                 RETURNING vessel_id',
                [$companyId, $vesselName, $vesselType, $vesselTypeValueId, $vesselType, $flagCountryCode, $imo]
            );
            $vesselRow = pg_fetch_assoc($vesselInsert);
            if (is_array($vesselRow)) {
                $vesselId = (string) $vesselRow['vessel_id'];
            }
        }
    }

    return [$companyId, $vesselId];
}

function handle_create_draft(): void {
    $body = api_decode_json_body();
    $agentContext = cpg_agent_form_request_context($body);
    if (($agentContext['is_agent_context'] ?? false) === true) {
        api_json(403, [
            'ok' => false,
            'error' => 'agent_existing_assignment_draft_required',
            'message' => 'Agent form creation must start from an approved represented-object assignment, not an unscoped new draft',
            'agent_context' => cpg_agent_context_public_payload($agentContext),
        ]);
    }
    api_tx_begin();

    try {
        [$userId, $role, $email] = upsert_user_and_role($body);

        $companyId = null;
        $vesselId = null;
        $vacancyRequestId = null;

        if ($role === 'seafarer') {
            upsert_seafarer_profile($userId, $body, $email);
        } else {
            [$companyId, $vesselId] = upsert_company_context($userId, $role, $body);
            $vacancyRequestId = upsert_vacancy_request($userId, $companyId, $vesselId, $body);
        }

        write_audit_event('registration_draft_created', $userId, $companyId, $vesselId, [
            'role' => $role,
            'email' => $email,
            'vacancy_request_id' => $vacancyRequestId,
        ]);

        api_tx_commit();
        api_json(201, build_draft_response($userId));
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'draft_create_failed', $error->getMessage());
    }
}

function handle_get_draft(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }
    $agentContext = cpg_agent_form_request_context();

    $visibilityScope = cpg_normalize_visibility_scope($_GET['visibility'] ?? null, 'owner_full');
    if ($visibilityScope !== 'owner_full') {
        require_operator_or_team_queue_access();
    }

    $roleParam = $_GET['role'] ?? null;
    $preferredRole = null;
    if ($roleParam !== null) {
        $preferredRole = api_normalize_role($roleParam);
        if ($preferredRole === null) {
            api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
        }
    }

    $role = resolve_registration_draft_role($uuid, $preferredRole);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }
    cpg_agent_enforce_draft_context($agentContext, $uuid, $role);

    api_json(200, cpg_agent_context_attach_response(build_draft_response($uuid, $visibilityScope, $role), $agentContext));
}

function handle_get_seafarer_workspace(): void {
    $agentContext = cpg_agent_form_request_context();
    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user();
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');
    $visibilityScope = cpg_normalize_visibility_scope($_GET['visibility'] ?? null, 'owner_full');
    if ($visibilityScope !== 'owner_full') {
        require_operator_or_team_queue_access();
    }
    $workspace = cpg_read_seafarer_workspace_summary($userId);

    api_json(200, [
        'ok' => true,
        'access_model' => $accessModel,
        'visibility_scope' => $visibilityScope,
        'draft_id' => $userId,
        'workspace' => cpg_seafarer_workspace_summary_for_scope($workspace, $visibilityScope),
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_get_seafarer_consents(): void {
    $agentContext = cpg_agent_form_request_context();
    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user();
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');
    api_json(200, [
        'ok' => true,
        'draft_id' => $userId,
        'access_model' => $accessModel,
        'consent_event_model' => cpg_seafarer_consent_event_model(),
        'consent_summary' => cpg_seafarer_consent_summary($userId),
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_post_seafarer_consent(): void {
    $body = api_decode_json_body();
    $consentType = cpg_normalize_seafarer_consent_type($body['consent_type'] ?? null);
    if ($consentType === null) {
        api_error(400, 'invalid_consent_type', 'consent_type must be one of the approved seafarer consent types');
    }
    if (($body['accepted'] ?? true) !== true) {
        api_error(400, 'consent_acceptance_required', 'accepted must be true to record a consent event');
    }

    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user($body);
    $agentContext = cpg_agent_form_request_context($body);
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');

    api_tx_begin();
    try {
        $event = cpg_write_seafarer_consent_event($userId, $consentType, $accessModel, $body);
        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_consent_event_failed', $error->getMessage());
    }

    api_json(201, [
        'ok' => true,
        'draft_id' => $userId,
        'access_model' => $accessModel,
        'consent' => $event,
        'consent_summary' => cpg_seafarer_consent_summary($userId),
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_patch_seafarer_consent_withdraw(string $consentType): void {
    $normalizedType = cpg_normalize_seafarer_consent_type($consentType);
    if ($normalizedType === null) {
        api_error(400, 'invalid_consent_type', 'consent_type must be one of the approved seafarer consent types');
    }

    $body = api_decode_json_body();
    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user($body);
    $agentContext = cpg_agent_form_request_context($body);
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');

    api_tx_begin();
    try {
        $withdrawn = cpg_withdraw_seafarer_consent($userId, $normalizedType, $accessModel, $body);
        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_consent_withdraw_failed', $error->getMessage());
    }

    api_json(200, [
        'ok' => true,
        'draft_id' => $userId,
        'access_model' => $accessModel,
        'consent_type' => $normalizedType,
        'withdrawn' => $withdrawn,
        'withdrawn_count' => count($withdrawn),
        'consent_summary' => cpg_seafarer_consent_summary($userId),
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_patch_seafarer_workspace_section(string $section): void {
    $section = trim($section);
    if (!in_array($section, cpg_seafarer_workspace_allowed_sections(), true)) {
        api_error(400, 'invalid_workspace_section', 'section must be one of personal_details, contact_and_addresses, qualifications, sea_service, matching_publication');
    }

    $body = api_decode_json_body();
    $sectionPayload = isset($body['data']) && is_array($body['data'])
        ? $body['data']
        : [];
    if ($sectionPayload === []) {
        api_error(400, 'workspace_section_data_required', 'data object is required');
    }

    $normalizedSection = cpg_normalize_seafarer_workspace_section($section, $sectionPayload);
    if ($normalizedSection === []) {
        api_error(400, 'workspace_section_data_invalid', 'data does not contain valid fields for this section');
    }

    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user($body);
    $agentContext = cpg_agent_form_request_context($body);
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');
    $context = cpg_seafarer_profile_sync_context($userId);
    $metadata = cpg_decode_json_object(is_string($context['document_metadata']) ? $context['document_metadata'] : null);
    $workspace = isset($metadata['seafarer_workspace']) && is_array($metadata['seafarer_workspace'])
        ? $metadata['seafarer_workspace']
        : [];
    $workspace[$section] = $normalizedSection;
    $metadata['seafarer_workspace'] = $workspace;
    $documentMetadataJson = cpg_workspace_json($metadata);

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.seafarer_profiles
             SET document_metadata = $2::jsonb,
                 review_status = $3,
                 updated_at = now()
             WHERE user_id = $1',
            [$userId, $documentMetadataJson, 'submitted_for_human_review']
        );

        cpg_sync_seafarer_workspace_from_metadata($userId, $documentMetadataJson, [
            'department' => $context['department'] ?? null,
            'nationality_code' => $context['nationality_code'] ?? null,
            'residence_country_code' => $context['residence_country_code'] ?? null,
            'availability_status' => $context['availability_status'] ?? 'unknown',
            'availability_date' => $context['availability_date'] ?? null,
            'preferred_vessel_types' => $context['preferred_vessel_types'] ?? [],
            'salary_expectation_usd' => $context['salary_expectation_usd'] ?? null,
        ]);

        foreach (cpg_seafarer_workspace_section_review_cards($section) as $cardCode) {
            cpg_set_seafarer_workspace_card_review_state(
                $userId,
                $cardCode,
                'pending_human_review',
                null,
                'user_resubmitted',
                'seafarer_workspace_section_updated'
            );
        }

        write_audit_event('seafarer_workspace_section_updated', $userId, null, null, [
            'section' => $section,
            'access_model' => $accessModel,
        ]);

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_workspace_section_update_failed', $error->getMessage());
    }

    api_json(200, [
        'ok' => true,
        'access_model' => $accessModel,
        'draft_id' => $userId,
        'section' => $section,
        'workspace' => cpg_read_seafarer_workspace_summary($userId),
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_patch_seafarer_document_readiness(): void {
    $body = api_decode_json_body();
    $readinessPayload = isset($body['data']) && is_array($body['data'])
        ? $body['data']
        : [];
    if ($readinessPayload === []) {
        api_error(400, 'document_readiness_data_required', 'data object is required');
    }

    $documentReadiness = cpg_normalize_seafarer_document_readiness($readinessPayload);
    if ($documentReadiness === []) {
        api_error(400, 'document_readiness_data_invalid', 'data does not contain valid document readiness fields');
    }

    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user($body);
    $agentContext = cpg_agent_form_request_context($body);
    cpg_agent_enforce_draft_context($agentContext, $userId, 'seafarer');
    $context = cpg_seafarer_profile_sync_context($userId);
    $metadata = cpg_decode_json_object(is_string($context['document_metadata']) ? $context['document_metadata'] : null);
    foreach ($documentReadiness as $key => $value) {
        $metadata[$key] = $value;
    }
    $documentMetadataJson = cpg_workspace_json($metadata);

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.seafarer_profiles
             SET document_metadata = $2::jsonb,
                 review_status = $3,
                 updated_at = now()
            WHERE user_id = $1',
            [$userId, $documentMetadataJson, 'submitted_for_human_review']
        );

        foreach (['QUAL-001', 'document_readiness'] as $cardCode) {
            cpg_set_seafarer_workspace_card_review_state(
                $userId,
                $cardCode,
                'pending_human_review',
                null,
                'user_resubmitted',
                'seafarer_document_readiness_updated'
            );
        }

        write_audit_event('seafarer_document_readiness_updated', $userId, null, null, [
            'fields' => array_keys($documentReadiness),
            'access_model' => $accessModel,
        ]);

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_document_readiness_update_failed', $error->getMessage());
    }

    api_json(200, [
        'ok' => true,
        'access_model' => $accessModel,
        'draft_id' => $userId,
        'document_metadata' => $metadata,
        'agent_context' => cpg_agent_context_public_payload($agentContext),
    ]);
}

function handle_patch_draft(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $agentContext = cpg_agent_form_request_context($body);

    $requestedRole = api_normalize_role($body['role'] ?? null);
    if (array_key_exists('role', $body) && $requestedRole === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }

    $role = resolve_registration_draft_role($uuid, $requestedRole);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    if ($requestedRole !== null && $role !== $requestedRole) {
        api_error(400, 'role_not_available_for_draft', 'requested role is not available for this registration draft');
    }
    cpg_agent_enforce_draft_context($agentContext, $uuid, $role);

    api_tx_begin();
    try {
        if (isset($body['email'])) {
            $email = api_normalize_email($body['email']);
            if ($email === null) {
                api_error(400, 'invalid_email', 'email must be valid');
            }
            api_query(
                'UPDATE crewportglobal.users
                 SET email = $2, updated_at = now()
                 WHERE user_id = $1',
                [$uuid, $email]
            );
        }

        if ($role === 'seafarer') {
            $email = isset($body['email']) ? api_normalize_email($body['email']) : null;
            if ($email === null) {
                $current = api_query('SELECT email FROM crewportglobal.users WHERE user_id = $1', [$uuid]);
                $row = pg_fetch_assoc($current);
                $email = is_array($row) ? (string) $row['email'] : '';
            }
            upsert_seafarer_profile($uuid, $body, $email);
            write_audit_event('registration_draft_updated', $uuid, null, null, ['role' => $role]);
        } else {
            [$companyId, $vesselId] = upsert_company_context($uuid, $role, $body);
            $vacancyRequestId = upsert_vacancy_request($uuid, $companyId, $vesselId, $body);
            write_audit_event('registration_draft_updated', $uuid, $companyId, $vesselId, [
                'role' => $role,
                'vacancy_request_id' => $vacancyRequestId,
            ]);
        }

        api_tx_commit();
        api_json(200, cpg_agent_context_attach_response(build_draft_response($uuid, 'owner_full', $role), $agentContext));
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'draft_update_failed', $error->getMessage());
    }
}

function read_operator_review_queue(?array $access = null): array {
    $items = [];

    if (operator_access_can_view_queue_type('seafarer_profile', $access)) {
        $seafarerResult = api_query(
            "SELECT
            sp.seafarer_profile_id AS queue_item_id,
            sp.user_id AS draft_id,
            u.email,
            u.display_name,
            sp.review_status AS queue_status,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.created_at,
            sp.updated_at
         FROM crewportglobal.seafarer_profiles sp
         JOIN crewportglobal.users u ON u.user_id = sp.user_id
         WHERE sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved', 'rejected')
         ORDER BY sp.updated_at DESC, sp.created_at DESC
         LIMIT 2000"
        );

        while (($row = pg_fetch_assoc($seafarerResult)) !== false) {
            $items[] = [
                'queue_item_id' => $row['queue_item_id'],
                'queue_type' => 'seafarer_profile',
                'draft_id' => $row['draft_id'],
                'role' => 'seafarer',
                'email' => $row['email'],
                'full_name' => $row['display_name'] ?? $row['email'],
                'status' => $row['queue_status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'summary' => [
                    'primary_rank' => $row['primary_rank'],
                    'department' => $row['department'],
                    'availability_status' => $row['availability_status'],
                    'availability_date' => $row['availability_date'],
                ],
                'operator_access' => operator_queue_access_contract('seafarer_profile', $access),
            ];
        }
    }

    if (operator_access_can_view_queue_type('company_verification', $access)) {
        $companyResult = api_query(
            "SELECT
            ec.company_id AS queue_item_id,
            cu.user_id AS draft_id,
            COALESCE(ur.role, 'employer') AS role,
            u.email,
            u.display_name,
            ec.verification_status AS queue_status,
            ec.company_name,
            ec.company_type,
            ec.country_code,
            cu.role_in_company,
            ec.created_at,
            ec.updated_at
         FROM crewportglobal.employer_companies ec
         JOIN LATERAL (
             SELECT cu.user_id, cu.role_in_company
             FROM crewportglobal.company_users cu
             WHERE cu.company_id = ec.company_id
             ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
             LIMIT 1
         ) cu ON TRUE
         JOIN crewportglobal.users u ON u.user_id = cu.user_id
         LEFT JOIN LATERAL (
             SELECT role
             FROM crewportglobal.user_roles ur
             WHERE ur.user_id = u.user_id
             ORDER BY ur.created_at ASC
             LIMIT 1
         ) ur ON TRUE
         WHERE ec.verification_status IN ('unverified', 'submitted', 'verified', 'rejected')
         ORDER BY ec.updated_at DESC, ec.created_at DESC
         LIMIT 2000"
        );

        while (($row = pg_fetch_assoc($companyResult)) !== false) {
            $items[] = [
                'queue_item_id' => $row['queue_item_id'],
                'queue_type' => 'company_verification',
                'draft_id' => $row['draft_id'],
                'role' => $row['role'],
                'email' => $row['email'],
                'full_name' => $row['display_name'] ?? $row['email'],
                'status' => $row['queue_status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'summary' => [
                    'company_name' => $row['company_name'],
                    'company_type' => $row['company_type'],
                    'country_code' => $row['country_code'],
                    'role_in_company' => $row['role_in_company'],
                ],
                'operator_access' => operator_queue_access_contract('company_verification', $access),
            ];
        }
    }

    if (operator_access_can_view_queue_type('vacancy_request', $access)) {
        $vacancyResult = api_query(
            "SELECT
            vr.vacancy_request_id AS queue_item_id,
            vr.created_by_user_id AS draft_id,
            COALESCE(ur.role, 'employer') AS role,
            u.email,
            u.display_name,
            vr.publication_status AS queue_status,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            vr.vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.currency,
            ec.company_name,
            ec.verification_status,
            v.vessel_name,
            vr.created_at,
            vr.updated_at
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN crewportglobal.users u ON u.user_id = vr.created_by_user_id
         LEFT JOIN LATERAL (
             SELECT role
             FROM crewportglobal.user_roles ur
             WHERE ur.user_id = vr.created_by_user_id
             ORDER BY ur.created_at ASC
             LIMIT 1
         ) ur ON TRUE
         WHERE vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published', 'rejected', 'closed')
           AND COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'pending_manager_confirmation'
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 2000"
        );

        while (($row = pg_fetch_assoc($vacancyResult)) !== false) {
            $items[] = [
                'queue_item_id' => $row['queue_item_id'],
                'queue_type' => 'vacancy_request',
                'draft_id' => $row['draft_id'],
                'role' => $row['role'],
                'email' => $row['email'],
                'full_name' => $row['display_name'] ?? $row['email'],
                'status' => $row['queue_status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'summary' => [
                    'vacancy_title' => $row['vacancy_title'],
                    'rank' => $row['rank'],
                    'department' => $row['department'],
                    'vessel_type' => $row['vessel_type'],
                    'join_date' => $row['join_date'],
                    'contract_duration' => $row['contract_duration'],
                    'salary_min_usd' => $row['salary_min_usd'],
                    'salary_max_usd' => $row['salary_max_usd'],
                    'currency' => $row['currency'],
                    'company_name' => $row['company_name'],
                    'company_verification_status' => $row['verification_status'],
                    'vessel_name' => $row['vessel_name'],
                ],
                'operator_access' => operator_queue_access_contract('vacancy_request', $access),
            ];
        }
    }

    if (operator_access_can_view_queue_type('vacancy_application', $access)) {
        $applicationResult = api_query(
            "SELECT
            va.vacancy_application_id AS queue_item_id,
            va.seafarer_user_id AS draft_id,
            su.email,
            su.display_name,
            va.application_status AS queue_status,
            va.contact_email,
            va.candidate_note,
            sp.primary_rank,
            sp.review_status AS candidate_review_status,
            sp.availability_status,
            vr.vacancy_request_id,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department,
            ec.company_name,
            v.vessel_name,
            CASE
              WHEN sc.shortlist_candidate_id IS NULL THEN 'seafarer_initiated_request'
              ELSE 'internal_shortlist_review_application'
            END AS request_source,
            va.created_at,
            va.updated_at
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN LATERAL (
           SELECT osc.shortlist_candidate_id
           FROM crewportglobal.operator_shortlist_candidates osc
           JOIN crewportglobal.operator_shortlist_drafts osd
             ON osd.shortlist_draft_id = osc.shortlist_draft_id
           WHERE osd.vacancy_request_id = va.vacancy_request_id
             AND osc.candidate_user_id = va.seafarer_user_id
             AND osc.operator_decision = 'include'
           ORDER BY osd.updated_at DESC, osc.updated_at DESC
           LIMIT 1
         ) sc ON TRUE
         WHERE va.application_status IN ('submitted_for_human_review', 'in_review', 'presented', 'rejected', 'withdrawn')
           AND COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') <> 'pending_manager_confirmation'
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 2000"
        );

        while (($row = pg_fetch_assoc($applicationResult)) !== false) {
            $items[] = [
                'queue_item_id' => $row['queue_item_id'],
                'queue_type' => 'vacancy_application',
                'draft_id' => $row['draft_id'],
                'role' => 'seafarer',
                'email' => $row['contact_email'] ?: $row['email'],
                'full_name' => $row['display_name'] ?? $row['email'],
                'status' => $row['queue_status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'summary' => [
                    'vacancy_title' => $row['vacancy_title'],
                    'vacancy_rank' => $row['vacancy_rank'],
                    'candidate_rank' => $row['primary_rank'],
                    'candidate_review_status' => $row['candidate_review_status'],
                    'availability_status' => $row['availability_status'],
                    'company_name' => $row['company_name'],
                    'vessel_name' => $row['vessel_name'],
                    'candidate_note' => $row['candidate_note'],
                    'request_source' => $row['request_source'],
                ],
                'operator_access' => operator_queue_access_contract('vacancy_application', $access),
            ];
        }
    }

    usort(
        $items,
        static fn(array $a, array $b): int => strcmp((string) ($b['updated_at'] ?? ''), (string) ($a['updated_at'] ?? ''))
    );

    return $items;
}

function handle_get_operator_review_queue(?array $access = null): void {
    $queue = read_operator_review_queue($access);
    api_json(200, [
        'ok' => true,
        'queue' => $queue,
        'count' => count($queue),
        'access_model' => operator_access_model($access),
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'queue_permissions' => [
            'seafarer_profile' => operator_queue_access_contract('seafarer_profile', $access),
            'company_verification' => operator_queue_access_contract('company_verification', $access),
            'vacancy_request' => operator_queue_access_contract('vacancy_request', $access),
            'vacancy_application' => operator_queue_access_contract('vacancy_application', $access),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function require_team_workbench_access(): array {
    $access = operator_named_session_access_from_request();
    if (!is_array($access)) {
        api_json(401, [
            'ok' => false,
            'error' => 'team_session_required',
            'message' => 'Team workbench requires an active named team session',
        ]);
    }

    if (!operator_access_can_view_any_operator_queue($access)
        && !operator_access_has_permission($access, 'approve_candidate_presentation')
        && !operator_access_has_permission($access, 'start_human_review')
        && !operator_access_has_permission($access, 'approve_access_policy_change')) {
        api_json(403, [
            'ok' => false,
            'error' => 'team_workbench_permission_required',
            'message' => 'Team workbench tasks require an approved operational group permission',
            'access_model' => operator_access_model($access),
            'actor_user_id' => $access['actor_user_id'] ?? null,
        ]);
    }

    return $access;
}

function require_translation_review_access(): array {
    $access = resolve_operator_or_named_session_access('translation_review_queue');
    if (!operator_access_has_permission($access, 'start_human_review')
        && !operator_access_has_permission($access, 'approve_access_policy_change')) {
        api_json(403, [
            'ok' => false,
            'error' => 'translation_review_permission_required',
            'message' => 'Translation review requires human-review or access-approval permission',
            'access_model' => operator_access_model($access),
            'actor_user_id' => $access['actor_user_id'] ?? null,
        ]);
    }

    return $access;
}

function cpg_agent_scope_tables_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $row = cpg_fetch_one_assoc(
        "SELECT count(*)::int AS table_count
         FROM information_schema.tables
         WHERE table_schema = 'crewportglobal'
           AND table_name IN (
             'agent_organizations',
             'agent_users',
             'agent_authority_documents',
             'agent_object_creation_requests',
             'agent_object_assignments',
             'account_object_claims',
             'agent_scope_audit_events'
           )",
        []
    );
    $ready = is_array($row) && (int) ($row['table_count'] ?? 0) === 7;
    return $ready;
}

function cpg_agent_require_scope_tables(): void {
    if (!cpg_agent_scope_tables_ready()) {
        api_json(503, [
            'ok' => false,
            'error' => 'agent_scope_schema_not_ready',
            'message' => 'Agent organization scope tables are not available',
        ]);
    }
}

function cpg_agent_framework_tables_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $row = cpg_fetch_one_assoc(
        "SELECT count(*)::int AS table_count
         FROM information_schema.tables
         WHERE table_schema = 'crewportglobal'
           AND table_name IN (
             'agent_framework_agreement_offers',
             'participant_notification_ledger'
           )",
        []
    );
    $ready = is_array($row) && (int) ($row['table_count'] ?? 0) === 2;
    return $ready;
}

function cpg_agent_require_framework_tables(): void {
    cpg_agent_require_scope_tables();
    if (!cpg_agent_framework_tables_ready()) {
        api_json(503, [
            'ok' => false,
            'error' => 'agent_framework_schema_not_ready',
            'message' => 'Agent framework agreement offer and notification ledger tables are not available',
        ]);
    }
}

function cpg_agent_allowed_object_types(): array {
    return ['person_user', 'seafarer_profile', 'employer_company', 'vessel', 'vacancy_request'];
}

function cpg_agent_allowed_assignment_object_types(): array {
    return [
        'person_user',
        'seafarer_profile',
        'employer_company',
        'vessel',
        'vacancy_request',
        'vacancy_application',
        'shortlist_draft',
        'shortlist_candidate',
        'contract_workspace',
        'voyage_support_record',
    ];
}

function cpg_agent_allowed_claim_types(): array {
    return [
        'person_account',
        'seafarer_profile',
        'employer_company',
        'vessel',
        'vacancy_request',
        'agent_authority',
    ];
}

function cpg_agent_allowed_claim_target_object_types(): array {
    return [
        'person_user',
        'seafarer_profile',
        'employer_company',
        'vessel',
        'vacancy_request',
        'agent_organization',
    ];
}

function cpg_agent_allowed_claim_statuses(): array {
    return [
        'submitted',
        'under_review',
        'evidence_requested',
        'approved_linked',
        'approved_new_record',
        'rejected',
        'cancelled',
        'blocked_duplicate',
        'limited_pending',
    ];
}

function cpg_agent_allowed_party_types(): array {
    return ['seafarer', 'shipowner', 'employer_company', 'vessel_owner', 'vessel_operator', 'ship_manager', 'crew_manager', 'unknown'];
}

function cpg_agent_allowed_authority_types(): array {
    return [
        'platform_service_agreement',
        'shipowner_agency_agreement',
        'vessel_authority',
        'seafarer_authorization',
        'company_registration',
        'representative_authority',
        'power_of_attorney',
        'data_processing_authority',
        'other',
    ];
}

function cpg_agent_allowed_authority_scope_types(): array {
    return ['platform', 'company', 'vessel', 'seafarer_profile', 'vacancy_request', 'contract_workspace', 'multiple', 'other'];
}

function cpg_agent_string_value(mixed $value, int $maxLength = 500): ?string {
    if (!is_string($value)) {
        return null;
    }
    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }
    return mb_strlen($trimmed) > $maxLength ? mb_substr($trimmed, 0, $maxLength) : $trimmed;
}

function cpg_agent_enum_value(mixed $value, array $allowed, string $fallback): string {
    $normalized = is_string($value) ? strtolower(trim($value)) : '';
    return in_array($normalized, $allowed, true) ? $normalized : $fallback;
}

function cpg_agent_nullable_uuid(mixed $value): ?string {
    if (!is_string($value) || trim($value) === '') {
        return null;
    }
    return api_normalize_uuid($value);
}

function cpg_agent_date_value(mixed $value): ?string {
    return normalize_date_value($value);
}

function cpg_agent_json_object_value(mixed $value): array {
    if (!is_array($value) || array_is_list($value)) {
        return [];
    }
    return $value;
}

function cpg_agent_json_object_text(array $payload): string {
    if ($payload === []) {
        return '{}';
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? '{}' : $json;
}

function cpg_agent_json_text_to_object(mixed $value): array {
    if (!is_string($value) || trim($value) === '') {
        return [];
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) && !array_is_list($decoded) ? $decoded : [];
}

function cpg_agent_notification_payload_hash(array $payload): string {
    return hash('sha256', cpg_agent_json_object_text($payload));
}

function cpg_agent_create_participant_notification(
    ?string $recipientUserId,
    ?string $recipientAgentOrganizationId,
    string $representedObjectType,
    string $representedObjectId,
    string $eventType,
    string $eventStage,
    string $safeSummary,
    string $actionType,
    array $payload,
    ?string $createdByUserId = null,
    ?string $offerId = null,
    ?string $assignmentId = null,
    ?string $agentOrganizationId = null,
    ?string $documentReferenceId = null
): ?array {
    if (!cpg_agent_framework_tables_ready()) {
        return null;
    }

    $row = cpg_fetch_one_assoc(
        "INSERT INTO crewportglobal.participant_notification_ledger (
           recipient_user_id,
           recipient_agent_organization_id,
           represented_object_type,
           represented_object_id,
           agent_framework_agreement_offer_id,
           agent_object_assignment_id,
           agent_organization_id,
           event_type,
           event_stage,
           safe_summary,
           action_type,
           delivery_status,
           document_reference_id,
           payload_hash,
           payload,
           created_by_user_id
         ) VALUES (
           $1::uuid,
           $2::uuid,
           $3,
           $4::uuid,
           $5::uuid,
           $6::uuid,
           $7::uuid,
           $8,
           $9,
           $10,
           $11,
           'recorded',
           $12::uuid,
           $13,
           $14::jsonb,
           $15::uuid
         )
         RETURNING participant_notification_id::text AS notification_id,
                   event_type,
                   event_stage,
                   safe_summary,
                   action_type,
                   delivery_status,
                   payload_hash,
                   created_at::text AS created_at",
        [
            $recipientUserId,
            $recipientAgentOrganizationId,
            $representedObjectType,
            $representedObjectId,
            $offerId,
            $assignmentId,
            $agentOrganizationId,
            $eventType,
            $eventStage,
            $safeSummary,
            $actionType,
            $documentReferenceId,
            cpg_agent_notification_payload_hash($payload),
            cpg_agent_json_object_text($payload),
            $createdByUserId,
        ]
    );

    return is_array($row) ? $row : null;
}

function cpg_agent_management_allowed_status(array $row): bool {
    $agentStatus = (string) ($row['agent_status'] ?? '');
    $organizationAuthority = (string) ($row['organization_authority_status'] ?? ($row['authority_status'] ?? ''));
    $assignmentStatus = (string) ($row['assignment_status'] ?? '');
    $authorityStatus = (string) ($row['document_authority_status'] ?? '');
    $validUntil = is_string($row['authority_valid_until'] ?? null) ? (string) $row['authority_valid_until'] : null;

    if (!in_array($agentStatus, ['verified', 'limited'], true)) {
        return false;
    }
    if (!in_array($organizationAuthority, ['verified', 'limited'], true)) {
        return false;
    }
    if (!in_array($assignmentStatus, ['active', 'limited'], true)) {
        return false;
    }
    if (!in_array($authorityStatus, ['verified', 'limited'], true)) {
        return false;
    }
    if ($validUntil !== null && $validUntil !== '' && strcmp($validUntil, gmdate('Y-m-d')) < 0) {
        return false;
    }

    return true;
}

function cpg_agent_management_blocker(array $row): ?string {
    if (cpg_agent_management_allowed_status($row)) {
        return null;
    }

    $agentStatus = (string) ($row['agent_status'] ?? '');
    if (!in_array($agentStatus, ['verified', 'limited'], true)) {
        return 'agent_organization_not_verified';
    }
    $organizationAuthority = (string) ($row['organization_authority_status'] ?? ($row['authority_status'] ?? ''));
    if (!in_array($organizationAuthority, ['verified', 'limited'], true)) {
        return 'agent_organization_authority_not_verified';
    }
    $assignmentStatus = (string) ($row['assignment_status'] ?? '');
    if (!in_array($assignmentStatus, ['active', 'limited'], true)) {
        return 'agent_object_assignment_not_active';
    }
    $authorityStatus = (string) ($row['document_authority_status'] ?? '');
    if (!in_array($authorityStatus, ['verified', 'limited'], true)) {
        return 'agent_authority_document_not_verified';
    }
    $validUntil = is_string($row['authority_valid_until'] ?? null) ? (string) $row['authority_valid_until'] : null;
    if ($validUntil !== null && $validUntil !== '' && strcmp($validUntil, gmdate('Y-m-d')) < 0) {
        return 'agent_authority_document_expired';
    }

    return 'agent_management_blocked_missing_authority';
}

function cpg_agent_management_block_from_assignment(array $row): array {
    $displayName = cpg_agent_string_value($row['agent_display_name'] ?? null, 200) ?? 'Agent organization';
    $allowed = cpg_agent_management_allowed_status($row);
    $blocker = cpg_agent_management_blocker($row);

    return [
        'managed_by_type' => 'agent_organization',
        'managed_by_id' => (string) ($row['agent_organization_id'] ?? ''),
        'managed_by_display_name' => $displayName,
        'managed_by_label' => 'Managed by: ' . $displayName,
        'managed_by_label_ru' => 'Управляется: ' . $displayName,
        'managed_by_agent' => true,
        'agent_organization_id' => (string) ($row['agent_organization_id'] ?? ''),
        'agent_display_name' => $displayName,
        'assignment_id' => is_string($row['agent_object_assignment_id'] ?? null) ? (string) $row['agent_object_assignment_id'] : null,
        'assignment_status' => is_string($row['assignment_status'] ?? null) ? (string) $row['assignment_status'] : null,
        'assigned_agent_user_id' => is_string($row['assigned_agent_user_id'] ?? null) ? (string) $row['assigned_agent_user_id'] : null,
        'authority_document_id' => is_string($row['agent_authority_document_id'] ?? null) ? (string) $row['agent_authority_document_id'] : null,
        'authority_status' => is_string($row['document_authority_status'] ?? null) ? (string) $row['document_authority_status'] : null,
        'authority_type' => is_string($row['authority_type'] ?? null) ? (string) $row['authority_type'] : null,
        'authority_valid_until' => is_string($row['authority_valid_until'] ?? null) ? (string) $row['authority_valid_until'] : null,
        'management_allowed' => $allowed,
        'management_blocker' => $blocker,
    ];
}

function cpg_object_management_context(
    string $objectType,
    string $objectId,
    ?string $selfManagedUserId = null,
    ?string $selfManagedDisplayName = null
): array {
    if (!cpg_agent_scope_tables_ready() || $objectType === '' || $objectId === '') {
        $display = $selfManagedDisplayName ?? 'Registered user';
        return [
            'managed_by_type' => 'registered_user',
            'managed_by_id' => $selfManagedUserId,
            'managed_by_display_name' => $display,
            'managed_by_label' => 'Managed by: ' . $display,
            'managed_by_label_ru' => 'Управляется: ' . $display,
            'managed_by_agent' => false,
            'agent_organization_id' => null,
            'management_allowed' => true,
            'management_blocker' => null,
        ];
    }

    $row = cpg_fetch_one_assoc(
        "SELECT aoa.agent_object_assignment_id::text AS agent_object_assignment_id,
                aoa.agent_organization_id::text AS agent_organization_id,
                aoa.assignment_status,
                aoa.assigned_agent_user_id::text AS assigned_agent_user_id,
                ao.agent_display_name,
                ao.agent_status,
                ao.authority_status AS organization_authority_status,
                aad.agent_authority_document_id::text AS agent_authority_document_id,
                aad.authority_status AS document_authority_status,
                aad.authority_type,
                aad.valid_until::text AS authority_valid_until
         FROM crewportglobal.agent_object_assignments aoa
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aoa.agent_organization_id
         LEFT JOIN crewportglobal.agent_authority_documents aad
           ON aad.agent_authority_document_id = aoa.source_authority_document_id
         WHERE aoa.object_type = $1
           AND aoa.object_id = $2::uuid
           AND aoa.assignment_status IN ('active', 'limited')
           AND aoa.visibility_scope IN ('ordinary_execution', 'limited_execution')
           AND aoa.archived_at IS NULL
         ORDER BY
           CASE WHEN aoa.assignment_status = 'active' THEN 0 ELSE 1 END,
           aoa.updated_at DESC
         LIMIT 1",
        [$objectType, $objectId]
    );

    if (is_array($row)) {
        return cpg_agent_management_block_from_assignment($row);
    }

    $display = $selfManagedDisplayName ?? 'Registered user';
    return [
        'managed_by_type' => 'registered_user',
        'managed_by_id' => $selfManagedUserId,
        'managed_by_display_name' => $display,
        'managed_by_label' => 'Managed by: ' . $display,
        'managed_by_label_ru' => 'Управляется: ' . $display,
        'managed_by_agent' => false,
        'agent_organization_id' => null,
        'management_allowed' => true,
        'management_blocker' => null,
    ];
}

function cpg_team_workbench_management_context(array $operation, array $context): array {
    if (is_array($context['management'] ?? null)) {
        return $context['management'];
    }

    $recordType = is_string($operation['record_type'] ?? null)
        ? (string) $operation['record_type']
        : (is_string($context['record_type'] ?? null) ? (string) $context['record_type'] : '');
    $recordId = is_string($operation['record_id'] ?? null)
        ? (string) $operation['record_id']
        : (is_string($context['record_id'] ?? null) ? (string) $context['record_id'] : '');
    $queueType = is_string($context['queue_type'] ?? null) ? (string) $context['queue_type'] : '';
    $queueItemId = is_string($context['queue_item_id'] ?? null) ? (string) $context['queue_item_id'] : '';

    $objectType = $recordType !== '' ? $recordType : $queueType;
    $objectId = $recordId !== '' ? $recordId : $queueItemId;
    if ($objectType === 'company_verification') {
        $objectType = 'employer_company';
    }
    if ($objectType === 'vacancy_deletion_request') {
        $objectType = 'vacancy_request';
    }
    if ($objectType === 'operator_shortlist_draft') {
        $objectType = 'shortlist_draft';
    }

    $selfId = is_string($context['draft_id'] ?? null) ? (string) $context['draft_id'] : null;
    $selfLabel = is_string($context['owner_display_name'] ?? null)
        ? (string) $context['owner_display_name']
        : (is_string($context['email'] ?? null) ? (string) $context['email'] : null);

    return cpg_object_management_context($objectType, $objectId, $selfId, $selfLabel);
}

function cpg_agent_scope_audit_event(
    string $eventType,
    ?string $actorUserId,
    ?string $agentOrganizationId,
    ?string $agentUserId,
    ?string $creationRequestId,
    ?string $assignmentId,
    ?string $targetObjectType,
    ?string $targetObjectId,
    array $previousValue,
    array $newValue,
    ?string $reason = null,
    ?string $accountObjectClaimId = null
): void {
    if (!cpg_agent_scope_tables_ready()) {
        return;
    }

    api_query(
        "INSERT INTO crewportglobal.agent_scope_audit_events (
           event_type,
           actor_user_id,
           agent_organization_id,
           agent_user_id,
           agent_object_creation_request_id,
           agent_object_assignment_id,
           account_object_claim_id,
           target_object_type,
           target_object_id,
           previous_value,
           new_value,
           reason,
           ip_address,
           user_agent
         ) VALUES (
           $1,
           $2::uuid,
           $3::uuid,
           $4::uuid,
           $5::uuid,
           $6::uuid,
           $7::uuid,
           $8,
           $9::uuid,
           $10::jsonb,
           $11::jsonb,
           $12,
           NULLIF($13, '')::inet,
           $14
         )",
        [
            $eventType,
            $actorUserId,
            $agentOrganizationId,
            $agentUserId,
            $creationRequestId,
            $assignmentId,
            $accountObjectClaimId,
            $targetObjectType,
            $targetObjectId,
            cpg_agent_json_object_text($previousValue),
            cpg_agent_json_object_text($newValue),
            $reason,
            is_string($_SERVER['REMOTE_ADDR'] ?? null) ? (string) $_SERVER['REMOTE_ADDR'] : '',
            is_string($_SERVER['HTTP_USER_AGENT'] ?? null) ? (string) $_SERVER['HTTP_USER_AGENT'] : null,
        ]
    );
}

function cpg_agent_access_from_request(): array {
    cpg_agent_require_scope_tables();
    $session = cpg_auth_find_active_session();
    if (!is_array($session) || !is_string($session['user_id'] ?? null) || $session['user_id'] === '') {
        api_json(401, [
            'ok' => false,
            'error' => 'agent_account_session_required',
            'message' => 'Agent API requires an authenticated account session',
        ]);
    }

    $userId = (string) $session['user_id'];
    $rows = cpg_fetch_all_assoc(
        "SELECT au.agent_user_id::text AS agent_user_id,
                au.agent_organization_id::text AS agent_organization_id,
                au.agent_user_role,
                au.membership_status,
                ao.agent_code,
                ao.agent_display_name,
                ao.organization_kind,
                ao.agent_status,
                ao.authority_status,
                ao.platform_service_agreement_status,
                ao.default_routing_enabled,
                ao.public_listing_allowed
         FROM crewportglobal.agent_users au
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = au.agent_organization_id
         WHERE au.user_id = $1::uuid
           AND au.membership_status = 'active'
           AND ao.archived_at IS NULL
         ORDER BY
           CASE WHEN ao.agent_status IN ('verified', 'limited') THEN 0 ELSE 1 END,
           ao.updated_at DESC",
        [$userId]
    );

    if ($rows === []) {
        api_json(403, [
            'ok' => false,
            'error' => 'agent_membership_required',
            'message' => 'The authenticated user has no active agent organization membership',
            'user_id' => $userId,
        ]);
    }

    $requestedOrganizationId = cpg_agent_nullable_uuid($_GET['agent_organization_id'] ?? null);
    $selected = $rows[0];
    if ($requestedOrganizationId !== null) {
        foreach ($rows as $row) {
            if ((string) ($row['agent_organization_id'] ?? '') === $requestedOrganizationId) {
                $selected = $row;
                break;
            }
        }
        if ((string) ($selected['agent_organization_id'] ?? '') !== $requestedOrganizationId) {
            api_json(403, [
                'ok' => false,
                'error' => 'agent_organization_scope_denied',
                'message' => 'The authenticated agent user is not active in the requested organization',
                'agent_organization_id' => $requestedOrganizationId,
            ]);
        }
    }

    $organizations = array_map(static function (array $row): array {
        $managementReady = in_array((string) ($row['agent_status'] ?? ''), ['verified', 'limited'], true)
            && in_array((string) ($row['authority_status'] ?? ''), ['verified', 'limited'], true)
            && (string) ($row['platform_service_agreement_status'] ?? '') === 'accepted';
        return [
            'agent_user_id' => (string) ($row['agent_user_id'] ?? ''),
            'agent_organization_id' => (string) ($row['agent_organization_id'] ?? ''),
            'agent_user_role' => (string) ($row['agent_user_role'] ?? ''),
            'agent_code' => (string) ($row['agent_code'] ?? ''),
            'agent_display_name' => (string) ($row['agent_display_name'] ?? ''),
            'organization_kind' => (string) ($row['organization_kind'] ?? ''),
            'agent_status' => (string) ($row['agent_status'] ?? ''),
            'authority_status' => (string) ($row['authority_status'] ?? ''),
            'platform_service_agreement_status' => (string) ($row['platform_service_agreement_status'] ?? ''),
            'management_ready' => $managementReady,
        ];
    }, $rows);

    return [
        'access_model' => 'agent_account_session',
        'actor_user_id' => $userId,
        'actor_label' => (string) ($session['email'] ?? 'agent_session'),
        'agent_user_id' => (string) ($selected['agent_user_id'] ?? ''),
        'agent_organization_id' => (string) ($selected['agent_organization_id'] ?? ''),
        'agent_display_name' => (string) ($selected['agent_display_name'] ?? ''),
        'agent_user_role' => (string) ($selected['agent_user_role'] ?? ''),
        'agent_status' => (string) ($selected['agent_status'] ?? ''),
        'authority_status' => (string) ($selected['authority_status'] ?? ''),
        'platform_service_agreement_status' => (string) ($selected['platform_service_agreement_status'] ?? ''),
        'organizations' => $organizations,
    ];
}

function handle_get_agent_me(): void {
    $access = cpg_agent_access_from_request();
    api_json(200, [
        'ok' => true,
        'access_model' => 'agent_account_session',
        'actor_user_id' => $access['actor_user_id'],
        'agent_user_id' => $access['agent_user_id'],
        'agent_organization_id' => $access['agent_organization_id'],
        'agent_display_name' => $access['agent_display_name'],
        'agent_user_role' => $access['agent_user_role'],
        'agent_status' => $access['agent_status'],
        'authority_status' => $access['authority_status'],
        'platform_service_agreement_status' => $access['platform_service_agreement_status'],
        'organizations' => $access['organizations'],
    ]);
}

function cpg_agent_assignment_rows(string $agentOrganizationId, int $limit): array {
    return cpg_fetch_all_assoc(
        "SELECT aoa.agent_object_assignment_id::text AS agent_object_assignment_id,
                aoa.object_type,
                aoa.object_id::text AS object_id,
                aoa.assignment_status,
                aoa.visibility_scope,
                aoa.data_responsibility_status,
                aoa.object_safe_summary,
                aoa.assigned_agent_user_id::text AS assigned_agent_user_id,
                aoa.updated_at::text AS updated_at,
                ao.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                ao.agent_status,
                ao.authority_status AS organization_authority_status,
                aad.agent_authority_document_id::text AS agent_authority_document_id,
                aad.authority_status AS document_authority_status,
                aad.authority_type,
                aad.authority_scope_type,
                aad.authority_scope_object_id::text AS authority_scope_object_id,
                aad.valid_from::text AS authority_valid_from,
                aad.valid_until::text AS authority_valid_until
         FROM crewportglobal.agent_object_assignments aoa
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aoa.agent_organization_id
         LEFT JOIN crewportglobal.agent_authority_documents aad
           ON aad.agent_authority_document_id = aoa.source_authority_document_id
         WHERE aoa.agent_organization_id = $1::uuid
           AND aoa.assignment_status IN ('active', 'limited', 'proposed', 'suspended', 'expired')
           AND aoa.archived_at IS NULL
         ORDER BY aoa.updated_at DESC
         LIMIT $2",
        [$agentOrganizationId, $limit]
    );
}

function cpg_agent_authority_summary_from_assignment(array $row): array {
    return [
        'authority_document_id' => is_string($row['agent_authority_document_id'] ?? null) ? (string) $row['agent_authority_document_id'] : null,
        'authority_status' => is_string($row['document_authority_status'] ?? null) ? (string) $row['document_authority_status'] : null,
        'authority_type' => is_string($row['authority_type'] ?? null) ? (string) $row['authority_type'] : null,
        'authority_scope_type' => is_string($row['authority_scope_type'] ?? null) ? (string) $row['authority_scope_type'] : null,
        'authority_scope_object_id' => is_string($row['authority_scope_object_id'] ?? null) ? (string) $row['authority_scope_object_id'] : null,
        'valid_from' => is_string($row['authority_valid_from'] ?? null) ? (string) $row['authority_valid_from'] : null,
        'valid_until' => is_string($row['authority_valid_until'] ?? null) ? (string) $row['authority_valid_until'] : null,
    ];
}

function cpg_agent_safe_field(string $label, mixed $value): ?array {
    if ($value === null) {
        return null;
    }
    $text = trim((string) $value);
    if ($text === '') {
        return null;
    }
    return [
        'label' => $label,
        'value' => $text,
    ];
}

function cpg_agent_safe_fields(array $fieldMap): array {
    $fields = [];
    foreach ($fieldMap as $label => $value) {
        $field = cpg_agent_safe_field((string) $label, $value);
        if ($field !== null) {
            $fields[] = $field;
        }
    }
    return $fields;
}

function cpg_agent_assignment_row_by_id(string $agentOrganizationId, string $assignmentId): ?array {
    return cpg_fetch_one_assoc(
        "SELECT aoa.agent_object_assignment_id::text AS agent_object_assignment_id,
                aoa.object_type,
                aoa.object_id::text AS object_id,
                aoa.assignment_status,
                aoa.assignment_source,
                aoa.visibility_scope,
                aoa.data_responsibility_status,
                aoa.object_safe_summary,
                aoa.source_snapshot::text AS source_snapshot,
                aoa.metadata::text AS metadata,
                aoa.assigned_agent_user_id::text AS assigned_agent_user_id,
                aoa.updated_at::text AS updated_at,
                ao.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                ao.agent_status,
                ao.authority_status AS organization_authority_status,
                aad.agent_authority_document_id::text AS agent_authority_document_id,
                aad.authority_status AS document_authority_status,
                aad.authority_type,
                aad.authority_scope_type,
                aad.authority_scope_object_id::text AS authority_scope_object_id,
                aad.valid_from::text AS authority_valid_from,
                aad.valid_until::text AS authority_valid_until
         FROM crewportglobal.agent_object_assignments aoa
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aoa.agent_organization_id
         LEFT JOIN crewportglobal.agent_authority_documents aad
           ON aad.agent_authority_document_id = aoa.source_authority_document_id
         WHERE aoa.agent_object_assignment_id = $1::uuid
           AND aoa.agent_organization_id = $2::uuid
           AND aoa.assignment_status IN ('active', 'limited', 'proposed', 'suspended', 'expired')
           AND aoa.archived_at IS NULL
         LIMIT 1",
        [$assignmentId, $agentOrganizationId]
    );
}

function cpg_agent_object_safe_snapshot(string $objectType, string $objectId): array {
    $notFound = [
        'object_type' => $objectType,
        'object_id' => $objectId,
        'record_found' => false,
        'safe_fields' => [],
    ];

    if ($objectType === 'person_user') {
        $row = cpg_fetch_one_assoc(
            "SELECT u.user_id::text AS user_id,
                    u.email,
                    u.display_name,
                    u.registration_status,
                    u.is_active::text AS is_active,
                    COALESCE(string_agg(ur.role, ', ' ORDER BY ur.role), '') AS roles
             FROM crewportglobal.users u
             LEFT JOIN crewportglobal.user_roles ur ON ur.user_id = u.user_id
             WHERE u.user_id = $1::uuid
             GROUP BY u.user_id",
            [$objectId]
        );
        if (!is_array($row)) {
            return $notFound;
        }
        return [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'record_found' => true,
            'record_status' => $row['registration_status'] ?? null,
            'safe_fields' => cpg_agent_safe_fields([
                'Name' => $row['display_name'] ?? null,
                'Email' => $row['email'] ?? null,
                'Roles' => $row['roles'] ?? null,
                'Registration status' => $row['registration_status'] ?? null,
                'Active account' => $row['is_active'] ?? null,
            ]),
            'source_ids' => [
                'user_id' => $row['user_id'] ?? null,
            ],
        ];
    }

    if ($objectType === 'seafarer_profile') {
        $row = cpg_fetch_one_assoc(
            "SELECT sp.seafarer_profile_id::text AS seafarer_profile_id,
                    sp.user_id::text AS user_id,
                    u.display_name,
                    u.email,
                    sp.first_name,
                    sp.last_name,
                    sp.primary_rank,
                    sp.department,
                    sp.availability_status,
                    sp.availability_date::text AS availability_date,
                    sp.country_code,
                    sp.review_status
             FROM crewportglobal.seafarer_profiles sp
             JOIN crewportglobal.users u ON u.user_id = sp.user_id
             WHERE sp.seafarer_profile_id = $1::uuid
             LIMIT 1",
            [$objectId]
        );
        if (!is_array($row)) {
            return $notFound;
        }
        $name = trim((string) ($row['first_name'] ?? '') . ' ' . (string) ($row['last_name'] ?? ''));
        return [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'record_found' => true,
            'record_status' => $row['review_status'] ?? null,
            'safe_fields' => cpg_agent_safe_fields([
                'Name' => $name !== '' ? $name : ($row['display_name'] ?? null),
                'Email' => $row['email'] ?? null,
                'Rank' => $row['primary_rank'] ?? null,
                'Department' => $row['department'] ?? null,
                'Availability' => $row['availability_status'] ?? null,
                'Availability date' => $row['availability_date'] ?? null,
                'Country' => $row['country_code'] ?? null,
                'Review status' => $row['review_status'] ?? null,
            ]),
            'source_ids' => [
                'seafarer_profile_id' => $row['seafarer_profile_id'] ?? null,
                'user_id' => $row['user_id'] ?? null,
            ],
        ];
    }

    if ($objectType === 'employer_company') {
        $row = cpg_fetch_one_assoc(
            "SELECT ec.company_id::text AS company_id,
                    ec.company_name,
                    ec.registration_number,
                    ec.country_code,
                    ec.company_type,
                    ec.verification_status,
                    cu.user_id::text AS primary_user_id,
                    u.display_name AS primary_user_name,
                    u.email AS primary_user_email
             FROM crewportglobal.employer_companies ec
             LEFT JOIN LATERAL (
                 SELECT company_id, user_id
                 FROM crewportglobal.company_users
                 WHERE company_id = ec.company_id
                 ORDER BY is_primary_contact DESC, created_at ASC
                 LIMIT 1
             ) cu ON TRUE
             LEFT JOIN crewportglobal.users u ON u.user_id = cu.user_id
             WHERE ec.company_id = $1::uuid
             LIMIT 1",
            [$objectId]
        );
        if (!is_array($row)) {
            return $notFound;
        }
        return [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'record_found' => true,
            'record_status' => $row['verification_status'] ?? null,
            'safe_fields' => cpg_agent_safe_fields([
                'Company' => $row['company_name'] ?? null,
                'Registration number' => $row['registration_number'] ?? null,
                'Country' => $row['country_code'] ?? null,
                'Company type' => $row['company_type'] ?? null,
                'Verification status' => $row['verification_status'] ?? null,
                'Primary contact' => $row['primary_user_name'] ?? null,
                'Primary contact email' => $row['primary_user_email'] ?? null,
            ]),
            'source_ids' => [
                'company_id' => $row['company_id'] ?? null,
                'primary_user_id' => $row['primary_user_id'] ?? null,
            ],
        ];
    }

    if ($objectType === 'vessel') {
        $row = cpg_fetch_one_assoc(
            "SELECT v.vessel_id::text AS vessel_id,
                    v.company_id::text AS company_id,
                    v.vessel_name,
                    v.imo_number,
                    v.vessel_type,
                    v.flag_country_code,
                    ec.company_name,
                    cu.user_id::text AS primary_user_id
             FROM crewportglobal.vessels v
             LEFT JOIN crewportglobal.employer_companies ec ON ec.company_id = v.company_id
             LEFT JOIN LATERAL (
                 SELECT company_id, user_id
                 FROM crewportglobal.company_users
                 WHERE company_id = v.company_id
                 ORDER BY is_primary_contact DESC, created_at ASC
                 LIMIT 1
             ) cu ON TRUE
             WHERE v.vessel_id = $1::uuid
             LIMIT 1",
            [$objectId]
        );
        if (!is_array($row)) {
            return $notFound;
        }
        return [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'record_found' => true,
            'record_status' => null,
            'safe_fields' => cpg_agent_safe_fields([
                'Vessel' => $row['vessel_name'] ?? null,
                'IMO' => $row['imo_number'] ?? null,
                'Vessel type' => $row['vessel_type'] ?? null,
                'Flag' => $row['flag_country_code'] ?? null,
                'Company' => $row['company_name'] ?? null,
            ]),
            'source_ids' => [
                'vessel_id' => $row['vessel_id'] ?? null,
                'company_id' => $row['company_id'] ?? null,
                'primary_user_id' => $row['primary_user_id'] ?? null,
            ],
        ];
    }

    if ($objectType === 'vacancy_request') {
        $row = cpg_fetch_one_assoc(
            "SELECT vr.vacancy_request_id::text AS vacancy_request_id,
                    vr.created_by_user_id::text AS created_by_user_id,
                    vr.company_id::text AS company_id,
                    vr.vessel_id::text AS vessel_id,
                    vr.vacancy_title,
                    vr.rank,
                    vr.department,
                    vr.vessel_type,
                    vr.join_date::text AS join_date,
                    vr.contract_duration,
                    vr.salary_min_usd::text AS salary_min_usd,
                    vr.salary_max_usd::text AS salary_max_usd,
                    vr.currency,
                    vr.publication_status,
                    ec.company_name,
                    v.vessel_name
             FROM crewportglobal.vacancy_requests vr
             JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
             LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
             WHERE vr.vacancy_request_id = $1::uuid
             LIMIT 1",
            [$objectId]
        );
        if (!is_array($row)) {
            return $notFound;
        }
        return [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'record_found' => true,
            'record_status' => $row['publication_status'] ?? null,
            'safe_fields' => cpg_agent_safe_fields([
                'Vacancy' => $row['vacancy_title'] ?? null,
                'Rank' => $row['rank'] ?? null,
                'Department' => $row['department'] ?? null,
                'Vessel type' => $row['vessel_type'] ?? null,
                'Join date' => $row['join_date'] ?? null,
                'Contract duration' => $row['contract_duration'] ?? null,
                'Salary min' => $row['salary_min_usd'] ?? null,
                'Salary max' => $row['salary_max_usd'] ?? null,
                'Currency' => $row['currency'] ?? null,
                'Company' => $row['company_name'] ?? null,
                'Vessel' => $row['vessel_name'] ?? null,
                'Publication status' => $row['publication_status'] ?? null,
            ]),
            'source_ids' => [
                'vacancy_request_id' => $row['vacancy_request_id'] ?? null,
                'created_by_user_id' => $row['created_by_user_id'] ?? null,
                'company_id' => $row['company_id'] ?? null,
                'vessel_id' => $row['vessel_id'] ?? null,
            ],
        ];
    }

    return $notFound;
}

function cpg_agent_workspace_actions(string $assignmentId, array $snapshot, bool $canEdit): array {
    $objectType = (string) ($snapshot['object_type'] ?? '');
    $ids = is_array($snapshot['source_ids'] ?? null) ? $snapshot['source_ids'] : [];
    $actions = [];

    $addAction = static function (string $code, string $label, string $url, string $description) use (&$actions, $canEdit): void {
        $actions[] = [
            'operation_code' => $code,
            'label' => $label,
            'target_url' => $canEdit ? $url : null,
            'description' => $description,
            'enabled' => $canEdit,
        ];
    };

    if ($objectType === 'person_user') {
        $addAction(
            'open_agent_account_workspace',
            'Open account workspace',
            '/agents/?assignment_id=' . rawurlencode($assignmentId) . '#agent-workspace',
            'Account-level work remains scoped to this agent assignment.'
        );
    } elseif ($objectType === 'seafarer_profile') {
        $userId = is_string($ids['user_id'] ?? null) ? (string) $ids['user_id'] : '';
        $addAction(
            'edit_represented_seafarer_profile',
            'Edit represented seafarer profile',
            '/create-profile/?draft_id=' . rawurlencode($userId) . '&actor=agent&assignment_id=' . rawurlencode($assignmentId) . '#create-profile-form',
            'Open the seafarer profile form with agent assignment context.'
        );
    } elseif (in_array($objectType, ['employer_company', 'vessel', 'vacancy_request'], true)) {
        $draftUserId = is_string($ids['created_by_user_id'] ?? null)
            ? (string) $ids['created_by_user_id']
            : (is_string($ids['primary_user_id'] ?? null) ? (string) $ids['primary_user_id'] : '');
        $addAction(
            'edit_represented_shipowner_demand',
            'Edit represented shipowner workspace',
            '/post-vacancy/?draft_id=' . rawurlencode($draftUserId) . '&actor=agent&assignment_id=' . rawurlencode($assignmentId) . '#post-vacancy-form',
            'Open the company, vessel and vacancy workspace with agent assignment context.'
        );
    } elseif ($objectType === 'contract_workspace') {
        $addAction(
            'open_contract_workspace',
            'Open contract workspace',
            '/contracts/workspace/?actor=agent&assignment_id=' . rawurlencode($assignmentId),
            'Open controlled contract preparation for the represented parties.'
        );
    }

    return $actions;
}

function cpg_agent_task_stage_for_object_type(string $objectType): string {
    return match ($objectType) {
        'person_user', 'seafarer_profile' => 'Seafarer represented-object management',
        'employer_company', 'vessel', 'vacancy_request' => 'Shipowner represented-object management',
        'contract_workspace' => 'Contract workspace representation',
        'voyage_support_record' => 'Voyage support representation',
        default => 'Agent represented-object management',
    };
}

function cpg_agent_object_anchor(string $assignmentId): string {
    return '#agent-object-' . rawurlencode($assignmentId);
}

function cpg_agent_request_anchor(string $requestId): string {
    return '#agent-request-' . rawurlencode($requestId);
}

function cpg_agent_authority_anchor(string $authorityDocumentId): string {
    return '#agent-admin-authority-' . rawurlencode($authorityDocumentId);
}

function cpg_agent_admin_request_anchor(string $requestId): string {
    return '#agent-admin-request-' . rawurlencode($requestId);
}

function cpg_agent_task_from_assignment(array $row, array $access): array {
    $assignmentId = is_string($row['agent_object_assignment_id'] ?? null) ? (string) $row['agent_object_assignment_id'] : '';
    $objectType = is_string($row['object_type'] ?? null) ? (string) $row['object_type'] : 'object';
    $objectId = is_string($row['object_id'] ?? null) ? (string) $row['object_id'] : '';
    $summary = cpg_agent_string_value($row['object_safe_summary'] ?? null, 500) ?? trim($objectType . ' ' . $objectId);
    $management = cpg_agent_management_block_from_assignment($row);
    $allowed = (bool) ($management['management_allowed'] ?? false);
    $title = ($allowed ? 'Manage represented object.' : 'Resolve represented-object authority blocker.')
        . ' (' . $objectType . ': ' . $summary . '.)';
    $condition = $allowed
        ? 'Visible while this object is assigned to the agent organization and authority remains verified or limited.'
        : 'Shown as a control record until the agent authority or assignment blocker is resolved: ' . (string) ($management['management_blocker'] ?? 'agent_management_blocked');

    return [
        'task_id' => 'agent-assignment-' . $assignmentId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => $allowed ? 'manage_represented_object' : 'resolve_agent_authority_blocker',
        'task_title' => $title,
        'process_stage' => cpg_agent_task_stage_for_object_type($objectType),
        'visibility_condition' => $condition,
        'task_state' => $allowed ? 'active_agent_operation' : 'control_blocked',
        'responsible' => [
            'group' => 'agent_organization',
            'agent_organization_id' => (string) ($access['agent_organization_id'] ?? ''),
            'agent_display_name' => (string) ($access['agent_display_name'] ?? ''),
            'assigned_agent_user_id' => is_string($row['assigned_agent_user_id'] ?? null) ? (string) $row['assigned_agent_user_id'] : null,
        ],
        'object' => [
            'object_type' => $objectType,
            'object_id' => $objectId,
            'object_safe_summary' => $summary,
            'assignment_id' => $assignmentId,
            'assignment_status' => is_string($row['assignment_status'] ?? null) ? (string) $row['assignment_status'] : null,
            'visibility_scope' => is_string($row['visibility_scope'] ?? null) ? (string) $row['visibility_scope'] : null,
            'data_responsibility_status' => is_string($row['data_responsibility_status'] ?? null) ? (string) $row['data_responsibility_status'] : null,
        ],
        'authority' => cpg_agent_authority_summary_from_assignment($row),
        'management' => $management,
        'target_url' => '/agents/?assignment_id=' . rawurlencode($assignmentId) . '#agent-workspace',
        'generated_at' => gmdate('c'),
    ];
}

function cpg_agent_task_from_creation_request(array $row): array {
    $requestId = is_string($row['request_id'] ?? null) ? (string) $row['request_id'] : '';
    $intendedType = is_string($row['intended_object_type'] ?? null) ? (string) $row['intended_object_type'] : 'object';
    $status = is_string($row['creation_status'] ?? null) ? (string) $row['creation_status'] : 'submitted';
    $summary = cpg_agent_string_value($row['object_safe_summary'] ?? null, 500) ?? $intendedType;
    $requiresAgentAction = in_array($status, ['draft', 'evidence_requested'], true);

    return [
        'task_id' => 'agent-request-' . $requestId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => $requiresAgentAction ? 'complete_agent_object_request' : 'track_agent_object_request',
        'task_title' => ($requiresAgentAction ? 'Complete represented object request.' : 'Track represented object request.')
            . ' (' . $intendedType . ': ' . $summary . '.)',
        'process_stage' => 'Agent object creation and duplicate review',
        'visibility_condition' => $requiresAgentAction
            ? 'Visible until the agent supplies the missing evidence required for object creation review.'
            : 'Visible as a status record until platform control approves, links, blocks or rejects the request.',
        'task_state' => $requiresAgentAction ? 'agent_action_required' : 'waiting_for_platform_control',
        'object_request' => $row,
        'target_url' => '/agents/' . cpg_agent_request_anchor($requestId),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_agent_objects(): void {
    $access = cpg_agent_access_from_request();
    $agentOrganizationId = (string) $access['agent_organization_id'];
    $limit = max(1, min(200, (int) ($_GET['limit'] ?? 100)));
    $rows = cpg_agent_assignment_rows($agentOrganizationId, $limit);

    $objects = [];
    foreach ($rows as $row) {
        $management = cpg_agent_management_block_from_assignment($row);
        $objects[] = [
            'assignment_id' => $row['agent_object_assignment_id'] ?? null,
            'object_type' => $row['object_type'] ?? null,
            'object_id' => $row['object_id'] ?? null,
            'object_safe_summary' => $row['object_safe_summary'] ?? null,
            'assignment_status' => $row['assignment_status'] ?? null,
            'visibility_scope' => $row['visibility_scope'] ?? null,
            'data_responsibility_status' => $row['data_responsibility_status'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
            'authority' => cpg_agent_authority_summary_from_assignment($row),
            'management' => $management,
        ];
    }

    api_json(200, [
        'ok' => true,
        'agent_organization_id' => $agentOrganizationId,
        'agent_display_name' => $access['agent_display_name'],
        'objects' => $objects,
        'count' => count($objects),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_get_agent_object_workspace(string $assignmentId): void {
    $access = cpg_agent_access_from_request();
    $assignmentUuid = api_normalize_uuid($assignmentId);
    if ($assignmentUuid === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_agent_object_assignment_id',
            'message' => 'Invalid agent object assignment id',
        ]);
    }

    $row = cpg_agent_assignment_row_by_id((string) $access['agent_organization_id'], $assignmentUuid);
    if (!is_array($row)) {
        api_json(404, [
            'ok' => false,
            'error' => 'agent_object_assignment_not_found',
            'message' => 'No object assignment is visible for this agent organization',
            'assignment_id' => $assignmentUuid,
        ]);
    }

    $objectType = is_string($row['object_type'] ?? null) ? (string) $row['object_type'] : '';
    $objectId = is_string($row['object_id'] ?? null) ? (string) $row['object_id'] : '';
    $management = cpg_agent_management_block_from_assignment($row);
    $canEdit = (bool) ($management['management_allowed'] ?? false);
    $snapshot = cpg_agent_object_safe_snapshot($objectType, $objectId);
    $actions = cpg_agent_workspace_actions($assignmentUuid, $snapshot, $canEdit);
    $summary = cpg_agent_string_value($row['object_safe_summary'] ?? null, 500)
        ?? cpg_agent_string_value($snapshot['safe_fields'][0]['value'] ?? null, 500)
        ?? trim($objectType . ' ' . $objectId);

    api_json(200, [
        'ok' => true,
        'workspace_model' => 'agent_scoped_object_workspace',
        'agent_organization_id' => $access['agent_organization_id'],
        'agent_display_name' => $access['agent_display_name'],
        'assignment' => [
            'assignment_id' => $row['agent_object_assignment_id'] ?? null,
            'object_type' => $objectType,
            'object_id' => $objectId,
            'assignment_status' => $row['assignment_status'] ?? null,
            'assignment_source' => $row['assignment_source'] ?? null,
            'visibility_scope' => $row['visibility_scope'] ?? null,
            'data_responsibility_status' => $row['data_responsibility_status'] ?? null,
            'assigned_agent_user_id' => $row['assigned_agent_user_id'] ?? null,
            'object_safe_summary' => $summary,
            'source_snapshot' => cpg_agent_json_text_to_object($row['source_snapshot'] ?? null),
            'metadata' => cpg_agent_json_text_to_object($row['metadata'] ?? null),
            'updated_at' => $row['updated_at'] ?? null,
        ],
        'participant_card' => [
            'title' => $summary,
            'object_type' => $objectType,
            'object_id' => $objectId,
            'managed_by' => $management,
            'authority' => cpg_agent_authority_summary_from_assignment($row),
            'safe_fields' => $snapshot['safe_fields'] ?? [],
        ],
        'object_snapshot' => $snapshot,
        'workspace_guard' => [
            'can_edit' => $canEdit,
            'guard_status' => $canEdit ? 'ready_for_agent_scoped_edit' : 'blocked',
            'blocker' => $canEdit ? null : ($management['management_blocker'] ?? 'agent_management_blocked'),
            'requires_active_assignment' => true,
            'requires_verified_authority' => true,
        ],
        'actions' => $actions,
        'generated_at' => gmdate('c'),
    ]);
}

function handle_get_agent_tasks(): void {
    $access = cpg_agent_access_from_request();
    $agentOrganizationId = (string) $access['agent_organization_id'];
    $limit = max(1, min(200, (int) ($_GET['limit'] ?? 100)));
    $assignmentRows = cpg_agent_assignment_rows($agentOrganizationId, $limit);
    $offerRows = cpg_agent_framework_offer_rows_for_agent($agentOrganizationId, $limit);
    $claimRows = cpg_agent_claim_rows($agentOrganizationId, $limit);
    $requestRows = cpg_fetch_all_assoc(
        "SELECT agent_object_creation_request_id::text AS request_id,
                intended_object_type,
                represented_party_type,
                creation_status,
                duplicate_check_status,
                created_object_type,
                created_object_id::text AS created_object_id,
                object_safe_summary,
                updated_at::text AS updated_at,
                created_at::text AS created_at
         FROM crewportglobal.agent_object_creation_requests
         WHERE agent_organization_id = $1::uuid
           AND creation_status NOT IN ('created_linked', 'blocked_duplicate', 'rejected', 'cancelled')
           AND archived_at IS NULL
         ORDER BY updated_at DESC
         LIMIT $2",
        [$agentOrganizationId, $limit]
    );

    $tasks = [];
    foreach ($offerRows as $row) {
        if (in_array((string) ($row['offer_status'] ?? ''), ['sent', 'accepted'], true)) {
            $tasks[] = cpg_agent_task_from_framework_offer($row);
        }
    }
    foreach ($assignmentRows as $row) {
        $tasks[] = cpg_agent_task_from_assignment($row, $access);
    }
    foreach ($requestRows as $row) {
        $tasks[] = cpg_agent_task_from_creation_request($row);
    }
    foreach ($claimRows as $row) {
        $tasks[] = cpg_agent_task_from_claim($row);
    }

    api_json(200, [
        'ok' => true,
        'agent_organization_id' => $agentOrganizationId,
        'agent_display_name' => $access['agent_display_name'],
        'task_model' => 'data_derived_agent_scope',
        'tasks' => $tasks,
        'count' => count($tasks),
        'framework_offer_count' => count($offerRows),
        'claim_count' => count($claimRows),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_get_agent_object_creation_requests(): void {
    $access = cpg_agent_access_from_request();
    $rows = cpg_fetch_all_assoc(
        "SELECT agent_object_creation_request_id::text AS request_id,
                intended_object_type,
                represented_party_type,
                creation_status,
                duplicate_check_status,
                created_object_type,
                created_object_id::text AS created_object_id,
                object_safe_summary,
                updated_at::text AS updated_at,
                created_at::text AS created_at
         FROM crewportglobal.agent_object_creation_requests
         WHERE agent_organization_id = $1::uuid
           AND archived_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 200",
        [(string) $access['agent_organization_id']]
    );

    api_json(200, [
        'ok' => true,
        'requests' => $rows,
        'count' => count($rows),
    ]);
}

function handle_post_agent_object_creation_request(): void {
    $access = cpg_agent_access_from_request();
    $body = api_decode_json_body();
    $intendedObjectType = cpg_agent_enum_value($body['intended_object_type'] ?? null, cpg_agent_allowed_object_types(), '');
    $representedPartyType = cpg_agent_enum_value($body['represented_party_type'] ?? null, cpg_agent_allowed_party_types(), 'unknown');
    if ($intendedObjectType === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_object_type_required',
            'message' => 'A supported intended_object_type is required',
            'allowed_object_types' => cpg_agent_allowed_object_types(),
        ]);
    }

    $payloadSnapshot = cpg_agent_json_object_value($body['submitted_payload_snapshot'] ?? ($body['payload'] ?? []));
    $objectSafeSummary = cpg_agent_string_value($body['object_safe_summary'] ?? null, 500);
    $sourceAuthorityDocumentId = cpg_agent_nullable_uuid($body['source_authority_document_id'] ?? null);

    $row = cpg_fetch_one_assoc(
        "INSERT INTO crewportglobal.agent_object_creation_requests (
           agent_organization_id,
           requested_by_agent_user_id,
           intended_object_type,
           represented_party_type,
           source_authority_document_id,
           creation_status,
           duplicate_check_status,
           object_safe_summary,
           submitted_payload_snapshot,
           metadata
         ) VALUES (
           $1::uuid,
           $2::uuid,
           $3,
           $4,
           $5::uuid,
           'submitted',
           'review_required',
           $6,
           $7::jsonb,
           $8::jsonb
         )
         RETURNING agent_object_creation_request_id::text AS request_id,
                   creation_status,
                   duplicate_check_status,
                   created_at::text AS created_at",
        [
            (string) $access['agent_organization_id'],
            (string) $access['agent_user_id'],
            $intendedObjectType,
            $representedPartyType,
            $sourceAuthorityDocumentId,
            $objectSafeSummary,
            cpg_agent_json_object_text($payloadSnapshot),
            cpg_agent_json_object_text(['source' => 'agent_api_skeleton']),
        ]
    );

    $requestId = is_array($row) ? (string) ($row['request_id'] ?? '') : '';
    cpg_agent_scope_audit_event(
        'agent_object_creation_requested',
        (string) $access['actor_user_id'],
        (string) $access['agent_organization_id'],
        (string) $access['agent_user_id'],
        $requestId !== '' ? $requestId : null,
        null,
        $intendedObjectType,
        null,
        [],
        [
            'intended_object_type' => $intendedObjectType,
            'represented_party_type' => $representedPartyType,
            'creation_status' => 'submitted',
            'duplicate_check_status' => 'review_required',
        ],
        'agent submitted controlled object creation request'
    );

    api_json(201, [
        'ok' => true,
        'request' => $row,
    ]);
}

function handle_post_agent_authority_document(): void {
    $access = cpg_agent_access_from_request();
    $body = api_decode_json_body();
    $authorityType = cpg_agent_enum_value($body['authority_type'] ?? null, cpg_agent_allowed_authority_types(), '');
    $scopeType = cpg_agent_enum_value($body['authority_scope_type'] ?? null, cpg_agent_allowed_authority_scope_types(), 'platform');
    if ($authorityType === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_authority_type_required',
            'message' => 'A supported authority_type is required',
            'allowed_authority_types' => cpg_agent_allowed_authority_types(),
        ]);
    }

    $documentId = cpg_agent_nullable_uuid($body['document_id'] ?? null);
    $scopeObjectId = cpg_agent_nullable_uuid($body['authority_scope_object_id'] ?? null);
    $validFrom = cpg_agent_date_value($body['valid_from'] ?? null);
    $validUntil = cpg_agent_date_value($body['valid_until'] ?? null);
    $sourceReference = cpg_agent_string_value($body['source_reference'] ?? null, 500);
    $scopeSnapshot = cpg_agent_json_object_value($body['scope_snapshot'] ?? []);
    $metadata = cpg_agent_json_object_value($body['metadata'] ?? []);

    $row = cpg_fetch_one_assoc(
        "INSERT INTO crewportglobal.agent_authority_documents (
           agent_organization_id,
           document_id,
           authority_type,
           authority_scope_type,
           authority_scope_object_id,
           authority_status,
           valid_from,
           valid_until,
           source_reference,
           scope_snapshot,
           metadata,
           created_by_user_id
         ) VALUES (
           $1::uuid,
           $2::uuid,
           $3,
           $4,
           $5::uuid,
           'submitted',
           $6::date,
           $7::date,
           $8,
           $9::jsonb,
           $10::jsonb,
           $11::uuid
         )
         RETURNING agent_authority_document_id::text AS authority_document_id,
                   authority_status,
                   authority_type,
                   authority_scope_type,
                   valid_from::text AS valid_from,
                   valid_until::text AS valid_until,
                   created_at::text AS created_at",
        [
            (string) $access['agent_organization_id'],
            $documentId,
            $authorityType,
            $scopeType,
            $scopeObjectId,
            $validFrom,
            $validUntil,
            $sourceReference,
            cpg_agent_json_object_text($scopeSnapshot),
            cpg_agent_json_object_text($metadata),
            (string) $access['actor_user_id'],
        ]
    );

    $authorityDocumentId = is_array($row) ? (string) ($row['authority_document_id'] ?? '') : '';
    cpg_agent_scope_audit_event(
        'agent_authority_submitted',
        (string) $access['actor_user_id'],
        (string) $access['agent_organization_id'],
        (string) $access['agent_user_id'],
        null,
        null,
        $scopeType,
        $scopeObjectId,
        [],
        [
            'agent_authority_document_id' => $authorityDocumentId,
            'authority_type' => $authorityType,
            'authority_scope_type' => $scopeType,
            'authority_status' => 'submitted',
        ],
        'agent submitted authority evidence'
    );

    api_json(201, [
        'ok' => true,
        'authority_document' => $row,
    ]);
}

function cpg_agent_claim_anchor(string $claimId): string {
    return '#agent-claim-' . rawurlencode($claimId);
}

function cpg_agent_admin_claim_anchor(string $claimId): string {
    return '#agent-admin-claim-' . rawurlencode($claimId);
}

function cpg_agent_claim_rows(string $agentOrganizationId, int $limit = 100): array {
    return cpg_fetch_all_assoc(
        "SELECT account_object_claim_id::text AS claim_id,
                claim_type,
                claimant_user_id::text AS claimant_user_id,
                claimant_agent_organization_id::text AS claimant_agent_organization_id,
                target_object_type,
                target_object_id::text AS target_object_id,
                claimed_email,
                claimed_company_registration_number,
                claimed_country_code,
                claimed_imo_number,
                claim_status,
                linked_assignment_id::text AS linked_assignment_id,
                duplicate_match_snapshot::text AS duplicate_match_snapshot,
                metadata::text AS metadata,
                resolution_note,
                created_at::text AS created_at,
                updated_at::text AS updated_at
         FROM crewportglobal.account_object_claims
         WHERE claimant_agent_organization_id = $1::uuid
         ORDER BY updated_at DESC
         LIMIT $2",
        [$agentOrganizationId, $limit]
    );
}

function cpg_agent_claim_summary(array $row): string {
    $targetType = cpg_agent_string_value($row['target_object_type'] ?? null, 80);
    $targetId = cpg_agent_string_value($row['target_object_id'] ?? null, 80);
    $email = cpg_agent_string_value($row['claimed_email'] ?? null, 120);
    $companyReg = cpg_agent_string_value($row['claimed_company_registration_number'] ?? null, 120);
    $imo = cpg_agent_string_value($row['claimed_imo_number'] ?? null, 40);
    $claimType = cpg_agent_string_value($row['claim_type'] ?? null, 80) ?? 'object claim';

    if ($targetType !== null && $targetId !== null) {
        return $targetType . ' ' . $targetId;
    }
    if ($email !== null) {
        return $email;
    }
    if ($companyReg !== null) {
        return trim($companyReg . ' ' . (string) ($row['claimed_country_code'] ?? ''));
    }
    if ($imo !== null) {
        return 'IMO ' . $imo;
    }

    return $claimType;
}

function cpg_agent_task_from_claim(array $row): array {
    $claimId = is_string($row['claim_id'] ?? null) ? (string) $row['claim_id'] : '';
    $claimStatus = is_string($row['claim_status'] ?? null) ? (string) $row['claim_status'] : 'submitted';
    $summary = cpg_agent_claim_summary($row);
    $needsEvidence = in_array($claimStatus, ['evidence_requested', 'limited_pending'], true);
    $isFinal = in_array($claimStatus, ['approved_linked', 'approved_new_record', 'rejected', 'cancelled', 'blocked_duplicate'], true);

    return [
        'task_id' => 'agent-claim-' . $claimId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => $needsEvidence ? 'provide_agent_claim_evidence' : 'track_agent_account_object_claim',
        'task_title' => ($needsEvidence ? 'Provide claim evidence.' : 'Track account/object claim.') . ' (' . $summary . '.)',
        'process_stage' => 'Agent duplicate/account claim resolution',
        'visibility_condition' => $isFinal
            ? 'Shown as a completed control record after claim resolution.'
            : 'Visible while the claim is submitted, under review or needs additional evidence before object management can be granted.',
        'task_state' => $isFinal ? 'control_record' : ($needsEvidence ? 'agent_evidence_required' : 'platform_review_pending'),
        'responsible' => [
            'group' => 'agent_organization',
            'agent_organization_id' => is_string($row['claimant_agent_organization_id'] ?? null) ? (string) $row['claimant_agent_organization_id'] : null,
        ],
        'claim' => [
            'claim_id' => $claimId,
            'claim_type' => is_string($row['claim_type'] ?? null) ? (string) $row['claim_type'] : null,
            'claim_status' => $claimStatus,
            'target_object_type' => is_string($row['target_object_type'] ?? null) ? (string) $row['target_object_type'] : null,
            'target_object_id' => is_string($row['target_object_id'] ?? null) ? (string) $row['target_object_id'] : null,
            'linked_assignment_id' => is_string($row['linked_assignment_id'] ?? null) ? (string) $row['linked_assignment_id'] : null,
        ],
        'target_url' => '/agents/' . cpg_agent_claim_anchor($claimId),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_agent_account_object_claims(): void {
    $access = cpg_agent_access_from_request();
    $limit = max(1, min(200, (int) ($_GET['limit'] ?? 100)));
    $claims = cpg_agent_claim_rows((string) $access['agent_organization_id'], $limit);

    api_json(200, [
        'ok' => true,
        'agent_organization_id' => $access['agent_organization_id'],
        'claims' => $claims,
        'count' => count($claims),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_post_agent_account_object_claim(): void {
    $access = cpg_agent_access_from_request();
    $body = api_decode_json_body();
    $claimType = cpg_agent_enum_value($body['claim_type'] ?? null, cpg_agent_allowed_claim_types(), '');
    $targetObjectType = cpg_agent_enum_value($body['target_object_type'] ?? null, cpg_agent_allowed_claim_target_object_types(), '');
    $targetObjectId = cpg_agent_nullable_uuid($body['target_object_id'] ?? null);
    if ($claimType === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_claim_type_required',
            'message' => 'A supported claim_type is required',
            'allowed_claim_types' => cpg_agent_allowed_claim_types(),
        ]);
    }

    $claimedEmail = cpg_agent_string_value($body['claimed_email'] ?? null, 254);
    $claimedCompanyRegistrationNumber = cpg_agent_string_value($body['claimed_company_registration_number'] ?? null, 120);
    $claimedCountryCode = cpg_agent_string_value($body['claimed_country_code'] ?? null, 2);
    $claimedCountryCode = $claimedCountryCode !== null ? strtoupper($claimedCountryCode) : null;
    $claimedImoNumber = cpg_agent_string_value($body['claimed_imo_number'] ?? null, 7);
    $claimedDocumentHash = cpg_agent_string_value($body['claimed_document_hash'] ?? null, 64);
    $evidenceDocumentId = cpg_agent_nullable_uuid($body['evidence_document_id'] ?? null);
    $sourceAuthorityDocumentId = cpg_agent_nullable_uuid($body['source_authority_document_id'] ?? null);
    $duplicateSnapshot = cpg_agent_json_object_value($body['duplicate_match_snapshot'] ?? ($body['matched_existing_snapshot'] ?? []));
    $metadata = cpg_agent_json_object_value($body['metadata'] ?? []);
    if ($sourceAuthorityDocumentId !== null) {
        $metadata['source_authority_document_id'] = $sourceAuthorityDocumentId;
    }
    $claimReason = cpg_agent_string_value($body['claim_reason'] ?? ($body['reason'] ?? null), 1000);
    if ($claimReason !== null) {
        $metadata['claim_reason'] = $claimReason;
    }

    $row = cpg_fetch_one_assoc(
        "INSERT INTO crewportglobal.account_object_claims (
           claim_type,
           claimant_user_id,
           claimant_agent_organization_id,
           target_object_type,
           target_object_id,
           claimed_email,
           claimed_company_registration_number,
           claimed_country_code,
           claimed_imo_number,
           claimed_document_hash,
           duplicate_match_snapshot,
           evidence_document_id,
           claim_status,
           metadata
         ) VALUES (
           $1,
           $2::uuid,
           $3::uuid,
           NULLIF($4, ''),
           $5::uuid,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11::jsonb,
           $12::uuid,
           'submitted',
           $13::jsonb
         )
         RETURNING account_object_claim_id::text AS claim_id,
                   claim_type,
                   claimant_agent_organization_id::text AS claimant_agent_organization_id,
                   target_object_type,
                   target_object_id::text AS target_object_id,
                   claim_status,
                   created_at::text AS created_at",
        [
            $claimType,
            (string) $access['actor_user_id'],
            (string) $access['agent_organization_id'],
            $targetObjectType,
            $targetObjectId,
            $claimedEmail,
            $claimedCompanyRegistrationNumber,
            $claimedCountryCode,
            $claimedImoNumber,
            $claimedDocumentHash,
            cpg_agent_json_object_text($duplicateSnapshot),
            $evidenceDocumentId,
            cpg_agent_json_object_text(array_merge(['source' => 'agent_claim_api'], $metadata)),
        ]
    );

    $claimId = is_array($row) ? (string) ($row['claim_id'] ?? '') : '';
    cpg_agent_scope_audit_event(
        'agent_account_object_claim_submitted',
        (string) $access['actor_user_id'],
        (string) $access['agent_organization_id'],
        (string) $access['agent_user_id'],
        null,
        null,
        $targetObjectType !== '' ? $targetObjectType : null,
        $targetObjectId,
        [],
        is_array($row) ? $row : [],
        $claimReason ?? 'agent submitted account/object claim',
        $claimId !== '' ? $claimId : null
    );

    api_json(201, [
        'ok' => true,
        'claim' => $row,
    ]);
}

function require_agent_admin_access(): array {
    return require_operator_workflow_operation_access('confirm_vacancy_deletion');
}

function cpg_admin_agent_authority_task(array $row): array {
    $authorityDocumentId = is_string($row['authority_document_id'] ?? null) ? (string) $row['authority_document_id'] : '';
    $agentName = cpg_agent_string_value($row['agent_display_name'] ?? null, 200) ?? 'Agent organization';
    $authorityType = is_string($row['authority_type'] ?? null) ? (string) $row['authority_type'] : 'authority';
    $scopeType = is_string($row['authority_scope_type'] ?? null) ? (string) $row['authority_scope_type'] : 'scope';
    return [
        'task_id' => 'admin-agent-authority-' . $authorityDocumentId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => 'review_agent_authority_evidence',
        'task_title' => 'Review agent authority evidence. (Agent: ' . $agentName . ', ' . $authorityType . '.)',
        'process_stage' => 'Agent authority verification',
        'visibility_condition' => 'Visible while authority evidence is submitted or under review and has not been accepted, limited, rejected, expired or revoked.',
        'task_state' => 'platform_control_review_required',
        'responsible' => [
            'group' => 'platform_control',
            'permission' => 'confirm_vacancy_deletion',
        ],
        'authority_document' => [
            'authority_document_id' => $authorityDocumentId,
            'agent_organization_id' => is_string($row['agent_organization_id'] ?? null) ? (string) $row['agent_organization_id'] : null,
            'agent_display_name' => $agentName,
            'authority_type' => $authorityType,
            'authority_scope_type' => $scopeType,
            'authority_scope_object_id' => is_string($row['authority_scope_object_id'] ?? null) ? (string) $row['authority_scope_object_id'] : null,
            'authority_status' => is_string($row['authority_status'] ?? null) ? (string) $row['authority_status'] : null,
            'valid_from' => is_string($row['valid_from'] ?? null) ? (string) $row['valid_from'] : null,
            'valid_until' => is_string($row['valid_until'] ?? null) ? (string) $row['valid_until'] : null,
            'source_reference' => is_string($row['source_reference'] ?? null) ? (string) $row['source_reference'] : null,
            'created_at' => is_string($row['created_at'] ?? null) ? (string) $row['created_at'] : null,
        ],
        'target_url' => '/agents/' . cpg_agent_authority_anchor($authorityDocumentId),
        'generated_at' => gmdate('c'),
    ];
}

function cpg_admin_agent_object_request_task(array $row): array {
    $requestId = is_string($row['request_id'] ?? null) ? (string) $row['request_id'] : '';
    $agentName = cpg_agent_string_value($row['agent_display_name'] ?? null, 200) ?? 'Agent organization';
    $objectType = is_string($row['intended_object_type'] ?? null) ? (string) $row['intended_object_type'] : 'object';
    $summary = cpg_agent_string_value($row['object_safe_summary'] ?? null, 500) ?? $objectType;
    return [
        'task_id' => 'admin-agent-object-request-' . $requestId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => 'review_agent_object_creation_request',
        'task_title' => 'Review represented-object creation request. (' . $objectType . ': ' . $summary . '.)',
        'process_stage' => 'Agent object creation and duplicate review',
        'visibility_condition' => 'Visible while the agent-created object request requires duplicate/control review before object creation or linking.',
        'task_state' => 'platform_control_review_required',
        'responsible' => [
            'group' => 'platform_control',
            'permission' => 'confirm_vacancy_deletion',
        ],
        'object_request' => [
            'request_id' => $requestId,
            'agent_organization_id' => is_string($row['agent_organization_id'] ?? null) ? (string) $row['agent_organization_id'] : null,
            'agent_display_name' => $agentName,
            'intended_object_type' => $objectType,
            'represented_party_type' => is_string($row['represented_party_type'] ?? null) ? (string) $row['represented_party_type'] : null,
            'creation_status' => is_string($row['creation_status'] ?? null) ? (string) $row['creation_status'] : null,
            'duplicate_check_status' => is_string($row['duplicate_check_status'] ?? null) ? (string) $row['duplicate_check_status'] : null,
            'object_safe_summary' => $summary,
            'source_authority_document_id' => is_string($row['source_authority_document_id'] ?? null) ? (string) $row['source_authority_document_id'] : null,
            'created_at' => is_string($row['created_at'] ?? null) ? (string) $row['created_at'] : null,
            'updated_at' => is_string($row['updated_at'] ?? null) ? (string) $row['updated_at'] : null,
        ],
        'target_url' => '/agents/' . cpg_agent_admin_request_anchor($requestId),
        'generated_at' => gmdate('c'),
    ];
}

function cpg_admin_agent_claim_task(array $row): array {
    $claimId = is_string($row['claim_id'] ?? null) ? (string) $row['claim_id'] : '';
    $agentName = cpg_agent_string_value($row['agent_display_name'] ?? null, 200) ?? 'Agent organization';
    $summary = cpg_agent_claim_summary($row);
    $claimType = is_string($row['claim_type'] ?? null) ? (string) $row['claim_type'] : 'claim';
    return [
        'task_id' => 'admin-agent-claim-' . $claimId,
        'task_model' => 'data_derived_agent_scope',
        'operation_code' => 'review_agent_account_object_claim',
        'task_title' => 'Review account/object claim. (Agent: ' . $agentName . ', ' . $summary . '.)',
        'process_stage' => 'Agent duplicate/account claim resolution',
        'visibility_condition' => 'Visible while an agent claim is submitted, under review, needs evidence or remains limited before object management is granted.',
        'task_state' => 'platform_control_review_required',
        'responsible' => [
            'group' => 'platform_control',
            'permission' => 'confirm_vacancy_deletion',
        ],
        'claim' => [
            'claim_id' => $claimId,
            'agent_organization_id' => is_string($row['claimant_agent_organization_id'] ?? null) ? (string) $row['claimant_agent_organization_id'] : null,
            'agent_display_name' => $agentName,
            'claim_type' => $claimType,
            'claim_status' => is_string($row['claim_status'] ?? null) ? (string) $row['claim_status'] : null,
            'target_object_type' => is_string($row['target_object_type'] ?? null) ? (string) $row['target_object_type'] : null,
            'target_object_id' => is_string($row['target_object_id'] ?? null) ? (string) $row['target_object_id'] : null,
            'claimed_email' => is_string($row['claimed_email'] ?? null) ? (string) $row['claimed_email'] : null,
            'claimed_company_registration_number' => is_string($row['claimed_company_registration_number'] ?? null) ? (string) $row['claimed_company_registration_number'] : null,
            'claimed_country_code' => is_string($row['claimed_country_code'] ?? null) ? (string) $row['claimed_country_code'] : null,
            'claimed_imo_number' => is_string($row['claimed_imo_number'] ?? null) ? (string) $row['claimed_imo_number'] : null,
            'created_at' => is_string($row['created_at'] ?? null) ? (string) $row['created_at'] : null,
            'updated_at' => is_string($row['updated_at'] ?? null) ? (string) $row['updated_at'] : null,
        ],
        'target_url' => '/agents/' . cpg_agent_admin_claim_anchor($claimId),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_admin_agent_review_workspace(): void {
    cpg_agent_require_scope_tables();
    require_agent_admin_access();
    $limit = max(1, min(200, (int) ($_GET['limit'] ?? 100)));
    $authorityRows = cpg_fetch_all_assoc(
        "SELECT aad.agent_authority_document_id::text AS authority_document_id,
                aad.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                aad.authority_type,
                aad.authority_scope_type,
                aad.authority_scope_object_id::text AS authority_scope_object_id,
                aad.authority_status,
                aad.valid_from::text AS valid_from,
                aad.valid_until::text AS valid_until,
                aad.source_reference,
                aad.created_at::text AS created_at,
                aad.updated_at::text AS updated_at
         FROM crewportglobal.agent_authority_documents aad
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aad.agent_organization_id
         WHERE aad.authority_status IN ('submitted', 'under_review')
           AND aad.archived_at IS NULL
           AND ao.archived_at IS NULL
         ORDER BY aad.updated_at DESC
         LIMIT $1",
        [$limit]
    );
    $requestRows = cpg_fetch_all_assoc(
        "SELECT aocr.agent_object_creation_request_id::text AS request_id,
                aocr.agent_organization_id::text AS agent_organization_id,
                ao.agent_display_name,
                aocr.intended_object_type,
                aocr.represented_party_type,
                aocr.creation_status,
                aocr.duplicate_check_status,
                aocr.source_authority_document_id::text AS source_authority_document_id,
                aocr.object_safe_summary,
                aocr.created_at::text AS created_at,
                aocr.updated_at::text AS updated_at
         FROM crewportglobal.agent_object_creation_requests aocr
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aocr.agent_organization_id
         WHERE aocr.creation_status IN ('submitted', 'duplicate_check_required', 'duplicate_found', 'evidence_requested', 'approved_to_create')
           AND aocr.archived_at IS NULL
           AND ao.archived_at IS NULL
         ORDER BY aocr.updated_at DESC
         LIMIT $1",
        [$limit]
    );
    $claimRows = cpg_fetch_all_assoc(
        "SELECT aoc.account_object_claim_id::text AS claim_id,
                aoc.claim_type,
                aoc.claimant_user_id::text AS claimant_user_id,
                aoc.claimant_agent_organization_id::text AS claimant_agent_organization_id,
                ao.agent_display_name,
                aoc.target_object_type,
                aoc.target_object_id::text AS target_object_id,
                aoc.claimed_email,
                aoc.claimed_company_registration_number,
                aoc.claimed_country_code,
                aoc.claimed_imo_number,
                aoc.claim_status,
                aoc.linked_assignment_id::text AS linked_assignment_id,
                aoc.created_at::text AS created_at,
                aoc.updated_at::text AS updated_at
         FROM crewportglobal.account_object_claims aoc
         LEFT JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aoc.claimant_agent_organization_id
         WHERE aoc.claim_status IN ('submitted', 'under_review', 'evidence_requested', 'limited_pending')
         ORDER BY aoc.updated_at DESC
         LIMIT $1",
        [$limit]
    );

    $tasks = [];
    foreach ($authorityRows as $row) {
        $tasks[] = cpg_admin_agent_authority_task($row);
    }
    foreach ($requestRows as $row) {
        $tasks[] = cpg_admin_agent_object_request_task($row);
    }
    foreach ($claimRows as $row) {
        $tasks[] = cpg_admin_agent_claim_task($row);
    }

    api_json(200, [
        'ok' => true,
        'task_model' => 'data_derived_agent_scope',
        'tasks' => $tasks,
        'authority_documents' => $authorityRows,
        'object_creation_requests' => $requestRows,
        'account_object_claims' => $claimRows,
        'counts' => [
            'tasks' => count($tasks),
            'authority_documents' => count($authorityRows),
            'object_creation_requests' => count($requestRows),
            'account_object_claims' => count($claimRows),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function handle_patch_admin_agent_authority_document_review(string $authorityDocumentId): void {
    cpg_agent_require_scope_tables();
    $access = require_agent_admin_access();
    $uuid = api_normalize_uuid($authorityDocumentId);
    if ($uuid === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_agent_authority_document_id',
            'message' => 'Invalid authority document id',
        ]);
    }

    $body = api_decode_json_body();
    $decision = cpg_agent_enum_value($body['decision'] ?? ($body['authority_status'] ?? null), ['verified', 'limited', 'rejected', 'expired', 'revoked'], '');
    if ($decision === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_authority_review_decision_required',
            'message' => 'Review decision must be verified, limited, rejected, expired or revoked',
        ]);
    }

    $reviewNote = cpg_agent_string_value($body['review_note'] ?? null, 1000);
    $previous = cpg_fetch_one_assoc(
        "SELECT agent_authority_document_id::text AS authority_document_id,
                agent_organization_id::text AS agent_organization_id,
                authority_status,
                authority_type,
                authority_scope_type,
                authority_scope_object_id::text AS authority_scope_object_id
         FROM crewportglobal.agent_authority_documents
         WHERE agent_authority_document_id = $1::uuid
           AND archived_at IS NULL
         LIMIT 1",
        [$uuid]
    );
    if ($previous === null) {
        api_json(404, [
            'ok' => false,
            'error' => 'agent_authority_document_not_found',
            'message' => 'Authority document was not found',
        ]);
    }

    $row = cpg_fetch_one_assoc(
        "UPDATE crewportglobal.agent_authority_documents
         SET authority_status = $2,
             reviewed_by_user_id = $3::uuid,
             reviewed_at = now(),
             review_note = $4,
             updated_at = now()
         WHERE agent_authority_document_id = $1::uuid
         RETURNING agent_authority_document_id::text AS authority_document_id,
                   agent_organization_id::text AS agent_organization_id,
                   authority_status,
                   authority_type,
                   authority_scope_type,
                   authority_scope_object_id::text AS authority_scope_object_id,
                   reviewed_at::text AS reviewed_at",
        [
            $uuid,
            $decision,
            $access['actor_user_id'] ?? null,
            $reviewNote,
        ]
    );

    if (in_array($decision, ['verified', 'limited', 'rejected', 'expired', 'revoked'], true)) {
        api_query(
            "UPDATE crewportglobal.agent_organizations
             SET authority_status = $2,
                 updated_at = now()
             WHERE agent_organization_id = $1::uuid",
            [(string) ($previous['agent_organization_id'] ?? ''), $decision]
        );
    }

    cpg_agent_scope_audit_event(
        'agent_authority_reviewed',
        is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
        (string) ($previous['agent_organization_id'] ?? ''),
        null,
        null,
        null,
        is_string($previous['authority_scope_type'] ?? null) ? (string) $previous['authority_scope_type'] : null,
        is_string($previous['authority_scope_object_id'] ?? null) ? (string) $previous['authority_scope_object_id'] : null,
        $previous,
        is_array($row) ? $row : [],
        $reviewNote
    );

    api_json(200, [
        'ok' => true,
        'authority_document' => $row,
    ]);
}

function handle_post_admin_agent_object_assignment(): void {
    cpg_agent_require_scope_tables();
    $access = require_agent_admin_access();
    $body = api_decode_json_body();
    $agentOrganizationId = cpg_agent_nullable_uuid($body['agent_organization_id'] ?? null);
    $objectType = cpg_agent_enum_value($body['object_type'] ?? null, cpg_agent_allowed_assignment_object_types(), '');
    $objectId = cpg_agent_nullable_uuid($body['object_id'] ?? null);
    $authorityDocumentId = cpg_agent_nullable_uuid($body['source_authority_document_id'] ?? null);
    $assignmentStatus = cpg_agent_enum_value($body['assignment_status'] ?? null, ['active', 'limited'], 'active');
    $objectSafeSummary = cpg_agent_string_value($body['object_safe_summary'] ?? null, 500);
    if ($agentOrganizationId === null || $objectType === '' || $objectId === null || $authorityDocumentId === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_assignment_required_fields_missing',
            'message' => 'agent_organization_id, object_type, object_id and source_authority_document_id are required',
        ]);
    }

    $authority = cpg_fetch_one_assoc(
        "SELECT aad.agent_authority_document_id::text AS agent_authority_document_id,
                aad.agent_organization_id::text AS agent_organization_id,
                aad.authority_status AS document_authority_status,
                aad.authority_type,
                aad.authority_scope_type,
                aad.authority_scope_object_id::text AS authority_scope_object_id,
                aad.valid_until::text AS authority_valid_until,
                ao.agent_status,
                ao.authority_status AS organization_authority_status,
                ao.agent_display_name
         FROM crewportglobal.agent_authority_documents aad
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aad.agent_organization_id
         WHERE aad.agent_authority_document_id = $1::uuid
           AND aad.agent_organization_id = $2::uuid
           AND aad.archived_at IS NULL
         LIMIT 1",
        [$authorityDocumentId, $agentOrganizationId]
    );
    if ($authority === null) {
        api_json(404, [
            'ok' => false,
            'error' => 'agent_authority_document_not_found',
            'message' => 'Verified authority document for this agent organization was not found',
        ]);
    }

    $authorityScopeObjectId = is_string($authority['authority_scope_object_id'] ?? null)
        ? (string) $authority['authority_scope_object_id']
        : '';
    if ($authorityScopeObjectId !== '' && $authorityScopeObjectId !== $objectId) {
        api_json(409, [
            'ok' => false,
            'error' => 'agent_assignment_authority_scope_mismatch',
            'message' => 'Authority document is scoped to a different object',
            'authority' => [
                'authority_scope_type' => $authority['authority_scope_type'] ?? null,
                'authority_scope_object_id' => $authorityScopeObjectId,
            ],
            'requested_assignment' => [
                'object_type' => $objectType,
                'object_id' => $objectId,
            ],
        ]);
    }

    $guardRow = array_merge($authority, [
        'assignment_status' => $assignmentStatus,
    ]);
    if (!cpg_agent_management_allowed_status($guardRow)) {
        api_json(409, [
            'ok' => false,
            'error' => 'agent_assignment_authority_guard_blocked',
            'message' => 'Object assignment requires verified authority, active agent organization and active assignment status',
            'blocker' => cpg_agent_management_blocker($guardRow),
            'authority' => $authority,
        ]);
    }

    $row = cpg_fetch_one_assoc(
        "INSERT INTO crewportglobal.agent_object_assignments (
           agent_organization_id,
           object_type,
           object_id,
           assignment_status,
           assignment_source,
           visibility_scope,
           data_responsibility_status,
           source_authority_document_id,
           assigned_by_user_id,
           assigned_at,
           valid_from,
           object_safe_summary,
           source_snapshot,
           metadata
         ) VALUES (
           $1::uuid,
           $2,
           $3::uuid,
           $4,
           'authority_document',
           CASE WHEN $4 = 'limited' THEN 'limited_execution' ELSE 'ordinary_execution' END,
           'agent_responsible',
           $5::uuid,
           $6::uuid,
           now(),
           now(),
           $7,
           $8::jsonb,
           $9::jsonb
         )
         RETURNING agent_object_assignment_id::text AS assignment_id,
                   agent_organization_id::text AS agent_organization_id,
                   object_type,
                   object_id::text AS object_id,
                   assignment_status,
                   assigned_at::text AS assigned_at",
        [
            $agentOrganizationId,
            $objectType,
            $objectId,
            $assignmentStatus,
            $authorityDocumentId,
            $access['actor_user_id'] ?? null,
            $objectSafeSummary,
            cpg_agent_json_object_text(['authority_document_id' => $authorityDocumentId]),
            cpg_agent_json_object_text(['source' => 'agent_assignment_api_skeleton']),
        ]
    );

    $assignmentId = is_array($row) ? (string) ($row['assignment_id'] ?? '') : '';
    cpg_agent_scope_audit_event(
        'agent_object_assignment_created',
        is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
        $agentOrganizationId,
        null,
        null,
        $assignmentId !== '' ? $assignmentId : null,
        $objectType,
        $objectId,
        [],
        is_array($row) ? $row : [],
        'platform control assigned object to verified agent authority'
    );

    api_json(201, [
        'ok' => true,
        'assignment' => $row,
        'management' => cpg_object_management_context($objectType, $objectId),
    ]);
}

function cpg_agent_verified_authority_for_claim(
    string $agentOrganizationId,
    ?string $authorityDocumentId,
    string $targetObjectId
): ?array {
    if ($authorityDocumentId !== null) {
        return cpg_fetch_one_assoc(
            "SELECT aad.agent_authority_document_id::text AS agent_authority_document_id,
                    aad.agent_organization_id::text AS agent_organization_id,
                    aad.authority_status AS document_authority_status,
                    aad.authority_type,
                    aad.authority_scope_type,
                    aad.authority_scope_object_id::text AS authority_scope_object_id,
                    aad.valid_until::text AS authority_valid_until,
                    ao.agent_status,
                    ao.authority_status AS organization_authority_status,
                    ao.agent_display_name
             FROM crewportglobal.agent_authority_documents aad
             JOIN crewportglobal.agent_organizations ao
               ON ao.agent_organization_id = aad.agent_organization_id
             WHERE aad.agent_authority_document_id = $1::uuid
               AND aad.agent_organization_id = $2::uuid
               AND aad.archived_at IS NULL
             LIMIT 1",
            [$authorityDocumentId, $agentOrganizationId]
        );
    }

    return cpg_fetch_one_assoc(
        "SELECT aad.agent_authority_document_id::text AS agent_authority_document_id,
                aad.agent_organization_id::text AS agent_organization_id,
                aad.authority_status AS document_authority_status,
                aad.authority_type,
                aad.authority_scope_type,
                aad.authority_scope_object_id::text AS authority_scope_object_id,
                aad.valid_until::text AS authority_valid_until,
                ao.agent_status,
                ao.authority_status AS organization_authority_status,
                ao.agent_display_name
         FROM crewportglobal.agent_authority_documents aad
         JOIN crewportglobal.agent_organizations ao
           ON ao.agent_organization_id = aad.agent_organization_id
         WHERE aad.agent_organization_id = $1::uuid
           AND aad.authority_status IN ('verified', 'limited')
           AND aad.archived_at IS NULL
           AND (aad.valid_until IS NULL OR aad.valid_until >= CURRENT_DATE)
           AND (
             aad.authority_scope_object_id IS NULL
             OR aad.authority_scope_object_id = $2::uuid
           )
         ORDER BY
           CASE WHEN aad.authority_scope_object_id = $2::uuid THEN 0 ELSE 1 END,
           aad.updated_at DESC
         LIMIT 1",
        [$agentOrganizationId, $targetObjectId]
    );
}

function cpg_agent_user_for_claim(array $claim): ?string {
    $claimantUserId = is_string($claim['claimant_user_id'] ?? null) ? (string) $claim['claimant_user_id'] : null;
    $agentOrganizationId = is_string($claim['claimant_agent_organization_id'] ?? null) ? (string) $claim['claimant_agent_organization_id'] : null;
    if ($claimantUserId === null || $agentOrganizationId === null) {
        return null;
    }

    $row = cpg_fetch_one_assoc(
        "SELECT agent_user_id::text AS agent_user_id
         FROM crewportglobal.agent_users
         WHERE agent_organization_id = $1::uuid
           AND user_id = $2::uuid
           AND membership_status = 'active'
         ORDER BY updated_at DESC
         LIMIT 1",
        [$agentOrganizationId, $claimantUserId]
    );

    return is_array($row) && is_string($row['agent_user_id'] ?? null) ? (string) $row['agent_user_id'] : null;
}

function cpg_admin_approve_agent_claim_assignment(
    array $claim,
    array $authority,
    array $access,
    string $decision,
    ?string $reviewNote
): array {
    $claimId = (string) ($claim['claim_id'] ?? '');
    $agentOrganizationId = (string) ($claim['claimant_agent_organization_id'] ?? '');
    $targetObjectType = (string) ($claim['target_object_type'] ?? '');
    $targetObjectId = (string) ($claim['target_object_id'] ?? '');
    $authorityDocumentId = (string) ($authority['agent_authority_document_id'] ?? '');
    $assignmentStatus = (string) ($authority['document_authority_status'] ?? '') === 'limited' ? 'limited' : 'active';
    $summary = cpg_agent_claim_summary($claim);
    $assignedAgentUserId = cpg_agent_user_for_claim($claim);

    $existing = cpg_fetch_one_assoc(
        "SELECT agent_object_assignment_id::text AS assignment_id,
                agent_organization_id::text AS agent_organization_id,
                assignment_status,
                object_type,
                object_id::text AS object_id,
                object_safe_summary
         FROM crewportglobal.agent_object_assignments
         WHERE object_type = $1
           AND object_id = $2::uuid
           AND assignment_status IN ('active', 'limited')
         LIMIT 1",
        [$targetObjectType, $targetObjectId]
    );

    if (is_array($existing) && (string) ($existing['agent_organization_id'] ?? '') === $agentOrganizationId) {
        $assignmentId = (string) ($existing['assignment_id'] ?? '');
        $claimRow = cpg_fetch_one_assoc(
            "UPDATE crewportglobal.account_object_claims
             SET claim_status = $2,
                 reviewed_by_user_id = $3::uuid,
                 reviewed_at = now(),
                 resolution_note = $4,
                 linked_assignment_id = $5::uuid,
                 updated_at = now()
             WHERE account_object_claim_id = $1::uuid
             RETURNING account_object_claim_id::text AS claim_id,
                       claim_type,
                       claimant_agent_organization_id::text AS claimant_agent_organization_id,
                       target_object_type,
                       target_object_id::text AS target_object_id,
                       claim_status,
                       linked_assignment_id::text AS linked_assignment_id,
                       reviewed_at::text AS reviewed_at",
            [
                $claimId,
                $decision,
                $access['actor_user_id'] ?? null,
                $reviewNote,
                $assignmentId,
            ]
        );

        cpg_agent_scope_audit_event(
            'agent_account_object_claim_linked_existing_assignment',
            is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
            $agentOrganizationId,
            $assignedAgentUserId,
            null,
            $assignmentId,
            $targetObjectType,
            $targetObjectId,
            $claim,
            is_array($claimRow) ? $claimRow : [],
            $reviewNote ?? 'platform control linked claim to existing assignment',
            $claimId
        );

        return [
            'claim' => $claimRow,
            'assignment' => $existing,
            'reassigned_from_assignment_id' => null,
        ];
    }

    api_tx_begin();
    try {
        $reassignedFromAssignmentId = null;
        if (is_array($existing)) {
            $reassignedFromAssignmentId = (string) ($existing['assignment_id'] ?? '');
            api_query(
                "UPDATE crewportglobal.agent_object_assignments
                 SET assignment_status = 'reassigned',
                     replacement_reason = $2,
                     updated_at = now()
                 WHERE agent_object_assignment_id = $1::uuid",
                [
                    $reassignedFromAssignmentId,
                    $reviewNote ?? 'reassigned after approved account/object claim',
                ]
            );
        }

        $assignment = cpg_fetch_one_assoc(
            "INSERT INTO crewportglobal.agent_object_assignments (
               agent_organization_id,
               object_type,
               object_id,
               assignment_status,
               assignment_source,
               visibility_scope,
               data_responsibility_status,
               source_authority_document_id,
               assigned_by_user_id,
               assigned_agent_user_id,
               assigned_at,
               valid_from,
               object_safe_summary,
               source_snapshot,
               metadata
             ) VALUES (
               $1::uuid,
               $2,
               $3::uuid,
               $4,
               'claim_resolution',
               CASE WHEN $4 = 'limited' THEN 'limited_execution' ELSE 'ordinary_execution' END,
               'agent_responsible',
               $5::uuid,
               $6::uuid,
               $7::uuid,
               now(),
               now(),
               $8,
               $9::jsonb,
               $10::jsonb
             )
             RETURNING agent_object_assignment_id::text AS assignment_id,
                       agent_organization_id::text AS agent_organization_id,
                       object_type,
                       object_id::text AS object_id,
                       assignment_status,
                       assigned_at::text AS assigned_at",
            [
                $agentOrganizationId,
                $targetObjectType,
                $targetObjectId,
                $assignmentStatus,
                $authorityDocumentId,
                $access['actor_user_id'] ?? null,
                $assignedAgentUserId,
                $summary,
                cpg_agent_json_object_text([
                    'account_object_claim_id' => $claimId,
                    'authority_document_id' => $authorityDocumentId,
                    'previous_assignment_id' => $reassignedFromAssignmentId,
                ]),
                cpg_agent_json_object_text(['source' => 'agent_claim_resolution']),
            ]
        );

        $assignmentId = is_array($assignment) ? (string) ($assignment['assignment_id'] ?? '') : '';
        if ($reassignedFromAssignmentId !== null && $assignmentId !== '') {
            api_query(
                "UPDATE crewportglobal.agent_object_assignments
                 SET replaced_by_assignment_id = $2::uuid,
                     updated_at = now()
                 WHERE agent_object_assignment_id = $1::uuid",
                [$reassignedFromAssignmentId, $assignmentId]
            );
        }

        $claimRow = cpg_fetch_one_assoc(
            "UPDATE crewportglobal.account_object_claims
             SET claim_status = $2,
                 reviewed_by_user_id = $3::uuid,
                 reviewed_at = now(),
                 resolution_note = $4,
                 linked_assignment_id = $5::uuid,
                 updated_at = now()
             WHERE account_object_claim_id = $1::uuid
             RETURNING account_object_claim_id::text AS claim_id,
                       claim_type,
                       claimant_agent_organization_id::text AS claimant_agent_organization_id,
                       target_object_type,
                       target_object_id::text AS target_object_id,
                       claim_status,
                       linked_assignment_id::text AS linked_assignment_id,
                       reviewed_at::text AS reviewed_at",
            [
                $claimId,
                $decision,
                $access['actor_user_id'] ?? null,
                $reviewNote,
                $assignmentId !== '' ? $assignmentId : null,
            ]
        );

        api_tx_commit();

        cpg_agent_scope_audit_event(
            $reassignedFromAssignmentId !== null ? 'agent_object_assignment_reassigned' : 'agent_object_assignment_created_from_claim',
            is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
            $agentOrganizationId,
            $assignedAgentUserId,
            null,
            $assignmentId !== '' ? $assignmentId : null,
            $targetObjectType,
            $targetObjectId,
            [
                'claim' => $claim,
                'previous_assignment_id' => $reassignedFromAssignmentId,
            ],
            [
                'claim' => is_array($claimRow) ? $claimRow : [],
                'assignment' => is_array($assignment) ? $assignment : [],
            ],
            $reviewNote ?? 'platform control approved account/object claim',
            $claimId
        );

        return [
            'claim' => $claimRow,
            'assignment' => $assignment,
            'reassigned_from_assignment_id' => $reassignedFromAssignmentId,
        ];
    } catch (Throwable $error) {
        api_tx_rollback();
        throw $error;
    }
}

function handle_patch_admin_agent_account_object_claim_review(string $claimId): void {
    cpg_agent_require_scope_tables();
    $access = require_agent_admin_access();
    $uuid = api_normalize_uuid($claimId);
    if ($uuid === null) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_account_object_claim_id',
            'message' => 'Invalid account/object claim id',
        ]);
    }

    $body = api_decode_json_body();
    $decision = cpg_agent_enum_value(
        $body['decision'] ?? ($body['claim_status'] ?? null),
        ['under_review', 'evidence_requested', 'approved_linked', 'approved_new_record', 'rejected', 'cancelled', 'blocked_duplicate', 'limited_pending'],
        ''
    );
    if ($decision === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'agent_claim_review_decision_required',
            'message' => 'Review decision must be under_review, evidence_requested, approved_linked, approved_new_record, rejected, cancelled, blocked_duplicate or limited_pending',
        ]);
    }

    $reviewNote = cpg_agent_string_value($body['review_note'] ?? ($body['resolution_note'] ?? null), 1000);
    $claim = cpg_fetch_one_assoc(
        "SELECT aoc.account_object_claim_id::text AS claim_id,
                aoc.claim_type,
                aoc.claimant_user_id::text AS claimant_user_id,
                aoc.claimant_agent_organization_id::text AS claimant_agent_organization_id,
                aoc.target_object_type,
                aoc.target_object_id::text AS target_object_id,
                aoc.claimed_email,
                aoc.claimed_company_registration_number,
                aoc.claimed_country_code,
                aoc.claimed_imo_number,
                aoc.claim_status,
                aoc.linked_assignment_id::text AS linked_assignment_id,
                aoc.metadata::text AS metadata
         FROM crewportglobal.account_object_claims aoc
         WHERE aoc.account_object_claim_id = $1::uuid
         LIMIT 1",
        [$uuid]
    );
    if ($claim === null) {
        api_json(404, [
            'ok' => false,
            'error' => 'account_object_claim_not_found',
            'message' => 'Account/object claim was not found',
        ]);
    }

    $agentOrganizationId = is_string($claim['claimant_agent_organization_id'] ?? null)
        ? (string) $claim['claimant_agent_organization_id']
        : null;
    $targetObjectType = is_string($claim['target_object_type'] ?? null) ? (string) $claim['target_object_type'] : '';
    $targetObjectId = is_string($claim['target_object_id'] ?? null) ? (string) $claim['target_object_id'] : '';

    if (in_array($decision, ['approved_linked', 'approved_new_record'], true)) {
        if ($agentOrganizationId === null || $targetObjectType === '' || $targetObjectId === '') {
            api_json(409, [
                'ok' => false,
                'error' => 'agent_claim_target_required_for_approval',
                'message' => 'Approved claims require claimant agent organization, target_object_type and target_object_id',
                'claim' => $claim,
            ]);
        }
        if (!in_array($targetObjectType, cpg_agent_allowed_assignment_object_types(), true)) {
            api_json(409, [
                'ok' => false,
                'error' => 'agent_claim_target_not_assignable',
                'message' => 'The claim target cannot be assigned to an agent organization',
                'claim' => $claim,
            ]);
        }

        $metadata = cpg_agent_json_text_to_object($claim['metadata'] ?? null);
        $authorityDocumentId = cpg_agent_nullable_uuid($body['source_authority_document_id'] ?? ($metadata['source_authority_document_id'] ?? null));
        $authority = cpg_agent_verified_authority_for_claim($agentOrganizationId, $authorityDocumentId, $targetObjectId);
        if ($authority === null) {
            api_json(404, [
                'ok' => false,
                'error' => 'agent_claim_authority_document_not_found',
                'message' => 'Verified authority document for this claim was not found',
                'claim' => $claim,
            ]);
        }

        $authorityScopeObjectId = is_string($authority['authority_scope_object_id'] ?? null)
            ? (string) $authority['authority_scope_object_id']
            : '';
        if ($authorityScopeObjectId !== '' && $authorityScopeObjectId !== $targetObjectId) {
            api_json(409, [
                'ok' => false,
                'error' => 'agent_claim_authority_scope_mismatch',
                'message' => 'Authority document is scoped to a different object',
                'authority' => $authority,
                'claim' => $claim,
            ]);
        }

        $guardRow = array_merge($authority, [
            'assignment_status' => (string) ($authority['document_authority_status'] ?? '') === 'limited' ? 'limited' : 'active',
        ]);
        if (!cpg_agent_management_allowed_status($guardRow)) {
            api_json(409, [
                'ok' => false,
                'error' => 'agent_claim_authority_guard_blocked',
                'message' => 'Claim approval requires verified authority, active agent organization and active assignment status',
                'blocker' => cpg_agent_management_blocker($guardRow),
                'authority' => $authority,
                'claim' => $claim,
            ]);
        }

        $result = cpg_admin_approve_agent_claim_assignment($claim, $authority, $access, $decision, $reviewNote);
        api_json(200, [
            'ok' => true,
            'claim' => $result['claim'],
            'assignment' => $result['assignment'],
            'reassigned_from_assignment_id' => $result['reassigned_from_assignment_id'],
            'management' => cpg_object_management_context($targetObjectType, $targetObjectId),
        ]);
    }

    $row = cpg_fetch_one_assoc(
        "UPDATE crewportglobal.account_object_claims
         SET claim_status = $2,
             reviewed_by_user_id = $3::uuid,
             reviewed_at = now(),
             resolution_note = $4,
             updated_at = now()
         WHERE account_object_claim_id = $1::uuid
         RETURNING account_object_claim_id::text AS claim_id,
                   claim_type,
                   claimant_agent_organization_id::text AS claimant_agent_organization_id,
                   target_object_type,
                   target_object_id::text AS target_object_id,
                   claim_status,
                   linked_assignment_id::text AS linked_assignment_id,
                   reviewed_at::text AS reviewed_at",
        [
            $uuid,
            $decision,
            $access['actor_user_id'] ?? null,
            $reviewNote,
        ]
    );

    cpg_agent_scope_audit_event(
        'agent_account_object_claim_reviewed',
        is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
        $agentOrganizationId,
        null,
        null,
        null,
        $targetObjectType !== '' ? $targetObjectType : null,
        $targetObjectId !== '' ? $targetObjectId : null,
        $claim,
        is_array($row) ? $row : [],
        $reviewNote,
        (string) ($claim['claim_id'] ?? $uuid)
    );

    api_json(200, [
        'ok' => true,
        'claim' => $row,
    ]);
}

function cpg_translation_repo_root(): string {
    return dirname(__DIR__, 6);
}

function cpg_translation_i18n_path(string $fileName): string {
    return cpg_translation_repo_root() . '/projects/crewportglobal/i18n/' . $fileName;
}

function cpg_translation_load_json_object(string $path): array {
    if (!is_file($path)) {
        api_json(500, [
            'ok' => false,
            'error' => 'translation_file_missing',
            'message' => 'Required translation file is not available',
            'path' => basename($path),
        ]);
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) {
        api_json(500, [
            'ok' => false,
            'error' => 'translation_file_invalid',
            'message' => 'Required translation file is not valid JSON',
            'path' => basename($path),
        ]);
    }

    return $decoded;
}

function cpg_translation_save_json_object(string $path, array $payload): void {
    $encoded = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($encoded)) {
        api_json(500, [
            'ok' => false,
            'error' => 'translation_json_encode_failed',
            'message' => 'Translation cache could not be encoded',
        ]);
    }

    if (file_put_contents($path, $encoded . "\n", LOCK_EX) === false) {
        api_json(500, [
            'ok' => false,
            'error' => 'translation_cache_write_failed',
            'message' => 'Translation cache could not be saved',
        ]);
    }
}

function cpg_translation_source_hash(string $text): string {
    $normalized = preg_replace('/\s+/u', ' ', trim($text));
    return hash('sha256', is_string($normalized) ? $normalized : trim($text));
}

function cpg_translation_csv_query(string $key, array $fallback): array {
    $raw = $_GET[$key] ?? null;
    if (!is_string($raw) || trim($raw) === '') {
        return $fallback;
    }

    return array_values(array_filter(array_map(
        static fn(string $item): string => strtolower(trim($item)),
        explode(',', $raw)
    ), static fn(string $item): bool => $item !== ''));
}

function cpg_translation_review_entry_payload(array $entry, string $sourceText): array {
    return [
        'translation_key' => (string) ($entry['translation_key'] ?? ''),
        'source_language' => (string) ($entry['source_language'] ?? 'en'),
        'target_language' => (string) ($entry['target_language'] ?? ''),
        'provider' => (string) ($entry['provider'] ?? ''),
        'provider_version' => (string) ($entry['provider_version'] ?? ''),
        'translation_status' => (string) ($entry['translation_status'] ?? ''),
        'human_review_required' => (bool) ($entry['human_review_required'] ?? false),
        'source_text' => $sourceText,
        'translated_text' => (string) ($entry['translated_text'] ?? ''),
        'source_text_hash' => (string) ($entry['source_text_hash'] ?? ''),
        'reviewed_by_user_id' => is_string($entry['reviewed_by_user_id'] ?? null) ? (string) $entry['reviewed_by_user_id'] : null,
        'reviewed_at' => is_string($entry['reviewed_at'] ?? null) ? (string) $entry['reviewed_at'] : null,
        'review_note' => is_string($entry['review_note'] ?? null) ? (string) $entry['review_note'] : null,
        'corrected_by_user_id' => is_string($entry['corrected_by_user_id'] ?? null) ? (string) $entry['corrected_by_user_id'] : null,
        'corrected_at' => is_string($entry['corrected_at'] ?? null) ? (string) $entry['corrected_at'] : null,
        'updated_at' => is_string($entry['updated_at'] ?? null) ? (string) $entry['updated_at'] : null,
    ];
}

function cpg_translation_append_review_event(array $entry, array $event): array {
    $events = is_array($entry['review_events'] ?? null) ? $entry['review_events'] : [];
    $events[] = $event;
    if (count($events) > 20) {
        $events = array_slice($events, -20);
    }
    $entry['review_events'] = $events;
    return $entry;
}

function cpg_translation_review_queue_rows(
    array $source,
    array $cache,
    array $targets,
    string $provider,
    string $status,
    string $keyFilter
): array {
    $rows = [];
    foreach (($cache['entries'] ?? []) as $entry) {
        if (!is_array($entry)) {
            continue;
        }

        $translationKey = (string) ($entry['translation_key'] ?? '');
        $targetLanguage = strtolower((string) ($entry['target_language'] ?? ''));
        $entryProvider = (string) ($entry['provider'] ?? '');
        $entryStatus = (string) ($entry['translation_status'] ?? '');
        $sourceText = is_string($source[$translationKey] ?? null) ? (string) $source[$translationKey] : '';

        if ($translationKey === '' || $sourceText === '') {
            continue;
        }

        if ($targets !== [] && !in_array($targetLanguage, $targets, true)) {
            continue;
        }

        if ($provider !== 'all' && $entryProvider !== $provider) {
            continue;
        }

        if ($status === 'review_required') {
            if (($entry['human_review_required'] ?? false) !== true || $entryStatus === 'stale') {
                continue;
            }
        } elseif ($status !== 'all' && $entryStatus !== $status) {
            continue;
        }

        if ($keyFilter !== '' && stripos($translationKey, $keyFilter) === false) {
            continue;
        }

        $expectedHash = cpg_translation_source_hash($sourceText);
        if ((string) ($entry['source_text_hash'] ?? '') !== $expectedHash) {
            continue;
        }

        $rows[] = cpg_translation_review_entry_payload($entry, $sourceText);
    }

    usort($rows, static function (array $left, array $right): int {
        return strcmp(
            ($left['target_language'] ?? '') . ':' . ($left['translation_key'] ?? ''),
            ($right['target_language'] ?? '') . ':' . ($right['translation_key'] ?? '')
        );
    });

    return $rows;
}

function handle_get_team_translation_review_queue(): void {
    $access = require_translation_review_access();
    $source = cpg_translation_load_json_object(cpg_translation_i18n_path('en.json'));
    $cache = cpg_translation_load_json_object(cpg_translation_i18n_path('translation-cache.json'));

    $targets = cpg_translation_csv_query('targets', ['ru']);
    $provider = is_string($_GET['provider'] ?? null) && trim((string) $_GET['provider']) !== ''
        ? trim((string) $_GET['provider'])
        : 'google_translate_public';
    $status = is_string($_GET['status'] ?? null) && trim((string) $_GET['status']) !== ''
        ? trim((string) $_GET['status'])
        : 'review_required';
    $keyFilter = is_string($_GET['key'] ?? null) ? trim((string) $_GET['key']) : '';
    $limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
    $offset = max(0, (int) ($_GET['offset'] ?? 0));

    $rows = cpg_translation_review_queue_rows($source, $cache, $targets, $provider, $status, $keyFilter);

    api_json(200, [
        'ok' => true,
        'queue' => array_slice($rows, $offset, $limit),
        'count' => min($limit, max(0, count($rows) - $offset)),
        'total' => count($rows),
        'limit' => $limit,
        'offset' => $offset,
        'targets' => $targets,
        'provider' => $provider,
        'status' => $status,
        'access_model' => operator_access_model($access),
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && (string) $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'generated_at' => gmdate('c'),
    ]);
}

function handle_patch_team_translation_review(): void {
    $access = require_translation_review_access();
    $body = api_decode_json_body();
    $translationKey = is_string($body['translation_key'] ?? null) ? trim((string) $body['translation_key']) : '';
    $targetLanguage = is_string($body['target_language'] ?? null) ? strtolower(trim((string) $body['target_language'])) : '';
    $provider = is_string($body['provider'] ?? null) && trim((string) $body['provider']) !== ''
        ? trim((string) $body['provider'])
        : 'google_translate_public';
    $decision = is_string($body['decision'] ?? null) ? strtolower(trim((string) $body['decision'])) : '';
    $reviewNote = is_string($body['review_note'] ?? null) ? trim((string) $body['review_note']) : null;
    $correctedText = is_string($body['corrected_text'] ?? null) ? trim((string) $body['corrected_text']) : '';

    if ($translationKey === '' || $targetLanguage === '' || !in_array($decision, ['approve', 'reject', 'correct'], true)) {
        api_json(400, [
            'ok' => false,
            'error' => 'invalid_translation_review_payload',
            'message' => 'translation_key, target_language and decision approve/reject/correct are required',
        ]);
    }

    if ($decision === 'correct' && $correctedText === '') {
        api_json(400, [
            'ok' => false,
            'error' => 'translation_correction_text_required',
            'message' => 'corrected_text is required when decision is correct',
        ]);
    }

    if ($correctedText !== '' && mb_strlen($correctedText) > 10000) {
        api_json(400, [
            'ok' => false,
            'error' => 'translation_correction_text_too_long',
            'message' => 'corrected_text must not exceed 10000 characters',
        ]);
    }

    $source = cpg_translation_load_json_object(cpg_translation_i18n_path('en.json'));
    $sourceText = is_string($source[$translationKey] ?? null) ? (string) $source[$translationKey] : '';
    if ($sourceText === '') {
        api_json(404, [
            'ok' => false,
            'error' => 'translation_source_key_not_found',
            'message' => 'Source translation key was not found',
        ]);
    }

    $cachePath = cpg_translation_i18n_path('translation-cache.json');
    $cache = cpg_translation_load_json_object($cachePath);
    $expectedHash = cpg_translation_source_hash($sourceText);
    $updatedEntry = null;
    $now = gmdate('c');
    $actorUserId = is_string($access['actor_user_id'] ?? null) && (string) $access['actor_user_id'] !== ''
        ? (string) $access['actor_user_id']
        : 'temporary_operator_token';

    foreach (($cache['entries'] ?? []) as $index => $entry) {
        if (!is_array($entry)) {
            continue;
        }

        if ((string) ($entry['translation_key'] ?? '') !== $translationKey
            || strtolower((string) ($entry['target_language'] ?? '')) !== $targetLanguage
            || (string) ($entry['provider'] ?? '') !== $provider
            || (string) ($entry['source_text_hash'] ?? '') !== $expectedHash) {
            continue;
        }

        $previousStatus = (string) ($entry['translation_status'] ?? '');
        $previousHumanReviewRequired = (bool) ($entry['human_review_required'] ?? false);
        $previousText = (string) ($entry['translated_text'] ?? '');

        $entry['updated_at'] = $now;
        if ($reviewNote !== null) {
            $entry['review_note'] = mb_substr($reviewNote, 0, 1000);
        }

        if ($decision === 'approve') {
            $entry['reviewed_by_user_id'] = $actorUserId;
            $entry['reviewed_at'] = $now;
            $entry['translation_status'] = 'reviewed';
            $entry['human_review_required'] = false;
        } elseif ($decision === 'reject') {
            $entry['reviewed_by_user_id'] = $actorUserId;
            $entry['reviewed_at'] = $now;
            $entry['translation_status'] = 'rejected';
            $entry['human_review_required'] = true;
        } else {
            $entry['translated_text'] = $correctedText;
            $entry['translation_status'] = 'corrected_pending_review';
            $entry['human_review_required'] = true;
            $entry['corrected_by_user_id'] = $actorUserId;
            $entry['corrected_at'] = $now;
            $entry['reviewed_by_user_id'] = null;
            $entry['reviewed_at'] = null;
            $entry['previous_machine_text'] = $previousText;
        }

        $event = [
            'event_type' => $decision,
            'actor_user_id' => $actorUserId,
            'occurred_at' => $now,
            'previous_status' => $previousStatus,
            'previous_human_review_required' => $previousHumanReviewRequired,
            'next_status' => (string) ($entry['translation_status'] ?? ''),
            'next_human_review_required' => (bool) ($entry['human_review_required'] ?? false),
        ];
        if ($reviewNote !== null && $reviewNote !== '') {
            $event['review_note'] = mb_substr($reviewNote, 0, 1000);
        }
        if ($decision === 'correct') {
            $event['previous_text_hash'] = cpg_translation_source_hash($previousText);
            $event['corrected_text_hash'] = cpg_translation_source_hash($correctedText);
        }
        $entry = cpg_translation_append_review_event($entry, $event);

        $cache['entries'][$index] = $entry;
        $updatedEntry = cpg_translation_review_entry_payload($entry, $sourceText);
        break;
    }

    if (!is_array($updatedEntry)) {
        api_json(404, [
            'ok' => false,
            'error' => 'translation_review_entry_not_found',
            'message' => 'Matching translation cache entry was not found',
        ]);
    }

    cpg_translation_save_json_object($cachePath, $cache);

    api_json(200, [
        'ok' => true,
        'entry' => $updatedEntry,
        'decision' => $decision,
        'access_model' => operator_access_model($access),
        'actor_user_id' => $actorUserId,
    ]);
}

function cpg_team_workbench_task_id(array $operation, array $context): string {
    $parts = [
        $operation['operation_code'] ?? 'operation',
        $operation['record_type'] ?? ($context['queue_type'] ?? ($context['record_type'] ?? 'record')),
        $operation['record_id'] ?? ($context['queue_item_id'] ?? ($context['shortlist_draft_id'] ?? ($context['record_id'] ?? 'unknown'))),
    ];
    return preg_replace('/[^a-zA-Z0-9_.:-]+/', '_', implode(':', array_map(static fn($value): string => (string) $value, $parts))) ?: 'computed_task';
}

function cpg_team_workbench_action_url(string $baseUrl, array $operation, array $context): string {
    $params = [];
    $operationCode = is_string($operation['operation_code'] ?? null) ? trim((string) $operation['operation_code']) : '';
    $queueType = is_string($context['queue_type'] ?? null) ? trim((string) $context['queue_type']) : '';
    $queueItemId = is_string($context['queue_item_id'] ?? null) ? trim((string) $context['queue_item_id']) : '';

    if ($operationCode === 'create_internal_shortlist_draft' && $queueType === 'vacancy_request' && $queueItemId !== '') {
        return $baseUrl . '?' . http_build_query([
            'vacancy_request_id' => $queueItemId,
        ]);
    }

    if ($operationCode !== '') {
        $params['task_operation'] = $operationCode;
    }

    $shortlistDraftId = is_string($context['shortlist_draft_id'] ?? null) ? trim((string) $context['shortlist_draft_id']) : '';
    if ($shortlistDraftId !== '') {
        $params['shortlist_draft_id'] = $shortlistDraftId;
    } else {
        if ($queueType !== '') {
            $params['queue_type'] = $queueType;
        }
        if ($queueItemId !== '') {
            $params['queue_item_id'] = $queueItemId;
        }

        $recordType = is_string($operation['record_type'] ?? null)
            ? trim((string) $operation['record_type'])
            : (is_string($context['record_type'] ?? null) ? trim((string) $context['record_type']) : '');
        $recordId = is_string($operation['record_id'] ?? null)
            ? trim((string) $operation['record_id'])
            : (is_string($context['record_id'] ?? null) ? trim((string) $context['record_id']) : '');
        if ($recordType !== '' && !isset($params['queue_type'])) {
            $params['record_type'] = $recordType;
        }
        if ($recordId !== '' && !isset($params['queue_item_id'])) {
            $params['record_id'] = $recordId;
        }
    }

    return $params === [] ? $baseUrl : $baseUrl . '?' . http_build_query($params);
}

function cpg_team_workbench_task_from_operation(
    array $operation,
    string $taskType,
    string $title,
    string $summary,
    string $actionUrl,
    array $context = []
): ?array {
    $requiredAccess = is_array($operation['required_access'] ?? null) ? $operation['required_access'] : [];
    if (($requiredAccess['allowed'] ?? false) !== true) {
        return null;
    }
    if (($operation['operation_status'] ?? null) !== 'available' || ($operation['is_executable'] ?? false) !== true) {
        return null;
    }

    $assignment = cpg_team_workbench_task_assignment($operation, $context);
    $context = cpg_team_workbench_context_with_assignment($context, $assignment);
    $management = cpg_team_workbench_management_context($operation, $context);
    $context['management'] = $management;

    return cpg_workspace_clean_record([
        'task_type' => $taskType,
        'task_status' => $operation['operation_status'] ?? 'blocked',
        'operation_code' => $operation['operation_code'] ?? null,
        'is_executable' => ($operation['is_executable'] ?? false) === true,
        'task_id' => cpg_team_workbench_task_id($operation, $context),
        'title' => $title,
        'summary' => $summary,
        'action_url' => cpg_team_workbench_action_url($actionUrl, $operation, $context),
        'target_url' => cpg_team_workbench_action_url($actionUrl, $operation, $context),
        'record_type' => $operation['record_type'] ?? ($context['record_type'] ?? null),
        'record_id' => $operation['record_id'] ?? ($context['record_id'] ?? null),
        'current_status' => $operation['current_status'] ?? ($context['current_status'] ?? null),
        'next_status_if_executed' => $operation['next_status_if_executed'] ?? null,
        'responsible_group_after_transition' => $operation['responsible_group_after_transition'] ?? null,
        'required_access' => $requiredAccess,
        'assignment' => $assignment,
        'management' => $management,
        'blockers' => is_array($operation['blockers'] ?? null) ? $operation['blockers'] : [],
        'computed_from' => $operation['computed_from'] ?? 'current_data_state',
        'context' => $context,
    ]);
}

function cpg_team_workbench_context_with_assignment(array $context, array $assignment): array {
    $context['assigned_group_code'] = $assignment['assigned_group_code'] ?? null;
    $context['assignment_mode'] = $assignment['assignment_mode'] ?? 'group_queue';
    $context['assignment_reason'] = $assignment['assignment_reason'] ?? null;
    $context['assignment_source'] = $assignment['assignment_source'] ?? 'computed_from_history';

    if (is_string($assignment['assigned_user_id'] ?? null) && $assignment['assigned_user_id'] !== '') {
        $context['assigned_user_id'] = (string) $assignment['assigned_user_id'];
    }
    if (is_string($assignment['assigned_user_label'] ?? null) && $assignment['assigned_user_label'] !== '') {
        $context['assigned_user_label'] = (string) $assignment['assigned_user_label'];
    }
    if (is_string($assignment['source_event_type'] ?? null) && $assignment['source_event_type'] !== '') {
        $context['assignment_source_event_type'] = (string) $assignment['source_event_type'];
    }
    if (is_string($assignment['source_operation_code'] ?? null) && $assignment['source_operation_code'] !== '') {
        $context['assignment_source_operation_code'] = (string) $assignment['source_operation_code'];
    }

    return $context;
}

function cpg_team_workbench_task_assignment(array $operation, array $context): array {
    $requiredAccess = is_array($operation['required_access'] ?? null) ? $operation['required_access'] : [];
    $targetGroup = is_string($requiredAccess['target_group_code'] ?? null)
        ? trim((string) $requiredAccess['target_group_code'])
        : '';
    if ($targetGroup === '') {
        return [
            'assignment_mode' => 'group_queue',
            'assignment_reason' => 'target_group_not_defined',
            'assigned_group_code' => null,
            'assignment_source' => 'computed_from_history',
        ];
    }

    $patterns = cpg_team_workbench_assignment_patterns($operation, $context);
    $historicalAssignee = cpg_team_workbench_historical_assignee($targetGroup, $patterns);
    if ($historicalAssignee !== null) {
        return $historicalAssignee;
    }

    return [
        'assignment_mode' => 'group_queue',
        'assignment_reason' => $patterns === []
            ? 'no_object_reference_for_assignment'
            : 'no_active_historical_executor_for_object_group',
        'assigned_group_code' => $targetGroup,
        'assignment_source' => 'computed_from_history',
        'assignment_object_patterns' => array_keys($patterns),
    ];
}

function cpg_team_workbench_assignment_patterns(array $operation, array $context): array {
    $patterns = [];
    $addPattern = static function (array $pattern) use (&$patterns): void {
        $json = json_encode($pattern, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (is_string($json) && $json !== '') {
            $patterns[$json] = $json;
        }
    };
    $addKey = static function (string $key, mixed $value) use ($addPattern): void {
        if (!is_string($value) || trim($value) === '') {
            return;
        }
        $addPattern([$key => trim($value)]);
    };

    $recordType = is_string($operation['record_type'] ?? null)
        ? (string) $operation['record_type']
        : (is_string($context['record_type'] ?? null) ? (string) $context['record_type'] : '');
    $recordId = is_string($operation['record_id'] ?? null)
        ? (string) $operation['record_id']
        : (is_string($context['record_id'] ?? null) ? (string) $context['record_id'] : '');
    $queueType = is_string($context['queue_type'] ?? null) ? (string) $context['queue_type'] : '';
    $queueItemId = is_string($context['queue_item_id'] ?? null) ? (string) $context['queue_item_id'] : '';

    if ($recordId !== '') {
        $addKey('record_id', $recordId);
        if ($recordType === 'vacancy_request' || $recordType === 'vacancy_deletion_request') {
            $addKey('vacancy_request_id', $recordId);
        } elseif ($recordType === 'operator_shortlist_draft') {
            $addKey('shortlist_draft_id', $recordId);
        } elseif ($recordType === 'vacancy_application') {
            $addKey('vacancy_application_id', $recordId);
            $addPattern(['applications' => [['vacancy_application_id' => $recordId]]]);
        }
    }

    if ($queueItemId !== '') {
        $addKey('queue_item_id', $queueItemId);
        if ($queueType === 'vacancy_request') {
            $addKey('vacancy_request_id', $queueItemId);
        } elseif ($queueType === 'vacancy_application') {
            $addKey('vacancy_application_id', $queueItemId);
            $addPattern(['applications' => [['vacancy_application_id' => $queueItemId]]]);
        }
    }

    foreach ([
        'vacancy_request_id',
        'shortlist_draft_id',
        'vacancy_application_id',
        'candidate_user_id',
        'seafarer_profile_id',
        'seafarer_user_id',
        'vessel_id',
        'company_id',
        'draft_id',
    ] as $key) {
        $addKey($key, $context[$key] ?? null);
        $addKey($key, $operation[$key] ?? null);
    }

    if (is_string($context['vacancy_application_id'] ?? null) && $context['vacancy_application_id'] !== '') {
        $addPattern(['applications' => [['vacancy_application_id' => (string) $context['vacancy_application_id']]]]);
    }

    return $patterns;
}

function cpg_team_workbench_historical_assignee(string $targetGroup, array $patterns): ?array {
    if ($targetGroup === '' || $patterns === []) {
        return null;
    }

    $params = [$targetGroup];
    $patternClauses = [];
    foreach (array_values($patterns) as $pattern) {
        $params[] = $pattern;
        $patternClauses[] = 'rae.event_payload @> $' . count($params) . '::jsonb';
    }

    $row = cpg_fetch_one_assoc(
        "SELECT rae.registration_audit_event_id::text AS source_event_id,
                rae.event_type AS source_event_type,
                rae.created_at::text AS source_event_created_at,
                COALESCE(NULLIF(u.display_name, ''), lower(u.email)) AS assigned_user_label,
                u.user_id::text AS assigned_user_id,
                rae.event_payload->'actor_context'->>'operation_code' AS source_operation_code
         FROM crewportglobal.registration_audit_events rae
         JOIN crewportglobal.users u
           ON u.user_id::text = COALESCE(
                NULLIF(rae.event_payload->'actor_context'->>'actor_user_id', ''),
                rae.actor_user_id::text
              )
          AND u.is_active IS TRUE
         JOIN crewportglobal.access_groups ag
           ON ag.group_code = $1
          AND ag.is_active IS TRUE
         JOIN crewportglobal.access_group_members agm
           ON agm.group_id = ag.group_id
          AND agm.user_id = u.user_id
          AND agm.membership_state = 'active'
         WHERE rae.event_payload @> jsonb_build_object('actor_context', jsonb_build_object('target_group_code', $1::text))
           AND (" . implode(' OR ', $patternClauses) . ")
         ORDER BY rae.created_at DESC, rae.registration_audit_event_id DESC
         LIMIT 1",
        $params
    );

    if ($row === null) {
        return null;
    }

    return [
        'assignment_mode' => 'historical_active_executor',
        'assignment_reason' => 'active_employee_previously_completed_group_task_for_object',
        'assigned_group_code' => $targetGroup,
        'assigned_user_id' => $row['assigned_user_id'] ?? null,
        'assigned_user_label' => $row['assigned_user_label'] ?? null,
        'assignment_source' => 'computed_from_history',
        'source_event_id' => $row['source_event_id'] ?? null,
        'source_event_type' => $row['source_event_type'] ?? null,
        'source_event_created_at' => $row['source_event_created_at'] ?? null,
        'source_operation_code' => $row['source_operation_code'] ?? null,
        'assignment_object_patterns' => array_keys($patterns),
    ];
}

function cpg_operator_active_shortlist_draft_for_vacancy(string $vacancyRequestId): ?array {
    if ($vacancyRequestId === '' || !cpg_operator_shortlist_tables_ready()) {
        return null;
    }

    $row = cpg_fetch_one_assoc(
        "SELECT shortlist_draft_id::text AS shortlist_draft_id,
                draft_status,
                updated_at::text AS updated_at
         FROM crewportglobal.operator_shortlist_drafts
         WHERE vacancy_request_id = $1::uuid
           AND employer_visible IS FALSE
           AND archived_at IS NULL
           AND draft_status IN ('needs_review', 'approved_internal')
         ORDER BY updated_at DESC
         LIMIT 1",
        [$vacancyRequestId]
    );

    return is_array($row) ? $row : null;
}

function cpg_team_workbench_queue_tasks(array $access): array {
    $tasks = [];
    foreach (read_operator_review_queue($access) as $item) {
        $queueType = is_string($item['queue_type'] ?? null) ? (string) $item['queue_type'] : '';
        $queueItemId = is_string($item['queue_item_id'] ?? null) ? (string) $item['queue_item_id'] : '';
        $summary = is_array($item['summary'] ?? null) ? $item['summary'] : [];
        $title = is_string($summary['vacancy_title'] ?? null) && trim((string) $summary['vacancy_title']) !== ''
            ? trim((string) $summary['vacancy_title'])
            : (is_string($item['full_name'] ?? null) ? (string) $item['full_name'] : $queueType);
        $status = is_string($item['status'] ?? null) ? (string) $item['status'] : '';

        if ($queueType === 'seafarer_profile' && $queueItemId !== '') {
            if (!in_array($status, ['submitted_for_human_review', 'in_review'], true)) {
                continue;
            }

            $operation = operator_computed_workflow_operation(
                'review_seafarer_profile_completeness',
                true,
                [],
                [
                    'record_type' => 'seafarer_profile',
                    'record_id' => $queueItemId,
                    'current_status' => $status,
                    'next_status_if_executed' => 'in_review',
                    'responsible_group_after_transition' => 'verification_team',
                    'computed_from' => 'operator_review_queue_seafarer_profile',
                ],
                $access
            );
            $task = cpg_team_workbench_task_from_operation(
                $operation,
                'seafarer_supply_review',
                'Review seafarer profile completeness',
                $title,
                '/verify/',
                [
                    'queue_type' => $queueType,
                    'queue_item_id' => $queueItemId,
                    'seafarer_profile_id' => $queueItemId,
                    'draft_id' => $item['draft_id'] ?? null,
                    'status' => $status,
                    'rank' => $summary['primary_rank'] ?? null,
                    'department' => $summary['department'] ?? null,
                    'availability_status' => $summary['availability_status'] ?? null,
                ]
            );
            if ($task !== null) {
                $tasks[] = $task;
            }
            continue;
        }

        if ($queueType === 'company_verification' && $queueItemId !== '') {
            if ($status !== 'submitted') {
                continue;
            }

            $operation = operator_computed_workflow_operation(
                'review_company_verification',
                true,
                [],
                [
                    'record_type' => 'company_verification',
                    'record_id' => $queueItemId,
                    'current_status' => $status,
                    'next_status_if_executed' => 'submitted',
                    'responsible_group_after_transition' => 'verification_team',
                    'computed_from' => 'operator_review_queue_company_verification',
                ],
                $access
            );
            $task = cpg_team_workbench_task_from_operation(
                $operation,
                'company_authority_review',
                'Review company verification',
                is_string($summary['company_name'] ?? null) && trim((string) $summary['company_name']) !== ''
                    ? trim((string) $summary['company_name'])
                    : $title,
                '/verify/',
                [
                    'queue_type' => $queueType,
                    'queue_item_id' => $queueItemId,
                    'company_id' => $queueItemId,
                    'draft_id' => $item['draft_id'] ?? null,
                    'status' => $status,
                    'company_name' => $summary['company_name'] ?? null,
                    'company_type' => $summary['company_type'] ?? null,
                    'country_code' => $summary['country_code'] ?? null,
                    'role_in_company' => $summary['role_in_company'] ?? null,
                ]
            );
            if ($task !== null) {
                $tasks[] = $task;
            }
            continue;
        }

        if ($queueType === 'vacancy_request' && $queueItemId !== '') {
            if (!in_array($status, ['submitted_for_human_review', 'in_review', 'published'], true)) {
                continue;
            }

            if (cpg_operator_active_shortlist_draft_for_vacancy($queueItemId) !== null) {
                continue;
            }

            $operation = operator_computed_workflow_operation(
                'create_internal_shortlist_draft',
                true,
                [],
                [
                    'record_type' => 'vacancy_request',
                    'record_id' => $queueItemId,
                    'current_status' => $item['status'] ?? null,
                    'next_record_type_if_executed' => 'operator_shortlist_draft',
                    'next_status_if_executed' => 'needs_review',
                    'responsible_group_after_transition' => 'review_team',
                    'computed_from' => 'operator_review_queue_vacancy_request',
                ],
                $access
            );
            $task = cpg_team_workbench_task_from_operation(
                $operation,
                'demand_candidate_search',
                'Run candidate search',
                $title,
                '/team/matching/',
                [
                    'queue_type' => $queueType,
                    'queue_item_id' => $queueItemId,
                    'status' => $item['status'] ?? null,
                    'company_name' => $summary['company_name'] ?? null,
                    'vessel_name' => $summary['vessel_name'] ?? null,
                ]
            );
            if ($task !== null) {
                $tasks[] = $task;
            }
            continue;
        }

        if ($queueType === 'vacancy_application' && $queueItemId !== '') {
            $detail = read_operator_vacancy_application_detail($queueItemId, $access);
            if ($detail === null) {
                continue;
            }
            $operations = is_array($detail['computed_operations'] ?? null) ? $detail['computed_operations'] : [];
            foreach ($operations as $operation) {
                if (!is_array($operation) || ($operation['operation_code'] ?? null) !== 'review_candidate_presentation') {
                    continue;
                }
                $requestSource = is_string($summary['request_source'] ?? null) ? (string) $summary['request_source'] : '';
                $isIncomingSeafarerRequest = $requestSource === 'seafarer_initiated_request';
                $task = cpg_team_workbench_task_from_operation(
                    $operation,
                    $isIncomingSeafarerRequest ? 'incoming_seafarer_request_review' : 'candidate_presentation_review',
                    $isIncomingSeafarerRequest ? 'Review incoming seafarer request' : 'Review candidate presentation',
                    $title,
                    '/verify/',
                    [
                        'queue_type' => $queueType,
                        'queue_item_id' => $queueItemId,
                        'status' => $item['status'] ?? null,
                        'candidate_rank' => $summary['candidate_rank'] ?? null,
                        'vacancy_rank' => $summary['vacancy_rank'] ?? null,
                        'request_source' => $requestSource,
                        'review_handoff' => $isIncomingSeafarerRequest
                            ? 'release_incoming_request_to_presented_candidate'
                            : 'approve_candidate_presentation',
                    ]
                );
                if ($task !== null) {
                    $tasks[] = $task;
                }
            }
        }
    }

    return $tasks;
}

function cpg_team_workbench_shortlist_tasks(array $access): array {
    if (!cpg_operator_shortlist_tables_ready()) {
        return [];
    }

    $rows = cpg_fetch_all_assoc(
        "SELECT osd.shortlist_draft_id::text AS shortlist_draft_id,
                osd.vacancy_request_id::text AS vacancy_request_id,
                osd.draft_status,
                osd.updated_at::text AS updated_at,
                vr.vacancy_title,
                vr.rank,
                vr.department,
                ec.company_name
         FROM crewportglobal.operator_shortlist_drafts osd
         JOIN crewportglobal.vacancy_requests vr
           ON vr.vacancy_request_id = osd.vacancy_request_id
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = vr.company_id
         WHERE osd.employer_visible IS FALSE
           AND osd.archived_at IS NULL
           AND osd.draft_status IN ('needs_review', 'approved_internal')
         ORDER BY osd.updated_at DESC
         LIMIT 100",
        []
    );

    $tasks = [];
    foreach ($rows as $row) {
        $draftId = is_string($row['shortlist_draft_id'] ?? null) ? (string) $row['shortlist_draft_id'] : '';
        if ($draftId === '') {
            continue;
        }
        $draft = cpg_operator_shortlist_read($draftId);
        if ($draft === null) {
            continue;
        }

        $internalApprovalGuard = cpg_operator_shortlist_internal_approval_guard($draft);
        $reviewApplicationGuard = cpg_operator_shortlist_review_application_guard($draft);
        $operations = cpg_operator_shortlist_computed_operations($draft, $internalApprovalGuard, $reviewApplicationGuard, $access);
        foreach ($operations as $operation) {
            if (!is_array($operation)) {
                continue;
            }
            $operationCode = is_string($operation['operation_code'] ?? null) ? (string) $operation['operation_code'] : '';
            $label = $operationCode === 'approve_internal_shortlist'
                ? 'Approve internal shortlist'
                : ($operationCode === 'create_review_applications' ? 'Create review applications' : 'Review shortlist draft');
            $task = cpg_team_workbench_task_from_operation(
                $operation,
                'internal_shortlist_workflow',
                $label,
                is_string($row['vacancy_title'] ?? null) ? (string) $row['vacancy_title'] : 'Internal shortlist',
                '/verify/',
                [
                    'shortlist_draft_id' => $draftId,
                    'vacancy_request_id' => $row['vacancy_request_id'] ?? null,
                    'draft_status' => $row['draft_status'] ?? null,
                    'company_name' => $row['company_name'] ?? null,
                    'rank' => $row['rank'] ?? null,
                    'department' => $row['department'] ?? null,
                    'included_candidate_count' => $reviewApplicationGuard['included_candidate_count'] ?? null,
                ]
            );
            if ($task !== null) {
                $tasks[] = $task;
            }
        }
    }

    return $tasks;
}

function cpg_team_workbench_deletion_confirmation_tasks(array $access): array {
    $rows = cpg_fetch_all_assoc(
        "SELECT vr.vacancy_request_id::text AS vacancy_request_id,
                vr.publication_status,
                vr.vacancy_title,
                vr.rank,
                vr.department,
                vr.demand_workspace,
                vr.updated_at::text AS updated_at,
                ec.company_name,
                v.vessel_name
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v
           ON v.vessel_id = vr.vessel_id
         WHERE COALESCE(vr.demand_workspace->'deletion_request'->>'status', '') = 'pending_manager_confirmation'
           AND COALESCE(vr.demand_workspace->'deletion_request'->>'manager_confirmation_status', '') = 'pending'
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 100",
        []
    );

    $tasks = [];
    foreach ($rows as $row) {
        $vacancyRequestId = is_string($row['vacancy_request_id'] ?? null) ? (string) $row['vacancy_request_id'] : '';
        if ($vacancyRequestId === '') {
            continue;
        }

        $workspace = cpg_decode_json_object(is_string($row['demand_workspace'] ?? null) ? (string) $row['demand_workspace'] : null);
        $deletionRequest = is_array($workspace['deletion_request'] ?? null) ? $workspace['deletion_request'] : [];
        $operation = operator_computed_workflow_operation(
            'confirm_vacancy_deletion',
            true,
            [],
            [
                'record_type' => 'vacancy_deletion_request',
                'record_id' => $vacancyRequestId,
                'current_status' => $deletionRequest['manager_confirmation_status'] ?? 'pending',
                'next_status_if_executed' => 'confirmed',
                'responsible_group_after_transition' => null,
                'computed_from' => 'vacancy_deletion_request_pending_manager_confirmation',
            ],
            $access
        );

        $title = is_string($row['vacancy_title'] ?? null) && trim((string) $row['vacancy_title']) !== ''
            ? trim((string) $row['vacancy_title'])
            : 'Vacancy deletion request';
        $summaryParts = array_filter([
            is_string($row['company_name'] ?? null) ? (string) $row['company_name'] : null,
            is_string($row['vessel_name'] ?? null) ? (string) $row['vessel_name'] : null,
            is_string($deletionRequest['requested_by'] ?? null) ? 'requested by ' . (string) $deletionRequest['requested_by'] : null,
        ]);

        $task = cpg_team_workbench_task_from_operation(
            $operation,
            'vacancy_deletion_confirmation',
            'Confirm vacancy deletion',
            $title,
            '/verify/',
            [
                'record_type' => 'vacancy_deletion_request',
                'record_id' => $vacancyRequestId,
                'vacancy_request_id' => $vacancyRequestId,
                'status' => $row['publication_status'] ?? null,
                'company_name' => $row['company_name'] ?? null,
                'vessel_name' => $row['vessel_name'] ?? null,
                'rank' => $row['rank'] ?? null,
                'department' => $row['department'] ?? null,
                'summary' => $summaryParts === [] ? null : implode(' | ', $summaryParts),
                'deletion_request_status' => $deletionRequest['status'] ?? null,
                'manager_confirmation_status' => $deletionRequest['manager_confirmation_status'] ?? null,
                'requested_by' => $deletionRequest['requested_by'] ?? null,
                'requested_at' => $deletionRequest['requested_at'] ?? null,
            ]
        );
        if ($task !== null) {
            $tasks[] = $task;
        }
    }

    return $tasks;
}

function cpg_team_workbench_tasks(array $access): array {
    $tasks = array_merge(
        cpg_team_workbench_queue_tasks($access),
        cpg_team_workbench_shortlist_tasks($access),
        cpg_team_workbench_deletion_confirmation_tasks($access)
    );

    usort($tasks, static function (array $left, array $right): int {
        $leftReady = ($left['task_status'] ?? '') === 'available' ? 0 : 1;
        $rightReady = ($right['task_status'] ?? '') === 'available' ? 0 : 1;
        if ($leftReady !== $rightReady) {
            return $leftReady <=> $rightReady;
        }

        return strcmp((string) ($left['summary'] ?? ''), (string) ($right['summary'] ?? ''));
    });

    return $tasks;
}

function handle_get_team_workbench_tasks(): void {
    $access = require_team_workbench_access();
    $tasks = cpg_team_workbench_tasks($access);

    api_json(200, [
        'ok' => true,
        'task_model' => 'data_derived_current_state',
        'task_assignment_model' => 'historical_active_executor_or_group_queue',
        'persisted_task_table_created' => false,
        'access_model' => operator_access_model($access),
        'actor_user_id' => is_string($access['actor_user_id'] ?? null) && $access['actor_user_id'] !== ''
            ? (string) $access['actor_user_id']
            : null,
        'user' => [
            'user_id' => is_string($access['actor_user_id'] ?? null) ? (string) $access['actor_user_id'] : null,
            'email' => is_string($access['actor_label'] ?? null) ? (string) $access['actor_label'] : null,
            'groups' => operator_access_string_list($access, 'groups'),
            'roles' => operator_access_string_list($access, 'roles'),
            'permissions' => operator_access_string_list($access, 'permissions'),
        ],
        'queue_permissions' => [
            'seafarer_profile' => operator_queue_access_contract('seafarer_profile', $access),
            'company_verification' => operator_queue_access_contract('company_verification', $access),
            'vacancy_request' => operator_queue_access_contract('vacancy_request', $access),
            'vacancy_application' => operator_queue_access_contract('vacancy_application', $access),
        ],
        'tasks' => $tasks,
        'count' => count($tasks),
        'generated_at' => gmdate('c'),
    ]);
}

function read_operator_document_review_queue(): array {
    $result = api_query(
        "SELECT
            ud.document_id::text AS document_id,
            ud.draft_id::text AS draft_id,
            ud.form_type,
            ud.document_type,
            ud.original_filename,
            ud.file_size_bytes,
            ud.scan_status,
            ud.review_status,
            ud.uploaded_at::text AS uploaded_at,
            lower(u.email) AS email,
            u.display_name
         FROM crewportglobal.uploaded_documents ud
         LEFT JOIN crewportglobal.users u ON u.user_id = ud.draft_id
         WHERE ud.scan_status = 'clean'
           AND ud.review_status IN ('pending_human_review', 'under_review', 'correction_requested')
           AND ud.hidden_from_user_at IS NULL
           AND ud.upload_state = 'stored_protected'
         ORDER BY ud.uploaded_at DESC
         LIMIT 300"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'document_id' => $row['document_id'],
            'draft_id' => $row['draft_id'],
            'form_type' => $row['form_type'],
            'document_type' => $row['document_type'],
            'original_filename' => $row['original_filename'],
            'file_size_bytes' => (int) $row['file_size_bytes'],
            'scan_status' => $row['scan_status'],
            'review_status' => $row['review_status'],
            'uploaded_at' => $row['uploaded_at'],
            'user' => [
                'email' => $row['email'],
                'display_name' => $row['display_name'],
            ],
        ];
    }

    return $items;
}

function handle_get_operator_document_review_queue(array $access): void {
    $queue = read_operator_document_review_queue();
    api_json(200, [
        'ok' => true,
        'queue' => $queue,
        'count' => count($queue),
        'access_model' => $access['access_model'] ?? 'operator_or_team',
        'generated_at' => gmdate('c'),
    ]);
}

function read_uploaded_document_private_row(string $documentId): ?array {
    $result = api_query(
        "SELECT
            ud.document_id::text AS document_id,
            ud.draft_id::text AS draft_id,
            ud.form_type,
            ud.document_type,
            ud.original_filename,
            ud.stored_filename,
            ud.storage_root,
            ud.storage_path,
            ud.mime_type,
            ud.file_size_bytes,
            ud.scan_status,
            ud.review_status,
            ud.review_note,
            ud.upload_state,
            ud.uploaded_at::text AS uploaded_at,
            lower(u.email) AS email,
            u.display_name
         FROM crewportglobal.uploaded_documents ud
         LEFT JOIN crewportglobal.users u ON u.user_id = ud.draft_id
         WHERE ud.document_id = $1::uuid
         LIMIT 1",
        [$documentId]
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? $row : null;
}

function ensure_document_clean_for_operator(array $document): void {
    if (($document['scan_status'] ?? '') !== 'clean') {
        api_error(403, 'document_not_clean', 'Only clean scanned documents can be opened for review');
    }
    if (($document['upload_state'] ?? '') !== 'stored_protected') {
        api_error(403, 'document_not_available', 'Document is not available from protected storage');
    }
}

function document_review_audit_payload(array $document, array $extra = []): array {
    $payload = array_merge([
        'document_id' => $document['document_id'],
        'draft_id' => $document['draft_id'],
        'form_type' => $document['form_type'],
        'document_type' => $document['document_type'],
        'scan_status' => $document['scan_status'],
    ], $extra);
    if (($payload['review_note'] ?? null) === null) {
        unset($payload['review_note']);
    }

    return $payload;
}

function write_document_review_audit(string $eventType, array $document, array $payload): void {
    write_audit_event(
        $eventType,
        (string) $document['draft_id'],
        null,
        null,
        $payload,
        'operator_document_review'
    );
}

function safe_download_filename(string $originalFilename, string $documentId): string {
    $filename = cpg_document_clean_original_filename($originalFilename);
    if ($filename === 'uploaded-document') {
        return $documentId . '.bin';
    }

    return $filename;
}

function handle_get_operator_document_download(string $documentId, array $access): void {
    $uuid = api_normalize_uuid($documentId);
    if ($uuid === null) {
        api_error(400, 'invalid_document_id', 'document_id must be a valid UUID');
    }

    $document = read_uploaded_document_private_row($uuid);
    if ($document === null) {
        api_error(404, 'document_not_found', 'Uploaded document was not found');
    }

    ensure_document_clean_for_operator($document);

    $storageRoot = rtrim((string) $document['storage_root'], '/');
    $storagePath = ltrim((string) $document['storage_path'], '/');
    $rootPath = realpath($storageRoot);
    $filePath = realpath($storageRoot . '/' . $storagePath);
    if ($rootPath === false || $filePath === false || !str_starts_with($filePath, $rootPath . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
        api_error(404, 'document_file_not_found', 'Protected document file was not found');
    }

    write_document_review_audit('document_viewed', $document, document_review_audit_payload($document, [
        'previous_review_status' => $document['review_status'],
        'new_review_status' => $document['review_status'],
        'decision' => 'download',
        'access_model' => $access['access_model'] ?? null,
    ]));

    $downloadName = safe_download_filename((string) $document['original_filename'], $uuid);
    $quotedName = addcslashes($downloadName, "\\\"");
    header('Content-Type: ' . (string) $document['mime_type']);
    header('Content-Length: ' . (string) filesize($filePath));
    header('Content-Disposition: attachment; filename="' . $quotedName . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store, private');
    readfile($filePath);
    exit;
}

function normalize_document_review_decision(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $decision = trim(strtolower($value));
    return in_array($decision, ['start_review', 'accept', 'needs_correction', 'reject'], true) ? $decision : null;
}

function document_review_status_for_decision(string $decision): string {
    return match ($decision) {
        'start_review' => 'under_review',
        'accept' => 'verified',
        'needs_correction' => 'correction_requested',
        'reject' => 'rejected',
    };
}

function handle_patch_operator_document_review(string $documentId, array $access): void {
    $uuid = api_normalize_uuid($documentId);
    if ($uuid === null) {
        api_error(400, 'invalid_document_id', 'document_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $decision = normalize_document_review_decision($body['decision'] ?? $body['action'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, accept, needs_correction, reject');
    }

    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['review_note'] ?? null);
    if (($decision === 'needs_correction' || $decision === 'reject') && $reviewNote === null) {
        api_error(400, 'review_note_required', 'review_note is required for needs_correction and reject');
    }

    api_tx_begin();
    try {
        $document = read_uploaded_document_private_row($uuid);
        if ($document === null) {
            api_tx_rollback();
            api_error(404, 'document_not_found', 'Uploaded document was not found');
        }
        if (($document['scan_status'] ?? '') !== 'clean') {
            api_tx_rollback();
            api_error(403, 'document_not_clean', 'Only clean scanned documents can be reviewed');
        }
        if (($document['upload_state'] ?? '') !== 'stored_protected') {
            api_tx_rollback();
            api_error(403, 'document_not_available', 'Document is not available from protected storage');
        }

        $previousStatus = (string) $document['review_status'];
        $newStatus = document_review_status_for_decision($decision);
        $effectiveNote = $reviewNote;

        $result = api_query(
            'UPDATE crewportglobal.uploaded_documents
             SET review_status = $2,
                 review_note = CASE WHEN $3::text IS NULL THEN review_note ELSE $3 END,
                 reviewed_by_user_id = CASE WHEN $4::uuid IS NULL THEN reviewed_by_user_id ELSE $4::uuid END,
                 reviewed_at = now(),
                 updated_at = now()
             WHERE document_id = $1::uuid
             RETURNING document_id::text AS document_id,
                       draft_id::text AS draft_id,
                       form_type,
                       document_type,
                       original_filename,
                       file_size_bytes,
                       scan_status,
                       review_status,
                       review_note,
                       uploaded_at::text AS uploaded_at',
            [
                $uuid,
                $newStatus,
                $effectiveNote,
                api_normalize_uuid((string) ($access['actor_user_id'] ?? '')),
            ]
        );
        $updated = pg_fetch_assoc($result);
        if (!is_array($updated)) {
            api_tx_rollback();
            api_error(500, 'document_review_update_failed', 'Unable to update document review status');
        }

        write_document_review_audit('document_review_decision_recorded', $document, document_review_audit_payload($document, [
            'previous_review_status' => $previousStatus,
            'new_review_status' => $newStatus,
            'decision' => $decision,
            'review_note' => $reviewNote,
            'access_model' => $access['access_model'] ?? null,
        ]));

        api_tx_commit();
        api_json(200, [
            'ok' => true,
            'document' => [
                'document_id' => $updated['document_id'],
                'draft_id' => $updated['draft_id'],
                'form_type' => $updated['form_type'],
                'document_type' => $updated['document_type'],
                'original_filename' => $updated['original_filename'],
                'file_size_bytes' => (int) $updated['file_size_bytes'],
                'scan_status' => $updated['scan_status'],
                'review_status' => $updated['review_status'],
                'review_note' => $updated['review_note'],
                'uploaded_at' => $updated['uploaded_at'],
            ],
            'decision' => $decision,
            'previous_review_status' => $previousStatus,
            'new_review_status' => $newStatus,
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'document_review_update_failed', $error->getMessage());
    }
}

function normalize_operator_decision(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $decision = trim(strtolower($value));
    return in_array($decision, ['start_review', 'needs_correction', 'reject', 'reviewed'], true) ? $decision : null;
}

function normalize_operator_card_review_decision(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $decision = trim(strtolower($value));
    return in_array($decision, ['start_review', 'needs_correction', 'reviewed'], true) ? $decision : null;
}

function normalize_operator_review_note(mixed $value): ?string {
    if ($value === null) {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_review_note', 'note must be a string');
    }

    $note = trim($value);
    if (strlen($note) > 1000) {
        api_error(400, 'invalid_review_note', 'note must be at most 1000 characters');
    }

    return $note === '' ? null : $note;
}

function cpg_incoming_seafarer_request_review_reason_catalog(): array {
    return [
        'correction' => [
            'seafarer_profile_incomplete' => 'Seafarer profile or matching fields require correction before employer presentation',
            'document_readiness_missing' => 'Required document readiness is missing or not readable enough for this request',
            'availability_or_joining_unclear' => 'Availability, joining date or travel readiness requires clarification',
            'contract_terms_clarification_required' => 'Contract expectation or request note requires clarification before presentation',
            'request_note_unclear' => 'The seafarer request note is not clear enough for controlled employer presentation',
        ],
        'rejection' => [
            'not_matching_crew_request' => 'Candidate does not match the crew request after team review',
            'duplicate_or_withdrawn_request' => 'Request is duplicate, withdrawn or no longer active',
            'not_available_for_joining_date' => 'Candidate is not available for the requested joining date',
            'employer_context_not_applicable' => 'Employer, vessel or request context is not applicable to this candidate',
            'non_compliant_or_unsafe_request' => 'Request cannot proceed due to compliance, safety or policy concern',
        ],
    ];
}

function normalize_incoming_seafarer_request_review_reason_code(mixed $value, string $decision): ?string {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_review_reason_code', 'review_reason_code must be a string');
    }

    $code = trim($value);
    if ($code === '') {
        return null;
    }

    $catalog = cpg_incoming_seafarer_request_review_reason_catalog();
    $bucket = $decision === 'reject' ? 'rejection' : 'correction';
    if (!isset($catalog[$bucket][$code])) {
        api_error(400, 'invalid_review_reason_code', 'review_reason_code is not allowed for this decision');
    }

    return $code;
}

function cpg_incoming_seafarer_request_review_reason_name(?string $code, string $decision): ?string {
    if ($code === null || $code === '') {
        return null;
    }

    $catalog = cpg_incoming_seafarer_request_review_reason_catalog();
    $bucket = $decision === 'reject' ? 'rejection' : 'correction';
    return $catalog[$bucket][$code] ?? null;
}

function cpg_seafarer_review_card_codes(): array {
    return array_merge(cpg_seafarer_excel_review_card_codes(), cpg_seafarer_legacy_review_card_codes());
}

function cpg_seafarer_excel_review_card_codes(): array {
    return [
        'PERS-001',
        'PERS-002',
        'PERS-003',
        'PERS-004',
        'PERS-005',
        'PERS-006',
        'PERS-007',
        'PERS-008',
        'PERS-009',
        'QUAL-001',
        'QUAL-002',
        'QUAL-003',
        'QUAL-004',
        'QUAL-005',
        'EXP-001',
        'EXP-002',
        'MED-001',
        'MED-002',
        'MED-003',
        'MED-004',
        'MED-005',
    ];
}

function cpg_seafarer_legacy_review_card_codes(): array {
    return [
        'personal_contact',
        'qualifications',
        'sea_service',
        'matching_publication',
        'document_readiness',
    ];
}

function cpg_seafarer_review_card_name(?string $code): ?string {
    $names = [
        'PERS-001' => 'PERS-001 Employee ID number',
        'PERS-002' => 'PERS-002 Position request',
        'PERS-003' => 'PERS-003 Personal details',
        'PERS-004' => 'PERS-004 Permanent address',
        'PERS-005' => 'PERS-005 Registration address',
        'PERS-006' => 'PERS-006 Contact details',
        'PERS-007' => 'PERS-007 Next of kin / beneficiary',
        'PERS-008' => 'PERS-008 Children records',
        'PERS-009' => 'PERS-009 Physical details',
        'QUAL-001' => 'QUAL-001 National identity documents / visa',
        'QUAL-002' => 'QUAL-002 Education',
        'QUAL-003' => 'QUAL-003 Certificate of competence',
        'QUAL-004' => 'QUAL-004 National documents / endorsements',
        'QUAL-005' => 'QUAL-005 Training courses',
        'EXP-001' => 'EXP-001 Sea service',
        'EXP-002' => 'EXP-002 Previous employer details for reference',
        'MED-001' => 'MED-001 Medical history',
        'MED-002' => "MED-002 Seafarer's obligation",
        'MED-003' => 'MED-003 Personal data processing agreement',
        'MED-004' => 'MED-004 Information source and comments',
        'MED-005' => 'MED-005 Authorization for pre-employment process',
        'personal_contact' => 'Personal and contact details',
        'qualifications' => 'Qualifications and training',
        'sea_service' => 'Sea-service record',
        'matching_publication' => 'Matching and publication consent',
        'document_readiness' => 'Document readiness metadata',
    ];

    return is_string($code) && isset($names[$code]) ? $names[$code] : null;
}

function cpg_seafarer_review_status_for_decision(string $decision): ?string {
    return match ($decision) {
        'start_review' => 'under_review',
        'needs_correction' => 'correction_requested',
        'reviewed' => 'verified',
        default => null,
    };
}

function cpg_seafarer_workspace_section_review_card(string $section): ?string {
    $cards = cpg_seafarer_workspace_section_review_cards($section);
    return $cards[0] ?? null;
}

function cpg_seafarer_workspace_section_review_cards(string $section): array {
    return match ($section) {
        'personal_details', 'name_components' => ['PERS-003', 'personal_contact'],
        'contact_and_addresses' => ['PERS-004', 'PERS-006', 'personal_contact'],
        'address_details' => ['PERS-004', 'PERS-005', 'personal_contact'],
        'family_details' => ['PERS-007', 'PERS-008', 'personal_contact'],
        'physical_details' => ['PERS-009', 'personal_contact'],
        'identity_documents' => ['QUAL-001', 'qualifications'],
        'qualifications' => ['QUAL-002', 'QUAL-003', 'QUAL-005', 'qualifications'],
        'qualification_details' => ['QUAL-002', 'QUAL-003', 'QUAL-004', 'QUAL-005', 'qualifications'],
        'sea_service' => ['EXP-001', 'sea_service'],
        'previous_employer_references' => ['EXP-002', 'sea_service'],
        'medical_history' => ['MED-001', 'document_readiness'],
        'matching_publication' => ['MED-003', 'MED-004', 'matching_publication'],
        'consent_details' => ['MED-002', 'MED-003', 'MED-004', 'matching_publication'],
        default => [],
    };
}

function cpg_set_seafarer_workspace_card_review_state(
    string $userId,
    string $cardCode,
    string $reviewStatus,
    ?string $reviewNote,
    string $reviewDecision,
    string $source
): void {
    $cardName = cpg_seafarer_review_card_name($cardCode);
    if ($cardName === null) {
        return;
    }

    $profile = cpg_fetch_one_assoc(
        'SELECT seafarer_profile_id, document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    if ($profile === null) {
        return;
    }

    $metadata = cpg_decode_json_object(is_string($profile['document_metadata'] ?? null) ? $profile['document_metadata'] : null);
    $states = isset($metadata['seafarer_workspace_card_reviews']) && is_array($metadata['seafarer_workspace_card_reviews'])
        ? $metadata['seafarer_workspace_card_reviews']
        : [];
    $states[$cardCode] = [
        'card_code' => $cardCode,
        'card_name' => $cardName,
        'review_status' => $reviewStatus,
        'review_note' => $reviewNote,
        'review_decision' => $reviewDecision,
        'review_updated_at' => gmdate('c'),
        'source' => $source,
    ];
    $metadata['seafarer_workspace_card_reviews'] = $states;

    api_query(
        'UPDATE crewportglobal.seafarer_profiles
         SET document_metadata = $2::jsonb,
             updated_at = now()
         WHERE user_id = $1',
        [$userId, cpg_workspace_json($metadata)]
    );

    cpg_update_seafarer_workspace_card_record_status($userId, $cardCode, $reviewStatus);

    write_audit_event('seafarer_workspace_card_review_state_updated', $userId, null, null, [
        'card_code' => $cardCode,
        'card_name' => $cardName,
        'review_status' => $reviewStatus,
        'review_decision' => $reviewDecision,
        'review_note' => $reviewNote,
        'source' => $source,
    ], $source);
}

function cpg_update_seafarer_workspace_card_record_status(string $userId, string $cardCode, string $reviewStatus): void {
    if (!cpg_seafarer_workspace_tables_ready()) {
        return;
    }

    $tables = match ($cardCode) {
        'PERS-003', 'PERS-004', 'PERS-005', 'PERS-006', 'PERS-009' => ['seafarer_person_details'],
        'PERS-007', 'PERS-008' => ['seafarer_emergency_contacts'],
        'QUAL-002' => ['seafarer_education_records'],
        'QUAL-003', 'QUAL-004' => ['seafarer_certificates'],
        'QUAL-005' => ['seafarer_training_records'],
        'EXP-001' => ['seafarer_sea_service_records'],
        'MED-001' => ['seafarer_medical_declarations'],
        'MED-002', 'MED-003', 'MED-004' => ['seafarer_matching_preferences'],
        'personal_contact' => ['seafarer_person_details', 'seafarer_emergency_contacts'],
        'qualifications' => ['seafarer_education_records', 'seafarer_certificates', 'seafarer_training_records'],
        'sea_service' => ['seafarer_sea_service_records'],
        'matching_publication' => ['seafarer_matching_preferences'],
        'document_readiness' => ['seafarer_medical_declarations'],
        default => [],
    };

    foreach ($tables as $table) {
        api_query(
            "UPDATE crewportglobal.{$table}
             SET review_status = $2,
                 updated_at = now()
             WHERE user_id = $1",
            [$userId, $reviewStatus]
        );
    }
}

function normalize_operator_correction_card_code(mixed $value): ?string {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_correction_card_code', 'correction_card_code must be a string');
    }

    $code = trim($value);
    if ($code === '') {
        return null;
    }
    if (cpg_seafarer_review_card_name($code) === null) {
        api_error(400, 'invalid_correction_card_code', 'correction_card_code must be a known seafarer review card code');
    }

    return $code;
}

function normalize_operator_queue_type(mixed $value): ?string {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_queue_type', 'queue_type must be a string');
    }

    $queueType = trim($value);
    $allowed = ['seafarer_profile', 'company_verification', 'vacancy_request', 'vacancy_application'];
    if (!in_array($queueType, $allowed, true)) {
        api_error(400, 'invalid_queue_type', 'queue_type must be one of seafarer_profile, company_verification, vacancy_request, vacancy_application');
    }

    return $queueType;
}

function read_operator_vacancy_application_review_history(string $applicationId): array {
    $result = api_query(
        "SELECT event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                event_payload->>'correction_card_code' AS correction_card_code,
                event_payload->>'correction_card_name' AS correction_card_name,
                event_payload->>'review_reason_code' AS review_reason_code,
                event_payload->>'review_reason_name' AS review_reason_name,
                event_payload->>'request_source' AS request_source,
                source,
                created_at
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND event_payload->>'vacancy_application_id' = $1
         ORDER BY created_at DESC
         LIMIT 20",
        [$applicationId]
    );

    $events = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $events[] = [
            'decision' => $row['decision'] ?? null,
            'previous_status' => $row['previous_status'] ?? null,
            'new_status' => $row['new_status'] ?? null,
            'queue_type' => $row['queue_type'] ?? null,
            'role' => $row['role'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'correction_card_code' => $row['correction_card_code'] ?? null,
            'correction_card_name' => $row['correction_card_name'] ?? null,
            'review_reason_code' => $row['review_reason_code'] ?? null,
            'review_reason_name' => $row['review_reason_name'] ?? null,
            'request_source' => $row['request_source'] ?? null,
            'source' => $row['source'] ?? null,
            'created_at' => $row['created_at'] ?? null,
        ];
    }

    return $events;
}

function read_operator_vacancy_application_detail(string $applicationId, ?array $access = null): ?array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.seafarer_user_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.created_at AS application_created_at,
            va.updated_at AS application_updated_at,
            su.email AS seafarer_email,
            su.display_name AS seafarer_display_name,
            sp.first_name,
            sp.last_name,
            sp.primary_rank,
            sp.department AS seafarer_department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code AS seafarer_country_code,
            sp.contact_phone,
            sp.review_status AS seafarer_review_status,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department,
            vr.vessel_type AS vacancy_vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.employer_country_code,
            vr.requirements,
            vr.publication_status,
            vr.company_id,
            vr.vessel_id,
            ec.company_name,
            ec.company_type,
            ec.country_code AS company_country_code,
            ec.verification_status,
            v.vessel_name,
            v.vessel_type,
            v.imo_number,
            v.flag_country_code,
            sc.shortlist_candidate_id,
            CASE
              WHEN sc.shortlist_candidate_id IS NULL THEN 'seafarer_initiated_request'
              ELSE 'internal_shortlist_review_application'
            END AS request_source
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN LATERAL (
           SELECT osc.shortlist_candidate_id
           FROM crewportglobal.operator_shortlist_candidates osc
           JOIN crewportglobal.operator_shortlist_drafts osd
             ON osd.shortlist_draft_id = osc.shortlist_draft_id
           WHERE osd.vacancy_request_id = va.vacancy_request_id
             AND osc.candidate_user_id = va.seafarer_user_id
             AND osc.operator_decision = 'include'
           ORDER BY osd.updated_at DESC, osc.updated_at DESC
           LIMIT 1
         ) sc ON TRUE
         WHERE va.vacancy_application_id = $1
         LIMIT 1",
        [$applicationId]
    );

    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        return null;
    }

    $history = read_operator_vacancy_application_review_history($applicationId);
    $documentMetadata = cpg_decode_json_object(is_string($row['document_metadata'] ?? null) ? $row['document_metadata'] : null);
    $workspaceSummary = cpg_read_seafarer_workspace_summary((string) $row['seafarer_user_id']);
    $operatorWorkspaceSummary = cpg_seafarer_workspace_summary_for_scope($workspaceSummary, 'operator_general');
    $approvalGuard = cpg_vacancy_application_approval_guard($applicationId);

    $detail = [
        'ok' => true,
        'queue_type' => 'vacancy_application',
        'application' => [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'seafarer_user_id' => $row['seafarer_user_id'],
            'contact_email' => $row['contact_email'],
            'candidate_note' => $row['candidate_note'],
            'application_status' => $row['application_status'],
            'request_source' => $row['request_source'],
            'shortlist_candidate_id' => $row['shortlist_candidate_id'],
            'created_at' => $row['application_created_at'],
            'updated_at' => $row['application_updated_at'],
        ],
        'seafarer_profile' => [
            'user_id' => $row['seafarer_user_id'],
            'email' => $row['seafarer_email'],
            'display_name' => $row['seafarer_display_name'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['seafarer_department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['seafarer_country_code'],
            'contact_phone' => $row['contact_phone'],
            'review_status' => $row['seafarer_review_status'],
            'document_metadata' => cpg_workspace_json(cpg_seafarer_document_metadata_for_scope($documentMetadata, 'operator_general')),
        ],
        'seafarer_workspace_structured' => $operatorWorkspaceSummary,
        'seafarer_review_readiness' => cpg_seafarer_workspace_review_readiness($workspaceSummary, $documentMetadata),
        'vacancy' => [
            'vacancy_request_id' => $row['vacancy_request_id'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['vacancy_rank'],
            'department' => $row['vacancy_department'],
            'vessel_type' => $row['vacancy_vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'salary_text' => $row['salary_text'],
            'currency' => $row['currency'],
            'employer_country_code' => $row['employer_country_code'],
            'requirements' => $row['requirements'],
            'publication_status' => $row['publication_status'],
        ],
        'company' => [
            'company_id' => $row['company_id'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'country_code' => $row['company_country_code'],
            'verification_status' => $row['verification_status'],
        ],
        'vessel' => [
            'vessel_id' => $row['vessel_id'],
            'vessel_name' => $row['vessel_name'],
            'vessel_type' => $row['vessel_type'],
            'imo_number' => $row['imo_number'],
            'flag_country_code' => $row['flag_country_code'],
        ],
        'operator_review' => $history[0] ?? null,
        'operator_review_history' => $history,
        'approval_guard' => $approvalGuard,
        'operator_access' => operator_queue_access_contract('vacancy_application', $access),
        'generated_at' => gmdate('c'),
    ];
    $detail['computed_operations'] = cpg_operator_vacancy_application_computed_operations($detail, $access);

    return $detail;
}

function handle_get_operator_vacancy_application_detail(string $applicationId, ?array $access = null): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $detail = read_operator_vacancy_application_detail($uuid, $access);
    if ($detail === null) {
        api_error(404, 'vacancy_application_not_found', 'Vacancy application not found');
    }

    api_json(200, $detail);
}

function read_operator_vacancy_request_review_history(string $vacancyRequestId): array {
    $result = api_query(
        "SELECT event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                event_payload->>'correction_card_code' AS correction_card_code,
                event_payload->>'correction_card_name' AS correction_card_name,
                source,
                created_at
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND event_payload->>'vacancy_request_id' = $1
         ORDER BY created_at DESC
         LIMIT 20",
        [$vacancyRequestId]
    );

    $events = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $events[] = [
            'decision' => $row['decision'] ?? null,
            'previous_status' => $row['previous_status'] ?? null,
            'new_status' => $row['new_status'] ?? null,
            'queue_type' => $row['queue_type'] ?? null,
            'role' => $row['role'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'correction_card_code' => $row['correction_card_code'] ?? null,
            'correction_card_name' => $row['correction_card_name'] ?? null,
            'source' => $row['source'] ?? null,
            'created_at' => $row['created_at'] ?? null,
        ];
    }

    return $events;
}

function read_operator_vacancy_request_detail(string $vacancyRequestId, ?array $access = null): ?array {
    $row = cpg_fetch_one_assoc(
        "SELECT
            vr.vacancy_request_id::text AS vacancy_request_id,
            vr.created_by_user_id::text AS created_by_user_id,
            vr.company_id::text AS company_id,
            vr.vessel_id::text AS vessel_id,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            vr.vessel_type,
            vr.required_rank_value_id::text AS required_rank_value_id,
            vr.required_rank_label,
            vr.vessel_type_value_id::text AS vessel_type_value_id,
            vr.vessel_type_label,
            vr.join_date::text AS join_date,
            vr.contract_duration,
            vr.contract_duration_value,
            vr.contract_duration_unit,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.employer_country_code,
            vr.requirements,
            vr.publication_status,
            vr.demand_workspace,
            vr.created_at::text AS vacancy_created_at,
            vr.updated_at::text AS vacancy_updated_at,
            u.email,
            u.display_name,
            COALESCE(ur.role, 'employer') AS role,
            ec.company_name,
            ec.company_type,
            ec.country_code AS company_country_code,
            ec.verification_status,
            v.vessel_name,
            v.vessel_type AS vessel_record_type,
            v.imo_number,
            v.flag_country_code
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN crewportglobal.users u ON u.user_id = vr.created_by_user_id
         LEFT JOIN LATERAL (
             SELECT role
             FROM crewportglobal.user_roles ur
             WHERE ur.user_id = vr.created_by_user_id
             ORDER BY ur.created_at ASC
             LIMIT 1
         ) ur ON TRUE
         WHERE vr.vacancy_request_id = $1::uuid
         LIMIT 1",
        [$vacancyRequestId]
    );
    if ($row === null) {
        return null;
    }

    $history = read_operator_vacancy_request_review_history($vacancyRequestId);
    $requirementItems = read_demand_requirement_items($vacancyRequestId);

    return [
        'ok' => true,
        'queue_type' => 'vacancy_request',
        'draft_id' => $row['created_by_user_id'] ?? null,
        'role' => $row['role'] ?? 'employer',
        'email' => $row['email'] ?? null,
        'status' => $row['publication_status'] ?? null,
        'created_at' => $row['vacancy_created_at'] ?? null,
        'updated_at' => $row['vacancy_updated_at'] ?? null,
        'payload' => [
            'operator_review' => $history[0] ?? null,
            'operator_review_history' => $history,
            'vacancy_request' => [
                'vacancy_request_id' => $row['vacancy_request_id'],
                'created_by_user_id' => $row['created_by_user_id'],
                'vacancy_title' => $row['vacancy_title'],
                'rank' => $row['rank'],
                'department' => $row['department'],
                'vessel_type' => $row['vessel_type'],
                'required_rank_value_id' => $row['required_rank_value_id'],
                'required_rank_label' => $row['required_rank_label'],
                'vessel_type_value_id' => $row['vessel_type_value_id'],
                'vessel_type_label' => $row['vessel_type_label'],
                'join_date' => $row['join_date'],
                'contract_duration' => $row['contract_duration'],
                'contract_duration_value' => $row['contract_duration_value'],
                'contract_duration_unit' => $row['contract_duration_unit'],
                'salary_min_usd' => $row['salary_min_usd'],
                'salary_max_usd' => $row['salary_max_usd'],
                'salary_text' => $row['salary_text'],
                'currency' => $row['currency'],
                'employer_country_code' => $row['employer_country_code'],
                'requirements' => $row['requirements'],
                'publication_status' => $row['publication_status'],
                'demand_workspace' => cpg_decode_json_object(is_string($row['demand_workspace'] ?? null) ? $row['demand_workspace'] : null),
            ],
            'company' => [
                'company_id' => $row['company_id'],
                'company_name' => $row['company_name'],
                'company_type' => $row['company_type'],
                'country_code' => $row['company_country_code'],
                'verification_status' => $row['verification_status'],
            ],
            'vessel' => [
                'vessel_id' => $row['vessel_id'],
                'vessel_name' => $row['vessel_name'],
                'vessel_type' => $row['vessel_record_type'],
                'imo_number' => $row['imo_number'],
                'flag_country_code' => $row['flag_country_code'],
            ],
            'demand_requirement_items' => $requirementItems,
        ],
        'operator_review' => $history[0] ?? null,
        'operator_review_history' => $history,
        'operator_access' => operator_queue_access_contract('vacancy_request', $access),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_operator_vacancy_request_detail(string $vacancyRequestId, ?array $access = null): void {
    $uuid = api_normalize_uuid($vacancyRequestId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $detail = read_operator_vacancy_request_detail($uuid, $access);
    if ($detail === null) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    api_json(200, $detail);
}

function handle_get_operator_restricted_medical(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $role = read_role_for_user($uuid);
    if ($role !== 'seafarer') {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    write_audit_event('restricted_medical_access_denied', $uuid, null, null, [
        'access_model' => 'temporary_operator_token',
        'requested_capability' => 'seafarer.medical.read_restricted',
        'reason' => 'temporary general operator token has no restricted medical capability',
    ], 'operator_restricted_medical_access');

    api_json(403, [
        'ok' => false,
        'error' => 'restricted_medical_capability_required',
        'message' => 'Restricted medical declaration details require a dedicated medical reviewer capability',
        'visibility_class' => 'restricted_medical',
        'required_capabilities' => [
            'seafarer.medical.read_restricted',
            'seafarer.medical.request_correction',
            'seafarer.medical.verify_restricted',
        ],
        'audit_recorded' => true,
    ]);
}

function normalize_employer_shortlist_status(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $status = trim(strtolower($value));
    $aliases = [
        'mark_contacted' => 'contacted',
        'contacted' => 'contacted',
        'request_interview' => 'interview_requested',
        'interview_requested' => 'interview_requested',
        'proceed' => 'proceed_with_candidate',
        'proceed_with_candidate' => 'proceed_with_candidate',
        'propose_contract' => 'proceed_with_candidate',
        'not_suitable' => 'not_suitable',
        'reset' => 'presented',
        'presented' => 'presented',
    ];

    return $aliases[$status] ?? null;
}

function handle_patch_employer_vacancy_application_shortlist(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $employerDraftId = api_normalize_uuid($body['employer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($employerDraftId === null) {
        api_error(400, 'invalid_employer_draft_id', 'employer_draft_id must be a valid UUID');
    }

    $shortlistStatus = normalize_employer_shortlist_status($body['shortlist_status'] ?? $body['action'] ?? $body['status'] ?? null);
    if ($shortlistStatus === null) {
        api_error(400, 'invalid_shortlist_status', 'shortlist_status must be one of presented, contacted, interview_requested, proceed_with_candidate, not_suitable');
    }

    $role = read_role_for_user($employerDraftId);
    if ($role === null || $role === 'seafarer') {
        api_error(404, 'employer_draft_not_found', 'Employer draft not found');
    }

    $company = read_primary_company_for_user($employerDraftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'employer_company_not_found', 'Employer company not found');
    }
    $companyId = (string) $company['company_id'];
    $note = normalize_optional_text($body['note'] ?? $body['employer_note'] ?? null, 1200);

    api_tx_begin();
    try {
        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                va.employer_shortlist_status,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$uuid]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow) || (string) $currentRow['company_id'] !== $companyId) {
            api_tx_rollback();
            api_error(404, 'employer_application_not_found', 'Presented vacancy application not found for this employer');
        }

        if (($currentRow['application_status'] ?? '') !== 'presented') {
            api_tx_rollback();
            api_error(400, 'candidate_not_presented', 'Only operator-presented vacancy applications can be updated by employer');
        }

        $previousStatus = (string) $currentRow['employer_shortlist_status'];
        $updateResult = api_query(
            'UPDATE crewportglobal.vacancy_applications
             SET employer_shortlist_status = $2,
                 employer_action_note = $3,
                 employer_action_at = now(),
                 updated_at = now()
             WHERE vacancy_application_id = $1
             RETURNING employer_shortlist_status, employer_action_note, employer_action_at, updated_at',
            [$uuid, $shortlistStatus, $note]
        );
        $updateRow = pg_fetch_assoc($updateResult);
        if (!is_array($updateRow)) {
            api_tx_rollback();
            api_error(500, 'employer_shortlist_update_failed', 'Unable to update employer shortlist status');
        }

        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('employer_shortlist_action_recorded', $employerDraftId, $companyId, $vesselId, [
            'previous_status' => $previousStatus,
            'new_status' => $shortlistStatus,
            'employer_note' => $note,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'vacancy_application_id' => $uuid,
            'seafarer_user_id' => $currentRow['seafarer_user_id'],
        ], 'employer_candidate_pipeline');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_application_id' => $uuid,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'previous_status' => $previousStatus,
            'employer_shortlist_status' => $updateRow['employer_shortlist_status'],
            'employer_action_note' => $updateRow['employer_action_note'],
            'employer_action_at' => $updateRow['employer_action_at'],
            'updated_at' => $updateRow['updated_at'],
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'employer_shortlist_update_failed', $error->getMessage());
    }
}

function cpg_contract_workspace_number(): string {
    $random = bin2hex(random_bytes(4));
    return 'CW-' . gmdate('YmdHis') . '-' . substr($random, 0, 8);
}

function cpg_contract_proposal_context(string $applicationId, string $companyId): ?array {
    return cpg_fetch_one_assoc(
        "SELECT
            va.vacancy_application_id::text AS vacancy_application_id,
            va.vacancy_request_id::text AS vacancy_request_id,
            va.seafarer_user_id::text AS candidate_user_id,
            va.application_status,
            va.employer_shortlist_status,
            va.employer_action_note,
            vr.company_id::text AS employer_company_id,
            vr.vessel_id::text AS vessel_id,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            vr.join_date::text AS join_date,
            vr.contract_duration,
            vr.contract_duration_value,
            vr.contract_duration_unit,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.currency,
            sp.seafarer_profile_id::text AS seafarer_profile_id,
            sp.primary_rank,
            sp.availability_status,
            sp.availability_date::text AS availability_date,
            sc.shortlist_candidate_id::text AS shortlist_candidate_id,
            sc.shortlist_draft_id::text AS shortlist_draft_id
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = va.seafarer_user_id
         LEFT JOIN LATERAL (
           SELECT osc.shortlist_candidate_id,
                  osd.shortlist_draft_id
           FROM crewportglobal.operator_shortlist_candidates osc
           JOIN crewportglobal.operator_shortlist_drafts osd
             ON osd.shortlist_draft_id = osc.shortlist_draft_id
           WHERE osd.vacancy_request_id = va.vacancy_request_id
             AND osc.candidate_user_id = va.seafarer_user_id
             AND osc.operator_decision = 'include'
           ORDER BY osd.updated_at DESC, osc.updated_at DESC
           LIMIT 1
         ) sc ON TRUE
         WHERE va.vacancy_application_id = $1
           AND vr.company_id = $2
         LIMIT 1",
        [$applicationId, $companyId]
    );
}

function cpg_contract_proposal_operation_for_context(array $context): array {
    $row = [
        'application_status' => $context['application_status'] ?? null,
        'employer_shortlist_status' => $context['employer_shortlist_status'] ?? null,
        'vacancy_request_id' => $context['vacancy_request_id'] ?? null,
        'seafarer_profile_id' => $context['seafarer_profile_id'] ?? null,
        'shortlist_candidate_id' => $context['shortlist_candidate_id'] ?? null,
    ];

    return cpg_contract_proposal_operation_for_presented_candidate($row);
}

function handle_post_employer_vacancy_application_contract_proposal(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $employerDraftId = api_normalize_uuid($body['employer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($employerDraftId === null) {
        api_error(400, 'invalid_employer_draft_id', 'employer_draft_id must be a valid UUID');
    }

    $role = read_role_for_user($employerDraftId);
    if ($role === null || $role === 'seafarer') {
        api_error(404, 'employer_draft_not_found', 'Employer draft not found');
    }

    $company = read_primary_company_for_user($employerDraftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'employer_company_not_found', 'Employer company not found');
    }
    $companyId = (string) $company['company_id'];
    $context = cpg_contract_proposal_context($uuid, $companyId);
    if ($context === null) {
        api_error(404, 'employer_application_not_found', 'Presented vacancy application not found for this employer');
    }

    $operation = cpg_contract_proposal_operation_for_context($context);
    $existingId = is_string($operation['existing_contract_workspace_id'] ?? null)
        ? (string) $operation['existing_contract_workspace_id']
        : '';
    if ($existingId !== '') {
        write_audit_event('contract_workspace_proposal_reused', $employerDraftId, $companyId, is_string($context['vessel_id'] ?? null) ? (string) $context['vessel_id'] : null, [
            'contract_workspace_id' => $existingId,
            'vacancy_request_id' => $context['vacancy_request_id'] ?? null,
            'vacancy_application_id' => $uuid,
            'shortlist_candidate_id' => $context['shortlist_candidate_id'] ?? null,
            'candidate_user_id' => $context['candidate_user_id'] ?? null,
            'guard_status' => 'reused_existing_workspace',
        ], 'contract_workspace_proposal');

        api_json(200, [
            'ok' => true,
            'reused_existing_workspace' => true,
            'contract_workspace_id' => $existingId,
            'contract_operation' => $operation,
        ]);
    }

    if (($operation['enabled'] ?? false) !== true) {
        write_audit_event('contract_workspace_proposal_guard_blocked', $employerDraftId, $companyId, is_string($context['vessel_id'] ?? null) ? (string) $context['vessel_id'] : null, [
            'vacancy_request_id' => $context['vacancy_request_id'] ?? null,
            'vacancy_application_id' => $uuid,
            'shortlist_candidate_id' => $context['shortlist_candidate_id'] ?? null,
            'candidate_user_id' => $context['candidate_user_id'] ?? null,
            'guard_status' => 'blocked',
            'blocker_codes' => array_map(static fn(array $blocker): string => (string) ($blocker['code'] ?? ''), is_array($operation['blockers'] ?? null) ? $operation['blockers'] : []),
            'contract_operation' => $operation,
        ], 'contract_workspace_proposal');

        api_json(409, [
            'ok' => false,
            'error' => 'contract_workspace_proposal_blocked',
            'message' => 'Contract workspace proposal is blocked by guard conditions',
            'contract_operation' => $operation,
            'blockers' => is_array($operation['blockers'] ?? null) ? $operation['blockers'] : [],
        ]);
    }

    $template = cpg_contract_latest_approved_template();
    $catalog = cpg_contract_latest_approved_catalog();
    if ($template === null || $catalog === null) {
        api_error(409, 'contract_workspace_proposal_blocked', 'Approved contract template and catalog are required');
    }

    $sourceSnapshot = [
        'source_traceability_status' => $operation['source_traceability_status'] ?? 'unknown',
        'vacancy_application_id' => $uuid,
        'vacancy_request_id' => $context['vacancy_request_id'] ?? null,
        'shortlist_candidate_id' => $context['shortlist_candidate_id'] ?? null,
        'shortlist_draft_id' => $context['shortlist_draft_id'] ?? null,
        'candidate_user_id' => $context['candidate_user_id'] ?? null,
        'seafarer_profile_id' => $context['seafarer_profile_id'] ?? null,
        'employer_company_id' => $context['employer_company_id'] ?? null,
        'vessel_id' => $context['vessel_id'] ?? null,
        'employer_shortlist_status' => $context['employer_shortlist_status'] ?? null,
        'crew_request_terms' => [
            'vacancy_title' => $context['vacancy_title'] ?? null,
            'rank' => $context['rank'] ?? null,
            'department' => $context['department'] ?? null,
            'join_date' => $context['join_date'] ?? null,
            'contract_duration' => $context['contract_duration'] ?? null,
            'contract_duration_value' => $context['contract_duration_value'] ?? null,
            'contract_duration_unit' => $context['contract_duration_unit'] ?? null,
            'salary_min_usd' => $context['salary_min_usd'] ?? null,
            'salary_max_usd' => $context['salary_max_usd'] ?? null,
            'currency' => $context['currency'] ?? null,
        ],
    ];
    $sourceHash = hash('sha256', cpg_workspace_json($sourceSnapshot));

    api_tx_begin();
    try {
        $insert = api_query(
            "INSERT INTO crewportglobal.contract_workspace_instances (
                workspace_number,
                workspace_status,
                master_contract_template_id,
                contract_field_catalog_id,
                seafarer_profile_id,
                employer_company_id,
                vessel_id,
                vacancy_request_id,
                shortlist_draft_id,
                shortlist_candidate_id,
                vacancy_application_id,
                created_by_user_id,
                assigned_group_code,
                blocked_reason_snapshot,
                source_snapshot_hash
             ) VALUES (
                $1,
                'draft_from_platform_data',
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                'contract_team',
                $12::jsonb,
                $13
             )
             RETURNING contract_workspace_id::text AS contract_workspace_id,
                       workspace_number,
                       workspace_status,
                       created_at::text AS created_at,
                       updated_at::text AS updated_at",
            [
                cpg_contract_workspace_number(),
                $template['master_contract_template_id'],
                $catalog['contract_field_catalog_id'],
                $context['seafarer_profile_id'],
                $context['employer_company_id'],
                $context['vessel_id'],
                $context['vacancy_request_id'],
                $context['shortlist_draft_id'] ?: null,
                $context['shortlist_candidate_id'] ?: null,
                $uuid,
                $employerDraftId,
                cpg_workspace_json([
                    'source_traceability' => $sourceSnapshot,
                    'created_from' => 'employer_contract_proposal',
                ]),
                $sourceHash,
            ]
        );
        $workspace = pg_fetch_assoc($insert);
        if (!is_array($workspace)) {
            api_tx_rollback();
            api_error(500, 'contract_workspace_create_failed', 'Unable to create contract workspace');
        }

        write_audit_event('contract_workspace_proposal_created', $employerDraftId, $companyId, is_string($context['vessel_id'] ?? null) ? (string) $context['vessel_id'] : null, [
            'contract_workspace_id' => $workspace['contract_workspace_id'],
            'workspace_number' => $workspace['workspace_number'],
            'vacancy_request_id' => $context['vacancy_request_id'] ?? null,
            'vacancy_application_id' => $uuid,
            'shortlist_candidate_id' => $context['shortlist_candidate_id'] ?? null,
            'candidate_user_id' => $context['candidate_user_id'] ?? null,
            'guard_status' => 'created',
            'source_traceability_status' => $operation['source_traceability_status'] ?? null,
            'source_snapshot_hash' => $sourceHash,
        ], 'contract_workspace_proposal');

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'contract_workspace_create_failed', $error->getMessage());
    }

    api_json(201, [
        'ok' => true,
        'reused_existing_workspace' => false,
        'contract_workspace' => $workspace,
        'source_traceability_status' => $operation['source_traceability_status'] ?? null,
    ]);
}

function normalize_seafarer_application_action(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $action = trim(strtolower($value));
    $aliases = [
        'withdraw' => 'withdraw',
        'withdrawn' => 'withdraw',
        'withdraw_application' => 'withdraw',
        'not_available' => 'not_available',
        'mark_not_available' => 'not_available',
    ];

    return $aliases[$action] ?? null;
}

function handle_patch_seafarer_vacancy_application_status(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $seafarerDraftId = api_normalize_uuid($body['seafarer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($seafarerDraftId === null) {
        api_error(400, 'invalid_seafarer_draft_id', 'seafarer_draft_id must be a valid UUID');
    }

    $action = normalize_seafarer_application_action($body['action'] ?? $body['status'] ?? null);
    if ($action === null) {
        api_error(400, 'invalid_application_action', 'action must be withdraw or not_available');
    }

    $role = read_role_for_user($seafarerDraftId);
    if ($role !== 'seafarer') {
        api_error(404, 'seafarer_draft_not_found', 'Seafarer draft not found');
    }

    api_tx_begin();
    try {
        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$uuid]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow) || (string) $currentRow['seafarer_user_id'] !== $seafarerDraftId) {
            api_tx_rollback();
            api_error(404, 'seafarer_application_not_found', 'Vacancy application not found for this seafarer');
        }

        $previousStatus = (string) $currentRow['application_status'];
        if (in_array($previousStatus, ['rejected', 'withdrawn'], true)) {
            api_tx_rollback();
            api_error(400, 'application_not_active', 'Only active vacancy applications can be withdrawn');
        }

        $updateResult = api_query(
            "UPDATE crewportglobal.vacancy_applications
             SET application_status = 'withdrawn', updated_at = now()
             WHERE vacancy_application_id = $1
             RETURNING application_status, updated_at",
            [$uuid]
        );
        $updateRow = pg_fetch_assoc($updateResult);
        if (!is_array($updateRow)) {
            api_tx_rollback();
            api_error(500, 'seafarer_application_update_failed', 'Unable to update vacancy application');
        }

        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('seafarer_vacancy_application_withdrawn', $seafarerDraftId, (string) $currentRow['company_id'], $vesselId, [
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => 'withdrawn',
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'vacancy_application_id' => $uuid,
        ], 'seafarer_application_history');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_application_id' => $uuid,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'action' => $action,
            'previous_status' => $previousStatus,
            'application_status' => $updateRow['application_status'],
            'updated_at' => $updateRow['updated_at'],
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_application_update_failed', $error->getMessage());
    }
}

function apply_operator_review_decision(
    string $draftId,
    string $decision,
    ?string $reviewNote,
    ?string $queueType = null,
    ?string $correctionCardCode = null,
    ?array $approvalGuard = null,
    ?array $workflowAccess = null,
    ?string $reviewReasonCode = null
): array {
    $correctionCardName = cpg_seafarer_review_card_name($correctionCardCode);

    if ($queueType === 'vacancy_request') {
        $currentResult = api_query(
            "SELECT
                vr.vacancy_request_id,
                vr.created_by_user_id,
                vr.company_id,
                vr.vessel_id,
                vr.publication_status,
                COALESCE(ur.role, 'employer') AS role
             FROM crewportglobal.vacancy_requests vr
             LEFT JOIN LATERAL (
                 SELECT role
                 FROM crewportglobal.user_roles ur
                 WHERE ur.user_id = vr.created_by_user_id
                 ORDER BY ur.created_at ASC
                 LIMIT 1
             ) ur ON TRUE
             WHERE vr.vacancy_request_id = $1::uuid
             LIMIT 1",
            [$draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (is_array($currentRow)) {
            $statusMap = [
                'start_review' => 'in_review',
                'needs_correction' => 'rejected',
                'reject' => 'rejected',
                'reviewed' => 'published',
            ];
            $newStatus = $statusMap[$decision];
            $vacancyRequestId = (string) $currentRow['vacancy_request_id'];
            $ownerUserId = (string) $currentRow['created_by_user_id'];
            $companyId = (string) $currentRow['company_id'];
            $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
            if ($vesselId === '') {
                $vesselId = null;
            }
            $role = (string) ($currentRow['role'] ?? 'employer');
            $previousStatus = (string) $currentRow['publication_status'];

            api_query(
                'UPDATE crewportglobal.vacancy_requests
                 SET publication_status = $2, updated_at = now()
                 WHERE vacancy_request_id = $1',
                [$vacancyRequestId, $newStatus]
            );

            write_audit_event('operator_review_decision_recorded', $ownerUserId, $companyId, $vesselId, [
                'decision' => $decision,
                'queue_type' => 'vacancy_request',
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'role' => $role,
                'review_note' => $reviewNote,
                'correction_card_code' => $correctionCardCode,
                'correction_card_name' => $correctionCardName,
                'vacancy_request_id' => $vacancyRequestId,
                'actor_context' => $workflowAccess !== null
                    ? operator_queue_decision_actor_context($workflowAccess, 'vacancy_request', $decision)
                    : null,
            ], 'operator_review_queue');

            return [
                'queue_type' => 'vacancy_request',
                'role' => $role,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'company_id' => $companyId,
                'vessel_id' => $vesselId,
                'vacancy_request_id' => $vacancyRequestId,
                'review_note' => $reviewNote,
                'correction_card_code' => $correctionCardCode,
                'correction_card_name' => $correctionCardName,
            ];
        }
    }

    if ($queueType === 'vacancy_application') {
        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reject' => 'rejected',
            'reviewed' => 'presented',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                CASE
                  WHEN sc.shortlist_candidate_id IS NULL THEN 'seafarer_initiated_request'
                  ELSE 'internal_shortlist_review_application'
                END AS request_source,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             LEFT JOIN LATERAL (
               SELECT osc.shortlist_candidate_id
               FROM crewportglobal.operator_shortlist_candidates osc
               JOIN crewportglobal.operator_shortlist_drafts osd
                 ON osd.shortlist_draft_id = osc.shortlist_draft_id
               WHERE osd.vacancy_request_id = va.vacancy_request_id
                 AND osc.candidate_user_id = va.seafarer_user_id
                 AND osc.operator_decision = 'include'
               ORDER BY osd.updated_at DESC, osc.updated_at DESC
               LIMIT 1
             ) sc ON TRUE
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Vacancy application review item not found');
        }

        $applicationId = (string) $currentRow['vacancy_application_id'];
        $seafarerUserId = (string) $currentRow['seafarer_user_id'];
        $vacancyRequestId = (string) $currentRow['vacancy_request_id'];
        $companyId = (string) $currentRow['company_id'];
        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }
        $previousStatus = (string) $currentRow['application_status'];
        if ($previousStatus === 'withdrawn') {
            api_error(400, 'application_withdrawn', 'Withdrawn vacancy applications cannot be moved by operator review');
        }
        $requestSource = is_string($currentRow['request_source'] ?? null) ? (string) $currentRow['request_source'] : '';
        $reviewReasonName = cpg_incoming_seafarer_request_review_reason_name($reviewReasonCode, $decision);
        if ($requestSource === 'seafarer_initiated_request' && in_array($decision, ['needs_correction', 'reject'], true) && $reviewReasonCode === null) {
            api_error(400, 'review_reason_code_required', 'review_reason_code is required for incoming seafarer request correction or rejection');
        }

        api_query(
            'UPDATE crewportglobal.vacancy_applications
             SET application_status = $2, updated_at = now()
             WHERE vacancy_application_id = $1',
            [$applicationId, $newStatus]
        );

        write_audit_event('operator_review_decision_recorded', $seafarerUserId, $companyId, $vesselId, [
            'decision' => $decision,
            'queue_type' => 'vacancy_application',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => 'seafarer',
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
            'review_reason_code' => $reviewReasonCode,
            'review_reason_name' => $reviewReasonName,
            'request_source' => $requestSource,
            'vacancy_request_id' => $vacancyRequestId,
            'vacancy_application_id' => $applicationId,
            'approval_guard' => $approvalGuard,
            'actor_context' => $workflowAccess !== null
                ? operator_workflow_actor_context($workflowAccess, 'review_candidate_presentation')
                : null,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'vacancy_application',
            'role' => 'seafarer',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => $companyId,
            'vessel_id' => $vesselId,
            'vacancy_request_id' => $vacancyRequestId,
            'vacancy_application_id' => $applicationId,
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
            'review_reason_code' => $reviewReasonCode,
            'review_reason_name' => $reviewReasonName,
            'request_source' => $requestSource,
            'approval_guard' => $approvalGuard,
        ];
    }

    $role = read_role_for_user($draftId);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    if ($queueType === null) {
        $queueType = $role === 'seafarer' ? 'seafarer_profile' : 'company_verification';
    }

    if ($queueType === 'seafarer_profile') {
        if ($role !== 'seafarer') {
            api_error(404, 'review_item_not_found', 'Seafarer review item not found');
        }

        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reject' => 'rejected',
            'reviewed' => 'approved',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            'SELECT review_status FROM crewportglobal.seafarer_profiles WHERE user_id = $1',
            [$draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Seafarer review item not found');
        }
        $previousStatus = (string) $currentRow['review_status'];

        api_query(
            'UPDATE crewportglobal.seafarer_profiles
             SET review_status = $2, updated_at = now()
             WHERE user_id = $1',
            [$draftId, $newStatus]
        );

        $cardReviewStatus = cpg_seafarer_review_status_for_decision($decision);
        if ($correctionCardCode !== null && $cardReviewStatus !== null) {
            cpg_set_seafarer_workspace_card_review_state(
                $draftId,
                $correctionCardCode,
                $cardReviewStatus,
                $reviewNote,
                $decision,
                'operator_review_queue'
            );
        }

        write_audit_event('operator_review_decision_recorded', $draftId, null, null, [
            'decision' => $decision,
            'queue_type' => 'seafarer_profile',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => $role,
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
            'seafarer_profile_id' => cpg_seafarer_profile_id_for_user($draftId),
            'actor_context' => $workflowAccess !== null
                ? operator_queue_decision_actor_context($workflowAccess, 'seafarer_profile', $decision)
                : null,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'seafarer_profile',
            'role' => $role,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => null,
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
        ];
    }

    $company = read_primary_company_for_user($draftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'review_item_not_found', 'Company review item not found');
    }

    $companyId = (string) $company['company_id'];

    if ($queueType === 'vacancy_request') {
        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reject' => 'rejected',
            'reviewed' => 'published',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            'SELECT vacancy_request_id, vessel_id, publication_status
             FROM crewportglobal.vacancy_requests
             WHERE company_id = $1
               AND created_by_user_id = $2
             ORDER BY updated_at DESC, created_at DESC
             LIMIT 1',
            [$companyId, $draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Vacancy request review item not found');
        }

        $vacancyRequestId = (string) $currentRow['vacancy_request_id'];
        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }
        $previousStatus = (string) $currentRow['publication_status'];

        api_query(
            'UPDATE crewportglobal.vacancy_requests
             SET publication_status = $2, updated_at = now()
             WHERE vacancy_request_id = $1',
            [$vacancyRequestId, $newStatus]
        );

        write_audit_event('operator_review_decision_recorded', $draftId, $companyId, $vesselId, [
            'decision' => $decision,
            'queue_type' => 'vacancy_request',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => $role,
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
            'vacancy_request_id' => $vacancyRequestId,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'vacancy_request',
            'role' => $role,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => $companyId,
            'vessel_id' => $vesselId,
            'vacancy_request_id' => $vacancyRequestId,
            'review_note' => $reviewNote,
            'correction_card_code' => $correctionCardCode,
            'correction_card_name' => $correctionCardName,
        ];
    }

    if ($queueType !== 'company_verification') {
        api_error(400, 'invalid_queue_type', 'queue_type must be one of seafarer_profile, company_verification, vacancy_request, vacancy_application');
    }

    $statusMap = [
        'start_review' => 'submitted',
        'needs_correction' => 'rejected',
        'reject' => 'rejected',
        'reviewed' => 'verified',
    ];
    $newStatus = $statusMap[$decision];

    $currentResult = api_query(
        'SELECT verification_status FROM crewportglobal.employer_companies WHERE company_id = $1',
        [$companyId]
    );
    $currentRow = pg_fetch_assoc($currentResult);
    if (!is_array($currentRow)) {
        api_error(404, 'review_item_not_found', 'Company review item not found');
    }
    $previousStatus = (string) $currentRow['verification_status'];

    api_query(
        'UPDATE crewportglobal.employer_companies
         SET verification_status = $2, updated_at = now()
         WHERE company_id = $1',
        [$companyId, $newStatus]
    );

    write_audit_event('operator_review_decision_recorded', $draftId, $companyId, null, [
        'decision' => $decision,
        'queue_type' => 'company_verification',
        'previous_status' => $previousStatus,
        'new_status' => $newStatus,
        'role' => $role,
        'review_note' => $reviewNote,
        'correction_card_code' => $correctionCardCode,
        'correction_card_name' => $correctionCardName,
        'company_id' => $companyId,
        'actor_context' => $workflowAccess !== null
            ? operator_queue_decision_actor_context($workflowAccess, 'company_verification', $decision)
            : null,
    ], 'operator_review_queue');

    return [
        'queue_type' => 'company_verification',
        'role' => $role,
        'previous_status' => $previousStatus,
        'new_status' => $newStatus,
        'company_id' => $companyId,
        'vessel_id' => null,
        'vacancy_request_id' => null,
        'review_note' => $reviewNote,
        'correction_card_code' => $correctionCardCode,
        'correction_card_name' => $correctionCardName,
    ];
}

function handle_patch_operator_vacancy_application_presentation_review(string $applicationId, array $access): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['operator_note'] ?? null);
    $approvalGuard = cpg_vacancy_application_approval_guard($uuid);
    $actorContext = operator_workflow_actor_context($access, 'review_candidate_presentation');

    if (($approvalGuard['approval_status'] ?? 'blocked') === 'blocked') {
        api_json(409, [
            'ok' => false,
            'error' => 'approval_guard_blocked',
            'message' => 'Candidate presentation is blocked by approval guard',
            'approval_guard' => $approvalGuard,
            'operation_access' => operator_workflow_operation_contract('review_candidate_presentation', $access),
            'actor_context' => $actorContext,
            'side_effects' => [
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => false,
                'moves_applications_to_presented' => false,
                'presented_to_employer' => false,
                'employer_visible' => false,
            ],
        ]);
    }

    $approvalGuard['approval_status'] = 'approved_for_employer_presentation';
    $approvalGuard['approval_audit'] = [
        'actor' => $actorContext['actor_label'] ?? 'temporary_operator_token',
        'actor_user_id' => $actorContext['actor_user_id'] ?? null,
        'action' => 'candidate_presentation_approved',
        'operation_code' => 'review_candidate_presentation',
        'timestamp' => gmdate('c'),
        'reason' => $reviewNote,
        'access_model' => $actorContext['access_model'] ?? null,
        'target_group_code' => $actorContext['target_group_code'] ?? null,
        'target_role_code' => $actorContext['target_role_code'] ?? null,
        'required_permission_code' => $actorContext['required_permission_code'] ?? null,
    ];

    api_tx_begin();
    try {
        $result = apply_operator_review_decision(
            $uuid,
            'reviewed',
            $reviewNote,
            'vacancy_application',
            null,
            $approvalGuard,
            $access
        );
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_application_id' => $result['vacancy_application_id'] ?? $uuid,
            'vacancy_request_id' => $result['vacancy_request_id'] ?? null,
            'decision' => 'reviewed',
            'queue_type' => 'vacancy_application',
            'previous_status' => $result['previous_status'],
            'new_status' => $result['new_status'],
            'review_note' => $result['review_note'],
            'approval_guard' => $result['approval_guard'] ?? $approvalGuard,
            'operation_access' => operator_workflow_operation_contract('review_candidate_presentation', $access),
            'actor_context' => $actorContext,
            'side_effects' => [
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => true,
                'moves_applications_to_presented' => ($result['new_status'] ?? null) === 'presented',
                'presented_to_employer' => ($result['new_status'] ?? null) === 'presented',
                'employer_visible' => ($result['new_status'] ?? null) === 'presented',
            ],
            'updated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'candidate_presentation_review_failed', $error->getMessage());
    }
}

function handle_patch_operator_vacancy_request_deletion_request(string $vacancyRequestId, array $access): void {
    $uuid = api_normalize_uuid($vacancyRequestId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['reason'] ?? $body['operator_note'] ?? null);
    $actorContext = operator_workflow_actor_context($access, 'request_vacancy_deletion');

    $currentResult = api_query(
        "SELECT
            vr.vacancy_request_id,
            vr.created_by_user_id,
            vr.company_id,
            vr.vessel_id,
            vr.publication_status,
            vr.vacancy_title,
            vr.demand_workspace,
            ec.company_name,
            owner_user.user_id AS owner_user_id
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN LATERAL (
             SELECT cu.user_id
             FROM crewportglobal.company_users cu
             WHERE cu.company_id = vr.company_id
             ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
             LIMIT 1
         ) owner_user ON TRUE
         WHERE vr.vacancy_request_id = $1
         LIMIT 1",
        [$uuid]
    );
    $currentRow = pg_fetch_assoc($currentResult);
    if (!is_array($currentRow)) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    $previousStatus = (string) $currentRow['publication_status'];
    $auditUserId = is_string($currentRow['created_by_user_id'] ?? null) && (string) $currentRow['created_by_user_id'] !== ''
        ? (string) $currentRow['created_by_user_id']
        : (is_string($currentRow['owner_user_id'] ?? null) ? (string) $currentRow['owner_user_id'] : '');
    $companyId = (string) $currentRow['company_id'];
    $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
    if ($vesselId === '') {
        $vesselId = null;
    }

    $deletionRequest = [
        'status' => 'pending_manager_confirmation',
        'requested_at' => gmdate('c'),
        'requested_by' => $actorContext['actor_label'] ?? 'operator',
        'requested_by_user_id' => $actorContext['actor_user_id'] ?? null,
        'operation_code' => 'request_vacancy_deletion',
        'previous_publication_status' => $previousStatus,
        'reason' => $reviewNote,
        'hidden_from_operator_queue' => true,
        'requires_manager_confirmation' => true,
        'physical_delete' => false,
        'manager_confirmation_status' => 'pending',
    ];

    api_tx_begin();
    try {
        $updateResult = api_query(
            "UPDATE crewportglobal.vacancy_requests
             SET publication_status = 'closed',
                 demand_workspace = jsonb_set(
                   COALESCE(demand_workspace, '{}'::jsonb),
                   '{deletion_request}',
                   $2::jsonb,
                   true
                 ),
                 updated_at = now()
             WHERE vacancy_request_id = $1
             RETURNING updated_at::text AS updated_at",
            [$uuid, cpg_workspace_json($deletionRequest)]
        );
        $updatedRow = pg_fetch_assoc($updateResult);
        if (!is_array($updatedRow)) {
            api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
        }

        $auditRecorded = false;
        if ($auditUserId !== '') {
            write_audit_event('operator_vacancy_deletion_requested', $auditUserId, $companyId, $vesselId, [
                'queue_type' => 'vacancy_request',
                'vacancy_request_id' => $uuid,
                'vacancy_title' => $currentRow['vacancy_title'] ?? null,
                'company_name' => $currentRow['company_name'] ?? null,
                'previous_status' => $previousStatus,
                'new_status' => 'closed',
                'deletion_request' => $deletionRequest,
                'actor_context' => $actorContext,
                'side_effects' => [
                    'hidden_from_operator_queue' => true,
                    'requires_manager_confirmation' => true,
                    'physical_delete' => false,
                    'employer_visible' => false,
                ],
            ], 'operator_review_queue');
            $auditRecorded = true;
        }

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_request_id' => $uuid,
            'queue_type' => 'vacancy_request',
            'previous_status' => $previousStatus,
            'new_status' => 'closed',
            'deletion_request' => $deletionRequest,
            'operation_access' => operator_workflow_operation_contract('request_vacancy_deletion', $access),
            'actor_context' => $actorContext,
            'audit_recorded' => $auditRecorded,
            'side_effects' => [
                'hidden_from_operator_queue' => true,
                'requires_manager_confirmation' => true,
                'physical_delete' => false,
                'employer_visible' => false,
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => false,
            ],
            'updated_at' => $updatedRow['updated_at'] ?? gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'vacancy_deletion_request_failed', $error->getMessage());
    }
}

function cpg_operator_vacancy_deletion_review_detail(string $vacancyRequestId, ?array $access = null): ?array {
    $row = cpg_fetch_one_assoc(
        "SELECT vr.vacancy_request_id::text AS vacancy_request_id,
                vr.created_by_user_id::text AS created_by_user_id,
                vr.company_id::text AS company_id,
                vr.vessel_id::text AS vessel_id,
                vr.publication_status,
                vr.vacancy_title,
                vr.rank,
                vr.department,
                vr.vessel_type,
                vr.join_date::text AS join_date,
                vr.demand_workspace,
                vr.created_at::text AS created_at,
                vr.updated_at::text AS updated_at,
                ec.company_name,
                v.vessel_name
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec
           ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v
           ON v.vessel_id = vr.vessel_id
         WHERE vr.vacancy_request_id = $1::uuid
         LIMIT 1",
        [$vacancyRequestId]
    );
    if (!is_array($row)) {
        return null;
    }

    $workspace = cpg_decode_json_object(is_string($row['demand_workspace'] ?? null) ? (string) $row['demand_workspace'] : null);
    $deletionRequest = is_array($workspace['deletion_request'] ?? null) ? $workspace['deletion_request'] : [];
    $pending = ($deletionRequest['status'] ?? null) === 'pending_manager_confirmation'
        && ($deletionRequest['manager_confirmation_status'] ?? null) === 'pending';
    $blockers = $pending ? [] : [[
        'code' => 'deletion_request_not_pending_manager_confirmation',
        'message' => 'Vacancy deletion request is not pending manager confirmation',
    ]];

    return [
        'vacancy_request' => [
            'vacancy_request_id' => $row['vacancy_request_id'],
            'publication_status' => $row['publication_status'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['rank'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'company_name' => $row['company_name'],
            'vessel_name' => $row['vessel_name'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ],
        'deletion_request' => $deletionRequest,
        'computed_operations' => [
            operator_computed_workflow_operation(
                'confirm_vacancy_deletion',
                $pending,
                $blockers,
                [
                    'record_type' => 'vacancy_deletion_request',
                    'record_id' => $row['vacancy_request_id'],
                    'current_status' => $deletionRequest['manager_confirmation_status'] ?? null,
                    'next_status_if_executed' => 'confirmed',
                    'responsible_group_after_transition' => null,
                    'computed_from' => 'vacancy_deletion_request_detail',
                ],
                $access
            ),
            operator_computed_workflow_operation(
                'reject_vacancy_deletion',
                $pending,
                $blockers,
                [
                    'record_type' => 'vacancy_deletion_request',
                    'record_id' => $row['vacancy_request_id'],
                    'current_status' => $deletionRequest['manager_confirmation_status'] ?? null,
                    'next_status_if_executed' => (string) ($deletionRequest['previous_publication_status'] ?? 'submitted_for_human_review'),
                    'responsible_group_after_transition' => 'review_team',
                    'computed_from' => 'vacancy_deletion_request_detail',
                ],
                $access
            ),
        ],
    ];
}

function handle_get_operator_vacancy_request_deletion_review(string $vacancyRequestId, array $access): void {
    $uuid = api_normalize_uuid($vacancyRequestId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $detail = cpg_operator_vacancy_deletion_review_detail($uuid, $access);
    if ($detail === null) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    api_json(200, array_merge([
        'ok' => true,
        'queue_type' => 'vacancy_deletion_request',
        'operation_access' => operator_workflow_operation_contract('confirm_vacancy_deletion', $access),
        'actor_context' => operator_workflow_actor_context($access, 'confirm_vacancy_deletion'),
        'generated_at' => gmdate('c'),
    ], $detail));
}

function handle_patch_operator_vacancy_request_deletion_review(string $vacancyRequestId, array $access): void {
    $uuid = api_normalize_uuid($vacancyRequestId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $decision = is_string($body['decision'] ?? null) ? trim((string) $body['decision']) : '';
    if (!in_array($decision, ['confirm', 'reject'], true)) {
        api_error(400, 'invalid_deletion_review_decision', 'decision must be one of confirm, reject');
    }
    $operationCode = $decision === 'confirm' ? 'confirm_vacancy_deletion' : 'reject_vacancy_deletion';
    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['reason'] ?? $body['operator_note'] ?? null);
    $actorContext = operator_workflow_actor_context($access, $operationCode);

    $currentRow = cpg_fetch_one_assoc(
        "SELECT vr.vacancy_request_id::text AS vacancy_request_id,
                vr.created_by_user_id::text AS created_by_user_id,
                vr.company_id::text AS company_id,
                vr.vessel_id::text AS vessel_id,
                vr.publication_status,
                vr.vacancy_title,
                vr.demand_workspace,
                ec.company_name
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         WHERE vr.vacancy_request_id = $1::uuid
         LIMIT 1",
        [$uuid]
    );
    if (!is_array($currentRow)) {
        api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
    }

    $workspace = cpg_decode_json_object(is_string($currentRow['demand_workspace'] ?? null) ? (string) $currentRow['demand_workspace'] : null);
    $deletionRequest = is_array($workspace['deletion_request'] ?? null) ? $workspace['deletion_request'] : [];
    if (($deletionRequest['status'] ?? null) !== 'pending_manager_confirmation'
        || ($deletionRequest['manager_confirmation_status'] ?? null) !== 'pending') {
        api_json(409, [
            'ok' => false,
            'error' => 'vacancy_deletion_confirmation_not_pending',
            'message' => 'Vacancy deletion request is not pending manager confirmation',
            'deletion_request' => $deletionRequest,
            'operation_access' => operator_workflow_operation_contract($operationCode, $access),
            'actor_context' => $actorContext,
            'side_effects' => [
                'physical_delete' => false,
                'changed_vacancy_status' => false,
                'hidden_from_operator_queue' => ($deletionRequest['hidden_from_operator_queue'] ?? false) === true,
            ],
        ]);
    }

    $previousStatus = (string) $currentRow['publication_status'];
    $restoreStatus = is_string($deletionRequest['previous_publication_status'] ?? null) && trim((string) $deletionRequest['previous_publication_status']) !== ''
        ? trim((string) $deletionRequest['previous_publication_status'])
        : 'submitted_for_human_review';
    $newStatus = $decision === 'confirm' ? 'closed' : $restoreStatus;
    $newDeletionRequest = array_merge($deletionRequest, [
        'status' => $decision === 'confirm' ? 'confirmed_deleted' : 'rejected_by_manager',
        'manager_confirmation_status' => $decision === 'confirm' ? 'confirmed' : 'rejected',
        'manager_decision' => $decision,
        'manager_decision_at' => gmdate('c'),
        'manager_decision_by' => $actorContext['actor_label'] ?? 'manager',
        'manager_decision_by_user_id' => $actorContext['actor_user_id'] ?? null,
        'manager_decision_note' => $reviewNote,
        'hidden_from_operator_queue' => $decision === 'confirm',
        'requires_manager_confirmation' => false,
        'physical_delete' => false,
    ]);

    api_tx_begin();
    try {
        $updateResult = api_query(
            "UPDATE crewportglobal.vacancy_requests
             SET publication_status = $2,
                 demand_workspace = jsonb_set(
                   COALESCE(demand_workspace, '{}'::jsonb),
                   '{deletion_request}',
                   $3::jsonb,
                   true
                 ),
                 updated_at = now()
             WHERE vacancy_request_id = $1::uuid
             RETURNING updated_at::text AS updated_at",
            [$uuid, $newStatus, cpg_workspace_json($newDeletionRequest)]
        );
        $updatedRow = pg_fetch_assoc($updateResult);
        if (!is_array($updatedRow)) {
            api_error(404, 'vacancy_request_not_found', 'Vacancy request not found');
        }

        $auditUserId = is_string($currentRow['created_by_user_id'] ?? null) && (string) $currentRow['created_by_user_id'] !== ''
            ? (string) $currentRow['created_by_user_id']
            : null;
        $auditRecorded = false;
        if ($auditUserId !== null) {
            write_audit_event(
                $decision === 'confirm' ? 'manager_vacancy_deletion_confirmed' : 'manager_vacancy_deletion_rejected',
                $auditUserId,
                (string) $currentRow['company_id'],
                isset($currentRow['vessel_id']) && (string) $currentRow['vessel_id'] !== '' ? (string) $currentRow['vessel_id'] : null,
                [
                    'queue_type' => 'vacancy_deletion_request',
                    'vacancy_request_id' => $uuid,
                    'vacancy_title' => $currentRow['vacancy_title'] ?? null,
                    'company_name' => $currentRow['company_name'] ?? null,
                    'decision' => $decision,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'deletion_request' => $newDeletionRequest,
                    'actor_context' => $actorContext,
                    'side_effects' => [
                        'hidden_from_operator_queue' => $decision === 'confirm',
                        'requires_manager_confirmation' => false,
                        'physical_delete' => false,
                        'employer_visible' => false,
                    ],
                ],
                'operator_review_queue'
            );
            $auditRecorded = true;
        }

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_request_id' => $uuid,
            'queue_type' => 'vacancy_deletion_request',
            'decision' => $decision,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'deletion_request' => $newDeletionRequest,
            'operation_access' => operator_workflow_operation_contract($operationCode, $access),
            'actor_context' => $actorContext,
            'audit_recorded' => $auditRecorded,
            'side_effects' => [
                'hidden_from_operator_queue' => $decision === 'confirm',
                'requires_manager_confirmation' => false,
                'physical_delete' => false,
                'employer_visible' => false,
                'creates_vacancy_applications' => false,
                'changes_application_statuses' => false,
            ],
            'updated_at' => $updatedRow['updated_at'] ?? gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'vacancy_deletion_confirmation_failed', $error->getMessage());
    }
}

function handle_patch_operator_review_queue_status(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $access = resolve_operator_or_named_session_access('operator_review_queue');
    $body = api_decode_json_body();
    $decision = normalize_operator_decision($body['decision'] ?? $body['action'] ?? $body['status'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, needs_correction, reject, reviewed');
    }
    $reviewNote = normalize_operator_review_note($body['note'] ?? null);
    if (($decision === 'needs_correction' || $decision === 'reject') && $reviewNote === null) {
        api_error(400, 'review_note_required', 'note is required for needs_correction and reject');
    }
    $queueType = normalize_operator_queue_type($body['queue_type'] ?? null);
    $correctionCardCode = normalize_operator_correction_card_code($body['correction_card_code'] ?? $body['correction_card'] ?? null);
    $reviewReasonCode = normalize_incoming_seafarer_request_review_reason_code(
        $body['review_reason_code'] ?? $body['reason_code'] ?? null,
        $decision
    );
    $approvalGuard = null;

    if ($queueType !== null) {
        require_operator_queue_decision_access($queueType, $decision, $access);
    }

    if ($queueType === 'vacancy_application' && $decision === 'reviewed') {
        $approvalGuard = cpg_vacancy_application_approval_guard($uuid);
        if (($approvalGuard['approval_status'] ?? 'blocked') === 'blocked') {
            api_json(409, [
                'ok' => false,
                'error' => 'approval_guard_blocked',
                'message' => 'Candidate presentation is blocked by approval guard',
                'approval_guard' => $approvalGuard,
            ]);
        }
        $approvalGuard['approval_status'] = 'approved_for_employer_presentation';
        $approvalGuard['approval_audit'] = [
            'actor' => 'temporary_operator_token',
            'action' => 'candidate_presentation_approved',
            'timestamp' => gmdate('c'),
            'reason' => $reviewNote,
        ];
    }

    api_tx_begin();
    try {
        $result = apply_operator_review_decision($uuid, $decision, $reviewNote, $queueType, $correctionCardCode, $approvalGuard, $access, $reviewReasonCode);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'draft_id' => $uuid,
            'decision' => $decision,
            'queue_type' => $result['queue_type'],
            'role' => $result['role'],
            'previous_status' => $result['previous_status'],
            'new_status' => $result['new_status'],
            'company_id' => $result['company_id'],
            'vessel_id' => $result['vessel_id'] ?? null,
            'vacancy_request_id' => $result['vacancy_request_id'] ?? null,
            'vacancy_application_id' => $result['vacancy_application_id'] ?? null,
            'review_note' => $result['review_note'],
            'correction_card_code' => $result['correction_card_code'] ?? null,
            'correction_card_name' => $result['correction_card_name'] ?? null,
            'review_reason_code' => $result['review_reason_code'] ?? null,
            'review_reason_name' => $result['review_reason_name'] ?? null,
            'request_source' => $result['request_source'] ?? null,
            'approval_guard' => $result['approval_guard'] ?? null,
            'updated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'operator_review_update_failed', $error->getMessage());
    }
}

function handle_patch_operator_seafarer_workspace_card_review(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $decision = normalize_operator_card_review_decision($body['decision'] ?? $body['action'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, needs_correction, reviewed');
    }

    $cardCode = normalize_operator_correction_card_code($body['card_code'] ?? $body['correction_card_code'] ?? null);
    if ($cardCode === null) {
        api_error(400, 'card_code_required', 'card_code is required');
    }

    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['review_note'] ?? null);
    if ($decision === 'needs_correction' && $reviewNote === null) {
        api_error(400, 'review_note_required', 'note is required for needs_correction');
    }

    $role = read_role_for_user($uuid);
    if ($role !== 'seafarer') {
        api_error(404, 'seafarer_review_item_not_found', 'Seafarer review item not found');
    }

    $reviewStatus = cpg_seafarer_review_status_for_decision($decision);
    if ($reviewStatus === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, needs_correction, reviewed');
    }

    api_tx_begin();
    try {
        cpg_set_seafarer_workspace_card_review_state(
            $uuid,
            $cardCode,
            $reviewStatus,
            $reviewNote,
            $decision,
            'operator_seafarer_workspace_card_review'
        );

        write_audit_event('operator_seafarer_workspace_card_review_recorded', $uuid, null, null, [
            'card_code' => $cardCode,
            'card_name' => cpg_seafarer_review_card_name($cardCode),
            'decision' => $decision,
            'review_status' => $reviewStatus,
            'review_note' => $reviewNote,
        ], 'operator_seafarer_workspace_card_review');

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_workspace_card_review_failed', $error->getMessage());
    }

    api_json(200, [
        'ok' => true,
        'draft_id' => $uuid,
        'card_code' => $cardCode,
        'card_name' => cpg_seafarer_review_card_name($cardCode),
        'decision' => $decision,
        'review_status' => $reviewStatus,
        'review_note' => $reviewNote,
        'workspace' => cpg_read_seafarer_workspace_summary($uuid),
        'updated_at' => gmdate('c'),
    ]);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = request_path();

if ($path === '/auth/register-password') {
    if ($method === 'POST') {
        handle_post_auth_register_password();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/login') {
    if ($method === 'POST') {
        handle_post_auth_login();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/logout') {
    if ($method === 'POST') {
        handle_post_auth_logout();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/send-verification') {
    if ($method === 'POST') {
        handle_post_auth_email_send_verification('user_requested');
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/resend-verification') {
    if ($method === 'POST') {
        handle_post_auth_email_send_verification('user_requested_resend');
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/verify') {
    if ($method === 'POST') {
        handle_post_auth_email_verify();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/me') {
    if ($method === 'GET') {
        handle_get_auth_me();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/user/profile-photo') {
    if ($method === 'GET') {
        cpg_handle_get_user_profile_photo();
    }
    if ($method === 'POST') {
        cpg_handle_post_user_profile_photo();
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/user/profile-photo/image') {
    if ($method === 'GET') {
        cpg_handle_get_user_profile_photo_image();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/reference-catalogs') {
    if ($method === 'GET') {
        cpg_handle_get_reference_catalogs();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/email-code/request') {
    if ($method === 'POST') {
        handle_post_admin_access_email_code_request();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/email-code/verify') {
    if ($method === 'POST') {
        handle_post_admin_access_email_code_verify();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/session') {
    if ($method === 'GET') {
        handle_get_admin_access_session();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/session/revoke') {
    if ($method === 'POST') {
        handle_post_admin_access_session_revoke();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/team-links') {
    if ($method === 'GET') {
        handle_get_admin_access_team_links();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/team/workbench/tasks') {
    if ($method === 'GET') {
        handle_get_team_workbench_tasks();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/team/translations/review-queue') {
    if ($method === 'GET') {
        handle_get_team_translation_review_queue();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/team/translations/review') {
    if ($method === 'PATCH') {
        handle_patch_team_translation_review();
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/agents/me') {
    if ($method === 'GET') {
        handle_get_agent_me();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/agents/objects') {
    if ($method === 'GET') {
        handle_get_agent_objects();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/agents/objects/([^/]+)/workspace$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        handle_get_agent_object_workspace($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/agents/tasks') {
    if ($method === 'GET') {
        handle_get_agent_tasks();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/agents/framework-agreement-offers') {
    if ($method === 'GET') {
        handle_get_agent_framework_agreement_offers();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/agents/framework-agreement-offers/([^/]+)/accept$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        handle_post_agent_framework_agreement_offer_accept($matches[1]);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/agents/object-creation-requests') {
    if ($method === 'GET') {
        handle_get_agent_object_creation_requests();
    }
    if ($method === 'POST') {
        handle_post_agent_object_creation_request();
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/agents/account-object-claims') {
    if ($method === 'GET') {
        handle_get_agent_account_object_claims();
    }
    if ($method === 'POST') {
        handle_post_agent_account_object_claim();
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/agents/authority-documents') {
    if ($method === 'POST') {
        handle_post_agent_authority_document();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/agents/review-workspace') {
    if ($method === 'GET') {
        handle_get_admin_agent_review_workspace();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/admin/agents/authority-documents/([^/]+)/review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_admin_agent_authority_document_review($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/admin/agents/account-object-claims/([^/]+)/review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_admin_agent_account_object_claim_review($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/admin/agents/object-assignments') {
    if ($method === 'POST') {
        handle_post_admin_agent_object_assignment();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/management') {
    if ($method === 'GET') {
        handle_get_admin_access_management();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/users') {
    if ($method === 'POST') {
        handle_post_admin_access_user();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/group-members') {
    if ($method === 'POST') {
        handle_post_admin_access_group_member();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/reference-catalogs') {
    if ($method === 'GET') {
        handle_get_admin_access_reference_catalogs();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/reference-catalogs/publication') {
    if ($method === 'PATCH') {
        handle_patch_admin_access_reference_catalog_publication();
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/registration/person/request') {
    if ($method === 'POST') {
        handle_post_registration_person_request();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/registration/person/confirm') {
    if ($method === 'POST') {
        handle_post_registration_person_confirm();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($method === 'POST' && $path === '/registration/drafts') {
    handle_create_draft();
}

if (preg_match('#^/registration/drafts/([^/]+)/completeness$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        handle_get_draft_completeness($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/registration/drafts/([^/]+)/submit-review$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        handle_post_draft_submit_review($matches[1]);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/registration/drafts/([^/]+)$#', $path, $matches) === 1) {
    $draftId = $matches[1];
    if ($method === 'GET') {
        handle_get_draft($draftId);
    }
    if ($method === 'PATCH') {
        handle_patch_draft($draftId);
    }
    header('Allow: GET, PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, PATCH');
}

if (preg_match('#^/registration/drafts/([^/]+)/documents$#', $path, $matches) === 1) {
    $draftId = $matches[1];
    if ($method === 'GET') {
        cpg_handle_get_registration_draft_documents($draftId);
    }
    if ($method === 'POST') {
        cpg_handle_post_registration_draft_document($draftId);
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/seafarer/workspace') {
    if ($method === 'GET') {
        handle_get_seafarer_workspace();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/seafarer/consents') {
    if ($method === 'GET') {
        handle_get_seafarer_consents();
    }
    if ($method === 'POST') {
        handle_post_seafarer_consent();
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if (preg_match('#^/seafarer/consents/([^/]+)/withdraw$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_seafarer_consent_withdraw($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/seafarer/workspace/sections/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_seafarer_workspace_section($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/seafarer/document-readiness') {
    if ($method === 'PATCH') {
        handle_patch_seafarer_document_readiness();
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/seafarer/job-search') {
    if ($method === 'GET') {
        handle_get_seafarer_job_search();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($method === 'GET' && $path === '/operator/review-queue') {
    $access = require_operator_or_team_queue_access();
    handle_get_operator_review_queue($access);
}

if ($method === 'GET' && $path === '/operator/document-review-queue') {
    $access = require_operator_or_team_access();
    handle_get_operator_document_review_queue($access);
}

if (preg_match('#^/operator/documents/([^/]+)/download$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_or_team_access();
        handle_get_operator_document_download($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/documents/([^/]+)/review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        $access = require_operator_or_team_access();
        handle_patch_operator_document_review($matches[1], $access);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/review-queue/vacancy-applications/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_queue_type_access('vacancy_application');
        handle_get_operator_vacancy_application_detail($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/review-queue/vacancy-requests/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_queue_type_access('vacancy_request');
        handle_get_operator_vacancy_request_detail($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/vacancies/([^/]+)/candidate-search$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_workflow_operation_access('create_internal_shortlist_draft');
        handle_get_operator_vacancy_candidate_search($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/vacancies/([^/]+)/shortlist-drafts$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        $access = require_operator_workflow_operation_access('create_internal_shortlist_draft');
        handle_post_operator_vacancy_shortlist_draft($matches[1], $access);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/operator/shortlist-drafts') {
    if ($method === 'GET') {
        $access = require_operator_or_team_access();
        handle_get_operator_shortlist_drafts($access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/shortlist-drafts/([^/]+)/approval$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        $access = require_operator_workflow_operation_access('approve_internal_shortlist');
        handle_patch_operator_shortlist_draft_approval($matches[1], $access);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/shortlist-drafts/([^/]+)/review-applications$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        $access = require_operator_workflow_operation_access('create_review_applications');
        handle_post_operator_shortlist_draft_review_applications($matches[1], $access);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/operator/shortlist-drafts/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_or_team_queue_access();
        handle_get_operator_shortlist_draft($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/vacancy-applications/([^/]+)/presentation-review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        $access = require_operator_workflow_operation_access('review_candidate_presentation');
        handle_patch_operator_vacancy_application_presentation_review($matches[1], $access);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/vacancy-requests/([^/]+)/deletion-request$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        $access = require_operator_workflow_operation_access('request_vacancy_deletion');
        handle_patch_operator_vacancy_request_deletion_request($matches[1], $access);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/vacancy-requests/([^/]+)/deletion-review$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_workflow_operation_access('confirm_vacancy_deletion');
        handle_get_operator_vacancy_request_deletion_review($matches[1], $access);
    }
    if ($method === 'PATCH') {
        $access = require_operator_workflow_operation_access('confirm_vacancy_deletion');
        handle_patch_operator_vacancy_request_deletion_review($matches[1], $access);
    }
    header('Allow: GET, PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, PATCH');
}

if ($method === 'GET' && $path === '/operator/registry-detail') {
    $access = require_operator_or_team_access();
    handle_get_operator_registry_detail($access);
}

if (preg_match('#^/operator/seafarer-medical/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        require_operator_access();
        handle_get_operator_restricted_medical($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($method === 'GET' && $path === '/vacancies') {
    handle_get_public_vacancies();
}

if ($method === 'GET' && $path === '/registry-summary') {
    handle_get_public_registry_summary();
}

if ($method === 'GET' && $path === '/employer/candidate-selection') {
    handle_get_shipowner_candidate_selection();
}

if ($path === '/employer/agent-assignment/options') {
    if ($method === 'GET') {
        handle_get_employer_agent_assignment_options();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/employer/agent-assignment/offers') {
    if ($method === 'POST') {
        handle_post_employer_agent_framework_offer();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/contract-workspaces/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        handle_get_contract_workspace($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/vacancies/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        handle_get_public_vacancy($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/vacancies/([^/]+)/applications$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        handle_create_vacancy_application($matches[1]);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/seafarer/vacancy-applications/([^/]+)/status$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_seafarer_vacancy_application_status($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/employer/vacancy-applications/([^/]+)/shortlist$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_employer_vacancy_application_shortlist($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/employer/vacancy-applications/([^/]+)/contract-proposal$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        handle_post_employer_vacancy_application_contract_proposal($matches[1]);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/operator/review-queue/([^/]+)/status$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_operator_review_queue_status($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/seafarer-workspace-cards/([^/]+)/review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        require_operator_access();
        handle_patch_operator_seafarer_workspace_card_review($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/health' || $path === '/healthz') {
    api_json(200, ['ok' => true, 'service' => 'crewportglobal-registration-api']);
}

header('Allow: POST, GET, PATCH');
api_error(404, 'not_found', 'Endpoint not found');
