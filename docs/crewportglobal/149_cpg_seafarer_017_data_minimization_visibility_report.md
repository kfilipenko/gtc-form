# CPG-SEAFARER-017 — Data Minimization, Scoped Visibility and Sensitive-Field Cleanup Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: #26 — CPG-SEAFARER-017
- Version: 1.1
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

## 5. Page And API Surface Matrix

This section records the actual CPG-SEAFARER-017 visibility behavior page by page and API surface by API surface.

| Surface | Data source | Visibility scope | Visible after CPG-SEAFARER-017 | Hidden or masked after CPG-SEAFARER-017 | Test coverage |
|---|---|---|---|---|---|
| `GET /api/v1/seafarer/workspace?draft_id=...` | `seafarer_profiles.document_metadata.seafarer_workspace`, structured workspace tables | `owner_full` by default | Full owner workspace, including source-card coverage and raw owner-editable values | Nothing is masked in owner scope; this remains the seafarer owner/correction source | `crewportglobal-seafarer-visibility-minimization.spec.ts` confirms owner scope keeps raw child and medical test values |
| `GET /api/v1/seafarer/workspace?draft_id=...&visibility=operator_general` | Structured workspace summary | `operator_general` | Source-card status, repeated-row counts, operational expiry/status summaries, masked document summaries | Children details, medical details, family contacts, reference contacts, identity numbers, raw document IDs | Covered indirectly through operator draft scope and `/verify/` rendering |
| `GET /api/v1/registration/drafts/{draft_id}?visibility=operator_general` | Draft payload, seafarer profile, structured workspace | `operator_general` | Registration metadata, seafarer profile summary, document readiness status, source-card review readiness, masked repeated rows | Raw `document_metadata`, religion, child details, medical details, identity/visa numbers, previous employer contact data | `crewportglobal-seafarer-visibility-minimization.spec.ts`; `crewportglobal-operator-queue.spec.ts` |
| `/verify/` | Operator draft detail API | `operator_general` | Operator queue details, source-card review controls, readiness checklist, safe structured summaries | Broad document notes, restricted family/medical/reference details, identity numbers and raw sensitive workspace JSON | `crewportglobal-seafarer-visibility-minimization.spec.ts`; `crewportglobal-operator-queue.spec.ts` |
| `/cabinet/` | Draft payload and cabinet task rendering | Owner-visible page with restricted task text cleanup | User can access own correction route and source-card sections; restricted correction tasks show source-card target and generic reason | Cabinet task text no longer repeats restricted next-of-kin notes, children details, medical details, identity numbers or reference contacts | `crewportglobal-seafarer-excel-review-cards.spec.ts`; `crewportglobal-cabinet-dashboard.spec.ts` |
| Employer draft payload with presented candidates | `read_presented_candidates_for_employer()` | `employer_candidate` | Candidate name/rank/department/availability, professional status fields, `document_summary` readiness metadata | `document_metadata`, seafarer email, seafarer phone, raw workspace, passport/ID/visa numbers, children, religion, medical details, reference contacts | `crewportglobal-seafarer-visibility-minimization.spec.ts` |
| `/post-vacancy/` presented candidate view | Employer draft payload | `employer_candidate` | Minimized `document_summary` and candidate pipeline status | Raw broad metadata and sensitive seafarer workspace fields | `crewportglobal-seafarer-visibility-minimization.spec.ts` API assertion plus frontend compatibility update |

## 6. Field-By-Field Visibility Matrix

This matrix records the practical CPG-SEAFARER-017 handling for the sensitive fields called out in the execution guide and issue #26.

