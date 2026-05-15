<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';

const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_LEGACY_ENV = 'CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED = 'disabled';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE = 'capture';

interface CpgAdminAccessEmailDelivery {
    public function sendAdminEmailCode(array $message): array;
}

function cpg_admin_access_email_delivery_env_value(string $name, ?array $env = null): ?string {
    if (is_array($env) && array_key_exists($name, $env)) {
        $value = $env[$name];
        return is_string($value) ? trim($value) : null;
    }

    $value = getenv($name);
    return is_string($value) ? trim($value) : null;
}

function cpg_admin_access_email_delivery_mode(?array $env = null): string {
    $value = cpg_admin_access_email_delivery_env_value(CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV, $env);
    if ($value === null || $value === '') {
        $value = cpg_admin_access_email_delivery_env_value(CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_LEGACY_ENV, $env);
    }

    if ($value === null || $value === '') {
        return CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED;
    }

    $normalized = strtolower(trim($value));
    if (in_array($normalized, ['0', 'false', 'off', 'none', 'disabled'], true)) {
        return CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED;
    }

    if (in_array($normalized, ['capture', 'test', 'test_capture'], true)) {
        return CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE;
    }

    return 'invalid';
}

function cpg_admin_access_email_delivery_status(?array $env = null): array {
    $mode = cpg_admin_access_email_delivery_mode($env);
    if ($mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE) {
        return [
            'ok' => true,
            'mode' => $mode,
            'error' => null,
        ];
    }

    if ($mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED) {
        return [
            'ok' => false,
            'mode' => $mode,
            'error' => 'admin_access_email_delivery_not_configured',
        ];
    }

    return [
        'ok' => false,
        'mode' => $mode,
        'error' => 'admin_access_email_delivery_mode_invalid',
    ];
}

function cpg_admin_access_email_delivery_disabled_response(?array $env = null): ?array {
    $status = cpg_admin_access_email_delivery_status($env);
    if (($status['ok'] ?? false) === true) {
        return null;
    }

    $error = (string) ($status['error'] ?? 'admin_access_email_delivery_not_configured');
    $message = $error === 'admin_access_email_delivery_mode_invalid'
        ? 'Admin access email delivery mode is invalid'
        : 'Admin access email delivery is not configured yet';

    return [
        'status' => 503,
        'payload' => [
            'ok' => false,
            'error' => $error,
            'message' => $message,
        ],
    ];
}

function cpg_admin_access_email_delivery_required_string(array $message, string $key): string {
    $value = $message[$key] ?? null;
    if (!is_string($value) || trim($value) === '') {
        throw new InvalidArgumentException("Admin access email delivery message is missing {$key}");
    }

    return trim($value);
}

function cpg_admin_access_email_delivery_validate_message(array $message): array {
    $to = strtolower(cpg_admin_access_email_delivery_required_string($message, 'to'));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Admin access email delivery recipient must be a valid email');
    }

    $purpose = cpg_admin_access_email_delivery_required_string($message, 'purpose');
    if ($purpose !== CPG_ADMIN_ACCESS_PURPOSE) {
        throw new InvalidArgumentException('Admin access email delivery purpose must be admin_access');
    }

    return [
        'purpose' => $purpose,
        'to' => $to,
        'subject' => cpg_admin_access_email_delivery_required_string($message, 'subject'),
        'body_text' => cpg_admin_access_email_delivery_required_string($message, 'body_text'),
        'expires_at' => cpg_admin_access_email_delivery_required_string($message, 'expires_at'),
    ];
}

function cpg_admin_access_email_delivery_safe_summary(array $message): array {
    $validated = cpg_admin_access_email_delivery_validate_message($message);

    return [
        'purpose' => $validated['purpose'],
        'masked_to' => cpg_admin_mask_email($validated['to']),
        'subject' => $validated['subject'],
        'expires_at' => $validated['expires_at'],
        'body_text_length' => strlen($validated['body_text']),
    ];
}

final class CpgAdminAccessCaptureEmailDelivery implements CpgAdminAccessEmailDelivery {
    /** @var array<int, array> */
    private array $messages = [];

    private ?Closure $sink;

    public function __construct(?callable $sink = null) {
        $this->sink = $sink === null ? null : Closure::fromCallable($sink);
    }

    public function sendAdminEmailCode(array $message): array {
        $validated = cpg_admin_access_email_delivery_validate_message($message);
        $this->messages[] = $validated;

        if ($this->sink !== null) {
            ($this->sink)($validated);
        }

        $summary = cpg_admin_access_email_delivery_safe_summary($validated);

        return [
            'ok' => true,
            'delivery_status' => 'captured_test_only',
            'message_id' => 'capture-' . count($this->messages),
            'purpose' => $summary['purpose'],
            'masked_to' => $summary['masked_to'],
            'expires_at' => $summary['expires_at'],
        ];
    }

    public function capturedMessages(): array {
        return $this->messages;
    }
}

function cpg_admin_access_create_email_delivery(?array $env = null, ?callable $sink = null): ?CpgAdminAccessEmailDelivery {
    $status = cpg_admin_access_email_delivery_status($env);
    if (($status['ok'] ?? false) !== true) {
        return null;
    }

    if (($status['mode'] ?? null) === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE) {
        return new CpgAdminAccessCaptureEmailDelivery($sink);
    }

    throw new RuntimeException('Unsupported admin access email delivery mode');
}
