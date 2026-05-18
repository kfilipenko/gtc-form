<?php

declare(strict_types=1);

const CPG_PROFILE_PHOTO_STORAGE_ROOT_DEFAULT = '/srv/crewportglobal/storage/profile_photos';
const CPG_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES = 5242880;

function cpg_profile_photo_storage_root(): string {
    foreach (['CREWPORTGLOBAL_PROFILE_PHOTO_STORAGE_ROOT', 'CPG_PROFILE_PHOTO_STORAGE_ROOT'] as $envName) {
        $value = getenv($envName);
        if (is_string($value) && trim($value) !== '') {
            return rtrim(trim($value), '/');
        }
    }

    return CPG_PROFILE_PHOTO_STORAGE_ROOT_DEFAULT;
}

function cpg_profile_photo_allowed_mime_map(): array {
    return [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
}

function cpg_profile_photo_public_metadata(?array $row): ?array {
    if (!is_array($row)) {
        return null;
    }

    return [
        'profile_photo_id' => (string) $row['profile_photo_id'],
        'original_filename' => (string) $row['original_filename'],
        'mime_type' => (string) $row['mime_type'],
        'file_size_bytes' => isset($row['file_size_bytes']) ? (int) $row['file_size_bytes'] : null,
        'sha256_hash' => (string) $row['sha256_hash'],
        'upload_state' => (string) $row['upload_state'],
        'scan_status' => (string) $row['scan_status'],
        'uploaded_at' => (string) $row['uploaded_at'],
        'image_url' => '/api/v1/user/profile-photo/image?v=' . rawurlencode((string) $row['profile_photo_id']),
    ];
}

function cpg_profile_photo_current_row(string $userId): ?array {
    $result = api_query(
        "SELECT profile_photo_id,
                user_id,
                original_filename,
                stored_filename,
                storage_root,
                storage_path,
                safe_extension,
                mime_type,
                file_size_bytes,
                sha256_hash,
                upload_state,
                scan_status,
                uploaded_at
         FROM crewportglobal.user_profile_photos
         WHERE user_id = $1
           AND is_current = TRUE
           AND hidden_from_user_at IS NULL
           AND upload_state = 'stored_protected'
           AND scan_status = 'clean'
         ORDER BY uploaded_at DESC
         LIMIT 1",
        [$userId]
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? $row : null;
}

function cpg_profile_photo_public_current(string $userId): ?array {
    return cpg_profile_photo_public_metadata(cpg_profile_photo_current_row($userId));
}

function cpg_profile_photo_insert_metadata(array $metadata): array {
    $result = api_query(
        'INSERT INTO crewportglobal.user_profile_photos (
           profile_photo_id,
           user_id,
           original_filename,
           stored_filename,
           storage_root,
           storage_path,
           safe_extension,
           mime_type,
           file_size_bytes,
           sha256_hash,
           upload_state,
           scan_status,
           scan_checked_at,
           is_current,
           replaces_profile_photo_id,
           review_note
         ) VALUES (
           $1::uuid,
           $2::uuid,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11,
           $12,
           now(),
           $13,
           $14::uuid,
           $15
         )
         RETURNING profile_photo_id,
                   original_filename,
                   mime_type,
                   file_size_bytes,
                   sha256_hash,
                   upload_state,
                   scan_status,
                   uploaded_at',
        [
            $metadata['profile_photo_id'],
            $metadata['user_id'],
            $metadata['original_filename'],
            $metadata['stored_filename'],
            $metadata['storage_root'],
            $metadata['storage_path'],
            $metadata['safe_extension'],
            $metadata['mime_type'],
            $metadata['file_size_bytes'],
            $metadata['sha256_hash'],
            $metadata['upload_state'],
            $metadata['scan_status'],
            $metadata['is_current'],
            $metadata['replaces_profile_photo_id'],
            $metadata['review_note'],
        ]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(500, 'profile_photo_metadata_insert_failed', 'Unable to record profile photo metadata');
    }

    return $row;
}

function cpg_profile_photo_hide_previous(string $userId, string $newProfilePhotoId): void {
    api_query(
        "UPDATE crewportglobal.user_profile_photos
         SET upload_state = 'replaced_hidden',
             is_current = FALSE,
             hidden_from_user_at = COALESCE(hidden_from_user_at, now()),
             replaced_by_profile_photo_id = $2::uuid,
             updated_at = now()
         WHERE user_id = $1
           AND profile_photo_id <> $2::uuid
           AND hidden_from_user_at IS NULL
           AND upload_state <> 'deleted_with_account'",
        [$userId, $newProfilePhotoId]
    );
}

function cpg_profile_photo_require_session(): array {
    $session = cpg_auth_find_active_session();
    if ($session === null) {
        api_error(401, 'authentication_required', 'Authentication is required');
    }

    return $session;
}

function cpg_handle_get_user_profile_photo(): void {
    $session = cpg_profile_photo_require_session();
    $photo = cpg_profile_photo_public_current((string) $session['user_id']);

    api_json(200, [
        'ok' => true,
        'profile_photo' => $photo,
        'limits' => [
            'max_file_size_bytes' => CPG_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES,
            'allowed_mime_types' => array_keys(cpg_profile_photo_allowed_mime_map()),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_handle_post_user_profile_photo(): void {
    $session = cpg_profile_photo_require_session();
    $userId = (string) $session['user_id'];

    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') === false) {
        api_error(415, 'unsupported_media_type', 'Content-Type must be multipart/form-data');
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
    if ($fileSize > CPG_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES) {
        api_error(413, 'profile_photo_too_large', 'Profile photo exceeds the 5 MB limit');
    }

    $earlyScan = cpg_document_scan_file($tmpName);
    if (($earlyScan['status'] ?? null) === 'infected') {
        api_error(400, 'malware_detected', 'Uploaded profile photo failed malware scan');
    }

    $mimeType = cpg_document_detect_mime($tmpName);
    $mimeMap = cpg_profile_photo_allowed_mime_map();
    if ($mimeType === null || !isset($mimeMap[$mimeType])) {
        api_error(400, 'unsupported_file_type', 'Allowed profile photo types are JPG/JPEG, PNG and WEBP');
    }
    $safeExtension = $mimeMap[$mimeType];

    $profilePhotoId = cpg_document_uuid_v4();
    $storedFilename = $profilePhotoId . '.' . $safeExtension;
    $storageRoot = cpg_profile_photo_storage_root();
    $quarantineRelativeDir = '_quarantine/users/' . $userId;
    $protectedRelativeDir = 'users/' . $userId;
    $quarantineDir = $storageRoot . '/' . $quarantineRelativeDir;
    $protectedDir = $storageRoot . '/' . $protectedRelativeDir;
    $quarantinePath = $quarantineDir . '/' . $storedFilename;
    $protectedPath = $protectedDir . '/' . $storedFilename;

    cpg_document_ensure_dir($quarantineDir);

    if (!move_uploaded_file($tmpName, $quarantinePath)) {
        if (!rename($tmpName, $quarantinePath)) {
            api_error(500, 'profile_photo_quarantine_write_failed', 'Unable to write profile photo to quarantine storage');
        }
    }
    @chmod($quarantinePath, 0660);

    $sha256Hash = hash_file('sha256', $quarantinePath);
    if (!is_string($sha256Hash) || $sha256Hash === '') {
        @unlink($quarantinePath);
        api_error(500, 'profile_photo_hash_failed', 'Unable to calculate profile photo hash');
    }

    $scan = cpg_document_scan_file($quarantinePath);
    $scanStatus = (string) ($scan['status'] ?? 'scan_error');
    $uploadState = 'scan_failed';
    $finalRelativePath = $quarantineRelativeDir . '/' . $storedFilename;
    $reviewNote = null;
    $isCurrent = false;
    $previousPhoto = cpg_profile_photo_current_row($userId);
    $previousPhotoId = is_array($previousPhoto) ? (string) $previousPhoto['profile_photo_id'] : null;

    if ($scanStatus === 'clean') {
        cpg_document_ensure_dir($protectedDir);
        if (!rename($quarantinePath, $protectedPath)) {
            $scanStatus = 'scan_error';
            $reviewNote = 'Scanner passed but protected profile photo storage move failed.';
        } else {
            @chmod($protectedPath, 0660);
            $uploadState = 'stored_protected';
            $finalRelativePath = $protectedRelativeDir . '/' . $storedFilename;
            $isCurrent = true;
        }
    }

    if ($scanStatus === 'infected') {
        $uploadState = 'scan_failed';
        $reviewNote = 'Malware scan blocked this profile photo.';
    } elseif ($scanStatus !== 'clean') {
        $scanStatus = 'scan_error';
        $uploadState = 'scan_failed';
        $reviewNote = 'Malware scanner was unavailable or returned an error.';
    }

    api_tx_begin();
    try {
        if ($isCurrent) {
            api_query(
                "UPDATE crewportglobal.user_profile_photos
                 SET is_current = FALSE
                 WHERE user_id = $1
                   AND is_current = TRUE",
                [$userId]
            );
        }

        $inserted = cpg_profile_photo_insert_metadata([
            'profile_photo_id' => $profilePhotoId,
            'user_id' => $userId,
            'original_filename' => cpg_document_clean_original_filename((string) ($file['name'] ?? 'profile-photo')),
            'stored_filename' => $storedFilename,
            'storage_root' => $storageRoot,
            'storage_path' => $finalRelativePath,
            'safe_extension' => $safeExtension,
            'mime_type' => $mimeType,
            'file_size_bytes' => $fileSize,
            'sha256_hash' => strtolower($sha256Hash),
            'upload_state' => $uploadState,
            'scan_status' => $scanStatus,
            'is_current' => $isCurrent,
            'replaces_profile_photo_id' => $isCurrent ? $previousPhotoId : null,
            'review_note' => $reviewNote,
        ]);

        if ($isCurrent) {
            cpg_profile_photo_hide_previous($userId, $profilePhotoId);
        }

        write_audit_event('profile_photo_uploaded', $userId, null, null, [
            'profile_photo_id' => $profilePhotoId,
            'mime_type' => $mimeType,
            'file_size_bytes' => $fileSize,
            'sha256_hash' => strtolower($sha256Hash),
            'scan_status' => $scanStatus,
            'upload_state' => $uploadState,
            'is_current' => $isCurrent,
        ], 'user_profile_photo');

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'profile_photo_upload_failed', $error->getMessage());
    }

    if (!$isCurrent) {
        api_error(400, $scanStatus === 'infected' ? 'malware_detected' : 'profile_photo_scan_failed', 'Profile photo was not accepted');
    }

    api_json(201, [
        'ok' => true,
        'status' => 'profile_photo_uploaded',
        'profile_photo' => cpg_profile_photo_public_metadata($inserted),
        'limits' => [
            'max_file_size_bytes' => CPG_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES,
            'allowed_mime_types' => array_keys(cpg_profile_photo_allowed_mime_map()),
        ],
        'generated_at' => gmdate('c'),
    ]);
}

function cpg_handle_get_user_profile_photo_image(): void {
    $session = cpg_profile_photo_require_session();
    $row = cpg_profile_photo_current_row((string) $session['user_id']);
    if (!is_array($row)) {
        api_error(404, 'profile_photo_not_found', 'Profile photo was not found');
    }

    $storageRoot = rtrim((string) $row['storage_root'], '/');
    $storagePath = ltrim((string) $row['storage_path'], '/');
    if ($storagePath === '' || str_contains($storagePath, '..')) {
        api_error(500, 'profile_photo_path_invalid', 'Profile photo storage path is invalid');
    }

    $fullPath = $storageRoot . '/' . $storagePath;
    $rootReal = realpath($storageRoot);
    $fileReal = realpath($fullPath);
    if ($rootReal === false || $fileReal === false || !str_starts_with($fileReal, $rootReal . DIRECTORY_SEPARATOR) || !is_file($fileReal)) {
        api_error(404, 'profile_photo_not_found', 'Profile photo was not found');
    }

    header('Content-Type: ' . (string) $row['mime_type']);
    header('Content-Length: ' . (string) filesize($fileReal));
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: inline; filename="profile-photo.' . (string) $row['safe_extension'] . '"');
    readfile($fileReal);
    exit;
}
