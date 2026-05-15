<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_pg_storage.php';

function cpg_admin_pg_storage_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

final class CpgAdminAccessPgQueryRecorder {
    /** @var array<int, array{sql: string, params: array}> */
    public array $calls = [];

    /** @var array<int, array> */
    private array $responses;

    public function __construct(array $responses) {
        $this->responses = $responses;
    }

    public function __invoke(string $sql, array $params): array {
        $this->calls[] = [
            'sql' => $sql,
            'params' => $params,
        ];

        return array_shift($this->responses) ?? [];
    }
}

$ownerUserId = '11111111-1111-4111-8111-111111111111';
$codeId = '33333333-3333-4333-8333-333333333333';
$sessionId = '44444444-4444-4444-8444-444444444444';

$recorder = new CpgAdminAccessPgQueryRecorder([
    [[
        'user_id' => $ownerUserId,
        'email' => 'owner@crewportglobal.com',
        'is_active' => 't',
        'permissions' => '{view_admin_console,view_users}',
        'roles' => '{platform_administrator}',
        'groups' => '{platform_administrators}',
    ]],
    [[
        'admin_email_code_id' => $codeId,
        'user_id' => $ownerUserId,
        'code_hash' => '$2y$example-hash',
        'purpose' => 'admin_access',
        'expires_at' => '2026-05-15 12:10:00+00',
        'used_at' => null,
        'attempt_count' => 0,
        'created_at' => '2026-05-15 12:00:00+00',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'pg-storage-test',
    ]],
    [[
        'admin_email_code_id' => $codeId,
        'user_id' => $ownerUserId,
        'code_hash' => '$2y$example-hash',
        'purpose' => 'admin_access',
        'expires_at' => '2026-05-15 12:10:00+00',
        'used_at' => null,
        'attempt_count' => 0,
        'created_at' => '2026-05-15 12:00:00+00',
        'ip_address' => '127.0.0.1',
        'user_agent' => 'pg-storage-test',
    ]],
    [[
        'admin_email_code_id' => $codeId,
        'attempt_count' => 1,
    ]],
    [[
        'admin_email_code_id' => $codeId,
        'used_at' => '2026-05-15 12:02:00+00',
    ]],
    [[
        'admin_session_id' => $sessionId,
        'user_id' => $ownerUserId,
        'created_at' => '2026-05-15 12:02:00+00',
        'expires_at' => '2026-05-15 12:32:00+00',
        'revoked_at' => null,
        'last_used_at' => null,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'pg-storage-test',
    ]],
    [],
    [[
        'admin_session_id' => $sessionId,
        'user_id' => $ownerUserId,
        'created_at' => '2026-05-15 12:02:00+00',
        'expires_at' => '2026-05-15 12:32:00+00',
        'revoked_at' => null,
        'last_used_at' => null,
        'email' => 'owner@crewportglobal.com',
        'is_active' => 't',
        'permissions' => '{view_admin_console,view_full_audit_log}',
        'roles' => '{project_owner}',
        'groups' => '{platform_owners}',
    ]],
    [[
        'admin_session_id' => $sessionId,
        'user_id' => $ownerUserId,
        'created_at' => '2026-05-15 12:02:00+00',
        'expires_at' => '2026-05-15 12:32:00+00',
        'revoked_at' => '2026-05-15 12:10:00+00',
        'last_used_at' => null,
    ]],
    [[
        'access_audit_event_id' => '55555555-5555-4555-8555-555555555555',
        'event_type' => 'project_owner_bootstrap_completed',
        'reason' => 'static query test',
        'created_at' => '2026-05-15 12:02:00+00',
        'actor_email' => 'owner@crewportglobal.com',
        'target_user_email' => 'owner@crewportglobal.com',
        'target_group_code' => 'platform_owners',
        'target_role_code' => 'project_owner',
        'target_permission_code' => null,
    ]],
]);

$storage = new CpgAdminAccessPgStorage($recorder);
cpg_admin_pg_storage_test_assert(count($recorder->calls) === 0, 'PG storage constructor must not query the database');

