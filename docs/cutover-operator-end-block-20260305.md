# Cutover Operator End Block (2026-03-05)

## Purpose
Оперативно закрыть cutover-сессию: снять post-check evidence, обновить decision note и заархивировать финальное решение.

## End sequence (5 steps)
1. Запустить post-check capture:
   - `cd /var/www/gtc-form`
   - `bash scripts/cutover_postcheck_capture.sh`
2. Открыть последний отчёт из `docs/runtime/cutover-postcheck-*.md`.
3. Перенести данные в:
   - [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
4. Обновить решение:
   - [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)
5. Финализировать immutable запись:
   - [docs/cutover-decision-note-20260305-immutable-template.md](docs/cutover-decision-note-20260305-immutable-template.md)
   - или автоматически сгенерировать финальную запись из pre-final draft:
     - `bash scripts/cutover_finalize_note.sh GO`
     - `bash scripts/cutover_finalize_note.sh NO-GO`
   - зафиксировать ссылку в release ticket.

## Exit criteria
- post-check заполнен
- GO/NO-GO выставлен
- все owner sign-offs заполнены
- финальная immutable-note залинкована в тикете
