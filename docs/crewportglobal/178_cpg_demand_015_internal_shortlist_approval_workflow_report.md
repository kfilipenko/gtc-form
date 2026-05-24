# CPG-DEMAND-015 - Internal Shortlist Approval Workflow Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-014
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first internal approval workflow for operator shortlist drafts.

The purpose of this slice is to let an operator approve or reject an existing internal shortlist draft after the CPG-DEMAND-013/014 guard has produced internal-only candidate rows.

This slice does not publish candidates, create vacancy applications, move application statuses, expose candidate data to employers, implement scoring, or make employment decisions.

## 2. Implementation Scope

Changed backend/API surface:

```text
PATCH /api/v1/operator/shortlist-drafts/{shortlist_draft_id}/approval
```

Changed UI surface:

```text
/verify/
```

The endpoint accepts:

```json
{
  "decision": "approve_internal",
  "operator_note": "optional internal note"
}
```

or:

```json
{
  "decision": "reject",
  "operator_note": "optional internal note"
}
```

No new DB migration is required because migration 016 already allows these internal draft states:

```text
approved_internal
rejected
```

The implementation stores the approval result inside `operator_shortlist_drafts.approval_guard_snapshot` and updates only `operator_shortlist_drafts.draft_status`.

## 3. Internal Approval Guard

Internal approval is allowed only when:

1. The draft remains internal-only.
2. At least one candidate is marked `include`.
3. Every included candidate has stored guard status `ready_for_internal_shortlist`.
4. Every included candidate still passes the current candidate-search guard.
5. Included candidate snapshots contain no forbidden employer-facing fields.
6. No vacancy application is created.
7. No employer-facing visibility is created.

Blocked approval returns:

```text
409 shortlist_internal_approval_blocked
```

with:

```text
internal_approval_guard.approval_blockers[]
side_effects.changed_internal_shortlist_status = false
side_effects.creates_vacancy_applications = false
side_effects.changes_application_statuses = false
side_effects.employer_visible = false
```

Current blocker codes:

| Code | Meaning |
|---|---|
| `shortlist_draft_employer_visible` | Draft unexpectedly has employer visibility. |
| `shortlist_draft_archived` | Archived drafts cannot be internally approved. |
| `shortlist_draft_rejected` | Rejected drafts require a future reopen workflow before approval. |
| `no_included_candidates` | Approval requires at least one included candidate. |
| `shortlist_candidate_employer_visible` | Candidate row unexpectedly has employer visibility. |
| `included_candidate_guard_blocked` | Included candidate stored guard is not ready. |
| `included_candidate_forbidden_field_risk` | Included candidate snapshot contains forbidden employer-facing fields. |
| `shortlist_vacancy_not_searchable` | Current candidate search cannot be run for this vacancy. |
| `included_candidate_not_in_current_search_results` | Included candidate is no longer in current search results. |
| `included_candidate_current_guard_blocked` | Included candidate no longer passes the current guard. |

## 4. UI Behavior

After an internal shortlist draft is created in `/verify/`, the candidate-search panel now enables:

```text
Approve internal shortlist
Reject internal shortlist
```

The UI calls the protected operator endpoint and renders the returned draft status.

Approval success displays:

```text
Internal shortlist approved: approved_internal. Employer visible: false.
```

Rejection displays:

```text
Internal shortlist rejected: rejected. Employer visible: false.
```

Guard failure displays exact blocker codes from `internal_approval_guard.approval_blockers`.

## 5. No Employer-Facing Boundary

This slice preserves the same internal-only boundary as CPG-DEMAND-013/014.

The API response side effects remain:

```text
creates_vacancy_applications: false
changes_application_statuses: false
employer_visible: false
```

The UI does not call employer presentation endpoints.

The backend does not update:

```text
vacancy_applications
employer_shortlist_status
presented_candidates
```

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added internal shortlist approval decision parsing, guard evaluation, protected PATCH endpoint, status update and audit event for internal approval/rejection. |
| `projects/crewportglobal/public/verify/index.html` | Added internal approve/reject controls and guarded approval result rendering. |
| `tests/crewportglobal-registration-api.spec.ts` | Added API assertions for successful internal approval and blocked approval when no candidate is included. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added UI assertion for internal approval from the candidate-search panel. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 178 to the documentation register. |
| `docs/crewportglobal/178_cpg_demand_015_internal_shortlist_approval_workflow_report.md` | Added this implementation report. |

## 7. Verification

### 7.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Embedded Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 7.3 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search"
```

Result: 1 passed.

The focused API check confirms:

1. Internal shortlist draft creation still has no employer visibility.
2. `PATCH /api/v1/operator/shortlist-drafts/{id}/approval` can set a guarded draft to `approved_internal`.
3. Hold-only drafts fail internal approval with `shortlist_internal_approval_blocked` and `no_included_candidates`.
4. Approval responses do not contain candidate contact fields or broad document metadata.
5. Employer presented-candidate payload remains empty.

### 7.4 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused UI check confirms:

1. Operator can create an internal shortlist draft from `/verify/`.
2. Operator can approve the internal shortlist draft.
3. The UI renders `approved_internal`.
4. Employer visibility remains false.
5. Candidate contact fields and broad document metadata are not rendered.

### 7.5 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 7.6 API Regression

```bash
npm run test:cpg-api
```

Result: 16 passed.

## 8. Remaining Controlled Gaps

1. Internal approval still does not create employer-facing presentation.
2. There is no shortlist approval history page yet.
3. There is no employer-facing publication workflow after internal approval.
4. Rejection can be recorded, but post-rejection editing/reopen workflow is not implemented in this slice.

## 9. Next Recommended Step

The next slice can design the controlled transition from `approved_internal` shortlist draft to a separate employer-presentation review step.

That future step must still enforce:

1. active `employer_sharing` consent;
2. no unresolved source-card corrections;
3. employer payload allow-list checks;
4. no restricted medical or family/contact data exposure;
5. explicit operator/team approval before any employer-facing payload exists.
