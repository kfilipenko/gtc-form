# BP-011 - Seafarer Field Dictionary And Reference Catalog Alignment

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-18
- Document type: Business-process / implementation-planning document
- Status: Drafted for Project Owner review
- Source material: private Excel source placed outside Git and outside public web root

## 1. Purpose

This document records the first structured analysis of the seafarer Excel field dictionary received for CrewPortGlobal.

The purpose is to convert the Excel workbook into a controlled implementation plan for:

```text
seafarer registration and workforce card fields
reference dictionaries
authenticated cabinet pages
database/API slices
document upload links
publication order
```

The Excel file must remain a private source material file. It may contain personal example values and must not be committed to Git or copied into public documentation.

## 2. Source Handling Boundary

The source file was placed in:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/
```

The file is not stored in:

```text
projects/crewportglobal/public/
docs/crewportglobal/
Git
```

Only structural findings are recorded here. Personal example values from the workbook are intentionally not copied into this document.

## 3. Workbook Inventory

The workbook contains five sheets:

```text
PERS
QUAL
EXPERIENCE
MEDICAL
DROPDOWN_LISTS
```

### 3.1 PERS

Purpose:

```text
Primary personal details for the seafarer application.
```

Field groups identified:

```text
position applied for
preferred / applied vessel type
personal details
permanent address
registration address
contact details
next of kin / beneficiary
children up to 21 years
physical details
```

Implementation interpretation:

```text
Physical Person Registration Card:
  name
  date of birth
  place of birth
  citizenship / nationality
  gender
  civil status
  contact details

Seafarer Workforce Card:
  position / rank applied for
  vessel type preference
  physical profile fields where operationally required

Emergency / beneficiary sub-card:
  next of kin
  relationship
  contact details
  children records when legally required
```

### 3.2 QUAL

Purpose:

```text
Identity documents, visas, education, competence certificates, endorsements and training courses.
```

Field groups identified:

```text
civil passport
foreign passport
seafarer ID
seaman's book
USA visa
Schengen visa
maritime education
certificate of competence
national endorsements
training courses
```

Implementation interpretation:

```text
Document metadata:
  document type
  number / series
  issuing authority
  issue date
  expiry date
  comments

Repeating records:
  education records
  competence certificates
  endorsements
  training courses

Protected uploads:
  scanned/captured files remain linked through uploaded_documents metadata.
```

### 3.3 EXPERIENCE

Purpose:

```text
Sea service history and previous employer references.
```

Field groups identified:

```text
vessel name
vessel type
deadweight
engine type
engine power
flag
management company or crew agent
rank
from date
to date
previous employer references
reference contact person
reference phone
reference email
```

Implementation interpretation:

```text
Seafarer Sea Service Records:
  repeated service rows
  used for matching, verification and candidate presentation

Reference Contacts:
  repeated previous-employer references
  visible only to the owner and authorized reviewers/controllers
```

### 3.4 MEDICAL

Purpose:

```text
Medical history, health/surgery declarations, consent statements and internal pre-employment authorization notes.
```

Field groups identified:

```text
medical history questions
sick-off history
injury / health problem history
operation / surgery history
seafarer obligation confirmation
personal data processing consent
information source
comments
internal pre-employment authorization
manager notes
```

Implementation interpretation:

```text
Sensitive Health Declaration:
  must be treated as sensitive personal data
  should not be broadly visible through group membership
  should not be used for public matching output

Consent Records:
  should be stored as explicit consent events with timestamp, language/version and source.

Internal Fields:
  manager notes, pre-employment authorization and signature fields are team-side review/workflow fields, not public user profile fields.
