# Final Package Index — 2026-03-05

Single entry point for release, PR, and operations handoff materials.

## 1) Primary entry points

- Release hand-off: [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)
- PR-ready changelog: [docs/pr-ready-changelog-20260305.md](docs/pr-ready-changelog-20260305.md)
- Release ticket comment (copy/paste): [docs/release-ticket-comment-20260305.md](docs/release-ticket-comment-20260305.md)
- PR closeout note (copy/paste): [docs/pr-closeout-note-20260305.md](docs/pr-closeout-note-20260305.md)
- Diff summary (archive): [docs/release-diff-summary-20260305.md](docs/release-diff-summary-20260305.md)
- Ready-to-tag note: [docs/ready-to-tag-note-20260305.md](docs/ready-to-tag-note-20260305.md)
- Final closeout comment (copy/paste): [docs/final-closeout-comment-20260305.md](docs/final-closeout-comment-20260305.md)
- Business announcement: [docs/release-announcement-business-20260305.md](docs/release-announcement-business-20260305.md)
- Tech announcement: [docs/release-announcement-tech-20260305.md](docs/release-announcement-tech-20260305.md)
- Internal daily update: [docs/internal-daily-update-20260305.md](docs/internal-daily-update-20260305.md)

## 2) Authoritative runtime evidence (latest run)

- Session start: [docs/runtime/cutover-session-start-20260305-154542Z.md](docs/runtime/cutover-session-start-20260305-154542Z.md)
- Route dry-run: [docs/runtime/route-switch-dry-run-20260305-155443Z.md](docs/runtime/route-switch-dry-run-20260305-155443Z.md)
- Route plan: [docs/runtime/route-switch-plan-20260305-155728Z.md](docs/runtime/route-switch-plan-20260305-155728Z.md)
- Generated nginx snippet: [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)
- Postcheck: [docs/runtime/cutover-postcheck-20260305-155808Z.md](docs/runtime/cutover-postcheck-20260305-155808Z.md)
- Sync guard: [docs/runtime/projects-sync-guard-20260305-155812Z.md](docs/runtime/projects-sync-guard-20260305-155812Z.md)
- Final decision (`GO`): [docs/runtime/cutover-decision-note-final-20260305-163602Z.md](docs/runtime/cutover-decision-note-final-20260305-163602Z.md)
- Live HTTP smoke (latest): [docs/runtime/live-smoke-http-20260305-163405Z.md](docs/runtime/live-smoke-http-20260305-163405Z.md)
- Postcheck (latest): [docs/runtime/cutover-postcheck-20260305-163410Z.md](docs/runtime/cutover-postcheck-20260305-163410Z.md)
- Sync guard (latest): [docs/runtime/projects-sync-guard-20260305-163411Z.md](docs/runtime/projects-sync-guard-20260305-163411Z.md)
- Nginx apply success: [docs/runtime/nginx-apply-success-20260305-163422Z.md](docs/runtime/nginx-apply-success-20260305-163422Z.md)
- Package links integrity (latest): [docs/runtime/package-links-check-20260305-164520Z.md](docs/runtime/package-links-check-20260305-164520Z.md)
- Package checksum manifest: [docs/runtime/package-checksums-20260305-160939Z.md](docs/runtime/package-checksums-20260305-160939Z.md)

## 3) Core operational docs

- Cutover checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)
- Ready summary: [docs/cutover-ready-summary-20260305.md](docs/cutover-ready-summary-20260305.md)
- Quick commands: [docs/cutover-quick-commands-20260305.md](docs/cutover-quick-commands-20260305.md)
- Route switch plan build guide: [docs/route-switch-plan-build-20260305.md](docs/route-switch-plan-build-20260305.md)
- RJAKA→GTC1 migration runbook: [docs/rjaka-gtc1-migration-runbook-20260305.md](docs/rjaka-gtc1-migration-runbook-20260305.md)
- RJAKA→GTC1 execution log: [docs/rjaka-gtc1-execution-log-20260305.md](docs/rjaka-gtc1-execution-log-20260305.md)
- RJAKA→GTC1 preflight evidence: [docs/runtime/rjaka-gtc1-preflight-20260305-165754Z.md](docs/runtime/rjaka-gtc1-preflight-20260305-165754Z.md)
- RJAKA→GTC1 staging-host evidence: [docs/runtime/rjaka-gtc1-staging-host-20260305-165846Z.md](docs/runtime/rjaka-gtc1-staging-host-20260305-165846Z.md)
- RJAKA→GTC1 staging hardening evidence: [docs/runtime/rjaka-gtc1-staging-hardening-20260305-170109Z.md](docs/runtime/rjaka-gtc1-staging-hardening-20260305-170109Z.md)
- RJAKA→GTC1 staging functional evidence: [docs/runtime/rjaka-gtc1-staging-functional-20260305-170316Z.md](docs/runtime/rjaka-gtc1-staging-functional-20260305-170316Z.md)
- RJAKA→GTC1 webhook probe evidence: [docs/runtime/rjaka-gtc1-webhook-probe-20260305-170506Z.md](docs/runtime/rjaka-gtc1-webhook-probe-20260305-170506Z.md)

## 4) Automation entry points

- Orchestrator: [scripts/cutover_orchestrator.sh](scripts/cutover_orchestrator.sh)
- Session start: [scripts/cutover_session_start.sh](scripts/cutover_session_start.sh)
- Route dry-run: [scripts/route_switch_dry_run.sh](scripts/route_switch_dry_run.sh)
- Route plan build: [scripts/route_switch_plan_build.sh](scripts/route_switch_plan_build.sh)
- Postcheck capture: [scripts/cutover_postcheck_capture.sh](scripts/cutover_postcheck_capture.sh)
- Sync guard: [scripts/projects_sync_guard.sh](scripts/projects_sync_guard.sh)
- Final decision note: [scripts/cutover_finalize_note.sh](scripts/cutover_finalize_note.sh)
- Root apply helper: [scripts/nginx_split_apply_root.sh](scripts/nginx_split_apply_root.sh)

## 5) Manual production-only tasks

- Execute-now runbook: [docs/cutover-execute-now-20260305.md](docs/cutover-execute-now-20260305.md)
- Apply nginx include changes in staging/production after review.
- Execute live smoke checks (section 4): [docs/cutover-checklist.md](docs/cutover-checklist.md)
- Record Tech/Product/Ops sign-offs in release ticket.
