# /chat Admin UI — Current Behavior

> **Refactor note (Dec 2025):** `/chat` now imports `../shared/chat-service.js` and routes every chat list, history, and send operation through that shared layer. PostgreSQL via `/chat_api.php` is once again the canonical source of transcripts; the browser keeps a capped local cache purely for offline resilience.

## Canonical Chat Matrix (Source Of Truth)
- Admin chat (GTC operations): `https://app.gtstor.com/chat/`
- User chat (end-user workspace): `https://app.gtstor.com/user/`
- RJAKA game chat: `https://rjaka.pro/chat/`

`/chat/internal/` is not a primary public chat route in the current model and must be treated as internal/legacy unless explicitly documented otherwise.

## Address Configuration (Projects, Domains, Nginx)
- GTSTOR admin chat address is configured under app vhost: `/etc/nginx/sites-enabled/app.gtstor.com`.
- Runtime project/root for this route: `gtc-core-web`, code root `/var/www/gtc-form`, frontend path `chat/`.
- Canonical entrypoint `/chat/` must render the admin UI from `chat/internal/index.html` (via nginx route mapping), to avoid accidental fallback to legacy/RJAKA `chat/index.html` content.
- User chat on `https://app.gtstor.com/user/` is served by the same app vhost and project, but a different frontend path `user/`.
- RJAKA chat is a separate domain route (`rjaka.pro`) and must not be documented as part of app.gtstor.com chat ownership.

## Backend state — December 2025
- `/chat` relies on `chat-service.js` calling `/chat_api.php` with the new read-only modes: `mode=list_chats` for the sidebar and `mode=messages` for the active transcript. Both modes return `{"success":true,"data":[]}` today while SQL queries are being fleshed out, but they already prevent validation errors for bootstrap requests.
- The legacy 400 error (`"message, session_id, and client are required."`) on read-only calls is gone because those requests never hit `mode=log` anymore. Only write operations (manual logging or proxying to n8n) must include the stricter fields.
- PostgreSQL remains the source of truth for chats/messages; the frontend cache is merely an offline convenience copy.

### User-owned chats and groups
- `/chat` always operates in the context of a specific `gtc_user_id` (current operator or a selected user in future admin tooling).
- All data shown for that `gtc_user_id` comes from the same per-user scope: chats from `public.chats`, groups from `public.chat_groups`, and links from `public.chat_group_links`, each filtered by the same `gtc_user_id`.
- When the admin filters by a `gtc_user_id`, they should see the identical threads, group names/colors, and assignments that the end-user sees in `/user`. There are no global/shared groups in the current model; each user owns their own set and applies them to their own chats.

## 1. Entry Points
- **Front-end URL**: `https://app.gtstor.com/chat/` (entrypoint mapped to `chat/internal/index.html`). Delivered as a static HTML/JS page with all logic embedded.
- **Authentication helpers**: The UI talks to `/auth/login`, `/auth/status`, `/auth/profile`, `/auth/request_email_verification`, `/auth/request_password_reset`, `/auth/otp/*`, and `/auth/google`. These endpoints set cookies and return user metadata (`gtc_user_id`, email, etc.).
- **Shared chat service**: `shared/chat-service.js` is imported directly by `chat/index.html` and exposes `chatService.listChats`, `.getChatHistory`, `.createChat`, and `.sendMessage`. This keeps `/chat/` and `/user/` on the same integration contract.
- **Canonical chat API**: `/chat_api.php` stays the PHP façade for PostgreSQL. chatService now owns every `mode=list_chats`, `mode=messages`, `mode=create_chat`, and `mode=log` call, so the UI never `fetch`es these endpoints manually.
- **Workflow webhook**: `chatService.sendMessage()` wraps `POST https://agent.gtstor.com/webhook/chat` (n8n) and normalizes its replies before they reach the UI.
- **Billing helper**: `/payment.php` (opened in a new tab) for subscription state but not part of message delivery.

