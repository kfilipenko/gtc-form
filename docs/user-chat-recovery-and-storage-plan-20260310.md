# User Chat Recovery And Storage Plan (2026-03-10)

## 1) Where The User Chat Lives

- Frontend entry: `user/index.html`
- Shared transport/service layer: `shared/chat-service.js`, `shared/transport.js`
- User chat docs: `docs/chat-user-current.md`
- Admin chat docs: `docs/chat-admin-current.md`
- N8N workflow export: `docs/workflows/GTC Sales Agent - Web Chat.json`

## 2) Active Runtime Wiring

- `/user/` imports and uses `../shared/chat-service.js`.
- `sendMessage()` goes to `https://agent.gtstor.com/webhook/chat`.
- Chat list/history/create shell go through `/chat_api.php` (`list_chats`, `messages`, `create_chat`).

## 3) Root Cause Found

- `POST https://agent.gtstor.com/webhook/chat` returns HTTP 200 with an empty body.
- This causes no assistant message to appear in `/user/`.
- `POST https://agent.gtstor.com/webhook/web-chat` returns 404 (webhook not registered/active).

## 4) Code Fix Applied (Resilience)

Updated: `shared/chat-service.js`

- Added fallback webhook candidate:
  - primary: `/webhook/chat`
  - fallback: `/webhook/web-chat`
- Added strict handling for:
  - empty response body
  - invalid JSON
  - missing assistant reply
- Added detailed aggregated error text for easier diagnostics.

## 5) Storage Cleanup Applied

- Archived legacy chat page backups from `chat/` to:
  - `/var/www/backups/chat_ui_archives_20260310_174034`
- Moved files count: 11
- Inventory files created:
  - `ARCHIVE_INFO.txt`
  - `moved_files.txt`

## 6) Final Recovery Steps Needed In n8n

1. Ensure one production webhook is active and returns JSON response body with assistant reply:
   - either `/webhook/chat`
   - or `/webhook/web-chat`
2. Keep response contract with at least one reply field:
   - `reply` or `assistant_reply` or `output.reply`/`output.text`
3. Re-test from browser on `/user/` after activation.

## 7) Recommended File Structure Next

- Keep production UI source only in:
  - `user/index.html`
  - `shared/*.js`
- Keep historical page snapshots only under `/var/www/backups/`.
- Keep one source-of-truth docs set:
  - `docs/chat-user-current.md`
  - `docs/chat-admin-current.md`
  - `docs/workflows/*.json`
