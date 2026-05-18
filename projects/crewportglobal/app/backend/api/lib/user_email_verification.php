<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/registration_person_flow.php';
require_once __DIR__ . '/user_auth.php';

const CPG_EMAIL_VERIFICATION_PURPOSE = 'account_email_verification';
const CPG_EMAIL_VERIFICATION_TTL_SECONDS = 86400;
const CPG_EMAIL_VERIFICATION_TEST_MODE_ENV = 'CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE';

function cpg_email_verification_test_mode(?array $env = null): bool {
    if (cpg_registration_bool_env(CPG_EMAIL_VERIFICATION_TEST_MODE_ENV, $env)) {
        return true;
    }

    $appEnv = cpg_registration_env_value('CREWPORTGLOBAL_ENV', $env);
    return is_string($appEnv) && strtolower($appEnv) === 'test';
}

function cpg_email_verification_generate_token(): string {
    return cpg_auth_base64url(random_bytes(32));
}

function cpg_email_verification_hash_token(string $token): string {
    return hash('sha256', $token);
}

function cpg_email_verification_url(string $token, ?array $env = null): string {
    return cpg_registration_public_base_url($env)
        . '/register/confirm/?purpose=email_verification&token='
        . rawurlencode($token);
}

function cpg_email_verification_message(string $to, string $verificationUrl, string $expiresAt): array {
    return [
        'to' => strtolower($to),
        'subject' => 'CrewPortGlobal email verification',
        'body_text' => "Confirm your CrewPortGlobal account email:\n\n"
            . $verificationUrl
            . "\n\nThis link expires in 24 hours.\n"
            . "If you did not create a CrewPortGlobal account, ignore this message.\n",
        'expires_at' => $expiresAt,
    ];
}

function cpg_email_verification_public_delivery_status(array $delivery): string {
    $status = (string) ($delivery['delivery_status'] ?? $delivery['error'] ?? '');
    if (in_array($status, ['registration_email_delivery_sent', 'captured_test_only'], true)) {
        return $status === 'captured_test_only' ? 'captured_test_only' : 'sent';
    }

    if ($status === 'registration_email_delivery_send_not_enabled') {
        return 'prepared_not_sent';
    }

    if (in_array($status, [
        'registration_email_delivery_disabled',
        'registration_email_delivery_config_incomplete',
        'registration_email_delivery_mode_invalid',
    ], true)) {
        return 'not_configured';
    }

    return $status === '' ? 'not_configured' : $status;
}

function cpg_email_verification_create_token(string $userId, string $email, string $source): array {
    $token = cpg_email_verification_generate_token();
    $tokenHash = cpg_email_verification_hash_token($token);
    $expiresAt = gmdate('c', time() + CPG_EMAIL_VERIFICATION_TTL_SECONDS);
    $metadata = cpg_auth_request_metadata();

    api_query(
        "UPDATE crewportglobal.email_verification_tokens
         SET token_state = 'revoked'
         WHERE user_id = $1
           AND lower(email) = lower($2)
           AND purpose = $3
           AND token_state = 'pending'",
        [$userId, $email, CPG_EMAIL_VERIFICATION_PURPOSE]
    );

    $result = api_query(
        "INSERT INTO crewportglobal.email_verification_tokens (
           user_id, email, verification_token_hash, purpose, token_state, expires_at, ip_address, user_agent
         ) VALUES ($1, $2, $3, $4, 'pending', $5::timestamptz, $6::inet, $7)
         RETURNING email_verification_token_id, expires_at",
        [
            $userId,
            $email,
            $tokenHash,
            CPG_EMAIL_VERIFICATION_PURPOSE,
            $expiresAt,
            $metadata['ip_address'],
            $metadata['user_agent'],
        ]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(500, 'email_verification_token_create_failed', 'Unable to create email verification token');
    }

    api_query(
        "UPDATE crewportglobal.users
         SET email_verification_status = CASE
           WHEN email_verified_at IS NOT NULL THEN 'verified'
           ELSE 'pending'
         END,
             updated_at = now()
         WHERE user_id = $1",
        [$userId]
    );

    write_audit_event('email_verification_token_created', $userId, null, null, [
        'email' => $email,
        'source' => $source,
        'expires_at' => (string) $row['expires_at'],
    ], 'auth_email_verification');

    return [
        'token_id' => (string) $row['email_verification_token_id'],
        'raw_token' => $token,
        'expires_at' => (string) $row['expires_at'],
    ];
}

