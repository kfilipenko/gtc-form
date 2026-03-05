# Cutover Operator Start Block (2026-03-05)

## Purpose
Быстрый старт cutover-сессии одной последовательностью команд с автоматической фиксацией evidence.

## Preconditions
- Рабочая директория: `/var/www/gtc-form`
- Доступ к PostgreSQL по TCP (`PGHOST=127.0.0.1`)
- Права на чтение `systemctl status n8n`

## Fast start (manual, 6 steps)
1. Перейти в репозиторий:
   - `cd /var/www/gtc-form`
2. Запустить preflight-скрипт:
   - `bash scripts/cutover_session_start.sh`
3. Открыть последний generated report из `docs/runtime/`.
4. Сверить значения с baseline:
   - [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
5. Если preflight PASS — перейти к section 3 в [docs/cutover-checklist.md](docs/cutover-checklist.md).
6. После cutover — заполнить:
   - [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
   - [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)
   - [docs/cutover-decision-note-20260305-immutable-template.md](docs/cutover-decision-note-20260305-immutable-template.md)

## Expected output
Скрипт формирует файл вида:
- `docs/runtime/cutover-session-start-YYYYMMDD-HHMMSSZ.md`

Отчёт включает:
- DB connection check
- row counts (core + chat_log + chat_hub_*)
- freshness markers
- n8n status
- preflight verdict (PASS/FAIL)
