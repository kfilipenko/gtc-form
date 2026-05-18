<?php

declare(strict_types=1);

const CPG_REFERENCE_CATALOG_SCOPES = [
    'global',
    'seafarer',
    'employer',
    'vessel',
    'system',
];

const CPG_REFERENCE_CATALOG_PUBLICATION_STATES = [
    'draft',
    'pending_owner_review',
    'approved',
    'published',
    'retired',
];

function cpg_reference_catalog_normalize_catalog_code(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $code = strtolower(trim($value));
    return preg_match('/^[a-z][a-z0-9_]*$/', $code) === 1 ? $code : null;
}

function cpg_reference_catalog_normalize_value_code(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $code = strtolower(trim($value));
    return preg_match('/^[a-z0-9][a-z0-9_]*$/', $code) === 1 ? $code : null;
}

function cpg_reference_catalog_normalize_scope(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $scope = strtolower(trim($value));
    return in_array($scope, CPG_REFERENCE_CATALOG_SCOPES, true) ? $scope : null;
}

function cpg_reference_catalog_normalize_publication_state(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $state = strtolower(trim($value));
    return in_array($state, CPG_REFERENCE_CATALOG_PUBLICATION_STATES, true) ? $state : null;
}

function cpg_reference_catalog_bool_param(mixed $value): bool {
    if (is_bool($value)) {
        return $value;
    }

    if (!is_string($value)) {
        return false;
    }

    return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
}

function cpg_reference_catalog_value_codes(mixed $value): ?array {
    if ($value === null) {
        return null;
    }

    if (!is_array($value)) {
        return [];
    }

    $codes = [];
    foreach ($value as $item) {
        $code = cpg_reference_catalog_normalize_value_code($item);
        if ($code === null) {
            return [];
        }
        $codes[$code] = true;
    }

    return array_keys($codes);
}