| Field or field group | Source card / source area | Owner workspace | Operator API / `/verify/` | Cabinet task/detail behavior | Employer-facing payload | CPG-SEAFARER-017 handling |
|---|---|---|---|---|---|---|
| Full legal name | PERS-003 | Visible | Visible | Visible where profile summary requires it | Candidate name can remain visible after presentation | Kept as standard identity/profile field |
| Primary email | Account / PERS contact | Visible | Visible in registration metadata | Visible to account owner | Hidden from presented-candidate payload | Removed from employer candidate object |
| Primary phone / contact phone | PERS-006 | Visible | Visible where needed for operator review | Visible to owner | Hidden from presented-candidate payload | Removed from employer candidate object |
| Rank / department / availability | PERS-002 | Visible | Visible | Visible | Visible | Kept as professional matching summary data |
| Nationality / residence / airport | PERS-003 / PERS-006 | Visible | Visible where saved | Visible to owner | Only future reviewed summary, not raw workspace | Classified as standard professional/profile context |
| Religion | PERS-003 | Visible to owner if saved | Hidden from non-owner serialized payloads | Not repeated in correction task text | Hidden | Classified as `internal_compliance`; not matching data |
| Permanent address | PERS-004 | Visible | Removed from non-owner workspace summaries | Owner page can still support correction | Hidden | Address details restricted to owner/operator need-to-know |
| Registration address | PERS-005 | Visible | Operator review only where needed | Owner page can still support correction | Hidden | Not employer-facing |
| Next-of-kin / beneficiary names | PERS-007 | Visible | Hidden or summarized | Task shows source-card target and generic restricted reason | Hidden | Restricted family/compliance data |
| Next-of-kin phones/emails | PERS-007 | Visible | Hidden or summarized | Task does not repeat specific note/contact value | Hidden | Restricted family/compliance data |
| Children names | PERS-008 | Visible | Masked as restricted child record | Hidden from summaries/tasks | Hidden | Restricted family/compliance data |
| Children dates of birth / gender | PERS-008 | Visible | Masked as restricted child record | Hidden from summaries/tasks | Hidden | Restricted family/compliance data |
| Height / weight / uniform / shoes | PERS-009 | Visible | Visible where operationally useful | Visible to owner | Hidden unless future approved workflow requires it | Operational profile data, not employer payload in this slice |
| Hair / eye color | PERS-009 | Visible if saved | Restricted from broad summary | Hidden from task summaries | Hidden | Not matching data; future document-specific only |
| Passport / civil passport number | QUAL-001 | Visible | Removed from non-owner repeated-row summaries | Hidden from cabinet summaries | Hidden | Identity number excluded |
| Seafarer ID / seaman book / visa numbers | QUAL-001 | Visible | Removed from non-owner repeated-row summaries | Hidden from cabinet summaries | Hidden | Identity/visa number excluded |
| Identity document kind and expiry | QUAL-001 | Visible | Visible as minimized operational metadata | Visible in owner-safe summaries | Expiry/status only through `document_summary` where appropriate | Kept as readiness metadata |
| COC / certificate readiness | QUAL-003 | Visible | Visible | Visible to owner | Readiness/status summary only | Professional readiness data |
| COC number and training details | QUAL-003 / QUAL-005 | Visible | Visible to operator review where needed | Visible to owner | Not included in minimized employer payload in this slice | Requires later reviewed/consented candidate summary |
| Education records | QUAL-002 | Visible | Visible to operator review | Visible to owner | Not included in minimized employer payload in this slice | Professional data, future reviewed summary candidate |
| Sea service history | EXP-001 | Visible | Visible to operator review | Visible to owner | Not included as raw rows in employer payload in this slice | Professional data, future reviewed summary candidate |
| Previous employer company | EXP-002 | Visible | Company-level context can remain | Company-level context can remain | Hidden from employer payload | Internal reference workflow |
| Previous employer person / phone / email | EXP-002 | Visible | Masked outside owner scope | Hidden from cabinet summary/task text | Hidden | Reference-contact verification only |
| Medical certificate expiry/status | MEDICAL / document readiness | Visible | Visible as status/expiry only | Visible as owner readiness data | `medical_expiry` may appear in minimized `document_summary` | Readiness metadata only |
| Medical declarations / illness / injury / surgery details | MED-001 | Visible to owner | Masked as `restricted_medical_details_hidden` | Hidden from summaries/tasks | Hidden | `restricted_medical`; future dedicated capability required |
| Sick-off details | MED-001 | Visible to owner | Masked | Hidden | Hidden | `restricted_medical` |
| Data-processing confirmation | MED-003 | Visible | Visible as compliance/readiness state | Visible to owner | Hidden as raw field | Current compatibility field; not final consent event |
| Information source / comments | MED-004 | Visible to owner | Removed from non-owner matching/publication summaries | Hidden from task summaries | Hidden | Internal compliance/source note |
| Manager notes / pre-employment authorization | MED-005 | Not ordinary user-editable | System/team boundary only | Not shown | Hidden | `system_only`; future owner/team workflow |
| Raw uploaded document IDs / storage paths | Upload metadata | Protected owner/process metadata | Removed from non-owner source-card links | Not shown | Hidden | Only safe scan/review/status metadata can be summarized |

## 7. Employer-Facing Payload Matrix

The employer presented-candidate payload is intentionally narrower than operator or owner views.

| Payload field / group | Included for employer? | Reason |
|---|---:|---|
| `application_id`, `vacancy_id`, application/pipeline status | Yes | Employer needs pipeline state for a presented candidate. |
| Candidate full name | Yes | Required for candidate presentation after operator presentation. |
| Rank, department, availability, availability date | Yes | Professional matching summary fields. |
| Nationality/residence country codes currently held on profile | Yes, where existing profile fields already expose them | Professional summary context; no raw address data. |
| `document_summary.certificate_status` | Yes | Readiness summary only. |
| `document_summary.stcw_status` | Yes | Readiness summary only. |
| `document_summary.passport_expiry` | Yes | Expiry metadata only, no passport number. |
| `document_summary.medical_expiry` | Yes | Certificate expiry metadata only, no medical declarations. |
| `document_summary.visa_status` | Yes | Readiness summary only, no visa number. |
| Broad `document_metadata` | No | Removed to avoid accidental leakage. |
| Raw `seafarer_workspace` | No | Removed from employer payload. |
| Seafarer email / phone | No | Removed from presented-candidate payload in this slice. |
| Passport / seafarer ID / visa / seaman book numbers | No | Identity number exclusion rule. |
| Children / next-of-kin / beneficiary data | No | Restricted family/compliance data. |
| Religion | No | Internal/compliance data, not matching data. |
| Medical declarations and details | No | Restricted medical data. |
| Previous employer reference contacts | No | Reference-contact verification data. |
| Raw uploaded document IDs / storage paths | No | Protected storage boundary. |

