<?php

declare(strict_types=1);

require_once __DIR__ . '/questionnaire_schema.php';

function cpg_questionnaire_streams_for_role(string $role): array {
    return $role === 'seafarer' ? ['S'] : ['E', 'V', 'R'];
}

function cpg_questionnaire_value_present(mixed $value): bool {
    if (is_array($value)) {
        foreach ($value as $item) {
            if (cpg_questionnaire_value_present($item)) {
                return true;
            }
        }
        return false;
    }

    if (is_bool($value)) {
        return true;
    }

    if (is_int($value) || is_float($value)) {
        return true;
    }

    if ($value === null) {
        return false;
    }

    return trim((string) $value) !== '';
}

function cpg_questionnaire_condition_active(?string $condition, array $conditions): bool {
    if ($condition === null || trim($condition) === '') {
        return true;
    }

    return ($conditions[$condition] ?? false) === true;
}

function cpg_questionnaire_field_required_for_submit(array $field, array $conditions): bool {
    if (($field['implementation_status'] ?? 'current') === 'target_gap') {
        return false;
    }

    if (($field['required_for_submit'] ?? false) !== true) {
        return false;
    }

    $condition = is_string($field['conditional_required'] ?? null) ? $field['conditional_required'] : null;
    return cpg_questionnaire_condition_active($condition, $conditions);
}

function cpg_questionnaire_safe_document_row(array $document): array {
    return [
        'document_id' => $document['document_id'] ?? null,
        'document_type' => $document['document_type'] ?? null,
        'upload_state' => $document['upload_state'] ?? null,
        'review_status' => $document['review_status'] ?? null,
        'scan_status' => $document['scan_status'] ?? null,
        'mime_type' => $document['mime_type'] ?? null,
        'uploaded_at' => $document['uploaded_at'] ?? null,
        'valid_until' => $document['valid_until'] ?? null,
    ];
}

function cpg_questionnaire_document_check(array $field, array $documents): array {
    $documentType = is_string($field['document_type'] ?? null) ? $field['document_type'] : '';
    $matchingDocuments = [];
    foreach ($documents as $document) {
        if (!is_array($document) || ($document['document_type'] ?? null) !== $documentType) {
            continue;
        }
        $matchingDocuments[] = $document;
    }

    foreach ($matchingDocuments as $document) {
        $scanStatus = (string) ($document['scan_status'] ?? '');
        $uploadState = (string) ($document['upload_state'] ?? '');
        $reviewStatus = (string) ($document['review_status'] ?? '');
        if ($scanStatus === 'clean'
            && $uploadState === 'stored_protected'
            && !in_array($reviewStatus, ['correction_requested', 'rejected', 'superseded'], true)
        ) {
            return [
                'field_code' => $field['field_code'],
                'canonical_key' => $field['canonical_key'],
                'stream' => $field['stream'],
                'label' => $field['label'],
                'document_type' => $documentType,
                'status' => 'complete',
                'ok' => true,
                'document' => cpg_questionnaire_safe_document_row($document),
                'target_url' => $field['target_url'],
            ];
        }
    }

    $status = 'missing';
    if ($matchingDocuments !== []) {
        $latest = $matchingDocuments[0];
        if (($latest['scan_status'] ?? null) !== 'clean') {
            $status = 'document_scan_not_clean';
        } elseif (($latest['upload_state'] ?? null) !== 'stored_protected') {
            $status = 'document_not_stored';
        } elseif (in_array((string) ($latest['review_status'] ?? ''), ['correction_requested', 'rejected', 'superseded'], true)) {
            $status = 'document_review_blocked';
        }
    }

    return [
        'field_code' => $field['field_code'],
        'canonical_key' => $field['canonical_key'],
        'stream' => $field['stream'],
        'label' => $field['label'],
        'document_type' => $documentType,
        'status' => $status,
        'ok' => false,
        'document' => isset($matchingDocuments[0]) ? cpg_questionnaire_safe_document_row($matchingDocuments[0]) : null,
        'target_url' => $field['target_url'],
    ];
}

function cpg_questionnaire_missing_item(array $field, string $blockerCode): array {
    return [
        'field_code' => $field['field_code'],
        'canonical_key' => $field['canonical_key'],
        'stream' => $field['stream'],
        'label' => $field['label'],
        'blocker_code' => $blockerCode,
        'target_url' => $field['target_url'],
    ];
}

