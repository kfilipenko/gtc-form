# CPG-DEMAND-008 - Candidate Search Input Expansion Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-007
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the next practical step toward automated request-offer matching.

CPG-DEMAND-008 expands the existing read-only candidate search evaluator with additional matching dimensions already available in the database/API model. The slice improves operator decision support without introducing scoring, shortlist creation, vacancy application creation, employer-facing presentation or employment decision logic.

## 2. Scope Implemented

The operator-only endpoint remains:

```text
GET /api/v1/operator/vacancies/{vacancy_request_id}/candidate-search
```

The search model is now identified as:

```text
cpg-demand-008-read-only-input-expanded
```

Added evaluation dimensions:

| Dimension | Inputs used | Result |
|---|---|---|
| `department` | vacancy `department` and seafarer `department` | Blocks when a department-specific vacancy has a mismatched or missing candidate department. |
| `passport_validity` | vacancy `required_passport_validity_days`, vacancy `join_date`, candidate `document_summary.passport_expiry` | Blocks when candidate passport expiry is missing/invalid or below the required threshold. |
| `medical_validity` | vacancy `required_medical_validity_days`, vacancy `join_date`, candidate `document_summary.medical_expiry` | Blocks when candidate medical expiry is missing/invalid or below the required threshold. |

Preserved existing dimensions:

```text
rank
vessel_type
availability
document readiness warnings
existing application warning
```

## 3. New Blocker Codes

| Blocker code | Meaning |
|---|---|
| `candidate_department_missing` | Vacancy has a department but candidate department is missing. |
| `department_mismatch` | Candidate department does not match the vacancy department. |
| `passport_expiry_missing` | Passport expiry is missing or invalid while the vacancy requires a validity threshold. |
| `passport_validity_below_requirement` | Passport expiry exists but remaining validity from join date is below the vacancy threshold. |
| `medical_expiry_missing` | Medical expiry is missing or invalid while the vacancy requires a validity threshold. |
| `medical_validity_below_requirement` | Medical expiry exists but remaining validity from join date is below the vacancy threshold. |

## 4. No-Side-Effect Boundary

The endpoint remains read-only:

```text
creates_vacancy_applications=false
changes_statuses=false
employer_visible=false
writes_audit_events=false
```

This slice does not:

1. Create a shortlist.
2. Create or update vacancy applications.
3. Present candidates to employers.
4. Publish seafarer profiles.
5. Implement employment decisions.
6. Add a numeric score.
7. Add a database migration.
8. Change public or employer-facing UI behavior.

## 5. Data Minimization

The added document validity checks use the already minimized `document_summary` fields:

```text
passport_expiry
medical_expiry
```

The endpoint still does not return:

```text
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

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Expanded read-only candidate search with department and document-validity dimensions. |
| `tests/crewportglobal-registration-api.spec.ts` | Updated candidate-search API test for the expanded model, matched dimensions and validity blockers. |
| `docs/crewportglobal/171_cpg_demand_008_candidate_search_input_expansion_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 171 to the register. |

## 7. Verification

The implementation was verified on GTC1.

### 7.1 Syntax Check

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

This check confirms:

1. The endpoint returns `cpg-demand-008-read-only-input-expanded`.
2. Exact candidate rows include `department`, `passport_validity` and `medical_validity` in `matched_dimensions`.
3. Document-validity failures produce `passport_validity_below_requirement` and `medical_validity_below_requirement`.
4. The endpoint still excludes candidate e-mail/contact fields and raw `document_metadata`.
5. No vacancy applications are created by the search.

### 7.3 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

This confirms the existing `/verify/` candidate-search panel remains compatible with expanded matched dimensions.

### 7.4 API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result: 16 passed.

## 8. Next Recommended Step

The next step should decide between:

1. A controlled internal operator shortlist draft object.
2. Expanding structured demand capture for COC/training/visa/language requirements.

Employer-facing presentation must remain blocked until approval guard, consent, visibility and operator decision boundaries are explicitly satisfied.
