<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/admin_access_storage_factory.php';

function cpg_admin_storage_factory_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$defaultStatus = cpg_admin_access_storage_factory_status([]);
cpg_admin_storage_factory_test_assert(
    ($defaultStatus['mode'] ?? null) === 'disabled',
    'admin access storage factory should default to disabled mode'
);
cpg_admin_storage_factory_test_assert(
    ($defaultStatus['error'] ?? null) === 'admin_access_storage_not_configured',
    'disabled storage mode should expose not-configured error'
);
cpg_admin_storage_factory_test_assert(
    cpg_admin_access_create_storage([]) === null,
    'disabled storage mode should not create a storage adapter'
);

$disabledResponse = cpg_admin_access_storage_factory_disabled_response([]);
cpg_admin_storage_factory_test_assert(
    ($disabledResponse['status'] ?? null) === 503,
    'disabled storage response should use HTTP 503'
);
cpg_admin_storage_factory_test_assert(
    ($disabledResponse['payload']['error'] ?? null) === 'admin_access_storage_not_configured',
    'disabled storage response should use explicit not-configured error'
);

$legacyStatus = cpg_admin_access_storage_factory_status([
    'CPG_ADMIN_ACCESS_STORAGE_MODE' => 'postgresql',
]);
cpg_admin_storage_factory_test_assert(
    ($legacyStatus['ok'] ?? false) === true && ($legacyStatus['mode'] ?? null) === 'pgsql',
    'legacy PostgreSQL storage mode should normalize to pgsql'
);

$invalidStatus = cpg_admin_access_storage_factory_status([
    'CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE' => 'memory',
]);
cpg_admin_storage_factory_test_assert(
    ($invalidStatus['error'] ?? null) === 'admin_access_storage_mode_invalid',
    'unsupported storage mode should be invalid'
);
cpg_admin_storage_factory_test_assert(
    cpg_admin_access_create_storage(['CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE' => 'memory']) === null,
    'invalid storage mode should not create a storage adapter'
);

$queryCount = 0;
$fakeQuery = static function (string $sql, array $params) use (&$queryCount): array {
    $queryCount += 1;
    return [];
};

$storage = cpg_admin_access_create_storage([
    'CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE' => 'pgsql',
], $fakeQuery);
cpg_admin_storage_factory_test_assert(
    $storage instanceof CpgAdminAccessPgStorage,
    'pgsql storage mode should create PostgreSQL storage adapter'
);
cpg_admin_storage_factory_test_assert(
    $queryCount === 0,
    'creating PostgreSQL storage adapter must not query the database'
);
cpg_admin_storage_factory_test_assert(
    cpg_admin_access_storage_factory_disabled_response([
        'CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE' => 'pgsql',
    ]) === null,
    'configured PostgreSQL mode should not return disabled storage response'
);

$storage->findAdminUserByEmail('owner@example.com');
cpg_admin_storage_factory_test_assert(
    $queryCount === 1,
    'PostgreSQL storage adapter should query only when a storage method is called'
);

$source = file_get_contents(__DIR__ . '/../public/index.php');
cpg_admin_storage_factory_test_assert(is_string($source), 'public index should be readable');
cpg_admin_storage_factory_test_assert(
    !str_contains($source, "require_once __DIR__ . '/../lib/admin_access_storage_factory.php';"),
    'public route must not include storage factory until runtime activation is approved'
);
cpg_admin_storage_factory_test_assert(
    !str_contains($source, 'cpg_admin_access_create_storage('),
    'public route must not create storage until runtime activation is approved'
);

fwrite(STDOUT, "Admin access storage factory tests passed\n");
