# Chat System Target Architecture

## 1. Goals
- Provide a single backend pipeline for collecting, enriching, and storing every chat message so history and automations share one source of truth.
- Keep both frontends (`/chat` admin console and `/user` end-user portal) on the same APIs, schemas, and event flow.
- Preserve todays stack (PHP glue code, PostgREST, n8n automations, shared JS modules) while making room for future consolidation into a "Chat API" service.

## 2. Backend Pipeline
### Entry Points Used Today
- **PHP endpoints** (e.g., `chat_api.php`, `payment.php`) accept form posts from both UIs, add authentication/context, and forward payloads.
- **PostgREST** exposes read-only queries for chats/messages when a direct SQL view is sufficient.
- **n8n webhooks** collect normalized payloads for workflow orchestration (AI completions, notifications, CRM sync).

### Unified Chat API Concept
- Introduce a logical "Chat API" facade that standardizes routes (`POST /messages`, `GET /chats`, `GET /chats/{id}/messages`, etc.).
- Initial implementation can still be thin PHP scripts that forward to PostgREST/n8n, but consumers only call the Chat API surface.
- The facade enforces schema validation, identifier mapping (`gtc_user_id`, `user_id`), stage defaults, and retries before delegating.

### Desired Data Flow
1. **Inbound message** arrives via PHP form post or future `POST /messages` endpoint.
2. Facade writes the message into the primary DB (via PostgREST insert or direct SQL helper) with full metadata.
3. n8n is triggered (via webhook or DB watch) to run AI enrichment/orchestration.
4. n8n writes the assistant reply back into the DB with the same canonical schema.
5. Frontends poll/subscribe to the DB (through the Chat API) to render a consistent transcript.

## 3. Data Model
### Canonical Chat Message Record
```json
{
  "id": "uuid",
  "chat_id": "uuid",
  "gtc_user_id": 3001,
  "user_id": "USR-123",
  "role": "user | assistant | system",
  "content": "Normalized markdown/plaintext payload",
  "stage": "AWARENESS | CONSIDERATION | DECISION | ...",
  "metadata": {
    "source": "chat_ui | user_portal | webhook",
    "identifier": "email/phone",
    "tags": ["priority", "campaign"]
  },
  "created_at": "2025-12-04T09:22:00Z"
}
```
- Extendable fields include `attachments`, `locale`, or `n8n_run_id` when needed.
- `stage` defaults to `AWARENESS` when not supplied, matching shared transport behavior.

### Canonical Chat List Item (per user)
```json
{
  "chat_id": "uuid",
  "gtc_user_id": 3001,
  "user_id": "USR-123",
  "title": "Lead follow-up",
  "last_message_preview": "Latest assistant/user text",
  "last_message_at": "2025-12-04T09:22:00Z",
  "stage": "CONSIDERATION",
  "unread_count": 2
}
```
- Computed fields (preview, unread_count) can come from SQL views or n8n enrichments but must follow this shape.

## 4. Frontend Service Layer
- Shared module `shared/chat-service.js` becomes the single client for the Chat API, replacing ad-hoc fetch logic.
- Responsibilities:
  - `listChats({ gtc_user_id, filters })` → returns canonical chat list items.
  - `getChatHistory(chat_id)` → fetches ordered message records.
  - `createChat(payload)` → initializes chat rows + first message when needed.
  - `sendMessage({ chat_id, content, stage, metadata })` → posts through the Chat API facade and handles optimistic UI updates/logging.
- The module also wraps shared concerns: identifier resolution, stage defaults, tracing, and fallbacks (e.g., log replay) so both UIs behave identically.

## 5. Frontends
- `/chat` (admin console)
  - Full access to metadata, stage controls, debugging toggles, and SQL/log inspection for operations staff.
  - Uses `shared/chat-service.js` for all network calls but can enable advanced panels on top (filters, runbooks).
- `/user` (end-user portal)
  - Simplified presentation that surfaces conversation history, composer, and limited metadata (stage badge, timestamp).
  - Also depends exclusively on `shared/chat-service.js`, ensuring payload parity with `/chat` and reducing drift.

By converging both UIs on the shared service and logical Chat API, we gain consistent telemetry, simpler testing, and a clear migration path away from scattered scripts while staying compatible with the current PHP/PostgREST/n8n stack.
