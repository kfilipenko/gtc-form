# Chat SQL Persistence Directive

**Audience:** Leadership, architecture, and AI platform maintainers.

## 1. Guiding Principles
- Every chat is a durable SQL entity referenced by a unique `chat_id` (UUID or BIGINT).
- `gtc_user_id` scopes ownership; chats never mix messages from different users.
- Chatted data stays in SQL permanently. User "deletion" only flips `is_deleted = true` and hides the chat from UI lists for that user.
- Back-end and AI services must always return the active `chat_id` to the client so subsequent turns continue the same record.
- Frontend продолжает использовать `session_id` как пользовательский идентификатор (показывается в UI, уходит в платежные сервисы); `chat_id` обслуживает только SQL/журналы.

## 2. Stage 1 — Database Schema Actualization

Goal: confirm the canonical `chats`/`chat_messages` schema exists exactly as required (or create/alter it). The checklist below must be completed before backend/frontend work starts.

### 2.1 Verification checklist
1. Inspect migrations or run `\d chats` / `\d chat_messages` in the target Postgres schema.
2. Validate every field listed in sections 2.2 and 2.3 below. Missing fields → create migrations (e.g., `ALTER TABLE chats ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false`).
3. Ensure foreign keys (`chat_messages.chat_id → chats.chat_id`) and default values (`created_at DEFAULT now()`, etc.) are present.
4. Record the final state (DDL snippet, migration IDs) in this document.

### 2.2 chats table (authoritative definition)
| Column | Notes |
| --- | --- |
| `chat_id` (PK) | UUID/BIGINT generated on create |
| `gtc_user_id` | Foreign key to platform user |
| `title` | Short, mutable descriptor (often first user utterance) |
| `created_at TIMESTAMPTZ` | Default `now()` when chat was opened |
| `updated_at TIMESTAMPTZ` | Default `now()`, touch on every message |
| `is_deleted BOOLEAN` | Default `false`; logical archive flag |

### 2.3 chat_messages table (authoritative definition)
| Column | Notes |
| --- | --- |
| `message_id` (PK) | UUID/BIGINT |
| `chat_id` | FK → chats.chat_id |
| `gtc_user_id` | Optional guardrail / auditing column |
| `role` | `user`, `assistant`, or `system` |
| `content TEXT` | Message body |
| `metadata JSONB` | Channel, model, token stats, attachments (default `{}`) |
| `created_at TIMESTAMPTZ` | Default `now()` |

Example transcript query for n8n prompt building:

```sql
SELECT role, content, metadata, created_at
FROM chat_messages
WHERE chat_id = $1
ORDER BY created_at ASC;
```

### 2.4 Migration artifacts
- `create_all_tables.sql` now provisions the canonical schema for fresh environments.
- Existing databases should run `db/migrations/20251125_chat_schema_actualization.sql`, which:
	- enables `pgcrypto` for `gen_random_uuid()`;
	- creates the tables if missing;
	- normalizes column types/defaults (`UUID`, `BIGINT`, `TIMESTAMPTZ`, `JSONB`);
	- enforces FK + role check constraint and recreates the history index.
Document the execution timestamp/DB host in the release checklist once applied.

## 3. Final DB schema (Stage 1)

### 3.1 `public.chats`
- **Primary key:** `chat_id UUID DEFAULT gen_random_uuid()`.
- **Columns:**
	- `gtc_user_id BIGINT NOT NULL` — owner of the conversation.
	- `title TEXT NULL` — optional descriptive label (e.g., first user utterance).
	- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` — persisted creation moment.
	- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` — touch on every new message.
	- `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` — logical archive flag; UI hides chats where this is `TRUE`, but rows stay in SQL for compliance/audit.

### 3.2 `public.chat_messages`
- **Primary key:** `message_id UUID DEFAULT gen_random_uuid()`.
- **Foreign key:** `chat_id UUID REFERENCES public.chats(chat_id) ON DELETE CASCADE`.
- **Columns:**
	- `gtc_user_id BIGINT NOT NULL` — redundant owner guardrail (helps back-office filtering).
	- `role TEXT NOT NULL CHECK (role IN ('user','assistant','system'))` — ensures prompt builders can rely on canonical roles.
	- `content TEXT NOT NULL` — body of the turn.
	- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb` — transport for channel/model info, token stats, attachments.
	- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` — actual arrival timestamp.
- **Indexes:** `idx_chat_messages_chat (chat_id, created_at)` accelerates ordered history reads.

