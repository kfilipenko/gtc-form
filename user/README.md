Сделай # User-Facing Chat Page

This directory will contain the new simplified chat interface described in `docs/user_portal_implementation_plan.md`.

Structure (work-in-progress):
- `index.html` – static entrypoint combining HTML, CSS, JS (already imports helpers from `../shared/`).
- `styles/` – optional extracted CSS once layout stabilizes.
- `img/` – icons/illustrations specific to the hero screen.

During early phases we prototyped directly inside `index.html`; the current version keeps logic inline but reuses shared modules for payload construction, SQL logging, and auth status hydration.

## Authentication flow snapshot

1. **Root redirect.** `/<index.html>` now performs a meta + JS redirect to `/user/` so every public entry point lands on the new workspace UX instead of `/chat/`.
2. **Inline auth card.** The hero screen contains a multi-step form that calls `/auth/check_email`, `/auth/login`, and `/auth/register` without leaving the page. Password policy hints are computed client-side and the form scrolls into view whenever an action requires authentication.
3. **Status hydration.** `fetchAuthStatus()` (see `../shared/auth.js`) now returns both `gtc_user_id` and the database `id`, so we can forward `user_id` inside webhook payloads. The helper also exposes `email_verified` to keep localStorage in sync.
4. **Logout.** The user menu triggers a `POST /auth/logout` request and immediately resets the UI to the inline auth state; the old `GET /auth/logout` fallback was removed because that endpoint is not implemented server-side.

These steps ensure the chat payload always contains `{ gtc_user_id, user_id, email }` even after a full page reload.

## Data wiring roadmap
1. **Extract shared helpers** from `chat/index.html` into `../shared` (payload builder, SQL log queue, auth/profile fetchers).
2. **Expose chat list endpoint** (temporary: reuse `/chat_api.php?mode=list` or create `/chat/list`) filtered by `gtc_user_id`.
3. **Expose group CRUD** endpoints (or use mock JSON until backend ready); mirror schema defined in `docs/user_portal_implementation_plan.md`.
4. **Replace mock loaders** in `user/index.html` with async fetch calls, keeping the same `state.chats` and `state.groups` structure to minimize UI changes.
5. **Sync selection + composer** by passing `chat_id` into the existing webhook payload builder once messaging is wired in Phase 5.

## Current API surface

The user portal now talks to the existing `/chat_api.php` controller using dedicated modes:

- `GET /chat_api.php?mode=list&gtc_user_id=XXXX` — loads all active chats (excluding `is_deleted = true`) sorted by `chat_id` descending along with last-message snippets and pagination cursor support via `cursor`.
- `GET /chat_api.php?mode=messages&gtc_user_id=XXXX&chat_id=UUID` — streams the ordered transcript for the selected chat so the UI can hydrate the message pane on demand.
- `POST /chat_api.php` with `{ "mode": "create_chat", "gtc_user_id": ..., "title": "…" }` — creates an empty chat shell immediately after the user clicks “New chat” so the sidebar stays in sync after refresh.

Those modes reuse the Postgres helpers from `chat/lib/chat_bootstrap.php` and rely on existing PHP deployment, so no additional nginx routing is required. Frontend fallbacks (mock chats/groups) only trigger if the API returns a non-200 response. When the auth helper supplies `id`, message payloads now send both `gtc_user_id` and `user_id`, which keeps n8n workflows aligned with the Postgres users table.
