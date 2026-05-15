<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';

interface CpgAdminAccessStorage {
    public function findAdminUserByEmail(string $email): ?array;

    public function storeAdminEmailCode(array $record): array;

    public function findPendingAdminEmailCode(string $userId, string $purpose, DateTimeImmutable $now): ?array;

    public function incrementAdminEmailCodeAttempts(string $adminEmailCodeId): array;

    public function markAdminEmailCodeUsed(string $adminEmailCodeId, DateTimeImmutable $now): array;

    public function createAdminSession(array $record): array;

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

    /** @var array<int, array> */
    private array $auditEvents = [];

    public function __construct(array $users = []) {
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