### 3.3 `public.chat_messages_legacy`
- Old structure (`id SERIAL, user_id VARCHAR, message TEXT, timestamp TIMESTAMP`).
- Retained **read-only** for archival/backfill. New writes must never hit this table.

## 4. SQL usage examples

> All snippets assume a server-side app (Node/Go/etc.) binds parameters (`$1`, `$2`, …) and handles transactions/connection pooling.

### 4.1 Create a chat shell
```sql
INSERT INTO chats (gtc_user_id, title)
VALUES ($1, $2)
RETURNING chat_id, created_at, updated_at, is_deleted;
```

### 4.2 Append a message
```sql
INSERT INTO chat_messages (chat_id, gtc_user_id, role, content, metadata)
VALUES ($1, $2, $3, $4, $5::jsonb)
RETURNING message_id, created_at;
```

### 4.3 Fetch entire transcript
```sql
SELECT role, content, metadata, created_at
FROM chat_messages
WHERE chat_id = $1
ORDER BY created_at ASC;
```

### 4.4 Fetch last N messages for prompt building
```sql
SELECT role, content
FROM chat_messages
WHERE chat_id = $1
ORDER BY created_at DESC
LIMIT $2;
```
*Note*: reverse the rows in application code before sending to the LLM so the chronological order is preserved.

## 5. Current web chat flow (direct webhook + async log)

- **Frontend entry point:** `chat/index.html` (`sendMessage`, `queueSqlLog`, `handleAgentResponse`).
- **Backend/API route:** браузер напрямую вызывает `https://agent.gtstor.com/webhook/chat`, а `/chat_api.php` обслуживает только асинхронные `mode:'log'` запросы для SQL-персистенции (и остаётся резервным proxy).

### Flow steps
1. User submits a prompt; `sendMessage()` валидирует `state.user.gtc_user_id`, пушит сообщение в локальную историю и формирует payload (channel, `session_id`, client, metadata, headers snapshot, `source:'web_chat_frontend'`). Если у фронта уже есть `chat_id`, он добавляется; иначе поле остаётся пустым и PHP создаёт новый UUID при первой записи.
2. Браузер делает `fetch(N8N_WEBHOOK_URL, payload)`; HTTP ошибки попадают напрямую в UI, минуя PHP relay.
3. Параллельно `queueSqlLog()` ставит задачу на `/chat_api.php` с `mode:'log'`, `role:'user'` и тем же payload. Очередь перед отправкой подставляет `chat_id`: сначала пробует `state.sqlChatId`, затем `state.chatId`, затем fallback к `session_id`. PHP создаёт/разрешает `chat_id`, пишет ход в `chat_messages`, обновляет `updated_at` и журналирует событие.
4. После ответа workflow `handleAgentResponse()` показывает результат, фиксирует `chat_id` (если вернулся) и обновляет статусы. При пустом ответе UI остаётся «в ожидании».
5. Как только есть валидный `reply`, фронт добавляет вторую задачу `queueSqlLog()` с `role:'assistant'`, `message: reply`, `trace_id`/`stage` и `response` — PHP записывает ход в SQL и отмечает его в `chat_transactions.log`.
6. Кнопка «New chat» обновляет только `session_id` (UI-поле) и сбрасывает сохранённые `chat_id`. Следующее сообщение снова создаёт пару: браузер отправляет новый `session_id`, а `/chat_api.php` закрепляет fresh `chat_id` в SQL и возвращает его в ответе.

## 6. Backend chat API (PHP logger + relay)
- **Endpoint:** `/var/www/html/chat_api.php`.
- **Modes:**
	- `mode = 'log'` — основной production-поток: фронтенд ставит в очередь user/assistant-ходы, PHP записывает их в SQL и журнал.
	- `mode = 'proxy'` — резервный: позволяет временно вернуть серверный relay (и одновременно вести SQL-журнал) без правок фронта.
- **Proxy-mode contract:** тот же JSON, что и у n8n (channel/message/session_id/client/metadata/chat_id) + `headers` и `source`. PHP:
  1. Валидирует запрос и журналирует `proxy_request`.
  2. Через `ensure_chat_id` гарантирует наличие записи в `chats`; при `log_user=true` пишет user-ход и обновляет `updated_at`.
  3. Журналирует `webhook_forward`, делает curl-запрос к `https://agent.gtstor.com/webhook/chat`, логирует `webhook_response` или `webhook_error`.
  4. При `log_assistant=true` пишет ответ ассистента, добавляет `trace_id`/`stage`, фиксирует `sql_insert`.
  5. Возвращает `{ success, chat_id, reply, trace_id, stage, proxied }` и пишет `proxy_success` в журнал.
