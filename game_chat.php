<?php declare(strict_types=1);

// Minimal proxy for the public support chat -> n8n webhook.

const N8N_WEBHOOK_URL = 'https://agent.gtstor.com/webhook/game-chat';
const MAX_MESSAGE_LENGTH = 1200;
const CURL_TIMEOUT = 240; // allow slower LLM/n8n flows
const CURL_CONNECT_TIMEOUT = 12;

// Prevent PHP from killing long n8n runs before the webhook responds.
@set_time_limit(CURL_TIMEOUT + 30);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
    exit;
}

$rawBody = file_get_contents('php://input') ?: '';
$input = json_decode($rawBody, true);
if (!is_array($input)) {
    respond_error(400, 'invalid_json', 'Payload must be valid JSON.');
}

$message = trim((string)($input['message'] ?? ''));
if ($message === '') {
    respond_error(400, 'invalid_request', 'Message is required.');
}
if (mb_strlen($message) > MAX_MESSAGE_LENGTH) {
    respond_error(400, 'invalid_request', 'Message is too long.');
}

$chatId = normalize_id($input['chat_id'] ?? $input['chatId'] ?? null);
if ($chatId === null) {
    $chatId = generate_id();
}
$sessionId = normalize_id($input['session_id'] ?? $input['sessionId'] ?? null) ?? $chatId;
$gtcUserId = normalize_int($input['gtc_user_id'] ?? $input['user_id'] ?? ($input['client']['gtc_user_id'] ?? null));
$name = trim((string)($input['name'] ?? $input['full_name'] ?? '')) ?: null;
$email = trim((string)($input['email'] ?? '')) ?: null;
$page = trim((string)($input['page'] ?? ($_SERVER['HTTP_REFERER'] ?? ''))) ?: null;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
$ip = $_SERVER['REMOTE_ADDR'] ?? null;

$forward = [
    'chat_id' => $chatId,
    'message' => $message,
    'session_id' => $sessionId,
    'channel' => 'web_support',
    'client' => [
        'full_name' => $name,
        'email' => $email,
        'gtc_user_id' => $gtcUserId,
    ],
    'metadata' => [
        'page' => $page,
        'user_agent' => $userAgent,
        'ip' => $ip,
    ]
];

$response = forward_to_webhook($forward);

// Prefer explicit reply; fall back to history content if n8n only returns trace/history.
$reply = extract_reply_from_response($response);

// If n8n returns a chat_id, persist it.
if (isset($response['chat_id']) && is_string($response['chat_id']) && $response['chat_id'] !== '') {
    $chatId = $response['chat_id'];
}

http_response_code(200);

echo json_encode([
    'success' => true,
    'chat_id' => $chatId,
    'reply' => $reply,
    'trace_id' => $response['trace_id'] ?? null,
]);
exit;

function forward_to_webhook(array $payload): array
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        respond_error(500, 'encode_error', 'Unable to encode payload.');
    }
    $ch = curl_init(N8N_WEBHOOK_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $json,
        CURLOPT_TIMEOUT => CURL_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => CURL_CONNECT_TIMEOUT,
    ]);
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 0;
    $error = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        respond_error(502, 'webhook_unreachable', $error ?: 'cURL failed.');
    }

    if ($status >= 400) {
        respond_error(502, 'webhook_error', 'Webhook responded with HTTP ' . $status);
    }

    // Accept empty bodies as a valid 200 with no reply.
    if ($body === '' || $body === null) {
        return [];
    }

    $decoded = json_decode($body, true);
    if (is_array($decoded)) {
        return $decoded;
    }

    // If webhook returned plain text instead of JSON, surface it as reply text.
    return ['reply' => trim((string)$body)];
}

function extract_reply_from_response(array $response): ?string
{
    $directPaths = [
        ['reply'],
        ['response'],
        ['answer'],
        ['output', 'response'],
        ['output', 'answer'],
        [0, 'output', 'response'],
        [0, 'output', 'answer'],
    ];

    foreach ($directPaths as $path) {
        $candidate = array_path($response, $path);
        if (is_string($candidate) && trim($candidate) !== '') {
            return trim($candidate);
        }
    }

    $historyPaths = [
        ['history'],
        ['output', 'history'],
        [0, 'history'],
        [0, 'output', 'history'],
    ];

    foreach ($historyPaths as $path) {
        $history = array_path($response, $path);
        $replyFromHistory = extract_from_history($history);
        if ($replyFromHistory !== null) {
            return $replyFromHistory;
        }
    }

    return null;
}

function extract_from_history($history): ?string
{
    if (!is_array($history)) {
        return null;
    }

    // Walk from the end to pick the latest assistant message.
    for ($i = count($history) - 1; $i >= 0; $i--) {
        $entry = $history[$i];
        if (is_array($entry)) {
            if (($entry['role'] ?? null) === 'assistant' && is_string($entry['content'] ?? null)) {
                $formatted = format_ai_content($entry['content']);
                if ($formatted !== null) {
                    return $formatted;
                }
            }
        } elseif (is_string($entry)) {
            $formatted = format_ai_content($entry);
            if ($formatted !== null) {
                return $formatted;
            }
        }
    }

    return null;
}

function format_ai_content(string $content): ?string
{
    $trimmed = trim($content);
    if ($trimmed === '') {
        return null;
    }

    $decoded = json_decode($trimmed, true);
    if (is_array($decoded)) {
        // If the LLM returned structured JSON with summary/details, flatten to readable text.
        $parts = [];
        if (isset($decoded['summary']) && is_string($decoded['summary']) && trim($decoded['summary']) !== '') {
            $parts[] = trim($decoded['summary']);
        }
        if (isset($decoded['details']) && is_array($decoded['details'])) {
            foreach ($decoded['details'] as $detail) {
                if (!is_array($detail)) {
                    continue;
                }
                $title = isset($detail['title']) && is_string($detail['title']) ? trim($detail['title']) : '';
                $description = isset($detail['description']) && is_string($detail['description']) ? trim($detail['description']) : '';
                $line = trim($title . ($title && $description ? ': ' : '') . $description);
                if ($line !== '') {
                    $parts[] = $line;
                }
            }
        }
        if ($parts !== []) {
            $first = array_shift($parts);
            $lines = ['- ' . $first];
            foreach ($parts as $part) {
                $lines[] = '- ' . $part;
            }
            return implode("\n", $lines);
        }
    }

    return $trimmed;
}

function array_path(array $source, array $keys)
{
    $value = $source;
    foreach ($keys as $key) {
        if (!is_array($value) || !array_key_exists($key, $value)) {
            return null;
        }
        $value = $value[$key];
    }
    return $value;
}

function normalize_id($value): ?string
{
    if (!is_string($value)) {
        return null;
    }
    $trimmed = trim($value);
    return $trimmed === '' ? null : $trimmed;
}

function generate_id(): string
{
    if (function_exists('random_bytes')) {
        $bytes = bin2hex(random_bytes(16));
        return substr($bytes, 0, 8) . '-' . substr($bytes, 8, 4) . '-' . substr($bytes, 12, 4) . '-' . substr($bytes, 16, 4) . '-' . substr($bytes, 20, 12);
    }
    return 'chat-' . uniqid('', true);
}

function normalize_int($value): ?int
{
    if (is_int($value)) {
        return $value;
    }
    if (is_string($value) && preg_match('/^-?\d+$/', $value)) {
        return (int) $value;
    }
    return null;
}

function respond_error(int $status, string $code, string $message): void
{
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'error' => $code,
        'message' => $message,
    ]);
    exit;
}
