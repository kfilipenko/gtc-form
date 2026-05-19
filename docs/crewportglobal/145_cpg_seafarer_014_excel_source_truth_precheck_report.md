# CPG-SEAFARER-014 - Excel Source-of-Truth Precheck and Canonical Card List

- Project: CrewPortGlobal.com
- Document type: Verification / correction report
- Date: 2026-05-19
- Status: Requires Project Owner approval before further readiness implementation

## Purpose

This report records a strict pre-check of the standard seafarer Excel source before continuing readiness summary, approval guard, cabinet readiness or operator readiness work.

The controlling rule is:

```text
Standard Excel form is the source of truth.
The platform form follows the standard source.
No invented cards.
No reduced sections.
No suppressed catalogs.
No exclusions without Project Owner approval.
```

## Source File Confirmation

Confirmed source file:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
```

Result:

```text
file exists
legacy .xls readable
not stored in Git
not under public web root
```

The workbook contains these sheets:

```text
PERS
QUAL
EXPERIENCE
MEDICAL
DROPDOWN_LISTS
```

## Sheet Size Check

When read with `xlrd.open_workbook(..., formatting_info=True)`, the sheet dimensions match the team statement:

| Sheet | Formatted rows | Formatted columns | Max non-empty row | Max non-empty column |
|---|---:|---:|---:|---:|
| PERS | 85 | 20 | 84 | 18 |
| QUAL | 131 | 20 | 65 | 19 |
| EXPERIENCE | 35 | 24 | 34 | 23 |
| MEDICAL | 57 | 15 | 56 | 15 |
| DROPDOWN_LISTS | 1018 | 24 | 249 | 24 |

Important reading note:

```text
The formatted worksheet size is the correct source-control size.
The smaller non-empty range is only a parser artifact and must not be used to reduce the form.
```

## Canonical Source Model By Sheet

The following canonical sections are extracted from the Excel source. These are the sections that should control the seafarer form, readiness checks and operator review.

### PERS

Canonical sections:

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
```

Canonical field groups:

| Section | Source fields |
|---|---|
| Employee ID number | Employee ID Number |
| Position request | Position apply for; Type of Vessel |
| Personal details | Surname; First Name; Middle Name; Place of birth; Date of birth; Citizenship; Gender; Civil status; Religion; source-native/Russian mirror fields where present |
| Permanent address | Street; House; Flat; Comments; City; Country; Region; Airport; Post code |
| Registration address | Street; House; Flat; Comments; City; Country; Region |
| Contact details | Primary Mobile Number; Secondary Mobile Number; Home Phone; E-mail |
| Next of kin / beneficiary | Surname; First name; Middle name; Birthdate; Gender; Street; House; Flat; City; Country; Relation; Mobile; Home Phone; E-mail |
| Children records | Repeated child rows: Surname; First name; Middle name; Relation; Birthdate; Gender |
| Physical details | Height; Weight; Hair colour; Eyes colour; Uniform size; Shoes size |

### QUAL

Canonical sections:

```text
QUAL-001 National identity documents / visa
QUAL-002 Education
QUAL-003 Certificate of competence
QUAL-004 National documents / endorsements
QUAL-005 Training courses
```

Canonical field groups:

| Section | Source fields |
|---|---|
| National identity documents / visa | Civil Passport Series; No; Issued; Authority; Foreign Passport Series; No; Issued; Expiry; Authority; Seafarer's ID Series; No; Issued; Expiry; Authority; Seaman's Book Series; No; Issued; Authority; USA VISA type; Issued; Expiry; Issuing Post Name; Schengen VISA No. of Visa; Issued; Expiry; Issuing Post Name |
| Education | Name of maritime educational institution; Period From; Period To; Specialisation; Grade; Issued On; Comments |
| Certificate of competence | Type; Institute; Number; Issued; Expiry; Comments |
| National documents / endorsements | Type; Authority; Number; Issued; Expiry; Comments |
| Training courses | Repeated course rows: Type; Institute; Number; Issued; Expiry; Comments |

### EXPERIENCE

