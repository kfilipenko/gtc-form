# Shared Chat Service Specification

## Canonical Chat Matrix (Authoritative)
- Admin chat (GTC operations): `https://app.gtstor.com/chat/`
- User chat (end-user workspace): `https://app.gtstor.com/user/`
- RJAKA game chat: `https://rjaka.pro/chat/`

RJAKA history route:
- `https://rjaka.pro/chat/history/`

Legacy compatibility routes:
- `/game-chat.html` -> `/chat/`
- `/chat-qa.html` -> `/chat/history/`

## Address Configuration (Domains, Projects, Nginx)
- `https://app.gtstor.com/chat/` and `https://app.gtstor.com/user/` are in `gtc-core-web` and configured in `/etc/nginx/sites-enabled/app.gtstor.com`.
- `https://rjaka.pro/chat/` is in `rjaka-web` and configured in `/etc/nginx/sites-enabled/www.rjaka.pro`.
- RJAKA route compatibility is configured via `/var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf`.
- This service spec applies to GTSTOR chat service (`/chat` and `/user`). RJAKA route ownership is documented to prevent cross-project route confusion.

## Purpose
Provide a single frontend service (`shared/chat-service.js`) that both `/chat` (admin) and `/user` (end-user) import to interact with the canonical Chat backend. The service hides transport differences, enforces identical payloads, and returns normalized objects so both UIs display the same conversations regardless of feature depth.

## Public API
```ts
import { chatService } from '../shared/chat-service.js';
```

### listChats(gtcUserId: number, options?): Promise<ChatSummary[]>
Fetches the latest chats for the given account using `mode=list_chats` via `/chat_api.php`. Optional filters (`limit`, `cursor`, `groupId`) map to backend-supported parameters. Always resolves to normalized summaries ordered by `updated_at`.

### getChatHistory(chatId: string, gtcUserId: number, options?): Promise<{ messages: ChatMessage[]; meta: ChatHistoryMeta }>
Loads messages for a chat using `mode=messages`. Returns the canonical message list plus cursors/timestamps for pagination. Falls back to log snapshot only when the API endpoint fails, and marks the `meta.source` accordingly.

### createChat(gtcUserId: number, payload?: { title?: string; initialMessage?: string; source?: ChatSource }): Promise<ChatSummary>
Creates a chat shell via `mode=create_chat`. If `initialMessage` is provided, the service immediately routes it through `sendMessage()` so the caller receives the created chat plus the first assistant response.

### sendMessage(params: SendMessageParams): Promise<SendMessageResult>
Posts a user message to n8n and logs both the user payload and assistant reply via `/chat_api.php` in `mode=log`. Resolves with `{ message: ChatMessage; assistant?: ChatMessage; traceId?: string; stage?: string; chatId: string }`. Requires `source` (e.g., `'web_chat_admin'`, `'web_chat_user'`) so logs can distinguish origin.

```ts
type ChatSource = 'web_chat_admin' | 'web_chat_user' | string;

type SendMessageParams = {
  chatId?: string;
  gtcUserId: number;
  userId?: string | number | null;
  content: string;
  stage?: string | null;
  sessionId: string;
  source: ChatSource;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
};

type SendMessageResult = {
  chatId: string;
  traceId?: string;
  stage?: string;
  message: ChatMessage;        // echoed user message
  assistant?: ChatMessage;     // assistant reply if webhook succeeded
  rawResponse?: unknown;
};
```

### attachLogger(loggerOptions): SqlLogger
Exposes the shared SQL logger (currently inside `shared/transport.js`) so both UIs can enqueue arbitrary log entries when needed (e.g., system notices). `SqlLogger.queue(payload)` automatically resolves `chat_id` via the supplied resolver.

## Canonical Types
Align with the schema in `chat_messages` and `/chat_api.php` responses.

### Chat Groups: Ownership and Scoping
- Every row in `public.chat_groups` is owned by exactly one user via `gtc_user_id`.
- `public.chat_group_links` ties a user’s groups to their chats: `chat_id` (thread), `group_id` (from `chat_groups`), and the same `gtc_user_id` as owner.
- For a given `gtc_user_id`, the triple of `chats`, `chat_groups`, and `chat_group_links` defines that user’s personal structure of threads and labels; there are no cross-user shared groups in the current design.
- Both `/chat` (admin) and `/user` must consume this identical per-user model. When the admin filters by `gtc_user_id`, they should see exactly the same chats, groups, colors, and assignments the end-user sees.

### ChatSummary
```ts
type ChatSummary = {
  chat_id: string;
  gtc_user_id: number;
  title: string;
  snippet: string;
  last_role: 'user' | 'assistant' | 'system' | null;
  last_message_at: string;      // ISO timestamp
  created_at: string;
  updated_at: string;
  message_count: number;
  groups?: string[];            // optional array once backend supports it
};
```
- Derived directly from `/chat_api.php` (`mode=list_chats`). Service ensures missing timestamps fall back to `updated_at` and that `snippet` never renders empty (fallback to "No messages yet.").

### ChatMessage
```ts
type ChatMessage = {
  message_id: string;
  chat_id: string;
  gtc_user_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  stage?: string | null;
  trace_id?: string | null;
  metadata: {
    session_id?: string;
    client?: {
      gtc_user_id?: number;
      user_id?: string | number | null;
      email?: string | null;
      locale?: string;
      timezone?: string;
    };
    headers?: Record<string, string>;
    source?: ChatSource;
    response?: unknown;        // raw n8n payload for assistant rows
    [key: string]: unknown;
  };
  created_at: string;
};
```
- Matches `chat_messages` table plus the payload logged today. Stage and trace IDs live in metadata until explicit columns are added; the service lifts them to top-level convenience fields for UI use.

