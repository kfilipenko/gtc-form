# PR-ready Changelog — 2026-03-05

## Scope of this change set

- Built end-to-end cutover operations flow for RJAKA/GTSTOR split preparation.
- Added executable orchestration for start, route readiness, route plan build, postcheck, sync guard, and final decision note.
- Added project-contour readiness and route-switch planning artifacts without destructive production route change.

## What changed

### Orchestration and automation

- Added orchestrator command flow:
  - [scripts/cutover_orchestrator.sh](scripts/cutover_orchestrator.sh)
- Added operational scripts:
  - [scripts/cutover_session_start.sh](scripts/cutover_session_start.sh)
  - [scripts/route_switch_dry_run.sh](scripts/route_switch_dry_run.sh)
  - [scripts/route_switch_plan_build.sh](scripts/route_switch_plan_build.sh)
  - [scripts/cutover_postcheck_capture.sh](scripts/cutover_postcheck_capture.sh)
  - [scripts/projects_sync_guard.sh](scripts/projects_sync_guard.sh)
  - [scripts/cutover_finalize_note.sh](scripts/cutover_finalize_note.sh)

### Runbooks and operator docs

- Updated/extended cutover docs and operator command guides:
  - [docs/cutover-checklist.md](docs/cutover-checklist.md)
  - [docs/cutover-ready-summary-20260305.md](docs/cutover-ready-summary-20260305.md)
  - [docs/cutover-quick-commands-20260305.md](docs/cutover-quick-commands-20260305.md)
  - [docs/route-switch-plan-build-20260305.md](docs/route-switch-plan-build-20260305.md)
  - [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)

### Split project readiness

- Prepared project contours, sync tooling, and nginx compatibility templates for staged switch:
  - [projects/shared/nginx/rjaka-compat.conf](projects/shared/nginx/rjaka-compat.conf)
  - [projects/shared/nginx/gtstor-compat.conf](projects/shared/nginx/gtstor-compat.conf)
  - [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)

## Validation completed

- Route plan stage executed with PASS:
  - [docs/runtime/route-switch-plan-20260305-155728Z.md](docs/runtime/route-switch-plan-20260305-155728Z.md)
- Postcheck executed with PASS:
  - [docs/runtime/cutover-postcheck-20260305-155808Z.md](docs/runtime/cutover-postcheck-20260305-155808Z.md)
- Sync guard executed with PASS:
  - [docs/runtime/projects-sync-guard-20260305-155812Z.md](docs/runtime/projects-sync-guard-20260305-155812Z.md)
- Final decision note generated with GO:
  - [docs/runtime/cutover-decision-note-final-20260305-163602Z.md](docs/runtime/cutover-decision-note-final-20260305-163602Z.md)

## Production-manual items only

- Apply nginx include changes in staging/production according to generated snippet and compatibility templates.
- Run live smoke checks from section 4 of [docs/cutover-checklist.md](docs/cutover-checklist.md).
- Record final approver sign-offs (Tech, Product, Ops) in release ticket.

## Reviewer notes

- This package is operationally complete for pre-cutover readiness and evidence capture.
- No destructive route switch was performed automatically in this run.
- Recommended review entry point: [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)
