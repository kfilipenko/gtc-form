# Projects Sync Guard (2026-03-05)

## Purpose
Контроль дрейфа между root runtime файлами и их копиями в `projects/rjaka` и `projects/gtstor`.

## Command
- `cd /var/www/gtc-form`
- `bash scripts/projects_sync_guard.sh`

## Output
- report path: `docs/runtime/projects-sync-guard-*.md`
- status:
  - `PASS` — contours синхронизированы с root
  - `FAIL` — найден drift или missing files

## If FAIL
1. Выполнить:
   - `bash scripts/hard_extraction_apply.sh`
2. Повторить:
   - `bash scripts/projects_sync_guard.sh`
3. Заархивировать оба отчёта в release ticket.