Canonical sections:

```text
EXP-001 Sea service
EXP-002 Previous employer details for reference
```

Canonical field groups:

| Section | Source fields |
|---|---|
| Sea service | Repeated sea-service rows: Name of vessel; Vessel Type; Deadweight; Engine Type; Engine Power (kW); Flag; Management Company or Crew Agent; Rank; From; To |
| Previous employer details for reference | Repeated reference rows: Company Name; Person in charge; Telephone; E-mail |

### MEDICAL

Canonical sections:

```text
MED-001 Medical history
MED-002 Seafarer's obligation
MED-003 Personal data processing agreement
MED-004 Information source and comments
MED-005 Authorization for pre-employment process
```

Canonical field groups:

| Section | Source fields |
|---|---|
| Medical history | Signed off sick; if yes: Name of vessel; Date; Brief description of illness, injury, accident; injury/health problem during last 10 years; operated; if yes: Date; Brief description of surgery |
| Seafarer's obligation | Obligation text; Date; Place; Confirmation |
| Personal data processing agreement | Agreement text; Date; Agreement |
| Information source and comments | How you heard about company; Comments |
| Authorization for pre-employment process | Manager's notes; Rank; Type of ship; Date; Name of Crewing manager; Signature of Crewing manager |

Important boundary:

```text
MED-005 is a source-defined section, but it is team-side/internal.
It should not be suppressed. It should be implemented as an internal review/authorization section, not as a public user-editable seafarer field.
```

## Canonical DROPDOWN_LISTS Catalogs

The source contains 24 reference catalogs. None should be excluded without Project Owner approval.

| Source header | Source count | Published catalog code | Published count |
|---|---:|---|---:|
| POSITION | 48 | seafarer_positions | 48 |
| NATIONALITY | 2 | nationalities | 2 |
| SEX | 2 | gender_values | 2 |
| CIVIL STATUS | 4 | civil_status_values | 4 |
| RELIGION | 12 | religion_values | 12 |
| COUNTRY | 248 | countries | 248 |
| AIRPORT | 155 | airports | 155 |
| CITY | 228 | cities | 228 |
| RELATION | 16 | relation_types | 16 |
| RELATION_CHILDREN | 2 | child_relation_types | 2 |
| EDUCATION_INSTITUTE | 139 | education_institutions | 139 |
| GRADE | 6 | education_grades | 6 |
| COC | 27 | certificate_of_competence_types | 27 |
| ENDORSMENT INSTITUTE | 40 | endorsement_institutions | 40 |
| VESSELTYPE | 22 | vessel_types | 22 |
| NATIONAL_DOC | 17 | national_document_types | 17 |
| TRAINING_COURSES | 130 | training_course_types | 130 |
| HARBOURMASTER | 27 | harbourmasters | 27 |
| SHENGENCOUNTRY | 26 | schengen_countries | 26 |
| VESSELTYPE2 | 9 | vessel_type_matching_categories | 9 |
| Yes/No | 2 | yes_no_values | 2 |
| CONFIRMATION | 2 | confirmation_values | 2 |
| AGREEMENT | 2 | agreement_values | 2 |
| INFORMATION FROM | 14 | information_source_values | 14 |

Catalog publication result:

```text
24 of 24 source catalogs are present in the database.
1180 of 1180 source catalog values are published.
No catalog suppression was detected at database publication level.
```

Frontend binding drift:

```text
The current /create-profile/ frontend uses only a subset of the 24 catalogs.
The remaining published catalogs exist in the database but are not yet bound to all relevant source fields.
```

## Current Implemented Card Codes

Current `/create-profile/` UI sections:

```text
profile-section-cv
profile-section-contact
profile-section-addresses
profile-section-family
profile-section-physical
profile-section-identity-documents
profile-section-qualifications
profile-section-sea-service
profile-section-references
profile-section-medical
profile-section-publication
profile-section-documents
profile-section-review
profile-section-applications
```

Current workspace metadata sections:

