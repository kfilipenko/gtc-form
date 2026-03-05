# Route Switch Plan Build

- built_at_utc: 2026-03-05 15:57:28+00
- status: PASS
- generated_snippet: projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf

## Inputs
- RJAKA nginx template: projects/shared/nginx/rjaka-compat.conf
- GTSTOR nginx template: projects/shared/nginx/gtstor-compat.conf
- latest sync-guard: docs/runtime/projects-sync-guard-20260305-155251Z.md
- latest route-dry-run: docs/runtime/route-switch-dry-run-20260305-155443Z.md

## Planned sequence
1. Review generated snippet and templates.
2. Apply in staging nginx include chain only.
3. Run section 4 smoke checks from docs/cutover-checklist.md.
4. Execute orchestrator postcheck + sync-guard.
5. Finalize GO/NO-GO note.

## Result
- Route switch plan artifact is ready for staging review.
