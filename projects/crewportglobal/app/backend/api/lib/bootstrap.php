<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

function api_json(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_error(int $status, string $error, string $message): void {
    api_json($status, [
        'ok' => false,
        'error' => $error,
        'message' => $message,
    ]);
}

function api_decode_json_body(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') === false) {
        api_error(415, 'unsupported_media_type', 'Content-Type must be application/json');
    }

    $raw = file_get_contents('php://input') ?: '';
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        api_error(400, 'invalid_json', 'Invalid JSON payload');
    }

    return $decoded;
}

function api_normalize_email(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $email = mb_strtolower(trim($value));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return null;
    }

    return $email;
}

function api_normalize_uuid(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $uuid = strtolower(trim($value));
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuid)) {
        return null;
    }

    return $uuid;
}

function api_normalize_role(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $role = trim($value);
    $allowed = ['seafarer', 'employer', 'shipowner', 'crewing_manager'];
    return in_array($role, $allowed, true) ? $role : null;
}

/** @return PgSql\Connection */
function api_db(): PgSql\Connection {
    static $conn = null;
    if ($conn instanceof PgSql\Connection) {
        return $conn;
    }

    $host = getenv('PGHOST') ?: 'localhost';
    $port = getenv('PGPORT') ?: '5432';
    $dbName = getenv('PGDATABASE') ?: 'gtc_db';
    $user = getenv('PGUSER') ?: 'gtc_user';
    $password = getenv('PGPASSWORD') ?: 'gtc_pass';

    $connStr = sprintf('host=%s port=%s dbname=%s user=%s password=%s', $host, $port, $dbName, $user, $password);
    $conn = pg_connect($connStr);
    if (!$conn) {
        api_error(500, 'db_connect_error', 'Unable to connect to Postgres');
    }

    return $conn;
}

function api_query(string $sql, array $params = []): PgSql\Result {
    $result = pg_query_params(api_db(), $sql, $params);
    if (!$result) {
        api_error(500, 'db_query_error', pg_last_error(api_db()) ?: 'Database query failed');
    }

    return $result;
}

function api_tx_begin(): void {
    api_query('BEGIN');
}

function api_tx_commit(): void {
    api_query('COMMIT');
}

function api_tx_rollback(): void {
    @pg_query(api_db(), 'ROLLBACK');
}