$user = $storage->findAdminUserByEmail('Owner@CrewPortGlobal.com');
$findUserCall = $recorder->calls[0];
cpg_admin_pg_storage_test_assert($user !== null, 'PG storage should return admin user rows');
cpg_admin_pg_storage_test_assert(($user['email'] ?? null) === 'owner@crewportglobal.com', 'PG storage should normalize user email from row');
cpg_admin_pg_storage_test_assert(($user['is_active'] ?? null) === true, 'PG storage should parse PostgreSQL boolean values');
cpg_admin_pg_storage_test_assert(in_array('view_admin_console', $user['permissions'] ?? [], true), 'PG storage should parse permission arrays');
cpg_admin_pg_storage_test_assert(in_array('platform_administrator', $user['roles'] ?? [], true), 'PG storage should parse role arrays');
cpg_admin_pg_storage_test_assert(in_array('platform_administrators', $user['groups'] ?? [], true), 'PG storage should parse group arrays');
cpg_admin_pg_storage_test_assert(str_contains($findUserCall['sql'], 'crewportglobal.access_group_members'), 'find user SQL should join access_group_members');
cpg_admin_pg_storage_test_assert(str_contains($findUserCall['sql'], 'crewportglobal.access_role_permissions'), 'find user SQL should join role permissions');
cpg_admin_pg_storage_test_assert(str_contains($findUserCall['sql'], 'lower(u.email) = lower($1)'), 'find user SQL should use normalized parameter matching');
cpg_admin_pg_storage_test_assert($findUserCall['params'] === ['owner@crewportglobal.com', 'active'], 'find user SQL should use parameters only');
cpg_admin_pg_storage_test_assert(!str_contains($findUserCall['sql'], 'Owner@CrewPortGlobal.com'), 'find user SQL must not interpolate email');

$stored = $storage->storeAdminEmailCode([
    'user_id' => $ownerUserId,
    'code_hash' => '$2y$example-hash',
    'purpose' => 'admin_access',
    'expires_at' => '2026-05-15T12:10:00+00:00',
    'attempt_count' => 0,
    'created_at' => '2026-05-15T12:00:00+00:00',
    'ip_address' => '127.0.0.1',
    'user_agent' => 'pg-storage-test',
]);
$storeCall = $recorder->calls[1];
cpg_admin_pg_storage_test_assert(($stored['admin_email_code_id'] ?? null) === $codeId, 'store code should return inserted row');
cpg_admin_pg_storage_test_assert(str_contains($storeCall['sql'], 'INSERT INTO crewportglobal.admin_email_codes'), 'store code SQL should insert admin_email_codes');
cpg_admin_pg_storage_test_assert(str_contains($storeCall['sql'], '$1::uuid'), 'store code SQL should cast user_id parameter');
cpg_admin_pg_storage_test_assert(str_contains($storeCall['sql'], '$7::inet'), 'store code SQL should cast ip_address parameter');
cpg_admin_pg_storage_test_assert(str_contains($storeCall['sql'], 'RETURNING admin_email_code_id::text'), 'store code SQL should return inserted row');
cpg_admin_pg_storage_test_assert($storeCall['params'][1] === '$2y$example-hash', 'store code SQL should pass code hash as a parameter');
cpg_admin_pg_storage_test_assert(!str_contains($storeCall['sql'], '$2y$example-hash'), 'store code SQL must not interpolate code hash');

$pending = $storage->findPendingAdminEmailCode($ownerUserId, 'admin_access', new DateTimeImmutable('2026-05-15T12:02:00+00:00'));
$pendingCall = $recorder->calls[2];
cpg_admin_pg_storage_test_assert(($pending['admin_email_code_id'] ?? null) === $codeId, 'pending code query should return latest pending row');
cpg_admin_pg_storage_test_assert(str_contains($pendingCall['sql'], 'used_at IS NULL'), 'pending code SQL should require unused code');
cpg_admin_pg_storage_test_assert(str_contains($pendingCall['sql'], 'expires_at > $3::timestamptz'), 'pending code SQL should require unexpired code');
cpg_admin_pg_storage_test_assert(str_contains($pendingCall['sql'], 'ORDER BY created_at DESC'), 'pending code SQL should select newest code first');
cpg_admin_pg_storage_test_assert($pendingCall['params'][2] === '2026-05-15T12:02:00+00:00', 'pending code SQL should pass current time as parameter');

$updated = $storage->incrementAdminEmailCodeAttempts($codeId);
$incrementCall = $recorder->calls[3];
cpg_admin_pg_storage_test_assert((int) ($updated['attempt_count'] ?? 0) === 1, 'increment attempts should return updated attempt count');
cpg_admin_pg_storage_test_assert(str_contains($incrementCall['sql'], 'attempt_count = attempt_count + 1'), 'increment attempts SQL should be atomic');
cpg_admin_pg_storage_test_assert($incrementCall['params'] === [$codeId], 'increment attempts SQL should use id parameter only');

$used = $storage->markAdminEmailCodeUsed($codeId, new DateTimeImmutable('2026-05-15T12:02:00+00:00'));
$usedCall = $recorder->calls[4];
cpg_admin_pg_storage_test_assert(($used['used_at'] ?? null) !== null, 'mark used should return used_at value');
cpg_admin_pg_storage_test_assert(str_contains($usedCall['sql'], 'SET used_at = $2::timestamptz'), 'mark used SQL should set used_at by parameter');

