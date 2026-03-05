# Cutover Execute-Now Runbook — 2026-03-05

Назначение: закрыть оставшиеся ручные шаги после уже полученного `GO`.

## Preconditions

- Final package index: [docs/final-package-index-20260305.md](docs/final-package-index-20260305.md)
- Final decision note (`GO`): [docs/runtime/cutover-decision-note-final-20260305-163602Z.md](docs/runtime/cutover-decision-note-final-20260305-163602Z.md)
- Generated nginx snippet: [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)

## 1) Apply nginx changes (staging, then production)

1. Apply corrected root script (it inserts compat includes into `server` context and disables invalid `conf.d` include if present):

```bash
cd /var/www/gtc-form
sudo bash scripts/nginx_split_apply_root.sh
```

2. Validate syntax:

```bash
sudo nginx -t
```

3. Reload nginx (staging):

```bash
sudo systemctl reload nginx
```

4. Repeat the same sequence on production.

Note: direct placement of [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf) into `/etc/nginx/conf.d` is invalid because it contains `location` includes that must be loaded inside a `server` block.

If `nginx -t` fails, stop and execute rollback from section 6 in [docs/cutover-checklist.md](docs/cutover-checklist.md).

## 2) Live smoke checks (mandatory)

Execute all checks from section 4 in [docs/cutover-checklist.md](docs/cutover-checklist.md):

- 4.1 RJAKA smoke
- 4.2 GTSTOR smoke
- 4.3 Nginx/proxy smoke

Acceptance rule: all items are green, no P0/P1 blockers.

## 3) Post-apply evidence capture

From workspace root:

```bash
cd /var/www/gtc-form
bash scripts/cutover_orchestrator.sh postcheck
bash scripts/cutover_orchestrator.sh sync-guard
```

Attach latest generated runtime artifacts to the release ticket.

Latest evidence from current session:

- HTTP smoke: [docs/runtime/live-smoke-http-20260305-161526Z.md](docs/runtime/live-smoke-http-20260305-161526Z.md)
- Postcheck: [docs/runtime/cutover-postcheck-20260305-161454Z.md](docs/runtime/cutover-postcheck-20260305-161454Z.md)
- Sync guard: [docs/runtime/projects-sync-guard-20260305-161455Z.md](docs/runtime/projects-sync-guard-20260305-161455Z.md)
- Manual execution attempt (shows root blockers): [docs/runtime/manual-execution-attempt-20260305-161906Z.md](docs/runtime/manual-execution-attempt-20260305-161906Z.md)

## 4) Record sign-offs in ticket

Use template below:

```text
Cutover execution complete (manual production phase).

- nginx apply (staging): DONE
- nginx apply (production): DONE
- smoke 4.1 RJAKA: PASS
- smoke 4.2 GTSTOR: PASS
- smoke 4.3 nginx/proxy: PASS
- postcheck: PASS (attach latest runtime file)
- sync-guard: PASS (attach latest runtime file)

Approvals:
- Tech Owner: @<name> ✅
- Product Owner: @<name> ✅
- Ops Owner: @<name> ✅
```

## 5) Final release handoff links

- Main entrypoint: [docs/final-package-index-20260305.md](docs/final-package-index-20260305.md)
- Handoff summary: [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)
- Ticket comment (copy/paste): [docs/release-ticket-comment-20260305.md](docs/release-ticket-comment-20260305.md)