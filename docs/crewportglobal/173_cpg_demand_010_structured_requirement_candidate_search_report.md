# CPG-DEMAND-010 - Structured Requirement Candidate Search Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-009
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first use of structured demand requirements inside the read-only operator candidate-search evaluator.

The purpose is to make future shortlist work depend on machine-readable shipowner/employer demand requirements instead of broad free-text or weak vacancy metadata. The evaluator now checks selected structured requirements saved in `crewportglobal.demand_requirement_items` against structured seafarer evidence before any shortlist object, employer presentation or employment decision exists.

This slice does not create shortlists, publish candidates, present candidates to employers, change vacancy application status or implement automatic matching decisions.

## 2. Scope Implemented

The operator-only candidate-search endpoint now uses structured demand requirements for these read-only checks:

```text
coc
endorsement
training
sea_service
```

The candidate-search response now uses:

```text
search_model = cpg-demand-010-structured-requirement-evaluator
```

Existing dimensions remain active:

```text
rank
vessel_type
department
availability
passport_validity
medical_validity
```

New structured dimensions are:

```text
coc_requirements
endorsement_requirements
training_requirements
sea_service_requirements
```

## 3. Requirement Evaluation Matrix

| Requirement group | Candidate evidence source | Matching behavior | Blocker code when failed |
|---|---|---|---|
| `coc` | `seafarer_certificates` | Requires every must-have COC row to match candidate certificate catalog value or label. | `coc_requirement_missing` |
| `endorsement` | `seafarer_certificates` | Requires every must-have endorsement row to match candidate certificate catalog value or label. | `endorsement_requirement_missing` |
| `training` | `seafarer_training_records` | Requires every must-have training row to match candidate training catalog value or label. | `training_requirement_missing` |
| `sea_service` | `seafarer_sea_service_records` | Requires at least one matching sea-service record with enough months and optional rank/vessel-type context. | `sea_service_months_below_requirement` |
| `visa` | `demand_requirement_items` only | Captured, but not used as an automatic candidate blocker in this slice. | Demand warning `structured_requirement_manual_review_required` |
| `language` | `demand_requirement_items` only | Captured, but not used as an automatic candidate blocker in this slice. | Demand warning `structured_requirement_manual_review_required` |
| `general` | `demand_requirement_items` only | Captured, but not parsed into hard automation in this slice. | Demand warning `structured_requirement_manual_review_required` |

## 4. Read-Only Boundary

The endpoint remains a search/evaluation surface only.

No-side-effect controls remain:

```text
side_effects.created_shortlist = false
side_effects.created_application = false
side_effects.presented_to_employer = false
side_effects.changed_candidate_status = false
side_effects.changed_vacancy_status = false
```

The evaluator does not write audit events, candidate records, vacancy-application transitions or employer-facing presentation rows.

## 5. Data Minimization

Structured evidence is read only as matching-safe metadata.

Candidate-search payloads do not expose:

```text
seafarer email
seafarer phone
contact_email
contact_phone
document_metadata
raw workspace JSON
certificate numbers
document numbers
uploaded document IDs
storage paths
restricted family data
restricted medical declaration details
```

The structured COC, endorsement and training checks use reference values, labels, expiry/status metadata and review state only. Sea-service checks use rank, vessel type and service dates/months only.

## 6. API Behavior

The affected endpoint is:

```text
GET /api/v1/operator/vacancy-candidate-search?vacancy_request_id=...
```

The response now includes:

```text
demand_readiness.requirement_items
demand_readiness.warnings
matched_dimensions[]
blockers[]
dimension_results.coc_requirements
dimension_results.endorsement_requirements
dimension_results.training_requirements
dimension_results.sea_service_requirements
```

Structured blocker details include required and matched counts where applicable, so later UI and shortlist-draft work can show why a candidate failed without exposing restricted candidate data.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added structured requirement evaluation helpers and wired COC, endorsement, training and sea-service checks into read-only candidate search. |
| `tests/crewportglobal-registration-api.spec.ts` | Added synthetic structured seafarer evidence and assertions for COC/training/sea-service matching dimensions and blocker-safe payloads. |
| `docs/crewportglobal/173_cpg_demand_010_structured_requirement_candidate_search_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 173 to the register. |

## 8. Verification

The implementation was verified on GTC1.

### 8.1 Syntax Check

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

The focused test confirms:

1. Structured COC, training and sea-service requirements are accepted on the demand side.
2. Synthetic candidate evidence satisfies the structured requirements.
3. The candidate search returns `cpg-demand-010-structured-requirement-evaluator`.
4. The matched candidate includes `coc_requirements`, `training_requirements` and `sea_service_requirements`.
5. Employer/contact/workspace-sensitive fields remain absent from the candidate-search payload.

### 8.3 API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result: 16 passed.

### 8.4 Focused UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

This confirms the operator vacancy detail and candidate-search panel remain compatible with the stronger structured evaluator.

## 9. Remaining Controlled Gaps

1. Visa, language and general requirements are intentionally warning/manual-review inputs until dedicated catalog and Project Owner rules are approved.
2. COC, endorsement and training checks currently use existing structured evidence rows and do not inspect uploaded document binaries.
3. The evaluator remains read-only; no shortlist draft object is created in this slice.
4. The operator UI still shows the safe summary returned by the endpoint; a later slice can improve structured blocker presentation without changing matching rules.

## 10. Next Recommended Step

The next implementation slice should create an internal shortlist draft boundary only after the structured evaluator is accepted.

Recommended order:

1. Add UI-visible structured blocker summaries for COC, training, endorsement and sea service.
2. Add an internal shortlist draft object that is not employer-facing by default.
3. Require approval guard checks before any shortlist item can move toward employer presentation.
4. Keep visa/language/general requirements in manual-review mode until catalog cleanup and policy rules are approved.