$session = $storage->createAdminSession([
    'user_id' => $ownerUserId,
    'created_at' => '2026-05-15T12:02:00+00:00',
    'expires_at' => '2026-05-15T12:32:00+00:00',
    'ip_address' => '127.0.0.1',
    'user_agent' => 'pg-storage-test',
]);
$sessionCall = $recorder->calls[5];
cpg_admin_pg_storage_test_assert(($session['admin_session_id'] ?? null) === $sessionId, 'create session should return inserted session');
cpg_admin_pg_storage_test_assert(str_contains($sessionCall['sql'], 'INSERT INTO crewportglobal.admin_sessions'), 'create session SQL should insert admin_sessions');
cpg_admin_pg_storage_test_assert(str_contains($sessionCall['sql'], '$4::inet'), 'create session SQL should cast ip parameter');

$storage->writeAdminAccessAuditEvent([
    'actor_user_id' => $ownerUserId,
    'event_type' => 'admin_email_code_verified',
    'previous_value' => [],
    'new_value' => ['purpose' => 'admin_access'],
    'reason' => 'static query test',
    'ip_address' => '127.0.0.1',
    'user_agent' => 'pg-storage-test',
    'created_at' => '2026-05-15T12:02:00+00:00',
]);
$auditCall = $recorder->calls[6];
cpg_admin_pg_storage_test_assert(str_contains($auditCall['sql'], 'INSERT INTO crewportglobal.access_audit_events'), 'audit SQL should insert access_audit_events');
cpg_admin_pg_storage_test_assert(str_contains($auditCall['sql'], '$7::jsonb'), 'audit SQL should cast previous_value as JSONB');
cpg_admin_pg_storage_test_assert(str_contains($auditCall['sql'], '$10::inet'), 'audit SQL should cast ip parameter');
cpg_admin_pg_storage_test_assert(json_decode((string) $auditCall['params'][7], true) === ['purpose' => 'admin_access'], 'audit SQL should JSON encode new_value parameter');

$activeSession = $storage->findActiveAdminSession($sessionId, new DateTimeImmutable('2026-05-15T12:10:00+00:00'));
$activeSessionCall = $recorder->calls[7];
cpg_admin_pg_storage_test_assert(($activeSession['admin_session_id'] ?? null) === $sessionId, 'active session query should return session row');
cpg_admin_pg_storage_test_assert(in_array('project_owner', $activeSession['roles'] ?? [], true), 'active session query should parse roles');
cpg_admin_pg_storage_test_assert(in_array('platform_owners', $activeSession['groups'] ?? [], true), 'active session query should parse groups');
cpg_admin_pg_storage_test_assert(str_contains($activeSessionCall['sql'], 'FROM crewportglobal.admin_sessions'), 'active session SQL should read admin_sessions');
cpg_admin_pg_storage_test_assert(str_contains($activeSessionCall['sql'], 's.revoked_at IS NULL'), 'active session SQL should reject revoked sessions');
cpg_admin_pg_storage_test_assert(str_contains($activeSessionCall['sql'], 's.expires_at > $2::timestamptz'), 'active session SQL should reject expired sessions');

$revokedSession = $storage->revokeAdminSession($sessionId, new DateTimeImmutable('2026-05-15T12:10:00+00:00'));
$revokeSessionCall = $recorder->calls[8];
cpg_admin_pg_storage_test_assert(($revokedSession['revoked_at'] ?? null) !== null, 'revoke session should return revoked_at');
cpg_admin_pg_storage_test_assert(str_contains($revokeSessionCall['sql'], 'SET revoked_at = $2::timestamptz'), 'revoke session SQL should set revoked_at by parameter');

$auditEvents = $storage->readRecentAccessAuditEvents(12);
$readAuditCall = $recorder->calls[9];
cpg_admin_pg_storage_test_assert(($auditEvents[0]['event_type'] ?? null) === 'project_owner_bootstrap_completed', 'recent audit query should return event rows');
cpg_admin_pg_storage_test_assert(str_contains($readAuditCall['sql'], 'ORDER BY e.created_at DESC'), 'recent audit SQL should order newest first');
cpg_admin_pg_storage_test_assert(str_contains($readAuditCall['sql'], 'LIMIT $1::int'), 'recent audit SQL should use a bounded limit parameter');
cpg_admin_pg_storage_test_assert(count($recorder->calls) === 10, 'PG storage test should cover all adapter methods');

fwrite(STDOUT, "Admin access PostgreSQL storage adapter tests passed\n");