### ChatHistoryMeta
```ts
type ChatHistoryMeta = {
  limit: number;
  next_cursor?: string | null;   // timestamp for pagination
  source: 'api' | 'log';         // indicates fallback usage
};
```

## Backend Integration
| Operation        | Endpoint / Mode                                  | Notes |
|------------------|---------------------------------------------------|-------|
| List chats       | `POST /chat_api.php` `{ mode: 'list_chats' }`      | Respects `limit`, `cursor`; service normalizes fields to `ChatSummary`. |
| Chat history     | `POST /chat_api.php` `{ mode: 'messages' }`        | Returns `ChatMessage[]`; fallback to `chat_transactions.log` if HTTP errors occur, flagged via `meta.source = 'log'`. |
| Create chat      | `POST /chat_api.php` `{ mode: 'create_chat' }`     | Returns a single `ChatSummary`. |
| Log messages     | `POST /chat_api.php` `{ mode: 'log' }`             | Used both before and after webhook call. Shared logger handles retries and updates `chat_id` from server response. |
| AI execution     | `POST https://agent.gtstor.com/webhook/chat`       | Same payload builder for both UIs. Response normalization extracts `reply`, `stage`, `trace_id`, `chat_id`. |

- `mode=list_chats` — read-only query that requires `gtc_user_id` and returns `{ success, data: ChatSummary[] }`. This is now the canonical path for `/chat` and `/user` when bootstrapping the chat list through `chat-service.js`.
- `mode=messages` — read-only query that requires both `gtc_user_id` and `chat_id` and returns `{ success, data: ChatMessageRow[] }` plus pagination metadata. Both UIs call this for history panels.
- `mode=log` and `mode=proxy` — write modes that still enforce `message`, `session_id`, and `client.*` fields. They remain responsible for touching PostgreSQL and forwarding payloads to n8n.
- `mode=chat_groups` and `mode=set_chat_groups` always operate in the context of a specific `gtc_user_id`; data must never mix across users.

#### Manual sanity commands (Dec 2025)
Keep a copy of the exact curl calls we use for verification so anyone can rerun them after backend tweaks:

```bash
# list_chats should return HTTP 200 with success=true (data may be empty during early rollout)
curl -s -D - -H 'Content-Type: application/json' \
  -d '{"mode":"list_chats","gtc_user_id":3598}' \
  https://app.gtstor.com/chat_api.php

# messages requires both gtc_user_id and chat_id for the same account
curl -s -D - -H 'Content-Type: application/json' \
  -d '{"mode":"messages","gtc_user_id":3598,"chat_id":"da1458d6-d00a-4749-bcd0-3cb914ab12fe"}' \
  https://app.gtstor.com/chat_api.php

# log mode remains strict and should reject missing fields with HTTP 400
curl -s -D - -H 'Content-Type: application/json' \
  -d '{"mode":"log"}' \
  https://app.gtstor.com/chat_api.php
```

Document the observed HTTP status + payload snippets in release notes whenever we rerun these checks so regressions surface quickly.

The shared service should keep these contracts stable so `/chat` (admin) and `/user` (end-user) stay in sync while the backend team fleshes out the read-mode SQL.

The service always passes `source` (`web_chat_admin` or `web_chat_user`) in both webhook and SQL log payloads so downstream automations can filter by origin. For admin-only metadata (e.g., diagnostic headers), the service accepts `metadata`/`headers` options but strips them from returned `ChatMessage` objects unless flagged for display.

### Normalization Rules
- `chat_id`: prefer webhook/DB value; fall back to locally supplied ID only if backend still null. The service persists the authoritative ID via callbacks so both UIs stay in sync.
- `stage`: stored in message metadata and returned as a top-level field; defaults to `AWARENESS` only when not provided by UI or backend.
- `trace_id`: extracted from webhook response (`trace_id`, `traceId`) or metadata. Logged in SQL and returned in `ChatMessage.trace_id`.
- `timestamps`: all `created_at`/`updated_at` values normalized to ISO strings before hitting callers. If backend returns null, service injects `new Date().toISOString()` while raising a console warning.

## Compatibility with Current `/chat` and `/user`
- **Payload construction**: The service wraps the logic currently in `shared/transport.js` (`buildChatPayload`, identifier resolution, stage defaults). `/chat` and `/user` should call `chatService.sendMessage()` instead of assembling payloads manually.
- **SQL logging**: `createSqlLogger()` migrates into the service so both UIs enqueue logs through the same retry queue. Existing `/chat` queue logic becomes a thin wrapper around `chatService.attachLogger()`.
- **History retrieval**: `/user` already uses `mode=messages`; `/chat` will switch from `localStorage` to `chatService.getChatHistory()` and treat local storage as an optional cache for offline UX only.
- **Chat listing**: `/user` calls `mode=list_chats`; `/chat` will reuse the same `listChats()` output instead of bespoke snapshots. Mock/log fallbacks stay implemented centrally so both UIs share identical behavior.
- **Canon source of truth**: The spec designates PostgreSQL (via `/chat_api.php`) as the authoritative history. Local storage caches in `/chat` are only for UX convenience and must be invalidated when the service provides fresh data.

## Next Steps
1. Implement `shared/chat-service.js` using this API (initial skeleton keeps existing helpers but re-exports them via the service).
2. Update `/chat` and `/user` to import from the service module instead of touching transport/data-service directly.
3. Gradually migrate UI-specific fallbacks (local history, mock data) into optional adapters so the service remains the single integration point.