function cpg_email_verification_send_token(
    string $userId,
    string $email,
    array $tokenRecord,
    string $source,
    ?array $env = null
): array {
    $verificationUrl = cpg_email_verification_url((string) $tokenRecord['raw_token'], $env);
    $message = cpg_email_verification_message($email, $verificationUrl, (string) $tokenRecord['expires_at']);
    $delivery = cpg_registration_send_email_message($message, $env);
    $publicDeliveryStatus = cpg_email_verification_public_delivery_status($delivery);

    api_query(
        'UPDATE crewportglobal.email_verification_tokens
         SET sent_at = now(),
             delivery_status = $2
         WHERE email_verification_token_id = $1',
        [(string) $tokenRecord['token_id'], $publicDeliveryStatus]
    );

    write_audit_event('email_verification_delivery_prepared', $userId, null, null, [
        'email' => $email,
        'source' => $source,
        'delivery_status' => $publicDeliveryStatus,
        'real_send_performed' => ($delivery['real_send_performed'] ?? false) === true,
    ], 'auth_email_verification');

    $payload = [
        'status' => 'pending',
        'email_verification_status' => 'pending',
        'email_delivery_status' => $publicDeliveryStatus,
        'masked_email' => cpg_admin_mask_email($email),
        'expires_at' => (string) $tokenRecord['expires_at'],
        'real_send_performed' => ($delivery['real_send_performed'] ?? false) === true,
    ];

    if (cpg_email_verification_test_mode($env)) {
        $payload['test_verification_token'] = (string) $tokenRecord['raw_token'];
        $payload['test_verification_url'] = $verificationUrl;
    }

    return $payload;
}

function cpg_email_verification_create_and_send(
    string $userId,
    string $email,
    string $source,
    ?array $env = null
): array {
    $tokenRecord = cpg_email_verification_create_token($userId, $email, $source);
    return cpg_email_verification_send_token($userId, $email, $tokenRecord, $source, $env);
}

function cpg_email_verification_user_status(string $userId): array {
    $result = api_query(
        'SELECT user_id, email, display_name, email_verified_at, email_verification_status
         FROM crewportglobal.users
         WHERE user_id = $1',
        [$userId]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(404, 'user_not_found', 'User was not found');
    }

    $verified = $row['email_verified_at'] !== null || (string) $row['email_verification_status'] === 'verified';
    return [
        'user_id' => (string) $row['user_id'],
        'email' => (string) $row['email'],
        'display_name' => $row['display_name'] ?? null,
        'email_verified' => $verified,
        'email_verified_at' => $row['email_verified_at'] ?? null,
        'email_verification_status' => $verified ? 'verified' : (string) $row['email_verification_status'],
        'account_activation_status' => $verified ? 'active' : 'pending_email_verification',
    ];
}

function cpg_email_verification_verify_token(string $rawToken): array {
    $token = trim($rawToken);
    if ($token === '') {
        api_error(400, 'email_verification_token_required', 'verification token is required');
    }

    $result = api_query(
        'SELECT t.email_verification_token_id,
                t.user_id,
                t.email,
                t.token_state,
                t.expires_at,
                u.display_name,
                u.email_verified_at,
                u.email_verification_status
         FROM crewportglobal.email_verification_tokens t
         JOIN crewportglobal.users u ON u.user_id = t.user_id
         WHERE t.verification_token_hash = $1
           AND t.purpose = $2
         LIMIT 1',
        [cpg_email_verification_hash_token($token), CPG_EMAIL_VERIFICATION_PURPOSE]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(400, 'email_verification_token_invalid', 'Email verification token is invalid or expired');
    }

    $userId = (string) $row['user_id'];
    $email = (string) $row['email'];
    $tokenId = (string) $row['email_verification_token_id'];
    $expiresAt = strtotime((string) $row['expires_at']);
    if ($expiresAt === false || $expiresAt < time()) {
        api_query(
            "UPDATE crewportglobal.email_verification_tokens
             SET token_state = 'expired'
             WHERE email_verification_token_id = $1
               AND token_state = 'pending'",
            [$tokenId]
        );
        api_query(
            "UPDATE crewportglobal.users
             SET email_verification_status = CASE
               WHEN email_verified_at IS NOT NULL THEN 'verified'
               ELSE 'verification_expired'
             END,
                 updated_at = now()
             WHERE user_id = $1",
            [$userId]
        );
        write_audit_event('email_verification_token_expired', $userId, null, null, [
            'email' => $email,
            'token_id' => $tokenId,
        ], 'auth_email_verification');
        api_error(400, 'email_verification_token_expired', 'Email verification token is invalid or expired');
    }

    if ((string) $row['token_state'] !== 'pending') {
        api_error(400, 'email_verification_token_invalid', 'Email verification token is invalid or expired');
    }

    api_query(
        "UPDATE crewportglobal.email_verification_tokens
         SET token_state = 'used',
             used_at = now()
         WHERE email_verification_token_id = $1",
        [$tokenId]
    );

    $userResult = api_query(
        "UPDATE crewportglobal.users
         SET email_verified_at = COALESCE(email_verified_at, now()),
             email_verification_status = 'verified',
             updated_at = now()
         WHERE user_id = $1
           AND lower(email) = lower($2)
         RETURNING user_id, email, display_name, email_verified_at, email_verification_status, registration_status",
        [$userId, $email]
    );
    $userRow = pg_fetch_assoc($userResult);
    if (!is_array($userRow)) {
        api_error(404, 'email_verification_user_not_found', 'User was not found for this verification token');
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

    write_audit_event('email_verification_completed', $userId, null, null, [
        'email' => $email,
        'token_id' => $tokenId,
    ], 'auth_email_verification');

    return [
        'user' => $userRow,
        'email_verification' => cpg_email_verification_user_status($userId),
    ];
}
