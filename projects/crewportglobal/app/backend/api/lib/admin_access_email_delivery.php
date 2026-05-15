<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_access.php';

const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_LEGACY_ENV = 'CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE';
const CPG_ADMIN_ACCESS_EMAIL_ENABLED_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED';
const CPG_ADMIN_ACCESS_EMAIL_ENABLED_LEGACY_ENV = 'CPG_ADMIN_ACCESS_EMAIL_ENABLED';
const CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_ENV = 'CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED';
const CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_LEGACY_ENV = 'CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED = 'disabled';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE = 'capture';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT = 'smtp_configured_but_not_sent';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY = 'smtp_send_ready';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_DISABLED = 'admin_email_delivery_disabled';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_CONFIG_INCOMPLETE = 'admin_email_delivery_config_incomplete';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_MESSAGE_READY = 'admin_email_delivery_message_ready';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_NOT_ENABLED = 'admin_email_delivery_send_not_enabled';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SENT = 'admin_email_delivery_sent';
const CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_FAILED = 'admin_email_delivery_send_failed';
const CPG_ADMIN_ACCESS_PROTECTED_ENV_FILE = '/etc/crewportglobal/admin-access.env';
const CPG_ADMIN_ACCESS_SMTP_HOST_ENV = 'CREWPORTGLOBAL_SMTP_HOST';
const CPG_ADMIN_ACCESS_SMTP_PORT_ENV = 'CREWPORTGLOBAL_SMTP_PORT';
const CPG_ADMIN_ACCESS_SMTP_SECURITY_ENV = 'CREWPORTGLOBAL_SMTP_SECURITY';
const CPG_ADMIN_ACCESS_SMTP_USERNAME_ENV = 'CREWPORTGLOBAL_SMTP_USERNAME';
const CPG_ADMIN_ACCESS_SMTP_PASSWORD_ENV = 'CREWPORTGLOBAL_SMTP_PASSWORD';
const CPG_ADMIN_ACCESS_SMTP_FROM_EMAIL_ENV = 'CREWPORTGLOBAL_SMTP_FROM_EMAIL';
const CPG_ADMIN_ACCESS_SMTP_FROM_NAME_ENV = 'CREWPORTGLOBAL_SMTP_FROM_NAME';
const CPG_ADMIN_ACCESS_SMTP_HOST_LEGACY_ENV = 'CPG_SMTP_HOST';
const CPG_ADMIN_ACCESS_SMTP_PORT_LEGACY_ENV = 'CPG_SMTP_PORT';
const CPG_ADMIN_ACCESS_SMTP_SECURITY_LEGACY_ENV = 'CPG_SMTP_SECURITY';
const CPG_ADMIN_ACCESS_SMTP_USERNAME_LEGACY_ENV = 'CPG_SMTP_USERNAME';
const CPG_ADMIN_ACCESS_SMTP_PASSWORD_LEGACY_ENV = 'CPG_SMTP_PASSWORD';
const CPG_ADMIN_ACCESS_SMTP_FROM_EMAIL_LEGACY_ENV = 'CPG_SMTP_FROM_EMAIL';
const CPG_ADMIN_ACCESS_SMTP_FROM_NAME_LEGACY_ENV = 'CPG_SMTP_FROM_NAME';
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_HOST = 'smtp.timeweb.ru';
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_PORT = 465;
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_SECURITY = 'ssl';
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_USERNAME = 'not_reply@crewportglobal.com';
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_EMAIL = 'not_reply@crewportglobal.com';
const CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_NAME = 'CrewPortGlobal Security';
const CPG_ADMIN_ACCESS_SMTP_TIMEOUT_SECONDS = 20;

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

function cpg_admin_access_email_delivery_bool_env(string $name, ?array $env = null): bool {
    $value = cpg_admin_access_email_delivery_env_value($name, $env);
    if ($value === null) {
        return false;
    }

    return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on', 'enabled'], true);
}

