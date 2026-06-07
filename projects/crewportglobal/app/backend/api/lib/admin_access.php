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
    $escapedCode = htmlspecialchars($normalized, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $bodyText = "Your CrewPortGlobal admin access code is:\n\n{$normalized}\n\nThis code expires in 10 minutes.\nIf you did not request this code, ignore this message.";
    $bodyHtml = <<<HTML
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f6fbfd;color:#0f2638;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;border:1px solid #b7d7e4;border-radius:14px;background:#ffffff;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#0b3145;">CrewPortGlobal admin access code</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Your CrewPortGlobal admin access code is:</p>
      <div title="Select this code and copy it" style="margin:14px 0 18px;padding:18px 20px;border:2px solid #0b8fa3;border-radius:12px;background:#e9fbff;color:#073747;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;">
        {$escapedCode}
      </div>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#466274;">Select the code in the box to copy it. This code expires in 10 minutes.</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#466274;">If you did not request this code, ignore this message.</p>
    </div>
  </body>
</html>
HTML;

    return [
        'purpose' => CPG_ADMIN_ACCESS_PURPOSE,
        'to' => strtolower(trim($email)),
        'subject' => 'CrewPortGlobal admin access code',
        'body_text' => $bodyText,
        'body_html' => $bodyHtml,
        'expires_at' => $expiresAt,
    ];
}
