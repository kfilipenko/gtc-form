# CPG-SEAFARER-015 - Excel Source Review Card Normalization Report

- Project: CrewPortGlobal.com
- Document type: Implementation / verification report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This report records the implementation slice that normalizes seafarer operator/cabinet review cards to the canonical Excel source sections.

The team requested this as the next CPG-SEAFARER-014 task. Document 145 already records CPG-SEAFARER-014 as the Excel source-of-truth pre-check, so this implementation is recorded as document 146 / CPG-SEAFARER-015 to avoid a documentation-number collision.

Controlling rule:

```text
Standard Excel form is the source of truth.
No invented cards.
No reduced sections.
Old aggregated cards are fallback compatibility only.
```

## Sources

Controlled sources:

```text
docs/crewportglobal/143_cpg_seafarer_012_excel_card_field_alignment_audit_report.md
docs/crewportglobal/144_cpg_seafarer_013_excel_aligned_form_cards_report.md
docs/crewportglobal/145_cpg_seafarer_014_excel_source_truth_precheck_report.md
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
```

The private Excel file remains outside Git and outside public web root.

## Canonical Review Cards

The source review-card model now uses the exact canonical source sections from document 145:

```text
PERS-001 Employee ID number
PERS-002 Position request
PERS-003 Personal details
PERS-004 Permanent address
PERS-005 Registration address
PERS-006 Contact details
PERS-007 Next of kin / beneficiary
PERS-008 Children records
PERS-009 Physical details

QUAL-001 National identity documents / visa
QUAL-002 Education
QUAL-003 Certificate of competence
QUAL-004 National documents / endorsements
QUAL-005 Training courses

EXP-001 Sea service
EXP-002 Previous employer details for reference

MED-001 Medical history
MED-002 Seafarer's obligation
MED-003 Personal data processing agreement
MED-004 Information source and comments
MED-005 Authorization for pre-employment process
```

`MED-005` is preserved as a source-defined internal/team card and is not treated as a public seafarer-editable field.

## Backend Changes

The backend now has two explicit card sets:

```text
canonical Excel source cards
legacy aggregated fallback cards
```

Implemented behavior:

```text
GET draft payload returns the canonical source cards as primary readiness cards.
Legacy aggregated cards are still returned with legacy_fallback=true for old API/UI compatibility.
Operator per-card review accepts canonical source card codes.
Old card codes remain accepted as fallback only.
Card review state is persisted under the exact source card code.
Section resubmission resets the relevant source card states plus the old fallback state.
```

Example mapping:

```text
family_details -> PERS-007, PERS-008, personal_contact fallback
identity_documents -> QUAL-001, qualifications fallback
qualification_details -> QUAL-002, QUAL-003, QUAL-004, QUAL-005, qualifications fallback
previous_employer_references -> EXP-002, sea_service fallback
medical_history -> MED-001, document_readiness fallback
consent_details -> MED-002, MED-003, MED-004, matching_publication fallback
```

Structured-record review-state updates were also aligned where current tables exist:

```text
PERS personal/address/contact cards -> seafarer_person_details
PERS next-of-kin/children cards -> seafarer_emergency_contacts
QUAL education card -> seafarer_education_records
QUAL COC/endorsement cards -> seafarer_certificates
QUAL training card -> seafarer_training_records
EXP sea-service card -> seafarer_sea_service_records
MED medical card -> seafarer_medical_declarations
MED consent/source cards -> seafarer_matching_preferences
```

## Operator View

`/verify/` now treats source cards as the visible review-card model.

Implemented behavior:

```text
If canonical source cards are present, legacy_fallback cards are filtered out of the visible checklist and target selector.
The operator target selector shows source cards such as QUAL-003 instead of qualifications.
Per-card Start review / Needs correction / Verified actions work on source card codes.
Card status filters continue to work for pending_human_review, under_review, correction_requested and verified.
```

## Cabinet View

`/cabinet/` now maps source card correction tasks to the relevant `/create-profile/` source-aligned card:

```text
PERS-007 / PERS-008 -> #profile-section-family
QUAL-001 -> #profile-section-identity-documents
QUAL-002 / QUAL-003 / QUAL-004 / QUAL-005 -> #profile-section-qualifications
EXP-001 -> #profile-section-sea-service
EXP-002 -> #profile-section-references
MED-001 -> #profile-section-medical
MED-002 / MED-003 / MED-004 -> #profile-section-publication
```

Legacy fallback links remain in place for already-existing correction states.

## Verification

Commands run on GTC1:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
node --check extracted verify inline JavaScript
node --check extracted cabinet inline JavaScript
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts
git diff --check
git diff --check --no-index /dev/null docs/crewportglobal/146_cpg_seafarer_015_excel_source_review_cards_report.md
git diff --check --no-index /dev/null tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Results:

```text
PHP syntax: passed
verify inline JavaScript syntax: passed
cabinet inline JavaScript syntax: passed
Excel source review-card focused test: 1 passed
operator queue tests: 2 passed
API regression suite: 15 passed
cabinet dashboard tests: 5 passed
Excel-aligned form/workspace/prefill regression tests: 8 passed
tracked diff whitespace check: passed
new report/test whitespace checks: passed
```

Focused verification covered:

```text
all 21 canonical source card codes present in draft readiness payload
legacy qualifications card present only as legacy_fallback=true
operator per-card review for PERS-007
persisted PERS-007 correction_requested state
cabinet task rendered from PERS-007 source card state
cabinet task links to #profile-section-family
family_details resubmission resets PERS-007 and PERS-008 to pending_human_review
legacy personal_contact fallback reset remains compatible
cabinet task disappears after source-card resubmission
operator target selector uses QUAL-003 source card
operator card-status filters work on source cards
```

## Boundaries

Not changed in this slice:

```text
private Excel file
database schema
public candidate publication
matching approval logic
document upload storage
vacancy/public board behavior
deployment / nginx / systemd
Stripe / OpenClaw
```

## Remaining Risks

Some Excel source fields are still stored as compact text or metadata rather than repeated normalized records:

```text
children records
training repeated rows
sea-service repeated rows
previous employer repeated rows
medical illness/surgery detail rows
MED-005 internal authorization fields
```

Some source fields are still missing or only partially bound in the current `/create-profile/` UI. This implementation normalizes review cards and review state, but it does not complete all repeated-record storage or strict readiness approval rules.

## Final Recommendation

The old aggregated cards should no longer be treated as the final review taxonomy. They are now compatibility fallback only.

The next implementation step should normalize repeated Excel source rows and remaining missing source fields before strict readiness summary or approval guard logic is enforced.
