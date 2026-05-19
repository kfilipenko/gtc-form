# CPG-SEAFARER-016 — Repeated Excel Source Rows and Missing Source Fields Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: #25 — CPG-SEAFARER-016
- Version: 1.0
- Date: 2026-05-19
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the CPG-SEAFARER-016 implementation slice.

The purpose of this slice is to close the technical debt left after CPG-SEAFARER-015 by normalizing repeated source rows from the standard seafarer Excel form, correcting missing source fields in the seafarer form, and preparing the data foundation for a strict future readiness summary and full-profile approval guard.

## 2. Source-of-truth rule

The standard private Excel form remains the source of truth.

Implementation sources used for this slice:

1. Private `seafarer_fields_dictionary_2026_05_18.xls`.
2. BP-011 — seafarer Excel field dictionary and reference catalog alignment.
3. Document 143 — strict Excel-to-form alignment audit.
4. Document 144 — Excel-aligned form card expansion.
5. Document 146 — Excel source review-card normalization.

No invented source cards were added.

No Excel source fields, sections or catalogs were intentionally removed or suppressed.

This slice does not publish seafarer profiles, does not implement matching, and does not make employment decisions.

## 3. Implemented changes

### 3.1 Backend normalization

The CrewPortGlobal API now derives normalized repeated source records from `document_metadata.seafarer_workspace` and exposes them through the structured seafarer workspace API.

Normalized repeated source blocks:

| Source area | Normalized output |
|---|---|
| PERS family block | `children_records` |
| QUAL identity block | `identity_document_records` |
| QUAL education block | `education_records` |
| QUAL COC block | `coc_certificate_records` |
| QUAL endorsement block | `endorsement_records` |
| QUAL training block | `training_course_records` |
| EXPERIENCE sea service block | `sea_service_records` |
| EXPERIENCE previous employers block | `previous_employer_reference_records` |
| MED declarations block | `medical_declaration_records` |
| Upload metadata | `source_card_document_links` |

The API response now includes:

```text
workspace.source_repeated_records
workspace.source_card_document_links
```

The structured workspace bridge now syncs the normalized repeated rows into existing structured tables where an approved table already exists:

| Structured target | Source-backed rows |
|---|---|
| `seafarer_education_records` | QUAL education rows |
| `seafarer_certificates` | QUAL COC and endorsement rows |
| `seafarer_training_records` | QUAL training course rows |
| `seafarer_sea_service_records` | EXPERIENCE latest and historical sea service rows |
| `seafarer_medical_declarations` | MED declaration rows |

### 3.2 Missing source fields added to the form

The `/create-profile/` seafarer form now captures and reloads additional source fields that were identified as implementation drift:

| Source area | Added fields |
|---|---|
| PERS contact | `residence_country`, `secondary_mobile_number`, `home_phone` |
| PERS addresses | `permanent_region`, `registration_region` |
| PERS next of kin | `kin_mobile` |
| QUAL identity | `seafarer_id_series`, `seafarer_id_authority` |
| QUAL seaman's book | `seamans_book_series`, `seamans_book_expiry`, `seamans_book_authority` |

These fields are persisted in `document_metadata.seafarer_workspace`, returned by the API, and prefilled after reload.

### 3.3 Operator visibility

The `/verify/` operator view now shows source-derived repeated-row and document-link summaries in the seafarer workspace detail.

The operator can see:

1. Normalized repeated row counts by source block.
2. Uploaded document links grouped by canonical source card.
3. Existing source-card review status and correction state from CPG-SEAFARER-015.

The old aggregated cards remain only as a compatibility fallback, not the final review-card model.

### 3.4 Cabinet visibility and tasks

The `/cabinet/` seafarer workspace view now renders source-backed repeated records where user visibility is required:

1. Children records.
2. Identity documents and visas.
3. Endorsements.
4. Previous employer references.
5. Medical declaration summaries.
6. Source-card document links.

Card correction tasks continue to use the canonical source card codes introduced by CPG-SEAFARER-015.

### 3.5 Coverage matrix

A source-card coverage matrix was created:

```text
docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md
```

The matrix records coverage for PERS-001 through MED-005 across:

1. UI presence.
2. Save behavior.
3. API return behavior.
4. Operator visibility.
5. Cabinet visibility when required.
6. Uploaded document link behavior.
7. Remaining controlled gaps.

## 4. Verification

The implementation was verified on GTC1.

### 4.1 Syntax and static checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

Embedded frontend scripts were extracted and checked with Node syntax validation for:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/cabinet/index.html
```

Result: passed.

### 4.2 API tests

```bash
npm run test:cpg-api
```

Result: 15 passed.

### 4.3 Focused CPG-SEAFARER-016 UI/API test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts
```

Result: 1 passed.

The focused test confirms:

1. Repeated source rows are saved.
2. Repeated source rows are returned by API.
3. Structured DB-backed summaries include normalized training, sea service, certificates and medical declarations.
4. Source-card document links are returned for QUAL, EXPERIENCE and MED source cards.
5. `/create-profile/` reload/prefill works for newly added missing fields.
6. `/verify/` shows repeated-row and document-link summaries.
7. `/cabinet/` shows source-card task and source-backed repeated sections.

### 4.4 Focused regression Playwright tests

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Result: 11 passed.

### 4.5 Whitespace check

```bash
git diff --check
```

Result: passed.

## 5. Remaining risks and controlled gaps

1. `PERS-001` and `MED-005` are source cards but are not normal user-editable data cards. They remain controlled declaration/readiness boundaries for future full-profile approval guard work.
2. Repeated rows are normalized from current form inputs and newline/comma-based practical entry fields. A future UX slice should add dynamic row editors for repeated children, identity documents, certificates, training, sea service and previous employers.
3. Uploaded document taxonomy is source-card aware, but additional document types may be required for full coverage of QUAL-002 and EXP-002. New upload categories require Project Owner approval before publication.
4. This slice prepares the readiness data foundation but does not implement the final readiness summary or profile approval guard.

## 6. Next recommended step

The next implementation slice can proceed to strict source-card readiness summary and full-profile approval guard.

The approval guard should use the canonical source-card model and the coverage matrix created in this slice, not the old aggregated review cards.
