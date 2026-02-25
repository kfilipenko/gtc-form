<?php // chat_api wired for groups
declare(strict_types=1);

require_once __DIR__ . '/chat/lib/chat_bootstrap.php';

const N8N_WEBHOOK_URL = 'https://agent.gtstor.com/webhook/chat';
const CHAT_JOURNAL_FILE = __DIR__ . '/chat_transactions.log';
const MAX_GROUPS_PER_CHAT = 12;

date_default_timezone_set('UTC');

function journal_event(string $event, array $context = []): void {
    $entry = json_encode([
        'ts' => gmdate('c'),
        'event' => $event,
        'context' => $context
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($entry === false) {
        return;
    }
    $line = $entry . PHP_EOL;
    $path = CHAT_JOURNAL_FILE;
    if (@file_put_contents($path, $line, FILE_APPEND | LOCK_EX) === false) {
        error_log('[chat_journal] write_failed ' . $entry);
    }
}

function assert_post_json(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        respond_error(405, 'bad_request', 'Only POST requests are supported.');
    }
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') === false) {
        respond_error(415, 'bad_request', 'Content-Type must be application/json.');
    }
}

function ensure_chat_id(?string $providedChatId, string $gtcUserId, string $message): string {
    $chatId = trim((string) ($providedChatId ?? ''));
    if ($chatId !== '') {
        return $chatId;
    }
    $title = mb_substr(trim($message), 0, 120) ?: 'New chat';
    $row = create_chat_shell($gtcUserId, $title);
    return $row['chat_id'];
}

function insert_message(string $chatId, string $gtcUserId, string $role, string $content, array $metadata): array {
    $metadataJson = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($metadataJson === false) {
        respond_error(500, 'db_error', 'Unable to encode metadata.');
    }
    $query = 'INSERT INTO chat_messages (chat_id, gtc_user_id, role, content, metadata)
              VALUES ($1, $2, $3, $4, $5::jsonb)
              RETURNING message_id, created_at';
    $params = [$chatId, $gtcUserId, $role, $content, $metadataJson];
    $result = pg_query_params(db(), $query, $params);
    if (!$result) {
        respond_error(500, 'db_error', pg_last_error(db()) ?: 'Failed to insert message.');
    }
    $row = pg_fetch_assoc($result);
    if (!$row) {
        respond_error(500, 'db_error', 'Insert message returned no row.');
    }
    return $row;
}

function forward_to_n8n(array $payload, array $journalContext = []): array {
    $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonBody === false) {
        respond_error(500, 'bad_request', 'Unable to encode payload.');
    }
    journal_event('webhook_forward', array_merge($journalContext, [
        'target' => N8N_WEBHOOK_URL
    ]));
    $ch = curl_init(N8N_WEBHOOK_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $jsonBody,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    $responseBody = curl_exec($ch);
    $curlErr = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 0;
    curl_close($ch);
    if ($responseBody === false) {
        journal_event('webhook_error', array_merge($journalContext, [
            'status' => $status,
            'error' => $curlErr ?: 'curl_exec_failed'
        ]));
        respond_error(502, 'n8n_error', $curlErr ?: 'n8n webhook unreachable.');
    }
    $decoded = json_decode($responseBody, true);
    if (!is_array($decoded)) {
        journal_event('webhook_error', array_merge($journalContext, [
            'status' => $status,
            'error' => 'invalid_json'
        ]));
        respond_error(502, 'n8n_error', 'n8n returned invalid JSON.');
    }
    if ($status >= 400) {
        journal_event('webhook_error', array_merge($journalContext, [
            'status' => $status,
            'error' => 'http_' . $status,
            'body_preview' => mb_substr($responseBody, 0, 200)
        ]));
        respond_error(502, 'n8n_error', 'n8n responded with HTTP ' . $status);
    }
    journal_event('webhook_response', array_merge($journalContext, [
        'status' => $status,
        'trace_id' => $decoded['trace_id'] ?? null
    ]));
    return $decoded;
}

function touch_chat(string $chatId): void {
    $query = 'UPDATE chats SET updated_at = NOW() WHERE chat_id = $1';
    pg_query_params(db(), $query, [$chatId]);
}

function decode_payload(): array {
    assert_post_json();
    $rawBody = file_get_contents('php://input') ?: '';
    $payload = json_decode($rawBody, true);
    if (!is_array($payload)) {
        respond_error(400, 'bad_request', 'Invalid JSON payload.');
    }
    return $payload;
}

function respond_feature_not_enabled(string $message): void {
    respond_json(400, [
        'success' => false,
        'error' => 'feature_not_enabled',
        'message' => $message
    ]);
}

function is_groups_feature_missing_error(string $error): bool {
    $normalized = strtolower($error);
    return str_contains($normalized, 'chat_group') && str_contains($normalized, 'does not exist');
}

