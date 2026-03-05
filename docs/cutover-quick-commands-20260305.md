# Cutover Quick Commands (2026-03-05)

## Single entrypoint
- `bash scripts/cutover_orchestrator.sh start`
- `bash scripts/cutover_orchestrator.sh route-dry-run`
- `bash scripts/cutover_orchestrator.sh route-plan`
- `bash scripts/cutover_orchestrator.sh postcheck`
- `bash scripts/cutover_orchestrator.sh sync-guard`
- `bash scripts/cutover_orchestrator.sh finalize GO`
- `bash scripts/cutover_orchestrator.sh finalize NO-GO`

## Equivalent direct commands
- start: `bash scripts/cutover_session_start.sh`
- route-dry-run: `bash scripts/route_switch_dry_run.sh`
- route-plan: `bash scripts/route_switch_plan_build.sh`
- postcheck: `bash scripts/cutover_postcheck_capture.sh`
- sync-guard: `bash scripts/projects_sync_guard.sh`
- finalize: `bash scripts/cutover_finalize_note.sh GO|NO-GO`

## Recommended release-window sequence
1. `bash scripts/cutover_orchestrator.sh start`
2. `bash scripts/cutover_orchestrator.sh route-dry-run`
3. `bash scripts/cutover_orchestrator.sh route-plan`
4. execute section 3/4 from [docs/cutover-checklist.md](docs/cutover-checklist.md)
5. `bash scripts/cutover_orchestrator.sh postcheck`
6. `bash scripts/cutover_orchestrator.sh sync-guard`
7. finalize decision:
   - `bash scripts/cutover_orchestrator.sh finalize GO`
   - or `bash scripts/cutover_orchestrator.sh finalize NO-GO`
8. add sign-offs and link final note in release ticket