function cpg_admin_access_parse_env_file_value(string $value): string {
    $trimmed = trim($value);
    if ($trimmed === '') {
        return '';
    }

    $quote = substr($trimmed, 0, 1);
    if (($quote === '"' || $quote === "'") && substr($trimmed, -1) === $quote) {
        $inner = substr($trimmed, 1, -1);
        return $quote === '"' ? stripcslashes($inner) : $inner;
    }

    return $trimmed;
}

function cpg_admin_access_load_protected_env_file(
    string $path = CPG_ADMIN_ACCESS_PROTECTED_ENV_FILE,
    bool $override = false
): array {
    if (!is_file($path) || !is_readable($path)) {
        return [
            'ok' => false,
            'path' => $path,
            'loaded_keys' => [],
            'error' => 'admin_access_env_file_not_readable',
        ];
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return [
            'ok' => false,
            'path' => $path,
            'loaded_keys' => [],
            'error' => 'admin_access_env_file_read_failed',
        ];
    }

    $loadedKeys = [];
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        if (preg_match('/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/', $line, $matches) !== 1) {
            continue;
        }

        $key = $matches[1];
        $value = cpg_admin_access_parse_env_file_value($matches[2]);
        if (!$override && getenv($key) !== false) {
            continue;
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        $loadedKeys[] = $key;
    }

    sort($loadedKeys);

    return [
        'ok' => true,
        'path' => $path,
        'loaded_keys' => $loadedKeys,
        'error' => null,
    ];
}

function cpg_admin_access_email_enabled(?array $env = null): bool {
    return cpg_admin_access_email_delivery_bool_env(CPG_ADMIN_ACCESS_EMAIL_ENABLED_ENV, $env)
        || cpg_admin_access_email_delivery_bool_env(CPG_ADMIN_ACCESS_EMAIL_ENABLED_LEGACY_ENV, $env);
}

function cpg_admin_access_smtp_send_enabled(?array $env = null): bool {
    return cpg_admin_access_email_delivery_bool_env(CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_ENV, $env)
        || cpg_admin_access_email_delivery_bool_env(CPG_ADMIN_ACCESS_SMTP_SEND_ENABLED_LEGACY_ENV, $env);
}

function cpg_admin_access_email_delivery_config_value(
    string $modernKey,
    string $legacyKey,
    string|int|null $default,
    ?array $env = null
): ?string {
    $value = cpg_admin_access_email_delivery_env_value($modernKey, $env);
    if ($value === null || $value === '') {
        $value = cpg_admin_access_email_delivery_env_value($legacyKey, $env);
    }

    if (($value === null || $value === '') && $default !== null) {
        return (string) $default;
    }

    return $value === '' ? null : $value;
}

function cpg_admin_access_smtp_config(?array $env = null): array {
    $port = cpg_admin_access_email_delivery_config_value(
        CPG_ADMIN_ACCESS_SMTP_PORT_ENV,
        CPG_ADMIN_ACCESS_SMTP_PORT_LEGACY_ENV,
        CPG_ADMIN_ACCESS_SMTP_DEFAULT_PORT,
        $env
    );
    $security = strtolower((string) cpg_admin_access_email_delivery_config_value(
        CPG_ADMIN_ACCESS_SMTP_SECURITY_ENV,
        CPG_ADMIN_ACCESS_SMTP_SECURITY_LEGACY_ENV,
        CPG_ADMIN_ACCESS_SMTP_DEFAULT_SECURITY,
        $env
    ));
    $password = cpg_admin_access_email_delivery_config_value(
        CPG_ADMIN_ACCESS_SMTP_PASSWORD_ENV,
        CPG_ADMIN_ACCESS_SMTP_PASSWORD_LEGACY_ENV,
        null,
        $env
    );

    return [
        'host' => cpg_admin_access_email_delivery_config_value(
            CPG_ADMIN_ACCESS_SMTP_HOST_ENV,
            CPG_ADMIN_ACCESS_SMTP_HOST_LEGACY_ENV,
            CPG_ADMIN_ACCESS_SMTP_DEFAULT_HOST,
            $env
        ),
        'port' => is_numeric($port) ? (int) $port : null,
        'security' => $security,
        'username' => cpg_admin_access_email_delivery_config_value(
            CPG_ADMIN_ACCESS_SMTP_USERNAME_ENV,
            CPG_ADMIN_ACCESS_SMTP_USERNAME_LEGACY_ENV,
            CPG_ADMIN_ACCESS_SMTP_DEFAULT_USERNAME,
            $env
        ),
        'password' => $password,
        'from_email' => cpg_admin_access_email_delivery_config_value(
            CPG_ADMIN_ACCESS_SMTP_FROM_EMAIL_ENV,
            CPG_ADMIN_ACCESS_SMTP_FROM_EMAIL_LEGACY_ENV,
            CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_EMAIL,
            $env
        ),
        'from_name' => cpg_admin_access_email_delivery_config_value(
            CPG_ADMIN_ACCESS_SMTP_FROM_NAME_ENV,
            CPG_ADMIN_ACCESS_SMTP_FROM_NAME_LEGACY_ENV,
            CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_NAME,
            $env
        ),
        'password_present' => is_string($password) && trim($password) !== '',
    ];
}

