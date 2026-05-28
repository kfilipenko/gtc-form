<?php

declare(strict_types=1);

function cpg_questionnaire_streams(): array {
    return [
        'S' => [
            'stream' => 'S',
            'object_type' => 'seafarer_profile',
            'label' => 'Seafarer supply',
        ],
        'E' => [
            'stream' => 'E',
            'object_type' => 'employer_account',
            'label' => 'Employer / shipowner demand account',
        ],
        'V' => [
            'stream' => 'V',
            'object_type' => 'vessel_context',
            'label' => 'Vessel context',
        ],
        'R' => [
            'stream' => 'R',
            'object_type' => 'crew_request',
            'label' => 'Crew request / vacancy requirement',
        ],
    ];
}

function cpg_questionnaire_field(
    string $fieldCode,
    string $canonicalKey,
    string $stream,
    string $label,
    bool $requiredForSubmit,
    bool $requiredForMatching,
    string $targetUrl,
    array $extra = []
): array {
    return array_merge([
        'field_code' => $fieldCode,
        'canonical_key' => $canonicalKey,
        'stream' => $stream,
        'label' => $label,
        'required_for_save' => false,
        'required_for_submit' => $requiredForSubmit,
        'required_for_matching' => $requiredForMatching,
        'conditional_required' => null,
        'mirrored_required_key' => $requiredForMatching ? $canonicalKey : null,
        'visibility_class' => 'operator_review',
        'target_url' => $targetUrl,
        'field_type' => 'field',
        'implementation_status' => 'current',
    ], $extra);
}

