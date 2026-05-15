<?php

declare(strict_types=1);

const CPG_ADMIN_ACCESS_PURPOSE = 'admin_access';
const CPG_ADMIN_EMAIL_CODE_LENGTH = 6;
const CPG_ADMIN_EMAIL_CODE_TTL_SECONDS = 600;
const CPG_ADMIN_EMAIL_CODE_MAX_ATTEMPTS = 5;
const CPG_ADMIN_SESSION_TTL_SECONDS = 1800;

function cpg_admin_now(): DateTimeImmutable {
    return new DateTimeImmutable('now', new DateTimeZone('UTC'));
}

function cpg_admin_format_time(DateTimeImmutable $time): string {
    return $time->setTimezone(new DateTimeZone('UTC'))->format(DateTimeInterface::ATOM);
}

function cpg_admin_parse_time(?string $value): ?DateTimeImmutable {
    if (!is_string($value) || trim($value) === '') {
        return null;
    }

    try {
        return new DateTimeImmutable($value, new DateTimeZone('UTC'));
    } catch (Throwable) {
        return null;
    }
}

function cpg_admin_normalize_email_code(mixed $code): ?string {
    if (!is_string($code) && !is_int($code)) {
        return null;
    }

    $normalized = preg_replace('/\s+/', '', (string) $code);
    if (!is_string($normalized)) {
        return null;
    }

    return preg_match('/^[0-9]{6}$/', $normalized) === 1 ? $normalized : null;
}

function cpg_admin_generate_email_code(int $length = CPG_ADMIN_EMAIL_CODE_LENGTH): string {
    if ($length < 6 || $length > 12) {
        throw new InvalidArgumentException('Admin email code length must be between 6 and 12 digits');
    }

    $digits = '';
    for ($index = 0; $index < $length; $index += 1) {
        $digits .= (string) random_int(0, 9);
    }

    return $digits;
}

function cpg_admin_hash_email_code(string $code): string {
    $normalized = cpg_admin_normalize_email_code($code);
    if ($normalized === null) {
        throw new InvalidArgumentException('Admin email code must contain exactly 6 digits');
    }

    return password_hash($normalized, PASSWORD_DEFAULT);
}

function cpg_admin_verify_email_code(string $code, string $codeHash): bool {
    $normalized = cpg_admin_normalize_email_code($code);
    if ($normalized === null || trim($codeHash) === '') {
        return false;
    }

    return password_verify($normalized, $codeHash);
}

function cpg_admin_email_code_expires_at(?DateTimeImmutable $now = null): string {
    $base = $now ?? cpg_admin_now();
    return cpg_admin_format_time($base->modify('+' . CPG_ADMIN_EMAIL_CODE_TTL_SECONDS . ' seconds'));
}

function cpg_admin_session_expires_at(?DateTimeImmutable $now = null): string {
    $base = $now ?? cpg_admin_now();
    return cpg_admin_format_time($base->modify('+' . CPG_ADMIN_SESSION_TTL_SECONDS . ' seconds'));
}

function cpg_admin_is_expired(?string $expiresAt, ?DateTimeImmutable $now = null): bool {
    $expiry = cpg_admin_parse_time($expiresAt);
    if ($expiry === null) {
        return true;
    }

    $base = $now ?? cpg_admin_now();
    return $expiry <= $base;
}

function cpg_admin_attempts_remaining(int $attemptCount, int $maxAttempts = CPG_ADMIN_EMAIL_CODE_MAX_ATTEMPTS): int {
    return max(0, $maxAttempts - max(0, $attemptCount));
}

function cpg_admin_can_verify_email_code(int $attemptCount, ?string $expiresAt, ?DateTimeImmutable $now = null): bool {
    return cpg_admin_attempts_remaining($attemptCount) > 0
        && !cpg_admin_is_expired($expiresAt, $now);
}

function cpg_admin_mask_email(string $email): string {
    $normalized = strtolower(trim($email));
    if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
        return 'unknown-email';
    }

    [$local, $domain] = explode('@', $normalized, 2);
    $first = substr($local, 0, 1);
    $last = strlen($local) > 1 ? substr($local, -1) : '';

    return $first . '***' . $last . '@' . $domain;
}

function cpg_admin_email_code_message(string $email, string $code, ?DateTimeImmutable $now = null): array {
    $normalized = cpg_admin_normalize_email_code($code);
    if ($normalized === null) {
        throw new InvalidArgumentException('Admin email code must contain exactly 6 digits');
    }

    $expiresAt = cpg_admin_email_code_expires_at($now);

    return [
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'to' => strtolower(trim($email)),
        'subject' => 'CrewPortGlobal admin access code',
        'body_text' => "Your CrewPortGlobal admin access code is {$normalized}. It expires in 10 minutes.",
        'expires_at' => $expiresAt,
    ];
}
