# Cutover SQL pre-check snapshot

- captured_at_utc: 2026-03-05 15:23:23+00
- database: gtc_db
- user: gtc_user
- mode: TCP (`PGHOST=127.0.0.1`)

## Table inventory (`public`, anon/chat*)
- anon_chat_feedback_votes
- anon_chat_messages
- anon_chats
- chat_group_links
- chat_groups
- chat_hub_agent_tools
- chat_hub_agents
- chat_hub_messages
- chat_hub_session_tools
- chat_hub_sessions
- chat_hub_tools
- chat_log
- chat_messages
- chat_messages_legacy
- chats

## Row counts
- anon_chats: 0
- anon_chat_messages: 19
- anon_chat_feedback_votes: 3
- chats: 32
- chat_messages: 418
- chat_groups: 6
- chat_group_links: 10
- chat_log: 1201
- chat_hub_agents: 0
- chat_hub_tools: 1
- chat_hub_agent_tools: 0
- chat_hub_sessions: 1
- chat_hub_messages: 4
- chat_hub_session_tools: 1

## Freshness markers
- anon_chat_messages.max(created_at): 2026-03-05 11:30:40+00
- chat_messages.max(created_at): 2026-01-19 18:38:47+00
- chat_group_links.max(created_at): 2026-01-18 15:27:56+00
- chat_log.max(timestamp): 2026-03-01 16:34:24+00

## Acceptance reference for post-cutover comparison
- `chat_log` row count must not decrease.
- `chat_hub_*` row counts should remain stable within split scope.
- core tables (`anon_*`, `chats`, `chat_messages`, `chat_groups`, `chat_group_links`) must remain queryable without relation errors.
