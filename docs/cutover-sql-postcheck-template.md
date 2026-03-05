# Cutover SQL post-check template

## 1) Runtime context
- captured_at_utc: 2026-03-05 15:40:17+00
- database: gtc_db
- user: gtc_user
- mode: TCP (`PGHOST=127.0.0.1`)

## 2) Repeat commands
Use section "9) SQL validation playbook" from [docs/cutover-checklist.md](docs/cutover-checklist.md).

## 3) Paste outputs (raw)
- connection check:
	- `gtc_db|gtc_user|2026-03-05 15:40:17+00`
- table inventory:
	- `anon_chat_feedback_votes`
	- `anon_chat_messages`
	- `anon_chats`
	- `chat_group_links`
	- `chat_groups`
	- `chat_hub_agent_tools`
	- `chat_hub_agents`
	- `chat_hub_messages`
	- `chat_hub_session_tools`
	- `chat_hub_sessions`
	- `chat_hub_tools`
	- `chat_log`
	- `chat_messages`
	- `chat_messages_legacy`
	- `chats`
- row counts:
	- `anon_chats|0`
	- `anon_chat_messages|19`
	- `anon_chat_feedback_votes|3`
	- `chats|32`
	- `chat_messages|418`
	- `chat_groups|6`
	- `chat_group_links|10`
	- `chat_log|1201`
	- `chat_hub_agents|0`
	- `chat_hub_tools|1`
	- `chat_hub_agent_tools|0`
	- `chat_hub_sessions|1`
	- `chat_hub_messages|4`
	- `chat_hub_session_tools|1`
- freshness markers:
	- `anon_chat_messages|max_created_at|2026-03-05 11:30:40+00`
	- `chat_messages|max_created_at|2026-01-19 18:38:47+00`
	- `chat_group_links|max_created_at|2026-01-18 15:27:56+00`
	- `chat_log|max_timestamp|2026-03-01 16:34:24+00`

## 4) Compare against baseline
Baseline file: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)

- chat_log delta:
- chat_hub_* delta: stable (no change vs baseline snapshot)
- core tables availability: PASS
- timestamp movement (anon_chat_messages/chat_messages/chat_log): no regression detected in snapshot comparison

## 5) Result
- status: PASS (provisional; final after section 3/4 sign-off)
- blockers: none detected in SQL/runtime snapshot
- rollback required: no (at snapshot stage)
- approved_by: pending owner sign-off

## 6) Final decision linkage
- decision note file: [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)
- decision status synced: PENDING FINAL GO/NO-GO
