<?php
declare(strict_types=1);

// Shared helpers for chat PHP entrypoints (chat_api.php + /chat/api/*).
date_default_timezone_set('UTC');

function respond_json(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_error(int $status, string $error, string $message): void {
    respond_json($status, [
        'success' => false,
        'error' => $error,
        'message' => $message
    ]);
}

function normalize_gtc_user_id(mixed $value): ?string {
    if ($value === null) {
        return null;
    }
    if (is_int($value) || is_float($value)) {
        $intVal = (int) $value;
        return $intVal > 0 ? (string) $intVal : null;
    }
    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed === '' || !preg_match('/^-?\d+$/', $trimmed)) {
            return null;
        }
        $intVal = (int) $trimmed;
        return $intVal > 0 ? (string) $intVal : null;
    }
    return null;
}

function normalize_uuid(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }
    $normalized = trim($value);
    if ($normalized === '') {
        return null;
    }
    if (!preg_match('/^[0-9a-fA-F-]{32,36}$/', $normalized)) {
        return null;
    }
    return strtolower($normalized);
}

/** @return PgSql\Connection */
function db(): PgSql\Connection {
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
        respond_error(500, 'db_error', 'Unable to connect to Postgres.');
    }
    return $conn;
}
