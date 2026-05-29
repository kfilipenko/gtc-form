# ICS-003 - Submit-To-Operator Review Gate

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.0
- Date: 2026-05-29
- Status: Active

## 1. Purpose

This standard defines the reusable submit-to-operator review gate for CrewPortGlobal questionnaires.

The standard separates three operations:

1. field-level autosave;
2. `Save / confirm data` completeness check;
3. explicit `Submit to operator review`.

Autosave and save/confirm must never create an operator task by themselves.

Operator review is created only after backend completeness passes and the user explicitly submits the completed questionnaire.

## 2. Applies To

Current adopters:

```text
/create-profile/
/post-vacancy/
```

Current streams:

| Stream | Owner-facing form | Submit target |
|---|---|---|
| Seafarer supply | `/create-profile/` | Seafarer profile operator review |
| Employer / shipowner demand | `/post-vacancy/` | Company, vessel and crew request review |

Future adopters:

1. owner correction resubmission;
2. future vessel-only form;
3. future company-profile form;
4. any questionnaire that must move from owner draft to team review.

## 3. Canonical Implementation

Backend canonical endpoint:

```text
POST /api/v1/registration/drafts/{draft_id}/submit-review
```

Backend canonical code:

```text
projects/crewportglobal/app/backend/api/public/index.php
```

Canonical backend helpers:

```text
handle_post_draft_submit_review()
cpg_draft_submit_review_blocked_payload()
cpg_registration_draft_completeness()
```

Frontend canonical API client:

```text
projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
window.CPGDrafts.submitForOperatorReview(draftId, options)
```

Schema/status migration:

```text
projects/crewportglobal/app/backend/db/migrations/017_submit_review_gate_statuses.sql
```

## 4. Adapter Contract

Each owner-facing form adapter must provide:

| Adapter input | Purpose |
|---|---|
| `draft_id` | Draft to submit. |
| explicit `role` | Role/form context for backend completeness and protected upload alignment. |
| current form payload save function | Ensures latest user edits are persisted before submit gate check. |
| completeness renderer | Shows numbered missing items when the gate is blocked. |
| submit button state | Hidden or disabled until backend completeness reports `can_submit_to_operator = true`. |

The adapter may localize button labels and status messages, but must not duplicate backend gate logic.

## 5. Gate Rules

The backend must return `409 submit_review_gate_blocked` when completeness fails.

Blocked submission must report:

```text
can_submit_to_operator: false
missing_item_count
blocking_code_count
submit_review_gate.blocked = true
side_effects.created_operator_task = false
side_effects.changed_review_status = false
side_effects.wrote_audit = false
```

Successful submission must:

1. re-run backend completeness;
2. change only the approved review/status fields;
3. write `registration_draft_submitted_for_operator_review` audit evidence;
4. let the computed task engine show the next review task to the correct group or historical executor;
5. avoid publishing, shortlist, employer presentation or employment-decision side effects.

## 6. Status Contract

Draft save status:

| Object | Draft status after save/confirm |
|---|---|
| `seafarer_profiles.review_status` | `draft` |
| `employer_companies.verification_status` | `draft` |
| `vacancy_requests.publication_status` | `draft` |

Submit status:

| Object | Status after successful submit-review |
|---|---|
| `users.registration_status` | `submitted_for_human_review` |
| `seafarer_profiles.review_status` | `submitted_for_human_review` |
| `employer_companies.verification_status` | `submitted` unless already `verified` |
| `vacancy_requests.publication_status` | `submitted_for_human_review` unless already `published` |

## 7. Forbidden Local Logic

Pages and future endpoints must not:

1. create operator-review tasks from autosave;
2. move owner drafts into review from normal save;
3. infer completion only in frontend code;
4. bypass required document checks;
5. submit without explicit role/form context;
6. expose restricted fields in submit responses;
7. publish vacancies or candidates as part of submit-review.

## 8. Current Tests

Regression coverage:

```text
tests/crewportglobal-registration-api.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
```

The tests confirm:

1. incomplete seafarer draft submit is blocked without operator-task side effects;
2. complete seafarer draft can be submitted after required documents are uploaded;
3. demand-side save remains `draft` until explicit submit;
4. demand-side submit changes company/vacancy review states only after required documents are present;
5. `/post-vacancy/` UI follows save -> completeness -> submit-review order.

## 9. Change Propagation Rule

If submit-review logic changes, update:

1. `handle_post_draft_submit_review()`;
2. `window.CPGDrafts.submitForOperatorReview()`;
3. current `/create-profile/` and `/post-vacancy/` adapters only when the adapter contract changes;
4. migration/status documentation if status values change;
5. API and UI regression tests;
6. this implemented standard and the main documentation register.

## 10. Next Adoption Targets

1. owner correction resubmission gate;
2. team-side review-completion gate consistency;
3. future dedicated company and vessel forms;
4. computed task model standardization under `ICS-004`.
