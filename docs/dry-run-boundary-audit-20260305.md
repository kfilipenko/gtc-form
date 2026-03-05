# Dry-run Boundary Audit (2026-03-05)

## Scope
Проверка runtime-границ между контурами RJAKA и GTSTOR без переключения трафика.

## Method
- Ручной просмотр runtime PHP-файлов (не docs/backup):
  - `game_chat.php`
  - `admin/chat-qa.php`
  - `admin/chat-qa-feedback.php`
  - `chat_api.php`
  - `chat_api2.php`
- Проверка ссылок на favicon/manifest в HTML:
  - RJAKA: `game-chat.html`, `chat-qa.html`
  - GTSTOR: `chat/index.html`, `chat/internal/index.html`, `user/index.html`, `news/index.html`

## Findings

### 1) DB ownership boundary (runtime)
- RJAKA runtime (`game_chat.php`, `admin/chat-qa.php`, `admin/chat-qa-feedback.php`) использует только `anon_*` таблицы:
  - `anon_chat_messages`
  - `anon_chat_feedback_votes`
- GTSTOR runtime (`chat_api.php`) использует только GTSTOR chat-таблицы:
  - `chats`
  - `chat_messages`
  - `chat_groups`
  - `chat_group_links`
- Прямых пересечений RJAKA runtime -> GTSTOR chat-таблицы и GTSTOR runtime -> `anon_*` в проверенных файлах не обнаружено.

### 2) Legacy/alt API status
- `chat_api2.php` в текущем состоянии отключён (`die('Y');`).
- Риск: accidental use маловероятен, но endpoint стоит считать non-operational до явного re-enable.

### 3) Brand assets boundary
- RJAKA страницы (`game-chat.html`, `chat-qa.html`) ссылаются на RJAKA набор: `/assets/game-chat/favicons/*`.
- GTSTOR страницы (`chat/*`, `user/index.html`, `news/index.html`) используют root-набор (`/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`) и не используют RJAKA favicon path.

## Dry-run verdict
- Статус: **PASS (boundary checks)**
- Блокеры P0/P1 по runtime ownership boundary: **не выявлены**

## Open follow-up (before final cutover)
1. Зафиксировать этот audit как обязательный артефакт cutover.
2. В post-cutover повторить выборочную проверку runtime SQL references (smoke).
3. Оставить `chat_api2.php` в списке контроля как intentionally disabled endpoint.