## 2. Data Formats
### Outbound payload (user → n8n)
Constructed inside `shared/transport.js > buildChatPayload()` (invoked by `chatService.sendMessage()`):
```json
{
  "channel": "web",
  "message": "Free-form user text",
  "session_id": "localStorage chat:session UUID",
  "chat_id": "persisted chat:active-id or SQL log response",
  "stage": "value stored in chat:stage (optional)",
  "client": {
    "gtc_user_id": 3001,
    "user_id": "internal user id or gtc_user_id fallback",
    "email": "user@example.com",
    "locale": "en-US",
    "timezone": "Europe/Berlin",
    "metadata": {
      "full_name": "Name from auth"
    }
  },
  "metadata": {
    "page": "/chat/",
    "user_agent": "UA string",
    "language": "en-US"
  }
}
```
Before calling n8n the shared service augments the payload with:
```json
{
  "headers": {
    "origin": "https://app.gtstor.com",
    "referer": "…",
    "accept-language": "en-US",
    "user-agent": "…"
  },
  "source": "web_chat_frontend"
}
```
chatService POSTs this object to both n8n and `/chat_api.php` (`mode=log`) to keep SQL in sync, so `/chat/` itself no longer duplicates the transport code.

### Inbound payload (n8n → UI)
`chatService.sendMessage()` now unwraps the n8n payload and returns normalized `ChatMessage` objects. The UI mainly inspects:
- `reply` / `assistant_reply` / `output` / `message` — shown to the operator.
- `stage` — stored via `saveStage()` and displayed next to the status pill.
- `trace_id` — used in message metadata and SQL logs.
- `chat_id` — saved locally to keep a stable thread.
- Optional `next_question` field is appended to the reply for follow-up prompts.

### Database touch points
`chat_api.php` writes to PostgreSQL directly (not via PostgREST) using:
- `chats` table: stores `chat_id`, `gtc_user_id`, `title`, timestamps. `ensure_chat_id()` creates a row via `create_chat_shell()` when needed.
- `chat_messages` table: columns `message_id`, `chat_id`, `gtc_user_id`, `role`, `content`, `metadata`, `created_at`.
Metadata currently captures `session_id`, `channel`, request headers, `stage`, `trace_id`, and raw n8n response when logging assistant replies.

## 3. Message Lifecycle
- **Bootstrap from DB**: As soon as `/chat/` knows the `gtc_user_id`, it calls `chatService.listChats()` (limit 50) and `chatService.getChatHistory()` (limit 200) for the newest chat. The normalized `ChatMessage[]` replaces the local cache, which is still saved to `localStorage` for offline UX.
1. **Operator composes a message** and submits the form (`chatForm` handler).
2. **chatService handles payload + headers**: `sendMessage()` builds the request (session, identifiers, stage, request headers) via `buildChatPayload()` and `captureRequestHeaders()` in `shared/transport.js`.
3. **SQL logging happens inside chatService**: the shared queue posts the user payload to `/chat_api.php` (`mode=log`) before the webhook call, ensuring PostgreSQL has the latest text even if the UI tab closes mid-flight.
4. **Webhook dispatch**: chatService posts to `https://agent.gtstor.com/webhook/chat`, waits for JSON, and immediately logs the assistant reply back through `/chat_api.php`.
5. **Normalized result back to UI**: `/chat/` receives `SendMessageResult` (user `ChatMessage`, optional assistant `ChatMessage`, `chatId`, `stage`, `traceId`). It reconciles the pending local echo with the canonical row, appends the assistant entry, and updates `chat:history`.
6. **Ongoing sync**: After sends (or manual refresh), `/chat/` can call `chatService.getChatHistory()` again to ensure timestamps, stages, and snippets match the database. Local cache remains capped at 200 rows purely as a convenience copy.

## 4. Known Limitations
- **Chat switcher UX**: Even though chatService fetches `listChats()`, the admin UI still auto-selects the newest chat and offers no manual picker yet.
- **Stage persistence**: `stage` only updates when n8n returns it. Initial stage is blank, and `/chat/` still stores the last value per browser via `chat:stage`.
- **user_id resolution**: chatService still falls back to `gtc_user_id` when `/auth/status` omits a dedicated `user.id`, so rows in `chat_messages.user_id` are not guaranteed to map to the `users` table.
- **Local cache limits**: Only the most recent 200 messages are cached in `localStorage`; clearing storage wipes the offline view, although the DB remains the source of truth.
- **Error handling**: If n8n fails or returns invalid JSON, the UI shows a system message but the user payload may already be in SQL, producing assistant-less rows that require follow-up.
- **PostgREST unused**: Reporting endpoints are still unused; `/chat/` talks only to `/chat_api.php` + n8n.