## 8. Before And After Examples

All examples below use synthetic Playwright test values, not real seafarer data.

### 8.1 Operator Draft Payload

Before CPG-SEAFARER-017, the operator detail flow could render broad draft/workspace JSON and tests expected broad document notes such as:

```text
Visa appointment scheduled.
```

After CPG-SEAFARER-017, `/verify/` requests:

```text
/api/v1/registration/drafts/{draft_id}?visibility=operator_general
```

The same operator detail now includes:

```json
{
  "visibility_scope": "operator_general",
  "sensitive_fields_redacted": true
}
```

and no longer exposes broad notes in operator detail expectations.

### 8.2 Identity Documents

Owner scope can preserve saved source values such as:

```text
PASS-SECRET-999
SID-SECRET-555
VISA-SECRET-333
```

Operator and employer scopes must not include those values. The focused CPG-SEAFARER-017 test asserts that serialized operator and employer payloads do not contain these strings.

### 8.3 Family And Children Records

Owner scope can preserve a source child row such as:

```text
Child, Sensitive, Scope, Daughter, 2019-05-01, Female
```

Operator/cabinet summaries reduce this to restricted family record metadata. Employer payload must not include it at all.

### 8.4 Medical Details

Owner scope can preserve medical details such as:

```text
Orthopedic surgery details for minimization test.
Severe illness details for minimization test.
```

Operator scope masks this block as:

```text
restricted_medical_details_hidden
```

Employer payload must not include medical declaration answers or details.

### 8.5 Restricted Cabinet Correction Note

Before the CPG-SEAFARER-017 test update, the cabinet task regression expected the exact restricted correction note:

```text
Please confirm next-of-kin mobile number separately from home phone.
```

After CPG-SEAFARER-017, the cabinet task shows:

```text
Correction requested for a restricted source card. Open the relevant card and correct only the requested section.
```

The exact restricted operator note remains stored for review history, but it is not repeated in the visible cabinet task list.

## 9. Test-To-Field Traceability

| Test | Fields / surfaces checked | What the test proves |
|---|---|---|
| `tests/crewportglobal-seafarer-visibility-minimization.spec.ts` | Religion, children records, identity/visa/passport numbers, previous employer contacts, medical details, owner workspace, operator draft API, `/verify/`, employer presented-candidate payload | Owner scope preserves source data; operator/employer scopes remove or mask restricted values; employer payload uses `document_summary` instead of broad `document_metadata`. |
| `tests/crewportglobal-operator-queue.spec.ts` | `/verify/` operator detail sections, document readiness, operator JSON, restricted broad notes | Operator queue still works while broad document notes are no longer expected in operator detail; `sensitive_fields_redacted` is present. |
| `tests/crewportglobal-seafarer-excel-review-cards.spec.ts` | PERS-007 restricted correction card, cabinet task text, source-card review state | Canonical Excel source cards remain primary, but restricted correction notes are replaced with generic cabinet guidance. |
| `tests/crewportglobal-seafarer-source-repeated-rows.spec.ts` | Repeated children/document/education/certificate/training/sea-service/reference/medical rows, document links | CPG-SEAFARER-016 source coverage still works after minimization. |
| `tests/crewportglobal-cabinet-dashboard.spec.ts` | Cabinet task rendering and service-area behavior | Cabinet remains usable after restricted task text cleanup. |
| `npm run test:cpg-api` | Registration, draft, upload, review queue and vacancy API regression | Existing public/API workflows still pass after visibility-scope additions. |

## 10. Documentation Added

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

## 11. Consent Event Boundary

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

## 12. Verification

The implementation was verified on GTC1.

### 12.1 Syntax Checks

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

### 12.2 Focused CPG-SEAFARER-017 Test

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

### 12.3 API Regression

```bash
npm run test:cpg-api
```

Result: 15 passed.

### 12.4 Focused UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Result: 9 passed.

The focused UI regression confirms:

1. Repeated Excel source rows and source-card document links remain visible where appropriate.
2. Operator queue details use minimized operator-scoped payloads.
3. Cabinet correction tasks for restricted cards show generic restricted-card correction guidance.
4. Excel source review cards remain primary and legacy cards remain fallback-compatible.

## 13. Remaining Risks And Controlled Gaps

1. The final versioned consent-event table/API is not implemented in this slice.
2. A future restricted medical role/capability model is still required before restricted medical details can be reviewed through a dedicated workflow.
3. Employer-facing publication and matching remain blocked until a future approval guard is implemented.
4. The current owner scope still preserves full source data for the seafarer profile owner; future access-control work should make this boundary account/session enforced across all routes.

## 14. Next Recommended Step

The next slice can return to strict readiness summary and full-profile approval guard.

That work must use:

1. The canonical Excel source-card model.
2. The source-card field coverage matrix.
3. The new source-card visibility matrix.
4. Explicit consent and approval boundaries.
