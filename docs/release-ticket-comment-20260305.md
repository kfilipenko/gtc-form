# Release Ticket Comment — 2026-03-05

Copy/paste block for release ticket:

---

## Cutover Readiness Update (2026-03-05)

Status: READY (`GO` finalized)

### Authoritative artifacts

- Session start: [docs/runtime/cutover-session-start-20260305-154542Z.md](docs/runtime/cutover-session-start-20260305-154542Z.md)
- Route dry-run: [docs/runtime/route-switch-dry-run-20260305-155443Z.md](docs/runtime/route-switch-dry-run-20260305-155443Z.md)
- Route plan build: [docs/runtime/route-switch-plan-20260305-155728Z.md](docs/runtime/route-switch-plan-20260305-155728Z.md)
- Generated nginx include: [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)
- Live HTTP smoke (PASS): [docs/runtime/live-smoke-http-20260305-163405Z.md](docs/runtime/live-smoke-http-20260305-163405Z.md)
- Postcheck (latest): [docs/runtime/cutover-postcheck-20260305-163410Z.md](docs/runtime/cutover-postcheck-20260305-163410Z.md)
- Sync guard (latest): [docs/runtime/projects-sync-guard-20260305-163411Z.md](docs/runtime/projects-sync-guard-20260305-163411Z.md)
- Final decision note (`GO`): [docs/runtime/cutover-decision-note-final-20260305-163602Z.md](docs/runtime/cutover-decision-note-final-20260305-163602Z.md)
- Nginx apply success: [docs/runtime/nginx-apply-success-20260305-163422Z.md](docs/runtime/nginx-apply-success-20260305-163422Z.md)

### Reviewer summary

- PR-ready changelog: [docs/pr-ready-changelog-20260305.md](docs/pr-ready-changelog-20260305.md)
- Release hand-off: [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)

### Production-manual actions

- Run root helper to apply nginx fix in correct `server` context:
	- [scripts/nginx_split_apply_root.sh](scripts/nginx_split_apply_root.sh)
- Run live smoke checks from section 4 of [docs/cutover-checklist.md](docs/cutover-checklist.md).
- Keep same-day earlier runtime artifacts as audit trail.

### Sign-offs

- Tech owner: [ ]
- Product owner: [ ]
- Ops owner: [ ]
- Final release decision recorded: `GO`

---
