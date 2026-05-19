<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/access_control.php';
require_once __DIR__ . '/../lib/admin_access_email_delivery.php';
require_once __DIR__ . '/../lib/admin_access_flow.php';
require_once __DIR__ . '/../lib/admin_access_storage_factory.php';
require_once __DIR__ . '/../lib/document_uploads.php';
require_once __DIR__ . '/../lib/identity_context.php';
require_once __DIR__ . '/../lib/reference_catalogs.php';
require_once __DIR__ . '/../lib/registration_person_flow.php';
require_once __DIR__ . '/../lib/user_auth.php';
require_once __DIR__ . '/../lib/user_email_verification.php';
require_once __DIR__ . '/../lib/user_profile_photos.php';

const REG_DRAFT_STATUSES = ['draft', 'submitted_for_human_review'];
const ADMIN_ACCESS_PUBLIC_ROUTES_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';
const ADMIN_ACCESS_PUBLIC_ROUTES_LEGACY_ENV = 'CPG_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED';

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

function request_header_value(string $name): ?string {
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    $value = $_SERVER[$serverKey] ?? null;
    if (!is_string($value)) {
        return null;
    }

    $trimmed = trim($value);
    return $trimmed === '' ? null : $trimmed;
}

function operator_access_token(): ?string {
    foreach (['CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN', 'CPG_OPERATOR_ACCESS_TOKEN'] as $envName) {
        $value = getenv($envName);
        if (is_string($value) && trim($value) !== '') {
            return trim($value);
        }
    }

    return null;
}

function request_operator_token(): ?string {
    $headerToken = request_header_value('X-CPG-Operator-Token');
    if ($headerToken !== null) {
        return $headerToken;
    }

    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (is_string($authorization) && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches) === 1) {
        $token = trim($matches[1]);
        return $token === '' ? null : $token;
    }

    return null;
}

function require_operator_access(): void {
    $expected = operator_access_token();
    if ($expected === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    $provided = request_operator_token();
    if ($provided === null || !hash_equals($expected, $provided)) {
        api_error(401, 'operator_access_required', 'Operator access token is required');
    }
}

function require_operator_or_team_access(): array {
    $expected = operator_access_token();
    $provided = request_operator_token();
    if ($expected !== null && $provided !== null && hash_equals($expected, $provided)) {
        return [
            'access_model' => 'temporary_operator_token',
            'actor_label' => 'operator_document_review_queue',
            'actor_user_id' => null,
        ];
    }

    $adminToken = admin_access_session_token();
    if ($adminToken !== null) {
        admin_access_load_runtime_env();
        if (admin_access_public_flow_enabled()) {
            $storage = admin_access_storage_or_response();
            $session = $storage->findActiveAdminSession($adminToken, cpg_admin_now());
            if (is_array($session) && cpg_admin_access_user_can_view_team_links($session)) {
                return [
                    'access_model' => 'team_admin_session',
                    'actor_label' => (string) ($session['email'] ?? 'team_session'),
                    'actor_user_id' => (string) ($session['user_id'] ?? ''),
                    'groups' => $session['groups'] ?? [],
                ];
            }
        }
    }

    if ($expected === null && $adminToken === null) {
        api_error(403, 'operator_access_not_configured', 'Operator access token is not configured');
    }

    api_error(401, 'operator_or_team_access_required', 'Operator or approved team access is required');
}

function operator_queue_access_contract(string $queueType): ?array {
    $identity = cpg_identity_temporary_operator_token('operator_review_queue');
    return cpg_access_operator_queue_capabilities($queueType, null, true, cpg_identity_permission_mode($identity));
}

function admin_access_public_routes_enabled(): bool {
    return cpg_admin_access_bool_env(ADMIN_ACCESS_PUBLIC_ROUTES_ENV)
        || cpg_admin_access_bool_env(ADMIN_ACCESS_PUBLIC_ROUTES_LEGACY_ENV);
}

function admin_access_public_flow_enabled(): bool {
    return admin_access_public_routes_enabled() && cpg_admin_access_flow_enabled();
}

function admin_access_load_runtime_env(): void {
    cpg_admin_access_load_protected_env_file();
}

function admin_access_api_response(array $response): void {
    $status = $response['status'] ?? 500;
    $payload = $response['payload'] ?? [
        'ok' => false,
        'error' => 'admin_access_response_error',
        'message' => 'Invalid admin access response',
    ];

    api_json(is_int($status) ? $status : 500, is_array($payload) ? $payload : []);
}

function admin_access_request_metadata(): array {
    return [
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    ];
}

function admin_access_session_token(): ?string {
    $headerToken = request_header_value('X-CPG-Admin-Session');
    if ($headerToken !== null) {
        return $headerToken;
    }

    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (is_string($authorization) && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches) === 1) {
        $token = trim($matches[1]);
        return $token === '' ? null : $token;
    }

    return null;
}

function admin_access_storage_or_response(): CpgAdminAccessStorage {
    $storageDisabled = cpg_admin_access_storage_factory_disabled_response();
    if ($storageDisabled !== null) {
        admin_access_api_response($storageDisabled);
    }

    $storage = cpg_admin_access_create_storage();
    if (!$storage instanceof CpgAdminAccessStorage) {
        admin_access_api_response(cpg_admin_access_response(503, [
            'ok' => false,
            'error' => 'admin_access_storage_not_configured',
            'message' => 'Admin access storage is not configured yet',
        ]));
    }

    return $storage;
}

