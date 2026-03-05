# Route Switch Plan Build (2026-03-05)

## Purpose
Собрать проверяемый route-switch план-артефакт для staging review без применения в live.

## Command
- `cd /var/www/gtc-form`
- `bash scripts/route_switch_plan_build.sh`

## Outputs
- report: `docs/runtime/route-switch-plan-*.md`
- generated nginx snippet: `projects/shared/nginx/generated/split-route-switch-*.conf`

## Preconditions
- PASS по `route-switch-dry-run`
- PASS по `projects-sync-guard`

## Next
1. Review generated snippet.
2. Include snippet in staging nginx config.
3. Run smoke + postcheck + sync-guard.
4. Proceed to decision finalization.
