<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/questionnaire_schema.php';

function cpg_questionnaire_schema_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$streams = cpg_questionnaire_streams();
cpg_questionnaire_schema_test_assert(array_keys($streams) === ['S', 'E', 'V', 'R'], 'streams should be S/E/V/R in canonical order');

$fields = cpg_questionnaire_mandatory_fields();
cpg_questionnaire_schema_test_assert(count($fields) >= 50, 'mandatory schema should cover current and target questionnaire fields');
cpg_questionnaire_schema_test_assert(cpg_questionnaire_schema_validation_errors() === [], 'schema validation should pass');

$byCode = cpg_questionnaire_fields_by_code();
foreach ([
    'S-1.4',
    'S-1.11',
    'S-12.D2',
    'E-2.1',
    'E-4.D1',
    'V-2.1',
    'R-1.1',
    'R-4.4',
] as $fieldCode) {
    cpg_questionnaire_schema_test_assert(isset($byCode[$fieldCode]), "missing canonical field {$fieldCode}");
}

cpg_questionnaire_schema_test_assert(
    ($byCode['S-1.4']['canonical_key'] ?? null) === 'rank' && ($byCode['R-1.1']['canonical_key'] ?? null) === 'rank',
    'rank should be synchronized between seafarer and crew request'
);
cpg_questionnaire_schema_test_assert(
    ($byCode['S-1.11']['canonical_key'] ?? null) === 'vessel_type'
        && ($byCode['V-2.1']['canonical_key'] ?? null) === 'vessel_type'
        && ($byCode['R-2.1']['canonical_key'] ?? null) === 'vessel_type',
    'vessel type should be synchronized between supply, vessel and request'
);
cpg_questionnaire_schema_test_assert(
    ($byCode['S-10.1']['canonical_key'] ?? null) === 'medical_certificate'
        && ($byCode['S-12.D2']['document_type'] ?? null) === 'medical_certificate',
    'medical certificate expiry and document should share canonical meaning'
);

$coverage = cpg_questionnaire_matching_key_coverage();
foreach (['rank', 'department', 'availability_or_joining_date', 'vessel_type', 'salary', 'coc', 'education', 'training_stcw', 'sea_service'] as $canonicalKey) {
    cpg_questionnaire_schema_test_assert(isset($coverage[$canonicalKey]['S']), "{$canonicalKey} should have seafarer-side matching coverage");
    cpg_questionnaire_schema_test_assert(
        isset($coverage[$canonicalKey]['R']) || isset($coverage[$canonicalKey]['V']),
        "{$canonicalKey} should have demand-side matching coverage"
    );
}

$byStream = cpg_questionnaire_fields_by_stream();
foreach (['S', 'E', 'V', 'R'] as $stream) {
    cpg_questionnaire_schema_test_assert(count($byStream[$stream] ?? []) > 0, "{$stream} stream should have fields");
}

$targetGaps = array_values(array_filter(
    $fields,
    static fn (array $field): bool => ($field['implementation_status'] ?? null) === 'target_gap'
));
cpg_questionnaire_schema_test_assert(count($targetGaps) >= 5, 'schema should explicitly mark target gaps before hard matching uses them');

fwrite(STDOUT, "Questionnaire schema tests passed\n");

