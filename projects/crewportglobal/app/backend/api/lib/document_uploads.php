<?php

declare(strict_types=1);

const CPG_DOCUMENT_STORAGE_ROOT_DEFAULT = '/srv/crewportglobal/storage/documents';
const CPG_DOCUMENT_MAX_FILE_SIZE_BYTES = 10485760;
const CPG_DOCUMENT_MAX_DRAFT_SIZE_BYTES = 104857600;
const CPG_DOCUMENT_MAX_FILES_PER_DRAFT = 20;

function cpg_document_storage_root(): string {
    foreach (['CREWPORTGLOBAL_DOCUMENT_STORAGE_ROOT', 'CPG_DOCUMENT_STORAGE_ROOT'] as $envName) {
        $value = getenv($envName);
        if (is_string($value) && trim($value) !== '') {
            return rtrim(trim($value), '/');
        }
    }

    return CPG_DOCUMENT_STORAGE_ROOT_DEFAULT;
}

function cpg_document_form_types(): array {
    return ['seafarer', 'employer', 'vessel'];
}

function cpg_document_type_catalog(): array {
    return [
        'seafarer' => [
            'passport_or_id',
            'seamans_book',
            'certificate_of_competency',
            'stcw_certificate',
            'medical_certificate',
            'maritime_cv',
            'experience_record',
            'training_certificate',
            'language_certificate',
            'other_professional_evidence',
        ],
        'employer' => [
            'company_registration',
            'company_license',
            'representative_id',
            'authorization_letter',
            'power_of_attorney',
            'employment_or_management_proof',
            'crew_request_brief',
            'service_request_document',
            'billing_or_commercial_evidence',
            'other_authority_evidence',
        ],
        'vessel' => [
            'vessel_registration',
            'vessel_particulars',
            'classification_certificate',
            'insurance_certificate',
            'safety_management_certificate',
            'crew_request_support',
            'other_vessel_evidence',
        ],
    ];
}

function cpg_document_allowed_mime_map(): array {
    return [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
}

function cpg_document_public_metadata(array $row): array {
    return [
        'document_id' => $row['document_id'],
        'document_type' => $row['document_type'],
        'original_filename' => $row['original_filename'],
        'mime_type' => $row['mime_type'],
        'file_size_bytes' => isset($row['file_size_bytes']) ? (int) $row['file_size_bytes'] : null,
        'sha256_hash' => $row['sha256_hash'],
        'upload_state' => $row['upload_state'],
        'review_status' => $row['review_status'],
        'scan_status' => $row['scan_status'],
        'uploaded_at' => $row['uploaded_at'],
        'valid_from' => $row['valid_from'] ?? null,
        'valid_until' => $row['valid_until'] ?? null,
        'review_note' => $row['review_note'] ?? null,
    ];
}

function cpg_document_uuid_v4(): string {
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
        substr($hex, 20)
    );
}

function cpg_document_clean_original_filename(string $name): string {
    $basename = basename(str_replace('\\', '/', $name));
    $basename = trim($basename);
    if ($basename === '') {
        return 'uploaded-document';
    }

    if (mb_strlen($basename) > 240) {
        $basename = mb_substr($basename, 0, 240);
    }

    return $basename;
}

function cpg_document_normalize_date(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $value = trim($value);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1 ? $value : null;
}

function cpg_document_ensure_dir(string $path): void {
    if (is_dir($path)) {
        return;
    }

    if (!mkdir($path, 0770, true) && !is_dir($path)) {
        api_error(500, 'document_storage_unavailable', 'Protected document storage is unavailable');
    }
}

