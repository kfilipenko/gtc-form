# CPG-SEAFARER-013 - Excel-Aligned Seafarer Form Cards Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This report records the first implementation slice that brings the user-facing `/create-profile/` seafarer form into strict practical alignment with the private Excel source cards reviewed in document 143.

The work expands the form cards and draft metadata model without changing candidate publication, matching decisions, Stripe, OpenClaw, nginx or deployment.

## Baseline

Baseline documents and source:

```text
docs/crewportglobal/143_cpg_seafarer_012_excel_card_field_alignment_audit_report.md
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
```

The Excel workbook remains outside Git and outside the public web root.

## Implemented Form Cards

The `/create-profile/` workspace now includes additional collapsed-by-default cards aligned to the source workbook:

```text
Addresses
Next of kin, beneficiary and children
Physical details
Identity documents and visas
Previous employer references
Medical history
```

The existing cards were also expanded:

```text
Contact
Qualifications
Sea service
Publication / consent
```

## Field Coverage Added

Added source-aligned fields include:

```text
surname / first name / middle name
citizenship
religion
permanent address details
registration address details
next-of-kin surname / first name / middle name / birthdate / gender / relation / phones / email / address
children records
height / weight / hair colour / eye colour / uniform size / shoe size
civil passport metadata
foreign passport metadata
seafarer ID metadata
seaman's book metadata
USA visa metadata
Schengen visa metadata
COC institute / issue date / comments
education period / specialisation / issue date / comments
endorsement type / institute / number / dates / comments
training institute / number / dates / comments
engine power
additional sea-service records
previous employer reference contacts
sick-off / injury / operation medical declarations
obligation date / place / confirmation
agreement date / agreement value
```

## Persistence Model

The new fields are saved through the existing seafarer workspace metadata:

```text
document_metadata.seafarer_workspace
```

New workspace sections preserved by the backend normalizer:

```text
name_components
address_details
family_details
physical_details
identity_documents
qualification_details
previous_employer_references
medical_history
consent_details
```

Section-level saves are supported through the existing seafarer workspace section API contract.

## Review Mapping

The new metadata sections are mapped into existing review cards for the current operator/cabinet workflow:

```text
name_components -> personal_contact
address_details -> personal_contact
family_details -> personal_contact
physical_details -> personal_contact
identity_documents -> qualifications
qualification_details -> qualifications
previous_employer_references -> sea_service
medical_history -> document_readiness
consent_details -> matching_publication
```

This keeps operator per-card review working without introducing a full new card taxonomy in the same slice.

## Reference Catalog Use

The expanded fields reuse already published reference catalogs where available:

```text
religion_values
national_document_types
endorsement_institutions
relation_types
gender_values
yes_no_values
confirmation_values
agreement_values
```

No unpublished catalog values are exposed.

## Verification Performed

Commands run:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
node --check extracted-create-profile-inline-script.js
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts
npm run test:cpg-api
git diff --check
```

Results:

```text
PHP syntax: passed
create-profile inline JavaScript syntax: passed
Excel-aligned card persistence/reload test: 1 passed
existing create-profile / workspace regression tests: 7 passed
API regression suite: 15 passed
git diff whitespace check: passed
```

The new focused test creates a draft, fills the Excel-aligned cards, verifies backend metadata, reloads `/create-profile/?draft_id=...` and confirms the added fields prefill back into the UI.

## Boundaries

Not changed in this slice:

```text
structured database schema for every repeated Excel row
operator detail rendering for every new source section
cabinet rendering for every new source section
candidate publication
matching decision logic
document upload storage
public vacancy logic
Stripe
OpenClaw
nginx/server config
deployment
```

## Remaining Risks

The form now captures the Excel source cards at the draft/workspace level, but several source groups are still stored as compact text or JSON metadata rather than fully normalized repeated records.

The sensitive medical fields are included as user declarations, but future implementation must keep them scoped, minimally visible and separated from public matching output.

## Final Recommendation

The Excel-aligned user-facing seafarer form expansion is ready for Project Owner review.

The next implementation slice should normalize the newly added repeated source records into structured tables/API responses and expose them consistently in operator and cabinet views without broadening visibility or publishing candidates automatically.
