# Cutover Ready Summary (2026-03-05)

## Scope
Разделение контуров:
- RJAKA (game chat + Q/A history)
- GTSTOR (platform + user/admin chat + workflow logging)

## Current readiness status
- Overall: **CONDITIONALLY READY FOR DRY-RUN / NOT READY FOR FINAL CUTOVER YET**
- Code/DB backup baseline: **Done**
- DB ownership + validation snapshots: **Done**
- SQL pre-check snapshot for cutover comparison: **Done**
- Dry-run execution (section 2): **Done**
- Final go-live smoke/sign-off window: **Pending**

## Evidence (artifacts)
- Migration blueprint: [docs/migration-blueprint-v1.md](docs/migration-blueprint-v1.md)
- Dependency map: [docs/dependency-map.md](docs/dependency-map.md)
- Inventory: [docs/component-inventory.csv](docs/component-inventory.csv)
- DB ownership matrix: [docs/db-ownership-matrix.md](docs/db-ownership-matrix.md)
- Cutover checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)
- Dry-run boundary audit: [docs/dry-run-boundary-audit-20260305.md](docs/dry-run-boundary-audit-20260305.md)
- Dry-run execution report: [docs/dry-run-execution-20260305.md](docs/dry-run-execution-20260305.md)
- Operator start block: [docs/cutover-operator-start-block-20260305.md](docs/cutover-operator-start-block-20260305.md)
- Operator end block: [docs/cutover-operator-end-block-20260305.md](docs/cutover-operator-end-block-20260305.md)
- Quick commands: [docs/cutover-quick-commands-20260305.md](docs/cutover-quick-commands-20260305.md)
- Projects sync guard: [docs/projects-sync-guard-20260305.md](docs/projects-sync-guard-20260305.md)
- Route switch dry-run: [docs/route-switch-dry-run-20260305.md](docs/route-switch-dry-run-20260305.md)
- Route switch plan build: [docs/route-switch-plan-build-20260305.md](docs/route-switch-plan-build-20260305.md)
- Release hand-off: [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)
- PR-ready changelog: [docs/pr-ready-changelog-20260305.md](docs/pr-ready-changelog-20260305.md)
- SQL pre-check snapshot: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
- SQL post-check template: [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
- Final decision note template: [docs/cutover-decision-note-template.md](docs/cutover-decision-note-template.md)
- Working decision note draft: [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)
- Immutable decision note template: [docs/cutover-decision-note-20260305-immutable-template.md](docs/cutover-decision-note-20260305-immutable-template.md)
- Pre-final immutable draft: [docs/cutover-decision-note-20260305-prefinal.md](docs/cutover-decision-note-20260305-prefinal.md)

## Confirmed DB baseline (from latest pre-check)
- Core tables:
  - anon_chat_messages: 19
  - anon_chat_feedback_votes: 3
  - chats: 32
  - chat_messages: 418
  - chat_groups: 6
  - chat_group_links: 10
- Workflow/internal:
  - chat_log: 1201
  - chat_hub_sessions/messages/tools present (low activity)

## Go/No-Go decision guide
### GO for Dry-Run if
- Dry-run gates in checklist section 2 are executed end-to-end.
- No P0/P1 blockers in API/DB routing checks.
- Ownership boundaries (`anon_*` vs `chat*`) are preserved.

### GO for Final Cutover only if
- Dry-run complete and signed off.
- Post-cutover SQL checks pass against pre-check baseline.
- RJAKA and GTSTOR smoke suites are fully green.
- Ops/Backend/QA/Release owners give explicit approval.

### NO-GO triggers
- Any relation errors (`relation does not exist`) in core tables.
- `chat_log` regression (unexpected drop / failed writes under live traffic).
- Unapproved changes in `chat_hub_*` during split window.

## Immediate next actions
1. Start session with `bash scripts/cutover_orchestrator.sh start` and archive generated report from `docs/runtime/`.
2. Run `bash scripts/cutover_orchestrator.sh route-dry-run` before route switch planning.
3. Build staging route artifact with `bash scripts/cutover_orchestrator.sh route-plan`.
4. During real cutover window, execute section 3/4, then run `bash scripts/cutover_orchestrator.sh postcheck` and fill [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md).
5. Run `bash scripts/cutover_orchestrator.sh sync-guard` and ensure no drift between root and `projects/*` contours.
6. Use [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md) and [docs/cutover-decision-note-20260305-prefinal.md](docs/cutover-decision-note-20260305-prefinal.md), then run `bash scripts/cutover_orchestrator.sh finalize GO` (or `NO-GO`) and record sign-offs in release ticket.
