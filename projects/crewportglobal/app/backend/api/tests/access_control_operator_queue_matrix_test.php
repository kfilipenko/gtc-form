<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/access_control.php';

function cpg_matrix_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function cpg_matrix_seed_permissions(): array {
    $migrationPath = __DIR__ . '/../../db/migrations/006_access_control_foundation_draft.sql';
    $sql = file_get_contents($migrationPath);
    cpg_matrix_test_assert(is_string($sql), 'access-control migration draft should be readable');

    preg_match_all("/\\('([a-z0-9_]+)',\\s*'[^']+',\\s*'[^']+',\\s*'[^']+'\\)/", $sql, $matches);
    $permissions = array_fill_keys($matches[1] ?? [], true);

    return $permissions;
}

$matrix = cpg_access_operator_queue_permission_matrix();
$seedPermissions = cpg_matrix_seed_permissions();
$expectedQueueTypes = [
    'seafarer_profile',
    'company_verification',
    'vacancy_request',
    'vacancy_application',
];
$expectedDecisions = [
    'start_review',
    'needs_correction',
    'reviewed',
];

foreach ($expectedQueueTypes as $queueType) {
    cpg_matrix_test_assert(isset($matrix[$queueType]), "missing matrix entry for {$queueType}");

    $view = $matrix[$queueType]['view'] ?? null;
    cpg_matrix_test_assert(is_array($view), "missing view requirement for {$queueType}");
    cpg_matrix_test_assert(($view['scope'] ?? null) === 'queue', "view requirement for {$queueType} should use queue scope");
    cpg_matrix_test_assert(isset($seedPermissions[$view['permission_code'] ?? '']), "view permission for {$queueType} should exist in seed permissions");

    foreach ($expectedDecisions as $decision) {
        $requirement = $matrix[$queueType]['actions'][$decision] ?? null;
        cpg_matrix_test_assert(is_array($requirement), "missing {$decision} requirement for {$queueType}");
        cpg_matrix_test_assert(($requirement['scope'] ?? null) === 'queue', "{$queueType}/{$decision} should use queue scope");
        cpg_matrix_test_assert(
            isset($seedPermissions[$requirement['permission_code'] ?? '']),
            "{$queueType}/{$decision} permission should exist in seed permissions"
        );
    }
}

cpg_matrix_test_assert(
    cpg_access_operator_queue_view_requirement('unknown_queue') === null,
    'unknown queue view requirement should be null'
);
cpg_matrix_test_assert(
    cpg_access_operator_queue_action_requirement('vacancy_request', 'unknown_decision') === null,
    'unknown decision requirement should be null'
);

fwrite(STDOUT, "Operator queue permission matrix tests passed\n");
