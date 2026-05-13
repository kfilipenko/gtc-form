<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';

const REG_DRAFT_STATUSES = ['draft', 'submitted_for_human_review'];

function request_path(): string {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    foreach (['/api/v1', '/app/backend/api/public'] as $prefix) {
        if (str_starts_with($path, $prefix)) {
            $trimmed = substr($path, strlen($prefix));
            return $trimmed === '' ? '/' : $trimmed;
        }
    }

    return $path;
}

function read_role_for_user(string $userId): ?string {
    $result = api_query(
        'SELECT role FROM crewportglobal.user_roles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? (string) $row['role'] : null;
}

function read_primary_company_for_user(string $userId): ?array {
    $result = api_query(
        'SELECT ec.company_id, ec.company_name, ec.registration_number, ec.country_code, ec.company_type, ec.verification_status,
                cu.role_in_company, cu.is_primary_contact
         FROM crewportglobal.company_users cu
         JOIN crewportglobal.employer_companies ec ON ec.company_id = cu.company_id
         WHERE cu.user_id = $1
         ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
         LIMIT 1',
        [$userId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function normalize_role_in_company(mixed $value): string {
    if (!is_string($value)) {
        return 'manager';
    }

    $normalized = trim(strtolower($value));
    $allowed = ['owner', 'manager', 'recruiter', 'viewer'];
    return in_array($normalized, $allowed, true) ? $normalized : 'manager';
}

function read_latest_vessel_for_company(string $companyId): ?array {
    $result = api_query(
        'SELECT vessel_id, vessel_name, vessel_type, imo_number, flag_country_code
         FROM crewportglobal.vessels
         WHERE company_id = $1
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1',
        [$companyId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function read_latest_operator_review_event(string $userId): ?array {
    $result = api_query(
        "SELECT event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                created_at
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 1",
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function build_draft_response(string $userId): array {
    $userResult = api_query(
        'SELECT user_id, email, registration_status, created_at, updated_at
         FROM crewportglobal.users
         WHERE user_id = $1',
        [$userId]
    );
    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    $role = read_role_for_user($userId);
    if ($role === null) {
        api_error(500, 'role_missing', 'User role mapping is missing');
    }

    $payload = [];

    if ($role === 'seafarer') {
        $profileResult = api_query(
            'SELECT first_name,
                    last_name,
                    primary_rank,
                    department,
                    availability_status,
                    availability_date,
                    country_code,
                    nationality_code,
                    residence_country_code,
                    preferred_vessel_types,
                    salary_expectation_usd,
                    contact_phone,
                    contact_email,
                    review_status,
                    document_metadata
             FROM crewportglobal.seafarer_profiles
             WHERE user_id = $1',
            [$userId]
        );
        $profile = pg_fetch_assoc($profileResult) ?: [];
        $payload['seafarer_profile'] = $profile;
    } else {
        $company = read_primary_company_for_user($userId);
        if ($company !== null) {
            $payload['company'] = $company;
            $vessel = read_latest_vessel_for_company((string) $company['company_id']);
            if ($vessel !== null) {
                $payload['vessel'] = $vessel;
            }
        }
    }

    $latestReviewEvent = read_latest_operator_review_event($userId);
    if ($latestReviewEvent !== null) {
        $payload['operator_review'] = $latestReviewEvent;
    }

    return [
        'ok' => true,
        'draft_id' => $userRow['user_id'],
        'role' => $role,
        'email' => $userRow['email'],
        'status' => in_array($userRow['registration_status'], REG_DRAFT_STATUSES, true)
            ? $userRow['registration_status']
            : 'draft',
        'payload' => $payload,
        'created_at' => $userRow['created_at'],
        'updated_at' => $userRow['updated_at'],
    ];
}

function write_audit_event(
    string $eventType,
    string $userId,
    ?string $companyId,
    ?string $vesselId,
    array $eventPayload,
    string $source = 'registration_api'
): void {
    $json = json_encode($eventPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = '{}';
    }

    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

    api_query(
        'INSERT INTO crewportglobal.registration_audit_events (
            event_type, user_id, company_id, vessel_id, actor_user_id, source, event_payload, ip_address, user_agent
         ) VALUES ($1, $2, $3, $4, $2, $5, $6::jsonb, $7::inet, $8)',
        [$eventType, $userId, $companyId, $vesselId, $source, $json, $ipAddress, $userAgent]
    );
}

function upsert_user_and_role(array $body): array {
    $role = api_normalize_role($body['role'] ?? null);
    if ($role === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }

    $email = api_normalize_email($body['email'] ?? null);
    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }

    $displayName = isset($body['full_name']) && is_string($body['full_name'])
        ? trim($body['full_name'])
        : null;
    if ($displayName === '') {
        $displayName = null;
    }

    $userResult = api_query(
        'INSERT INTO crewportglobal.users (email, display_name, registration_status)
         VALUES ($1, $2, $3)
         ON CONFLICT ((lower(email)))
         DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, crewportglobal.users.display_name),
           registration_status = $3,
           updated_at = now()
         RETURNING user_id',
        [$email, $displayName, 'draft']
    );

    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(500, 'user_upsert_failed', 'Unable to create or update user');
    }

    $userId = (string) $userRow['user_id'];

    api_query(
        'INSERT INTO crewportglobal.user_roles (user_id, role, source)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, role)
         DO NOTHING',
        [$userId, $role, 'registration_api']
    );

    return [$userId, $role, $email];
}

function upsert_seafarer_profile(string $userId, array $body, string $email): void {
    $firstName = isset($body['full_name']) && is_string($body['full_name']) ? trim($body['full_name']) : null;
    if ($firstName === '') {
        $firstName = null;
    }

    $availability = null;
    if (isset($body['availability_status']) && is_string($body['availability_status'])) {
        $availability = trim($body['availability_status']);
        if (!in_array($availability, ['unknown', 'available_now', 'available_later'], true)) {
            $availability = null;
        }
    }

    $countryCode = isset($body['country_code']) && is_string($body['country_code'])
        ? strtoupper(trim($body['country_code']))
        : null;
    if ($countryCode !== null && !preg_match('/^[A-Z]{2}$/', $countryCode)) {
        $countryCode = null;
    }

    $rank = isset($body['rank']) && is_string($body['rank']) ? trim($body['rank']) : null;
    if ($rank === '') {
        $rank = null;
    }

    $department = isset($body['department']) && is_string($body['department']) ? trim($body['department']) : null;
    if ($department === '') {
        $department = null;
    }

    $nationalityCode = isset($body['nationality_code']) && is_string($body['nationality_code'])
        ? strtoupper(trim($body['nationality_code']))
        : null;
    if ($nationalityCode !== null && !preg_match('/^[A-Z]{2}$/', $nationalityCode)) {
        $nationalityCode = null;
    }

    $residenceCountryCode = isset($body['residence_country_code']) && is_string($body['residence_country_code'])
        ? strtoupper(trim($body['residence_country_code']))
        : null;
    if ($residenceCountryCode !== null && !preg_match('/^[A-Z]{2}$/', $residenceCountryCode)) {
        $residenceCountryCode = null;
    }

    $availabilityDate = isset($body['availability_date']) && is_string($body['availability_date'])
        ? trim($body['availability_date'])
        : null;
    if ($availabilityDate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $availabilityDate)) {
        $availabilityDate = null;
    }

    $salaryExpectationUsd = null;
    if (isset($body['salary_expectation_usd'])) {
        if (is_numeric($body['salary_expectation_usd'])) {
            $salaryExpectationUsd = (float) $body['salary_expectation_usd'];
            if ($salaryExpectationUsd < 0) {
                $salaryExpectationUsd = null;
            }
        }
    }

    $contactPhone = isset($body['contact_phone']) && is_string($body['contact_phone']) ? trim($body['contact_phone']) : null;
    if ($contactPhone === '') {
        $contactPhone = null;
    }

    $preferredVesselTypes = [];
    if (isset($body['preferred_vessel_types']) && is_array($body['preferred_vessel_types'])) {
        foreach ($body['preferred_vessel_types'] as $item) {
            if (is_string($item)) {
                $clean = trim($item);
                if ($clean !== '') {
                    $preferredVesselTypes[] = $clean;
                }
            }
        }
    }
    $preferredVesselTypes = array_values(array_unique($preferredVesselTypes));
    $preferredVesselTypesJson = json_encode($preferredVesselTypes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($preferredVesselTypesJson === false) {
        $preferredVesselTypesJson = '[]';
    }

    api_query(
        'INSERT INTO crewportglobal.seafarer_profiles (
           user_id,
           first_name,
           primary_rank,
           department,
           availability_status,
           country_code,
           nationality_code,
           residence_country_code,
           availability_date,
           preferred_vessel_types,
           salary_expectation_usd,
           contact_phone,
           contact_email,
           review_status
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           COALESCE($5, \'unknown\'),
           $6,
           $7,
           $8,
           $9::date,
           $10::jsonb,
           $11,
           $12,
           $13,
           $14
         )
         ON CONFLICT (user_id)
         DO UPDATE SET
           first_name = COALESCE(EXCLUDED.first_name, crewportglobal.seafarer_profiles.first_name),
           primary_rank = COALESCE(EXCLUDED.primary_rank, crewportglobal.seafarer_profiles.primary_rank),
           department = COALESCE(EXCLUDED.department, crewportglobal.seafarer_profiles.department),
           availability_status = COALESCE($5, crewportglobal.seafarer_profiles.availability_status),
           country_code = COALESCE(EXCLUDED.country_code, crewportglobal.seafarer_profiles.country_code),
           nationality_code = COALESCE(EXCLUDED.nationality_code, crewportglobal.seafarer_profiles.nationality_code),
           residence_country_code = COALESCE(EXCLUDED.residence_country_code, crewportglobal.seafarer_profiles.residence_country_code),
           availability_date = COALESCE(EXCLUDED.availability_date, crewportglobal.seafarer_profiles.availability_date),
           preferred_vessel_types = CASE
               WHEN jsonb_array_length(EXCLUDED.preferred_vessel_types) = 0 THEN crewportglobal.seafarer_profiles.preferred_vessel_types
               ELSE EXCLUDED.preferred_vessel_types
           END,
           salary_expectation_usd = COALESCE(EXCLUDED.salary_expectation_usd, crewportglobal.seafarer_profiles.salary_expectation_usd),
           contact_phone = COALESCE(EXCLUDED.contact_phone, crewportglobal.seafarer_profiles.contact_phone),
           contact_email = COALESCE(EXCLUDED.contact_email, crewportglobal.seafarer_profiles.contact_email),
           review_status = EXCLUDED.review_status,
           updated_at = now()',
        [
            $userId,
            $firstName,
            $rank,
            $department,
            $availability,
            $countryCode,
            $nationalityCode,
            $residenceCountryCode,
            $availabilityDate,
            $preferredVesselTypesJson,
            $salaryExpectationUsd,
            $contactPhone,
            $email,
            'submitted_for_human_review',
        ]
    );
}

function upsert_company_context(string $userId, string $role, array $body): array {
    $companyName = isset($body['company_name']) && is_string($body['company_name'])
        ? trim($body['company_name'])
        : null;
    if ($companyName === null || $companyName === '') {
        $companyName = 'Registration Draft Company';
    }

    $countryCode = isset($body['country_code']) && is_string($body['country_code'])
        ? strtoupper(trim($body['country_code']))
        : null;
    if ($countryCode !== null && !preg_match('/^[A-Z]{2}$/', $countryCode)) {
        $countryCode = null;
    }

    $registrationNumber = isset($body['registration_number']) && is_string($body['registration_number'])
        ? trim($body['registration_number'])
        : null;
    if ($registrationNumber === '') {
        $registrationNumber = null;
    }

    $roleInCompany = normalize_role_in_company($body['role_in_company'] ?? null);

    $existingCompany = read_primary_company_for_user($userId);
    $companyId = null;

    if ($existingCompany !== null) {
        $companyId = (string) $existingCompany['company_id'];
        api_query(
            "UPDATE crewportglobal.employer_companies
             SET company_name = $2,
                 registration_number = COALESCE($3, registration_number),
                 country_code = COALESCE($4, country_code),
                 company_type = CASE WHEN $5 = 'shipowner' THEN 'shipowner'
                                     WHEN $5 = 'crewing_manager' THEN 'crewing_manager'
                                     ELSE 'employer' END,
                 updated_at = now()
             WHERE company_id = $1",
            [$companyId, $companyName, $registrationNumber, $countryCode, $role]
        );

        api_query(
            'UPDATE crewportglobal.company_users
             SET role_in_company = $3
             WHERE company_id = $1 AND user_id = $2',
            [$companyId, $userId, $roleInCompany]
        );
    } else {
        $insertResult = api_query(
            "INSERT INTO crewportglobal.employer_companies (
               company_name, registration_number, country_code, company_type, verification_status, created_by_user_id
             ) VALUES (
               $1,
               $2,
               $3,
               CASE WHEN $4 = 'shipowner' THEN 'shipowner'
                    WHEN $4 = 'crewing_manager' THEN 'crewing_manager'
                    ELSE 'employer' END,
               $5,
               $6
             )
             RETURNING company_id",
            [$companyName, $registrationNumber, $countryCode, $role, 'unverified', $userId]
        );
        $insertRow = pg_fetch_assoc($insertResult);
        if (!is_array($insertRow)) {
            api_error(500, 'company_upsert_failed', 'Unable to create company draft context');
        }
        $companyId = (string) $insertRow['company_id'];

        api_query(
            'INSERT INTO crewportglobal.company_users (company_id, user_id, role_in_company, is_primary_contact)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (company_id, user_id)
             DO UPDATE SET role_in_company = EXCLUDED.role_in_company',
            [$companyId, $userId, $roleInCompany]
        );
    }

    $vesselBody = $body['vessel'] ?? null;
    $vesselId = null;
    if (is_array($vesselBody)) {
        $vesselName = isset($vesselBody['vessel_name']) && is_string($vesselBody['vessel_name'])
            ? trim($vesselBody['vessel_name'])
            : null;
        $vesselType = isset($vesselBody['vessel_type']) && is_string($vesselBody['vessel_type'])
            ? trim($vesselBody['vessel_type'])
            : null;
        $imo = isset($vesselBody['imo_number']) && is_string($vesselBody['imo_number'])
            ? trim($vesselBody['imo_number'])
            : null;
        if ($imo !== null) {
            // Accept both "IMO1234567" and "1234567" input forms.
            $imo = strtoupper($imo);
            $imo = preg_replace('/^IMO\s*/', '', $imo);
            $imo = preg_replace('/\D+/', '', $imo ?? '');
            if (!preg_match('/^\d{7}$/', $imo ?? '')) {
                $imo = null;
            }
        }

        if ($vesselName !== null && $vesselName !== '') {
            $vesselInsert = api_query(
                'INSERT INTO crewportglobal.vessels (company_id, vessel_name, vessel_type, imo_number)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (imo_number)
                 WHERE imo_number IS NOT NULL
                 DO UPDATE SET
                   company_id = EXCLUDED.company_id,
                   vessel_name = EXCLUDED.vessel_name,
                   vessel_type = EXCLUDED.vessel_type,
                   updated_at = now()
                 RETURNING vessel_id',
                [$companyId, $vesselName, $vesselType, $imo]
            );
            $vesselRow = pg_fetch_assoc($vesselInsert);
            if (is_array($vesselRow)) {
                $vesselId = (string) $vesselRow['vessel_id'];
            }
        }
    }

    return [$companyId, $vesselId];
}

function handle_create_draft(): void {
    $body = api_decode_json_body();
    api_tx_begin();

    try {
        [$userId, $role, $email] = upsert_user_and_role($body);

        $companyId = null;
        $vesselId = null;

        if ($role === 'seafarer') {
            upsert_seafarer_profile($userId, $body, $email);
        } else {
            [$companyId, $vesselId] = upsert_company_context($userId, $role, $body);
        }

        write_audit_event('registration_draft_created', $userId, $companyId, $vesselId, [
            'role' => $role,
            'email' => $email,
        ]);

        api_tx_commit();
        api_json(201, build_draft_response($userId));
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'draft_create_failed', $error->getMessage());
    }
}

function handle_get_draft(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    api_json(200, build_draft_response($uuid));
}

function handle_patch_draft(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $body = api_decode_json_body();

    $role = read_role_for_user($uuid);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    api_tx_begin();
    try {
        if (isset($body['email'])) {
            $email = api_normalize_email($body['email']);
            if ($email === null) {
                api_error(400, 'invalid_email', 'email must be valid');
            }
            api_query(
                'UPDATE crewportglobal.users
                 SET email = $2, updated_at = now()
                 WHERE user_id = $1',
                [$uuid, $email]
            );
        }

        if ($role === 'seafarer') {
            $email = isset($body['email']) ? api_normalize_email($body['email']) : null;
            if ($email === null) {
                $current = api_query('SELECT email FROM crewportglobal.users WHERE user_id = $1', [$uuid]);
                $row = pg_fetch_assoc($current);
                $email = is_array($row) ? (string) $row['email'] : '';
            }
            upsert_seafarer_profile($uuid, $body, $email);
            write_audit_event('registration_draft_updated', $uuid, null, null, ['role' => $role]);
        } else {
            [$companyId, $vesselId] = upsert_company_context($uuid, $role, $body);
            write_audit_event('registration_draft_updated', $uuid, $companyId, $vesselId, ['role' => $role]);
        }

        api_tx_commit();
        api_json(200, build_draft_response($uuid));
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'draft_update_failed', $error->getMessage());
    }
}

function read_operator_review_queue(): array {
    $items = [];

    $seafarerResult = api_query(
        "SELECT
            sp.seafarer_profile_id AS queue_item_id,
            sp.user_id AS draft_id,
            u.email,
            u.display_name,
            sp.review_status AS queue_status,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.created_at,
            sp.updated_at
         FROM crewportglobal.seafarer_profiles sp
         JOIN crewportglobal.users u ON u.user_id = sp.user_id
         WHERE sp.review_status IN ('submitted_for_human_review', 'in_review')
         ORDER BY sp.updated_at DESC, sp.created_at DESC
         LIMIT 200"
    );

    while (($row = pg_fetch_assoc($seafarerResult)) !== false) {
        $items[] = [
            'queue_item_id' => $row['queue_item_id'],
            'queue_type' => 'seafarer_profile',
            'draft_id' => $row['draft_id'],
            'role' => 'seafarer',
            'email' => $row['email'],
            'full_name' => $row['display_name'] ?? $row['email'],
            'status' => $row['queue_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'summary' => [
                'primary_rank' => $row['primary_rank'],
                'department' => $row['department'],
                'availability_status' => $row['availability_status'],
                'availability_date' => $row['availability_date'],
            ],
        ];
    }

    $companyResult = api_query(
        "SELECT
            ec.company_id AS queue_item_id,
            cu.user_id AS draft_id,
            COALESCE(ur.role, 'employer') AS role,
            u.email,
            u.display_name,
            ec.verification_status AS queue_status,
            ec.company_name,
            ec.company_type,
            ec.country_code,
            cu.role_in_company,
            ec.created_at,
            ec.updated_at
         FROM crewportglobal.employer_companies ec
         JOIN LATERAL (
             SELECT cu.user_id, cu.role_in_company
             FROM crewportglobal.company_users cu
             WHERE cu.company_id = ec.company_id
             ORDER BY cu.is_primary_contact DESC, cu.created_at ASC
             LIMIT 1
         ) cu ON TRUE
         JOIN crewportglobal.users u ON u.user_id = cu.user_id
         LEFT JOIN LATERAL (
             SELECT role
             FROM crewportglobal.user_roles ur
             WHERE ur.user_id = u.user_id
             ORDER BY ur.created_at ASC
             LIMIT 1
         ) ur ON TRUE
         WHERE ec.verification_status IN ('unverified', 'submitted')
         ORDER BY ec.updated_at DESC, ec.created_at DESC
         LIMIT 200"
    );

    while (($row = pg_fetch_assoc($companyResult)) !== false) {
        $items[] = [
            'queue_item_id' => $row['queue_item_id'],
            'queue_type' => 'company_verification',
            'draft_id' => $row['draft_id'],
            'role' => $row['role'],
            'email' => $row['email'],
            'full_name' => $row['display_name'] ?? $row['email'],
            'status' => $row['queue_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'summary' => [
                'company_name' => $row['company_name'],
                'company_type' => $row['company_type'],
                'country_code' => $row['country_code'],
                'role_in_company' => $row['role_in_company'],
            ],
        ];
    }

    usort(
        $items,
        static fn(array $a, array $b): int => strcmp((string) ($b['updated_at'] ?? ''), (string) ($a['updated_at'] ?? ''))
    );

    return $items;
}

function handle_get_operator_review_queue(): void {
    $queue = read_operator_review_queue();
    api_json(200, [
        'ok' => true,
        'queue' => $queue,
        'count' => count($queue),
        'generated_at' => gmdate('c'),
    ]);
}

function normalize_operator_decision(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $decision = trim(strtolower($value));
    return in_array($decision, ['start_review', 'needs_correction', 'reviewed'], true) ? $decision : null;
}

function normalize_operator_review_note(mixed $value): ?string {
    if ($value === null) {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_review_note', 'note must be a string');
    }

    $note = trim($value);
    if (strlen($note) > 1000) {
        api_error(400, 'invalid_review_note', 'note must be at most 1000 characters');
    }

    return $note === '' ? null : $note;
}

function apply_operator_review_decision(string $draftId, string $decision, ?string $reviewNote): array {
    $role = read_role_for_user($draftId);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    if ($role === 'seafarer') {
        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reviewed' => 'approved',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            'SELECT review_status FROM crewportglobal.seafarer_profiles WHERE user_id = $1',
            [$draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Seafarer review item not found');
        }
        $previousStatus = (string) $currentRow['review_status'];

        api_query(
            'UPDATE crewportglobal.seafarer_profiles
             SET review_status = $2, updated_at = now()
             WHERE user_id = $1',
            [$draftId, $newStatus]
        );

        write_audit_event('operator_review_decision_recorded', $draftId, null, null, [
            'decision' => $decision,
            'queue_type' => 'seafarer_profile',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => $role,
            'review_note' => $reviewNote,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'seafarer_profile',
            'role' => $role,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => null,
            'review_note' => $reviewNote,
        ];
    }

    $company = read_primary_company_for_user($draftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'review_item_not_found', 'Company review item not found');
    }

    $companyId = (string) $company['company_id'];
    $statusMap = [
        'start_review' => 'submitted',
        'needs_correction' => 'rejected',
        'reviewed' => 'verified',
    ];
    $newStatus = $statusMap[$decision];

    $currentResult = api_query(
        'SELECT verification_status FROM crewportglobal.employer_companies WHERE company_id = $1',
        [$companyId]
    );
    $currentRow = pg_fetch_assoc($currentResult);
    if (!is_array($currentRow)) {
        api_error(404, 'review_item_not_found', 'Company review item not found');
    }
    $previousStatus = (string) $currentRow['verification_status'];

    api_query(
        'UPDATE crewportglobal.employer_companies
         SET verification_status = $2, updated_at = now()
         WHERE company_id = $1',
        [$companyId, $newStatus]
    );

    write_audit_event('operator_review_decision_recorded', $draftId, $companyId, null, [
        'decision' => $decision,
        'queue_type' => 'company_verification',
        'previous_status' => $previousStatus,
        'new_status' => $newStatus,
        'role' => $role,
        'review_note' => $reviewNote,
    ], 'operator_review_queue');

    return [
        'queue_type' => 'company_verification',
        'role' => $role,
        'previous_status' => $previousStatus,
        'new_status' => $newStatus,
        'company_id' => $companyId,
        'review_note' => $reviewNote,
    ];
}

function handle_patch_operator_review_queue_status(string $draftId): void {
    $uuid = api_normalize_uuid($draftId);
    if ($uuid === null) {
        api_error(400, 'invalid_draft_id', 'draft_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $decision = normalize_operator_decision($body['decision'] ?? $body['action'] ?? $body['status'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, needs_correction, reviewed');
    }
    $reviewNote = normalize_operator_review_note($body['note'] ?? null);
    if ($decision === 'needs_correction' && $reviewNote === null) {
        api_error(400, 'review_note_required', 'note is required for needs_correction');
    }

    api_tx_begin();
    try {
        $result = apply_operator_review_decision($uuid, $decision, $reviewNote);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'draft_id' => $uuid,
            'decision' => $decision,
            'queue_type' => $result['queue_type'],
            'role' => $result['role'],
            'previous_status' => $result['previous_status'],
            'new_status' => $result['new_status'],
            'company_id' => $result['company_id'],
            'review_note' => $result['review_note'],
            'updated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'operator_review_update_failed', $error->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = request_path();

if ($method === 'POST' && $path === '/registration/drafts') {
    handle_create_draft();
}

if (preg_match('#^/registration/drafts/([^/]+)$#', $path, $matches) === 1) {
    $draftId = $matches[1];
    if ($method === 'GET') {
        handle_get_draft($draftId);
    }
    if ($method === 'PATCH') {
        handle_patch_draft($draftId);
    }
    header('Allow: GET, PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, PATCH');
}

if ($method === 'GET' && $path === '/operator/review-queue') {
    handle_get_operator_review_queue();
}

if (preg_match('#^/operator/review-queue/([^/]+)/status$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_operator_review_queue_status($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/health' || $path === '/healthz') {
    api_json(200, ['ok' => true, 'service' => 'crewportglobal-registration-api']);
}

header('Allow: POST, GET, PATCH');
api_error(404, 'not_found', 'Endpoint not found');