function respond_group_db_error(string $fallbackMessage): void {
    $error = pg_last_error(db()) ?: $fallbackMessage;
    if (is_groups_feature_missing_error($error)) {
        respond_feature_not_enabled('Chat groups are not configured on this backend. Deploy the latest schema to enable group sync.');
    }
    respond_error(500, 'db_error', $error);
}

function resolve_mode_alias(string $modeRaw, array $payload): string {
    $mode = $modeRaw;
    if ($mode === '') {
        if (isset($payload['groups'])) {
            $mode = isset($payload['chat_id']) ? 'assign_chat_groups' : 'chat_groups';
        }
    }
    switch ($mode) {
        case 'groups':
        case 'group_list':
            return 'chat_groups';
        case 'assign_groups':
        case 'assign_group':
        case 'set_groups':
            return 'assign_chat_groups';
    }
    if ($mode === 'log' && isset($payload['groups'])) {
        return isset($payload['chat_id']) ? 'assign_chat_groups' : 'chat_groups';
    }
    return $mode ?: 'log';
}

function build_metadata(array $payload, string $channel, string $sessionId, array $client): array {
    $metadata = [
        'channel' => $channel,
        'session_id' => $sessionId,
        'client' => $client,
        'source' => $payload['source'] ?? 'web_chat_logger',
    ];
    if (isset($payload['metadata']) && is_array($payload['metadata'])) {
        $metadata['payload_metadata'] = $payload['metadata'];
    }
    if (isset($payload['headers']) && is_array($payload['headers'])) {
        $metadata['headers'] = $payload['headers'];
    }
    foreach (['trace_id', 'stage', 'webhookUrl', 'executionMode'] as $key) {
        if (array_key_exists($key, $payload)) {
            $metadata[$key] = $payload[$key];
        }
    }
    return $metadata;
}