```

### 3.5 DROPDOWN_LISTS

Purpose:

```text
Reference values for controlled fields.
```

The sheet contains 24 reference columns:

| Reference catalog | Value count |
|---|---:|
| POSITION | 48 |
| NATIONALITY | 2 |
| SEX | 2 |
| CIVIL STATUS | 4 |
| RELIGION | 12 |
| COUNTRY | 248 |
| AIRPORT | 155 |
| CITY | 228 |
| RELATION | 16 |
| RELATION_CHILDREN | 2 |
| EDUCATION_INSTITUTE | 139 |
| GRADE | 6 |
| COC | 27 |
| ENDORSMENT INSTITUTE | 40 |
| VESSELTYPE | 22 |
| NATIONAL_DOC | 17 |
| TRAINING_COURSES | 130 |
| HARBOURMASTER | 27 |
| SHENGENCOUNTRY | 26 |
| VESSELTYPE2 | 9 |
| Yes/No | 2 |
| CONFIRMATION | 2 |
| AGREEMENT | 2 |
| INFORMATION FROM | 14 |

Important cleanup note:

```text
Some catalog names and values require normalization before they become production dictionaries.
Examples include spelling consistency, duplicate vessel-type families, country-code mapping and sensitive categories.
```

## 4. Target Page Model

The Excel source should not become one long public form.

It should become an authenticated seafarer workspace assembled from cards.

Recommended target route:

```text
/cabinet/seafarer/
```

Transitional route:

```text
/create-profile/
```

`/create-profile/` should remain available for backward compatibility and can later become a route into the authenticated seafarer workspace.

## 5. Seafarer Workspace Cards

Standard presentation rule from BP-006 and BP-007 remains active:

```text
My tasks is first and open by default.
All other cards are collapsed by default and open by clicking the header.
```

Recommended card order:

```text
1. My tasks
2. Profile basics
3. Contact and addresses
4. Next of kin / beneficiary
5. Children records
6. Identity documents and visas
7. Education
8. Certificates of competence
9. National endorsements
10. Training courses
11. Sea service
12. Previous employer references
13. Medical and consent declarations
14. Matching preferences
15. Uploaded documents
16. Review status and submission
```

## 6. Field Ownership By Card

### 6.1 Physical Person / Account Layer

Fields:

```text
full legal name
date of birth
place of birth
citizenship / nationality
gender
civil status
primary email
primary phone
```

Purpose:

```text
registration and account identity
```

### 6.2 Seafarer Workforce Layer

Fields:

```text
position / rank applied for
department
preferred / accepted vessel types
availability
salary expectations
physical profile if required by maritime workflow
```

Purpose:

```text
matching supply against employer-side demand
```

### 6.3 Qualification And Document Layer

Fields:

```text
identity documents
passport / seaman book / seafarer ID metadata
visa metadata
education records
competence certificates
endorsements
training courses
```

Purpose:

```text
authorization evidence and reviewer completeness checks
```

### 6.4 Experience Layer

Fields:

```text
sea service rows
previous employer references
vessel type
rank served
dates served
engine / deadweight / flag context
```

Purpose:

```text
matching, verification and candidate presentation
```

### 6.5 Sensitive / Internal Layer

Fields:

```text
medical history
injury / illness / surgery history
personal-data consent
manager notes
pre-employment authorization
```

Purpose:

```text
review and compliance only
```

Control:

```text
These fields require scoped visibility and should not be exposed broadly or included in public candidate summaries.
```

## 7. Reference Catalog Plan

The first dictionary implementation should not hardcode dropdown values inside HTML.

Recommended catalog groups:

```text
seafarer_positions
vessel_types
countries
nationalities
airports
cities
relation_types
child_relation_types
education_institutions
education_grades
certificate_of_competence_types
endorsement_institutions
national_document_types
training_course_types
harbourmasters
schengen_countries
gender_values
civil_status_values
religion_values
yes_no_values
confirmation_values
agreement_values
information_source_values
```

Recommended API:

```text
GET /api/v1/reference-catalogs?scope=seafarer
GET /api/v1/reference-catalogs/{catalog_code}
```

Recommended seed approach:

```text
1. import cleaned dictionaries from the private Excel source;
2. store catalog_code, value_code, display_name, sort_order, is_active;
3. preserve original source label in source_value when needed;
4. do not expose inactive/unreviewed values in UI;
5. use English canonical source with Russian display labels added later through i18n.
```

## 8. Database Planning

Recommended future migrations:

```text
011_create_reference_catalogs.sql
012_extend_seafarer_workforce_profile_fields.sql
013_create_seafarer_identity_documents.sql
014_create_seafarer_education_certificates_training.sql
015_create_seafarer_sea_service_and_references.sql
016_create_seafarer_sensitive_declarations.sql
```

Recommended tables:

```text
crewportglobal.reference_catalogs
crewportglobal.reference_catalog_values
crewportglobal.seafarer_identity_documents
crewportglobal.seafarer_education_records
crewportglobal.seafarer_competence_certificates
crewportglobal.seafarer_endorsements
crewportglobal.seafarer_training_courses
crewportglobal.seafarer_sea_service_records
crewportglobal.seafarer_reference_contacts
crewportglobal.seafarer_next_of_kin
crewportglobal.seafarer_children
crewportglobal.seafarer_medical_declarations
crewportglobal.seafarer_consent_events
```

## 9. API Planning

Recommended authenticated API shape:

```text
GET   /api/v1/cabinet/seafarer
PATCH /api/v1/cabinet/seafarer/profile
GET   /api/v1/cabinet/seafarer/documents
POST  /api/v1/cabinet/seafarer/identity-documents
PATCH /api/v1/cabinet/seafarer/identity-documents/{id}
POST  /api/v1/cabinet/seafarer/education-records
POST  /api/v1/cabinet/seafarer/certificates
POST  /api/v1/cabinet/seafarer/training-courses
POST  /api/v1/cabinet/seafarer/sea-service
POST  /api/v1/cabinet/seafarer/references
POST  /api/v1/cabinet/seafarer/submit-for-review
```

The existing protected document upload endpoint should remain the upload boundary for files.

The seafarer workspace should link document metadata to the relevant structured record instead of creating unstructured file piles.

## 10. Publication Plan

### Phase 0 - Source Material Control

Status:

```text
started
```

Actions:

```text
keep Excel in private source storage
do not commit original file
record structural analysis in BP-011
review fields with Project Owner before migration design
```

### Phase 1 - Reference Catalog Draft

Deliverable:

```text
reference catalog SQL migration draft and seed review
```

Rules:

```text
no production overwrite
no unreviewed sensitive catalog publication
normalize vessel types before matching logic depends on them
```

### Phase 2 - Seafarer Schema Draft

Deliverable:

```text
DB/API implementation plan for seafarer structured records
```

Rules:

```text
separate account/person fields from workforce fields
separate repeating records from flat profile fields
separate sensitive medical declarations from normal profile data
```

### Phase 3 - API Slice

Deliverable:

```text
authenticated seafarer cabinet API
reference catalog API
tests
```

Rules:

```text
session required
scoped visibility required
no broad group-based record visibility
no raw server storage paths
```

### Phase 4 - Frontend Slice

Deliverable:

```text
/cabinet/seafarer/ workspace or upgraded /create-profile/ transition page
```

Rules:

```text
My tasks first and open
all other cards collapsed by default
reference-driven dropdowns
document upload sections attached to relevant structured records
mobile/tablet/desktop responsive behavior
```

### Phase 5 - Controlled Publication

Deliverable:

```text
publish UI only after API and catalog tests pass
```

Checks:

```text
existing registration/login/cabinet tests pass
reference catalog tests pass
seafarer save/load tests pass
document upload regression tests pass
public i18n validator passes
live smoke confirms no public data exposure
```

## 11. Immediate Implementation Recommendation

The next safe implementation task should be:

```text
CPG-REF-001 - Seafarer reference catalog migration draft and importer from private Excel source
```

Scope:

```text
create reference_catalogs and reference_catalog_values draft
parse DROPDOWN_LISTS from private source
generate reviewed seed SQL or JSON artifact
do not publish values until owner review
do not modify seafarer UI yet
```

After this, create:

```text
CPG-SEAFARER-001 - Structured seafarer workforce card schema and API plan
```

## 12. Open Decisions

Decisions required before implementation:

```text
1. Whether religion should be collected at all, given sensitivity and jurisdictional risk.
2. Whether child records are required for the CrewPortGlobal service or only for employer-specific forms.
3. Whether medical history is required at platform level or should be deferred to employer/medical-provider workflow.
4. Which country/nationality standard to use for production values.
5. How to normalize vessel type catalogs: VESSELTYPE and VESSELTYPE2 currently represent overlapping concepts.
6. Whether airport/city catalogs should be local static catalogs or integrated with a future external travel/location reference.
7. Which fields become mandatory for initial profile creation and which become required only before review/submission.
8. How Russian labels should be maintained: source labels, i18n catalog or admin-managed dictionary translation.
```

## 13. Final Recommendation

The Excel source is valuable and should become the baseline for the seafarer workspace, but it must be normalized before implementation.

The correct sequence is:

```text
private source analysis
reference catalog draft
field/schema planning
API slice
authenticated seafarer workspace
controlled publication
```

This avoids building a large static form and instead moves CrewPortGlobal toward a maintainable, dictionary-driven maritime application.
