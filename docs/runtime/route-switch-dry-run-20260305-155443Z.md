# Route Switch Dry-Run Report

- captured_at_utc: 2026-03-05 15:54:43+00
- mode: non-destructive route switch readiness validation
- status: PASS

## Checks
- OK [RJAKA web] projects/rjaka/web/game-chat.html
- OK [RJAKA web] projects/rjaka/web/chat-qa.html
- OK [RJAKA api] projects/rjaka/api/game_chat.php
- OK [RJAKA api] projects/rjaka/api/admin/chat-qa.php
- OK [RJAKA api] projects/rjaka/api/admin/chat-qa-feedback.php
- OK [GTSTOR web] projects/gtstor/web/index.html
- OK [GTSTOR web] projects/gtstor/web/chat/index.html
- OK [GTSTOR web] projects/gtstor/web/chat/internal/index.html
- OK [GTSTOR web] projects/gtstor/web/user/index.html
- OK [GTSTOR web] projects/gtstor/web/news/index.html
- OK [GTSTOR api] projects/gtstor/api/chat_api.php
- OK [nginx template] projects/shared/nginx/rjaka-compat.conf
- OK [nginx template] projects/shared/nginx/gtstor-compat.conf
- OK [evidence] docs/runtime/projects-sync-guard-20260305-155251Z.md
- OK [evidence] docs/runtime/hard-extraction-apply-20260305-155122Z.md

## Proposed switch order
1. Keep root runtime active.
2. Include compatibility templates from projects/shared/nginx/*.conf in staging first.
3. Validate section 4 smoke checks from docs/cutover-checklist.md.
4. Run cutover_orchestrator postcheck + sync-guard.
5. Finalize decision note (GO/NO-GO).

## Result
- Ready for route-switch planning stage.