- **Log-mode contract:** `mode:'log'`, `role`, `message`, `session_id`, `client`, `metadata`, `headers`. Используется вспомогательными сервисами; PHP просто валидирует, пишет `chat_messages`/`chats.updated_at` и журналирует `log_mode_success`.

## 7. Transaction journal
- **Файл:** `/var/www/html/chat_transactions.log` (JSON Lines, UTC).
- **События:** `proxy_request`, `log_mode_request`, `chat_id_resolved`, `sql_insert`, `webhook_forward`, `webhook_response`, `webhook_error`, `webhook_reply_empty`, `proxy_success`, `log_mode_success`.
- **Назначение:** объединённый журнал фиксирует обе стороны — SQL и webhook. Для диагностики достаточно `tail -f /var/www/html/chat_transactions.log`, чтобы увидеть: записан ли ход в базу, ушёл ли запрос в n8n, какой статус вернулся, какой `trace_id` присвоен. Каждое событие содержит `chat_id`; `session_id` пишется в `context.session_id` для соответствия с UX-идентификатором.
- **Отказоустойчивость:** если n8n недоступен, события `webhook_error`/`webhook_reply_empty` покажут причину. User-ход всё равно лежит в SQL (если `log_user=true`), что позволяет расследовать проблемы задним числом.

## 3. Lifecycle Rules

### Creating a chat
1. If request lacks `chat_id`, generate one and insert into `chats` with `gtc_user_id`, timestamps, optional draft `title`, and `is_deleted = false`.
2. Insert the first message into `chat_messages` referencing the new `chat_id`.
3. Return the `chat_id` to the caller immediately.

### Continuing a chat
1. Expect `chat_id` from the client.
2. Validate the chat exists, belongs to `gtc_user_id`, and `is_deleted = false`.
3. Append the user message to `chat_messages`.
4. Generate the AI reply, append it too, and refresh `chats.updated_at` (and optionally refine `title`).

### Rendering the left sidebar
1. Query `chats` where `gtc_user_id = current_user` and `is_deleted = false`.
2. Order by `updated_at DESC`.
3. Return at least `chat_id`, `title`, and `updated_at` for display.

### Opening a chat thread
1. Fetch `chat_messages` for the chosen `chat_id` ordered `created_at ASC`.
2. Stream to the AI agent as context (with your usual truncation/summary safeguards) and to the UI for rendering.

### Logical deletion
1. Verify ownership, then `UPDATE chats SET is_deleted = true, updated_at = now() WHERE chat_id = ? AND gtc_user_id = ?`.
2. Leave `chat_messages` untouched for audit/analytics/recovery.
3. Hidden chats remain queryable for back-office tooling.

## 4. Operational Requirements
- Never issue `DELETE` statements on chats/messages outside privileged admin tooling.
- Log DB errors for create/read/update flows so ops can trace failures.
- User interfaces only surface friendly labels (title, timestamps) and rely on `chat_id` internally.
- All automation (AI agent, n8n nodes, backend endpoints) must generate a new chat when `chat_id` is absent, otherwise treat it as an ongoing session.

## 5. Implementation Plan
1. **Schema migration** – Create `chats` and `chat_messages` tables (SQL migration + rollback script).
2. **Data-access layer** – Add repository/service methods for chat CRUD, message append, logical delete, and list queries filtered by `gtc_user_id`.
3. **API contract update** – Require `chat_id` in chat send endpoints while allowing it to be optional (to trigger chat creation) and ensure responses always return the active `chat_id`.
4. **n8n / worker integration** – Update webhook or workflow inputs to capture `chat_id`, persist messages, and write assistant replies back to SQL.
5. **Frontend sidebar** – Wire the left column to fetch chat summaries (`chat_id`, `title`, `updated_at`) and call the delete endpoint that toggles `is_deleted`.
6. **Chat open loader** – When a user selects a chat, fetch ordered messages, hydrate the UI, and pass the thread to the AI prompt builder.
7. **Title management** – Implement heuristic or AI-driven title updates (e.g., rename after the second user turn or via scheduled job).
8. **Logical delete UX** – Add delete action per chat, confirm ownership on the backend, flip `is_deleted`, and optimistic-update the UI list.
9. **Monitoring & logging** – Emit structured logs for chat/message inserts and SQL errors; add dashboard checks for orphaned messages without chats.
10. **Backfill strategy** – (If legacy transcripts exist) write a one-off importer that inserts historical chats/messages with preserved timestamps.

