<?php declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['success' => false, 'error' => 'method_not_allowed']);
}

$raw = file_get_contents('php://input') ?: '';
$input = json_decode($raw, true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'error' => 'invalid_json']);
}

$messageId = trim((string) ($input['assistant_message_id'] ?? ''));
$vote = trim((string) ($input['vote'] ?? ''));
$voterToken = trim((string) ($input['voter_token'] ?? ''));

if (!preg_match('/^[0-9a-fA-F-]{32,36}$/', $messageId)) {
    respond(400, ['success' => false, 'error' => 'invalid_message_id']);
}
if ($vote !== 'like' && $vote !== 'dislike') {
    respond(400, ['success' => false, 'error' => 'invalid_vote']);
}
if ($voterToken === '') {
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    $voterToken = hash('sha256', $ip . '|' . $ua);
}
if (mb_strlen($voterToken) > 160) {
    respond(400, ['success' => false, 'error' => 'invalid_voter_token']);
}

$conn = open_pg_connection();
if (!$conn) {
    respond(500, ['success' => false, 'error' => 'db_unavailable']);
}

$assistantMessageId = strtolower($messageId);

@pg_query($conn, 'BEGIN');

$insertVote = @pg_query_params(
    $conn,
    "
    INSERT INTO anon_chat_feedback_votes (assistant_message_id, voter_token, vote)
    VALUES ($1::uuid, $2, $3)
    ON CONFLICT (assistant_message_id, voter_token) DO NOTHING
    RETURNING vote
    ",
    [$assistantMessageId, $voterToken, $vote]
);

if (!$insertVote) {
    @pg_query($conn, 'ROLLBACK');
    respond(500, ['success' => false, 'error' => 'query_failed']);
}

$inserted = pg_num_rows($insertVote) > 0;

if ($inserted) {
    if ($vote === 'like') {
        $updateRes = @pg_query_params(
            $conn,
            "
            UPDATE anon_chat_messages
            SET feedback_like_count = COALESCE(feedback_like_count, 0) + 1,
                feedback_updated_at = now()
            WHERE message_id = $1::uuid AND role = 'assistant'
            ",
            [$assistantMessageId]
        );
    } else {
        $updateRes = @pg_query_params(
            $conn,
            "
            UPDATE anon_chat_messages
            SET feedback_dislike_count = COALESCE(feedback_dislike_count, 0) + 1,
                feedback_updated_at = now()
            WHERE message_id = $1::uuid AND role = 'assistant'
            ",
            [$assistantMessageId]
        );
    }
    if (!$updateRes) {
        @pg_query($conn, 'ROLLBACK');
        respond(500, ['success' => false, 'error' => 'query_failed']);
    }
}

$existingVoteRes = @pg_query_params(
    $conn,
    "SELECT vote FROM anon_chat_feedback_votes WHERE assistant_message_id = $1::uuid AND voter_token = $2 LIMIT 1",
    [$assistantMessageId, $voterToken]
);

$countsRes = @pg_query_params(
    $conn,
    "
    SELECT message_id::text AS assistant_message_id,
           COALESCE(feedback_like_count, 0) AS like_count,
           COALESCE(feedback_dislike_count, 0) AS dislike_count
    FROM anon_chat_messages
    WHERE message_id = $1::uuid AND role = 'assistant'
    LIMIT 1
    ",
    [$assistantMessageId]
);

if (!$countsRes || !$existingVoteRes) {
    @pg_query($conn, 'ROLLBACK');
    respond(500, ['success' => false, 'error' => 'query_failed']);
}

$row = pg_fetch_assoc($countsRes);
if (!is_array($row)) {
    @pg_query($conn, 'ROLLBACK');
    respond(404, ['success' => false, 'error' => 'message_not_found']);
}

$voteRow = pg_fetch_assoc($existingVoteRes);
$existingVote = is_array($voteRow) ? (string) ($voteRow['vote'] ?? '') : '';

@pg_query($conn, 'COMMIT');

respond(200, [
    'success' => true,
    'already_voted' => !$inserted,
    'existing_vote' => $existingVote,
    'assistant_message_id' => (string) ($row['assistant_message_id'] ?? ''),
    'like_count' => (int) ($row['like_count'] ?? 0),
    'dislike_count' => (int) ($row['dislike_count'] ?? 0),
]);

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

function respond(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