function handle_proxy_mode(array $payload): void {
    $message = trim((string)($payload['message'] ?? ''));
    $sessionId = trim((string)($payload['session_id'] ?? ''));
    $channel = trim((string)($payload['channel'] ?? 'web')) ?: 'web';
    $client = $payload['client'] ?? null;
    if ($message === '' || $sessionId === '' || !is_array($client)) {
        respond_error(400, 'bad_request', 'message, session_id, and client are required.');
    }
    $gtcUserId = normalize_gtc_user_id($client['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'client.gtc_user_id must be a positive integer.');
    }

    journal_event('proxy_request', [
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'channel' => $channel,
        'chat_id' => $payload['chat_id'] ?? null,
        'message_preview' => mb_substr($message, 0, 120)
    ]);

    $logUser = array_key_exists('log_user', $payload) ? (bool)$payload['log_user'] : true;
    $logAssistant = array_key_exists('log_assistant', $payload) ? (bool)$payload['log_assistant'] : true;

    $chatId = ensure_chat_id($payload['chat_id'] ?? null, $gtcUserId, $message);
    journal_event('chat_id_resolved', [
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'chat_id' => $chatId,
        'source' => 'proxy'
    ]);
    $payload['chat_id'] = $chatId;

    if ($logUser) {
        $userMetadata = build_metadata($payload, $channel, $sessionId, $client);
        insert_message($chatId, $gtcUserId, 'user', $message, $userMetadata);
        touch_chat($chatId);
        journal_event('sql_insert', [
            'chat_id' => $chatId,
            'gtc_user_id' => $gtcUserId,
            'session_id' => $sessionId,
            'role' => 'user'
        ]);
    }

    $webhookContext = [
        'chat_id' => $chatId,
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'channel' => $channel
    ];
    $n8nResponse = forward_to_n8n($payload, $webhookContext);
    $reply = trim((string)($n8nResponse['reply'] ?? ''));
    if ($reply === '') {
        journal_event('webhook_reply_empty', $webhookContext);
        respond_error(502, 'n8n_error', 'Webhook reply was empty.');
    }
    $traceId = $n8nResponse['trace_id'] ?? null;
    $stage = $n8nResponse['stage'] ?? null;

    $assistantPayload = $payload;
    $assistantPayload['trace_id'] = $traceId;
    $assistantPayload['stage'] = $stage;
    $assistantRow = null;
    if ($logAssistant) {
        $assistantMetadata = build_metadata($assistantPayload, $channel, $sessionId, $client);
        $assistantRow = insert_message($chatId, $gtcUserId, 'assistant', $reply, $assistantMetadata);
        touch_chat($chatId);
        journal_event('sql_insert', [
            'chat_id' => $chatId,
            'gtc_user_id' => $gtcUserId,
            'session_id' => $sessionId,
            'role' => 'assistant',
            'trace_id' => $traceId,
            'message_id' => $assistantRow['message_id'] ?? null
        ]);
    }

    respond_json(200, [
        'success' => true,
        'chat_id' => $chatId,
        'reply' => $reply,
        'trace_id' => $traceId,
        'stage' => $stage,
        'created_at' => $assistantRow['created_at'] ?? null,
        'proxied' => true,
        'logged_user' => $logUser,
        'logged_assistant' => $logAssistant,
    ]);
    journal_event('proxy_success', [
        'chat_id' => $chatId,
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'trace_id' => $traceId,
        'logged_user' => $logUser,
        'logged_assistant' => $logAssistant
    ]);
}

function handle_log_mode(array $payload): void {
    $message = trim((string)($payload['message'] ?? ''));
    $sessionId = trim((string)($payload['session_id'] ?? ''));
    $channel = trim((string)($payload['channel'] ?? 'web')) ?: 'web';
    $client = $payload['client'] ?? null;
    $role = strtolower(trim((string)($payload['role'] ?? 'user')));

    if ($message === '' || $sessionId === '' || !is_array($client)) {
        respond_error(400, 'bad_request', 'message, session_id, and client are required.');
    }
    if (!in_array($role, ['user', 'assistant', 'system'], true)) {
        respond_error(400, 'bad_request', 'role must be user, assistant, or system.');
    }

    $gtcUserId = normalize_gtc_user_id($client['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'client.gtc_user_id must be a positive integer.');
    }

    journal_event('log_mode_request', [
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'role' => $role,
        'channel' => $channel,
        'chat_id' => $payload['chat_id'] ?? null,
        'message_preview' => mb_substr($message, 0, 120)
    ]);

    $chatId = ensure_chat_id($payload['chat_id'] ?? null, $gtcUserId, $message);
    journal_event('chat_id_resolved', [
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'chat_id' => $chatId,
        'role' => $role
    ]);
    $metadata = build_metadata($payload, $channel, $sessionId, $client);
    $metadata['session_id'] = $sessionId;
    $metadata['channel'] = $channel;
    if (isset($payload['response']) && is_array($payload['response'])) {
        $metadata['response'] = $payload['response'];
    }

    $row = insert_message($chatId, $gtcUserId, $role, $message, $metadata);
    touch_chat($chatId);
    journal_event('sql_insert', [
        'chat_id' => $chatId,
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'role' => $role,
        'message_id' => $row['message_id'] ?? null
    ]);

    respond_json(200, [
        'success' => true,
        'chat_id' => $chatId,
        'message_id' => $row['message_id'] ?? null,
        'role' => $role,
        'created_at' => $row['created_at'] ?? null,
    ]);
    journal_event('log_mode_success', [
        'chat_id' => $chatId,
        'gtc_user_id' => $gtcUserId,
        'session_id' => $sessionId,
        'role' => $role,
        'message_id' => $row['message_id'] ?? null
    ]);
}

function resolve_mode_group(mixed $rawMode): string {
    if ($rawMode === null) {
        return 'log';
    }
    $normalized = strtolower(trim((string) $rawMode));
    if ($normalized === '') {
        return 'log';
    }
    if (in_array($normalized, ['list', 'lists', 'chats', 'chat_list', 'list_chats', 'get_chats'], true)) {
        return 'list';
    }
    if (in_array($normalized, ['messages', 'message', 'history', 'chat_history', 'message_list', 'get_messages', 'get_history'], true)) {
        return 'messages';
    }
    if (in_array($normalized, ['subscription_status', 'subscription_snapshot', 'subscription_check'], true)) {
        return 'subscription';
    }
    if (in_array($normalized, ['create_chat', 'new_chat'], true)) {
        return 'create_chat';
    }
    if (in_array($normalized, ['proxy', 'sync'], true)) {
        return 'proxy';
    }
    return 'log';
}

function resolve_read_mode(mixed $rawMode): ?string {
    $group = resolve_mode_group($rawMode);
    if ($group === 'list' || $group === 'messages') {
        return $group;
    }
    return null;
}

function handle_read_request(array $params): void {
    $modeRaw = $params['mode'] ?? 'list';
    $mode = resolve_read_mode($modeRaw);
    if ($mode === null) {
        respond_error(400, 'bad_request', 'Unsupported read mode. Use list or messages.');
    }
    $gtcUserId = normalize_gtc_user_id($params['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        $context = $mode === 'list' ? 'list_chats' : 'messages';
        respond_error(400, 'bad_request', 'gtc_user_id is required for ' . $context . '.');
    }
    if ($mode === 'list') {
        respond_with_chat_list($gtcUserId, $params);
        return;
    }
    $chatId = normalize_uuid($params['chat_id'] ?? null);
    if ($chatId === null) {
        respond_error(400, 'bad_request', 'chat_id is required for messages.');
    }
    respond_with_chat_messages($gtcUserId, $chatId, $params);
}

function handle_get_mode(): void {
    handle_read_request($_GET);
}

function respond_with_chat_list(string $gtcUserId, array $params = []): void {
    $limit = isset($params['limit']) ? (int) $params['limit'] : 50;
    $limit = max(1, min(200, $limit));
    $cursor = null;
    if (array_key_exists('cursor', $params)) {
        $cursor = normalize_uuid($params['cursor']);
    } elseif (array_key_exists('next_cursor', $params)) {
        $cursor = normalize_uuid($params['next_cursor']);
    }

    $groupFilterRaw = $params['group'] ?? $params['group_id'] ?? $params['groupId'] ?? null;
    $groupFilter = normalize_uuid($groupFilterRaw);

    $where = ['c.gtc_user_id = $1', 'c.is_deleted = FALSE'];
    $queryParams = [$gtcUserId];
    if ($cursor !== null) {
        $queryParams[] = $cursor;
        $where[] = 'c.chat_id < $' . count($queryParams);
    }
    if ($groupFilter !== null) {
        $queryParams[] = $groupFilter;
        $paramIndex = count($queryParams);
        $where[] = sprintf(
            'EXISTS (SELECT 1 FROM chat_group_links cgl WHERE cgl.chat_id = c.chat_id AND cgl.gtc_user_id = c.gtc_user_id AND cgl.group_id = $%d)',
            $paramIndex
        );
    }

    $query = sprintf(
        <<<'SQL'
SELECT c.chat_id, c.gtc_user_id, c.title, c.created_at, c.updated_at,
       COALESCE(last_message.content, '') AS last_message,
       last_message.role AS last_role,
       last_message.created_at AS last_message_at,
       COALESCE(last_message.created_at, c.updated_at, c.created_at) AS activity_at,
       COALESCE(stats.message_count, 0)::BIGINT AS message_count,
       COALESCE(group_data.groups_json, '[]'::json) AS groups
FROM chats c
LEFT JOIN LATERAL (
    SELECT m.content, m.role, m.created_at
    FROM chat_messages m
    WHERE m.chat_id = c.chat_id
    ORDER BY m.created_at DESC
    LIMIT 1
) AS last_message ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS message_count
    FROM chat_messages m2
    WHERE m2.chat_id = c.chat_id
) AS stats ON TRUE
LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
        'group_id', cg.group_id,
        'name', cg.name,
        'color', cg.color,
        'created_at', cg.created_at,
        'updated_at', cg.updated_at
    ) ORDER BY LOWER(cg.name)) AS groups_json
    FROM chat_group_links cgl
    JOIN chat_groups cg ON cg.group_id = cgl.group_id
    WHERE cgl.chat_id = c.chat_id AND cgl.gtc_user_id = c.gtc_user_id
) AS group_data ON TRUE
WHERE %s
ORDER BY COALESCE(last_message.created_at, c.updated_at, c.created_at) DESC, c.chat_id DESC
LIMIT %d
SQL,
        implode(' AND ', $where),
        $limit
    );

    $result = pg_query_params(db(), $query, $queryParams);
    if (!$result) {
        respond_error(500, 'db_error', pg_last_error(db()) ?: 'Failed to fetch chats.');
    }

    $rows = [];
    while ($row = pg_fetch_assoc($result)) {
        if (!isset($row['updated_at']) || !$row['updated_at']) {
            $row['updated_at'] = $row['activity_at'] ?? $row['created_at'];
        }
        $rows[] = format_chat_row($row, $row, (int)($row['message_count'] ?? 0));
    }

    $nextCursor = null;
    if (count($rows) === $limit) {
        $tail = end($rows);
        if ($tail && isset($tail['chat_id'])) {
            $nextCursor = $tail['chat_id'];
        }
    }

    respond_json(200, [
        'success' => true,
        'gtc_user_id' => $gtcUserId,
        'data' => $rows,
        'meta' => [
            'limit' => $limit,
            'cursor' => $cursor,
            'next_cursor' => $nextCursor,
            'sort' => 'chat_id_desc'
        ]
    ]);
}