function cpg_document_detect_mime(string $path): ?string {
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mime = finfo_file($finfo, $path);
            finfo_close($finfo);
            if (is_string($mime) && $mime !== '') {
                return $mime;
            }
        }
    }

    if (function_exists('mime_content_type')) {
        $mime = mime_content_type($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return null;
}

function cpg_document_scan_with_command(string $command, string $path): array {
    $binary = trim(strtok($command, ' ') ?: $command);
    if ($binary === '' || !is_executable($binary)) {
        $resolved = trim((string) shell_exec('command -v ' . escapeshellarg($binary) . ' 2>/dev/null'));
        if ($resolved === '') {
            return ['status' => 'scan_error', 'exit_code' => 127];
        }
    }

    $output = [];
    $exitCode = 2;
    exec($command . ' ' . escapeshellarg($path) . ' 2>&1', $output, $exitCode);

    if ($exitCode === 0) {
        return ['status' => 'clean', 'exit_code' => $exitCode];
    }
    if ($exitCode === 1) {
        return ['status' => 'infected', 'exit_code' => $exitCode];
    }

    return ['status' => 'scan_error', 'exit_code' => $exitCode];
}

function cpg_document_scan_file(string $path): array {
    $preferred = getenv('CREWPORTGLOBAL_DOCUMENT_SCANNER');
    if (is_string($preferred) && trim($preferred) !== '') {
        return cpg_document_scan_with_command(trim($preferred), $path);
    }

    $clamdscan = trim((string) shell_exec('command -v clamdscan 2>/dev/null'));
    if ($clamdscan !== '') {
        $result = cpg_document_scan_with_command($clamdscan . ' --no-summary --fdpass', $path);
        if ($result['status'] !== 'scan_error') {
            return $result;
        }
    }

    $clamscan = trim((string) shell_exec('command -v clamscan 2>/dev/null'));
    if ($clamscan !== '') {
        return cpg_document_scan_with_command($clamscan . ' --no-summary', $path);
    }

    return ['status' => 'scan_error', 'exit_code' => 127];
}

function cpg_document_read_draft_context(string $draftId, string $formType): array {
    $result = api_query(
        'SELECT u.user_id, ur.role
         FROM crewportglobal.users u
         JOIN crewportglobal.user_roles ur ON ur.user_id = u.user_id
         WHERE u.user_id = $1
         ORDER BY ur.created_at ASC
         LIMIT 1',
        [$draftId]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    $role = (string) $row['role'];
    if ($formType === 'seafarer' && $role !== 'seafarer') {
        api_error(400, 'form_type_does_not_match_draft', 'form_type does not match the registration draft role');
    }

    $employerRoles = ['employer', 'shipowner', 'crewing_manager'];
    if (($formType === 'employer' || $formType === 'vessel') && !in_array($role, $employerRoles, true)) {
        api_error(400, 'form_type_does_not_match_draft', 'form_type does not match the registration draft role');
    }

    $cardId = null;
    if ($formType === 'seafarer') {
        $cardResult = api_query(
            'SELECT seafarer_profile_id FROM crewportglobal.seafarer_profiles WHERE user_id = $1 LIMIT 1',
            [$draftId]
        );
        $cardRow = pg_fetch_assoc($cardResult);
        $cardId = is_array($cardRow) ? (string) $cardRow['seafarer_profile_id'] : null;
    } else {
        $cardResult = api_query(
            'SELECT ec.company_id
             FROM crewportglobal.company_users cu
             JOIN crewportglobal.employer_companies ec ON ec.company_id = cu.company_id
             WHERE cu.user_id = $1
             ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
             LIMIT 1',
            [$draftId]
        );
        $cardRow = pg_fetch_assoc($cardResult);
        $cardId = is_array($cardRow) ? (string) $cardRow['company_id'] : null;
    }

    return [
        'person_id' => $draftId,
        'user_id' => $draftId,
        'role' => $role,
        'card_id' => $cardId,
    ];
}

function cpg_document_existing_usage(string $draftId): array {
    $result = api_query(
        "SELECT COUNT(*) AS file_count,
                COALESCE(SUM(file_size_bytes), 0) AS total_bytes
         FROM crewportglobal.uploaded_documents
         WHERE draft_id = $1
           AND upload_state NOT IN ('upload_rejected', 'replaced_hidden', 'deleted_with_card_or_account')",
        [$draftId]
    );
    $row = pg_fetch_assoc($result);

    return [
        'file_count' => is_array($row) ? (int) $row['file_count'] : 0,
        'total_bytes' => is_array($row) ? (int) $row['total_bytes'] : 0,
    ];
}

function cpg_document_previous_visible_id(string $draftId, string $formType, string $documentType): ?string {
    $result = api_query(
        "SELECT document_id
         FROM crewportglobal.uploaded_documents
         WHERE draft_id = $1
           AND form_type = $2
           AND document_type = $3
           AND hidden_from_user_at IS NULL
           AND upload_state NOT IN ('replaced_hidden', 'deleted_with_card_or_account')
         ORDER BY uploaded_at DESC
         LIMIT 1",
        [$draftId, $formType, $documentType]
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? (string) $row['document_id'] : null;
}

function cpg_document_insert_metadata(array $metadata): array {
    $result = api_query(
        'INSERT INTO crewportglobal.uploaded_documents (
           document_id,
           person_id,
           user_id,
           draft_id,
           card_id,
           form_type,
           document_type,
           original_filename,
           stored_filename,
           storage_root,
           storage_path,
           safe_extension,
           mime_type,
           file_size_bytes,
           sha256_hash,
           upload_state,
           review_status,
           scan_status,
           scan_checked_at,
           valid_from,
           valid_until,
           uploaded_by_user_id,
           replaces_document_id,
           review_note
         ) VALUES (
           $1::uuid,
           $2::uuid,
           $3::uuid,
           $4::uuid,
           $5::uuid,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11,
           $12,
           $13,
           $14,
           $15,
           $16,
           $17,
           $18,
           now(),
           $19::date,
           $20::date,
           $21::uuid,
           $22::uuid,
           $23
         )
         RETURNING document_id,
                   document_type,
                   original_filename,
                   mime_type,
                   file_size_bytes,
                   sha256_hash,
                   upload_state,
                   review_status,
                   scan_status,
                   uploaded_at,
                   valid_from,
                   valid_until,
                   review_note',
        [
            $metadata['document_id'],
            $metadata['person_id'],
            $metadata['user_id'],
            $metadata['draft_id'],
            $metadata['card_id'],
            $metadata['form_type'],
            $metadata['document_type'],
            $metadata['original_filename'],
            $metadata['stored_filename'],
            $metadata['storage_root'],
            $metadata['storage_path'],
            $metadata['safe_extension'],
            $metadata['mime_type'],
            $metadata['file_size_bytes'],
            $metadata['sha256_hash'],
            $metadata['upload_state'],
            $metadata['review_status'],
            $metadata['scan_status'],
            $metadata['valid_from'],
            $metadata['valid_until'],
            $metadata['uploaded_by_user_id'],
            $metadata['replaces_document_id'],
            $metadata['review_note'],
        ]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(500, 'document_metadata_insert_failed', 'Unable to record uploaded document metadata');
    }

    return $row;
}

function cpg_document_hide_replaced_documents(string $draftId, string $formType, string $documentType, string $newDocumentId): void {
    api_query(
        "UPDATE crewportglobal.uploaded_documents
         SET upload_state = 'replaced_hidden',
             review_status = 'superseded',
             hidden_from_user_at = COALESCE(hidden_from_user_at, now()),
             replaced_by_document_id = $4::uuid,
             updated_at = now()
         WHERE draft_id = $1
           AND form_type = $2
           AND document_type = $3
           AND document_id <> $4::uuid
           AND hidden_from_user_at IS NULL
           AND upload_state NOT IN ('replaced_hidden', 'deleted_with_card_or_account')",
        [$draftId, $formType, $documentType, $newDocumentId]
    );
}

function cpg_document_read_documents(string $draftId, ?string $formType = null): array {
    $params = [$draftId];
    $formFilter = '';
    if ($formType !== null) {
        $params[] = $formType;
        $formFilter = ' AND form_type = $2';
    }

    $result = api_query(
        "SELECT document_id,
                document_type,
                original_filename,
                mime_type,
                file_size_bytes,
                sha256_hash,
                upload_state,
                review_status,
                scan_status,
                uploaded_at,
                valid_from,
                valid_until,
                review_note
         FROM crewportglobal.uploaded_documents
         WHERE draft_id = $1
           {$formFilter}
           AND hidden_from_user_at IS NULL
           AND upload_state <> 'deleted_with_card_or_account'
         ORDER BY uploaded_at DESC",
        $params
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = cpg_document_public_metadata($row);
    }

    return $items;
}

function cpg_handle_get_registration_draft_documents(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $formType = null;
    if (isset($_GET['form_type'])) {
        $formTypeValue = is_string($_GET['form_type']) ? trim($_GET['form_type']) : '';
        if ($formTypeValue !== '') {
            if (!in_array($formTypeValue, cpg_document_form_types(), true)) {
                api_error(400, 'invalid_form_type', 'form_type must be seafarer, employer or vessel');
            }
            cpg_document_read_draft_context($uuid, $formTypeValue);
            $formType = $formTypeValue;
        }
    }

    if ($formType === null) {
        $result = api_query('SELECT 1 FROM crewportglobal.users WHERE user_id = $1 LIMIT 1', [$uuid]);
        if (pg_fetch_assoc($result) === false) {
            api_error(404, 'draft_not_found', 'Registration draft not found');
        }
    }

    api_json(200, [
        'ok' => true,
        'draft_id' => $uuid,
        'documents' => cpg_document_read_documents($uuid, $formType),
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_handle_post_registration_draft_document(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') === false) {
        api_error(415, 'unsupported_media_type', 'Content-Type must be multipart/form-data');
    }

    $formType = isset($_POST['form_type']) && is_string($_POST['form_type']) ? trim($_POST['form_type']) : '';
    if (!in_array($formType, cpg_document_form_types(), true)) {
        api_error(400, 'invalid_form_type', 'form_type must be seafarer, employer or vessel');
    }

    $documentType = isset($_POST['document_type']) && is_string($_POST['document_type']) ? trim($_POST['document_type']) : '';
    $catalog = cpg_document_type_catalog();
    if ($documentType === '' || !in_array($documentType, $catalog[$formType] ?? [], true)) {
        api_error(400, 'invalid_document_type', 'document_type is required and must match the selected form_type');
    }

    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        api_error(400, 'file_required', 'file is required');
    }

    $file = $_FILES['file'];
    $uploadError = isset($file['error']) ? (int) $file['error'] : UPLOAD_ERR_NO_FILE;
    if ($uploadError !== UPLOAD_ERR_OK) {
        api_error(400, 'upload_failed', 'The uploaded file could not be received');
    }

    $tmpName = isset($file['tmp_name']) && is_string($file['tmp_name']) ? $file['tmp_name'] : '';
    if ($tmpName === '' || !is_file($tmpName)) {
        api_error(400, 'file_required', 'file is required');
    }

    $fileSize = isset($file['size']) ? (int) $file['size'] : filesize($tmpName);
    if ($fileSize <= 0) {
        api_error(400, 'empty_file_rejected', 'Uploaded file must not be empty');
    }
    if ($fileSize > CPG_DOCUMENT_MAX_FILE_SIZE_BYTES) {
        api_error(413, 'file_too_large', 'Uploaded file exceeds the 10 MB limit');
    }

    $earlyScan = cpg_document_scan_file($tmpName);
    if (($earlyScan['status'] ?? null) === 'infected') {
        api_error(400, 'malware_detected', 'Uploaded file failed malware scan');
    }

    $usage = cpg_document_existing_usage($uuid);
    if ($usage['file_count'] >= CPG_DOCUMENT_MAX_FILES_PER_DRAFT) {
        api_error(400, 'draft_file_count_limit_exceeded', 'Maximum files per draft exceeded');
    }
    if (($usage['total_bytes'] + $fileSize) > CPG_DOCUMENT_MAX_DRAFT_SIZE_BYTES) {
        api_error(413, 'draft_total_size_limit_exceeded', 'Maximum total upload size per draft exceeded');
    }

    $mimeType = cpg_document_detect_mime($tmpName);
    $mimeMap = cpg_document_allowed_mime_map();
    if ($mimeType === null || !isset($mimeMap[$mimeType])) {
        api_error(400, 'unsupported_file_type', 'Allowed file types are PDF, JPG/JPEG, PNG and WEBP');
    }
    $safeExtension = $mimeMap[$mimeType];

    $draftContext = cpg_document_read_draft_context($uuid, $formType);
    $documentId = cpg_document_uuid_v4();
    $storedFilename = $documentId . '.' . $safeExtension;
    $storageRoot = cpg_document_storage_root();
    $quarantineRelativeDir = '_quarantine/' . $formType . '/drafts/' . $uuid;
    $protectedRelativeDir = $formType . '/drafts/' . $uuid;
    $quarantineDir = $storageRoot . '/' . $quarantineRelativeDir;
    $protectedDir = $storageRoot . '/' . $protectedRelativeDir;
    $quarantinePath = $quarantineDir . '/' . $storedFilename;
    $protectedPath = $protectedDir . '/' . $storedFilename;

    cpg_document_ensure_dir($quarantineDir);

    if (!move_uploaded_file($tmpName, $quarantinePath)) {
        if (!rename($tmpName, $quarantinePath)) {
            api_error(500, 'document_quarantine_write_failed', 'Unable to write uploaded file to quarantine storage');
        }
    }
    @chmod($quarantinePath, 0660);

    $sha256Hash = hash_file('sha256', $quarantinePath);
    if (!is_string($sha256Hash) || $sha256Hash === '') {
        @unlink($quarantinePath);
        api_error(500, 'document_hash_failed', 'Unable to calculate uploaded file hash');
    }

    $scan = cpg_document_scan_file($quarantinePath);
    $scanStatus = (string) ($scan['status'] ?? 'scan_error');
    $uploadState = 'scan_failed';
    $reviewStatus = 'not_submitted';
    $finalRelativePath = $quarantineRelativeDir . '/' . $storedFilename;
    $reviewNote = null;
    $previousDocumentId = null;

    if ($scanStatus === 'clean') {
        cpg_document_ensure_dir($protectedDir);
        if (!rename($quarantinePath, $protectedPath)) {
            $scanStatus = 'scan_error';
            $reviewNote = 'Scanner passed but protected storage move failed.';
        } else {
            @chmod($protectedPath, 0660);
            $uploadState = 'stored_protected';
            $reviewStatus = 'pending_human_review';
            $finalRelativePath = $protectedRelativeDir . '/' . $storedFilename;
            $previousDocumentId = cpg_document_previous_visible_id($uuid, $formType, $documentType);
        }
    }

    if ($scanStatus === 'infected') {
        $uploadState = 'scan_failed';
        $reviewStatus = 'rejected';
        $reviewNote = 'Malware scan blocked this file.';
    } elseif ($scanStatus !== 'clean') {
        $scanStatus = 'scan_error';
        $uploadState = 'scan_failed';
        $reviewStatus = 'not_submitted';
        $reviewNote = 'Malware scanner was unavailable or returned an error.';
    }

    $inserted = cpg_document_insert_metadata([
        'document_id' => $documentId,
        'person_id' => $draftContext['person_id'],
        'user_id' => $draftContext['user_id'],
        'draft_id' => $uuid,
        'card_id' => $draftContext['card_id'],
        'form_type' => $formType,
        'document_type' => $documentType,
        'original_filename' => cpg_document_clean_original_filename((string) ($file['name'] ?? 'uploaded-document')),
        'stored_filename' => $storedFilename,
        'storage_root' => $storageRoot,
        'storage_path' => $finalRelativePath,
        'safe_extension' => $safeExtension,
        'mime_type' => $mimeType,
        'file_size_bytes' => $fileSize,
        'sha256_hash' => strtolower($sha256Hash),
        'upload_state' => $uploadState,
        'review_status' => $reviewStatus,
        'scan_status' => $scanStatus,
        'valid_from' => cpg_document_normalize_date($_POST['valid_from'] ?? null),
        'valid_until' => cpg_document_normalize_date($_POST['valid_until'] ?? null),
        'uploaded_by_user_id' => $draftContext['user_id'],
        'replaces_document_id' => $scanStatus === 'clean' ? $previousDocumentId : null,
        'review_note' => $reviewNote,
    ]);

    if ($scanStatus === 'clean') {
        cpg_document_hide_replaced_documents($uuid, $formType, $documentType, $documentId);
    }

    api_json(201, [
        'ok' => true,
        'draft_id' => $uuid,
        'document' => cpg_document_public_metadata($inserted),
        'limits' => [
            'max_file_size_bytes' => CPG_DOCUMENT_MAX_FILE_SIZE_BYTES,
            'max_total_size_bytes' => CPG_DOCUMENT_MAX_DRAFT_SIZE_BYTES,
            'max_files_per_draft' => CPG_DOCUMENT_MAX_FILES_PER_DRAFT,
        ],
        'generated_at' => gmdate('c'),
    ]);
}
