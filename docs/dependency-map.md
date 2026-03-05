# Dependency Map (RJAKA / GTSTOR)

## Назначение
Карта зависимостей для безопасного разделения на 2 направления:
- **RJAKA** (игровой чат + история)
- **GTSTOR** (платформа + user/admin чаты)

Документ используется как базовый артефакт перед cutover и repo split.

---

## 1) RJAKA dependency chain

## 1.1 Pages
- `game-chat.html`
- `chat-qa.html`

## 1.2 Frontend → API
- `game-chat.html` → `POST /game_chat.php`
- `chat-qa.html` → `GET /admin/chat-qa.php`
- `chat-qa.html` → `POST /admin/chat-qa-feedback.php`

## 1.3 API → DB
- `game_chat.php`:
  - читает/пишет `anon_chat_messages`
  - fallback reading последнего assistant-reply
- `admin/chat-qa.php`:
  - читает `anon_chat_messages` (pairs user→assistant)
- `admin/chat-qa-feedback.php`:
  - обновляет `anon_chat_messages.feedback_like_count/feedback_dislike_count`
  - пишет `anon_chat_feedback_votes` (уникальность голоса)

## 1.4 API → Workflow
- `game_chat.php` → `https://agent.gtstor.com/webhook/game-chat`

## 1.5 DB objects (RJAKA)
- `public.anon_chats`
- `public.anon_chat_messages`
- `public.anon_chat_feedback_votes`

## 1.6 Brand assets (RJAKA)
- `assets/game-chat/favicons/*`
- используются в:
  - `game-chat.html`
  - `chat-qa.html`

---

## 2) GTSTOR dependency chain

## 2.1 Pages / UI
- `chat/index.html` (user chat)
- `chat/internal/index.html` (admin chat)
- `user/index.html`
- `news/index.html`
- `index.html`

## 2.2 Frontend → API / services
- `chat/*` + `shared/chat-service.js` → `POST /chat_api.php` (modes: `list_chats`, `messages`, `create_chat`, `log`)
- `shared/transport.js` logger → `POST /chat_api.php`
- auth pages → `/auth/*` (proxied backend)
- platform pages → `/api/*` (PostgREST)

## 2.3 API / service → Workflow
- `shared/chat-service.js` / chat flow → `https://agent.gtstor.com/webhook/chat`

## 2.4 API / service → Data sources
- `/chat_api.php` → platform chat storage (current Postgres schema по GTSTOR chat, см. docs)
- `/api/*` → PostgREST (`127.0.0.1:3100`)
- `/auth/*` → auth backend (`127.0.0.1:8085`)

## 2.5 Brand assets (GTSTOR)
- root favicon set (`/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`, etc.)
- используется в `chat/index.html`, `chat/internal/index.html`, `user/index.html`, `news/index.html`, других platform страницах.

---

## 3) Nginx / routing dependencies (app.gtstor.com)

Source: `/etc/nginx/sites-enabled/app.gtstor.com`

- `root /var/www/gtc-form`
- `location /` static try_files
- `location ^~ /api/` → `127.0.0.1:3100` (PostgREST)
- `location /auth/` + callback → `127.0.0.1:8085`
- `location /user/` alias `/var/www/gtc-form/user/`
- `location /shared/` alias `/var/www/gtc-form/shared/`
- `location ~ \.php$` → `php8.1-fpm`
- include `docs/nginx/chat-internal.conf`
- include `docs/nginx/chat-block-public.conf`

Implication: во время split потребуется route decoupling, иначе оба проекта остаются связаны через единый `root`.

---

## 4) Workflow dependencies (observed)

- Docs reference web chat workflow: `docs/web_chat_workflow_plan.md`, `docs/web_chat_workflow_instructions.md`
- Local workflow artifacts: `docs/workflows/`
  - `GTC Sales Agent - Web Chat.json`
  - `Web Search OpenAI.json`
- RJAKA flow reference: `/webhook/game-chat` (через `game_chat.php`)
- GTSTOR flow reference: `/webhook/chat` (через chat-service)

---

## 5) Cross-project coupling points (critical)

1. **Shared domain + shared nginx root**
- Both projects served from `/var/www/gtc-form`.

2. **Common PHP runtime routing (`~ \.php$`)**
- RJAKA and GTSTOR endpoints live in same PHP execution surface.

3. **Mixed docs and migrations in one repo**
- Migration ownership easy to break without strict prefixing/ownership rules.

4. **Brand assets overlap risk**
- Root favicon set and RJAKA set coexist; wrong links can leak cross-brand identity.

5. **Workflow host coupling (`agent.gtstor.com`)**
- Both projects depend on one automation perimeter; separation requires contract hardening.

---

## 6) Cutover safety checklist (dependency-focused)

Before moving any component:
- [ ] For each moved page, target API endpoint exists in destination project.
- [ ] For each moved API, DB schema ownership is validated.
- [ ] For each endpoint, workflow URL + payload contract documented and tested.
- [ ] Nginx route for moved path points only to destination project runtime.
- [ ] Favicon/manifest links on moved pages point only to project-local asset set.
- [ ] Backward compatibility route exists (temporary redirect/proxy) for old URL.

---

## 7) Proposed next planning artifacts

1. `docs/cutover-checklist.md` — пошаговый runbook переключения.
2. `docs/route-compatibility-plan.md` — временные редиректы/прокси между старой и новой структурой.
3. `docs/db-ownership-matrix.md` — таблица “schema/table -> owner project -> migration policy”.
