# User-Facing Web Chat Page — Implementation Plan

_Source document: “Пользовательская страница.md”, provided 2025-12-02. The content below reformats that vision into a sequential delivery plan for implementation inside `gtc-form/chat/`._

## 1. Goals and Success Criteria
1. Deliver a simplified chat UI tailored to end users (no operator tooling) with two main states:
   - **Screen A (pre-login)**: hero description plus clear entry points for registration, login, and theme toggle.
   - **Screen B (post-login)**: full chat experience with top bar, chat list, groups, and conversation area.
2. Keep existing operator console untouched (available through current `chat/index.html`).
3. Allow future enhancements such as billing entry points, group management, and chat meta actions without reworking base layout.

Success is measured by: (a) working navigation between the two screens, (b) persistence of chats/groups per `gtc_user_id`, (c) parity with current chat backend (same APIs, payloads, storage), and (d) responsive layout that works on desktop + mobile.

## 2. Deliverables
1. **New route** (currently published under `/user/`) with its own CSS/JS bundle but shared service utilities (auth, chat API calls).
2. **Modular JS** extracted from current `chat/index.html` where feasible (state, fetch helpers, storage) to avoid code duplication.
3. **UI components** covering:
   - Public hero screen.
   - Auth CTA buttons (triggering existing `/auth` flows).
   - Post-login shell (top bar, sidebar, chat window, composer).
   - Group manager dialogs.
   - Chat list context menus + rename modal.
4. **State layer** handling chats, groups, selection, message streaming, and optimistic UI updates.
5. **QA checklist** + smoke test script for both states.

## 3. Implementation Phases

### Phase 0 – Preparation
1. Confirm target hosting path (`/user/` entry point or SPA route) and CDN strategy for assets.
2. Inventory shared utilities inside `chat/index.html` (auth helpers, chat payload builder, SQL log queue) and decide what to extract into `shared/` modules.
3. Define data contracts with backend for:
   - Chat list (`GET /chat/list`?) filtered by `gtc_user_id`.
   - Group CRUD (temporary JSON stub if API not ready).
   - Message history per `chat_id`.

### Phase 1 – Design & Structure
1. Produce low-fidelity wireframes (desktop + mobile) for Screen A and Screen B referencing provided spec (icons, placements, tooltips).
2. Translate wireframes into semantic HTML skeletons:
   - `header` with brand + action buttons.
   - `main` split into `aside.sidebar` and `.chat-area` (only after login).
3. Define CSS tokens (colors, spacing) aligned with current brand but optimized for user-friendly view (lighter gradients, fewer admin accents).

### Phase 2 – Pre-Login Experience (Screen A)
1. Implement hero section with title, description, and Call-To-Action buttons (“Register”, “Login”).
2. Hook buttons to existing auth flows:
   - `Register` → `/auth/register` (new tab or overlay form?)
   - `Login` → `/auth/login` (modal or redirect).
   - Provide fallback text links for accessibility.
3. Wire theme toggle (☀️/🌙) persisting preference in `localStorage` and applying CSS class on `<body>`.
4. Add telemetry hooks (optional) to record CTA usage.

### Phase 3 – Post-Login Shell (Screen B)
1. Reuse existing auth module to detect login state; when `gtc_user_id` present, mount Screen B instead of Screen A.
2. Build top bar actions:
   - User menu (avatar, copy `gtc_user_id`, profile, logout).
   - Billing button linking to Stripe portal.
   - Theme toggle (shared logic from Phase 2).
3. Implement responsive layout: sidebar collapsible on <960px.

### Phase 4 – Chat List & Groups
1. **Chat list component**
   - Fetch chats for `gtc_user_id` (temporary mock until API).
   - Render title, timestamp, selection state, context menu.
   - Support renaming (inline edit or modal) with optimistic UI.