function cpg_reference_catalog_json(mixed $value): array {
    if (is_array($value)) {
        return $value;
    }

    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function cpg_reference_catalog_group_public_rows(PgSql\Result $result): array {
    $catalogs = [];

    while (($row = pg_fetch_assoc($result)) !== false) {
        $code = (string) $row['catalog_code'];
        if (!isset($catalogs[$code])) {
            $catalogs[$code] = [
                'catalog_code' => $code,
                'catalog_name' => (string) $row['catalog_name'],
                'catalog_scope' => (string) $row['catalog_scope'],
                'description' => $row['description'],
                'values' => [],
            ];
        }

        $catalogs[$code]['values'][] = [
            'value_code' => (string) $row['value_code'],
            'display_name' => (string) $row['display_name'],
            'sort_order' => (int) $row['sort_order'],
        ];
    }

    return array_values($catalogs);
}

function cpg_reference_catalog_public_catalogs(?string $scope, ?string $catalogCode): array {
    $params = [];
    $conditions = [
        'c.is_active = TRUE',
        'v.is_active = TRUE',
        "c.publication_state = 'published'",
        "v.publication_state = 'published'",
    ];

    if ($scope !== null) {
        $params[] = $scope;
        $conditions[] = 'c.catalog_scope = $' . count($params);
    }

    if ($catalogCode !== null) {
        $params[] = $catalogCode;
        $conditions[] = 'c.catalog_code = $' . count($params);
    }

    $result = api_query(
        'SELECT
             c.catalog_code,
             c.catalog_name,
             c.catalog_scope,
             c.description,
             v.value_code,
             v.display_name,
             v.sort_order
         FROM crewportglobal.reference_catalogs c
         JOIN crewportglobal.reference_catalog_values v
           ON v.reference_catalog_id = c.reference_catalog_id
         WHERE ' . implode(' AND ', $conditions) . '
         ORDER BY c.catalog_scope, c.catalog_code, v.sort_order, v.display_name',
        $params
    );

    return cpg_reference_catalog_group_public_rows($result);
}

function cpg_handle_get_reference_catalogs(): void {
    $scope = null;
    if (array_key_exists('scope', $_GET) && $_GET['scope'] !== '') {
        $scope = cpg_reference_catalog_normalize_scope($_GET['scope']);
        if ($scope === null) {
            api_error(400, 'invalid_reference_catalog_scope', 'scope must be one of global, seafarer, employer, vessel, system');
        }
    }

    $catalogCode = null;
    if (array_key_exists('catalog_code', $_GET) && $_GET['catalog_code'] !== '') {
        $catalogCode = cpg_reference_catalog_normalize_catalog_code($_GET['catalog_code']);
        if ($catalogCode === null) {
            api_error(400, 'invalid_reference_catalog_code', 'catalog_code is invalid');
        }
    }

    $catalogs = cpg_reference_catalog_public_catalogs($scope, $catalogCode);
    api_json(200, [
        'ok' => true,
        'catalogs' => $catalogs,
        'count' => count($catalogs),
        'publication_state' => 'published',
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_reference_catalog_state_counts(?string $catalogId = null): array {
    $params = [];
    $where = '';
    if ($catalogId !== null) {
        $params[] = $catalogId;
        $where = 'WHERE reference_catalog_id = $1::uuid';
    }

    $result = api_query(
        'SELECT publication_state, count(*)::int AS item_count
         FROM crewportglobal.reference_catalog_values
         ' . $where . '
         GROUP BY publication_state',
        $params
    );

    $counts = [];
    foreach (CPG_REFERENCE_CATALOG_PUBLICATION_STATES as $state) {
        $counts[$state] = 0;
    }

    while (($row = pg_fetch_assoc($result)) !== false) {
        $counts[(string) $row['publication_state']] = (int) $row['item_count'];
    }

    return $counts;
}

function cpg_reference_catalog_admin_values(?string $catalogCode, ?string $state): array {
    $params = [];
    $conditions = [];

    if ($catalogCode !== null) {
        $params[] = $catalogCode;
        $conditions[] = 'c.catalog_code = $' . count($params);
    }

    if ($state !== null) {
        $params[] = $state;
        $conditions[] = 'v.publication_state = $' . count($params);
    }

    $where = $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions);
    $result = api_query(
        'SELECT
             c.catalog_code,
             v.value_code,
             v.display_name,
             v.source_value,
             v.source_row_number,
             v.sort_order,
             v.publication_state,
             v.is_active,
             v.metadata,
             v.updated_at::text AS updated_at
         FROM crewportglobal.reference_catalog_values v
         JOIN crewportglobal.reference_catalogs c
           ON c.reference_catalog_id = v.reference_catalog_id
         ' . $where . '
         ORDER BY c.catalog_code, v.sort_order, v.display_name
         LIMIT 2000',
        $params
    );

    $values = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $values[] = [
            'catalog_code' => (string) $row['catalog_code'],
            'value_code' => (string) $row['value_code'],
            'display_name' => (string) $row['display_name'],
            'source_value' => (string) $row['source_value'],
            'source_row_number' => $row['source_row_number'] === null ? null : (int) $row['source_row_number'],
            'sort_order' => (int) $row['sort_order'],
            'publication_state' => (string) $row['publication_state'],
            'is_active' => filter_var($row['is_active'], FILTER_VALIDATE_BOOLEAN),
            'metadata' => cpg_reference_catalog_json($row['metadata'] ?? null),
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    return $values;
}

function cpg_reference_catalog_admin_snapshot(bool $includeValues, ?string $catalogCode, ?string $state): array {
    $params = [];
    $conditions = [];

    if ($catalogCode !== null) {
        $params[] = $catalogCode;
        $conditions[] = 'c.catalog_code = $' . count($params);
    }

    $where = $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions);
    $result = api_query(
        'SELECT
             c.reference_catalog_id::text AS reference_catalog_id,
             c.catalog_code,
             c.catalog_name,
             c.catalog_scope,
             c.source_name,
             c.source_sheet,
             c.description,
             c.is_active,
             c.publication_state,
             c.updated_at::text AS updated_at,
             CAST(count(v.reference_value_id) AS int) AS value_count,
             CAST(count(v.reference_value_id) FILTER (WHERE v.publication_state = \'pending_owner_review\') AS int) AS pending_owner_review_count,
             CAST(count(v.reference_value_id) FILTER (WHERE v.publication_state = \'approved\') AS int) AS approved_count,
             CAST(count(v.reference_value_id) FILTER (WHERE v.publication_state = \'published\') AS int) AS published_count,
             CAST(count(v.reference_value_id) FILTER (WHERE v.publication_state = \'retired\') AS int) AS retired_count
         FROM crewportglobal.reference_catalogs c
         LEFT JOIN crewportglobal.reference_catalog_values v
           ON v.reference_catalog_id = c.reference_catalog_id
         ' . $where . '
         GROUP BY c.reference_catalog_id
         ORDER BY c.catalog_scope, c.catalog_code',
        $params
    );

    $catalogs = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $catalogs[] = [
            'reference_catalog_id' => (string) $row['reference_catalog_id'],
            'catalog_code' => (string) $row['catalog_code'],
            'catalog_name' => (string) $row['catalog_name'],
            'catalog_scope' => (string) $row['catalog_scope'],
            'source_name' => $row['source_name'],
            'source_sheet' => $row['source_sheet'],
            'description' => $row['description'],
            'is_active' => filter_var($row['is_active'], FILTER_VALIDATE_BOOLEAN),
            'publication_state' => (string) $row['publication_state'],
            'value_count' => (int) $row['value_count'],
            'state_counts' => [
                'pending_owner_review' => (int) $row['pending_owner_review_count'],
                'approved' => (int) $row['approved_count'],
                'published' => (int) $row['published_count'],
                'retired' => (int) $row['retired_count'],
            ],
            'updated_at' => (string) $row['updated_at'],
        ];
    }

    return [
        'catalogs' => $catalogs,
        'values' => $includeValues ? cpg_reference_catalog_admin_values($catalogCode, $state) : [],
    ];
}

function cpg_reference_catalog_admin_snapshot_with_storage(
    CpgAdminAccessStorage $storage,
    mixed $sessionToken,
    ?DateTimeImmutable $now = null
): array {
    [$session, $error] = cpg_admin_access_management_session($storage, $sessionToken, $now);
    if ($error !== null) {
        return $error;
    }

    $includeValues = cpg_reference_catalog_bool_param($_GET['include_values'] ?? null);
    $catalogCode = null;
    if (array_key_exists('catalog_code', $_GET) && $_GET['catalog_code'] !== '') {
        $catalogCode = cpg_reference_catalog_normalize_catalog_code($_GET['catalog_code']);
        if ($catalogCode === null) {
            return cpg_admin_access_response(400, [
                'ok' => false,
                'error' => 'invalid_reference_catalog_code',
                'message' => 'catalog_code is invalid',
            ]);
        }
    }

    $state = null;
    if (array_key_exists('publication_state', $_GET) && $_GET['publication_state'] !== '') {
        $state = cpg_reference_catalog_normalize_publication_state($_GET['publication_state']);
        if ($state === null) {
            return cpg_admin_access_response(400, [
                'ok' => false,
                'error' => 'invalid_publication_state',
                'message' => 'publication_state is invalid',
            ]);
        }
    }

    $snapshot = cpg_reference_catalog_admin_snapshot($includeValues, $catalogCode, $state);
    return cpg_admin_access_response(200, [
        'ok' => true,
        'current_user' => [
            'user_id' => (string) ($session['user_id'] ?? ''),
            'email' => (string) ($session['email'] ?? ''),
            'groups' => cpg_admin_access_string_list($session['groups'] ?? []),
        ],
        'catalogs' => $snapshot['catalogs'],
        'values' => $snapshot['values'],
        'value_limit' => $includeValues ? 2000 : 0,
        'notice' => 'Reference values remain private until Project Owner publication.',
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_reference_catalog_select_catalog_for_update(string $catalogCode): ?array {
    $result = api_query(
        'SELECT
             reference_catalog_id::text AS reference_catalog_id,
             catalog_code,
             catalog_name,
             catalog_scope,
             publication_state
         FROM crewportglobal.reference_catalogs
         WHERE catalog_code = $1
         FOR UPDATE',
        [$catalogCode]
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? $row : null;
}

function cpg_reference_catalog_selected_value_count(string $catalogId, array $valueCodes): int {
    if ($valueCodes === []) {
        return 0;
    }

    $params = [$catalogId];
    $placeholders = [];
    foreach ($valueCodes as $code) {
        $params[] = $code;
        $placeholders[] = '$' . count($params);
    }

    $result = api_query(
        'SELECT count(*)::int AS item_count
         FROM crewportglobal.reference_catalog_values
         WHERE reference_catalog_id = $1::uuid
           AND value_code IN (' . implode(', ', $placeholders) . ')',
        $params
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? (int) $row['item_count'] : 0;
}

function cpg_reference_catalog_update_values(string $catalogId, string $publicationState, ?array $valueCodes): int {
    if ($valueCodes === null) {
        $result = api_query(
            'UPDATE crewportglobal.reference_catalog_values
             SET publication_state = $2,
                 updated_at = now()
             WHERE reference_catalog_id = $1::uuid',
            [$catalogId, $publicationState]
        );

        return pg_affected_rows($result);
    }

    if ($valueCodes === []) {
        return 0;
    }

    $params = [$catalogId, $publicationState];
    $placeholders = [];
    foreach ($valueCodes as $code) {
        $params[] = $code;
        $placeholders[] = '$' . count($params);
    }

    $result = api_query(
        'UPDATE crewportglobal.reference_catalog_values
         SET publication_state = $2,
             updated_at = now()
         WHERE reference_catalog_id = $1::uuid
           AND value_code IN (' . implode(', ', $placeholders) . ')',
        $params
    );

    return pg_affected_rows($result);
}

function cpg_reference_catalog_publication_with_storage(
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

    $catalogCode = cpg_reference_catalog_normalize_catalog_code($body['catalog_code'] ?? null);
    if ($catalogCode === null) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_reference_catalog_code',
            'message' => 'catalog_code is required and must be valid',
        ]);
    }

    $publicationState = cpg_reference_catalog_normalize_publication_state($body['publication_state'] ?? null);
    if ($publicationState === null || $publicationState === 'draft') {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_publication_state',
            'message' => 'publication_state must be pending_owner_review, approved, published or retired',
        ]);
    }

    $valueCodes = cpg_reference_catalog_value_codes($body['value_codes'] ?? null);
    if (array_key_exists('value_codes', $body) && ($valueCodes === [])) {
        return cpg_admin_access_response(400, [
            'ok' => false,
            'error' => 'invalid_reference_value_codes',
            'message' => 'value_codes must be an array of valid value codes',
        ]);
    }

    $reason = is_string($body['reason'] ?? null) ? trim((string) $body['reason']) : null;
    if ($reason === '') {
        $reason = null;
    }

    api_tx_begin();
    try {
        $catalog = cpg_reference_catalog_select_catalog_for_update($catalogCode);
        if ($catalog === null) {
            api_tx_rollback();
            return cpg_admin_access_response(404, [
                'ok' => false,
                'error' => 'reference_catalog_not_found',
                'message' => 'Reference catalog was not found',
            ]);
        }

        $catalogId = (string) $catalog['reference_catalog_id'];
        if ($valueCodes !== null) {
            $matched = cpg_reference_catalog_selected_value_count($catalogId, $valueCodes);
            if ($matched !== count($valueCodes)) {
                api_tx_rollback();
                return cpg_admin_access_response(404, [
                    'ok' => false,
                    'error' => 'reference_catalog_values_not_found',
                    'message' => 'One or more reference values were not found in the catalog',
                ]);
            }
        }

        $previousCounts = cpg_reference_catalog_state_counts($catalogId);
        $previousCatalogState = (string) $catalog['publication_state'];

        $catalogStateUpdated = false;
        if ($valueCodes === null || in_array($publicationState, ['approved', 'published'], true)) {
            api_query(
                'UPDATE crewportglobal.reference_catalogs
                 SET publication_state = $2,
                     updated_at = now()
                 WHERE reference_catalog_id = $1::uuid',
                [$catalogId, $publicationState]
            );
            $catalogStateUpdated = true;
        }

        $updatedValueCount = cpg_reference_catalog_update_values($catalogId, $publicationState, $valueCodes);
        $newCounts = cpg_reference_catalog_state_counts($catalogId);

        cpg_access_write_audit_event([
            'actor_user_id' => (string) ($session['user_id'] ?? ''),
            'event_type' => 'reference_catalog_publication_state_changed',
            'previous_value' => [
                'catalog_code' => $catalogCode,
                'catalog_publication_state' => $previousCatalogState,
                'value_state_counts' => $previousCounts,
            ],
            'new_value' => [
                'catalog_code' => $catalogCode,
                'catalog_publication_state' => $catalogStateUpdated ? $publicationState : $previousCatalogState,
                'target_publication_state' => $publicationState,
                'value_codes' => $valueCodes,
                'updated_value_count' => $updatedValueCount,
                'value_state_counts' => $newCounts,
            ],
            'reason' => $reason,
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
        ]);

        api_tx_commit();
        return cpg_admin_access_response(200, [
            'ok' => true,
            'catalog_code' => $catalogCode,
            'publication_state' => $publicationState,
            'catalog_state_updated' => $catalogStateUpdated,
            'updated_value_count' => $updatedValueCount,
            'previous_value_state_counts' => $previousCounts,
            'new_value_state_counts' => $newCounts,
            'published_values_are_public' => $publicationState === 'published',
        ]);
    } catch (Throwable $throwable) {
        api_tx_rollback();
        throw $throwable;
    }
}
