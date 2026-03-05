# Cutover Decision Note (Working Draft, 2026-03-05)

## 1) Session context
- decision_timestamp_utc: 2026-03-05 15:40:17+00 (latest post-check evidence timestamp)
- release_window: pending (to be set in cutover session)
- environment: production
- release_owner: pending
- incident_channel: pending

## 2) Inputs reviewed
- dry-run execution report: [docs/dry-run-execution-20260305.md](docs/dry-run-execution-20260305.md)
- SQL pre-check baseline: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
- SQL post-check result: [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
- boundary audit: [docs/dry-run-boundary-audit-20260305.md](docs/dry-run-boundary-audit-20260305.md)
- main checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)

## 3) Gate status (current snapshot)
- Dry-run (section 2): PASS
- Cutover sequence (section 3): PENDING
- Smoke checks (section 4): PENDING
- SQL post-check (section 9.2): PASS (provisional snapshot)
- P0/P1 incidents in window: none detected during dry-run

## 4) Critical acceptance facts (latest snapshot)
- `chat_log` row count delta (post - pre): 0 (stable vs pre-check baseline at dry-run timestamp)
- `chat_hub_*` stability check: stable
  - chat_hub_agents: 0
  - chat_hub_tools: 1
  - chat_hub_agent_tools: 0
  - chat_hub_sessions: 1
  - chat_hub_messages: 4
  - chat_hub_session_tools: 1
- core table availability (`anon_*`, `chats`, `chat_messages`, `chat_groups`, `chat_group_links`): PASS
- core counts snapshot:
  - anon_chat_messages: 19
  - anon_chat_feedback_votes: 3
  - chats: 32
  - chat_messages: 418
  - chat_groups: 6
  - chat_group_links: 10
- timestamps movement expected/observed: no regression detected in post-check snapshot
- n8n health during/after post-check: active

## 5) Decision (current draft status)
- Final decision: PENDING (update to GO or NO-GO after section 3/4 completion + owner sign-off)
- Effective time: pending
- Justification (draft):
  - Dry-run gates passed with no P0/P1 blockers.
  - DB ownership and runtime boundaries validated.
  - Post-check snapshot is PASS; final production decision still requires section 3/4 completion and sign-off.

## 6) If NO-GO / rollback block
- rollback required: pending
- rollback start time: pending
- rollback owner: pending
- rollback completion status: pending
- incident/ticket reference: pending

## 7) Sign-off
- Release Owner: pending
- Backend Owner: pending
- Ops Owner: pending
- QA Owner: pending

## 8) Finalization instructions
1. Execute section 3 and section 4 from [docs/cutover-checklist.md](docs/cutover-checklist.md).
2. Validate and lock [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md) with final cutover-window values.
3. Replace PENDING values in this file.
4. Set final decision to GO or NO-GO and collect owner sign-offs.
5. Link final approved note in release ticket.