```text
personal_details
name_components
contact_and_addresses
address_details
family_details
physical_details
identity_documents
qualifications
qualification_details
sea_service
previous_employer_references
medical_history
matching_publication
consent_details
document_readiness
```

## Alignment Result

Strict result:

```text
The current implementation is closer to the Excel source after CPG-SEAFARER-013,
but it is not yet a fully canonical Excel-derived form.
```

The current implementation must be treated as:

```text
draft/workspace implementation in progress
not final canonical readiness baseline
not approved canonical card taxonomy
```

## Implementation Drift

### Drift A - invented or platform-specific sections mixed into source form

These sections exist for platform workflow, but they are not source Excel form sections:

```text
profile-section-documents
profile-section-review
profile-section-applications
matching_publication.publish_to_matching
matching_publication.candidate_summary
```

Required correction:

```text
Keep platform workflow sections separate from source-defined Excel cards.
Do not let them define source readiness.
```

### Drift B - source fields compressed into text blocks

Current compressed fields:

```text
children_records
sea_service_history
sick_details
surgery_details
```

Required correction:

```text
These must become repeated structured records before strict readiness can be implemented.
```

### Drift C - missing or partial source fields

Missing or incomplete field coverage:

```text
employee_id_number
native/Russian mirror personal-name fields
permanent_city
permanent_country
permanent_region
registration_region
secondary_mobile_number
home_phone
next_of_kin street / house / flat / city / country as structured fields
next_of_kin mobile separate from home phone
child records as repeated structured rows
seafarer_id_series
seafarer_id_authority
seaman_book_series
seaman_book_authority
COC comments
training repeated rows
sea service repeated rows
medical signed-off-sick detail rows
medical surgery detail rows
manager notes / rank / type of ship / crewing manager signature as internal fields
```

### Drift D - source catalogs present but not fully bound to fields

Published catalogs not yet fully bound across the form:

```text
nationalities
child_relation_types
harbourmasters
schengen_countries
vessel_type_matching_categories
yes_no_values
confirmation_values
agreement_values
```

Some yes/no, confirmation and agreement fields are currently hardcoded in the UI. They should use the published source catalogs where source-controlled values exist.

### Drift E - legacy platform fields not directly defined by Excel

These fields may remain useful for CrewPortGlobal, but they must be marked as platform extensions:

```text
department
availability_status
availability_date
salary_expectation_usd
document readiness summary fields
publication-to-matching preference
candidate summary
vacancy application history
```

Required correction:

```text
Platform extensions must not be mixed into canonical Excel source readiness unless Project Owner approves the extension rule.
```

## Proposed Canonical Card List For Approval

The following canonical list is recommended for Project Owner approval:

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
EXP-002 Previous employer references

MED-001 Medical history
MED-002 Seafarer's obligation
MED-003 Personal data processing agreement
MED-004 Information source and comments
MED-005 Authorization for pre-employment process
```

Presentation rule:

```text
Each canonical card is collapsed by default except the first actionable task card in cabinet.
Source cards and platform workflow cards must be visually separated.
```

## Required Approval Questions

Before continuing implementation, the Project Owner should approve:

```text
1. Use the canonical card list above as the only source-derived seafarer card taxonomy.
2. Treat MED-005 as an internal team card, not a public user-editable card.
3. Treat department, availability, salary, publication preference and application history as platform extensions.
4. Convert compressed text fields into repeated structured records.
5. Bind all source dropdown fields to the published 24 catalogs unless a specific exception is approved.
6. Keep source readiness separate from platform workflow readiness.
```

## Commands / Checks Performed

Commands used:

```text
/var/www/.venv/bin/python - read workbook with xlrd formatting_info=True
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql - catalog count check
rg -n "profile-section-|data-workspace-section-save|bindCatalog" projects/crewportglobal/public/create-profile/index.html
```

No private Excel file content was copied into Git. This report records field structure and catalog counts only.

## Final Recommendation

Pause readiness logic work until the Project Owner approves the canonical card list.

After approval, the next implementation should correct the current form toward this exact taxonomy, normalize repeated records and keep platform-specific workflow sections separate from Excel source cards.
