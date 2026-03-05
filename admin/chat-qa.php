<?php declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    respond(405, ['success' => false, 'error' => 'method_not_allowed']);
}

$limit = int_param('limit', 50, 1, 200);
$chatId = str_param('chat_id');
$search = str_param('q');

if ($chatId !== null && !preg_match('/^[0-9a-fA-F-]{32,36}$/', $chatId)) {
    respond(400, ['success' => false, 'error' => 'invalid_chat_id']);
}

$conn = open_pg_connection();
if (!$conn) {
    respond(500, ['success' => false, 'error' => 'db_unavailable']);
}

$filters = [];
$params = [];
$idx = 1;

if ($chatId !== null) {
    $filters[] = "chat_id = $" . $idx;
    $params[] = strtolower(trim($chatId));
    $idx++;
}

if ($search !== null) {
    $filters[] = "(question ILIKE $" . $idx . " OR answer ILIKE $" . $idx . ')';
    $params[] = '%' . $search . '%';
    $idx++;
}

$whereSql = $filters === [] ? '' : ('WHERE ' . implode(' AND ', $filters));

$limitPlaceholder = '$' . $idx;
$params[] = $limit;

$sql = "
WITH pairs AS (
  SELECT
    u.chat_id::text AS chat_id,
    u.content AS question,
        a.message_id::text AS assistant_message_id,
    a.content AS answer,
        COALESCE(a.feedback_like_count, 0) AS like_count,
        COALESCE(a.feedback_dislike_count, 0) AS dislike_count,
    u.created_at AS asked_at,
    a.created_at AS answered_at
  FROM anon_chat_messages u
  JOIN LATERAL (
        SELECT message_id, content, created_at, feedback_like_count, feedback_dislike_count
    FROM anon_chat_messages a
    WHERE a.chat_id = u.chat_id
      AND a.role = 'assistant'
      AND a.created_at >= u.created_at
    ORDER BY a.created_at ASC
    LIMIT 1
  ) a ON true
  WHERE u.role = 'user'
)
SELECT chat_id, question, assistant_message_id, answer, like_count, dislike_count, asked_at, answered_at
FROM pairs
$whereSql
ORDER BY answered_at DESC, asked_at DESC
LIMIT $limitPlaceholder
";

$result = @pg_query_params($conn, $sql, $params);
if (!$result) {
    respond(500, ['success' => false, 'error' => 'query_failed']);
}

$items = [];
while ($row = pg_fetch_assoc($result)) {
    if (!is_array($row)) {
        continue;
    }
    $items[] = [
        'chat_id' => (string) ($row['chat_id'] ?? ''),
        'question' => trim((string) ($row['question'] ?? '')),
        'assistant_message_id' => (string) ($row['assistant_message_id'] ?? ''),
        'answer' => trim((string) ($row['answer'] ?? '')),
        'like_count' => (int) ($row['like_count'] ?? 0),
        'dislike_count' => (int) ($row['dislike_count'] ?? 0),
        'asked_at' => (string) ($row['asked_at'] ?? ''),
        'answered_at' => (string) ($row['answered_at'] ?? ''),
    ];
}

$stats = [
    'user_messages' => role_count($conn, 'user'),
    'assistant_messages' => role_count($conn, 'assistant'),
    'pairs_found' => count($items),
];

respond(200, [
    'success' => true,
    'items' => $items,
    'stats' => $stats,
]);

function role_count($conn, string $role): int
{
    $res = @pg_query_params($conn, 'SELECT COUNT(*)::int AS c FROM anon_chat_messages WHERE role = $1', [$role]);
    if (!$res) {
        return 0;
    }
    $row = pg_fetch_assoc($res);
    if (!is_array($row)) {
        return 0;
    }
    return (int) ($row['c'] ?? 0);
}

function open_pg_connection()
{
    static $conn = null;
    if ($conn) {
        return $conn;
    }
    $host = getenv('PGHOST') ?: 'localhost';
    $port = getenv('PGPORT') ?: '5432';
    $dbName = getenv('PGDATABASE') ?: 'gtc_db';
    $user = getenv('PGUSER') ?: 'gtc_user';
    $password = getenv('PGPASSWORD') ?: 'gtc_pass';
    $connStr = sprintf('host=%s port=%s dbname=%s user=%s password=%s', $host, $port, $dbName, $user, $password);
    $conn = @pg_connect($connStr);
    return $conn ?: null;
}

function str_param(string $key): ?string
{
    if (!isset($_GET[$key])) {
        return null;
    }
    $val = trim((string) $_GET[$key]);
    return $val === '' ? null : $val;
}

function int_param(string $key, int $default, int $min, int $max): int
{
    if (!isset($_GET[$key])) {
        return $default;
    }
    $val = (int) $_GET[$key];
    if ($val < $min) {
        return $min;
    }
    if ($val > $max) {
        return $max;
    }
    return $val;
}

function respond(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
