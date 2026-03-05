# RJAKA contour manifest

- Source `game-chat.html` -> target `projects/rjaka/web/game-chat.html` (compat redirect)
- Source `chat-qa.html` -> target `projects/rjaka/web/chat-qa.html` (compat redirect)
- Source `game_chat.php` -> target `projects/rjaka/api/game_chat.php` (php include wrapper)
- Source `admin/chat-qa.php` -> target `projects/rjaka/api/admin/chat-qa.php` (php include wrapper)
- Source `admin/chat-qa-feedback.php` -> target `projects/rjaka/api/admin/chat-qa-feedback.php` (php include wrapper)
- Source `db/migrations/20260121_anon_chat.sql` -> target `projects/rjaka/db/migrations/20260121_anon_chat.sql`
- Source `db/migrations/20260305_anon_chat_feedback.sql` -> target `projects/rjaka/db/migrations/20260305_anon_chat_feedback.sql`
- Source `db/migrations/20260305_anon_chat_feedback_votes.sql` -> target `projects/rjaka/db/migrations/20260305_anon_chat_feedback_votes.sql`

## Notes
- Current step is non-destructive and keeps production paths untouched.
- Next cutover step can replace wrappers with native project-root paths.
