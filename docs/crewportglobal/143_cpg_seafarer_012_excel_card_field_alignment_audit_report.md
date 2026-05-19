# CPG-SEAFARER-012 - Excel Card Field Alignment Audit Report

- Project: CrewPortGlobal.com
- Document type: Verification / implementation-planning report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This report records a strict alignment check between the private seafarer Excel source file and the currently implemented CrewPortGlobal seafarer workspace.

The goal is to confirm whether the current `/create-profile/` cards fully match the source workbook before the next form-expansion slice.

## Source Boundary

Private source file checked:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
```

The source workbook remains outside Git and outside the public web root. Personal example values from the workbook are not copied into this report.

## Source Workbook Inventory

The workbook contains five sheets:

```text
PERS
QUAL
EXPERIENCE
MEDICAL
DROPDOWN_LISTS
```

Source business cards identified from the workbook and BP-011:

```text
1. Profile basics / position request
2. Personal details
3. Permanent address
4. Registration address
5. Contact details
6. Next of kin / beneficiary
7. Children records
8. Physical details
9. Identity documents and visas
10. Education
11. Certificate of competence
12. National endorsements
13. Training courses
14. Sea service
15. Previous employer references
16. Medical history
17. Seafarer obligation / consent / information source
18. Internal pre-employment authorization
19. Uploaded evidence documents
20. Review and submission
```

## Current Implementation Inventory

Current user-facing `/create-profile/` sections:

```text
CV basics
Contact
Qualifications
Sea service
Publication
Documents
Review
Applications
```

Current structured backend tables:

```text
crewportglobal.seafarer_person_details
crewportglobal.seafarer_emergency_contacts
crewportglobal.seafarer_education_records
crewportglobal.seafarer_certificates
crewportglobal.seafarer_training_records
crewportglobal.seafarer_sea_service_records
crewportglobal.seafarer_medical_declarations
crewportglobal.seafarer_matching_preferences
crewportglobal.seafarer_publication_snapshots
```

## Strict Alignment Result

Strict result:

```text
The current form is not yet a full strict implementation of the Excel source.
```

The current implementation is a controlled MVP / bridge:

```text
source workbook -> selected user-facing fields -> document_metadata.seafarer_workspace -> structured workspace tables
```

It correctly covers the core maritime matching path, reference catalog publication, protected document upload and card-level review workflow, but it does not yet cover every source card and every field group from the Excel workbook.

## Card-by-card Alignment

| Source card | Current support | Status | Notes |
|---|---|---|---|
| Profile basics / position request | Rank, department, availability, availability date, salary expectation, preferred vessel types | Partial | Core matching fields are present. Source uses `Position apply for` and `Type of Vessel`; current UI maps these to rank and vessel preferences. |
| Personal details | Full name, date of birth, place of birth, nationality, gender, civil status | Partial | Source separates surname, first name and middle name. Current UI stores full legal name as one field. Religion is not implemented and must remain a sensitive-field decision. |
| Permanent address | Permanent address, residence city, residence country | Partial | Source has street, house, flat, comments, city, country, airport and postcode. Current UI stores a compact address and selected logistics fields. |
| Registration address | None | Missing | Source has a separate registration address block. |
| Contact details | Email, primary phone | Partial | Source includes primary mobile, secondary mobile, home phone and e-mail. |
| Next of kin / beneficiary | Emergency contact name, relation, phone | Partial | Source has separate surname, first name, middle name, birthdate, gender, address, mobile, home phone and e-mail. |
| Children records | None | Missing | Source includes repeated children records up to age 21. |
| Physical details | None | Missing | Source includes height, weight, hair color, eye color, uniform size and shoe size. |
| Identity documents and visas | Upload type, passport expiry, visa status | Partial | Source contains metadata for civil passport, foreign passport, seafarer ID, seaman's book, USA visa and Schengen visa. Current implementation mostly stores evidence files and limited readiness metadata. |
| Education | Education institution, education grade | Partial | Source includes institution, period, specialization, grade, issue date and comments. Current UI stores only primary education summary. |
| Certificate of competence | COC type, number, issuing country, expiry | Partial | Source includes type, institute, number, period and comments. Current UI lacks issuing institute, issue date and comments. |
| National endorsements | Upload type only / structured schema can store certificate group | Missing in UI | Source has a dedicated endorsement block. Current schema can represent endorsement-style certificates, but the form does not expose a dedicated endorsement card. |
| Training courses | Training course list | Partial | Source supports repeated training rows with type, institute, number, period and comments. Current UI stores course names only. |
| Sea service | Latest vessel name, vessel type, rank, flag, dates, management company, engine type, deadweight | Partial | Source supports a full repeated 10-year service table and engine power. Current UI stores one latest service record and omits engine power. |
| Previous employer references | None | Missing | Source has company, person in charge, telephone and e-mail. |
| Medical history | Medical expiry/status only through document readiness and medical table foundation | Missing in UI | Source has sick-off, injury/health problem and surgery questions. Sensitive UI/API rules must be decided before collection. |
| Seafarer obligation / consent / information source | Information source, data processing confirmation, publication request | Partial | Source includes obligation confirmation, date/place and agreement. Current UI has information source and data-processing confirmation. |
| Internal pre-employment authorization | None | Intentionally not user-facing | Source includes manager notes and crewing manager signature. These must be team-side workflow fields, not public user fields. |
| Uploaded evidence documents | Protected upload types and ClamAV scanning | Partial | Upload works, but document metadata is not yet attached to every corresponding source card/record. |
| Review and submission | Review status, card review states, operator card actions | Implemented | Per-card review workflow exists for implemented cards only. |

## Reference Catalog Alignment

The reference catalog layer is aligned with the source dropdown sheet.

Verified published database counts:

| Catalog | Published values |
|---|---:|
| agreement_values | 2 |
| airports | 155 |
| certificate_of_competence_types | 27 |
| child_relation_types | 2 |
| cities | 228 |
| civil_status_values | 4 |
| confirmation_values | 2 |
| countries | 248 |
| education_grades | 6 |
| education_institutions | 139 |
| endorsement_institutions | 40 |
| gender_values | 2 |
| harbourmasters | 27 |
| information_source_values | 14 |
| national_document_types | 17 |
| nationalities | 2 |
| relation_types | 16 |
| religion_values | 12 |
| schengen_countries | 26 |
| seafarer_positions | 48 |
| training_course_types | 130 |
| vessel_type_matching_categories | 9 |
| vessel_types | 22 |
| yes_no_values | 2 |

Total:

```text
24 catalogs
1180 published values
```

Result:

```text
Reference catalog publication matches the source DROPDOWN_LISTS inventory.
```

## Main Gaps Before Strict Excel Compliance

High priority implementation gaps:

```text
1. split personal name into surname / first name / middle name while preserving full legal name;
2. add permanent address and registration address structured cards;
3. expand next of kin / beneficiary and add children records;
4. add identity documents and visas metadata cards;
5. add dedicated endorsements card;
6. expand training courses into repeated structured rows;
7. expand sea service into repeated rows and add engine power;
8. add previous employer reference records;
9. decide sensitive medical UI scope before collecting detailed medical history;
10. attach uploaded documents to the exact card/record they support.
```

Medium priority gaps:

```text
1. replace two-letter manual country inputs with controlled catalog selections or ISO-normalized values;
2. decide whether religion is collected at all;
3. separate user-facing consent fields from team-side internal authorization fields;
4. create completeness checks for every source card, not only current MVP cards.
```

## Verification Performed

Performed checks:

```text
1. located private Excel source outside Git;
2. inspected workbook sheets PERS, QUAL, EXPERIENCE, MEDICAL and DROPDOWN_LISTS;
3. compared workbook cards against /create-profile/ UI sections;
4. compared UI fields against backend metadata normalizers;
5. compared structured workspace tables against source card groups;
6. verified published reference catalog counts in PostgreSQL;
7. confirmed no source workbook or personal example data was added to Git.
```

Commands used:

```text
find /var/www -maxdepth 8 -type f \( -iname '*.xlsx' -o -iname '*.xls' -o -iname '*.xlsm' -o -iname '*.ods' \)
php -r 'require "projects/crewportglobal/app/backend/api/lib/bootstrap.php"; ... reference catalog count query ...'
rg -n "seafarer_workspace|document_readiness|create-" projects/crewportglobal/public/create-profile/index.html projects/crewportglobal/app/backend/api/public/index.php
```

## Boundaries

Not changed in this audit:

```text
frontend form fields
backend API behavior
database schema
reference catalog publication state
document upload storage
operator review workflow
Stripe
OpenClaw
nginx/server config
deployment
```

## Conclusion

The project is ready for the next implementation slice, but the next slice must be treated as field-alignment work, not as a new product feature.

The correct next implementation direction is:

```text
CPG-SEAFARER-013 - Excel-aligned seafarer card expansion
```

Recommended first slice:

```text
1. create explicit UI cards for personal details, addresses, next of kin and identity documents;
2. persist these fields through section-level APIs;
3. keep cards collapsed by default;
4. preserve `My tasks` first/open behavior in cabinet;
5. add tests proving source-required fields save, reload and appear in operator review.
```