function handle_post_admin_access_email_code_request(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $deliveryDisabled = cpg_admin_access_email_delivery_disabled_response();
    if ($deliveryDisabled !== null) {
        admin_access_api_response($deliveryDisabled);
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    $delivery = cpg_admin_access_create_email_delivery();
    if (!$storage instanceof CpgAdminAccessStorage || !$delivery instanceof CpgAdminAccessEmailDelivery) {
        admin_access_api_response(cpg_admin_access_response(503, [
            'ok' => false,
            'error' => 'admin_access_runtime_not_configured',
            'message' => 'Admin access runtime is not configured',
        ]));
    }

    admin_access_api_response(cpg_admin_access_request_code_with_storage_and_delivery(
        $body,
        $storage,
        $delivery,
        true,
        null,
        admin_access_request_metadata()
    ));
}

function handle_post_admin_access_email_code_verify(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();

    admin_access_api_response(cpg_admin_access_verify_code_with_storage(
        $body,
        $storage,
        true,
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_session(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_session_summary_with_storage(
        $storage,
        admin_access_session_token(),
        null,
        12
    ));
}

function handle_post_admin_access_session_revoke(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_revoke_session_with_storage(
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_team_links(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_team_links_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_get_admin_access_management(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_management_snapshot_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_post_admin_access_user(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_create_user_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_post_admin_access_group_member(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_admin_access_add_group_member_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function handle_get_admin_access_reference_catalogs(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_reference_catalog_admin_snapshot_with_storage(
        $storage,
        admin_access_session_token()
    ));
}

function handle_patch_admin_access_reference_catalog_publication(): void {
    admin_access_load_runtime_env();
    if (!admin_access_public_flow_enabled()) {
        admin_access_api_response(cpg_admin_access_disabled_response());
    }

    $body = api_decode_json_body();
    $storage = admin_access_storage_or_response();
    admin_access_api_response(cpg_reference_catalog_publication_with_storage(
        $body,
        $storage,
        admin_access_session_token(),
        null,
        admin_access_request_metadata()
    ));
}

function registration_person_runtime_or_error(): void {
    admin_access_load_runtime_env();
    if (!cpg_registration_public_flow_enabled()) {
        api_error(503, 'registration_person_flow_disabled', 'Registration person flow is not enabled');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    $deliveryStatus = cpg_registration_email_delivery_status();
    if (($deliveryStatus['ok'] ?? false) !== true) {
        api_json(503, [
            'ok' => false,
            'error' => $deliveryStatus['error'] ?? 'registration_email_delivery_disabled',
            'message' => 'Registration email delivery is not configured',
            'missing_config' => $deliveryStatus['missing_config'] ?? [],
        ]);
    }
}

function normalize_registration_person_text(mixed $value, int $maxLength): ?string {
    if (!is_string($value)) {
        return null;
    }

    $text = trim($value);
    if ($text === '') {
        return null;
    }

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function handle_post_registration_person_request(): void {
    registration_person_runtime_or_error();
    $body = api_decode_json_body();

    $email = api_normalize_email($body['email'] ?? null);
    $fullName = normalize_registration_person_text($body['full_name'] ?? null, 240);
    $phone = normalize_registration_person_text($body['phone'] ?? null, 80);
    $country = normalize_registration_person_text($body['country'] ?? null, 120);
    $language = normalize_registration_person_text($body['language'] ?? null, 12) ?? 'en';
    $termsAccepted = ($body['terms_accepted'] ?? false) === true;
    $consentAccepted = ($body['consent_accepted'] ?? false) === true;

    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }
    if ($fullName === null || $phone === null || $country === null || !$termsAccepted || !$consentAccepted) {
        api_error(400, 'registration_person_required_fields_missing', 'full_name, phone, country and both consents are required');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    api_tx_begin();
    try {
        $userResult = api_query(
            "INSERT INTO crewportglobal.users (email, display_name, registration_status)
             VALUES ($1, $2, 'draft')
             ON CONFLICT ((lower(email)))
             DO UPDATE SET
               display_name = COALESCE(NULLIF(crewportglobal.users.display_name, ''), EXCLUDED.display_name),
               registration_status = CASE
                 WHEN crewportglobal.users.registration_status = 'approved' THEN crewportglobal.users.registration_status
                 ELSE 'draft'
               END,
               updated_at = now()
             RETURNING user_id, email, display_name, email_verified_at",
            [$email, $fullName]
        );
        $userRow = pg_fetch_assoc($userResult);
        if (!is_array($userRow)) {
            api_tx_rollback();
            api_error(500, 'registration_person_upsert_failed', 'Unable to create or update person record');
        }

        $userId = (string) $userRow['user_id'];
        $now = time();
        $token = cpg_registration_create_confirmation_token($userId, $email, $now, $secret);
        $expiresAt = gmdate('c', $now + CPG_REGISTRATION_LINK_TTL_SECONDS);
        $confirmationUrl = cpg_registration_confirmation_url($token);
        $message = cpg_registration_email_message($email, $confirmationUrl, $expiresAt);
        $delivery = cpg_registration_send_email_message($message);

        $deliveryStatusCode = (string) ($delivery['delivery_status'] ?? '');
        if (($delivery['ok'] ?? false) !== true
            || !in_array($deliveryStatusCode, ['registration_email_delivery_sent', 'captured_test_only'], true)
        ) {
            api_tx_rollback();
            api_json(502, [
                'ok' => false,
                'error' => $delivery['error'] ?? 'registration_email_delivery_failed',
                'message' => 'Unable to send registration confirmation email',
                'delivery_status' => $deliveryStatusCode,
            ]);
        }

        write_audit_event('person_registration_email_requested', $userId, null, null, [
            'email' => $email,
            'phone_present' => $phone !== null,
            'country' => $country,
            'language' => $language,
            'terms_accepted' => $termsAccepted,
            'consent_accepted' => $consentAccepted,
            'delivery_status' => $delivery['delivery_status'] ?? null,
            'expires_at' => $expiresAt,
        ], 'public_person_registration');

        api_tx_commit();

        api_json(202, [
            'ok' => true,
            'status' => 'registration_email_confirmation_sent',
            'person_id' => $userId,
            'masked_email' => cpg_admin_mask_email($email),
            'email_verified' => $userRow['email_verified_at'] !== null,
            'delivery_status' => $delivery['delivery_status'] ?? null,
            'next_step' => 'open_email_confirmation_link',
            'expires_at' => $expiresAt,
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'registration_person_request_failed', $error->getMessage());
    }
}

function handle_post_registration_person_confirm(): void {
    admin_access_load_runtime_env();
    if (!cpg_registration_public_flow_enabled()) {
        api_error(503, 'registration_person_flow_disabled', 'Registration person flow is not enabled');
    }

    $secret = cpg_registration_link_secret();
    if ($secret === null) {
        api_error(503, 'registration_link_secret_not_configured', 'Registration confirmation link secret is not configured');
    }

    $body = api_decode_json_body();
    $token = isset($body['token']) && is_string($body['token']) ? trim($body['token']) : '';
    if ($token === '') {
        api_error(400, 'registration_confirmation_token_required', 'token is required');
    }

    $verifiedToken = cpg_registration_verify_confirmation_token($token, time(), $secret);
    if (($verifiedToken['ok'] ?? false) !== true) {
        api_error(400, (string) ($verifiedToken['error'] ?? 'registration_confirmation_token_invalid'), 'Registration confirmation token is invalid or expired');
    }

    $userId = (string) $verifiedToken['user_id'];
    $email = (string) $verifiedToken['email'];

    api_tx_begin();
    try {
        $userResult = api_query(
            'UPDATE crewportglobal.users
             SET email_verified_at = COALESCE(email_verified_at, now()),
                 updated_at = now()
             WHERE user_id = $1 AND lower(email) = lower($2)
             RETURNING user_id, email, display_name, email_verified_at',
            [$userId, $email]
        );
        $userRow = pg_fetch_assoc($userResult);
        if (!is_array($userRow)) {
            api_tx_rollback();
            api_error(404, 'registration_person_not_found', 'Registration person record was not found');
        }

        api_query(
            'INSERT INTO crewportglobal.user_auth_identities (user_id, provider, provider_subject, is_primary)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (user_id, provider)
             DO UPDATE SET
               provider_subject = EXCLUDED.provider_subject,
               is_primary = TRUE,
               updated_at = now()',
            [$userId, 'email', $email]
        );

        write_audit_event('person_registration_email_confirmed', $userId, null, null, [
            'email' => $email,
            'confirmed_at' => $userRow['email_verified_at'] ?? gmdate('c'),
        ], 'public_person_registration');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'status' => 'registration_email_confirmed',
            'person_id' => $userId,
            'email' => $email,
            'display_name' => $userRow['display_name'] ?? null,
            'email_verified_at' => $userRow['email_verified_at'],
            'next_url' => '/register/next/',
            'next_step' => 'continue_registration_sequence',
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'registration_person_confirm_failed', $error->getMessage());
    }
}

function handle_post_auth_register_password(): void {
    admin_access_load_runtime_env();
    $body = api_decode_json_body();
    $email = api_normalize_email($body['email'] ?? null);
    $password = cpg_auth_normalize_password($body['password'] ?? null);
    $confirmPassword = isset($body['confirm_password']) ? cpg_auth_normalize_password($body['confirm_password']) : $password;
    $role = api_normalize_role($body['role'] ?? null);
    $termsAccepted = ($body['terms_accepted'] ?? false) === true;
    $consentAccepted = ($body['consent_accepted'] ?? false) === true;

    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }
    if ($password === null) {
        api_error(400, 'invalid_password', 'password must be between 8 and 200 characters');
    }
    if ($confirmPassword === null || !hash_equals($password, $confirmPassword)) {
        api_error(400, 'password_confirmation_mismatch', 'password confirmation does not match');
    }
    if ($role === null) {
        api_error(400, 'invalid_role', 'role must be one of seafarer, employer, shipowner, crewing_manager');
    }
    if (!$termsAccepted || !$consentAccepted) {
        api_error(400, 'registration_consents_required', 'terms_accepted and consent_accepted are required');
    }

    $existingCredential = api_query(
        'SELECT credential_id
         FROM crewportglobal.user_credentials
         WHERE lower(login_email) = lower($1)
         LIMIT 1',
        [$email]
    );
    if (is_array(pg_fetch_assoc($existingCredential))) {
        api_error(409, 'credential_already_exists', 'An account with this email already has password credentials');
    }

    api_tx_begin();
    try {
        [$userId, $createdRole] = upsert_user_and_role([
            'role' => $role,
            'email' => $email,
            'full_name' => $body['full_name'] ?? null,
        ]);

        api_query(
            'INSERT INTO crewportglobal.user_auth_identities (user_id, provider, provider_subject, is_primary)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (user_id, provider)
             DO UPDATE SET
               provider_subject = EXCLUDED.provider_subject,
               is_primary = TRUE,
               updated_at = now()',
            [$userId, 'email', $email]
        );

        if ($createdRole === 'seafarer') {
            upsert_seafarer_profile($userId, $body, $email);
        } else {
            [$companyId, $vesselId] = upsert_company_context($userId, $createdRole, $body);
            upsert_vacancy_request($userId, $companyId, $vesselId, $body);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $credentialResult = api_query(
            'INSERT INTO crewportglobal.user_credentials (user_id, login_email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO NOTHING
             RETURNING credential_id',
            [$userId, $email, $passwordHash]
        );
        if (!is_array(pg_fetch_assoc($credentialResult))) {
            api_tx_rollback();
            api_error(409, 'credential_already_exists', 'An account with this email already has password credentials');
        }

        $session = cpg_auth_create_session($userId);
        $emailVerification = cpg_email_verification_create_and_send(
            $userId,
            $email,
            'password_registration'
        );

        write_audit_event('password_credential_registered', $userId, null, null, [
            'role' => $createdRole,
            'login_email' => $email,
            'session_created' => true,
            'email_verification_status' => $emailVerification['email_verification_status'] ?? 'pending',
            'email_delivery_status' => $emailVerification['email_delivery_status'] ?? 'not_configured',
        ], 'auth_password_session');

        $draft = build_draft_response($userId);
        api_tx_commit();

        api_json(201, [
            'ok' => true,
            'status' => 'password_credential_registered',
            'user' => cpg_auth_public_user_payload([
                'user_id' => $userId,
                'email' => $email,
                'display_name' => $body['full_name'] ?? null,
                'email_verified_at' => null,
                'email_verification_status' => $emailVerification['email_verification_status'] ?? 'pending',
                'registration_status' => $draft['status'] ?? 'draft',
            ], $createdRole),
            'session' => [
                'expires_at' => $session['expires_at'],
            ],
            'email_verification' => $emailVerification,
            'draft_id' => $draft['draft_id'],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'auth_register_password_failed', $error->getMessage());
    }
}

function handle_post_auth_login(): void {
    $body = api_decode_json_body();
    $email = api_normalize_email($body['email'] ?? null);
    $password = is_string($body['password'] ?? null) ? (string) $body['password'] : '';

    if ($email === null || $password === '') {
        api_error(401, 'invalid_login', 'Invalid email or password');
    }

    $result = api_query(
        'SELECT c.credential_id,
                c.user_id,
                c.password_hash,
                c.is_active AS credential_active,
                u.email,
                u.display_name,
                u.email_verified_at,
                u.email_verification_status,
                u.registration_status,
                u.is_active AS user_active
         FROM crewportglobal.user_credentials c
         JOIN crewportglobal.users u ON u.user_id = c.user_id
         WHERE lower(c.login_email) = lower($1)
         LIMIT 1',
        [$email]
    );
    $row = pg_fetch_assoc($result);
    $valid = is_array($row)
        && ($row['credential_active'] === 't' || $row['credential_active'] === true)
        && ($row['user_active'] === 't' || $row['user_active'] === true)
        && password_verify($password, (string) $row['password_hash']);

    if (!$valid) {
        if (is_array($row)) {
            api_query(
                'UPDATE crewportglobal.user_credentials
                 SET failed_login_attempts = failed_login_attempts + 1,
                     last_failed_login_at = now()
                 WHERE credential_id = $1',
                [(string) $row['credential_id']]
            );
        }
        api_error(401, 'invalid_login', 'Invalid email or password');
    }

    $userId = (string) $row['user_id'];
    $role = read_role_for_user($userId);
    if ($role === null) {
        api_error(403, 'account_role_missing', 'Account role is not configured');
    }

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.user_credentials
             SET failed_login_attempts = 0,
                 last_failed_login_at = NULL,
                 last_login_at = now()
             WHERE credential_id = $1',
            [(string) $row['credential_id']]
        );

        $session = cpg_auth_create_session($userId);
        write_audit_event('password_login_succeeded', $userId, null, null, [
            'login_email' => $email,
        ], 'auth_password_session');

        $draft = build_draft_response($userId);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'authenticated' => true,
            'user' => cpg_auth_public_user_payload($row, $role),
            'session' => [
                'expires_at' => $session['expires_at'],
            ],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'auth_login_failed', $error->getMessage());
    }
}

function handle_post_auth_logout(): void {
    $session = cpg_auth_find_active_session();
    if ($session !== null) {
        write_audit_event('password_session_logged_out', (string) $session['user_id'], null, null, [
            'session_id' => (string) $session['session_id'],
        ], 'auth_password_session');
    }

    cpg_auth_revoke_current_session();

    api_json(200, [
        'ok' => true,
        'authenticated' => false,
        'status' => 'logged_out',
    ]);
}

function handle_get_auth_me(): void {
    $session = cpg_auth_find_active_session();
    if ($session === null) {
        api_json(200, [
            'ok' => true,
            'authenticated' => false,
        ]);
    }

    $userId = (string) $session['user_id'];
    $role = read_role_for_user($userId);
    $draft = null;
    if ($role !== null) {
        $draft = build_draft_response($userId);
    }

    api_json(200, [
        'ok' => true,
        'authenticated' => true,
        'user' => cpg_auth_public_user_payload($session, $role),
        'session' => [
            'expires_at' => $session['expires_at'],
        ],
        'draft' => $draft,
    ]);
}

function handle_post_auth_email_send_verification(string $source): void {
    admin_access_load_runtime_env();
    $session = cpg_auth_find_active_session();
    if ($session === null) {
        api_error(401, 'authentication_required', 'Authentication is required');
    }

    $userId = (string) $session['user_id'];
    $status = cpg_email_verification_user_status($userId);
    if (($status['email_verified'] ?? false) === true) {
        api_json(200, [
            'ok' => true,
            'status' => 'email_already_verified',
            'email_verification' => $status,
        ]);
    }

    api_tx_begin();
    try {
        $emailVerification = cpg_email_verification_create_and_send(
            $userId,
            (string) $status['email'],
            $source
        );
        api_tx_commit();

        api_json(202, [
            'ok' => true,
            'status' => 'email_verification_pending',
            'email_verification' => $emailVerification,
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'email_verification_send_failed', $error->getMessage());
    }
}

function handle_post_auth_email_verify(): void {
    $body = api_decode_json_body();
    $token = isset($body['token']) && is_string($body['token']) ? trim($body['token']) : '';
    if ($token === '') {
        api_error(400, 'email_verification_token_required', 'verification token is required');
    }

    api_tx_begin();
    try {
        $result = cpg_email_verification_verify_token($token);
        $userRow = $result['user'];
        $userId = (string) $userRow['user_id'];
        $role = read_role_for_user($userId);
        $draft = $role === null ? null : build_draft_response($userId);
        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'status' => 'email_verified',
            'user' => cpg_auth_public_user_payload($userRow, $role),
            'email_verification' => $result['email_verification'],
            'draft' => $draft,
            'next_url' => '/cabinet/',
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'email_verification_failed', $error->getMessage());
    }
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

function read_latest_vacancy_for_company(string $companyId, ?string $userId = null): ?array {
    $result = api_query(
        'SELECT vacancy_request_id,
                company_id,
                vessel_id,
                created_by_user_id,
                vacancy_title,
                rank,
                department,
                vessel_type,
                join_date,
                contract_duration,
                salary_min_usd,
                salary_max_usd,
                salary_text,
                currency,
                employer_country_code,
                requirements,
                publication_status,
                created_at,
                updated_at
         FROM crewportglobal.vacancy_requests
         WHERE company_id = $1
           AND ($2::uuid IS NULL OR created_by_user_id = $2::uuid)
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1',
        [$companyId, $userId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function normalize_optional_text(mixed $value, int $maxLength = 2000): ?string {
    if (!is_string($value)) {
        return null;
    }

    $text = trim($value);
    if ($text === '') {
        return null;
    }

    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }

    return $text;
}

function normalize_country_code(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $countryCode = strtoupper(trim($value));
    return preg_match('/^[A-Z]{2}$/', $countryCode) ? $countryCode : null;
}

function normalize_date_value(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $date = trim($value);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;
}

function normalize_allowed_document_value(mixed $value, array $allowed): ?string {
    if (!is_string($value)) {
        return null;
    }

    $normalized = trim(strtolower($value));
    return in_array($normalized, $allowed, true) ? $normalized : null;
}

function normalize_text_fields(array $source, array $fields, int $maxLength = 240): array {
    $result = [];
    foreach ($fields as $field) {
        $value = normalize_optional_text($source[$field] ?? null, $maxLength);
        if ($value !== null) {
            $result[$field] = $value;
        }
    }
    return $result;
}

function normalize_date_fields(array $source, array $fields): array {
    $result = [];
    foreach ($fields as $field) {
        $value = normalize_date_value($source[$field] ?? null);
        if ($value !== null) {
            $result[$field] = $value;
        }
    }
    return $result;
}

function normalize_csv_text_list(mixed $value, int $maxItems = 12, int $maxItemLength = 160): array {
    if (!is_string($value) && !is_array($value)) {
        return [];
    }

    $items = [];
    $rawItems = is_array($value) ? $value : explode(',', $value);
    foreach ($rawItems as $item) {
        $clean = normalize_optional_text($item, $maxItemLength);
        if ($clean !== null) {
            $items[] = $clean;
        }
    }

    return array_slice(array_values(array_unique($items)), 0, $maxItems);
}

function normalize_seafarer_workspace_metadata(mixed $value): array {
    if (!is_array($value)) {
        return [];
    }

    $workspace = [];

    $personal = $value['personal_details'] ?? null;
    if (is_array($personal)) {
        $personalData = array_merge(
            normalize_text_fields($personal, ['place_of_birth', 'gender', 'civil_status'], 160),
            normalize_date_fields($personal, ['date_of_birth'])
        );
        if ($personalData !== []) {
            $workspace['personal_details'] = $personalData;
        }
    }

    $contact = $value['contact_and_addresses'] ?? null;
    if (is_array($contact)) {
        $contactData = array_merge(
            normalize_text_fields($contact, [
                'permanent_address',
                'residence_city',
                'nearest_airport',
                'emergency_contact_name',
                'emergency_contact_relation',
                'emergency_contact_phone',
            ], 500)
        );
        if ($contactData !== []) {
            $workspace['contact_and_addresses'] = $contactData;
        }
    }

    $qualification = $value['qualifications'] ?? null;
    if (is_array($qualification)) {
        $qualificationData = array_merge(
            normalize_text_fields($qualification, [
                'coc_type',
                'coc_number',
                'coc_issuing_country',
                'education_institution',
                'education_grade',
            ], 240),
            normalize_date_fields($qualification, ['coc_expiry'])
        );
        $trainingCourses = normalize_csv_text_list($qualification['training_courses'] ?? null, 20, 220);
        if ($trainingCourses !== []) {
            $qualificationData['training_courses'] = $trainingCourses;
        }
        if ($qualificationData !== []) {
            $workspace['qualifications'] = $qualificationData;
        }
    }

    $seaService = $value['sea_service'] ?? null;
    if (is_array($seaService)) {
        $seaServiceData = array_merge(
            normalize_text_fields($seaService, [
                'last_vessel_name',
                'last_vessel_type',
                'last_rank',
                'flag_country',
                'management_company',
                'engine_type',
                'deadweight',
            ], 240),
            normalize_date_fields($seaService, ['service_from', 'service_to'])
        );
        if ($seaServiceData !== []) {
            $workspace['sea_service'] = $seaServiceData;
        }
    }

    $publication = $value['matching_publication'] ?? null;
    if (is_array($publication)) {
        $publicationData = normalize_text_fields($publication, [
            'information_source',
            'candidate_summary',
            'publish_to_matching',
            'data_processing_confirmation',
        ], 1200);
        if ($publicationData !== []) {
            $workspace['matching_publication'] = $publicationData;
        }
    }

    return $workspace;
}

function normalize_seafarer_document_metadata(array $body): ?string {
    $rawMetadata = $body['document_metadata'] ?? null;
    if (!is_array($rawMetadata)) {
        return null;
    }

    $metadata = [];
    $certificateStatus = normalize_allowed_document_value(
        $rawMetadata['certificate_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $stcwStatus = normalize_allowed_document_value(
        $rawMetadata['stcw_status'] ?? null,
        ['unknown', 'collecting', 'ready', 'needs_update']
    );
    $visaStatus = normalize_allowed_document_value(
        $rawMetadata['visa_status'] ?? null,
        ['unknown', 'not_required', 'required', 'ready']
    );
    $passportExpiry = normalize_date_value($rawMetadata['passport_expiry'] ?? null);
    $medicalExpiry = normalize_date_value($rawMetadata['medical_expiry'] ?? null);
    $notes = normalize_optional_text($rawMetadata['notes'] ?? null, 1200);

    if ($certificateStatus !== null) {
        $metadata['certificate_status'] = $certificateStatus;
    }
    if ($stcwStatus !== null) {
        $metadata['stcw_status'] = $stcwStatus;
    }
    if ($passportExpiry !== null) {
        $metadata['passport_expiry'] = $passportExpiry;
    }
    if ($medicalExpiry !== null) {
        $metadata['medical_expiry'] = $medicalExpiry;
    }
    if ($visaStatus !== null) {
        $metadata['visa_status'] = $visaStatus;
    }
    if ($notes !== null) {
        $metadata['notes'] = $notes;
    }

    $workspace = normalize_seafarer_workspace_metadata($rawMetadata['seafarer_workspace'] ?? null);
    if ($workspace !== []) {
        $metadata['seafarer_workspace'] = $workspace;
    }

    if ($metadata === []) {
        return null;
    }

    $json = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? null : $json;
}

function cpg_seafarer_workspace_tables_ready(): bool {
    static $ready = null;
    if (is_bool($ready)) {
        return $ready;
    }

    $result = api_query(
        "SELECT count(*)::int AS table_count
         FROM information_schema.tables
         WHERE table_schema = 'crewportglobal'
           AND table_name IN (
             'seafarer_person_details',
             'seafarer_emergency_contacts',
             'seafarer_education_records',
             'seafarer_certificates',
             'seafarer_training_records',
             'seafarer_sea_service_records',
             'seafarer_medical_declarations',
             'seafarer_matching_preferences',
             'seafarer_publication_snapshots'
           )"
    );
    $row = pg_fetch_assoc($result);
    $ready = is_array($row) && (int) $row['table_count'] === 9;
    return $ready;
}

function cpg_decode_json_object(?string $json): array {
    if ($json === null || trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function cpg_workspace_section(array $workspace, string $key): array {
    $value = $workspace[$key] ?? null;
    return is_array($value) ? $value : [];
}

function cpg_workspace_text(array $source, string $key, int $maxLength = 500): ?string {
    return normalize_optional_text($source[$key] ?? null, $maxLength);
}

function cpg_workspace_date(array $source, string $key): ?string {
    return normalize_date_value($source[$key] ?? null);
}

function cpg_workspace_country_code(array $source, string $key): ?string {
    return normalize_country_code($source[$key] ?? null);
}

function cpg_workspace_number(mixed $value): ?float {
    if (!is_numeric($value)) {
        return null;
    }
    $number = (float) $value;
    return $number >= 0 ? $number : null;
}

function cpg_workspace_reference_value_id(?string $catalogCode, ?string $label): ?string {
    if ($catalogCode === null || $label === null || trim($label) === '') {
        return null;
    }

    $result = api_query(
        "SELECT rv.reference_value_id
         FROM crewportglobal.reference_catalog_values rv
         JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
         WHERE rc.catalog_code = $1
           AND rc.is_active = TRUE
           AND rc.publication_state = 'published'
           AND rv.is_active = TRUE
           AND rv.publication_state = 'published'
           AND (
             lower(rv.display_name) = lower($2)
             OR lower(rv.source_value) = lower($2)
             OR lower(rv.value_code) = lower($2)
           )
         ORDER BY rv.sort_order ASC, rv.display_name ASC
         LIMIT 1",
        [$catalogCode, $label]
    );
    $row = pg_fetch_assoc($result);
    return is_array($row) ? (string) $row['reference_value_id'] : null;
}

function cpg_workspace_json(array $payload): string {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? '{}' : $json;
}

function cpg_pg_text_array_literal(array $items): string {
    $quoted = [];
    foreach ($items as $item) {
        if (!is_string($item)) {
            continue;
        }
        $quoted[] = '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $item) . '"';
    }
    return '{' . implode(',', $quoted) . '}';
}

function cpg_sync_seafarer_workspace_from_metadata(string $userId, ?string $documentMetadataJson, array $flatProfile): void {
    if (!cpg_seafarer_workspace_tables_ready()) {
        return;
    }

    $metadata = cpg_decode_json_object($documentMetadataJson);
    $workspace = isset($metadata['seafarer_workspace']) && is_array($metadata['seafarer_workspace'])
        ? $metadata['seafarer_workspace']
        : [];
    if ($workspace === []) {
        return;
    }

    $profileResult = api_query(
        'SELECT seafarer_profile_id
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    $profileRow = pg_fetch_assoc($profileResult);
    if (!is_array($profileRow)) {
        return;
    }

    $profileId = (string) $profileRow['seafarer_profile_id'];
    $draftId = $userId;
    $personal = cpg_workspace_section($workspace, 'personal_details');
    $contact = cpg_workspace_section($workspace, 'contact_and_addresses');
    $qualifications = cpg_workspace_section($workspace, 'qualifications');
    $seaService = cpg_workspace_section($workspace, 'sea_service');
    $publication = cpg_workspace_section($workspace, 'matching_publication');

    if ($personal !== [] || $contact !== [] || isset($flatProfile['nationality_code']) || isset($flatProfile['residence_country_code'])) {
        $genderLabel = cpg_workspace_text($personal, 'gender', 160);
        $civilStatusLabel = cpg_workspace_text($personal, 'civil_status', 160);
        $residenceCityLabel = cpg_workspace_text($contact, 'residence_city', 240);
        $nearestAirportLabel = cpg_workspace_text($contact, 'nearest_airport', 240);
        $nationalityCode = normalize_country_code($flatProfile['nationality_code'] ?? null);
        $residenceCountryCode = normalize_country_code($flatProfile['residence_country_code'] ?? null);

        api_query(
            'INSERT INTO crewportglobal.seafarer_person_details (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               date_of_birth,
               place_of_birth,
               gender_value_id,
               gender_label,
               civil_status_value_id,
               civil_status_label,
               nationality_code,
               residence_country_code,
               residence_city_value_id,
               residence_city_label,
               permanent_address,
               nearest_airport_value_id,
               nearest_airport_label,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::date, $5, $6::uuid, $7, $8::uuid, $9, $10, $11,
               $12::uuid, $13, $14, $15::uuid, $16, $17, $18, $19::jsonb
             )
             ON CONFLICT (seafarer_profile_id)
             DO UPDATE SET
               source_draft_id = EXCLUDED.source_draft_id,
               date_of_birth = EXCLUDED.date_of_birth,
               place_of_birth = EXCLUDED.place_of_birth,
               gender_value_id = EXCLUDED.gender_value_id,
               gender_label = EXCLUDED.gender_label,
               civil_status_value_id = EXCLUDED.civil_status_value_id,
               civil_status_label = EXCLUDED.civil_status_label,
               nationality_code = COALESCE(EXCLUDED.nationality_code, crewportglobal.seafarer_person_details.nationality_code),
               residence_country_code = COALESCE(EXCLUDED.residence_country_code, crewportglobal.seafarer_person_details.residence_country_code),
               residence_city_value_id = EXCLUDED.residence_city_value_id,
               residence_city_label = EXCLUDED.residence_city_label,
               permanent_address = EXCLUDED.permanent_address,
               nearest_airport_value_id = EXCLUDED.nearest_airport_value_id,
               nearest_airport_label = EXCLUDED.nearest_airport_label,
               record_state = EXCLUDED.record_state,
               review_status = EXCLUDED.review_status,
               metadata = EXCLUDED.metadata,
               updated_at = now()',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_date($personal, 'date_of_birth'),
                cpg_workspace_text($personal, 'place_of_birth', 160),
                cpg_workspace_reference_value_id('gender_values', $genderLabel),
                $genderLabel,
                cpg_workspace_reference_value_id('civil_status_values', $civilStatusLabel),
                $civilStatusLabel,
                $nationalityCode,
                $residenceCountryCode,
                cpg_workspace_reference_value_id('cities', $residenceCityLabel),
                $residenceCityLabel,
                cpg_workspace_text($contact, 'permanent_address', 500),
                cpg_workspace_reference_value_id('airports', $nearestAirportLabel),
                $nearestAirportLabel,
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_person_details']),
            ]
        );
    }

    $emergencyName = cpg_workspace_text($contact, 'emergency_contact_name', 240);
    if ($emergencyName !== null) {
        $relationLabel = cpg_workspace_text($contact, 'emergency_contact_relation', 160);
        api_query(
            'INSERT INTO crewportglobal.seafarer_emergency_contacts (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               contact_name,
               relation_value_id,
               relation_label,
               contact_phone,
               is_primary,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7, TRUE, $8, $9, $10::jsonb
             )
             ON CONFLICT (seafarer_profile_id) WHERE is_primary
             DO UPDATE SET
               source_draft_id = EXCLUDED.source_draft_id,
               contact_name = EXCLUDED.contact_name,
               relation_value_id = EXCLUDED.relation_value_id,
               relation_label = EXCLUDED.relation_label,
               contact_phone = EXCLUDED.contact_phone,
               record_state = EXCLUDED.record_state,
               review_status = EXCLUDED.review_status,
               metadata = EXCLUDED.metadata,
               updated_at = now()',
            [
                $profileId,
                $userId,
                $draftId,
                $emergencyName,
                cpg_workspace_reference_value_id('relation_types', $relationLabel),
                $relationLabel,
                cpg_workspace_text($contact, 'emergency_contact_phone', 160),
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_primary_emergency_contact']),
            ]
        );
    }

    $educationHasData = array_filter([
        cpg_workspace_text($qualifications, 'education_institution', 240),
        cpg_workspace_text($qualifications, 'education_grade', 160),
    ]) !== [];
    api_query(
        "DELETE FROM crewportglobal.seafarer_education_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_primary_education'",
        [$profileId]
    );
    if ($educationHasData) {
        $institutionLabel = cpg_workspace_text($qualifications, 'education_institution', 240);
        $gradeLabel = cpg_workspace_text($qualifications, 'education_grade', 160);
        api_query(
            'INSERT INTO crewportglobal.seafarer_education_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               institution_value_id,
               institution_name,
               grade_value_id,
               grade_label,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::uuid, $5, $6::uuid, $7, $8, $9, $10::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_reference_value_id('education_institutions', $institutionLabel),
                $institutionLabel,
                cpg_workspace_reference_value_id('education_grades', $gradeLabel),
                $gradeLabel,
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_primary_education']),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_certificates
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_primary_coc'",
        [$profileId]
    );
    $cocTypeLabel = cpg_workspace_text($qualifications, 'coc_type', 240);
    $cocNumber = cpg_workspace_text($qualifications, 'coc_number', 160);
    $cocCountryCode = cpg_workspace_country_code($qualifications, 'coc_issuing_country');
    if ($cocTypeLabel !== null || $cocNumber !== null || $cocCountryCode !== null || cpg_workspace_date($qualifications, 'coc_expiry') !== null) {
        api_query(
            'INSERT INTO crewportglobal.seafarer_certificates (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               certificate_group,
               certificate_type_value_id,
               certificate_type_label,
               certificate_number,
               issuing_country_code,
               expires_at,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7, $8, $9::date, $10, $11, $12::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                'competency',
                cpg_workspace_reference_value_id('certificate_of_competence_types', $cocTypeLabel),
                $cocTypeLabel,
                $cocNumber,
                $cocCountryCode,
                cpg_workspace_date($qualifications, 'coc_expiry'),
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_primary_coc']),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_training_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_training_course'",
        [$profileId]
    );
    $trainingCourses = normalize_csv_text_list($qualifications['training_courses'] ?? null, 20, 220);
    foreach ($trainingCourses as $courseLabel) {
        api_query(
            'INSERT INTO crewportglobal.seafarer_training_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               training_type_value_id,
               training_type_label,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4::uuid, $5, $6, $7, $8::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                cpg_workspace_reference_value_id('training_course_types', $courseLabel),
                $courseLabel,
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_training_course']),
            ]
        );
    }

    api_query(
        "DELETE FROM crewportglobal.seafarer_sea_service_records
         WHERE seafarer_profile_id = $1
           AND metadata->>'source_key' = 'workspace_latest_sea_service'",
        [$profileId]
    );
    $lastVesselName = cpg_workspace_text($seaService, 'last_vessel_name', 240);
    $lastVesselTypeLabel = cpg_workspace_text($seaService, 'last_vessel_type', 240);
    $lastRankLabel = cpg_workspace_text($seaService, 'last_rank', 240);
    $flagCountryCode = cpg_workspace_country_code($seaService, 'flag_country');
    if (array_filter([$lastVesselName, $lastVesselTypeLabel, $lastRankLabel, $flagCountryCode, cpg_workspace_date($seaService, 'service_from'), cpg_workspace_date($seaService, 'service_to')]) !== []) {
        api_query(
            'INSERT INTO crewportglobal.seafarer_sea_service_records (
               seafarer_profile_id,
               user_id,
               source_draft_id,
               vessel_name,
               vessel_type_value_id,
               vessel_type_label,
               rank_value_id,
               rank_label,
               department,
               flag_country_code,
               service_from,
               service_to,
               management_company,
               engine_type,
               deadweight,
               record_state,
               review_status,
               metadata
             ) VALUES (
               $1, $2, $3::uuid, $4, $5::uuid, $6, $7::uuid, $8, $9, $10,
               $11::date, $12::date, $13, $14, $15, $16, $17, $18::jsonb
             )',
            [
                $profileId,
                $userId,
                $draftId,
                $lastVesselName,
                cpg_workspace_reference_value_id('vessel_types', $lastVesselTypeLabel),
                $lastVesselTypeLabel,
                cpg_workspace_reference_value_id('seafarer_positions', $lastRankLabel),
                $lastRankLabel,
                normalize_optional_text($flatProfile['department'] ?? null, 40),
                $flagCountryCode,
                cpg_workspace_date($seaService, 'service_from'),
                cpg_workspace_date($seaService, 'service_to'),
                cpg_workspace_text($seaService, 'management_company', 240),
                cpg_workspace_text($seaService, 'engine_type', 160),
                cpg_workspace_text($seaService, 'deadweight', 160),
                'submitted',
                'pending_human_review',
                cpg_workspace_json(['source_key' => 'workspace_latest_sea_service']),
            ]
        );
    }

    $preferredVesselTypeLabels = [];
    if (isset($flatProfile['preferred_vessel_types']) && is_array($flatProfile['preferred_vessel_types'])) {
        foreach ($flatProfile['preferred_vessel_types'] as $label) {
            $clean = normalize_optional_text($label, 160);
            if ($clean !== null) {
                $preferredVesselTypeLabels[] = $clean;
            }
        }
    }
    $preferredVesselTypeLabels = array_values(array_unique($preferredVesselTypeLabels));
    $preferredVesselTypeValues = array_map(
        fn (string $label): array => [
            'label' => $label,
            'reference_value_id' => cpg_workspace_reference_value_id('vessel_types', $label),
        ],
        $preferredVesselTypeLabels
    );
    $informationSourceLabel = cpg_workspace_text($publication, 'information_source', 240);
    $publishToMatching = cpg_workspace_text($publication, 'publish_to_matching', 20) ?? 'unknown';
    if (!in_array($publishToMatching, ['unknown', 'yes', 'no'], true)) {
        $publishToMatching = 'unknown';
    }
    $dataProcessingConfirmation = cpg_workspace_text($publication, 'data_processing_confirmation', 40) ?? 'not_confirmed';
    if (!in_array($dataProcessingConfirmation, ['not_confirmed', 'i_confirm', 'i_decline'], true)) {
        $dataProcessingConfirmation = 'not_confirmed';
    }

    api_query(
        'INSERT INTO crewportglobal.seafarer_matching_preferences (
           seafarer_profile_id,
           user_id,
           source_draft_id,
           preferred_vessel_type_values,
           preferred_vessel_type_labels,
           expected_compensation_usd,
           availability_date,
           availability_status,
           candidate_summary,
           information_source_value_id,
           information_source_label,
           publish_to_matching,
           data_processing_confirmation,
           record_state,
           review_status,
           metadata
         ) VALUES (
           $1, $2, $3::uuid, $4::jsonb, $5::text[], $6, $7::date, $8, $9, $10::uuid,
           $11, $12, $13, $14, $15, $16::jsonb
         )
         ON CONFLICT (seafarer_profile_id)
         DO UPDATE SET
           source_draft_id = EXCLUDED.source_draft_id,
           preferred_vessel_type_values = EXCLUDED.preferred_vessel_type_values,
           preferred_vessel_type_labels = EXCLUDED.preferred_vessel_type_labels,
           expected_compensation_usd = EXCLUDED.expected_compensation_usd,
           availability_date = EXCLUDED.availability_date,
           availability_status = EXCLUDED.availability_status,
           candidate_summary = EXCLUDED.candidate_summary,
           information_source_value_id = EXCLUDED.information_source_value_id,
           information_source_label = EXCLUDED.information_source_label,
           publish_to_matching = EXCLUDED.publish_to_matching,
           data_processing_confirmation = EXCLUDED.data_processing_confirmation,
           record_state = EXCLUDED.record_state,
           review_status = EXCLUDED.review_status,
           metadata = EXCLUDED.metadata,
           updated_at = now()',
        [
            $profileId,
            $userId,
            $draftId,
            cpg_workspace_json($preferredVesselTypeValues),
            cpg_pg_text_array_literal($preferredVesselTypeLabels),
            cpg_workspace_number($flatProfile['salary_expectation_usd'] ?? null),
            normalize_date_value($flatProfile['availability_date'] ?? null),
            in_array(($flatProfile['availability_status'] ?? 'unknown'), ['unknown', 'available_now', 'available_later'], true)
                ? (string) ($flatProfile['availability_status'] ?? 'unknown')
                : 'unknown',
            cpg_workspace_text($publication, 'candidate_summary', 1200),
            cpg_workspace_reference_value_id('information_source_values', $informationSourceLabel),
            $informationSourceLabel,
            $publishToMatching,
            $dataProcessingConfirmation,
            'submitted',
            'pending_human_review',
            cpg_workspace_json(['source_key' => 'workspace_matching_preferences']),
        ]
    );
}

function cpg_fetch_one_assoc(string $sql, array $params): ?array {
    $result = api_query($sql, $params);
    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function cpg_fetch_all_assoc(string $sql, array $params): array {
    $result = api_query($sql, $params);
    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = $row;
    }
    return $items;
}

function cpg_read_seafarer_workspace_summary(string $userId): array {
    if (!cpg_seafarer_workspace_tables_ready()) {
        return [
            'schema_ready' => false,
            'message' => 'Structured seafarer workspace tables are not available yet.',
        ];
    }

    $profile = cpg_fetch_one_assoc(
        'SELECT seafarer_profile_id, user_id, first_name, primary_rank, department, review_status, document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    if ($profile === null) {
        return [
            'schema_ready' => true,
            'has_profile' => false,
        ];
    }

    $profileId = (string) $profile['seafarer_profile_id'];
    return [
        'schema_ready' => true,
        'has_profile' => true,
        'profile_id' => $profileId,
        'person_details' => cpg_fetch_one_assoc(
            'SELECT date_of_birth, place_of_birth, gender_label, civil_status_label,
                    nationality_code, residence_country_code, residence_city_label,
                    permanent_address, nearest_airport_label, review_status, updated_at
             FROM crewportglobal.seafarer_person_details
             WHERE seafarer_profile_id = $1
             LIMIT 1',
            [$profileId]
        ),
        'emergency_contacts' => cpg_fetch_all_assoc(
            'SELECT contact_name, relation_label, contact_phone, is_primary, review_status, updated_at
             FROM crewportglobal.seafarer_emergency_contacts
             WHERE seafarer_profile_id = $1
             ORDER BY is_primary DESC, updated_at DESC',
            [$profileId]
        ),
        'education_records' => cpg_fetch_all_assoc(
            'SELECT institution_name, grade_label, field_of_study, country_code, completion_date, review_status, updated_at
             FROM crewportglobal.seafarer_education_records
             WHERE seafarer_profile_id = $1
             ORDER BY completion_date DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'certificates' => cpg_fetch_all_assoc(
            'SELECT certificate_group, certificate_type_label, certificate_number, issuing_country_code, expires_at, review_status, updated_at
             FROM crewportglobal.seafarer_certificates
             WHERE seafarer_profile_id = $1
             ORDER BY certificate_group ASC, expires_at DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'training_records' => cpg_fetch_all_assoc(
            'SELECT training_type_label, certificate_number, issuing_center, expires_at, review_status, updated_at
             FROM crewportglobal.seafarer_training_records
             WHERE seafarer_profile_id = $1
             ORDER BY expires_at DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'sea_service_records' => cpg_fetch_all_assoc(
            'SELECT vessel_name, vessel_type_label, rank_label, department, flag_country_code,
                    service_from, service_to, management_company, engine_type, deadweight, review_status, updated_at
             FROM crewportglobal.seafarer_sea_service_records
             WHERE seafarer_profile_id = $1
             ORDER BY service_to DESC NULLS LAST, service_from DESC NULLS LAST, updated_at DESC',
            [$profileId]
        ),
        'medical_declarations' => cpg_fetch_all_assoc(
            'SELECT declaration_scope, medical_certificate_expires_at, fitness_status, consent_status, review_status, updated_at
             FROM crewportglobal.seafarer_medical_declarations
             WHERE seafarer_profile_id = $1
             ORDER BY updated_at DESC',
            [$profileId]
        ),
        'matching_preferences' => cpg_fetch_one_assoc(
            'SELECT preferred_vessel_type_values, preferred_vessel_type_labels, expected_compensation_usd,
                    availability_date, availability_status, candidate_summary, information_source_label,
                    publish_to_matching, data_processing_confirmation, review_status, updated_at
             FROM crewportglobal.seafarer_matching_preferences
             WHERE seafarer_profile_id = $1
             LIMIT 1',
            [$profileId]
        ),
    ];
}

function cpg_seafarer_workspace_allowed_sections(): array {
    return [
        'personal_details',
        'contact_and_addresses',
        'qualifications',
        'sea_service',
        'matching_publication',
    ];
}

function cpg_normalize_seafarer_workspace_section(string $section, mixed $payload): array {
    if (!in_array($section, cpg_seafarer_workspace_allowed_sections(), true) || !is_array($payload)) {
        return [];
    }

    $normalized = normalize_seafarer_workspace_metadata([$section => $payload]);
    return isset($normalized[$section]) && is_array($normalized[$section]) ? $normalized[$section] : [];
}

function cpg_decode_json_array_field(mixed $value): array {
    if (is_array($value)) {
        return $value;
    }
    if (!is_string($value) || trim($value) === '') {
        return [];
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function cpg_seafarer_profile_sync_context(string $userId): array {
    $result = api_query(
        'SELECT department,
                nationality_code,
                residence_country_code,
                availability_status,
                availability_date,
                preferred_vessel_types,
                salary_expectation_usd,
                document_metadata
         FROM crewportglobal.seafarer_profiles
         WHERE user_id = $1
         LIMIT 1',
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    return [
        'department' => $row['department'] ?? null,
        'nationality_code' => $row['nationality_code'] ?? null,
        'residence_country_code' => $row['residence_country_code'] ?? null,
        'availability_status' => $row['availability_status'] ?? 'unknown',
        'availability_date' => $row['availability_date'] ?? null,
        'preferred_vessel_types' => cpg_decode_json_array_field($row['preferred_vessel_types'] ?? null),
        'salary_expectation_usd' => $row['salary_expectation_usd'] ?? null,
        'document_metadata' => $row['document_metadata'] ?? null,
    ];
}

function cpg_resolve_seafarer_workspace_user(array $body = []): array {
    $session = cpg_auth_find_active_session();
    $userId = null;
    $accessModel = 'none';

    if ($session !== null) {
        $userId = (string) $session['user_id'];
        $accessModel = 'authenticated_session';
    } else {
        $draftId = '';
        if (isset($body['draft_id']) && is_string($body['draft_id'])) {
            $draftId = $body['draft_id'];
        } elseif (isset($_GET['draft_id']) && is_string($_GET['draft_id'])) {
            $draftId = $_GET['draft_id'];
        }
        $userId = api_normalize_uuid($draftId);
        if ($userId !== null) {
            $accessModel = 'draft_id_transition';
        }
    }

    if ($userId === null) {
        api_error(401, 'seafarer_workspace_access_required', 'Authenticated session or draft_id is required');
    }

    $role = read_role_for_user($userId);
    if ($role !== 'seafarer') {
        api_error(403, 'seafarer_workspace_not_available', 'Seafarer workspace is available only for seafarer profiles');
    }

    return [$userId, $accessModel];
}

function normalize_department_value(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $department = trim(strtolower($value));
    return in_array($department, ['deck', 'engine', 'catering', 'hotel', 'other'], true) ? $department : null;
}

function normalize_currency_value(mixed $value): string {
    if (!is_string($value)) {
        return 'USD';
    }

    $currency = strtoupper(trim($value));
    return preg_match('/^[A-Z]{3}$/', $currency) ? $currency : 'USD';
}

function normalize_money_value(mixed $value): ?float {
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $amount = (float) $value;
    return $amount >= 0 ? $amount : null;
}

function normalize_vacancy_payload(array $body): ?array {
    $vacancyBody = $body['vacancy'] ?? null;
    if (!is_array($vacancyBody)) {
        return null;
    }

    $vesselBody = $body['vessel'] ?? [];
    if (!is_array($vesselBody)) {
        $vesselBody = [];
    }

    $title = normalize_optional_text($vacancyBody['vacancy_title'] ?? $vacancyBody['title'] ?? null, 240);
    $rank = normalize_optional_text($vacancyBody['rank'] ?? null, 160);
    if ($rank === null) {
        $rank = $title;
    }

    $department = normalize_department_value($vacancyBody['department'] ?? null);
    $vesselType = normalize_optional_text($vacancyBody['vessel_type'] ?? $vesselBody['vessel_type'] ?? null, 160);
    $joinDate = normalize_date_value($vacancyBody['join_date'] ?? null);
    $contractDuration = normalize_optional_text($vacancyBody['contract_duration'] ?? $vacancyBody['duration'] ?? null, 160);
    $salaryMinUsd = normalize_money_value($vacancyBody['salary_min_usd'] ?? null);
    $salaryMaxUsd = normalize_money_value($vacancyBody['salary_max_usd'] ?? null);

    if ($salaryMinUsd !== null && $salaryMaxUsd !== null && $salaryMaxUsd < $salaryMinUsd) {
        api_error(400, 'invalid_salary_range', 'salary_max_usd must be greater than or equal to salary_min_usd');
    }

    $salaryText = normalize_optional_text($vacancyBody['salary_text'] ?? null, 160);
    $currency = normalize_currency_value($vacancyBody['currency'] ?? null);
    $employerCountryCode = normalize_country_code($vacancyBody['employer_country_code'] ?? $body['country_code'] ?? null);
    $requirements = normalize_optional_text($vacancyBody['requirements'] ?? null, 4000);

    $meaningfulValues = [
        $title,
        $rank,
        $department,
        $vesselType,
        $joinDate,
        $contractDuration,
        $salaryMinUsd,
        $salaryMaxUsd,
        $salaryText,
        $requirements,
    ];

    $hasMeaningfulVacancyData = false;
    foreach ($meaningfulValues as $value) {
        if ($value !== null && $value !== '') {
            $hasMeaningfulVacancyData = true;
            break;
        }
    }

    if (!$hasMeaningfulVacancyData) {
        return null;
    }

    return [
        'vacancy_title' => $title,
        'rank' => $rank,
        'department' => $department,
        'vessel_type' => $vesselType,
        'join_date' => $joinDate,
        'contract_duration' => $contractDuration,
        'salary_min_usd' => $salaryMinUsd,
        'salary_max_usd' => $salaryMaxUsd,
        'salary_text' => $salaryText,
        'currency' => $currency,
        'employer_country_code' => $employerCountryCode,
        'requirements' => $requirements,
    ];
}

function upsert_vacancy_request(string $userId, string $companyId, ?string $vesselId, array $body): ?string {
    $vacancy = normalize_vacancy_payload($body);
    if ($vacancy === null) {
        return null;
    }

    if ($vesselId === null) {
        $latestVessel = read_latest_vessel_for_company($companyId);
        if ($latestVessel !== null && isset($latestVessel['vessel_id'])) {
            $vesselId = (string) $latestVessel['vessel_id'];
        }
    }

    $existing = read_latest_vacancy_for_company($companyId, $userId);
    if ($existing !== null && isset($existing['vacancy_request_id'])) {
        $vacancyRequestId = (string) $existing['vacancy_request_id'];
        $result = api_query(
            'UPDATE crewportglobal.vacancy_requests
             SET vessel_id = COALESCE($2::uuid, vessel_id),
                 vacancy_title = COALESCE($3, vacancy_title),
                 rank = COALESCE($4, rank),
                 department = COALESCE($5, department),
                 vessel_type = COALESCE($6, vessel_type),
                 join_date = COALESCE($7::date, join_date),
                 contract_duration = COALESCE($8, contract_duration),
                 salary_min_usd = COALESCE($9, salary_min_usd),
                 salary_max_usd = COALESCE($10, salary_max_usd),
                 salary_text = COALESCE($11, salary_text),
                 currency = COALESCE($12, currency),
                 employer_country_code = COALESCE($13, employer_country_code),
                 requirements = COALESCE($14, requirements),
                 publication_status = $15,
                 updated_at = now()
             WHERE vacancy_request_id = $1
             RETURNING vacancy_request_id',
            [
                $vacancyRequestId,
                $vesselId,
                $vacancy['vacancy_title'],
                $vacancy['rank'],
                $vacancy['department'],
                $vacancy['vessel_type'],
                $vacancy['join_date'],
                $vacancy['contract_duration'],
                $vacancy['salary_min_usd'],
                $vacancy['salary_max_usd'],
                $vacancy['salary_text'],
                $vacancy['currency'],
                $vacancy['employer_country_code'],
                $vacancy['requirements'],
                'submitted_for_human_review',
            ]
        );

        $row = pg_fetch_assoc($result);
        return is_array($row) ? (string) $row['vacancy_request_id'] : null;
    }

    $result = api_query(
        'INSERT INTO crewportglobal.vacancy_requests (
           company_id,
           vessel_id,
           created_by_user_id,
           vacancy_title,
           rank,
           department,
           vessel_type,
           join_date,
           contract_duration,
           salary_min_usd,
           salary_max_usd,
           salary_text,
           currency,
           employer_country_code,
           requirements,
           publication_status
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8::date,
           $9,
           $10,
           $11,
           $12,
           $13,
           $14,
           $15,
           $16
         )
         RETURNING vacancy_request_id',
        [
            $companyId,
            $vesselId,
            $userId,
            $vacancy['vacancy_title'],
            $vacancy['rank'],
            $vacancy['department'],
            $vacancy['vessel_type'],
            $vacancy['join_date'],
            $vacancy['contract_duration'],
            $vacancy['salary_min_usd'],
            $vacancy['salary_max_usd'],
            $vacancy['salary_text'],
            $vacancy['currency'],
            $vacancy['employer_country_code'],
            $vacancy['requirements'],
            'submitted_for_human_review',
        ]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? (string) $row['vacancy_request_id'] : null;
}

function public_vacancy_select_clause(bool $includeInternalIds = false): string {
    $internalColumns = $includeInternalIds ? ',
            vr.company_id,
            vr.vessel_id' : '';

    return "SELECT
            vr.vacancy_request_id,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            COALESCE(vr.vessel_type, v.vessel_type) AS vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            COALESCE(vr.employer_country_code, ec.country_code) AS employer_country_code,
            vr.requirements,
            vr.publication_status,
            vr.created_at,
            vr.updated_at,
            ec.company_name,
            ec.company_type,
            ec.verification_status,
            v.vessel_name,
            v.imo_number{$internalColumns}
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id";
}

function map_public_vacancy_row(array $row): array {
    return [
        'vacancy_request_id' => $row['vacancy_request_id'],
        'vacancy_title' => $row['vacancy_title'],
        'rank' => $row['rank'],
        'department' => $row['department'],
        'vessel_type' => $row['vessel_type'],
        'join_date' => $row['join_date'],
        'contract_duration' => $row['contract_duration'],
        'salary_min_usd' => $row['salary_min_usd'],
        'salary_max_usd' => $row['salary_max_usd'],
        'salary_text' => $row['salary_text'],
        'currency' => $row['currency'],
        'employer_country_code' => $row['employer_country_code'],
        'requirements' => $row['requirements'],
        'publication_status' => $row['publication_status'],
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'],
        'company_name' => $row['company_name'],
        'company_type' => $row['company_type'],
        'verification_status' => $row['verification_status'],
        'vessel_name' => $row['vessel_name'],
        'imo_number' => $row['imo_number'],
    ];
}

function read_public_vacancies(): array {
    $result = api_query(
        public_vacancy_select_clause() .
        " WHERE vr.publication_status = 'published'
           AND ec.verification_status = 'verified'
         ORDER BY COALESCE(vr.join_date, CURRENT_DATE + INTERVAL '100 years') ASC,
                  vr.updated_at DESC
         LIMIT 200"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = map_public_vacancy_row($row);
    }

    return $items;
}

function read_public_vacancy_row(string $vacancyId, bool $includeInternalIds = false): ?array {
    $result = api_query(
        public_vacancy_select_clause($includeInternalIds) .
        " WHERE vr.vacancy_request_id = $1
           AND vr.publication_status = 'published'
           AND ec.verification_status = 'verified'
         LIMIT 1",
        [$vacancyId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function read_public_vacancy(string $vacancyId): ?array {
    $row = read_public_vacancy_row($vacancyId);
    return $row === null ? null : map_public_vacancy_row($row);
}

function handle_get_public_vacancies(): void {
    $vacancies = read_public_vacancies();
    api_json(200, [
        'ok' => true,
        'vacancies' => $vacancies,
        'count' => count($vacancies),
        'generated_at' => gmdate('c'),
    ]);
}

function handle_get_public_vacancy(string $vacancyId): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $vacancy = read_public_vacancy($uuid);
    if ($vacancy === null) {
        api_error(404, 'vacancy_not_found', 'Reviewed public vacancy not found');
    }

    api_json(200, [
        'ok' => true,
        'vacancy' => $vacancy,
        'generated_at' => gmdate('c'),
    ]);
}

function read_seafarer_application_candidate(string $userId): ?array {
    $result = api_query(
        "SELECT
            u.user_id,
            u.email,
            u.display_name,
            sp.review_status,
            sp.primary_rank,
            sp.availability_status
         FROM crewportglobal.users u
         JOIN crewportglobal.user_roles ur ON ur.user_id = u.user_id AND ur.role = 'seafarer'
         JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = u.user_id
         WHERE u.user_id = $1
         LIMIT 1",
        [$userId]
    );

    $row = pg_fetch_assoc($result);
    return is_array($row) ? $row : null;
}

function handle_create_vacancy_application(string $vacancyId): void {
    $uuid = api_normalize_uuid($vacancyId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_request_id', 'vacancy_request_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $seafarerDraftId = api_normalize_uuid($body['seafarer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($seafarerDraftId === null) {
        api_error(400, 'invalid_seafarer_draft_id', 'seafarer_draft_id must be a valid UUID');
    }

    $email = api_normalize_email($body['email'] ?? null);
    if ($email === null) {
        api_error(400, 'invalid_email', 'email is required and must be valid');
    }

    $candidateNote = normalize_optional_text($body['candidate_note'] ?? $body['note'] ?? null, 1200);
    $vacancyRow = read_public_vacancy_row($uuid, true);
    if ($vacancyRow === null) {
        api_error(404, 'vacancy_not_found', 'Reviewed public vacancy not found');
    }

    $candidate = read_seafarer_application_candidate($seafarerDraftId);
    if ($candidate === null) {
        api_error(404, 'seafarer_profile_not_found', 'Seafarer profile not found');
    }

    if (mb_strtolower((string) $candidate['email']) !== $email) {
        api_error(400, 'email_does_not_match_profile', 'email must match the seafarer profile email');
    }

    if (($candidate['review_status'] ?? '') === 'rejected') {
        api_error(400, 'seafarer_profile_not_ready', 'Rejected seafarer profiles cannot apply to vacancies');
    }

    api_tx_begin();
    try {
        $insertResult = api_query(
            "INSERT INTO crewportglobal.vacancy_applications (
                vacancy_request_id,
                seafarer_user_id,
                contact_email,
                candidate_note,
                application_status
             ) VALUES ($1, $2, $3, $4, 'submitted_for_human_review')
             ON CONFLICT (vacancy_request_id, seafarer_user_id)
             DO UPDATE SET
               contact_email = EXCLUDED.contact_email,
               candidate_note = EXCLUDED.candidate_note,
               application_status = CASE
                 WHEN crewportglobal.vacancy_applications.application_status IN ('withdrawn', 'rejected')
                   THEN 'submitted_for_human_review'
                 ELSE crewportglobal.vacancy_applications.application_status
               END,
               updated_at = now()
             RETURNING vacancy_application_id, application_status, created_at, updated_at",
            [$uuid, $seafarerDraftId, $email, $candidateNote]
        );
        $applicationRow = pg_fetch_assoc($insertResult);
        if (!is_array($applicationRow)) {
            api_tx_rollback();
            api_error(500, 'vacancy_application_failed', 'Unable to create vacancy application');
        }

        $companyId = isset($vacancyRow['company_id']) ? (string) $vacancyRow['company_id'] : null;
        $vesselId = isset($vacancyRow['vessel_id']) ? (string) $vacancyRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('vacancy_application_submitted', $seafarerDraftId, $companyId, $vesselId, [
            'vacancy_request_id' => $uuid,
            'vacancy_application_id' => $applicationRow['vacancy_application_id'],
            'application_status' => $applicationRow['application_status'],
            'candidate_review_status' => $candidate['review_status'],
            'candidate_rank' => $candidate['primary_rank'],
        ], 'vacancy_detail_public');

        api_tx_commit();

        api_json(201, [
            'ok' => true,
            'vacancy_request_id' => $uuid,
            'application' => [
                'vacancy_application_id' => $applicationRow['vacancy_application_id'],
                'application_status' => $applicationRow['application_status'],
                'created_at' => $applicationRow['created_at'],
                'updated_at' => $applicationRow['updated_at'],
            ],
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'vacancy_application_failed', $error->getMessage());
    }
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

function read_operator_review_history(string $userId): array {
    $result = api_query(
        "SELECT created_at,
                source,
                event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND user_id = $1
         ORDER BY created_at DESC
         LIMIT 20",
        [$userId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'created_at' => $row['created_at'] ?? null,
            'source' => $row['source'] ?? null,
            'decision' => $row['decision'] ?? null,
            'previous_status' => $row['previous_status'] ?? null,
            'new_status' => $row['new_status'] ?? null,
            'queue_type' => $row['queue_type'] ?? null,
            'role' => $row['role'] ?? null,
            'review_note' => $row['review_note'] ?? null,
        ];
    }

    return $items;
}

function read_presented_candidates_for_employer(string $companyId, ?string $vacancyId = null): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.employer_shortlist_status,
            va.employer_action_note,
            va.employer_action_at,
            va.created_at,
            va.updated_at,
            su.user_id AS seafarer_user_id,
            su.display_name,
            su.email AS seafarer_email,
            sp.primary_rank,
            sp.department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code,
            sp.contact_phone,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         WHERE vr.company_id = $1
           AND ($2::uuid IS NULL OR va.vacancy_request_id = $2::uuid)
           AND va.application_status = 'presented'
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 50",
        [$companyId, $vacancyId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'application_status' => $row['application_status'],
            'contact_email' => $row['contact_email'],
            'candidate_note' => $row['candidate_note'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'employer_shortlist_status' => $row['employer_shortlist_status'],
            'employer_action_note' => $row['employer_action_note'],
            'employer_action_at' => $row['employer_action_at'],
            'seafarer_user_id' => $row['seafarer_user_id'],
            'display_name' => $row['display_name'],
            'seafarer_email' => $row['seafarer_email'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['country_code'],
            'contact_phone' => $row['contact_phone'],
            'document_metadata' => $row['document_metadata'],
            'vacancy_title' => $row['vacancy_title'],
            'vacancy_rank' => $row['vacancy_rank'],
            'vacancy_department' => $row['vacancy_department'],
        ];
    }

    return $items;
}

function read_vacancy_applications_for_seafarer(string $userId): array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.created_at,
            va.updated_at,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            COALESCE(vr.vessel_type, v.vessel_type) AS vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.publication_status,
            COALESCE(vr.employer_country_code, ec.country_code) AS employer_country_code,
            ec.company_name,
            ec.company_type,
            v.vessel_name
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE va.seafarer_user_id = $1
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 50",
        [$userId]
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'contact_email' => $row['contact_email'],
            'candidate_note' => $row['candidate_note'],
            'application_status' => $row['application_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['rank'],
            'department' => $row['department'],
            'vessel_type' => $row['vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'salary_text' => $row['salary_text'],
            'currency' => $row['currency'],
            'publication_status' => $row['publication_status'],
            'employer_country_code' => $row['employer_country_code'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'vessel_name' => $row['vessel_name'],
        ];
    }

    return $items;
}

function build_draft_response(string $userId): array {
    $userResult = api_query(
        'SELECT user_id,
                email,
                display_name,
                email_verified_at,
                email_verification_status,
                registration_status,
                created_at,
                updated_at
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
        $payload['seafarer_workspace_structured'] = cpg_read_seafarer_workspace_summary($userId);
        $payload['vacancy_applications'] = read_vacancy_applications_for_seafarer($userId);
    } else {
        $company = read_primary_company_for_user($userId);
        if ($company !== null) {
            $payload['company'] = $company;
            $vessel = read_latest_vessel_for_company((string) $company['company_id']);
            if ($vessel !== null) {
                $payload['vessel'] = $vessel;
            }
            $vacancy = read_latest_vacancy_for_company((string) $company['company_id'], $userId);
            if ($vacancy !== null) {
                $payload['vacancy_request'] = $vacancy;
            }
            $payload['presented_candidates'] = read_presented_candidates_for_employer(
                (string) $company['company_id'],
                $vacancy !== null && isset($vacancy['vacancy_request_id']) ? (string) $vacancy['vacancy_request_id'] : null
            );
        }
    }

    $latestReviewEvent = read_latest_operator_review_event($userId);
    if ($latestReviewEvent !== null) {
        $payload['operator_review'] = $latestReviewEvent;
    }
    $payload['operator_review_history'] = read_operator_review_history($userId);

    return [
        'ok' => true,
        'draft_id' => $userRow['user_id'],
        'role' => $role,
        'email' => $userRow['email'],
        'display_name' => $userRow['display_name'] ?? null,
        'email_verified' => $userRow['email_verified_at'] !== null || (string) $userRow['email_verification_status'] === 'verified',
        'email_verified_at' => $userRow['email_verified_at'] ?? null,
        'email_verification_status' => $userRow['email_verified_at'] !== null
            ? 'verified'
            : (string) $userRow['email_verification_status'],
        'account_activation_status' => ($userRow['email_verified_at'] !== null || (string) $userRow['email_verification_status'] === 'verified')
            ? 'active'
            : 'pending_email_verification',
        'profile_photo' => function_exists('cpg_profile_photo_public_current')
            ? cpg_profile_photo_public_current($userId)
            : null,
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

    $documentMetadataJson = normalize_seafarer_document_metadata($body);

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
           document_metadata,
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
           COALESCE($14::jsonb, \'{}\'::jsonb),
           $15
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
           document_metadata = COALESCE($14::jsonb, crewportglobal.seafarer_profiles.document_metadata),
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
            $documentMetadataJson,
            'submitted_for_human_review',
        ]
    );

    cpg_sync_seafarer_workspace_from_metadata($userId, $documentMetadataJson, [
        'department' => $department,
        'nationality_code' => $nationalityCode,
        'residence_country_code' => $residenceCountryCode,
        'availability_status' => $availability ?? 'unknown',
        'availability_date' => $availabilityDate,
        'preferred_vessel_types' => $preferredVesselTypes,
        'salary_expectation_usd' => $salaryExpectationUsd,
    ]);
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
        $vacancyRequestId = null;

        if ($role === 'seafarer') {
            upsert_seafarer_profile($userId, $body, $email);
        } else {
            [$companyId, $vesselId] = upsert_company_context($userId, $role, $body);
            $vacancyRequestId = upsert_vacancy_request($userId, $companyId, $vesselId, $body);
        }

        write_audit_event('registration_draft_created', $userId, $companyId, $vesselId, [
            'role' => $role,
            'email' => $email,
            'vacancy_request_id' => $vacancyRequestId,
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

function handle_get_seafarer_workspace(): void {
    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user();

    api_json(200, [
        'ok' => true,
        'access_model' => $accessModel,
        'draft_id' => $userId,
        'workspace' => cpg_read_seafarer_workspace_summary($userId),
    ]);
}

function handle_patch_seafarer_workspace_section(string $section): void {
    $section = trim($section);
    if (!in_array($section, cpg_seafarer_workspace_allowed_sections(), true)) {
        api_error(400, 'invalid_workspace_section', 'section must be one of personal_details, contact_and_addresses, qualifications, sea_service, matching_publication');
    }

    $body = api_decode_json_body();
    $sectionPayload = isset($body['data']) && is_array($body['data'])
        ? $body['data']
        : [];
    if ($sectionPayload === []) {
        api_error(400, 'workspace_section_data_required', 'data object is required');
    }

    $normalizedSection = cpg_normalize_seafarer_workspace_section($section, $sectionPayload);
    if ($normalizedSection === []) {
        api_error(400, 'workspace_section_data_invalid', 'data does not contain valid fields for this section');
    }

    [$userId, $accessModel] = cpg_resolve_seafarer_workspace_user($body);
    $context = cpg_seafarer_profile_sync_context($userId);
    $metadata = cpg_decode_json_object(is_string($context['document_metadata']) ? $context['document_metadata'] : null);
    $workspace = isset($metadata['seafarer_workspace']) && is_array($metadata['seafarer_workspace'])
        ? $metadata['seafarer_workspace']
        : [];
    $workspace[$section] = $normalizedSection;
    $metadata['seafarer_workspace'] = $workspace;
    $documentMetadataJson = cpg_workspace_json($metadata);

    api_tx_begin();
    try {
        api_query(
            'UPDATE crewportglobal.seafarer_profiles
             SET document_metadata = $2::jsonb,
                 review_status = $3,
                 updated_at = now()
             WHERE user_id = $1',
            [$userId, $documentMetadataJson, 'submitted_for_human_review']
        );

        cpg_sync_seafarer_workspace_from_metadata($userId, $documentMetadataJson, [
            'department' => $context['department'] ?? null,
            'nationality_code' => $context['nationality_code'] ?? null,
            'residence_country_code' => $context['residence_country_code'] ?? null,
            'availability_status' => $context['availability_status'] ?? 'unknown',
            'availability_date' => $context['availability_date'] ?? null,
            'preferred_vessel_types' => $context['preferred_vessel_types'] ?? [],
            'salary_expectation_usd' => $context['salary_expectation_usd'] ?? null,
        ]);

        write_audit_event('seafarer_workspace_section_updated', $userId, null, null, [
            'section' => $section,
            'access_model' => $accessModel,
        ]);

        api_tx_commit();
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_workspace_section_update_failed', $error->getMessage());
    }

    api_json(200, [
        'ok' => true,
        'access_model' => $accessModel,
        'draft_id' => $userId,
        'section' => $section,
        'workspace' => cpg_read_seafarer_workspace_summary($userId),
    ]);
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
            $vacancyRequestId = upsert_vacancy_request($uuid, $companyId, $vesselId, $body);
            write_audit_event('registration_draft_updated', $uuid, $companyId, $vesselId, [
                'role' => $role,
                'vacancy_request_id' => $vacancyRequestId,
            ]);
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
            'operator_access' => operator_queue_access_contract('seafarer_profile'),
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
            'operator_access' => operator_queue_access_contract('company_verification'),
        ];
    }

    $vacancyResult = api_query(
        "SELECT
            vr.vacancy_request_id AS queue_item_id,
            vr.created_by_user_id AS draft_id,
            COALESCE(ur.role, 'employer') AS role,
            u.email,
            u.display_name,
            vr.publication_status AS queue_status,
            vr.vacancy_title,
            vr.rank,
            vr.department,
            vr.vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.currency,
            ec.company_name,
            ec.verification_status,
            v.vessel_name,
            vr.created_at,
            vr.updated_at
         FROM crewportglobal.vacancy_requests vr
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         LEFT JOIN crewportglobal.users u ON u.user_id = vr.created_by_user_id
         LEFT JOIN LATERAL (
             SELECT role
             FROM crewportglobal.user_roles ur
             WHERE ur.user_id = vr.created_by_user_id
             ORDER BY ur.created_at ASC
             LIMIT 1
         ) ur ON TRUE
         WHERE vr.publication_status IN ('submitted_for_human_review', 'in_review')
         ORDER BY vr.updated_at DESC, vr.created_at DESC
         LIMIT 200"
    );

    while (($row = pg_fetch_assoc($vacancyResult)) !== false) {
        $items[] = [
            'queue_item_id' => $row['queue_item_id'],
            'queue_type' => 'vacancy_request',
            'draft_id' => $row['draft_id'],
            'role' => $row['role'],
            'email' => $row['email'],
            'full_name' => $row['display_name'] ?? $row['email'],
            'status' => $row['queue_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'summary' => [
                'vacancy_title' => $row['vacancy_title'],
                'rank' => $row['rank'],
                'department' => $row['department'],
                'vessel_type' => $row['vessel_type'],
                'join_date' => $row['join_date'],
                'contract_duration' => $row['contract_duration'],
                'salary_min_usd' => $row['salary_min_usd'],
                'salary_max_usd' => $row['salary_max_usd'],
                'currency' => $row['currency'],
                'company_name' => $row['company_name'],
                'company_verification_status' => $row['verification_status'],
                'vessel_name' => $row['vessel_name'],
            ],
            'operator_access' => operator_queue_access_contract('vacancy_request'),
        ];
    }

    $applicationResult = api_query(
        "SELECT
            va.vacancy_application_id AS queue_item_id,
            va.seafarer_user_id AS draft_id,
            su.email,
            su.display_name,
            va.application_status AS queue_status,
            va.contact_email,
            va.candidate_note,
            sp.primary_rank,
            sp.review_status AS candidate_review_status,
            sp.availability_status,
            vr.vacancy_request_id,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department,
            ec.company_name,
            v.vessel_name,
            va.created_at,
            va.updated_at
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE va.application_status IN ('submitted_for_human_review', 'in_review')
         ORDER BY va.updated_at DESC, va.created_at DESC
         LIMIT 200"
    );

    while (($row = pg_fetch_assoc($applicationResult)) !== false) {
        $items[] = [
            'queue_item_id' => $row['queue_item_id'],
            'queue_type' => 'vacancy_application',
            'draft_id' => $row['draft_id'],
            'role' => 'seafarer',
            'email' => $row['contact_email'] ?: $row['email'],
            'full_name' => $row['display_name'] ?? $row['email'],
            'status' => $row['queue_status'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'summary' => [
                'vacancy_title' => $row['vacancy_title'],
                'vacancy_rank' => $row['vacancy_rank'],
                'candidate_rank' => $row['primary_rank'],
                'candidate_review_status' => $row['candidate_review_status'],
                'availability_status' => $row['availability_status'],
                'company_name' => $row['company_name'],
                'vessel_name' => $row['vessel_name'],
                'candidate_note' => $row['candidate_note'],
            ],
            'operator_access' => operator_queue_access_contract('vacancy_application'),
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
        'access_model' => 'temporary_operator_token',
        'generated_at' => gmdate('c'),
    ]);
}

function read_operator_document_review_queue(): array {
    $result = api_query(
        "SELECT
            ud.document_id::text AS document_id,
            ud.draft_id::text AS draft_id,
            ud.form_type,
            ud.document_type,
            ud.original_filename,
            ud.file_size_bytes,
            ud.scan_status,
            ud.review_status,
            ud.uploaded_at::text AS uploaded_at,
            lower(u.email) AS email,
            u.display_name
         FROM crewportglobal.uploaded_documents ud
         LEFT JOIN crewportglobal.users u ON u.user_id = ud.draft_id
         WHERE ud.scan_status = 'clean'
           AND ud.review_status IN ('pending_human_review', 'under_review', 'correction_requested')
           AND ud.hidden_from_user_at IS NULL
           AND ud.upload_state = 'stored_protected'
         ORDER BY ud.uploaded_at DESC
         LIMIT 300"
    );

    $items = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $items[] = [
            'document_id' => $row['document_id'],
            'draft_id' => $row['draft_id'],
            'form_type' => $row['form_type'],
            'document_type' => $row['document_type'],
            'original_filename' => $row['original_filename'],
            'file_size_bytes' => (int) $row['file_size_bytes'],
            'scan_status' => $row['scan_status'],
            'review_status' => $row['review_status'],
            'uploaded_at' => $row['uploaded_at'],
            'user' => [
                'email' => $row['email'],
                'display_name' => $row['display_name'],
            ],
        ];
    }

    return $items;
}

function handle_get_operator_document_review_queue(array $access): void {
    $queue = read_operator_document_review_queue();
    api_json(200, [
        'ok' => true,
        'queue' => $queue,
        'count' => count($queue),
        'access_model' => $access['access_model'] ?? 'operator_or_team',
        'generated_at' => gmdate('c'),
    ]);
}

function read_uploaded_document_private_row(string $documentId): ?array {
    $result = api_query(
        "SELECT
            ud.document_id::text AS document_id,
            ud.draft_id::text AS draft_id,
            ud.form_type,
            ud.document_type,
            ud.original_filename,
            ud.stored_filename,
            ud.storage_root,
            ud.storage_path,
            ud.mime_type,
            ud.file_size_bytes,
            ud.scan_status,
            ud.review_status,
            ud.review_note,
            ud.upload_state,
            ud.uploaded_at::text AS uploaded_at,
            lower(u.email) AS email,
            u.display_name
         FROM crewportglobal.uploaded_documents ud
         LEFT JOIN crewportglobal.users u ON u.user_id = ud.draft_id
         WHERE ud.document_id = $1::uuid
         LIMIT 1",
        [$documentId]
    );
    $row = pg_fetch_assoc($result);

    return is_array($row) ? $row : null;
}

function ensure_document_clean_for_operator(array $document): void {
    if (($document['scan_status'] ?? '') !== 'clean') {
        api_error(403, 'document_not_clean', 'Only clean scanned documents can be opened for review');
    }
    if (($document['upload_state'] ?? '') !== 'stored_protected') {
        api_error(403, 'document_not_available', 'Document is not available from protected storage');
    }
}

function document_review_audit_payload(array $document, array $extra = []): array {
    $payload = array_merge([
        'document_id' => $document['document_id'],
        'draft_id' => $document['draft_id'],
        'form_type' => $document['form_type'],
        'document_type' => $document['document_type'],
        'scan_status' => $document['scan_status'],
    ], $extra);
    if (($payload['review_note'] ?? null) === null) {
        unset($payload['review_note']);
    }

    return $payload;
}

function write_document_review_audit(string $eventType, array $document, array $payload): void {
    write_audit_event(
        $eventType,
        (string) $document['draft_id'],
        null,
        null,
        $payload,
        'operator_document_review'
    );
}

function safe_download_filename(string $originalFilename, string $documentId): string {
    $filename = cpg_document_clean_original_filename($originalFilename);
    if ($filename === 'uploaded-document') {
        return $documentId . '.bin';
    }

    return $filename;
}

function handle_get_operator_document_download(string $documentId, array $access): void {
    $uuid = api_normalize_uuid($documentId);
    if ($uuid === null) {
        api_error(400, 'invalid_document_id', 'document_id must be a valid UUID');
    }

    $document = read_uploaded_document_private_row($uuid);
    if ($document === null) {
        api_error(404, 'document_not_found', 'Uploaded document was not found');
    }

    ensure_document_clean_for_operator($document);

    $storageRoot = rtrim((string) $document['storage_root'], '/');
    $storagePath = ltrim((string) $document['storage_path'], '/');
    $rootPath = realpath($storageRoot);
    $filePath = realpath($storageRoot . '/' . $storagePath);
    if ($rootPath === false || $filePath === false || !str_starts_with($filePath, $rootPath . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
        api_error(404, 'document_file_not_found', 'Protected document file was not found');
    }

    write_document_review_audit('document_viewed', $document, document_review_audit_payload($document, [
        'previous_review_status' => $document['review_status'],
        'new_review_status' => $document['review_status'],
        'decision' => 'download',
        'access_model' => $access['access_model'] ?? null,
    ]));

    $downloadName = safe_download_filename((string) $document['original_filename'], $uuid);
    $quotedName = addcslashes($downloadName, "\\\"");
    header('Content-Type: ' . (string) $document['mime_type']);
    header('Content-Length: ' . (string) filesize($filePath));
    header('Content-Disposition: attachment; filename="' . $quotedName . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store, private');
    readfile($filePath);
    exit;
}

function normalize_document_review_decision(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $decision = trim(strtolower($value));
    return in_array($decision, ['start_review', 'accept', 'needs_correction', 'reject'], true) ? $decision : null;
}

function document_review_status_for_decision(string $decision): string {
    return match ($decision) {
        'start_review' => 'under_review',
        'accept' => 'verified',
        'needs_correction' => 'correction_requested',
        'reject' => 'rejected',
    };
}

function handle_patch_operator_document_review(string $documentId, array $access): void {
    $uuid = api_normalize_uuid($documentId);
    if ($uuid === null) {
        api_error(400, 'invalid_document_id', 'document_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $decision = normalize_document_review_decision($body['decision'] ?? $body['action'] ?? null);
    if ($decision === null) {
        api_error(400, 'invalid_decision', 'decision must be one of start_review, accept, needs_correction, reject');
    }

    $reviewNote = normalize_operator_review_note($body['note'] ?? $body['review_note'] ?? null);
    if (($decision === 'needs_correction' || $decision === 'reject') && $reviewNote === null) {
        api_error(400, 'review_note_required', 'review_note is required for needs_correction and reject');
    }

    api_tx_begin();
    try {
        $document = read_uploaded_document_private_row($uuid);
        if ($document === null) {
            api_tx_rollback();
            api_error(404, 'document_not_found', 'Uploaded document was not found');
        }
        if (($document['scan_status'] ?? '') !== 'clean') {
            api_tx_rollback();
            api_error(403, 'document_not_clean', 'Only clean scanned documents can be reviewed');
        }
        if (($document['upload_state'] ?? '') !== 'stored_protected') {
            api_tx_rollback();
            api_error(403, 'document_not_available', 'Document is not available from protected storage');
        }

        $previousStatus = (string) $document['review_status'];
        $newStatus = document_review_status_for_decision($decision);
        $effectiveNote = $reviewNote;

        $result = api_query(
            'UPDATE crewportglobal.uploaded_documents
             SET review_status = $2,
                 review_note = CASE WHEN $3::text IS NULL THEN review_note ELSE $3 END,
                 reviewed_by_user_id = CASE WHEN $4::uuid IS NULL THEN reviewed_by_user_id ELSE $4::uuid END,
                 reviewed_at = now(),
                 updated_at = now()
             WHERE document_id = $1::uuid
             RETURNING document_id::text AS document_id,
                       draft_id::text AS draft_id,
                       form_type,
                       document_type,
                       original_filename,
                       file_size_bytes,
                       scan_status,
                       review_status,
                       review_note,
                       uploaded_at::text AS uploaded_at',
            [
                $uuid,
                $newStatus,
                $effectiveNote,
                api_normalize_uuid((string) ($access['actor_user_id'] ?? '')),
            ]
        );
        $updated = pg_fetch_assoc($result);
        if (!is_array($updated)) {
            api_tx_rollback();
            api_error(500, 'document_review_update_failed', 'Unable to update document review status');
        }

        write_document_review_audit('document_review_decision_recorded', $document, document_review_audit_payload($document, [
            'previous_review_status' => $previousStatus,
            'new_review_status' => $newStatus,
            'decision' => $decision,
            'review_note' => $reviewNote,
            'access_model' => $access['access_model'] ?? null,
        ]));

        api_tx_commit();
        api_json(200, [
            'ok' => true,
            'document' => [
                'document_id' => $updated['document_id'],
                'draft_id' => $updated['draft_id'],
                'form_type' => $updated['form_type'],
                'document_type' => $updated['document_type'],
                'original_filename' => $updated['original_filename'],
                'file_size_bytes' => (int) $updated['file_size_bytes'],
                'scan_status' => $updated['scan_status'],
                'review_status' => $updated['review_status'],
                'review_note' => $updated['review_note'],
                'uploaded_at' => $updated['uploaded_at'],
            ],
            'decision' => $decision,
            'previous_review_status' => $previousStatus,
            'new_review_status' => $newStatus,
            'generated_at' => gmdate('c'),
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'document_review_update_failed', $error->getMessage());
    }
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

function normalize_operator_queue_type(mixed $value): ?string {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value)) {
        api_error(400, 'invalid_queue_type', 'queue_type must be a string');
    }

    $queueType = trim($value);
    $allowed = ['seafarer_profile', 'company_verification', 'vacancy_request', 'vacancy_application'];
    if (!in_array($queueType, $allowed, true)) {
        api_error(400, 'invalid_queue_type', 'queue_type must be one of seafarer_profile, company_verification, vacancy_request, vacancy_application');
    }

    return $queueType;
}

function read_operator_vacancy_application_review_history(string $applicationId): array {
    $result = api_query(
        "SELECT event_payload->>'decision' AS decision,
                event_payload->>'previous_status' AS previous_status,
                event_payload->>'new_status' AS new_status,
                event_payload->>'queue_type' AS queue_type,
                event_payload->>'role' AS role,
                event_payload->>'review_note' AS review_note,
                source,
                created_at
         FROM crewportglobal.registration_audit_events
         WHERE event_type = 'operator_review_decision_recorded'
           AND event_payload->>'vacancy_application_id' = $1
         ORDER BY created_at DESC
         LIMIT 20",
        [$applicationId]
    );

    $events = [];
    while (($row = pg_fetch_assoc($result)) !== false) {
        $events[] = [
            'decision' => $row['decision'] ?? null,
            'previous_status' => $row['previous_status'] ?? null,
            'new_status' => $row['new_status'] ?? null,
            'queue_type' => $row['queue_type'] ?? null,
            'role' => $row['role'] ?? null,
            'review_note' => $row['review_note'] ?? null,
            'source' => $row['source'] ?? null,
            'created_at' => $row['created_at'] ?? null,
        ];
    }

    return $events;
}

function read_operator_vacancy_application_detail(string $applicationId): ?array {
    $result = api_query(
        "SELECT
            va.vacancy_application_id,
            va.vacancy_request_id,
            va.seafarer_user_id,
            va.contact_email,
            va.candidate_note,
            va.application_status,
            va.created_at AS application_created_at,
            va.updated_at AS application_updated_at,
            su.email AS seafarer_email,
            su.display_name AS seafarer_display_name,
            sp.first_name,
            sp.last_name,
            sp.primary_rank,
            sp.department AS seafarer_department,
            sp.availability_status,
            sp.availability_date,
            sp.country_code AS seafarer_country_code,
            sp.contact_phone,
            sp.review_status AS seafarer_review_status,
            sp.document_metadata,
            vr.vacancy_title,
            vr.rank AS vacancy_rank,
            vr.department AS vacancy_department,
            vr.vessel_type AS vacancy_vessel_type,
            vr.join_date,
            vr.contract_duration,
            vr.salary_min_usd,
            vr.salary_max_usd,
            vr.salary_text,
            vr.currency,
            vr.employer_country_code,
            vr.requirements,
            vr.publication_status,
            vr.company_id,
            vr.vessel_id,
            ec.company_name,
            ec.company_type,
            ec.country_code AS company_country_code,
            ec.verification_status,
            v.vessel_name,
            v.vessel_type,
            v.imo_number,
            v.flag_country_code
         FROM crewportglobal.vacancy_applications va
         JOIN crewportglobal.users su ON su.user_id = va.seafarer_user_id
         LEFT JOIN crewportglobal.seafarer_profiles sp ON sp.user_id = su.user_id
         JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
         JOIN crewportglobal.employer_companies ec ON ec.company_id = vr.company_id
         LEFT JOIN crewportglobal.vessels v ON v.vessel_id = vr.vessel_id
         WHERE va.vacancy_application_id = $1
         LIMIT 1",
        [$applicationId]
    );

    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        return null;
    }

    $history = read_operator_vacancy_application_review_history($applicationId);

    return [
        'ok' => true,
        'queue_type' => 'vacancy_application',
        'application' => [
            'vacancy_application_id' => $row['vacancy_application_id'],
            'vacancy_request_id' => $row['vacancy_request_id'],
            'seafarer_user_id' => $row['seafarer_user_id'],
            'contact_email' => $row['contact_email'],
            'candidate_note' => $row['candidate_note'],
            'application_status' => $row['application_status'],
            'created_at' => $row['application_created_at'],
            'updated_at' => $row['application_updated_at'],
        ],
        'seafarer_profile' => [
            'user_id' => $row['seafarer_user_id'],
            'email' => $row['seafarer_email'],
            'display_name' => $row['seafarer_display_name'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'primary_rank' => $row['primary_rank'],
            'department' => $row['seafarer_department'],
            'availability_status' => $row['availability_status'],
            'availability_date' => $row['availability_date'],
            'country_code' => $row['seafarer_country_code'],
            'contact_phone' => $row['contact_phone'],
            'review_status' => $row['seafarer_review_status'],
            'document_metadata' => $row['document_metadata'],
        ],
        'vacancy' => [
            'vacancy_request_id' => $row['vacancy_request_id'],
            'vacancy_title' => $row['vacancy_title'],
            'rank' => $row['vacancy_rank'],
            'department' => $row['vacancy_department'],
            'vessel_type' => $row['vacancy_vessel_type'],
            'join_date' => $row['join_date'],
            'contract_duration' => $row['contract_duration'],
            'salary_min_usd' => $row['salary_min_usd'],
            'salary_max_usd' => $row['salary_max_usd'],
            'salary_text' => $row['salary_text'],
            'currency' => $row['currency'],
            'employer_country_code' => $row['employer_country_code'],
            'requirements' => $row['requirements'],
            'publication_status' => $row['publication_status'],
        ],
        'company' => [
            'company_id' => $row['company_id'],
            'company_name' => $row['company_name'],
            'company_type' => $row['company_type'],
            'country_code' => $row['company_country_code'],
            'verification_status' => $row['verification_status'],
        ],
        'vessel' => [
            'vessel_id' => $row['vessel_id'],
            'vessel_name' => $row['vessel_name'],
            'vessel_type' => $row['vessel_type'],
            'imo_number' => $row['imo_number'],
            'flag_country_code' => $row['flag_country_code'],
        ],
        'operator_review' => $history[0] ?? null,
        'operator_review_history' => $history,
        'operator_access' => operator_queue_access_contract('vacancy_application'),
        'generated_at' => gmdate('c'),
    ];
}

function handle_get_operator_vacancy_application_detail(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $detail = read_operator_vacancy_application_detail($uuid);
    if ($detail === null) {
        api_error(404, 'vacancy_application_not_found', 'Vacancy application not found');
    }

    api_json(200, $detail);
}

function normalize_employer_shortlist_status(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $status = trim(strtolower($value));
    $aliases = [
        'mark_contacted' => 'contacted',
        'contacted' => 'contacted',
        'request_interview' => 'interview_requested',
        'interview_requested' => 'interview_requested',
        'not_suitable' => 'not_suitable',
        'reset' => 'presented',
        'presented' => 'presented',
    ];

    return $aliases[$status] ?? null;
}

function handle_patch_employer_vacancy_application_shortlist(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $employerDraftId = api_normalize_uuid($body['employer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($employerDraftId === null) {
        api_error(400, 'invalid_employer_draft_id', 'employer_draft_id must be a valid UUID');
    }

    $shortlistStatus = normalize_employer_shortlist_status($body['shortlist_status'] ?? $body['action'] ?? $body['status'] ?? null);
    if ($shortlistStatus === null) {
        api_error(400, 'invalid_shortlist_status', 'shortlist_status must be one of presented, contacted, interview_requested, not_suitable');
    }

    $role = read_role_for_user($employerDraftId);
    if ($role === null || $role === 'seafarer') {
        api_error(404, 'employer_draft_not_found', 'Employer draft not found');
    }

    $company = read_primary_company_for_user($employerDraftId);
    if ($company === null || !isset($company['company_id'])) {
        api_error(404, 'employer_company_not_found', 'Employer company not found');
    }
    $companyId = (string) $company['company_id'];
    $note = normalize_optional_text($body['note'] ?? $body['employer_note'] ?? null, 1200);

    api_tx_begin();
    try {
        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                va.employer_shortlist_status,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$uuid]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow) || (string) $currentRow['company_id'] !== $companyId) {
            api_tx_rollback();
            api_error(404, 'employer_application_not_found', 'Presented vacancy application not found for this employer');
        }

        if (($currentRow['application_status'] ?? '') !== 'presented') {
            api_tx_rollback();
            api_error(400, 'candidate_not_presented', 'Only operator-presented vacancy applications can be updated by employer');
        }

        $previousStatus = (string) $currentRow['employer_shortlist_status'];
        $updateResult = api_query(
            'UPDATE crewportglobal.vacancy_applications
             SET employer_shortlist_status = $2,
                 employer_action_note = $3,
                 employer_action_at = now(),
                 updated_at = now()
             WHERE vacancy_application_id = $1
             RETURNING employer_shortlist_status, employer_action_note, employer_action_at, updated_at',
            [$uuid, $shortlistStatus, $note]
        );
        $updateRow = pg_fetch_assoc($updateResult);
        if (!is_array($updateRow)) {
            api_tx_rollback();
            api_error(500, 'employer_shortlist_update_failed', 'Unable to update employer shortlist status');
        }

        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('employer_shortlist_action_recorded', $employerDraftId, $companyId, $vesselId, [
            'previous_status' => $previousStatus,
            'new_status' => $shortlistStatus,
            'employer_note' => $note,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'vacancy_application_id' => $uuid,
            'seafarer_user_id' => $currentRow['seafarer_user_id'],
        ], 'employer_candidate_pipeline');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_application_id' => $uuid,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'previous_status' => $previousStatus,
            'employer_shortlist_status' => $updateRow['employer_shortlist_status'],
            'employer_action_note' => $updateRow['employer_action_note'],
            'employer_action_at' => $updateRow['employer_action_at'],
            'updated_at' => $updateRow['updated_at'],
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'employer_shortlist_update_failed', $error->getMessage());
    }
}

function normalize_seafarer_application_action(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $action = trim(strtolower($value));
    $aliases = [
        'withdraw' => 'withdraw',
        'withdrawn' => 'withdraw',
        'withdraw_application' => 'withdraw',
        'not_available' => 'not_available',
        'mark_not_available' => 'not_available',
    ];

    return $aliases[$action] ?? null;
}

function handle_patch_seafarer_vacancy_application_status(string $applicationId): void {
    $uuid = api_normalize_uuid($applicationId);
    if ($uuid === null) {
        api_error(400, 'invalid_vacancy_application_id', 'vacancy_application_id must be a valid UUID');
    }

    $body = api_decode_json_body();
    $seafarerDraftId = api_normalize_uuid($body['seafarer_draft_id'] ?? $body['draft_id'] ?? null);
    if ($seafarerDraftId === null) {
        api_error(400, 'invalid_seafarer_draft_id', 'seafarer_draft_id must be a valid UUID');
    }

    $action = normalize_seafarer_application_action($body['action'] ?? $body['status'] ?? null);
    if ($action === null) {
        api_error(400, 'invalid_application_action', 'action must be withdraw or not_available');
    }

    $role = read_role_for_user($seafarerDraftId);
    if ($role !== 'seafarer') {
        api_error(404, 'seafarer_draft_not_found', 'Seafarer draft not found');
    }

    api_tx_begin();
    try {
        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$uuid]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow) || (string) $currentRow['seafarer_user_id'] !== $seafarerDraftId) {
            api_tx_rollback();
            api_error(404, 'seafarer_application_not_found', 'Vacancy application not found for this seafarer');
        }

        $previousStatus = (string) $currentRow['application_status'];
        if (in_array($previousStatus, ['rejected', 'withdrawn'], true)) {
            api_tx_rollback();
            api_error(400, 'application_not_active', 'Only active vacancy applications can be withdrawn');
        }

        $updateResult = api_query(
            "UPDATE crewportglobal.vacancy_applications
             SET application_status = 'withdrawn', updated_at = now()
             WHERE vacancy_application_id = $1
             RETURNING application_status, updated_at",
            [$uuid]
        );
        $updateRow = pg_fetch_assoc($updateResult);
        if (!is_array($updateRow)) {
            api_tx_rollback();
            api_error(500, 'seafarer_application_update_failed', 'Unable to update vacancy application');
        }

        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }

        write_audit_event('seafarer_vacancy_application_withdrawn', $seafarerDraftId, (string) $currentRow['company_id'], $vesselId, [
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => 'withdrawn',
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'vacancy_application_id' => $uuid,
        ], 'seafarer_application_history');

        api_tx_commit();

        api_json(200, [
            'ok' => true,
            'vacancy_application_id' => $uuid,
            'vacancy_request_id' => $currentRow['vacancy_request_id'],
            'action' => $action,
            'previous_status' => $previousStatus,
            'application_status' => $updateRow['application_status'],
            'updated_at' => $updateRow['updated_at'],
        ]);
    } catch (Throwable $error) {
        api_tx_rollback();
        api_error(500, 'seafarer_application_update_failed', $error->getMessage());
    }
}

function apply_operator_review_decision(string $draftId, string $decision, ?string $reviewNote, ?string $queueType = null): array {
    if ($queueType === 'vacancy_application') {
        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reviewed' => 'presented',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            "SELECT
                va.vacancy_application_id,
                va.vacancy_request_id,
                va.seafarer_user_id,
                va.application_status,
                vr.company_id,
                vr.vessel_id
             FROM crewportglobal.vacancy_applications va
             JOIN crewportglobal.vacancy_requests vr ON vr.vacancy_request_id = va.vacancy_request_id
             WHERE va.vacancy_application_id = $1
             LIMIT 1",
            [$draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Vacancy application review item not found');
        }

        $applicationId = (string) $currentRow['vacancy_application_id'];
        $seafarerUserId = (string) $currentRow['seafarer_user_id'];
        $vacancyRequestId = (string) $currentRow['vacancy_request_id'];
        $companyId = (string) $currentRow['company_id'];
        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }
        $previousStatus = (string) $currentRow['application_status'];
        if ($previousStatus === 'withdrawn') {
            api_error(400, 'application_withdrawn', 'Withdrawn vacancy applications cannot be moved by operator review');
        }

        api_query(
            'UPDATE crewportglobal.vacancy_applications
             SET application_status = $2, updated_at = now()
             WHERE vacancy_application_id = $1',
            [$applicationId, $newStatus]
        );

        write_audit_event('operator_review_decision_recorded', $seafarerUserId, $companyId, $vesselId, [
            'decision' => $decision,
            'queue_type' => 'vacancy_application',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => 'seafarer',
            'review_note' => $reviewNote,
            'vacancy_request_id' => $vacancyRequestId,
            'vacancy_application_id' => $applicationId,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'vacancy_application',
            'role' => 'seafarer',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => $companyId,
            'vessel_id' => $vesselId,
            'vacancy_request_id' => $vacancyRequestId,
            'vacancy_application_id' => $applicationId,
            'review_note' => $reviewNote,
        ];
    }

    $role = read_role_for_user($draftId);
    if ($role === null) {
        api_error(404, 'draft_not_found', 'Registration draft not found');
    }

    if ($queueType === null) {
        $queueType = $role === 'seafarer' ? 'seafarer_profile' : 'company_verification';
    }

    if ($queueType === 'seafarer_profile') {
        if ($role !== 'seafarer') {
            api_error(404, 'review_item_not_found', 'Seafarer review item not found');
        }

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

    if ($queueType === 'vacancy_request') {
        $statusMap = [
            'start_review' => 'in_review',
            'needs_correction' => 'rejected',
            'reviewed' => 'published',
        ];
        $newStatus = $statusMap[$decision];

        $currentResult = api_query(
            'SELECT vacancy_request_id, vessel_id, publication_status
             FROM crewportglobal.vacancy_requests
             WHERE company_id = $1
               AND created_by_user_id = $2
             ORDER BY updated_at DESC, created_at DESC
             LIMIT 1',
            [$companyId, $draftId]
        );
        $currentRow = pg_fetch_assoc($currentResult);
        if (!is_array($currentRow)) {
            api_error(404, 'review_item_not_found', 'Vacancy request review item not found');
        }

        $vacancyRequestId = (string) $currentRow['vacancy_request_id'];
        $vesselId = isset($currentRow['vessel_id']) ? (string) $currentRow['vessel_id'] : null;
        if ($vesselId === '') {
            $vesselId = null;
        }
        $previousStatus = (string) $currentRow['publication_status'];

        api_query(
            'UPDATE crewportglobal.vacancy_requests
             SET publication_status = $2, updated_at = now()
             WHERE vacancy_request_id = $1',
            [$vacancyRequestId, $newStatus]
        );

        write_audit_event('operator_review_decision_recorded', $draftId, $companyId, $vesselId, [
            'decision' => $decision,
            'queue_type' => 'vacancy_request',
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'role' => $role,
            'review_note' => $reviewNote,
            'vacancy_request_id' => $vacancyRequestId,
        ], 'operator_review_queue');

        return [
            'queue_type' => 'vacancy_request',
            'role' => $role,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'company_id' => $companyId,
            'vessel_id' => $vesselId,
            'vacancy_request_id' => $vacancyRequestId,
            'review_note' => $reviewNote,
        ];
    }

    if ($queueType !== 'company_verification') {
        api_error(400, 'invalid_queue_type', 'queue_type must be one of seafarer_profile, company_verification, vacancy_request, vacancy_application');
    }

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
        'vessel_id' => null,
        'vacancy_request_id' => null,
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
    $queueType = normalize_operator_queue_type($body['queue_type'] ?? null);

    api_tx_begin();
    try {
        $result = apply_operator_review_decision($uuid, $decision, $reviewNote, $queueType);
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
            'vessel_id' => $result['vessel_id'] ?? null,
            'vacancy_request_id' => $result['vacancy_request_id'] ?? null,
            'vacancy_application_id' => $result['vacancy_application_id'] ?? null,
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

if ($path === '/auth/register-password') {
    if ($method === 'POST') {
        handle_post_auth_register_password();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/login') {
    if ($method === 'POST') {
        handle_post_auth_login();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/logout') {
    if ($method === 'POST') {
        handle_post_auth_logout();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/send-verification') {
    if ($method === 'POST') {
        handle_post_auth_email_send_verification('user_requested');
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/resend-verification') {
    if ($method === 'POST') {
        handle_post_auth_email_send_verification('user_requested_resend');
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/email/verify') {
    if ($method === 'POST') {
        handle_post_auth_email_verify();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/auth/me') {
    if ($method === 'GET') {
        handle_get_auth_me();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/user/profile-photo') {
    if ($method === 'GET') {
        cpg_handle_get_user_profile_photo();
    }
    if ($method === 'POST') {
        cpg_handle_post_user_profile_photo();
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/user/profile-photo/image') {
    if ($method === 'GET') {
        cpg_handle_get_user_profile_photo_image();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/reference-catalogs') {
    if ($method === 'GET') {
        cpg_handle_get_reference_catalogs();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/email-code/request') {
    if ($method === 'POST') {
        handle_post_admin_access_email_code_request();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/email-code/verify') {
    if ($method === 'POST') {
        handle_post_admin_access_email_code_verify();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/session') {
    if ($method === 'GET') {
        handle_get_admin_access_session();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/session/revoke') {
    if ($method === 'POST') {
        handle_post_admin_access_session_revoke();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/team-links') {
    if ($method === 'GET') {
        handle_get_admin_access_team_links();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/management') {
    if ($method === 'GET') {
        handle_get_admin_access_management();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/users') {
    if ($method === 'POST') {
        handle_post_admin_access_user();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/group-members') {
    if ($method === 'POST') {
        handle_post_admin_access_group_member();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/admin/access/reference-catalogs') {
    if ($method === 'GET') {
        handle_get_admin_access_reference_catalogs();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($path === '/admin/access/reference-catalogs/publication') {
    if ($method === 'PATCH') {
        handle_patch_admin_access_reference_catalog_publication();
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($path === '/registration/person/request') {
    if ($method === 'POST') {
        handle_post_registration_person_request();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if ($path === '/registration/person/confirm') {
    if ($method === 'POST') {
        handle_post_registration_person_confirm();
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

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

if (preg_match('#^/registration/drafts/([^/]+)/documents$#', $path, $matches) === 1) {
    $draftId = $matches[1];
    if ($method === 'GET') {
        cpg_handle_get_registration_draft_documents($draftId);
    }
    if ($method === 'POST') {
        cpg_handle_post_registration_draft_document($draftId);
    }
    header('Allow: GET, POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET, POST');
}

if ($path === '/seafarer/workspace') {
    if ($method === 'GET') {
        handle_get_seafarer_workspace();
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/seafarer/workspace/sections/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_seafarer_workspace_section($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if ($method === 'GET' && $path === '/operator/review-queue') {
    require_operator_access();
    handle_get_operator_review_queue();
}

if ($method === 'GET' && $path === '/operator/document-review-queue') {
    $access = require_operator_or_team_access();
    handle_get_operator_document_review_queue($access);
}

if (preg_match('#^/operator/documents/([^/]+)/download$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        $access = require_operator_or_team_access();
        handle_get_operator_document_download($matches[1], $access);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/operator/documents/([^/]+)/review$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        $access = require_operator_or_team_access();
        handle_patch_operator_document_review($matches[1], $access);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/review-queue/vacancy-applications/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        require_operator_access();
        handle_get_operator_vacancy_application_detail($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if ($method === 'GET' && $path === '/vacancies') {
    handle_get_public_vacancies();
}

if (preg_match('#^/vacancies/([^/]+)$#', $path, $matches) === 1) {
    if ($method === 'GET') {
        handle_get_public_vacancy($matches[1]);
    }
    header('Allow: GET');
    api_error(405, 'method_not_allowed', 'Allowed methods: GET');
}

if (preg_match('#^/vacancies/([^/]+)/applications$#', $path, $matches) === 1) {
    if ($method === 'POST') {
        handle_create_vacancy_application($matches[1]);
    }
    header('Allow: POST');
    api_error(405, 'method_not_allowed', 'Allowed methods: POST');
}

if (preg_match('#^/seafarer/vacancy-applications/([^/]+)/status$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_seafarer_vacancy_application_status($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/employer/vacancy-applications/([^/]+)/shortlist$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        handle_patch_employer_vacancy_application_shortlist($matches[1]);
    }
    header('Allow: PATCH');
    api_error(405, 'method_not_allowed', 'Allowed methods: PATCH');
}

if (preg_match('#^/operator/review-queue/([^/]+)/status$#', $path, $matches) === 1) {
    if ($method === 'PATCH') {
        require_operator_access();
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
