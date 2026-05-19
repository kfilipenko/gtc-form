# CPG-SEAFARER-017 — Data Minimization, Scoped Visibility and Sensitive-Field Cleanup Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: #26 — CPG-SEAFARER-017
- Version: 1.0
- Date: 2026-05-19
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the CPG-SEAFARER-017 implementation slice.

The purpose of this slice is to preserve the approved Excel source-card coverage from CPG-SEAFARER-015 and CPG-SEAFARER-016 while reducing unnecessary exposure of sensitive seafarer data across API, operator, cabinet and employer-facing surfaces.

This slice does not add source cards, remove Excel fields, publish seafarer profiles, implement matching or make employment decisions.

## 2. Source Documents Used

Implementation sources:

1. Private `seafarer_fields_dictionary_2026_05_18.xls`.
2. BP-011 — seafarer Excel field dictionary and reference catalog alignment.
3. Document 144 — Excel-aligned form card expansion.
4. Document 145 — Excel source-of-truth pre-check and canonical card list.
5. Document 146 — Excel source review-card normalization.
6. Document 147 — repeated Excel source-row normalization.
7. `docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md`.
8. Document 148 — agent execution guide for CPG-SEAFARER-017.

## 3. Implemented Backend Controls

The backend now supports explicit seafarer visibility scopes:

```text
owner_full
operator_general
cabinet_summary
employer_candidate
```

The API now exposes source-card visibility metadata and a field visibility matrix with these approved classes:

```text
public_candidate_summary
employer_after_candidate_consent
operator_review
restricted_medical
internal_compliance
system_only
```

Non-owner scopes mask or remove restricted fields from `document_metadata.seafarer_workspace`, `source_repeated_records`, `source_card_document_links` and structured workspace summaries.

Restricted examples:

1. Religion is classified as internal/compliance data, not matching data.
2. Children records are reduced to restricted family record summaries outside owner scope.
3. Medical declarations are reduced to restricted medical summaries outside owner scope.
4. Identity document and visa repeated rows keep kind and expiry metadata but remove numbers, series and authorities from non-owner summaries.
5. Previous employer references keep company-level context but remove contact names, phones and emails outside owner scope.
6. Raw uploaded document identifiers are removed from non-owner source-card document links.

The employer presented-candidate payload no longer returns raw `document_metadata`, seafarer email, seafarer phone or raw sensitive workspace data. It returns a minimal `document_summary` readiness object.

## 4. Implemented UI Controls

### 4.1 Operator View

`/verify/` now requests draft details with `visibility=operator_general`.

The operator raw detail JSON and structured seafarer workspace data are scoped before rendering. General operator review sees source-card status, operational summaries and masked repeated-record summaries, not restricted family/medical/reference/contact details.

### 4.2 Cabinet View

`/cabinet/` now avoids exposing restricted details inside task text and repeated-record summaries.

Sensitive correction cards show generic correction guidance. Cabinet source-backed summaries no longer display:

1. Child names, dates of birth or gender.
2. Next-of-kin names or phone numbers in summary rows.
3. Identity document numbers, series or issuing authorities.
4. Previous employer reference contact names, phones or emails.
5. Medical declaration questions, answers or details.

### 4.3 Employer View

`/post-vacancy/` now reads the minimized `document_summary` for presented candidates and keeps compatibility fallback only for older payloads.

Employer-facing candidate presentation does not include raw seafarer workspace objects or broad document metadata.

## 5. Documentation Added

A dedicated visibility matrix was added:

```text
docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md
```

The matrix records:

1. Visibility classes.
2. Source-card-to-visibility mapping for `PERS-001` through `MED-005`.
3. Employer-facing exclusion rules.
4. Operator and cabinet scoped visibility rules.
5. Versioned consent event model requirements.

## 6. Consent Event Boundary

The current broad confirmation fields remain saved for compatibility, but they are not treated as a final all-purpose consent model.

CPG-SEAFARER-017 documents and exposes an implementation-ready consent event model requiring:

```text
profile_review
matching_preparation
employer_sharing
document_verification
sensitive_medical_processing
reference_contact_verification
```

The consent event model still requires a future approved database/API slice before it can become the final persisted consent authority.

## 7. Verification

The implementation was verified on GTC1.

### 7.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

Embedded frontend scripts were extracted and checked with Node syntax validation for:

```text
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/verify/index.html
```

Result: passed.

### 7.2 Focused CPG-SEAFARER-017 Test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-visibility-minimization.spec.ts
```

Result: 1 passed.

The focused test confirms:

1. Owner scope still preserves raw saved source data.
2. Operator scoped API responses do not include restricted child, medical, identity, religion or reference-contact values.
3. `/verify/` renders operator-scoped draft JSON.
4. Employer presented-candidate payload excludes broad `document_metadata`, seafarer email, seafarer phone and restricted source values.
5. Employer payload includes only minimized `document_summary` readiness metadata.

### 7.3 API Regression

```bash
npm run test:cpg-api
```

Result: 15 passed.

### 7.4 Focused UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Result: 9 passed.

The focused UI regression confirms:

1. Repeated Excel source rows and source-card document links remain visible where appropriate.
2. Operator queue details use minimized operator-scoped payloads.
3. Cabinet correction tasks for restricted cards show generic restricted-card correction guidance.
4. Excel source review cards remain primary and legacy cards remain fallback-compatible.

## 8. Remaining Risks And Controlled Gaps

1. The final versioned consent-event table/API is not implemented in this slice.
2. A future restricted medical role/capability model is still required before restricted medical details can be reviewed through a dedicated workflow.
3. Employer-facing publication and matching remain blocked until a future approval guard is implemented.
4. The current owner scope still preserves full source data for the seafarer profile owner; future access-control work should make this boundary account/session enforced across all routes.

## 9. Next Recommended Step

The next slice can return to strict readiness summary and full-profile approval guard.

That work must use:

1. The canonical Excel source-card model.
2. The source-card field coverage matrix.
3. The new source-card visibility matrix.
4. Explicit consent and approval boundaries.