function cpg_admin_access_smtp_config_missing_keys(array $config): array {
    $missing = [];
    foreach (['host', 'port', 'username', 'from_email'] as $key) {
        if (!isset($config[$key]) || trim((string) $config[$key]) === '') {
            $missing[] = $key;
        }
    }

    if (($config['password_present'] ?? false) !== true) {
        $missing[] = 'password';
    }

    if (!filter_var((string) ($config['from_email'] ?? ''), FILTER_VALIDATE_EMAIL)) {
        $missing[] = 'from_email_valid';
    }

    if (!in_array((string) ($config['security'] ?? ''), ['ssl', 'tls'], true)) {
        $missing[] = 'security';
    }

    $port = $config['port'] ?? null;
    if (!is_int($port) || $port < 1 || $port > 65535) {
        $missing[] = 'port';
    }

    return array_values(array_unique($missing));
}

function cpg_admin_access_smtp_config_safe_summary(array $config): array {
    return [
        'host' => (string) ($config['host'] ?? ''),
        'port' => $config['port'] ?? null,
        'security' => (string) ($config['security'] ?? ''),
        'username' => (string) ($config['username'] ?? ''),
        'from_email' => (string) ($config['from_email'] ?? ''),
        'from_name' => (string) ($config['from_name'] ?? ''),
        'password_present' => ($config['password_present'] ?? false) === true,
    ];
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

    if (in_array($normalized, ['smtp_configured_but_not_sent', 'smtp_not_sent', 'smtp'], true)) {
        return CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT;
    }

    if (in_array($normalized, ['smtp_send_ready', 'smtp_ready'], true)) {
        return CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY;
    }

    return 'invalid';
}

function cpg_admin_access_email_delivery_status(?array $env = null): array {
    $mode = cpg_admin_access_email_delivery_mode($env);
    $emailEnabled = cpg_admin_access_email_enabled($env);
    if ($mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_CAPTURE) {
        return [
            'ok' => true,
            'mode' => $mode,
            'code' => 'captured_test_only',
            'error' => null,
        ];
    }

    if (!$emailEnabled) {
        return [
            'ok' => false,
            'mode' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED,
            'code' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_DISABLED,
            'error' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_DISABLED,
        ];
    }

    if ($mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_DISABLED) {
        $mode = CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT;
    }

    if (in_array($mode, [CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT, CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY], true)) {
        $config = cpg_admin_access_smtp_config($env);
        $missing = cpg_admin_access_smtp_config_missing_keys($config);
        if ($missing !== []) {
            return [
                'ok' => false,
                'mode' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT,
                'code' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_CONFIG_INCOMPLETE,
                'error' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_CONFIG_INCOMPLETE,
                'missing_config' => $missing,
                'smtp' => cpg_admin_access_smtp_config_safe_summary($config),
            ];
        }

        $sendEnabled = cpg_admin_access_smtp_send_enabled($env);
        return [
            'ok' => true,
            'mode' => $sendEnabled && $mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY
                ? CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY
                : CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT,
            'code' => $sendEnabled && $mode === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY
                ? CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_MESSAGE_READY
                : CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_NOT_ENABLED,
            'error' => null,
            'smtp' => cpg_admin_access_smtp_config_safe_summary($config),
        ];
    }

    return [
        'ok' => false,
        'mode' => $mode,
        'code' => 'admin_email_delivery_mode_invalid',
        'error' => 'admin_email_delivery_mode_invalid',
    ];
}

