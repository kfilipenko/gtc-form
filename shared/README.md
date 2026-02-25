# Shared Chat Frontend Utilities

This folder hosts JS modules reused by both the operator console (`chat/index.html`) and the new user-facing chat experience (`/user/`). Planned modules:

1. `state.js` – session, history, localStorage helpers.
2. `auth.js` – login status polling, profile hydration, Google/OTP glue.
3. `data-service.js` – chat/group fetchers with graceful fallback to mock data.
4. `transport.js` – build payload helper, SQL log queue, request headers snapshot.
5. `ui-formatters.js` – HTML escaping, markdown-like link rendering, product card extraction/rendering.

During Phase 1 we will start by extracting read-only helpers (payload builder, message parsing) while keeping mutation logic in `index.html`. Once stable, both UIs will import from the same scripts via `<script type="module" src="...">`.

## Immediate extraction targets (Phase 5)
1. **Message formatting** – move current product-card renderer and markdown-to-HTML helpers into `ui-formatters.js` so both UIs get identical chat bubbles.
2. **Transport helpers** – expose `buildPayload`, `captureRequestHeaders`, and SQL log queue from a shared `transport.js` module.
3. **Auth/profile fetch** – consolidate `/auth/status` + `/auth/profile` logic into `auth.js` to avoid duplicating `hydrateAuthState()` in two pages.
4. **Data service** – `data-service.js` now wraps chat/group endpoints and gracefully falls back to mocks while backend endpoints are finalized.
5. **Transport helpers** – `transport.js` now centralizes payload building and SQL logging; next step is to migrate the operator console to consume it as well.
6. **UI formatters** – `ui-formatters.js` hosts the shared markdown-to-HTML renderer plus product-card DOM builders used by the user chat page.
7. **State hydrators** – create a `state.js` wrapper managing `session_id`, `chat_id`, and cached chats/groups; user UI can consume it once backend endpoints are ready.
