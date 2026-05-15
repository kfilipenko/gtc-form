<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access_pg_storage.php';

const CPG_ADMIN_ACCESS_STORAGE_MODE_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE';
const CPG_ADMIN_ACCESS_STORAGE_MODE_LEGACY_ENV = 'CPG_ADMIN_ACCESS_STORAGE_MODE';
const CPG_ADMIN_ACCESS_STORAGE_MODE_DISABLED = 'disabled';
const CPG_ADMIN_ACCESS_STORAGE_MODE_PGSQL = 'pgsql';

function cpg_admin_access_storage_factory_env_value(string $name, ?array $env = null): ?string {
    if (is_array($env) && array_key_exists($name, $env)) {
        $value = $env[$name];
        return is_string($value) ? trim($value) : null;
    }

    $value = getenv($name);
    return is_string($value) ? trim($value) : null;
}

function cpg_admin_access_storage_factory_mode(?array $env = null): string {
    $value = cpg_admin_access_storage_factory_env_value(CPG_ADMIN_ACCESS_STORAGE_MODE_ENV, $env);
    if ($value === null || $value === '') {
        $value = cpg_admin_access_storage_factory_env_value(CPG_ADMIN_ACCESS_STORAGE_MODE_LEGACY_ENV, $env);
    }

    if ($value === null || $value === '') {
        return CPG_ADMIN_ACCESS_STORAGE_MODE_DISABLED;
    }

    $normalized = strtolower(trim($value));
    if (in_array($normalized, ['0', 'false', 'off', 'none', 'disabled'], true)) {
        return CPG_ADMIN_ACCESS_STORAGE_MODE_DISABLED;
    }

    if (in_array($normalized, ['postgres', 'postgresql', 'pgsql'], true)) {
        return CPG_ADMIN_ACCESS_STORAGE_MODE_PGSQL;
    }

    return 'invalid';
}

function cpg_admin_access_storage_factory_status(?array $env = null): array {
    $mode = cpg_admin_access_storage_factory_mode($env);
    if ($mode === CPG_ADMIN_ACCESS_STORAGE_MODE_PGSQL) {
        return [
            'ok' => true,
            'mode' => $mode,
            'error' => null,
        ];
    }

    if ($mode === CPG_ADMIN_ACCESS_STORAGE_MODE_DISABLED) {
        return [
            'ok' => false,
            'mode' => $mode,
            'error' => 'admin_access_storage_not_configured',
        ];
    }

    return [
        'ok' => false,
        'mode' => $mode,
        'error' => 'admin_access_storage_mode_invalid',
    ];
}

function cpg_admin_access_storage_factory_disabled_response(?array $env = null): ?array {
    $status = cpg_admin_access_storage_factory_status($env);
    if (($status['ok'] ?? false) === true) {
        return null;
    }

    $error = (string) ($status['error'] ?? 'admin_access_storage_not_configured');
    $message = $error === 'admin_access_storage_mode_invalid'
        ? 'Admin access storage mode is invalid'
        : 'Admin access storage is not configured yet';

    return [
        'status' => 503,
        'payload' => [
            'ok' => false,
            'error' => $error,
            'message' => $message,
        ],
    ];
}

function cpg_admin_access_pg_api_query_executor(): callable {
    return static function (string $sql, array $params): array {
        if (!function_exists('api_query')) {
            throw new RuntimeException('api_query is required for PostgreSQL admin access storage');
        }

        $result = api_query($sql, $params);
        $rows = [];
        while (($row = pg_fetch_assoc($result)) !== false) {
            if (is_array($row)) {
                $rows[] = $row;
            }
        }

        return $rows;
    };
}

function cpg_admin_access_create_storage(?array $env = null, ?callable $query = null): ?CpgAdminAccessStorage {
    $status = cpg_admin_access_storage_factory_status($env);
    if (($status['ok'] ?? false) !== true) {
        return null;
    }

    if (($status['mode'] ?? null) === CPG_ADMIN_ACCESS_STORAGE_MODE_PGSQL) {
        return new CpgAdminAccessPgStorage($query ?? cpg_admin_access_pg_api_query_executor());
    }

    throw new RuntimeException('Unsupported admin access storage mode');
}
