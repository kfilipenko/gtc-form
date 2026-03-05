# Cutover Post-check Capture

- captured_at_utc: 2026-03-05 15:58:08+00
- pg_host: 127.0.0.1
- pg_port: 5432
- pg_database: gtc_db
- n8n_status: active
- provisional_verdict: PASS
- baseline_reference: docs/cutover-sql-precheck-20260305-152323.md

## Connection
```
gtc_db|gtc_user|2026-03-05 15:58:08+00
```

## Table inventory
```
anon_chat_feedback_votes
anon_chat_messages
anon_chats
chat_group_links
chat_groups
chat_hub_agent_tools
chat_hub_agents
chat_hub_messages
chat_hub_session_tools
chat_hub_sessions
chat_hub_tools
chat_log
chat_messages
chat_messages_legacy
chats
```

## Row counts
```
anon_chats|0
anon_chat_messages|19
anon_chat_feedback_votes|3
chats|32
chat_messages|418
chat_groups|6
chat_group_links|10
chat_log|1201
chat_hub_agents|0
chat_hub_tools|1
chat_hub_agent_tools|0
chat_hub_sessions|1
chat_hub_messages|4
chat_hub_session_tools|1
```

## Freshness markers
```
anon_chat_messages|max_created_at|2026-03-05 11:30:40+00
chat_messages|max_created_at|2026-01-19 18:38:47+00
chat_group_links|max_created_at|2026-01-18 15:27:56+00
chat_log|max_timestamp|2026-03-01 16:34:24+00
```

## Next
- Paste this output into docs/cutover-sql-postcheck-template.md
- Update docs/cutover-decision-note-20260305-working.md
- Finalize docs/cutover-decision-note-20260305-immutable-template.md