function respond_with_chat_messages(string $gtcUserId, string $chatId, array $params = []): void {
    $chatRow = fetch_chat_row_for_user($chatId, $gtcUserId);
    if (!$chatRow) {
        respond_error(404, 'not_found', 'Chat not found for this user.');
    }

    $limit = isset($params['limit']) ? (int) $params['limit'] : 200;
    $limit = max(1, min(1000, $limit));
    $beforeRaw = $params['before'] ?? $params['cursor'] ?? null;
    $beforeTs = null;
    if (is_string($beforeRaw) && trim($beforeRaw) !== '') {
        $ts = strtotime($beforeRaw);
        if ($ts !== false) {
            $beforeTs = gmdate('Y-m-d H:i:sP', $ts);
        }
    }

    $where = ['chat_id = $1', 'gtc_user_id = $2'];
    $params = [$chatId, $gtcUserId];
    if ($beforeTs !== null) {
        $params[] = $beforeTs;
        $where[] = 'created_at < $' . count($params);
    }

    $query = sprintf(
        'SELECT message_id, chat_id, role, content, metadata, created_at
         FROM chat_messages
         WHERE %s
         ORDER BY created_at ASC
         LIMIT %d',
        implode(' AND ', $where),
        $limit
    );

    $result = pg_query_params(db(), $query, $params);
    if (!$result) {
        respond_error(500, 'db_error', pg_last_error(db()) ?: 'Failed to fetch messages.');
    }

    $messages = [];
    while ($row = pg_fetch_assoc($result)) {
        $messages[] = [
            'message_id' => $row['message_id'],
            'chat_id' => $row['chat_id'],
            'role' => $row['role'],
            'content' => $row['content'],
            'metadata' => decode_metadata_json($row['metadata'] ?? null),
            'created_at' => $row['created_at']
        ];
    }

    $nextCursor = null;
    if (count($messages) === $limit) {
        $tail = end($messages);
        if ($tail && isset($tail['created_at'])) {
            $nextCursor = $tail['created_at'];
        }
    }

    respond_json(200, [
        'success' => true,
        'chat' => format_chat_row($chatRow, null, null),
        'data' => $messages,
        'meta' => [
            'limit' => $limit,
            'before' => $beforeTs,
            'next_cursor' => $nextCursor,
            'sort' => 'created_at_asc'
        ]
    ]);
}

