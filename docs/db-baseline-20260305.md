# DB baseline (2026-03-05)

Connection check:
- database: `gtc_db`
- user: `gtc_user`
- checked_at: `2026-03-05 15:00:23+00`

## Exact row counts
- anon_chats: 0
- anon_chat_messages: 19
- anon_chat_feedback_votes: 3
- chats: 32
- chat_messages: 418
- chat_groups: 6
- chat_group_links: 10

## Freshness markers
- anon_chat_messages.max(created_at): 2026-03-05 11:30:40+00
- chat_messages.max(created_at): 2026-01-19 18:38:47+00
- chat_group_links.max(created_at): 2026-01-18 15:27:56+00

## Notes
- PostgreSQL access works via TCP connection (`PGHOST=127.0.0.1`).
- Local socket auth returns peer-auth errors for this user context; TCP mode is the stable path for scripted checks.