2. **Group management**
   - Data model: group objects with `id`, `name`, optional color/icon.
   - UI: groups section in sidebar with `All`, list of groups, `+ New group` button.
   - Assign/unassign flow (multi-select panel) accessible from chat context menu and chat header badges.
   - Filtering: clicking group filters visible chats and indicates active filter.
3. **New Chat flow**
   - Button at top of chat list; on click, request new `chat_id`, prefill title from first message.

### Phase 5 – Chat Window & Messaging
1. Header:
   - Display editable chat title and group badges.
   - Provide actions: rename, add to group, delete (soft delete flag).
2. Messages list:
   - Reuse existing rendering logic (user/agent bubbles, product cards) but adapt visuals to new theme.
   - Support lazy loading/pagination if chat history long.
3. Composer:
   - Single-line input with placeholder + send button.
   - Keyboard shortcuts (Enter send, Shift+Enter newline).
4. Networking:
   - Use existing `sendMessage`/`handleAgentResponse` pipeline (n8n webhook + SQL log) via shared module.
   - Ensure `chat_id` from selected chat is attached to payload.

### Phase 6 – Groups & Metadata Persistence
1. Integrate with backend endpoints (or define new ones) for:
   - Create/update/delete group.
   - Assign/unassign chat-to-group links (many-to-many).
2. Add badges under chat header to show assigned groups with quick remove (“×”).
3. Update chat list filtering logic to react to real-time group changes.

### Phase 7 – Polish & Accessibility
1. Hover tooltips for icons as specified (letters/labels on hover).
2. Focus states for keyboard navigation, ARIA labels for buttons.
3. Empty states:
   - No chats: show CTA to start first chat.
   - No results for group filter: display hint to clear filter.
4. Responsive adjustments for tablets/phones.

### Phase 8 – Testing & Launch
1. Unit smoke tests for shared modules (if feasible) and manual test cases:
   - Login/logout transitions.
   - Chat creation, rename, deletion.
   - Group CRUD and filtering.
   - Message send/receive.
2. Cross-browser QA (Chrome, Edge, Safari, mobile Safari/Chrome).
3. Rollout plan:
   - Soft launch via feature flag (link hidden, available to testers).
   - Gather feedback, then link from main navigation.
4. Documentation update in `chat/docs/` describing how to maintain user page vs operator console.

## 4. Open Questions / Dependencies
1. Backend APIs for chat list & groups — confirm endpoints, auth model, pagination.
2. Whether registration/login should happen inline (modals) or redirect to existing `/auth/` page.
3. Strategy for syncing chat history between new UI and legacy console (shared storage assumed, but double-check).
4. Branding assets (logos, icons) — confirm final set before coding.

## 5. Next Steps
1. Approve this plan or annotate required changes.
2. Once approved, create issues/tasks per phase and begin extracting shared modules from `chat/index.html`.

## 6. Deployment Task — Publish `/user/`

**Goal.** Serve the new user-facing chat at `https://app.gtstor.com/user/` alongside the existing operator console at `/chat/` without routing through the n8n chat service.

**Owner prerequisites.** SSH access to `gtc1` (already available), ability to edit `/etc/nginx/sites-available/app.gtstor.com` (or equivalent), and permission to sync static assets into `/var/www/gtc-form` on the production host.

**Steps.**
1. **Sync artifacts:** `rsync -avz /var/www/gtc-form/user/ gtc1:/var/www/gtc-form/user/` and `rsync -avz /var/www/gtc-form/shared/ gtc1:/var/www/gtc-form/shared/` so the latest bundle and shared modules exist on the web host. (If building elsewhere, adjust source paths accordingly.)
2. **Configure nginx:** add a static block such as:
    ```nginx
    location /user/ {
       alias /var/www/gtc-form/user/;
       index index.html;
       try_files $uri $uri/ /user/index.html;
    }
    location /shared/ {
       alias /var/www/gtc-form/shared/;
    }
    ```
    Place it alongside the existing `/chat/` handler so `/chat/*` continues to proxy to n8n while `/user/*` is served from disk.