function create_chat_shell(string $gtcUserId, ?string $title = null): array {
    $normalizedTitle = trim((string)($title ?? ''));
    if ($normalizedTitle === '') {
        $normalizedTitle = 'Chat ' . strtoupper(substr(hash('sha256', $gtcUserId . microtime(true)), 0, 6));
    }
    $query = 'INSERT INTO chats (gtc_user_id, title) VALUES ($1, $2) RETURNING chat_id, gtc_user_id, title, created_at, updated_at';
    $result = pg_query_params(db(), $query, [$gtcUserId, $normalizedTitle]);
    if (!$result) {
        respond_error(500, 'db_error', pg_last_error(db()) ?: 'Failed to create chat.');
    }
    $row = pg_fetch_assoc($result);
    if (!$row) {
        respond_error(500, 'db_error', 'Chat creation returned no data.');
    }
    return $row;
}

function format_chat_row(array $row, ?array $lastMessageRow, ?int $messageCount): array {
    $lastMessage = $lastMessageRow['last_message'] ?? $lastMessageRow['content'] ?? '';
    $lastRole = $lastMessageRow['last_role'] ?? $lastMessageRow['role'] ?? null;
    $lastMessageAt = $lastMessageRow['last_message_at'] ?? $lastMessageRow['created_at'] ?? null;
    $rawGroupPayload = $row['groups'] ?? $row['group_details'] ?? null;
    if (is_array($rawGroupPayload)) {
        $groupDetails = $rawGroupPayload;
    } else {
        $groupDetails = decode_group_json(is_string($rawGroupPayload) ? $rawGroupPayload : null);
    }
    $groupIds = [];
    foreach ($groupDetails as $groupRow) {
        $groupId = $groupRow['group_id'] ?? $groupRow['id'] ?? null;
        if ($groupId !== null) {
            $groupIds[] = $groupId;
        }
    }
    return [
        'chat_id' => $row['chat_id'] ?? null,
        'gtc_user_id' => $row['gtc_user_id'] ?? null,
        'title' => $row['title'] ?? null,
        'snippet' => format_snippet($lastMessage),
        'last_message' => $lastMessage,
        'last_role' => $lastRole,
        'last_message_at' => $lastMessageAt,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
        'message_count' => $messageCount ?? 0,
        'groups' => $groupIds,
        'group_details' => $groupDetails
    ];
}

function format_snippet(?string $text): string {
    if ($text === null) {
        return '';
    }
    $trimmed = trim($text);
    if ($trimmed === '') {
        return '';
    }
    $maxLength = 200;
    if (mb_strlen($trimmed) > $maxLength) {
        return mb_substr($trimmed, 0, $maxLength - 1) . '…';
    }
    return $trimmed;
}