function cpg_questionnaire_completeness_result(array $options): array {
    $role = is_string($options['role'] ?? null) ? (string) $options['role'] : 'unknown';
    $streams = isset($options['streams']) && is_array($options['streams'])
        ? array_values(array_filter($options['streams'], 'is_string'))
        : cpg_questionnaire_streams_for_role($role);
    $fieldValues = isset($options['field_values']) && is_array($options['field_values'])
        ? $options['field_values']
        : [];
    $documents = isset($options['documents']) && is_array($options['documents'])
        ? $options['documents']
        : [];
    $conditions = isset($options['conditions']) && is_array($options['conditions'])
        ? $options['conditions']
        : [];
    $unresolvedCorrections = isset($options['unresolved_corrections']) && is_array($options['unresolved_corrections'])
        ? array_values($options['unresolved_corrections'])
        : [];

    $missingItems = [];
    $requiredDocuments = [];
    $documentChecks = [];
    $requiredFields = [];
    $targetGaps = [];
    $targetUrls = [];

    foreach (cpg_questionnaire_mandatory_fields() as $field) {
        if (!in_array((string) $field['stream'], $streams, true)) {
            continue;
        }

        if (($field['implementation_status'] ?? 'current') === 'target_gap') {
            $targetGaps[] = [
                'field_code' => $field['field_code'],
                'canonical_key' => $field['canonical_key'],
                'stream' => $field['stream'],
                'label' => $field['label'],
                'target_url' => $field['target_url'],
            ];
            continue;
        }

        if (!cpg_questionnaire_field_required_for_submit($field, $conditions)) {
            continue;
        }

        $requiredFields[] = [
            'field_code' => $field['field_code'],
            'canonical_key' => $field['canonical_key'],
            'stream' => $field['stream'],
            'label' => $field['label'],
            'field_type' => $field['field_type'] ?? 'field',
            'target_url' => $field['target_url'],
        ];

        if (($field['field_type'] ?? 'field') === 'document') {
            $check = cpg_questionnaire_document_check($field, $documents);
            $documentChecks[] = $check;
            $requiredDocuments[] = [
                'field_code' => $field['field_code'],
                'document_type' => $field['document_type'] ?? null,
                'label' => $field['label'],
                'status' => $check['status'],
                'target_url' => $field['target_url'],
            ];
            if (($check['ok'] ?? false) !== true) {
                $missingItems[] = cpg_questionnaire_missing_item($field, 'required_document_missing');
                $targetUrls[(string) $field['target_url']] = true;
            }
            continue;
        }

        $fieldCode = (string) $field['field_code'];
        if (!cpg_questionnaire_value_present($fieldValues[$fieldCode] ?? null)) {
            $missingItems[] = cpg_questionnaire_missing_item($field, 'required_field_missing');
            $targetUrls[(string) $field['target_url']] = true;
        }
    }

    foreach ($unresolvedCorrections as $correction) {
        if (is_array($correction) && is_string($correction['target_url'] ?? null)) {
            $targetUrls[(string) $correction['target_url']] = true;
        }
    }

    $canSubmit = $missingItems === [] && $unresolvedCorrections === [];

    return [
        'schema_version' => 'cpg-questionnaire-mandatory-fields-2026-05-28',
        'object_type' => $options['object_type'] ?? null,
        'object_id' => $options['object_id'] ?? null,
        'role' => $role,
        'streams' => $streams,
        'overall_status' => $canSubmit ? 'complete' : 'incomplete',
        'can_save' => true,
        'can_submit_to_operator' => $canSubmit,
        'missing_items' => $missingItems,
        'required_fields' => $requiredFields,
        'required_documents' => $requiredDocuments,
        'document_checks' => $documentChecks,
        'unresolved_corrections' => $unresolvedCorrections,
        'target_urls' => array_keys($targetUrls),
        'target_gaps' => $targetGaps,
        'counts' => [
            'required_fields' => count($requiredFields),
            'missing_items' => count($missingItems),
            'required_documents' => count($requiredDocuments),
            'document_checks' => count($documentChecks),
            'unresolved_corrections' => count($unresolvedCorrections),
            'target_gaps' => count($targetGaps),
        ],
    ];
}