function cpg_admin_access_email_delivery_disabled_response(?array $env = null): ?array {
    $status = cpg_admin_access_email_delivery_status($env);
    if (($status['ok'] ?? false) === true) {
        return null;
    }

    $error = (string) ($status['error'] ?? CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_DISABLED);
    $message = $error === 'admin_email_delivery_mode_invalid'
        ? 'Admin access email delivery mode is invalid'
        : ($error === CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_CONFIG_INCOMPLETE
            ? 'Admin access SMTP configuration is incomplete'
            : 'Admin access email delivery is disabled');

    return [
        'status' => 503,
        'payload' => [
            'ok' => false,
            'error' => $error,
            'message' => $message,
            'missing_config' => $status['missing_config'] ?? [],
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

function cpg_admin_access_build_smtp_message(array $message, array $config): array {
    $validated = cpg_admin_access_email_delivery_validate_message($message);
    $safeConfig = cpg_admin_access_smtp_config_safe_summary($config);
    $fromEmail = (string) ($safeConfig['from_email'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_EMAIL);
    $fromName = (string) ($safeConfig['from_name'] ?? CPG_ADMIN_ACCESS_SMTP_DEFAULT_FROM_NAME);

    return [
        'transport' => [
            'host' => $safeConfig['host'],
            'port' => $safeConfig['port'],
            'security' => $safeConfig['security'],
            'username' => $safeConfig['username'],
            'password_present' => $safeConfig['password_present'],
        ],
        'envelope' => [
            'from_email' => $fromEmail,
            'from_name' => $fromName,
            'to' => $validated['to'],
            'subject' => $validated['subject'],
        ],
        'headers' => [
            'From' => sprintf('%s <%s>', $fromName, $fromEmail),
            'To' => $validated['to'],
            'Subject' => $validated['subject'],
            'Content-Type' => 'text/plain; charset=UTF-8',
        ],
        'body_text' => $validated['body_text'],
        'expires_at' => $validated['expires_at'],
    ];
}

function cpg_admin_access_smtp_clean_header_value(string $value): string {
    return trim(str_replace(["\r", "\n"], '', $value));
}

function cpg_admin_access_smtp_message_id(string $fromEmail): string {
    $domain = 'crewportglobal.com';
    $atPosition = strrpos($fromEmail, '@');
    if ($atPosition !== false) {
        $candidate = substr($fromEmail, $atPosition + 1);
        if (is_string($candidate) && preg_match('/^[A-Za-z0-9.-]+$/', $candidate) === 1) {
            $domain = strtolower($candidate);
        }
    }

    return sprintf(
        '<cpg-admin-%s-%s@%s>',
        gmdate('YmdHis'),
        bin2hex(random_bytes(8)),
        $domain
    );
}

function cpg_admin_access_smtp_dot_stuff(string $value): string {
    $normalized = str_replace(["\r\n", "\r"], "\n", $value);
    $lines = explode("\n", $normalized);
    foreach ($lines as $index => $line) {
        if (str_starts_with($line, '.')) {
            $lines[$index] = '.' . $line;
        }
    }

    return implode("\r\n", $lines);
}

function cpg_admin_access_smtp_raw_message(array $prepared, string $messageId): string {
    $headers = $prepared['headers'] ?? [];
    $bodyText = (string) ($prepared['body_text'] ?? '');

    $headerLines = [
        'Date: ' . gmdate('D, d M Y H:i:s') . ' +0000',
        'Message-ID: ' . cpg_admin_access_smtp_clean_header_value($messageId),
        'From: ' . cpg_admin_access_smtp_clean_header_value((string) ($headers['From'] ?? '')),
        'To: ' . cpg_admin_access_smtp_clean_header_value((string) ($headers['To'] ?? '')),
        'Subject: ' . cpg_admin_access_smtp_clean_header_value((string) ($headers['Subject'] ?? '')),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];

    return implode("\r\n", $headerLines) . "\r\n\r\n" . cpg_admin_access_smtp_dot_stuff($bodyText) . "\r\n";
}

function cpg_admin_access_smtp_read_response(mixed $socket, string $context): array {
    $lines = [];
    while (!feof($socket)) {
        $line = fgets($socket, 2048);
        if ($line === false) {
            break;
        }

        $line = rtrim($line, "\r\n");
        $lines[] = $line;
        if (preg_match('/^([0-9]{3})([\s-])/', $line, $matches) === 1 && $matches[2] === ' ') {
            return [
                'code' => (int) $matches[1],
                'context' => $context,
                'line_count' => count($lines),
            ];
        }

        if (count($lines) > 100) {
            break;
        }
    }

    throw new RuntimeException('Admin access SMTP response failed during ' . $context);
}

function cpg_admin_access_smtp_expect(mixed $socket, array $expectedCodes, string $context): array {
    $response = cpg_admin_access_smtp_read_response($socket, $context);
    if (!in_array((int) $response['code'], $expectedCodes, true)) {
        throw new RuntimeException(sprintf(
            'Admin access SMTP command failed during %s with response code %d',
            $context,
            (int) $response['code']
        ));
    }

    return $response;
}

function cpg_admin_access_smtp_write_line(mixed $socket, string $line, string $context): void {
    $written = fwrite($socket, $line . "\r\n");
    if ($written === false) {
        throw new RuntimeException('Admin access SMTP write failed during ' . $context);
    }
}

function cpg_admin_access_smtp_command(
    mixed $socket,
    string $line,
    array $expectedCodes,
    string $context
): array {
    cpg_admin_access_smtp_write_line($socket, $line, $context);
    return cpg_admin_access_smtp_expect($socket, $expectedCodes, $context);
}

function cpg_admin_access_smtp_send_prepared_message(array $prepared, array $config): string {
    $host = (string) ($config['host'] ?? '');
    $port = (int) ($config['port'] ?? 0);
    $security = (string) ($config['security'] ?? '');
    $username = (string) ($config['username'] ?? '');
    $password = (string) ($config['password'] ?? '');
    $fromEmail = (string) ($prepared['envelope']['from_email'] ?? '');
    $toEmail = (string) ($prepared['envelope']['to'] ?? '');
    $messageId = cpg_admin_access_smtp_message_id($fromEmail);
    $rawMessage = cpg_admin_access_smtp_raw_message($prepared, $messageId);

    if ($host === '' || $port < 1 || $username === '' || $password === '' || $fromEmail === '' || $toEmail === '') {
        throw new RuntimeException('Admin access SMTP send configuration is incomplete');
    }

    $scheme = $security === 'ssl' ? 'ssl' : 'tcp';
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'peer_name' => $host,
        ],
    ]);

    $socket = @stream_socket_client(
        sprintf('%s://%s:%d', $scheme, $host, $port),
        $errorCode,
        $errorMessage,
        CPG_ADMIN_ACCESS_SMTP_TIMEOUT_SECONDS,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!is_resource($socket)) {
        throw new RuntimeException('Admin access SMTP connection failed');
    }

    try {
        stream_set_timeout($socket, CPG_ADMIN_ACCESS_SMTP_TIMEOUT_SECONDS);
        $ehloName = gethostname();
        if (!is_string($ehloName) || trim($ehloName) === '') {
            $ehloName = 'crewportglobal.com';
        }

        cpg_admin_access_smtp_expect($socket, [220], 'connect');
        cpg_admin_access_smtp_command($socket, 'EHLO ' . $ehloName, [250], 'ehlo');

        if ($security === 'tls') {
            cpg_admin_access_smtp_command($socket, 'STARTTLS', [220], 'starttls');
            $cryptoEnabled = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($cryptoEnabled !== true) {
                throw new RuntimeException('Admin access SMTP TLS negotiation failed');
            }

            cpg_admin_access_smtp_command($socket, 'EHLO ' . $ehloName, [250], 'ehlo_after_starttls');
        }

        cpg_admin_access_smtp_command($socket, 'AUTH LOGIN', [334], 'auth_login');
        cpg_admin_access_smtp_command($socket, base64_encode($username), [334], 'auth_username');
        cpg_admin_access_smtp_command($socket, base64_encode($password), [235], 'auth_password');
        cpg_admin_access_smtp_command($socket, 'MAIL FROM:<' . $fromEmail . '>', [250], 'mail_from');
        cpg_admin_access_smtp_command($socket, 'RCPT TO:<' . $toEmail . '>', [250, 251], 'rcpt_to');
        cpg_admin_access_smtp_command($socket, 'DATA', [354], 'data');
        cpg_admin_access_smtp_write_line($socket, $rawMessage . '.', 'message_data');
        cpg_admin_access_smtp_expect($socket, [250], 'message_accepted');
        cpg_admin_access_smtp_command($socket, 'QUIT', [221], 'quit');
    } finally {
        fclose($socket);
    }

    return $messageId;
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

final class CpgAdminAccessSmtpPreparedEmailDelivery implements CpgAdminAccessEmailDelivery {
    private array $config;

    private string $mode;

    /** @var array<int, array> */
    private array $preparedMessages = [];

    public function __construct(array $config, string $mode = CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT) {
        $this->config = $config;
        $this->mode = $mode;
    }

    public function sendAdminEmailCode(array $message): array {
        $prepared = cpg_admin_access_build_smtp_message($message, $this->config);
        $summary = cpg_admin_access_email_delivery_safe_summary($message);
        $this->preparedMessages[] = [
            'summary' => $summary,
            'smtp' => cpg_admin_access_smtp_config_safe_summary($this->config),
            'mode' => $this->mode,
        ];

        $baseResult = [
            'mode' => $this->mode,
            'purpose' => $summary['purpose'],
            'masked_to' => $summary['masked_to'],
            'from_email' => (string) ($this->config['from_email'] ?? ''),
            'from_name' => (string) ($this->config['from_name'] ?? ''),
            'smtp_host' => (string) ($this->config['host'] ?? ''),
            'smtp_port' => $this->config['port'] ?? null,
            'smtp_security' => (string) ($this->config['security'] ?? ''),
            'expires_at' => $summary['expires_at'],
        ];

        if ($this->mode !== CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY) {
            return array_merge($baseResult, [
                'ok' => true,
                'delivery_status' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_NOT_ENABLED,
                'real_send_performed' => false,
            ]);
        }

        try {
            $messageId = cpg_admin_access_smtp_send_prepared_message($prepared, $this->config);

            return array_merge($baseResult, [
                'ok' => true,
                'delivery_status' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SENT,
                'message_id' => $messageId,
                'real_send_performed' => true,
            ]);
        } catch (Throwable) {
            return array_merge($baseResult, [
                'ok' => false,
                'delivery_status' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_FAILED,
                'error' => CPG_ADMIN_ACCESS_EMAIL_DELIVERY_CODE_SEND_FAILED,
                'real_send_performed' => false,
            ]);
        }
    }

    public function preparedMessages(): array {
        return $this->preparedMessages;
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

    if (in_array(($status['mode'] ?? null), [
        CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_NOT_SENT,
        CPG_ADMIN_ACCESS_EMAIL_DELIVERY_MODE_SMTP_READY,
    ], true)) {
        return new CpgAdminAccessSmtpPreparedEmailDelivery(
            cpg_admin_access_smtp_config($env),
            (string) $status['mode']
        );
    }

    throw new RuntimeException('Unsupported admin access email delivery mode');
}