function decode_metadata_json(?string $json): array {
    if ($json === null || trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function format_group_row(array $row): array {
    return [
        'group_id' => $row['group_id'] ?? null,
        'id' => $row['group_id'] ?? null,
        'gtc_user_id' => isset($row['gtc_user_id']) ? (int) $row['gtc_user_id'] : null,
        'name' => $row['name'] ?? null,
        'color' => $row['color'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function decode_group_json(?string $json): array {
    if ($json === null || trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        return [];
    }
    $normalized = [];
    foreach ($decoded as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $normalized[] = [
            'group_id' => $entry['group_id'] ?? $entry['id'] ?? null,
            'id' => $entry['group_id'] ?? $entry['id'] ?? null,
            'name' => $entry['name'] ?? null,
            'color' => $entry['color'] ?? null,
            'created_at' => $entry['created_at'] ?? null,
            'updated_at' => $entry['updated_at'] ?? null,
        ];
    }
    return $normalized;
}

function normalize_group_spec_list(mixed $rawGroups): array {
    if (!is_array($rawGroups)) {
        return [];
    }
    $normalized = [];
    foreach ($rawGroups as $entry) {
        if (is_string($entry)) {
            $uuid = normalize_uuid($entry);
            if ($uuid !== null) {
                $normalized[] = ['group_id' => $uuid];
                continue;
            }
            $name = trim($entry);
            if ($name !== '') {
                $normalized[] = ['name' => $name];
            }
            continue;
        }
        if (!is_array($entry)) {
            continue;
        }
        $groupId = normalize_uuid($entry['group_id'] ?? $entry['id'] ?? null);
        $name = isset($entry['name']) ? trim((string) $entry['name']) : null;
        $color = isset($entry['color']) ? trim((string) $entry['color']) : null;
        if ($groupId === null && ($name === null || $name === '')) {
            continue;
        }
        $normalized[] = [
            'group_id' => $groupId,
            'name' => $name ?: null,
            'color' => $color ?: null,
        ];
    }
    if (count($normalized) > MAX_GROUPS_PER_CHAT) {
        return array_slice($normalized, 0, MAX_GROUPS_PER_CHAT);
    }
    return $normalized;
}

function find_user_group_by_id(string $gtcUserId, string $groupId): ?array {
    $query = 'SELECT group_id, gtc_user_id, name, color, created_at, updated_at
              FROM chat_groups
              WHERE group_id = $1 AND gtc_user_id = $2';
    $result = pg_query_params(db(), $query, [$groupId, $gtcUserId]);
    if (!$result) {
        respond_group_db_error('Failed to fetch chat group.');
    }
    $row = pg_fetch_assoc($result);
    return $row ?: null;
}

function find_user_group_by_name(string $gtcUserId, string $name): ?array {
    $query = 'SELECT group_id, gtc_user_id, name, color, created_at, updated_at
              FROM chat_groups
              WHERE gtc_user_id = $1 AND LOWER(name) = LOWER($2)
              LIMIT 1';
    $result = pg_query_params(db(), $query, [$gtcUserId, $name]);
    if (!$result) {
        respond_group_db_error('Failed to look up chat group by name.');
    }
    $row = pg_fetch_assoc($result);
    return $row ?: null;
}

function upsert_chat_group_for_user(string $gtcUserId, array $spec): array {
    $groupId = $spec['group_id'] ?? null;
    $name = isset($spec['name']) ? trim((string) $spec['name']) : null;
    $color = isset($spec['color']) ? trim((string) $spec['color']) : null;

    if ($groupId !== null) {
        $row = find_user_group_by_id($gtcUserId, $groupId);
        if (!$row) {
            respond_error(404, 'not_found', 'Group not found for this user.');
        }
        $targetName = $name !== null && $name !== '' ? $name : ($row['name'] ?? null);
        if ($targetName === null || $targetName === '') {
            respond_error(400, 'bad_request', 'Group name cannot be empty.');
        }
        $targetColor = $color !== null ? $color : ($row['color'] ?? null);
        if ($targetName === $row['name'] && $targetColor === ($row['color'] ?? null)) {
            return $row;
        }
        $query = 'UPDATE chat_groups
                  SET name = $1, color = $2, updated_at = NOW()
                  WHERE group_id = $3 AND gtc_user_id = $4
                  RETURNING group_id, gtc_user_id, name, color, created_at, updated_at';
        $result = pg_query_params(db(), $query, [$targetName, $targetColor, $groupId, $gtcUserId]);
        if (!$result) {
            respond_group_db_error('Failed to update chat group.');
        }
        $updated = pg_fetch_assoc($result);
        if (!$updated) {
            respond_group_db_error('Failed to update chat group.');
        }
        return $updated;
    }

    if ($name === null || $name === '') {
        respond_error(400, 'bad_request', 'Group name is required.');
    }

    $existing = find_user_group_by_name($gtcUserId, $name);
    if ($existing) {
        if ($color !== null && $color !== ($existing['color'] ?? null)) {
            $query = 'UPDATE chat_groups
                      SET color = $1, updated_at = NOW()
                      WHERE group_id = $2 AND gtc_user_id = $3
                      RETURNING group_id, gtc_user_id, name, color, created_at, updated_at';
            $result = pg_query_params(db(), $query, [$color, $existing['group_id'], $gtcUserId]);
            if ($result) {
                $updated = pg_fetch_assoc($result);
                if ($updated) {
                    return $updated;
                }
            }
        }
        return $existing;
    }

    $insert = 'INSERT INTO chat_groups (gtc_user_id, name, color)
               VALUES ($1, $2, $3)
               RETURNING group_id, gtc_user_id, name, color, created_at, updated_at';
    $result = pg_query_params(db(), $insert, [$gtcUserId, $name, $color]);
    if (!$result) {
        respond_group_db_error('Failed to create chat group.');
    }
    $row = pg_fetch_assoc($result);
    if (!$row) {
        respond_group_db_error('Failed to create chat group.');
    }
    return $row;
}

function fetch_chat_row_for_user(string $chatId, string $gtcUserId): ?array {
    $query = <<<'SQL'
SELECT c.chat_id, c.gtc_user_id, c.title, c.created_at, c.updated_at,
       COALESCE(group_data.groups_json, '[]'::json) AS groups
FROM chats c
LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
        'group_id', cg.group_id,
        'name', cg.name,
        'color', cg.color,
        'created_at', cg.created_at,
        'updated_at', cg.updated_at
    ) ORDER BY LOWER(cg.name)) AS groups_json
    FROM chat_group_links cgl
    JOIN chat_groups cg ON cg.group_id = cgl.group_id
    WHERE cgl.chat_id = c.chat_id AND cgl.gtc_user_id = c.gtc_user_id
) AS group_data ON TRUE
WHERE c.chat_id = $1 AND c.gtc_user_id = $2 AND c.is_deleted = FALSE
SQL;
    $result = pg_query_params(db(), $query, [$chatId, $gtcUserId]);
    if (!$result) {
        respond_group_db_error('Failed to fetch chat metadata.');
    }
    $row = pg_fetch_assoc($result);
    return $row ?: null;
}

function fetch_user_chat_groups(string $gtcUserId): array {
    $query = 'SELECT group_id, gtc_user_id, name, color, created_at, updated_at
              FROM chat_groups
              WHERE gtc_user_id = $1
              ORDER BY LOWER(name) ASC, group_id ASC';
    $result = pg_query_params(db(), $query, [$gtcUserId]);
    if (!$result) {
        respond_group_db_error('Failed to load chat groups.');
    }
    $rows = [];
    while ($row = pg_fetch_assoc($result)) {
        $rows[] = $row;
    }
    return $rows;
}

function handle_subscription_status(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to check subscription.');
    }

    $query = 'SELECT stripe_subscription_id,
                     stripe_customer_id,
                     plan_code,
                     status,
                     start_date,
                     end_date
              FROM subscriptions
              WHERE gtc_user_id = $1
              ORDER BY end_date DESC NULLS LAST, start_date DESC NULLS LAST
              LIMIT 1';
    $result = @pg_query_params(db(), $query, [$gtcUserId]);
    if (!$result) {
        $error = pg_last_error(db()) ?: 'Failed to query subscriptions table.';
        respond_error(500, 'subscription_lookup_failed', $error);
    }

    $row = pg_fetch_assoc($result) ?: null;
    $status = $row['status'] ?? null;
    $endDateRaw = $row['end_date'] ?? null;
    $endTimestamp = $endDateRaw ? strtotime($endDateRaw) : null;
    $now = time();
    $isActive = false;
    if ($status !== null) {
        $normalizedStatus = strtolower((string) $status);
        $isActive = in_array($normalizedStatus, ['active', 'trialing'], true)
            && ($endTimestamp === null || $endTimestamp > $now);
    }

    respond_json(200, [
        'success' => true,
        'gtc_user_id' => $gtcUserId,
        'subscription_active' => $isActive,
        'subscription_status' => $status,
        'subscription_end' => $endDateRaw,
        'subscription' => $row,
        'checked_at' => gmdate('c')
    ]);
}

function handle_list_chat_groups(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to list chat groups.');
    }
    $groups = array_map('format_group_row', fetch_user_chat_groups($gtcUserId));
    respond_json(200, [
        'success' => true,
        'gtc_user_id' => $gtcUserId,
        'groups' => $groups,
        'count' => count($groups)
    ]);
}

