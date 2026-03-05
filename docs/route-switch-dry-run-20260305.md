# Route Switch Dry-Run (2026-03-05)

## Purpose
Проверка готовности к этапу route switch без изменения live nginx конфигурации.

## Command
- `cd /var/www/gtc-form`
- `bash scripts/route_switch_dry_run.sh`

## What is validated
- наличие contour-файлов RJAKA/GTSTOR в projects/*
- наличие nginx compat templates в projects/shared/nginx/*
- наличие execution evidence:
  - sync-guard report
  - hard-extraction apply report

## Output
- `docs/runtime/route-switch-dry-run-*.md`
- status PASS/FAIL

## Next after PASS
1. Execute route switch in staging with compat templates.
2. Run smoke checks from docs/cutover-checklist.md section 4.
3. Run orchestrator: postcheck + sync-guard + finalize.