3. **Reload nginx:** `sudo nginx -t && sudo systemctl reload nginx`.
4. **Smoke test from the server:** `curl -I https://app.gtstor.com/user/` and expect `200 OK`. Repeat for `/user/index.html` and `/shared/ui-formatters.js` to confirm assets resolve.
5. **Smoke test from client seat:** open the same URLs plus `https://app.gtstor.com/chat/` to ensure the admin console still works.

**Deliverables.** Recorded terminal log (or confirmation note) plus screenshots/links proving `/user/` responds with HTTP 200. Update this document’s status and notify the team so QA can begin external testing.

### Deployment Report — Publish `/user/` on app.gtstor.com (2025-12-02)

- **Host:** `GTC1` (`app.gtstor.com`)
- **Engineer:** Konstantin (via AI DevOps assist)

1. **Static assets**
   - Verified `/var/www/gtc-form/user/index.html` and `/var/www/gtc-form/shared/*.js` exist via `ls -l /var/www/gtc-form/user /var/www/gtc-form/shared`.
2. **Nginx configuration**
   - Backed up config with `sudo cp /etc/nginx/sites-available/app.gtstor.com /etc/nginx/sites-available/app.gtstor.com.bak-$(date +%Y%m%d-%H%M%S)`.
   - Added:
     ```nginx
     location /user/ {
         alias /var/www/gtc-form/user/;
         index index.html;
         try_files $uri $uri/ /user/index.html;
     }
     location /shared/ {
         alias /var/www/gtc-form/shared/;
     }
     ```
     Existing `/chat/` routing left untouched.
   - Syntax check `sudo nginx -t` → success; reloaded via `sudo systemctl reload nginx`.
3. **Smoke tests from server**
   - `curl -I https://app.gtstor.com/user/` → `HTTP/1.1 200 OK`.
   - `curl -I https://app.gtstor.com/user/index.html` → `HTTP/1.1 200 OK`.
   - `curl -I https://app.gtstor.com/shared/ui-formatters.js` → `HTTP/1.1 200 OK`.
4. **Browser validation**
   - `https://app.gtstor.com/user/` shows the new public hero/register/login screen.
   - `https://app.gtstor.com/chat/` (admin console) remains fully functional.

   ## Done / Completed
   - Backend: `chat_api.php` now exposes dedicated read-only modes (`list_chats`, `messages`) that both `/chat` and the upcoming `/user` portal rely on for chat lists and history without hitting the stricter logging endpoint.

### VS Report — Chat List & Group Manager (2025-12-15)

- **Selectors touched:** Removed the `.group-list`/`.group-pill` row entirely and repurposed `#newGroupBtn` so the button now opens the new `#groupManagerDialog`. The dialog itself renders inside the existing `group-manager-*` wrapper elements that were added near the bottom of `user/index.html`.
- **Full-height sidebar:** Ensured `.app-shell`, `.app-sidebar`, `.sidebar-section-chats`, and `.chat-sidebar-scroll` all run as flex children with `min-height: 0; flex: 1` plus `overflow-y: auto`, so the chat list column always stretches between the sticky header and the viewport bottom even if there are zero chats.
- **Group CRUD wiring:** Added `openGroupManagerDialog`, `handleGroupManagerCreate`, `handleGroupRename`, `handleGroupDelete`, and `applyGroupMetadataToChats` helpers in `user/index.html`. Creation stores draft groups in `state.groupDrafts` until a chat assignment persists them via `setChatGroups`; rename/delete operations iterate over affected chats and call the existing `persistChatGroupChanges`/`setChatGroups` API to keep backend metadata in sync.
- **Limitations / TODOs:** New groups created via the manager remain local drafts until the user assigns them to at least one chat (same behavior as the shared picker). Rename/delete propagates sequentially across chats, so large accounts may notice short delays while each `setChatGroups` call completes; no dedicated backend group library endpoint exists yet.
