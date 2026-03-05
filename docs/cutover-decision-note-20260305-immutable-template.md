# Cutover Decision Note (Immutable Template, 2026-03-05)

## Document policy
- This file is intended for final archival record.
- After GO/NO-GO decision and sign-off, treat content as immutable.
- Any post-sign changes must be made in a new file with a new timestamped name.

## 1) Session context
- decision_timestamp_utc:
- release_window:
- environment: production
- release_owner:
- incident_channel:

## 2) Evidence set
- ready summary: [docs/cutover-ready-summary-20260305.md](docs/cutover-ready-summary-20260305.md)
- checklist: [docs/cutover-checklist.md](docs/cutover-checklist.md)
- dry-run execution: [docs/dry-run-execution-20260305.md](docs/dry-run-execution-20260305.md)
- dry-run boundary audit: [docs/dry-run-boundary-audit-20260305.md](docs/dry-run-boundary-audit-20260305.md)
- SQL pre-check: [docs/cutover-sql-precheck-20260305-152323.md](docs/cutover-sql-precheck-20260305-152323.md)
- SQL post-check: [docs/cutover-sql-postcheck-template.md](docs/cutover-sql-postcheck-template.md)
- working draft: [docs/cutover-decision-note-20260305-working.md](docs/cutover-decision-note-20260305-working.md)

## 3) Gate outcomes
- Dry-run section 2: PASS | FAIL
- Cutover section 3: PASS | FAIL
- Smoke section 4: PASS | FAIL
- SQL acceptance section 9.2: PASS | FAIL
- P0/P1 incidents in release window: none | present

## 4) Critical acceptance facts
- chat_log pre/post and delta:
- chat_hub_* stability:
- core table availability:
- timestamp movement check:
- n8n health:

## 5) Final decision
- Decision: GO | NO-GO
- Effective time:
- One-line rationale:

## 6) Rollback block (fill if NO-GO)
- rollback required: yes | no
- rollback start:
- rollback owner:
- rollback completed: yes | no
- incident reference:

## 7) Sign-off
- Release Owner: name / time / status
- Backend Owner: name / time / status
- Ops Owner: name / time / status
- QA Owner: name / time / status

## 8) Archive metadata
- final_note_version: 1
- supersedes: none
- archived_in_ticket:
- archived_by:
