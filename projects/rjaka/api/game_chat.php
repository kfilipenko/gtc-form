<?php declare(strict_types=1);

// Minimal proxy for the public support chat -> n8n webhook.

const N8N_WEBHOOK_URL = 'https://agent.gtstor.com/webhook/game-chat';
const MAX_MESSAGE_LENGTH = 1200;
const CURL_TIMEOUT = 240; // allow slower LLM/n8n flows
const CURL_CONNECT_TIMEOUT = 12;
const EMPTY_WEBHOOK_RETRIES = 2;
const EMPTY_WEBHOOK_RETRY_DELAY_MS = 1500;

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
$requestId = generate_id();

$forward = [
    'chat_id' => $chatId,
    'user_id' => $chatId,
    'message' => $message,
    'session_id' => $sessionId,
    'channel' => 'web_support',
    'client' => [
        'full_name' => $name,
        'email' => $email,
        'gtc_user_id' => $gtcUserId,
    ],
    'metadata' => [
        'request_id' => $requestId,
        'page' => $page,
        'user_agent' => $userAgent,
        'ip' => $ip,
    ]
];

$response = forward_to_webhook($forward);

// Prefer explicit reply; fall back to history content if n8n only returns trace/history.
$reply = extract_reply_from_response($response);
if ($reply === null) {
    $reply = wait_for_stored_reply($chatId, $requestId, 12);
}

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
    $lastStatus = 0;
    for ($attempt = 0; $attempt <= EMPTY_WEBHOOK_RETRIES; $attempt++) {
        [$body, $status, $error] = call_webhook_once($json);
        $lastStatus = $status;

        if ($body === false) {
            respond_error(502, 'webhook_unreachable', $error ?: 'cURL failed.');
        }

        if ($status >= 400) {
            respond_error(502, 'webhook_error', 'Webhook responded with HTTP ' . $status);
        }

        if ($body !== '' && $body !== null) {
            $decoded = json_decode($body, true);
            if (is_array($decoded)) {
                return $decoded;
            }

            // If webhook returned plain text instead of JSON, surface it as reply text.
            return ['reply' => trim((string)$body)];
        }

        if ($attempt < EMPTY_WEBHOOK_RETRIES) {
            usleep(EMPTY_WEBHOOK_RETRY_DELAY_MS * 1000 * ($attempt + 1));
            continue;
        }
    }

    $fallbackReply = load_reply_from_storage($payload['chat_id'] ?? null, $payload['metadata']['request_id'] ?? null);
    if ($fallbackReply !== null) {
        return ['reply' => $fallbackReply, 'source' => 'db_fallback'];
    }

    respond_error(502, 'webhook_empty_response', 'Webhook returned HTTP ' . $lastStatus . ' with an empty body after retries.');

    return [];
}

function call_webhook_once(string $json): array
{
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

    return [$body, $status, $error];
}

