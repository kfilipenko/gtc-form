# Release Hand-off — 2026-03-05

Status: READY (`GO` finalized)

## Latest run artifacts (authoritative)

- Session start: [docs/runtime/cutover-session-start-20260305-154542Z.md](docs/runtime/cutover-session-start-20260305-154542Z.md)
- Route dry-run: [docs/runtime/route-switch-dry-run-20260305-155443Z.md](docs/runtime/route-switch-dry-run-20260305-155443Z.md)
- Route plan build: [docs/runtime/route-switch-plan-20260305-155728Z.md](docs/runtime/route-switch-plan-20260305-155728Z.md)
- Generated nginx include: [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)
- Postcheck: [docs/runtime/cutover-postcheck-20260305-155808Z.md](docs/runtime/cutover-postcheck-20260305-155808Z.md)
- Sync guard: [docs/runtime/projects-sync-guard-20260305-155812Z.md](docs/runtime/projects-sync-guard-20260305-155812Z.md)
- Final decision note (`GO`): [docs/runtime/cutover-decision-note-final-20260305-163602Z.md](docs/runtime/cutover-decision-note-final-20260305-163602Z.md)
- Live HTTP smoke (latest): [docs/runtime/live-smoke-http-20260305-163405Z.md](docs/runtime/live-smoke-http-20260305-163405Z.md)
- Postcheck (latest): [docs/runtime/cutover-postcheck-20260305-163410Z.md](docs/runtime/cutover-postcheck-20260305-163410Z.md)
- Sync guard (latest): [docs/runtime/projects-sync-guard-20260305-163411Z.md](docs/runtime/projects-sync-guard-20260305-163411Z.md)
- Nginx apply success: [docs/runtime/nginx-apply-success-20260305-163422Z.md](docs/runtime/nginx-apply-success-20260305-163422Z.md)

## Previous same-day artifacts (traceability)

- Session start (earlier): [docs/runtime/cutover-session-start-20260305-153832Z.md](docs/runtime/cutover-session-start-20260305-153832Z.md)
- Postcheck (earlier): [docs/runtime/cutover-postcheck-20260305-154017Z.md](docs/runtime/cutover-postcheck-20260305-154017Z.md)
- Sync guard (earlier): [docs/runtime/projects-sync-guard-20260305-155251Z.md](docs/runtime/projects-sync-guard-20260305-155251Z.md)
- Final decision note (earlier): [docs/runtime/cutover-decision-note-final-20260305-154414Z.md](docs/runtime/cutover-decision-note-final-20260305-154414Z.md)

## Ticket handoff checklist

- Use package index entry point: [docs/final-package-index-20260305.md](docs/final-package-index-20260305.md)
- Execute manual production phase via runbook: [docs/cutover-execute-now-20260305.md](docs/cutover-execute-now-20260305.md)
- Root apply helper script: [scripts/nginx_split_apply_root.sh](scripts/nginx_split_apply_root.sh)
- Attach the 7 authoritative artifacts above to the release ticket.
- Attach reviewer summary: [docs/pr-ready-changelog-20260305.md](docs/pr-ready-changelog-20260305.md)
- Use ticket-ready comment block: [docs/release-ticket-comment-20260305.md](docs/release-ticket-comment-20260305.md)
- Use final closeout comment block: [docs/final-closeout-comment-20260305.md](docs/final-closeout-comment-20260305.md)
- Use PR closeout note: [docs/pr-closeout-note-20260305.md](docs/pr-closeout-note-20260305.md)
- Attach diff summary (archive): [docs/release-diff-summary-20260305.md](docs/release-diff-summary-20260305.md)
- Use ready-to-tag note: [docs/ready-to-tag-note-20260305.md](docs/ready-to-tag-note-20260305.md)
- Package links integrity check (latest): [docs/runtime/package-links-check-20260305-163820Z.md](docs/runtime/package-links-check-20260305-163820Z.md)
- Session closeout report: [docs/runtime/session-closeout-20260305-160900Z.md](docs/runtime/session-closeout-20260305-160900Z.md)
- Package checksum manifest: [docs/runtime/package-checksums-20260305-160939Z.md](docs/runtime/package-checksums-20260305-160939Z.md)
- Record approver sign-offs (Tech + Product + Ops) in the ticket.
- Keep the older same-day artifacts as audit trail; do not delete.
