# /user End-User UI — Current Behavior

## 1. UI Structure
- **Public landing (default `data-view="public"`)**: hero header with brand, marketing copy, CTA buttons, and an inline auth card (`#inlineAuthPanel`) that walks through email capture → login → register without leaving the page. This state hides the app shell and keeps the composer disabled.
- **Header controls**: theme toggle (persists `chat:user:theme`), "Sign in"/"Register" ghost buttons (hidden the moment an authenticated session is detected), and once authenticated a user chip with a dropdown (profile, billing, logout). Billing button links to `/payment.php` with prefilled query params.
- **Inline auth panel**: stacked forms hitting `/auth/check_email`, `/auth/login`, `/auth/register`, with password hints, a "Forgot your password?" reset link (mirrors the `/chat` implementation and posts through the same password reset flow), and buttons to open the hosted `/auth/` flow if needed.
- **App view (`data-view="app"`)**: two-column layout. Sidebar contains group filters, chat list with per-item menus (rename/delete), "New chat" and "New group" buttons, plus dialogs for managing groups, renaming, and deleting chats (all client-side only).
- **Main panel**: chat header (title, subtitle, tags), scrollable message log rendered with shared formatter helpers, and a single composer textarea/button pair. Product cards inside assistant replies reuse `shared/ui-formatters.js` to match the admin console visuals.

## 2. Data Flow
- **Authentication**:
  - On load, `fetchAuthStatus()` (`shared/auth.js`) calls `/auth/status` with cookies. Success stores `gtc_user_id`, email, etc. in `localStorage` and switches the page to app view; failure keeps the public screen.
  - Inline auth submits to `/auth/check_email`, `/auth/login`, `/auth/register`; on success the same status hydration runs again. Logout posts to `/auth/logout` and resets stored state.
- **Chat list & groups**:
  - `hydrateShellData()` now calls `listChats(gtc_user_id)` from `shared/chat-service.js` alongside `fetchUserGroups(gtc_user_id)`.
    - `listChats` POSTs to `/chat_api.php` with `{ mode: 'list_chats', gtc_user_id }`. When the API is down it replays `chat_transactions.log` snapshots instead of injecting mock data.
    - `fetchUserGroups` still GETs `/chat/groups?gtc_user_id=…`; when that endpoint fails it falls back to mock groups until a real backend ships.
  - Returned chats are normalized, retitled, and optionally seeded into `state.chatMessages` with faux assistant snippets for UI placeholders.
  - The group list shown in `/user` is the user’s own library scoped to their `gtc_user_id`; assigning a group to a chat uses the same backend tables (`chat_groups`, `chat_group_links`) that `/chat` consumes. When an admin filters by this `gtc_user_id` in `/chat`, they should see the same groups and assignments.
- **Chat history**:
  - Selecting a chat triggers `hydrateChatMessages(chat_id)`, which now calls `getChatHistory(chat_id, gtc_user_id)` from `shared/chat-service.js`. The helper still posts `{ mode: 'messages', … }` to `/chat_api.php` and falls back to log snapshots before giving up.
- **Send message path**:
  1. `handleComposerSend()` ensures authentication, creates or selects a chat shell, echoes the user message locally, and marks the composer as sending.
  2. The handler now calls `sendMessage()` from `shared/chat-service.js`, passing `{ gtc_user_id, chatId, sessionId, stage, source: 'web_chat_user' }` plus lightweight user metadata. The service builds the payload, captures headers, queues SQL logs, and proxies the request to the n8n webhook.
  3. The `SendMessageResult` includes the canonical `chat_id`, any updated `stage`, and the assistant reply. `reconcileChatIdentity()` swaps provisional IDs for the server-issued one, while `ingestServiceMessage()` drops the reply into the log and updates snippets.
  4. Errors surface as inline system notices; `/user` no longer touches `createSqlLogger()` or the webhook directly.
- **Profile/billing actions**: purely client-side, except for opening `/payment.php` with `gtc_user_id` and email query parameters. Group/rename/delete dialogs only mutate local arrays—no backend calls exist yet.

## 3. Data Formats
- **Chat objects (as consumed in JS)**: Derived from `normalizeChatSummary()` inside `shared/chat-service.js`.
  ```json
  {
    "chat_id": "uuid or fallback",
    "title": "string (fallback to snippet/default)",
    "snippet": "last known message preview",
    "updated_at": 1733300000000,
    "created_at": null,
    "message_count": 0,
    "groups": ["grp-tech"]
  }
  ```
  Chats from the backend typically include `chat_id`, `gtc_user_id`, `title`, `last_message`, etc., but `/user` augments them with locally generated `groups` arrays and seeded snippets. Unlike `/chat`, these entries can originate from mock data or log-derived snapshots and are not persisted when renamed/deleted.
- **Message objects (raw → adapted)**:
  - `normalizeMessages()` expects `{ message_id, chat_id, role, content, metadata, created_at }` from `/chat_api.php` or log replay.
  - `adaptServerMessage()` converts each entry into the UI shape:
    ```json
    {
      "id": "message_id or generated",
      "role": "user|bot|system",
      "text": "content",
      "meta": "Assistant · 2m ago",
      "traceId": "uuid or null",
      "stage": "CONSIDERATION or null",
      "ts": 1733300000000
    }
    ```
  - The admin console (`/chat`) does not normalize server data; it relies on in-memory history only. Consequently, `/user` anticipates structured metadata (`metadata.stage`, `metadata.trace_id`) that `/chat` never reads.
- **Outbound payloads**: The shared service still leans on `buildChatPayload()` internally, but `/user` now interacts solely through `chatService.sendMessage()`. Requests include `channel`, `session_id`, `client.{gtc_user_id,user_id,email}`, `metadata.{page,user_agent}` plus `chat_id`, `stage`, and `source: 'web_chat_user'` so downstream logs can differentiate origins.

## 4. Gaps and Inconsistencies
- **Backend coverage**: Both `/user` and `/chat` now rely on `shared/chat-service.js` for listing, creating, logging, and sending messages, so regressions surface across both UIs. `/chat/groups` remains `/user`-only and still depends on future backend support.
- **History expectations**: End-user chats expect server-side history and groups, but the actual DB only stores bare `chats`/`chat_messages` rows without any group assignments. Rename/delete/group operations stay local and silently diverge from the database.
- **Stage handling**: `chatService.sendMessage()` returns the webhook-provided `stage`, but `/user` still persists each value globally (`chat:user:stage`). If n8n omits `stage`, the UI keeps sending the previous phase indefinitely.
- **Identifiers**: `user_id` resolves to `state.user.id` or falls back to `gtc_user_id`. When `/auth/status` lacks a distinct `id`, the payload differs from the admin UI (which can operate without any `user_id`). Downstream automations may treat admin vs user messages as different contacts.
- **Mock/log fallbacks**: Chat lists/history now come exclusively from `/chat_api.php` (with log snapshots as the only fallback), so both UIs see the same transcripts. Group data, however, is still mock-backed when `/chat/groups` fails.

These observations capture the current "as-is" state with `shared/chat-service.js` in place, and highlight the remaining gaps (groups, stages, identifiers) that still diverge between `/user` and `/chat`.
