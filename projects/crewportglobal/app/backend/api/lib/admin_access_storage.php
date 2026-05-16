<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';

interface CpgAdminAccessStorage {
    public function findAdminUserByEmail(string $email): ?array;

    public function readAccessManagementSnapshot(): array;

    public function createAccessUser(array $record): array;

    public function addAccessGroupMember(array $record): array;

    public function storeAdminEmailCode(array $record): array;

    public function findPendingAdminEmailCode(string $userId, string $purpose, DateTimeImmutable $now): ?array;

    public function incrementAdminEmailCodeAttempts(string $adminEmailCodeId): array;

    public function markAdminEmailCodeUsed(string $adminEmailCodeId, DateTimeImmutable $now): array;

    public function createAdminSession(array $record): array;

    public function findActiveAdminSession(string $adminSessionId, DateTimeImmutable $now): ?array;

    public function revokeAdminSession(string $adminSessionId, DateTimeImmutable $now): ?array;

    public function readRecentAccessAuditEvents(int $limit = 10): array;

    public function writeAdminAccessAuditEvent(array $event): void;
}

function cpg_admin_access_storage_uuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

    $hex = bin2hex($bytes);
    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function cpg_admin_access_storage_normalize_email(string $email): string {
    return strtolower(trim($email));
}

function cpg_admin_access_storage_normalize_bool(mixed $value, bool $default = true): bool {
    if (is_bool($value)) {
        return $value;
    }

    if (is_int($value)) {
        return $value !== 0;
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['1', 't', 'true', 'yes', 'on', 'active'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'f', 'false', 'no', 'off', 'inactive', 'disabled'], true)) {
            return false;
        }
    }

    return $default;
}