function handle_set_chat_groups(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to assign groups.');
    }
    $chatId = normalize_uuid($payload['chat_id'] ?? null);
    if ($chatId === null) {
        respond_error(400, 'bad_request', 'chat_id is required to assign groups.');
    }
    $chatRow = fetch_chat_row_for_user($chatId, $gtcUserId);
    if (!$chatRow) {
        respond_error(404, 'not_found', 'Chat not found for this user.');
    }
    $groupSpecs = normalize_group_spec_list($payload['groups'] ?? $payload['group_ids'] ?? []);
    $groupRows = [];
    foreach ($groupSpecs as $spec) {
        $groupRows[] = upsert_chat_group_for_user($gtcUserId, $spec);
    }
    $deduped = [];
    foreach ($groupRows as $row) {
        $groupId = $row['group_id'] ?? null;
        if ($groupId === null) {
            continue;
        }
        $deduped[$groupId] = $row;
    }
    $groupRows = array_values($deduped);

    if (!pg_query(db(), 'BEGIN')) {
        respond_group_db_error('Failed to start transaction to update groups.');
    }
    $txError = null;
    $delete = pg_query_params(db(), 'DELETE FROM chat_group_links WHERE chat_id = $1 AND gtc_user_id = $2', [$chatId, $gtcUserId]);
    if (!$delete) {
        $txError = pg_last_error(db()) ?: 'Failed to reset chat groups.';
        if (is_groups_feature_missing_error($txError)) {
            respond_feature_not_enabled('Chat groups are not configured on this backend. Deploy the latest schema to enable group sync.');
        }
    }
    if ($txError === null) {
        foreach ($groupRows as $row) {
            $insert = pg_query_params(
                db(),
                'INSERT INTO chat_group_links (chat_id, group_id, gtc_user_id) VALUES ($1, $2, $3)',
                [$chatId, $row['group_id'], $gtcUserId]
            );
            if (!$insert) {
                $txError = pg_last_error(db()) ?: 'Failed to assign chat group.';
                if (is_groups_feature_missing_error($txError)) {
                    respond_feature_not_enabled('Chat groups are not configured on this backend. Deploy the latest schema to enable group sync.');
                }
                break;
            }
        }
    }
    if ($txError !== null) {
        pg_query(db(), 'ROLLBACK');
        respond_error(500, 'db_error', $txError);
    }
    pg_query(db(), 'COMMIT');

    touch_chat($chatId);

    $formattedGroups = array_map('format_group_row', $groupRows);
    $groupIds = array_values(array_filter(array_map(static fn($row) => $row['group_id'] ?? null, $formattedGroups)));
    respond_json(200, [
        'success' => true,
        'chat_id' => $chatId,
        'gtc_user_id' => $gtcUserId,
        'group_count' => count($formattedGroups),
        'groups' => $groupIds,
        'group_details' => $formattedGroups
    ]);
}

