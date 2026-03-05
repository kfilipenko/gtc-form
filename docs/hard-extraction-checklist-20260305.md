# Hard Extraction Checklist (2026-03-05)

## Goal
Подготовить безопасную замену compat-wrappers в `projects/*` на native-файлы без влияния на production runtime до cutover-окна.

## Pre-check
1. Запустить dry-run:
   - `cd /var/www/gtc-form`
   - `bash scripts/hard_extraction_dry_run.sh`
2. Убедиться, что отчёт в `docs/runtime/hard-extraction-dry-run-*.md` имеет `status: PASS`.
3. Подтвердить наличие актуального backup snapshot.

## Extraction steps (controlled window)
1. RJAKA: заменить wrappers в `projects/rjaka/web/*` и `projects/rjaka/api/*` на native content из root paths.
2. GTSTOR: заменить wrappers в `projects/gtstor/web/*` и `projects/gtstor/api/*` на native content из root paths.
3. Сохранить migration mirrors для RJAKA и зафиксировать их hash.
4. Проверить отсутствие regressions в runtime-path (root remains active until routing switch).

## Post-check
1. Повторно запустить:
   - `bash scripts/hard_extraction_dry_run.sh`
2. Заархивировать отчёт в release ticket.
3. Обновить манифест:
   - [projects/shared/docs/split-implementation-manifest.md](projects/shared/docs/split-implementation-manifest.md)

## Rollback rule
- При любой структурной ошибке или missing-target вернуть wrappers и остановить extraction phase.