function cpg_questionnaire_mandatory_fields(): array {
    return [
        cpg_questionnaire_field('S-1.1', 'person_or_contact_name', 'S', 'Full name', true, false, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.2', 'account_contact_email', 'S', 'Email', true, false, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.3', 'contact_phone', 'S', 'Contact phone', true, false, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.4', 'rank', 'S', 'Primary rank', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'public_candidate_summary',
        ]),
        cpg_questionnaire_field('S-1.5', 'department', 'S', 'Department', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'public_candidate_summary',
        ]),
        cpg_questionnaire_field('S-1.6', 'availability_or_joining_date', 'S', 'Availability status', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'public_candidate_summary',
        ]),
        cpg_questionnaire_field('S-1.7', 'availability_or_joining_date', 'S', 'Availability date when not available now', true, true, '/create-profile/#profile-section-cv', [
            'conditional_required' => 'availability_status_is_available_later',
            'visibility_class' => 'public_candidate_summary',
        ]),
        cpg_questionnaire_field('S-1.8', 'nationality_residence', 'S', 'Nationality / citizenship', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.9', 'nationality_residence', 'S', 'Residence or current country', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.10', 'salary', 'S', 'Salary expectation', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-1.11', 'vessel_type', 'S', 'Preferred vessel types', true, true, '/create-profile/#profile-section-cv', [
            'visibility_class' => 'public_candidate_summary',
        ]),
        cpg_questionnaire_field('S-6.1', 'identity_document', 'S', 'Passport or identity expiry metadata', true, false, '/create-profile/#profile-section-identity-documents', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.1', 'coc', 'S', 'COC type', true, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'rank_or_request_requires_coc',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.2', 'coc', 'S', 'COC issuing country', true, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'rank_or_request_requires_coc',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.3', 'coc', 'S', 'COC expiry', true, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'rank_or_request_requires_coc',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.4', 'education', 'S', 'Education grade', false, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'request_requires_education',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.5', 'education', 'S', 'Education specialisation', false, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'request_requires_education',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.6', 'training_stcw', 'S', 'Training courses / STCW', false, true, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'rank_vessel_or_request_requires_training',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-7.7', 'language', 'S', 'Language and level', false, false, '/create-profile/#profile-section-qualifications', [
            'conditional_required' => 'request_requires_language_after_field_is_implemented',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-8.1', 'sea_service', 'S', 'Last vessel type', false, true, '/create-profile/#profile-section-sea-service', [
            'conditional_required' => 'rank_or_request_requires_sea_service',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-8.2', 'sea_service', 'S', 'Sea service period', false, true, '/create-profile/#profile-section-sea-service', [
            'conditional_required' => 'rank_or_request_requires_sea_service',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-10.1', 'medical_certificate', 'S', 'Medical certificate expiry', true, true, '/create-profile/#profile-section-documents', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-11.1', 'data_processing_confirmation', 'S', 'Data-processing confirmation', true, false, '/create-profile/#profile-section-publication', [
            'visibility_class' => 'internal_compliance',
        ]),
        cpg_questionnaire_field('S-12.D1', 'identity_document', 'S', 'Passport / ID document upload', true, false, '/create-profile/#profile-section-documents', [
            'field_type' => 'document',
            'document_type' => 'passport_or_id',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-12.D2', 'medical_certificate', 'S', 'Medical certificate upload', true, true, '/create-profile/#profile-section-documents', [
            'field_type' => 'document',
            'document_type' => 'medical_certificate',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-12.D3', 'coc', 'S', 'COC document upload', true, true, '/create-profile/#profile-section-documents', [
            'field_type' => 'document',
            'document_type' => 'certificate_of_competency',
            'conditional_required' => 'rank_or_request_requires_coc',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-12.D4', 'training_stcw', 'S', 'Training / STCW certificate upload', false, true, '/create-profile/#profile-section-documents', [
            'field_type' => 'document',
            'document_type' => 'training_certificate',
            'conditional_required' => 'rank_vessel_or_request_requires_training',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('S-12.D5', 'maritime_cv', 'S', 'Maritime CV upload', true, false, '/create-profile/#profile-section-documents', [
            'field_type' => 'document',
            'document_type' => 'maritime_cv',
            'visibility_class' => 'operator_review',
        ]),

        cpg_questionnaire_field('E-1.1', 'account_contact_email', 'E', 'Work email', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-1.2', 'person_or_contact_name', 'E', 'Primary contact name', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-1.3', 'employer_role', 'E', 'Employer role', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-2.1', 'company_identity', 'E', 'Company name', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-2.2', 'company_identity', 'E', 'Company country', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-2.3', 'company_identity', 'E', 'Company registration number', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-3.1', 'representative_authority', 'E', 'Role in company', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-4.D1', 'representative_authority', 'E', 'Company registration document', true, false, '/post-vacancy/#post-document-upload-title', [
            'field_type' => 'document',
            'document_type' => 'company_registration',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-4.D2', 'representative_authority', 'E', 'Representative ID document', true, false, '/post-vacancy/#post-document-upload-title', [
            'field_type' => 'document',
            'document_type' => 'representative_id',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('E-4.D3', 'representative_authority', 'E', 'Authorization evidence', true, false, '/post-vacancy/#post-document-upload-title', [
            'field_type' => 'document',
            'document_type' => 'authorization_letter',
            'conditional_required' => 'representative_is_not_recorded_owner',
            'visibility_class' => 'operator_review',
        ]),

        cpg_questionnaire_field('V-1.1', 'vessel_identity', 'V', 'Vessel name', false, false, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'exact_vessel_is_known',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('V-1.2', 'vessel_identity', 'V', 'IMO number', false, false, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'exact_vessel_is_known',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('V-2.1', 'vessel_type', 'V', 'Vessel type', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('V-2.2', 'flag_country', 'V', 'Flag country', false, true, '/post-vacancy/#post-vacancy-form', [
            'implementation_status' => 'target_gap',
            'conditional_required' => 'exact_vessel_is_known_or_flag_constraint_is_used',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('V-4.D1', 'vessel_identity', 'V', 'Vessel particulars document', false, false, '/post-vacancy/#post-document-upload-title', [
            'field_type' => 'document',
            'document_type' => 'vessel_particulars',
            'conditional_required' => 'exact_vessel_is_known',
            'visibility_class' => 'operator_review',
        ]),

        cpg_questionnaire_field('R-1.1', 'rank', 'R', 'Requested rank', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-1.2', 'department', 'R', 'Requested department', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-2.1', 'vessel_type', 'R', 'Request vessel type', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-3.1', 'availability_or_joining_date', 'R', 'Joining date', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-4.1', 'crew_request_terms', 'R', 'Contract duration', true, false, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-4.2', 'salary', 'R', 'Salary minimum', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-4.3', 'salary', 'R', 'Salary maximum', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-4.4', 'salary', 'R', 'Currency', true, true, '/post-vacancy/#post-vacancy-form', [
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-5.1', 'coc', 'R', 'COC requirement', false, true, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'rank_or_request_requires_coc',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-5.2', 'education', 'R', 'Education requirement', false, true, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'request_requires_education',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-5.3', 'training_stcw', 'R', 'Training / STCW requirement', false, true, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'rank_vessel_or_request_requires_training',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-5.4', 'sea_service', 'R', 'Sea-service requirement', false, true, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'request_requires_sea_service',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-6.1', 'visa_readiness', 'R', 'Visa requirement', false, false, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'request_requires_visa_after_field_is_implemented',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-6.2', 'language', 'R', 'Language requirement', false, false, '/post-vacancy/#post-vacancy-form', [
            'conditional_required' => 'request_requires_language_after_field_is_implemented',
            'implementation_status' => 'target_gap',
            'visibility_class' => 'operator_review',
        ]),
        cpg_questionnaire_field('R-7.D1', 'crew_request_terms', 'R', 'Crew request brief document', false, false, '/post-vacancy/#post-document-upload-title', [
            'field_type' => 'document',
            'document_type' => 'crew_request_brief',
            'conditional_required' => 'authority_or_commercial_policy_requires_request_brief',
            'visibility_class' => 'operator_review',
        ]),
    ];
}

function cpg_questionnaire_fields_by_code(): array {
    $indexed = [];
    foreach (cpg_questionnaire_mandatory_fields() as $field) {
        $indexed[(string) $field['field_code']] = $field;
    }

    return $indexed;
}

function cpg_questionnaire_fields_by_stream(?string $stream = null): array {
    $streams = cpg_questionnaire_streams();
    $grouped = array_fill_keys(array_keys($streams), []);
    foreach (cpg_questionnaire_mandatory_fields() as $field) {
        $grouped[(string) $field['stream']][] = $field;
    }

    if ($stream === null) {
        return $grouped;
    }

    return $grouped[$stream] ?? [];
}

function cpg_questionnaire_matching_key_coverage(): array {
    $coverage = [];
    foreach (cpg_questionnaire_mandatory_fields() as $field) {
        if (($field['required_for_matching'] ?? false) !== true) {
            continue;
        }
        $key = (string) $field['canonical_key'];
        $stream = (string) $field['stream'];
        $coverage[$key][$stream][] = (string) $field['field_code'];
    }

    ksort($coverage);
    foreach ($coverage as $key => $streams) {
        ksort($streams);
        $coverage[$key] = $streams;
    }

    return $coverage;
}

function cpg_questionnaire_schema_validation_errors(): array {
    $errors = [];
    $streams = cpg_questionnaire_streams();
    $fieldCodes = [];
    $targetUrls = [];

    foreach (cpg_questionnaire_mandatory_fields() as $index => $field) {
        $prefix = "field {$index}";
        $fieldCode = $field['field_code'] ?? null;
        $stream = $field['stream'] ?? null;
        $canonicalKey = $field['canonical_key'] ?? null;
        $targetUrl = $field['target_url'] ?? null;

        if (!is_string($fieldCode) || preg_match('/^[SERV]-[0-9]+\\.(?:[0-9]+|D[0-9]+)$/', $fieldCode) !== 1) {
            $errors[] = "{$prefix}: invalid field_code";
            continue;
        }
        if (isset($fieldCodes[$fieldCode])) {
            $errors[] = "{$fieldCode}: duplicate field_code";
        }
        $fieldCodes[$fieldCode] = true;

        $expectedStream = substr($fieldCode, 0, 1);
        if (!is_string($stream) || $stream !== $expectedStream || !isset($streams[$stream])) {
            $errors[] = "{$fieldCode}: stream must match field code prefix";
        }
        if (!is_string($canonicalKey) || !preg_match('/^[a-z0-9_]+$/', $canonicalKey)) {
            $errors[] = "{$fieldCode}: canonical_key is invalid";
        }
        if (!is_string($targetUrl) || $targetUrl === '' || $targetUrl[0] !== '/') {
            $errors[] = "{$fieldCode}: target_url must be an internal path";
        } else {
            $targetUrls[$targetUrl] = true;
        }
        foreach (['required_for_save', 'required_for_submit', 'required_for_matching'] as $flag) {
            if (!is_bool($field[$flag] ?? null)) {
                $errors[] = "{$fieldCode}: {$flag} must be boolean";
            }
        }
        if (($field['field_type'] ?? 'field') === 'document' && !is_string($field['document_type'] ?? null)) {
            $errors[] = "{$fieldCode}: document field must define document_type";
        }
    }

    foreach (['/create-profile/#profile-section-cv', '/post-vacancy/#post-vacancy-form'] as $requiredUrl) {
        if (!isset($targetUrls[$requiredUrl])) {
            $errors[] = "schema: missing target_url {$requiredUrl}";
        }
    }

    return $errors;
}

