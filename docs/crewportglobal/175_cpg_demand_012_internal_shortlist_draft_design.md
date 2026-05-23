# CPG-DEMAND-012 - Internal Shortlist Draft and Approval Guard Design

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Design report
- Source task: Follow-up design slice after CPG-DEMAND-011
- Version: 1.0
- Date: 2026-05-23
- Status: Design prepared, not implemented

## 1. Purpose

This document defines the first safe design for an internal shortlist draft object after structured demand requirements became visible in operator candidate search.

The goal is to let operators prepare a controlled internal shortlist from the read-only structured evaluator without creating employer visibility, employment decisions or automatic presentation.

This document does not change code, UI, database schema, migrations, tests or runtime behavior.

## 2. Design Boundary

The internal shortlist draft must be a separate operator-internal object.

It must not reuse `vacancy_applications.status = presented` as a draft state.

It must not create:

```text
employer-facing candidate rows
vacancy applications
candidate publication snapshots
employment decisions
payment/subscription records
automatic matching scores presented as decisions
```

The draft can only summarize candidates already returned by:

```text
search_model = cpg-demand-010-structured-requirement-evaluator
```

## 3. Proposed Additive Storage Model

Future migration should be additive and idempotent.

### 3.1 `operator_shortlist_drafts`

| Column | Purpose |
|---|---|
| `shortlist_draft_id` | Primary key UUID. |
| `vacancy_request_id` | Demand request being evaluated. |
| `created_by_operator_context` | Temporary operator token or future account identity context summary. |
| `search_model` | Evaluator model used to create the draft. |
| `search_snapshot` | Data-minimized snapshot of demand and candidate summaries used at draft creation time. |
| `approval_guard_snapshot` | Aggregate guard result at creation/update time. |
| `draft_status` | `draft`, `needs_review`, `approved_internal`, `rejected`, `archived`. |
| `employer_visible` | Must default to `false` and remain false in this slice. |
| `created_at`, `updated_at`, `archived_at` | Audit timestamps. |

### 3.2 `operator_shortlist_candidates`

| Column | Purpose |
|---|---|
| `shortlist_candidate_id` | Primary key UUID. |
| `shortlist_draft_id` | Parent internal shortlist draft. |
| `candidate_user_id` | Candidate user/profile identifier. |
| `candidate_search_result` | Data-minimized result copied from candidate search. |
| `match_level` | Search match level at draft time. |
| `blocker_codes` | Search blocker codes at draft time. |
| `approval_guard_result` | Candidate-level guard result. |
| `operator_decision` | `include`, `hold`, `exclude`. |
| `operator_note` | Internal note only. |
| `employer_visible` | Must default to `false` and remain false in this slice. |
| `created_at`, `updated_at` | Audit timestamps. |

## 4. Approval Guard Matrix

The shortlist draft guard must run before a candidate can be included in the draft.

| Guard code | Blocking condition | Source |
|---|---|---|
| `candidate_search_blocked` | Candidate has one or more candidate-search blockers. | `candidate.blockers[]` |
| `structured_requirement_unmatched` | Required COC, endorsement, training or sea-service dimension is not matched. | `dimension_results.*.matched` |
| `profile_not_approved` | Candidate profile is not approved for matching review. | Candidate search blocker / profile status |
| `missing_matching_preparation_consent` | Candidate has no active `matching_preparation` consent. | `seafarer_consent_events` |
| `missing_employer_sharing_consent` | Candidate has no active `employer_sharing` consent. | `seafarer_consent_events` |
| `source_card_correction_open` | Required source-card correction remains unresolved. | Seafarer source-card review state |
| `restricted_medical_access_required` | Candidate selection would require restricted medical details unavailable to general operator. | Visibility matrix / medical guard |
| `employer_payload_forbidden_field_risk` | Candidate summary includes forbidden employer-facing fields. | CPG-SEAFARER-017/018 payload rules |

The guard must return blockers without changing candidate, vacancy or application status.

## 5. Future API Contract

Future endpoints should be operator-only and internal.

| Endpoint | Method | Purpose | Side effects allowed |
|---|---|---|---|
| `/api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts` | `POST` | Create an internal draft from current candidate-search results. | Insert internal draft rows only. |
| `/api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts` | `GET` | List internal drafts for a vacancy. | None. |
| `/api/v1/operator/shortlist-drafts/{shortlist_draft_id}` | `GET` | Read one internal draft with candidate guard results. | None. |
| `/api/v1/operator/shortlist-drafts/{shortlist_draft_id}/candidates/{candidate_user_id}` | `PATCH` | Set internal operator decision `include`, `hold` or `exclude`. | Update internal draft candidate row only. |
| `/api/v1/operator/shortlist-drafts/{shortlist_draft_id}/approval-check` | `POST` | Re-run approval guard on the draft. | Write internal audit/guard snapshot only. |

There should be no employer-facing endpoint in this slice.

## 6. State Transition Rules

| From | To | Allowed when |
|---|---|---|
| none | `draft` | Operator creates draft from read-only search. |
| `draft` | `needs_review` | One or more candidates have guard blockers or manual-review warnings. |
| `draft` | `approved_internal` | All included candidates pass approval guard. |
| `needs_review` | `approved_internal` | Blockers are resolved and guard is re-run successfully. |
| `draft` / `needs_review` | `rejected` | Operator rejects draft internally. |
| any active state | `archived` | Draft is superseded or manually archived. |

No transition may set `employer_visible = true`.

Employer presentation must remain a later, separate, explicitly approved transition.

## 7. Payload Minimization Rules

The shortlist draft must store only data-minimized candidate-search summaries:

Allowed:

```text
candidate_user_id
display_name
primary_rank
department
availability_status
availability_date
match_level
matched_dimensions
blocker codes
dimension_results safe counts and labels
document_summary readiness metadata
```

Forbidden:

```text
email
phone
contact_email
contact_phone
document_metadata
raw seafarer_workspace
certificate numbers
document numbers
uploaded document IDs
storage paths
children/family details
medical declarations
reference contact details
```

## 8. Implementation Sequence

| Step | Scope | Acceptance condition |
|---|---|---|
| 1 | Add migration for internal shortlist draft tables. | Additive/idempotent DDL; default `employer_visible=false`. |
| 2 | Add guard helper that consumes candidate-search payload and consent/card status. | Returns exact blocker codes without status changes. |
| 3 | Add `POST` create draft endpoint. | Creates internal rows only; refuses candidates with hard blockers unless operator marks `hold`. |
| 4 | Add `GET` read/list endpoints. | Returns minimized draft payload. |
| 5 | Add operator UI draft panel. | Shows internal draft state and guard blockers; no employer action. |
| 6 | Add tests. | API and UI prove no employer payload/status transition is created. |

## 9. Test Plan For Future Implementation

Required tests:

```text
API: create internal draft from candidates with no blockers
API: blocked candidate remains hold/excluded and does not become employer-visible
API: missing consent blocks include decision
API: unresolved source-card correction blocks include decision
API: forbidden fields absent from draft payload
UI: operator sees draft candidates and guard blockers
UI: no employer presentation action appears in draft panel
Regression: existing candidate search remains read-only
```

## 10. Recommendation

The next implementation should start with storage and guard helpers, not with employer presentation UI.

The first practical implementation slice should be:

```text
CPG-DEMAND-013 - Internal shortlist draft storage and guard helper
```

That slice should create internal draft rows only and prove that blocked candidates, missing consent and unresolved corrections cannot move into an employer-facing state.
