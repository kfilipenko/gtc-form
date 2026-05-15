<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access_storage.php';

function cpg_admin_access_pg_text_list(mixed $value): array {
    if (is_array($value)) {
        return array_values(array_filter(array_map(
            static fn (mixed $item): string => strtolower(trim((string) $item)),
            $value
        )));
    }

    if (!is_string($value)) {
        return [];
    }

    $trimmed = trim($value);
    if ($trimmed === '' || $trimmed === '{}') {
        return [];
    }

    if (str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) {
        $trimmed = substr($trimmed, 1, -1);
    }

    return array_values(array_filter(array_map(
        static fn (string $item): string => strtolower(trim($item, " \t\n\r\0\x0B\"")),
        str_getcsv($trimmed, ',', '"', '\\')
    )));
}

function cpg_admin_access_pg_optional_string(mixed $value): ?string {
    if ($value === null) {
        return null;
    }

    $string = trim((string) $value);
    return $string === '' ? null : $string;
}

function cpg_admin_access_pg_required_string(array $record, string $key): string {
    $value = cpg_admin_access_pg_optional_string($record[$key] ?? null);
    if ($value === null) {
        throw new InvalidArgumentException("Missing {$key}");
    }

    return $value;
}

function cpg_admin_access_pg_json_param(mixed $value): string {
    $encoded = json_encode(is_array($value) ? $value : new stdClass(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($encoded)) {
        return '{}';
    }

    return $encoded;
}

final class CpgAdminAccessPgStorage implements CpgAdminAccessStorage {
    private Closure $query;

    public function __construct(callable $query) {
        $this->query = Closure::fromCallable($query);
    }

    private function queryRows(string $sql, array $params = []): array {
        $rows = ($this->query)($sql, $params);
        if (!is_array($rows)) {
            throw new RuntimeException('Admin access PostgreSQL query executor must return an array of rows');
        }

        return $rows;
    }

    private function firstRow(string $sql, array $params = []): ?array {
        $rows = $this->queryRows($sql, $params);
        $row = $rows[0] ?? null;
        return is_array($row) ? $row : null;
    }

    public function findAdminUserByEmail(string $email): ?array {
        $row = $this->firstRow(
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
             WHERE lower(u.email) = lower($1)
             GROUP BY u.user_id, u.email, u.is_active
             LIMIT 1',
            [cpg_admin_access_storage_normalize_email($email), 'active']
        );

        if ($row === null) {
            return null;
        }

        return [
            'user_id' => (string) $row['user_id'],
            'email' => (string) $row['email'],
            'is_active' => cpg_admin_access_storage_normalize_bool($row['is_active'] ?? true, true),
            'permissions' => cpg_admin_access_pg_text_list($row['permissions'] ?? []),
            'roles' => cpg_admin_access_pg_text_list($row['roles'] ?? []),
            'groups' => cpg_admin_access_pg_text_list($row['groups'] ?? []),
        ];
    }

    public function storeAdminEmailCode(array $record): array {
        $row = $this->firstRow(
            'INSERT INTO crewportglobal.admin_email_codes
               (user_id, code_hash, purpose, expires_at, attempt_count, created_at, ip_address, user_agent)
             VALUES ($1::uuid, $2, $3, $4::timestamptz, $5, $6::timestamptz, $7::inet, $8)
             RETURNING admin_email_code_id::text AS admin_email_code_id,
                       user_id::text AS user_id,
                       code_hash,
                       purpose,
                       expires_at::text AS expires_at,
                       used_at::text AS used_at,
                       attempt_count,
                       created_at::text AS created_at,
                       ip_address::text AS ip_address,
                       user_agent',
            [
                cpg_admin_access_pg_required_string($record, 'user_id'),
                cpg_admin_access_pg_required_string($record, 'code_hash'),
                (string) ($record['purpose'] ?? CPG_ADMIN_ACCESS_PURPOSE),
                cpg_admin_access_pg_required_string($record, 'expires_at'),
                (int) ($record['attempt_count'] ?? 0),
                (string) ($record['created_at'] ?? cpg_admin_format_time(cpg_admin_now())),
                cpg_admin_access_pg_optional_string($record['ip_address'] ?? null),
                cpg_admin_access_pg_optional_string($record['user_agent'] ?? null),
            ]
        );

        return $row ?? [];
    }

    public function findPendingAdminEmailCode(string $userId, string $purpose, DateTimeImmutable $now): ?array {
        return $this->firstRow(
            'SELECT admin_email_code_id::text AS admin_email_code_id,
                    user_id::text AS user_id,
                    code_hash,
                    purpose,
                    expires_at::text AS expires_at,
                    used_at::text AS used_at,
                    attempt_count,
                    created_at::text AS created_at,
                    ip_address::text AS ip_address,
                    user_agent
             FROM crewportglobal.admin_email_codes
             WHERE user_id = $1::uuid
               AND purpose = $2
               AND used_at IS NULL
               AND expires_at > $3::timestamptz
             ORDER BY created_at DESC
             LIMIT 1',
            [$userId, $purpose, cpg_admin_format_time($now)]
        );
    }

    public function incrementAdminEmailCodeAttempts(string $adminEmailCodeId): array {
        $row = $this->firstRow(
            'UPDATE crewportglobal.admin_email_codes
             SET attempt_count = attempt_count + 1
             WHERE admin_email_code_id = $1::uuid
             RETURNING admin_email_code_id::text AS admin_email_code_id,
                       user_id::text AS user_id,
                       code_hash,
                       purpose,
                       expires_at::text AS expires_at,
                       used_at::text AS used_at,
                       attempt_count,
                       created_at::text AS created_at,
                       ip_address::text AS ip_address,
                       user_agent',
            [$adminEmailCodeId]
        );

        return $row ?? [];
    }

    public function markAdminEmailCodeUsed(string $adminEmailCodeId, DateTimeImmutable $now): array {
        $row = $this->firstRow(
            'UPDATE crewportglobal.admin_email_codes
             SET used_at = $2::timestamptz
             WHERE admin_email_code_id = $1::uuid
             RETURNING admin_email_code_id::text AS admin_email_code_id,
                       user_id::text AS user_id,
                       code_hash,
                       purpose,
                       expires_at::text AS expires_at,
                       used_at::text AS used_at,
                       attempt_count,
                       created_at::text AS created_at,
                       ip_address::text AS ip_address,
                       user_agent',
            [$adminEmailCodeId, cpg_admin_format_time($now)]
        );

        return $row ?? [];
    }

    public function createAdminSession(array $record): array {
        $row = $this->firstRow(
            'INSERT INTO crewportglobal.admin_sessions
               (user_id, created_at, expires_at, ip_address, user_agent)
             VALUES ($1::uuid, $2::timestamptz, $3::timestamptz, $4::inet, $5)
             RETURNING admin_session_id::text AS admin_session_id,
                       user_id::text AS user_id,
                       created_at::text AS created_at,
                       expires_at::text AS expires_at,
                       revoked_at::text AS revoked_at,
                       last_used_at::text AS last_used_at,
                       ip_address::text AS ip_address,
                       user_agent',
            [
                cpg_admin_access_pg_required_string($record, 'user_id'),
                (string) ($record['created_at'] ?? cpg_admin_format_time(cpg_admin_now())),
                cpg_admin_access_pg_required_string($record, 'expires_at'),
                cpg_admin_access_pg_optional_string($record['ip_address'] ?? null),
                cpg_admin_access_pg_optional_string($record['user_agent'] ?? null),
            ]
        );

        return $row ?? [];
    }

    public function writeAdminAccessAuditEvent(array $event): void {
        $this->queryRows(
            'INSERT INTO crewportglobal.access_audit_events
               (actor_user_id, event_type, target_user_id, target_group_id, target_role_id, target_permission_id,
                previous_value, new_value, reason, ip_address, user_agent, created_at)
             VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid,
                     $7::jsonb, $8::jsonb, $9, $10::inet, $11, $12::timestamptz)',
            [
                cpg_admin_access_pg_optional_string($event['actor_user_id'] ?? null),
                cpg_admin_access_pg_required_string($event, 'event_type'),
                cpg_admin_access_pg_optional_string($event['target_user_id'] ?? null),
                cpg_admin_access_pg_optional_string($event['target_group_id'] ?? null),
                cpg_admin_access_pg_optional_string($event['target_role_id'] ?? null),
                cpg_admin_access_pg_optional_string($event['target_permission_id'] ?? null),
                cpg_admin_access_pg_json_param($event['previous_value'] ?? []),
                cpg_admin_access_pg_json_param($event['new_value'] ?? []),
                cpg_admin_access_pg_optional_string($event['reason'] ?? null),
                cpg_admin_access_pg_optional_string($event['ip_address'] ?? null),
                cpg_admin_access_pg_optional_string($event['user_agent'] ?? null),
                (string) ($event['created_at'] ?? cpg_admin_format_time(cpg_admin_now())),
            ]
        );
    }
}
