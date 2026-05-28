<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/questionnaire_completeness.php';

function cpg_questionnaire_completeness_test_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$incomplete = cpg_questionnaire_completeness_result([
    'object_type' => 'seafarer_profile',
    'object_id' => 'test-seafarer',
    'role' => 'seafarer',
    'streams' => ['S'],
    'field_values' => [
        'S-1.2' => 'synthetic@example.com',
        'S-1.4' => 'Able Seaman',
    ],
    'documents' => [],
    'conditions' => [
        'availability_status_is_available_later' => false,
        'rank_or_request_requires_coc' => false,
    ],
]);

cpg_questionnaire_completeness_test_assert($incomplete['overall_status'] === 'incomplete', 'incomplete seafarer result should be incomplete');
cpg_questionnaire_completeness_test_assert($incomplete['can_save'] === true, 'incomplete seafarer can still save');
cpg_questionnaire_completeness_test_assert($incomplete['can_submit_to_operator'] === false, 'incomplete seafarer cannot submit');

$missingCodes = array_column($incomplete['missing_items'], 'field_code');
cpg_questionnaire_completeness_test_assert(in_array('S-1.1', $missingCodes, true), 'missing full name should be reported');
cpg_questionnaire_completeness_test_assert(in_array('S-12.D1', $missingCodes, true), 'missing identity document should be reported');
cpg_questionnaire_completeness_test_assert(in_array('S-12.D2', $missingCodes, true), 'missing medical document should be reported');
cpg_questionnaire_completeness_test_assert(in_array('S-12.D5', $missingCodes, true), 'missing maritime CV should be reported');

$completeValues = [
    'S-1.1' => 'Synthetic Seafarer',
    'S-1.2' => 'synthetic@example.com',
    'S-1.3' => '+971500000000',
    'S-1.4' => 'Able Seaman',
    'S-1.5' => 'deck',
    'S-1.6' => 'available_now',
    'S-1.8' => 'PH',
    'S-1.9' => 'AE',
    'S-1.10' => 3200,
    'S-1.11' => ['Bulk Carrier'],
    'S-6.1' => '2030-01-01',
    'S-10.1' => '2028-01-01',
    'S-11.1' => 'i_confirm',
];

$complete = cpg_questionnaire_completeness_result([
    'object_type' => 'seafarer_profile',
    'object_id' => 'test-seafarer',
    'role' => 'seafarer',
    'streams' => ['S'],
    'field_values' => $completeValues,
    'documents' => [
        [
            'document_id' => '11111111-1111-4111-8111-111111111111',
            'document_type' => 'passport_or_id',
            'upload_state' => 'stored_protected',
            'review_status' => 'pending_human_review',
            'scan_status' => 'clean',
            'mime_type' => 'application/pdf',
        ],
        [
            'document_id' => '22222222-2222-4222-8222-222222222222',
            'document_type' => 'medical_certificate',
            'upload_state' => 'stored_protected',
            'review_status' => 'pending_human_review',
            'scan_status' => 'clean',
            'mime_type' => 'application/pdf',
        ],
        [
            'document_id' => '33333333-3333-4333-8333-333333333333',
            'document_type' => 'maritime_cv',
            'upload_state' => 'stored_protected',
            'review_status' => 'pending_human_review',
            'scan_status' => 'clean',
            'mime_type' => 'application/pdf',
        ],
    ],
    'conditions' => [
        'availability_status_is_available_later' => false,
        'rank_or_request_requires_coc' => false,
    ],
]);

cpg_questionnaire_completeness_test_assert($complete['overall_status'] === 'complete', 'complete seafarer result should be complete');
cpg_questionnaire_completeness_test_assert($complete['can_submit_to_operator'] === true, 'complete seafarer can submit');
cpg_questionnaire_completeness_test_assert($complete['counts']['missing_items'] === 0, 'complete result should have no missing items');
cpg_questionnaire_completeness_test_assert($complete['counts']['target_gaps'] > 0, 'target gaps should remain visible but non-blocking');

$blockedDocument = cpg_questionnaire_completeness_result([
    'object_type' => 'seafarer_profile',
    'object_id' => 'test-seafarer',
    'role' => 'seafarer',
    'streams' => ['S'],
    'field_values' => $completeValues,
    'documents' => [
        [
            'document_id' => '44444444-4444-4444-8444-444444444444',
            'document_type' => 'passport_or_id',
            'upload_state' => 'stored_protected',
            'review_status' => 'correction_requested',
            'scan_status' => 'clean',
            'mime_type' => 'application/pdf',
        ],
    ],
    'conditions' => [
        'availability_status_is_available_later' => false,
        'rank_or_request_requires_coc' => false,
    ],
]);

$blockedChecks = array_values(array_filter(
    $blockedDocument['document_checks'],
    static fn (array $check): bool => ($check['document_type'] ?? null) === 'passport_or_id'
));
cpg_questionnaire_completeness_test_assert(($blockedChecks[0]['status'] ?? null) === 'document_review_blocked', 'correction-requested document should block submit');

fwrite(STDOUT, "Questionnaire completeness tests passed\n");