function extract_reply_from_response(array $response): ?string
{
    $directPaths = [
        ['reply'],
        ['response'],
        ['answer'],
        ['text'],
        ['content'],
        ['message'],
        ['output'],
        ['output', 'text'],
        ['output', 'content'],
        ['output', 'response'],
        ['output', 'answer'],
        ['data', 'reply'],
        ['data', 'response'],
        ['data', 'answer'],
        ['data', 'text'],
        ['data', 'content'],
        ['result', 'reply'],
        ['result', 'response'],
        ['result', 'answer'],
        ['choices', 0, 'message', 'content'],
        ['choices', 0, 'text'],
        [0, 'reply'],
        [0, 'response'],
        [0, 'answer'],
        [0, 'text'],
        [0, 'content'],
        [0, 'output'],
        [0, 'output', 'text'],
        [0, 'output', 'content'],
        [0, 'output', 'response'],
        [0, 'output', 'answer'],
    ];

    $candidates = [];
    foreach ($directPaths as $path) {
        $candidate = array_path($response, $path);
        $normalized = normalize_reply_candidate($candidate);
        if ($normalized !== null) {
            $candidates[] = $normalized;
        }
    }

    $outputCandidate = extract_from_output_block($response['output'] ?? null);
    if ($outputCandidate !== null) {
        $candidates[] = $outputCandidate;
    }
    $listOutputCandidate = extract_from_output_block($response[0]['output'] ?? null);
    if ($listOutputCandidate !== null) {
        $candidates[] = $listOutputCandidate;
    }

    if ($candidates !== []) {
        usort($candidates, static function (string $a, string $b): int {
            return mb_strlen($b) <=> mb_strlen($a);
        });
        return $candidates[0];
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

function normalize_reply_candidate($candidate): ?string
{
    if (!is_string($candidate)) {
        return null;
    }
    return format_ai_content($candidate);
}

function extract_from_output_block($output): ?string
{
    if (is_string($output)) {
        return format_ai_content($output);
    }
    if (!is_array($output)) {
        return null;
    }

    if (!array_is_list($output)) {
        return compose_structured_reply($output);
    }

    $structured = compose_structured_reply($output);
    if ($structured !== null) {
        return $structured;
    }

    $parts = [];
    foreach ($output as $item) {
        if (is_string($item)) {
            $formatted = format_ai_content($item);
            if ($formatted !== null) {
                $parts[] = $formatted;
            }
            continue;
        }
        if (!is_array($item)) {
            continue;
        }
        foreach (['text', 'content', 'response', 'answer'] as $key) {
            if (isset($item[$key]) && is_string($item[$key])) {
                $formatted = format_ai_content($item[$key]);
                if ($formatted !== null) {
                    $parts[] = $formatted;
                }
                break;
            }
        }
    }

    if ($parts === []) {
        return null;
    }
    return implode("\n", $parts);
}

function load_reply_from_storage($chatId, $requestId): ?string
{
    $conn = open_pg_connection();
    if (!$conn) {
        return null;
    }

    if (is_string($requestId) && trim($requestId) !== '') {
        $sql = "SELECT content FROM anon_chat_messages WHERE role = 'assistant' AND metadata->>'request_id' = $1 ORDER BY created_at DESC LIMIT 1";
        $result = @pg_query_params($conn, $sql, [trim($requestId)]);
        if ($result) {
            $row = pg_fetch_assoc($result);
            if (is_array($row) && isset($row['content']) && is_string($row['content'])) {
                $formatted = format_ai_content($row['content']);
                if ($formatted !== null) {
                    return $formatted;
                }
            }
        }
    }

    if (!is_string($chatId) || !preg_match('/^[0-9a-fA-F-]{32,36}$/', $chatId)) {
        return null;
    }

    $chatId = strtolower(trim($chatId));
    $sql = "SELECT content FROM anon_chat_messages WHERE chat_id = $1::uuid AND role = 'assistant' AND created_at >= (NOW() - INTERVAL '60 seconds') ORDER BY created_at DESC LIMIT 1";
    $result = @pg_query_params($conn, $sql, [$chatId]);
    if (!$result) {
        return null;
    }
    $row = pg_fetch_assoc($result);
    if (!is_array($row) || !isset($row['content']) || !is_string($row['content'])) {
        return null;
    }
    return format_ai_content($row['content']);
}

function wait_for_stored_reply(string $chatId, string $requestId, int $maxSeconds = 12): ?string
{
    $deadline = microtime(true) + max(1, $maxSeconds);
    do {
        $reply = load_reply_from_storage($chatId, $requestId);
        if ($reply !== null) {
            return $reply;
        }
        usleep(500 * 1000);
    } while (microtime(true) < $deadline);

    return null;
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
        $structured = compose_structured_reply($decoded);
        if ($structured !== null) {
            return $structured;
        }

        if (array_is_list($decoded)) {
            $merged = [];
            foreach ($decoded as $item) {
                if (is_string($item)) {
                    $formatted = format_ai_content($item);
                    if ($formatted !== null) {
                        $merged[] = $formatted;
                    }
                    continue;
                }
                if (is_array($item)) {
                    $formatted = compose_structured_reply($item);
                    if ($formatted !== null) {
                        $merged[] = $formatted;
                    }
                }
            }
            if ($merged !== []) {
                return implode("\n\n", $merged);
            }
        }
    }

    return $trimmed;
}

function compose_structured_reply(array $payload): ?string
{
    $parts = [];

    if (isset($payload['output'])) {
        if (is_string($payload['output'])) {
            $formattedOutput = format_ai_content($payload['output']);
            if ($formattedOutput !== null) {
                $parts[] = $formattedOutput;
            }
        } elseif (is_array($payload['output'])) {
            $nestedOutput = compose_structured_reply($payload['output']);
            if ($nestedOutput !== null) {
                $parts[] = $nestedOutput;
            }
        }
    }

    if (isset($payload['content']) && is_array($payload['content'])) {
        $nestedContent = compose_structured_reply($payload['content']);
        if ($nestedContent !== null) {
            $parts[] = $nestedContent;
        }
    }

    foreach (['answer', 'response', 'reply', 'text', 'content', 'message', 'summary'] as $key) {
        if (isset($payload[$key]) && is_string($payload[$key]) && trim($payload[$key]) !== '') {
            $parts[] = trim($payload[$key]);
        }
    }

    if (isset($payload['steps']) && is_array($payload['steps'])) {
        $stepLines = [];
        foreach ($payload['steps'] as $index => $step) {
            if (!is_array($step)) {
                continue;
            }
            $title = '';
            foreach (['step_title', 'title', 'name'] as $titleKey) {
                if (isset($step[$titleKey]) && is_string($step[$titleKey]) && trim($step[$titleKey]) !== '') {
                    $title = trim($step[$titleKey]);
                    break;
                }
            }
            $description = '';
            foreach (['step_description', 'description', 'content', 'text'] as $descKey) {
                if (isset($step[$descKey]) && is_string($step[$descKey]) && trim($step[$descKey]) !== '') {
                    $description = trim($step[$descKey]);
                    break;
                }
            }
            $line = trim(($title !== '' ? $title : ((string)($index + 1) . '.')) . ($description !== '' ? ': ' . $description : ''));
            if ($line !== '') {
                $stepLines[] = $line;
            }
        }
        if ($stepLines !== []) {
            $parts[] = implode("\n", $stepLines);
        }
    }

    if (isset($payload['details']) && is_array($payload['details'])) {
        $detailLines = [];
        foreach ($payload['details'] as $detail) {
            if (!is_array($detail)) {
                continue;
            }
            $title = isset($detail['title']) && is_string($detail['title']) ? trim($detail['title']) : '';
            $description = isset($detail['description']) && is_string($detail['description']) ? trim($detail['description']) : '';
            $line = trim($title . ($title && $description ? ': ' : '') . $description);
            if ($line !== '') {
                $detailLines[] = $line;
            }
        }
        if ($detailLines !== []) {
            $parts[] = implode("\n", $detailLines);
        }
    }

    if (isset($payload['notes']) && is_string($payload['notes']) && trim($payload['notes']) !== '') {
        $parts[] = 'Примечание: ' . trim($payload['notes']);
    }

    if (isset($payload['content_blocks']) && is_array($payload['content_blocks'])) {
        $blockParts = [];
        foreach ($payload['content_blocks'] as $block) {
            if (!is_array($block)) {
                continue;
            }
            $blockTitle = '';
            foreach (['title', 'step_title', 'name'] as $titleKey) {
                if (isset($block[$titleKey]) && is_string($block[$titleKey]) && trim($block[$titleKey]) !== '') {
                    $blockTitle = trim($block[$titleKey]);
                    break;
                }
            }

            $blockText = '';
            foreach (['content', 'description', 'text', 'step_description'] as $textKey) {
                if (isset($block[$textKey]) && is_string($block[$textKey]) && trim($block[$textKey]) !== '') {
                    $blockText = trim($block[$textKey]);
                    break;
                }
            }

            if ($blockTitle !== '' && $blockText !== '') {
                $blockParts[] = $blockTitle . "\n" . $blockText;
            } elseif ($blockTitle !== '') {
                $blockParts[] = $blockTitle;
            } elseif ($blockText !== '') {
                $blockParts[] = $blockText;
            }
        }

        if ($blockParts !== []) {
            $parts[] = implode("\n\n", $blockParts);
        }
    }

    if ($parts === []) {
        return null;
    }

    $unique = [];
    foreach ($parts as $part) {
        if (!in_array($part, $unique, true)) {
            $unique[] = $part;
        }
    }

    return implode("\n\n", $unique);
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
