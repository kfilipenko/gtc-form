# Cutover Decision Note (Pre-Final Draft, 2026-03-05)

## Document intent
Предфинальная версия immutable-note с уже заполненными техническими фактами.
В финальном окне требуется обновить только decision/sign-off блок.

## 1) Session context
- decision_timestamp_utc: 2026-03-05 15:40:17+00
- release_window: pending
- environment: production
- release_owner: pending
- incident_channel: pending

## 2) Evidence set
- ready summary: [docs/cutover-ready-summary-20260305.md](docs/cutover-ready-summary-20260305.md)
- checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)
- dry-run execution: [docs/dry-run-execution-20260305.md](docs/dry-run-execution-20260305.md)
- dry-run boundary audit: [docs/dry-run-boundary-audit-20260305.md](docs/dry-run-boundary-audit-20260305.md)
- pre-check baseline: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
- post-check report: [docs/runtime/cutover-postcheck-20260305-154017Z.md](docs/runtime/cutover-postcheck-20260305-154017Z.md)
- post-check template: [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
- working note: [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)

## 3) Gate outcomes
- Dry-run section 2: PASS
- Cutover section 3: PENDING
- Smoke section 4: PENDING
- SQL acceptance section 9.2: PASS (provisional snapshot)
- P0/P1 incidents in release window: none detected in recorded snapshots

## 4) Critical acceptance facts
- chat_log pre/post and delta:
  - baseline: 1201
  - post-check snapshot: 1201
  - delta: 0
- chat_hub_* stability:
  - chat_hub_agents: 0
  - chat_hub_tools: 1
  - chat_hub_agent_tools: 0
  - chat_hub_sessions: 1
  - chat_hub_messages: 4
  - chat_hub_session_tools: 1
  - status: stable
- core table availability:
  - anon_chat_messages: 19
  - anon_chat_feedback_votes: 3
  - chats: 32
  - chat_messages: 418
  - chat_groups: 6
  - chat_group_links: 10
  - status: PASS
- timestamp movement check:
  - anon_chat_messages.max(created_at): 2026-03-05 11:30:40+00
  - chat_messages.max(created_at): 2026-01-19 18:38:47+00
  - chat_log.max(timestamp): 2026-03-01 16:34:24+00
  - assessment: no regression detected
- n8n health: active

## 5) Final decision
- Decision: PENDING (set GO or NO-GO in final window)
- Effective time: pending
- One-line rationale: technical gates passed on recorded snapshots; final decision pending section 3/4 completion and owner sign-off.

## 6) Rollback block (fill if NO-GO)
- rollback required: pending
- rollback start: pending
- rollback owner: pending
- rollback completed: pending
- incident reference: pending

## 7) Sign-off
- Release Owner: pending
- Backend Owner: pending
- Ops Owner: pending
- QA Owner: pending

## 8) Finalization steps
1. Complete section 3 and section 4 of [docs/cutover-checklist.md](docs/cutover-checklist.md).
2. Confirm [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md) values are final for the actual cutover window.
3. Set decision to GO or NO-GO.
4. Collect all sign-offs.
5. Copy finalized content into [docs/cutover-decision-note-20260305-immutable-template.md](docs/cutover-decision-note-20260305-immutable-template.md) and archive in release ticket.
