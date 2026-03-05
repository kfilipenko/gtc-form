# Hard Extraction Dry-Run

- captured_at_utc: 2026-03-05 15:51:22+00
- mode: non-destructive validation
- status: PASS (pre-check; final status below)

## RJAKA contour files
- OK|projects/rjaka/web/game-chat.html
- OK|projects/rjaka/web/chat-qa.html
- OK|projects/rjaka/api/game_chat.php
- OK|projects/rjaka/api/admin/chat-qa.php
- OK|projects/rjaka/api/admin/chat-qa-feedback.php
- OK|projects/rjaka/db/migrations/20260121_anon_chat.sql
- OK|projects/rjaka/db/migrations/20260305_anon_chat_feedback.sql
- OK|projects/rjaka/db/migrations/20260305_anon_chat_feedback_votes.sql

## GTSTOR contour files
- OK|projects/gtstor/web/index.html
- OK|projects/gtstor/web/chat/index.html
- OK|projects/gtstor/web/chat/internal/index.html
- OK|projects/gtstor/web/user/index.html
- OK|projects/gtstor/web/news/index.html
- OK|projects/gtstor/api/chat_api.php
- OK|projects/gtstor/api/chat_api2.php

## Native source targets
- OK|game-chat.html
- OK|chat-qa.html
- OK|game_chat.php
- OK|admin/chat-qa.php
- OK|admin/chat-qa-feedback.php
- OK|index.html
- OK|chat/index.html
- OK|chat/internal/index.html
- OK|user/index.html
- OK|news/index.html
- OK|chat_api.php
- OK|chat_api2.php

## Wrapper/redirect references
```
projects/gtstor/web/index.html:6:  <meta http-equiv="refresh" content="0; url=/user/" />
```

## Final verdict
- status: PASS
- result: hard-extraction preparation is structurally ready for controlled copy phase

## Next actions
1. Keep wrappers as active path until controlled copy is executed.
2. Replace wrapper files in projects/* with native copies in a dedicated extraction window.
3. Re-run this script and archive report in release ticket.