## 6. API Surface (current implementation)
- `GET /chat/api/chats?gtc_user_id=` — returns up to 100 active chats (sorted by `updated_at`).
- `POST /chat/api/chats` — creates a new chat; body requires `gtc_user_id` and optional `title`.
- `GET /chat/api/chats/:chatId/messages?gtc_user_id=` — returns ordered transcript for the chat.
- `POST /chat/api/messages` — appends a message; body accepts `chat_id` (optional), `gtc_user_id`, `role`, `content`, `metadata`, and optional `title` hint for first message.
- `POST /chat/api/chats/:chatId/delete` — marks a chat as deleted (logical archive) for the owning `gtc_user_id`.

Frontend now calls these endpoints to populate the left-column list, persist every user/bot message, and hide chats via the delete control.

> This directive now lives in the repository so leadership and engineering share the same reference when rolling out SQL-backed chat persistence.

## 8. Mapping inbound JSON → SQL

Чтобы SQL-хранилище полноценно отражало браузерные запросы, при каждом обращении нужно фиксировать следующий набор полей:

| Таблица / колонка | Источник | Примечание |
| --- | --- | --- |
| `chats.chat_id` | `payload.chat_id` (или UUID, если не передан) | Совпадает с клиентским идентификатором; создаётся при первом сообщении. |
| `chats.gtc_user_id` | `payload.client.gtc_user_id` | Используется и как FK для сообщений, и как ограничение доступа. |
| `chats.title` | первые 120 символов `payload.message` | Опционально; можно оставлять `NULL`. |
| `chats.created_at / updated_at` | `NOW()` | `updated_at` обновляется на каждом ходе. |
| `chat_messages.chat_id` | см. выше | PK связи. |
| `chat_messages.gtc_user_id` | `payload.client.gtc_user_id` | Хранится для back-office фильтров. |
| `chat_messages.role` | `'user'` или `'assistant'` | Определяется вызывающим кодом (PHP или workflow). |
| `chat_messages.content` | `payload.message` / `response.reply` | Сырые тексты. |
| `chat_messages.metadata` | см. ниже | JSONB с расширенными данными. |

**Рекомендуемое содержимое `metadata` (JSONB):**

```json
{
	"channel": "web",
	"session_id": "...",          // payload.session_id остаётся обязательным и идёт в метаданные
	"client": {
		"user_id": "...",
		"email": "...",
		"locale": "...",
		"timezone": "...",
		"full_name": "...",
		"metadata": { }
	},
	"headers": { },                 // snapshot из payload.headers
	"page": "/chat/",
	"user_agent": "Mozilla/5.0 ...",
	"language": "ru",
	"trace_id": "wf-...",          // только для role = assistant
	"stage": "final",
	"response": {                    // полный JSON от workflow (assistant)
		"success": true,
		"reply": "..."
	}
}
```

`session_id` сохраняется даже если `chat_id` совпадает с ним: поле нужно для трассировки и исторической совместимости, поэтому PHP-логгер продолжает требовать его в обоих режимах.

## 7. Responsibilities Split (App vs. n8n)

**Web chat application**
- Делает два параллельных действия: `fetch` в `https://agent.gtstor.com/webhook/chat` (живой ответ пользователю) и `queueSqlLog()` → `/chat_api.php` (`mode:'log'`) для записи в SQL.
- Сохраняет `chat_id` из ответов n8n, управляет `session_id`, обеспечивает UX (история, статусы, сбросы) и пишет trace/stage в UI.
- При сетевых сбоях уведомляет пользователя; user-ход всё равно окажется в SQL, если лог-очередь отработала (они повторяют запрос при сетевых ошибках).

**n8n workflow / AI agent**
- Получает запрос напрямую из браузера (CORS разрешён) и возвращает `reply`, `trace_id`, `stage`, `chat_id`.
- Не пишет в SQL напрямую; этот слой остаётся за PHP-логгером. Однако workflow должен возвращать `chat_id`, чтобы фронт прокинул его в следующий `queueSqlLog()`.
- Может продолжать читать историю из Postgres через сервисы (read-only), но все новые записи делает `/chat_api.php` на основании лог-очереди.
