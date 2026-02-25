<?php declare(strict_types=1);

// Filterable log viewer for chat_transactions.log
header('Content-Type: application/json; charset=utf-8');

$logPath = realpath(__DIR__ . '/../chat_transactions.log');
if ($logPath === false || !is_file($logPath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'log_not_found']);
    exit;
}

function strParam(string $key): ?string {
    if (!isset($_GET[$key])) {
        return null;
    }
    $val = trim((string) $_GET[$key]);
    return $val === '' ? null : $val;
}

function intParam(string $key, int $default, int $min, int $max): int {
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

function tailLines(string $path, int $limit): array {
    if ($limit < 1) {
        return [];
    }
    $f = new SplFileObject($path, 'r');
    $f->seek(PHP_INT_MAX);
    $lastLine = $f->key();
    $target = max(0, $lastLine - $limit + 1);
    $f->seek($target);
    $lines = [];
    while (!$f->eof()) {
        $line = $f->fgets();
        if ($line === '') {
            break;
        }
        $lines[] = rtrim($line, "\r\n");
    }
    return $lines;
}

$limit = intParam('limit', 200, 1, 1000);
$query = strParam('q');
$event = strParam('event');
$role = strParam('role');
$channel = strParam('channel');
$gtcUserId = strParam('gtc_user_id');
$sessionId = strParam('session_id');
$chatId = strParam('chat_id');
$since = strParam('since'); // ISO8601 or date string
$until = strParam('until');

$sinceTs = $since ? strtotime($since) : null;
$untilTs = $until ? strtotime($until) : null;

$tail = tailLines($logPath, $limit);
$results = [];

foreach ($tail as $line) {
    $decoded = json_decode($line, true);
    $tsStr = $decoded['ts'] ?? null;
    $ts = $tsStr ? strtotime($tsStr) : null;
    $ctx = $decoded['context'] ?? [];

    if ($sinceTs !== null && $ts !== false && $ts < $sinceTs) {
        continue;
    }
    if ($untilTs !== null && $ts !== false && $ts > $untilTs) {
        continue;
    }
    if ($event && ($decoded['event'] ?? '') !== $event) {
        continue;
    }
    if ($role && ($ctx['role'] ?? '') !== $role) {
        continue;
    }
    if ($channel && ($ctx['channel'] ?? '') !== $channel) {
        continue;
    }
    if ($gtcUserId && ($ctx['gtc_user_id'] ?? '') !== $gtcUserId) {
        continue;
    }
    if ($sessionId && ($ctx['session_id'] ?? '') !== $sessionId) {
        continue;
    }
    if ($chatId && ($ctx['chat_id'] ?? '') !== $chatId) {
        continue;
    }
    if ($query) {
        $needle = strtolower($query);
        if (strpos(strtolower($line), $needle) === false) {
            continue;
        }
    }

    $results[] = [
        'ts' => $tsStr,
        'event' => $decoded['event'] ?? null,
        'role' => $ctx['role'] ?? null,
        'channel' => $ctx['channel'] ?? null,
        'gtc_user_id' => $ctx['gtc_user_id'] ?? null,
        'session_id' => $ctx['session_id'] ?? null,
        'chat_id' => $ctx['chat_id'] ?? null,
        'message_preview' => $ctx['message_preview'] ?? null,
        'raw' => $line,
    ];
}

echo json_encode([
    'success' => true,
    'count' => count($results),
    'items' => $results,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
