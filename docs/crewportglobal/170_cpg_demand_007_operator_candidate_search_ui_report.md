# CPG-DEMAND-007 - Operator Candidate Search UI Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-006
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first operator UI surface for the read-only internal candidate search prototype.

The purpose is practical: an operator can open a vacancy request in `/verify/`, run a candidate search manually and inspect safe match summaries before any future shortlist, presentation or employer-facing workflow is approved.

## 2. Scope Implemented

Implemented narrowly:

1. Added a `Candidate search` section to vacancy request details in `/verify/`.
2. Added a manual `Run candidate search` action that calls:

```text
GET /api/v1/operator/vacancies/{vacancy_request_id}/candidate-search?limit=25
```

3. Rendered safe candidate search output:

```text
display_name
primary_rank
department
availability_status
availability_date
match_level
matched_dimensions
blockers
warnings
document_summary readiness fields
```

4. Preserved the no-side-effect boundary in visible UI text:

```text
no vacancy applications
no status changes
no employer visibility
```

Not implemented:

1. No automatic matching run.
2. No score calculation.
3. No shortlist creation.
4. No vacancy application creation.
5. No employer presentation.
6. No employment decision.
7. No database migration.
8. No backend behavior change in this slice.

## 3. UI Behavior

The section is shown only when the opened draft detail payload contains a `vacancy_request_id`.

The operator must explicitly click `Run candidate search`. The page then uses the existing temporary operator token boundary and renders the returned candidates as internal review cards.

If operator access is missing or invalid, the existing operator access panel is shown and no search result is rendered.

## 4. Data Minimization

The UI renders only the already minimized candidate-search response from CPG-DEMAND-006.

The UI does not render:

```text
candidate email
candidate phone
contact_email
contact_phone
seafarer_email
document_metadata
seafarer_workspace
medical declarations
family details
identity document numbers
raw uploaded document IDs
```

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Added the vacancy-detail candidate search panel, i18n strings and safe result rendering. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added a focused UI test for manual read-only candidate search and sensitive candidate contact exclusion. |
| `docs/crewportglobal/170_cpg_demand_007_operator_candidate_search_ui_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 170 to the register. |

## 6. Verification

The implementation was verified on GTC1.

### 6.1 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

This check confirms:

1. Vacancy request details render the `Candidate search` panel.
2. The manual UI action calls the read-only candidate-search endpoint.
3. Exact candidate rows show `match_ready` and matched dimensions.
4. Mismatch candidate rows show `blocked` plus `rank_mismatch` and `vessel_type_mismatch`.
5. Candidate e-mail, contact phone, `contact_email`, `contact_phone` and `document_metadata` do not appear in the candidate-search panel.

### 6.2 Focused Operator Queue Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

This confirms the existing operator queue, seafarer review, vacancy application review and new candidate-search panel remain compatible.

## 7. Remaining Risks And Controlled Gaps

1. The search is still exact-match prototype logic from CPG-DEMAND-006.
2. The UI is operator-only and internal; it is not an employer view.
3. There is still no scoring, shortlist workflow or presentation workflow.
4. The next implementation slice should decide whether to improve matching inputs first or introduce a controlled operator shortlist object.

## 8. Next Recommended Step

The next practical step should remain narrow:

```text
CPG-DEMAND-008 - controlled operator shortlist draft or matching input expansion decision
```

Before any employer-facing exposure, the system must preserve approval guard, consent, visibility and no-employment-decision boundaries.