function handle_create_chat_mode(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to create a chat.');
    }
    $title = trim((string)($payload['title'] ?? '')) ?: null;
    $chatRow = create_chat_shell($gtcUserId, $title);
    respond_json(201, [
        'success' => true,
        'chat' => format_chat_row($chatRow, null, 0)
    ]);
}

function handle_list_chats(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to list chats.');
    }
    respond_with_chat_list($gtcUserId, $payload);
}

function handle_messages(array $payload): void {
    $gtcUserId = normalize_gtc_user_id($payload['gtc_user_id'] ?? null);
    if ($gtcUserId === null) {
        respond_error(400, 'bad_request', 'gtc_user_id is required to list messages.');
    }
    $chatId = normalize_uuid($payload['chat_id'] ?? null);
    if ($chatId === null) {
        respond_error(400, 'bad_request', 'chat_id is required to list messages.');
    }
    respond_with_chat_messages($gtcUserId, $chatId, $payload);
}

function main(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        handle_get_mode();
        return;
    }

    $payload = decode_payload();
    $modeRaw = strtolower(trim((string)($payload['mode'] ?? '')));
    $modeRaw = resolve_mode_alias($modeRaw, $payload);
    @file_put_contents('/tmp/chat_api_mode.log', sprintf(
        "%s mode=%s gtc_user_id=%s chat_id=%s keys=%s\n",
        gmdate('c'),
        $modeRaw,
        $payload['gtc_user_id'] ?? 'null',
        $payload['chat_id'] ?? 'null',
        implode(',', array_keys($payload))
    ), FILE_APPEND);
    $logParts = [
        'mode=' . $modeRaw,
        'gtc_user_id=' . ($payload['gtc_user_id'] ?? 'null'),
        'chat_id=' . ($payload['chat_id'] ?? 'null'),
        'keys=' . implode(',', array_keys($payload))
    ];
    error_log('[chat_api] ' . implode(' ', $logParts));

    switch ($modeRaw) {
        case 'proxy':
        case 'sync':
            handle_proxy_mode($payload);
            return;

        case 'log':
        case 'log_only':
        case 'logger':
            handle_log_mode($payload);
            return;

        case 'list':
        case 'lists':
        case 'list_chats':
        case 'chat_list':
        case 'get_chats':
        case 'chats':
            handle_list_chats($payload);
            return;

        case 'messages':
        case 'message':
        case 'history':
        case 'chat_history':
        case 'message_list':
        case 'get_messages':
        case 'get_history':
            handle_messages($payload);
            return;

        case 'create_chat':
        case 'new_chat':
            handle_create_chat_mode($payload);
            return;

        case 'subscription_status':
        case 'subscription_snapshot':
        case 'subscription_check':
            handle_subscription_status($payload);
            return;

        case 'list_chat_groups':
        case 'chat_groups':
        case 'list_groups':
            handle_list_chat_groups($payload);
            return;

        case 'set_chat_groups':
        case 'assign_chat_groups':
        case 'save_chat_groups':
            handle_set_chat_groups($payload);
            return;

        default:
            respond_error(400, 'unknown_mode', 'Unknown chat_api mode. Specify a valid mode or include groups + chat_id to assign.');
            return;
    }
}

main();
