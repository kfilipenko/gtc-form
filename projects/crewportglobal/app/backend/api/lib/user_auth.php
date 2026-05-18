<?php

declare(strict_types=1);

const CPG_USER_SESSION_COOKIE = 'cpg_user_session';
const CPG_USER_SESSION_TTL_SECONDS = 604800;
const CPG_AUTH_MIN_PASSWORD_LENGTH = 8;
const CPG_AUTH_MAX_PASSWORD_LENGTH = 200;

function cpg_auth_cookie_secure(): bool {
    $https = $_SERVER['HTTPS'] ?? '';
    if (is_string($https) && strtolower($https) === 'on') {
        return true;
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    return is_string($forwardedProto) && strtolower(trim($forwardedProto)) === 'https';
}

function cpg_auth_base64url(string $bytes): string {
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function cpg_auth_generate_session_token(): string {
    return cpg_auth_base64url(random_bytes(32));
}

function cpg_auth_hash_session_token(string $token): string {
    return hash('sha256', $token);
}

function cpg_auth_cookie_token(): ?string {
    $token = $_COOKIE[CPG_USER_SESSION_COOKIE] ?? null;
    if (!is_string($token)) {
        return null;
    }

    $token = trim($token);
    return $token === '' ? null : $token;
}

function cpg_auth_set_session_cookie(string $token, int $expiresAt): void {
    setcookie(CPG_USER_SESSION_COOKIE, $token, [
        'expires' => $expiresAt,
        'path' => '/',
        'secure' => cpg_auth_cookie_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function cpg_auth_clear_session_cookie(): void {
    setcookie(CPG_USER_SESSION_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => cpg_auth_cookie_secure(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function cpg_auth_request_metadata(): array {
    return [
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    ];
}

function cpg_auth_normalize_password(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $password = trim($value);
    $length = strlen($password);
    if ($length < CPG_AUTH_MIN_PASSWORD_LENGTH || $length > CPG_AUTH_MAX_PASSWORD_LENGTH) {
        return null;
    }

    return $password;
}

function cpg_auth_public_user_payload(array $row, ?string $role = null): array {
    $emailVerifiedAt = $row['email_verified_at'] ?? null;
    $emailVerificationStatus = isset($row['email_verification_status']) && is_string($row['email_verification_status'])
        ? (string) $row['email_verification_status']
        : ($emailVerifiedAt !== null ? 'verified' : 'unverified');
    $emailVerified = $emailVerifiedAt !== null || $emailVerificationStatus === 'verified';

    return [
        'user_id' => (string) $row['user_id'],
        'email' => (string) $row['email'],
        'display_name' => $row['display_name'] ?? null,
        'role' => $role,
        'registration_status' => $row['registration_status'] ?? null,
        'email_verified' => $emailVerified,
        'email_verified_at' => $emailVerifiedAt,
        'email_verification_status' => $emailVerified ? 'verified' : $emailVerificationStatus,
        'account_activation_status' => $emailVerified ? 'active' : 'pending_email_verification',
    ];
}

function cpg_auth_create_session(string $userId): array {
    $token = cpg_auth_generate_session_token();
    $tokenHash = cpg_auth_hash_session_token($token);
    $expiresAtUnix = time() + CPG_USER_SESSION_TTL_SECONDS;
    $expiresAt = gmdate('c', $expiresAtUnix);
    $metadata = cpg_auth_request_metadata();

    $result = api_query(
        'INSERT INTO crewportglobal.user_sessions (
           user_id, session_token_hash, expires_at, ip_address, user_agent
         ) VALUES ($1, $2, $3::timestamptz, $4::inet, $5)
         RETURNING session_id, expires_at',
        [
            $userId,
            $tokenHash,
            $expiresAt,
            $metadata['ip_address'],
            $metadata['user_agent'],
        ]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        api_error(500, 'session_create_failed', 'Unable to create session');
    }

    cpg_auth_set_session_cookie($token, $expiresAtUnix);

    return [
        'session_id' => (string) $row['session_id'],
        'expires_at' => (string) $row['expires_at'],
    ];
}

function cpg_auth_find_active_session(?string $token = null): ?array {
    $rawToken = $token ?? cpg_auth_cookie_token();
    if ($rawToken === null) {
        return null;
    }

    $result = api_query(
        'SELECT s.session_id,
                s.user_id,
                s.expires_at,
                u.email,
                u.display_name,
                u.email_verified_at,
                u.email_verification_status,
                u.registration_status,
                u.is_active
         FROM crewportglobal.user_sessions s
         JOIN crewportglobal.users u ON u.user_id = s.user_id
         WHERE s.session_token_hash = $1
           AND s.revoked_at IS NULL
           AND s.expires_at > now()
           AND u.is_active = TRUE
         LIMIT 1',
        [cpg_auth_hash_session_token($rawToken)]
    );
    $row = pg_fetch_assoc($result);
    if (!is_array($row)) {
        return null;
    }

    api_query(
        'UPDATE crewportglobal.user_sessions
         SET last_used_at = now()
         WHERE session_id = $1',
        [(string) $row['session_id']]
    );

    return $row;
}

function cpg_auth_revoke_current_session(): void {
    $token = cpg_auth_cookie_token();
    if ($token !== null) {
        api_query(
            'UPDATE crewportglobal.user_sessions
             SET revoked_at = COALESCE(revoked_at, now())
             WHERE session_token_hash = $1
               AND revoked_at IS NULL',
            [cpg_auth_hash_session_token($token)]
        );
    }

    cpg_auth_clear_session_cookie();
}
