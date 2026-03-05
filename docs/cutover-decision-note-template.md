# Cutover Decision Note (GO / NO-GO) — Template

## 1) Session context
- decision_timestamp_utc:
- release_window:
- environment:
- release_owner:
- incident_channel:

## 2) Inputs reviewed
- dry-run execution report: [docs/dry-run-execution-20260305.md](docs/dry-run-execution-20260305.md)
- SQL pre-check baseline: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
- SQL post-check result: [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
- boundary audit: [docs/dry-run-boundary-audit-20260305.md](docs/dry-run-boundary-audit-20260305.md)
- main checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)

## 3) Gate status (must be PASS for GO)
- Dry-run (section 2): PASS | FAIL
- Cutover sequence (section 3): PASS | FAIL
- Smoke checks (section 4): PASS | FAIL
- SQL post-check (section 9.2): PASS | FAIL
- P0/P1 incidents in window: none | present

## 4) Critical acceptance facts
- `chat_log` row count delta (post - pre):
- `chat_hub_*` stability check:
- core table availability (`anon_*`, `chats`, `chat_messages`, `chat_groups`, `chat_group_links`): PASS | FAIL
- timestamps movement expected/observed:
- n8n health during/after cutover:

## 5) Decision
- Final decision: GO | NO-GO
- Effective time:
- Justification (1-3 bullets):
  -
  -
  -

## 6) If NO-GO / rollback block
- rollback required: yes | no
- rollback start time:
- rollback owner:
- rollback completion status:
- incident/ticket reference:

## 7) Sign-off
- Release Owner: name / time / status
- Backend Owner: name / time / status
- Ops Owner: name / time / status
- QA Owner: name / time / status

## 8) Notes
- Link this completed note in release ticket and keep immutable after sign-off.
