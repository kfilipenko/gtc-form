# Release Diff Summary — 2026-03-05

Purpose: archive-oriented summary of changed paths for this release cycle.

## 1) Core docs and handoff package

- [docs/migration-blueprint-v1.md](docs/migration-blueprint-v1.md)
- [docs/cutover-checklist.md](docs/cutover-checklist.md)
- [docs/cutover-ready-summary-20260305.md](docs/cutover-ready-summary-20260305.md)
- [docs/cutover-quick-commands-20260305.md](docs/cutover-quick-commands-20260305.md)
- [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md)
- [docs/pr-ready-changelog-20260305.md](docs/pr-ready-changelog-20260305.md)
- [docs/release-ticket-comment-20260305.md](docs/release-ticket-comment-20260305.md)
- [docs/pr-closeout-note-20260305.md](docs/pr-closeout-note-20260305.md)
- [docs/final-package-index-20260305.md](docs/final-package-index-20260305.md)

## 2) Automation scripts (cutover lifecycle)

- [scripts/cutover_orchestrator.sh](scripts/cutover_orchestrator.sh)
- [scripts/cutover_session_start.sh](scripts/cutover_session_start.sh)
- [scripts/route_switch_dry_run.sh](scripts/route_switch_dry_run.sh)
- [scripts/route_switch_plan_build.sh](scripts/route_switch_plan_build.sh)
- [scripts/cutover_postcheck_capture.sh](scripts/cutover_postcheck_capture.sh)
- [scripts/projects_sync_guard.sh](scripts/projects_sync_guard.sh)
- [scripts/cutover_finalize_note.sh](scripts/cutover_finalize_note.sh)
- [scripts/hard_extraction_dry_run.sh](scripts/hard_extraction_dry_run.sh)
- [scripts/hard_extraction_apply.sh](scripts/hard_extraction_apply.sh)

## 3) Project split contours and manifests

- [projects/rjaka/.env.example](projects/rjaka/.env.example)
- [projects/rjaka/docs/migration-manifest.md](projects/rjaka/docs/migration-manifest.md)
- [projects/rjaka/web/game-chat.html](projects/rjaka/web/game-chat.html)
- [projects/rjaka/web/chat-qa.html](projects/rjaka/web/chat-qa.html)
- [projects/rjaka/api/game_chat.php](projects/rjaka/api/game_chat.php)
- [projects/rjaka/api/admin/chat-qa.php](projects/rjaka/api/admin/chat-qa.php)
- [projects/rjaka/api/admin/chat-qa-feedback.php](projects/rjaka/api/admin/chat-qa-feedback.php)
- [projects/rjaka/db/migrations/20260121_anon_chat.sql](projects/rjaka/db/migrations/20260121_anon_chat.sql)
- [projects/rjaka/db/migrations/20260305_anon_chat_feedback.sql](projects/rjaka/db/migrations/20260305_anon_chat_feedback.sql)
- [projects/rjaka/db/migrations/20260305_anon_chat_feedback_votes.sql](projects/rjaka/db/migrations/20260305_anon_chat_feedback_votes.sql)
- [projects/shared/docs/split-implementation-manifest.md](projects/shared/docs/split-implementation-manifest.md)
- [projects/shared/scripts/bootstrap_split_projects.sh](projects/shared/scripts/bootstrap_split_projects.sh)
- [projects/shared/nginx/rjaka-compat.conf](projects/shared/nginx/rjaka-compat.conf)
- [projects/shared/nginx/gtstor-compat.conf](projects/shared/nginx/gtstor-compat.conf)
- [projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf](projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf)

## 4) Root runtime/app changes observed

- [game-chat.html](game-chat.html)
- [chat-qa.html](chat-qa.html)
- [game_chat.php](game_chat.php)
- [admin/chat-qa.php](admin/chat-qa.php)
- [admin/chat-qa-feedback.php](admin/chat-qa-feedback.php)
- [db/migrations/20260305_anon_chat_feedback.sql](db/migrations/20260305_anon_chat_feedback.sql)
- [db/migrations/20260305_anon_chat_feedback_votes.sql](db/migrations/20260305_anon_chat_feedback_votes.sql)

## 5) Binary/report artifacts observed

- Favicons/images under [assets/game-chat/favicons](assets/game-chat/favicons)
- Updated screenshot under [artifacts/chat-sidebar.png](artifacts/chat-sidebar.png)
- Playwright output under [playwright-report](playwright-report)
- Test output attachment under [test-results](test-results)

## Notes

- This is an archive summary for release communication.
- For exact current file state, use Source Control panel and/or runtime artifact links from [docs/release-hand-off-20260305.md](docs/release-hand-off-20260305.md).