function cpg_admin_access_storage_text_list(mixed $value): array {
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

function cpg_admin_access_storage_sort_newest_first(array $left, array $right): int {
    $leftCreated = cpg_admin_parse_time($left['created_at'] ?? null);
    $rightCreated = cpg_admin_parse_time($right['created_at'] ?? null);

    return ($rightCreated?->getTimestamp() ?? 0) <=> ($leftCreated?->getTimestamp() ?? 0);
}

final class CpgAdminAccessMemoryStorage implements CpgAdminAccessStorage {
    /** @var array<string, array> */
    private array $usersByEmail = [];

    /** @var array<string, array> */
    private array $emailCodesById = [];

    /** @var array<string, array> */
    private array $sessionsById = [];

    /** @var array<string, array> */
    private array $groupsByCode = [];

    /** @var array<int, array> */
    private array $auditEvents = [];

    public function __construct(array $users = [], array $groups = []) {
        $defaultGroups = [
            [
                'group_id' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
                'group_code' => 'owners',
                'group_name' => 'Owners',
                'group_type' => 'administration',
                'description' => 'Owner/admin access group.',
                'is_active' => true,
            ],
            [
                'group_id' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
                'group_code' => 'cpg_team',
                'group_name' => 'CPG team',
                'group_type' => 'internal',
                'description' => 'CrewPortGlobal team access group.',
                'is_active' => true,
            ],
        ];

        foreach (array_merge($defaultGroups, $groups) as $group) {
            if (!is_array($group) || !isset($group['group_code'])) {
                continue;
            }

            $groupCode = strtolower(trim((string) $group['group_code']));
            if ($groupCode === '') {
                continue;
            }

            $this->groupsByCode[$groupCode] = array_merge($group, ['group_code' => $groupCode]);
        }

        foreach ($users as $user) {
            if (!is_array($user) || !isset($user['email'])) {
                continue;
            }

            $email = cpg_admin_access_storage_normalize_email((string) $user['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            $this->usersByEmail[$email] = array_merge($user, ['email' => $email]);
        }
    }

    public function findAdminUserByEmail(string $email): ?array {
        $normalized = cpg_admin_access_storage_normalize_email($email);
        return $this->usersByEmail[$normalized] ?? null;
    }

    public function readAccessManagementSnapshot(): array {
        $users = array_values(array_map(
            static function (array $user): array {
                return [
                    'user_id' => (string) ($user['user_id'] ?? ''),
                    'email' => (string) ($user['email'] ?? ''),
                    'display_name' => $user['display_name'] ?? null,
                    'registration_status' => (string) ($user['registration_status'] ?? 'draft'),
                    'is_active' => cpg_admin_access_storage_normalize_bool($user['is_active'] ?? true, true),
                    'groups' => cpg_admin_access_storage_text_list($user['groups'] ?? []),
                    'created_at' => (string) ($user['created_at'] ?? ''),
                    'updated_at' => (string) ($user['updated_at'] ?? ''),
                ];
            },
            $this->usersByEmail
        ));

        $groups = array_values(array_map(
            function (array $group): array {
                $groupCode = (string) ($group['group_code'] ?? '');
                $memberCount = 0;
                foreach ($this->usersByEmail as $user) {
                    if (in_array($groupCode, cpg_admin_access_storage_text_list($user['groups'] ?? []), true)) {
                        $memberCount += 1;
                    }
                }

                return [
                    'group_id' => (string) ($group['group_id'] ?? ''),
                    'group_code' => $groupCode,
                    'group_name' => (string) ($group['group_name'] ?? $groupCode),
                    'group_type' => (string) ($group['group_type'] ?? 'internal'),
                    'description' => $group['description'] ?? null,
                    'is_active' => cpg_admin_access_storage_normalize_bool($group['is_active'] ?? true, true),
                    'roles' => cpg_admin_access_storage_text_list($group['roles'] ?? []),
                    'active_member_count' => $memberCount,
                ];
            },
            $this->groupsByCode
        ));

        return [
            'users' => $users,
            'groups' => $groups,
        ];
    }

    public function createAccessUser(array $record): array {
        $email = cpg_admin_access_storage_normalize_email((string) ($record['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Valid email is required');
        }

        $existing = $this->usersByEmail[$email] ?? null;
        $displayName = $record['display_name'] ?? null;
        if (is_string($displayName)) {
            $displayName = trim($displayName);
            if ($displayName === '') {
                $displayName = null;
            }
        } else {
            $displayName = null;
        }

        $stored = array_merge($existing ?? [], [
            'user_id' => (string) ($existing['user_id'] ?? $record['user_id'] ?? cpg_admin_access_storage_uuid()),
            'email' => $email,
            'display_name' => $displayName ?? ($existing['display_name'] ?? null),
            'registration_status' => (string) ($existing['registration_status'] ?? 'draft'),
            'is_active' => cpg_admin_access_storage_normalize_bool($existing['is_active'] ?? true, true),
            'created_at' => (string) ($existing['created_at'] ?? cpg_admin_format_time(cpg_admin_now())),
            'updated_at' => cpg_admin_format_time(cpg_admin_now()),
            'created' => $existing === null,
        ]);

        $this->usersByEmail[$email] = $stored;
        return $stored;
    }

    public function addAccessGroupMember(array $record): array {
        $email = cpg_admin_access_storage_normalize_email((string) ($record['email'] ?? ''));
        $groupCode = strtolower(trim((string) ($record['group_code'] ?? '')));
        $user = $this->usersByEmail[$email] ?? null;
        $group = $this->groupsByCode[$groupCode] ?? null;
        if (!is_array($user) || !is_array($group)) {
            return [];
        }

        $groups = cpg_admin_access_storage_text_list($user['groups'] ?? []);
        $created = !in_array($groupCode, $groups, true);
        if ($created) {
            $groups[] = $groupCode;
            sort($groups);
            $this->usersByEmail[$email]['groups'] = $groups;
        }

        return [
            'group_member_id' => cpg_admin_access_storage_uuid(),
            'user_id' => (string) ($user['user_id'] ?? ''),
            'email' => $email,
            'group_id' => (string) ($group['group_id'] ?? ''),
            'group_code' => $groupCode,
            'membership_state' => 'active',
            'created' => $created,
        ];
    }

    public function storeAdminEmailCode(array $record): array {
        $adminEmailCodeId = (string) ($record['admin_email_code_id'] ?? cpg_admin_access_storage_uuid());
        $createdAt = (string) ($record['created_at'] ?? cpg_admin_format_time(cpg_admin_now()));

        $stored = array_merge($record, [
            'admin_email_code_id' => $adminEmailCodeId,
            'purpose' => (string) ($record['purpose'] ?? CPG_ADMIN_ACCESS_PURPOSE),
            'attempt_count' => (int) ($record['attempt_count'] ?? 0),
            'used_at' => $record['used_at'] ?? null,
            'created_at' => $createdAt,
        ]);

        $this->emailCodesById[$adminEmailCodeId] = $stored;
        return $stored;
    }

    public function findPendingAdminEmailCode(string $userId, string $purpose, DateTimeImmutable $now): ?array {
        $candidates = array_values(array_filter(
            $this->emailCodesById,
            static function (array $record) use ($userId, $purpose, $now): bool {
                return (string) ($record['user_id'] ?? '') === $userId
                    && (string) ($record['purpose'] ?? '') === $purpose
                    && ($record['used_at'] ?? null) === null
                    && !cpg_admin_is_expired($record['expires_at'] ?? null, $now);
            }
        ));

        usort($candidates, 'cpg_admin_access_storage_sort_newest_first');
        return $candidates[0] ?? null;
    }

    public function incrementAdminEmailCodeAttempts(string $adminEmailCodeId): array {
        if (!isset($this->emailCodesById[$adminEmailCodeId])) {
            throw new InvalidArgumentException('Unknown admin email code id');
        }

        $this->emailCodesById[$adminEmailCodeId]['attempt_count'] =
            (int) ($this->emailCodesById[$adminEmailCodeId]['attempt_count'] ?? 0) + 1;

        return $this->emailCodesById[$adminEmailCodeId];
    }

    public function markAdminEmailCodeUsed(string $adminEmailCodeId, DateTimeImmutable $now): array {
        if (!isset($this->emailCodesById[$adminEmailCodeId])) {
            throw new InvalidArgumentException('Unknown admin email code id');
        }

        $this->emailCodesById[$adminEmailCodeId]['used_at'] = cpg_admin_format_time($now);
        return $this->emailCodesById[$adminEmailCodeId];
    }

    public function createAdminSession(array $record): array {
        $adminSessionId = (string) ($record['admin_session_id'] ?? cpg_admin_access_storage_uuid());
        $createdAt = (string) ($record['created_at'] ?? cpg_admin_format_time(cpg_admin_now()));

        $stored = array_merge($record, [
            'admin_session_id' => $adminSessionId,
            'created_at' => $createdAt,
            'revoked_at' => $record['revoked_at'] ?? null,
            'last_used_at' => $record['last_used_at'] ?? null,
        ]);

        $this->sessionsById[$adminSessionId] = $stored;
        return $stored;
    }

    public function findActiveAdminSession(string $adminSessionId, DateTimeImmutable $now): ?array {
        $session = $this->sessionsById[$adminSessionId] ?? null;
        if (!is_array($session) || ($session['revoked_at'] ?? null) !== null || cpg_admin_is_expired($session['expires_at'] ?? null, $now)) {
            return null;
        }

        $user = null;
        foreach ($this->usersByEmail as $candidate) {
            if ((string) ($candidate['user_id'] ?? '') === (string) ($session['user_id'] ?? '')) {
                $user = $candidate;
                break;
            }
        }

        if (!is_array($user)) {
            return null;
        }

        return array_merge($session, [
            'user_id' => (string) $user['user_id'],
            'email' => (string) $user['email'],
            'is_active' => cpg_admin_access_storage_normalize_bool($user['is_active'] ?? true, true),
            'permissions' => cpg_admin_access_storage_text_list($user['permissions'] ?? []),
            'roles' => cpg_admin_access_storage_text_list($user['roles'] ?? []),
            'groups' => cpg_admin_access_storage_text_list($user['groups'] ?? []),
        ]);
    }

    public function revokeAdminSession(string $adminSessionId, DateTimeImmutable $now): ?array {
        if (!isset($this->sessionsById[$adminSessionId])) {
            return null;
        }

        $this->sessionsById[$adminSessionId]['revoked_at'] = cpg_admin_format_time($now);
        return $this->sessionsById[$adminSessionId];
    }

    public function readRecentAccessAuditEvents(int $limit = 10): array {
        $events = $this->auditEvents;
        usort($events, 'cpg_admin_access_storage_sort_newest_first');
        return array_slice($events, 0, max(1, min(50, $limit)));
    }

    public function writeAdminAccessAuditEvent(array $event): void {
        $this->auditEvents[] = array_merge([
            'created_at' => cpg_admin_format_time(cpg_admin_now()),
        ], $event);
    }

    public function adminEmailCodes(): array {
        return array_values($this->emailCodesById);
    }

    public function adminSessions(): array {
        return array_values($this->sessionsById);
    }

    public function auditEvents(): array {
        return $this->auditEvents;
    }
}
