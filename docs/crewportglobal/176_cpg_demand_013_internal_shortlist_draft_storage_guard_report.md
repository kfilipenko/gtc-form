# CPG-DEMAND-013 - Internal Shortlist Draft Storage and Guard Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-012
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first internal shortlist draft implementation.

The purpose is to let an operator save an internal shortlist draft from the structured read-only candidate-search result while keeping employer visibility blocked by design. The draft stores minimized snapshots, candidate guard results and operator decisions, but it does not create vacancy applications, does not move candidates to `presented`, does not expose anything to employers and does not make employment decisions.

## 2. Scope Implemented

Implemented backend surfaces:

```text
POST /api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts
GET /api/v1/operator/shortlist-drafts/{shortlist_draft_id}
```

Implemented storage:

```text
crewportglobal.operator_shortlist_drafts
crewportglobal.operator_shortlist_candidates
```

Implemented guard behavior:

1. A candidate requested as `include` is rejected with HTTP `409` if guard blockers exist.
2. A blocked candidate can be stored as `hold` for internal operator review.
3. Every stored draft and candidate row has `employer_visible = false`.
4. The response returns side-effect controls showing that no vacancy applications, status changes or employer visibility were created.

## 3. Migration 016

Migration:

```text
projects/crewportglobal/app/backend/db/migrations/016_operator_shortlist_drafts.sql
```

Additive tables:

| Table | Purpose |
|---|---|
| `operator_shortlist_drafts` | Internal operator draft for one vacancy request. |
| `operator_shortlist_candidates` | Internal candidate rows attached to a draft. |

Key controls:

| Control | Detail |
|---|---|
| Idempotency | Uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. |
| Employer visibility | Both tables enforce `employer_visible IS FALSE` through check constraints. |
| Draft states | `draft`, `needs_review`, `approved_internal`, `rejected`, `archived`. |
| Candidate decisions | `include`, `hold`, `exclude`. |
| Snapshots | JSONB object checks on search and guard snapshots. |
| Blocker codes | JSONB array check on candidate `blocker_codes`. |

## 4. Guard Matrix

| Guard code | Blocking condition |
|---|---|
| `candidate_search_blocked` | The read-only candidate-search result already contains one or more hard blockers. |
| `structured_requirement_unmatched` | Required COC, endorsement, training or sea-service dimension is required but not matched. |
| `consent_event_store_missing` | Versioned consent-event store is unavailable. |
| `missing_matching_preparation_consent` | Candidate has no active `matching_preparation` consent. |
| `missing_employer_sharing_consent` | Candidate has no active `employer_sharing` consent. |
| `source_card_correction_open` | A source-card review state is still `correction_requested`. |
| `employer_payload_forbidden_field_risk` | Minimized shortlist candidate snapshot contains a forbidden employer-facing key. |

Restricted medical details remain out of scope for the general operator guard. The guard returns:

```text
restricted_medical_access.general_operator_details_visible = false
restricted_medical_access.required_for_this_guard = false
```

## 5. API Contract

### 5.1 Create Internal Draft

```http
POST /api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts
```

Accepted body:

```json
{
  "candidates": [
    {
      "candidate_user_id": "uuid",
      "operator_decision": "include",
      "operator_note": "internal note"
    },
    {
      "candidate_user_id": "uuid",
      "operator_decision": "hold"
    }
  ]
}
```

Response `201`:

```json
{
  "ok": true,
  "shortlist_draft": {
    "draft_status": "draft | needs_review",
    "employer_visible": false,
    "candidates": []
  },
  "side_effects": {
    "created_internal_shortlist_draft": true,
    "creates_vacancy_applications": false,
    "changes_statuses": false,
    "employer_visible": false
  }
}
```

Response `409` when an `include` request is blocked:

```json
{
  "ok": false,
  "error": "shortlist_guard_blocked",
  "blocked_candidates": [],
  "side_effects": {
    "created_internal_shortlist_draft": false,
    "changes_statuses": false,
    "employer_visible": false
  }
}
```

### 5.2 Read Internal Draft

```http
GET /api/v1/operator/shortlist-drafts/{shortlist_draft_id}
```

Returns the internal draft, minimized candidate snapshots, operator decisions and guard results.

## 6. Data Minimization

The shortlist draft stores only the already minimized candidate-search result:

```text
candidate_user_id
display_name
primary_rank
department
availability_status
availability_date
review_status
document_summary
match_level
matched_dimensions
blockers
warnings
dimension_results
side_effects
```

Forbidden values remain absent:

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
restricted family details
restricted medical declaration details
reference contact details
```

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/db/migrations/016_operator_shortlist_drafts.sql` | Added internal shortlist draft and candidate tables. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added internal shortlist draft endpoints, minimized candidate snapshot helper and guard helper. |
| `playwright.crewportglobal.api.config.ts` | Added migration 016 to API test bootstrap. |
| `playwright.crewportglobal.config.ts` | Added migration 016 to UI test bootstrap. |
| `tests/crewportglobal-registration-api.spec.ts` | Added shortlist guard/storage assertions to the candidate-search API test. |
| `docs/crewportglobal/176_cpg_demand_013_internal_shortlist_draft_storage_guard_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 176 to the register. |

## 8. Verification

The implementation was verified on GTC1.

### 8.1 Syntax Check

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Migration Check

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db \
psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/016_operator_shortlist_drafts.sql
```

Result: passed.

### 8.3 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

The focused test confirms:

1. A blocked candidate cannot be requested as `include`.
2. The failed include request returns `shortlist_guard_blocked` and creates no draft.
3. A valid internal draft can store one included candidate and one held blocked candidate.
4. Stored draft and candidate rows remain `employer_visible = false`.
5. The read endpoint returns the same internal draft.
6. No seafarer email, contact fields or broad `document_metadata` appear in the draft payload.

### 8.4 API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result: 16 passed.

### 8.5 Focused Operator UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

## 9. Remaining Controlled Gaps

1. No operator UI for shortlist drafts is implemented in this slice.
2. No employer presentation transition is implemented in this slice.
3. The guard uses current candidate-search snapshots and active consent/source-card states; future slices can add dedicated audit events for guard re-runs.
4. `approved_internal` remains a future state for a later approval workflow.

## 10. Next Recommended Step

The next slice can add an operator-only shortlist draft panel in `/verify/`.

That UI should show:

```text
internal draft status
candidate include/hold/exclude decisions
guard blocker codes
no employer visibility state
explicit approval guard requirement before any future presentation transition
```
