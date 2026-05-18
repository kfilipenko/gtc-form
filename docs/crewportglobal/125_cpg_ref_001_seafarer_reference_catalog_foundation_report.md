# CrewPortGlobal - CPG-REF-001 Seafarer Reference Catalog Foundation Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for Project Owner review
- Baseline:
  - `business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md`
- Scope: reference catalog schema and private Excel dropdown importer

## 1. Purpose

This document records the first implementation slice for CrewPortGlobal reference dictionaries.

The goal is to make future seafarer forms dictionary-driven instead of hardcoding dropdown lists in HTML.

This slice creates:

```text
reference catalog database foundation
private Excel DROPDOWN_LISTS importer
private review artifacts for catalog owner review
publication boundary before UI/API exposure
```

## 2. Implemented Scope

Created database migration:

```text
projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql
```

Tables:

```text
crewportglobal.reference_catalogs
crewportglobal.reference_catalog_values
```

Created importer:

```text
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
```

Updated dependency file:

```text
projects/crewportglobal/requirements.txt
```

The importer reads only:

```text
DROPDOWN_LISTS
```

from the private Excel source outside Git.

## 3. Catalog Schema

`reference_catalogs` stores:

```text
catalog_code
catalog_name
catalog_scope
source_name
source_sheet
description
is_active
publication_state
```

`reference_catalog_values` stores:

```text
reference_catalog_id
value_code
display_name
source_value
source_row_number
sort_order
metadata
is_active
publication_state
```

Publication states:

```text
draft
pending_owner_review
approved
published
retired
```

The intended future rule is that UI/API should expose only approved/published values, not private review drafts.

## 4. Private Import Result

Importer command produced private review artifacts in:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/processed/
```

Generated files:

```text
seafarer_reference_catalogs_review_20260518T191557Z.json
seafarer_reference_catalogs_seed_20260518T191557Z.sql
seafarer_reference_catalogs_summary_20260518T191557Z.md
```

Import summary:

| Catalog code | Source header | Scope | Values |
|---|---|---|---:|
| seafarer_positions | POSITION | seafarer | 48 |
| nationalities | NATIONALITY | global | 2 |
| gender_values | SEX | global | 2 |
| civil_status_values | CIVIL STATUS | global | 4 |
| religion_values | RELIGION | seafarer | 12 |
| countries | COUNTRY | global | 248 |
| airports | AIRPORT | global | 155 |
| cities | CITY | global | 228 |
| relation_types | RELATION | global | 16 |
| child_relation_types | RELATION_CHILDREN | global | 2 |
| education_institutions | EDUCATION_INSTITUTE | seafarer | 139 |
| education_grades | GRADE | seafarer | 6 |
| certificate_of_competence_types | COC | seafarer | 27 |
| endorsement_institutions | ENDORSMENT INSTITUTE | seafarer | 40 |
| vessel_types | VESSELTYPE | vessel | 22 |
| national_document_types | NATIONAL_DOC | seafarer | 17 |
| training_course_types | TRAINING_COURSES | seafarer | 130 |
| harbourmasters | HARBOURMASTER | seafarer | 27 |
| schengen_countries | SHENGENCOUNTRY | global | 26 |
| vessel_type_matching_categories | VESSELTYPE2 | vessel | 9 |
| yes_no_values | Yes/No | global | 2 |
| confirmation_values | CONFIRMATION | system | 2 |
| agreement_values | AGREEMENT | system | 2 |
| information_source_values | INFORMATION FROM | seafarer | 14 |

Total:

```text
24 catalogs
1180 values
0 duplicate values skipped
```

## 5. Publication Boundary

The generated seed SQL was not applied.

Current state after this slice:

```text
reference tables exist
catalog values are generated for owner review in private storage
no catalog values are published to UI
no catalog values are exposed through public API
no seafarer form pages were changed
```

All generated values are marked:

```text
pending_owner_review
```

The private Excel source remains outside Git and outside public web root.

## 6. Review Items Before Publishing Values

Project Owner / product review is required for:

```text
country and nationality normalization against an approved standard
religion collection decision because it is sensitive data
VESSELTYPE and VESSELTYPE2 normalization
airport and city catalog review
Russian/English display label strategy
which catalogs are public-safe and which are internal-only
```

## 7. Changed Files

```text
projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
projects/crewportglobal/requirements.txt
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
projects/crewportglobal/app/backend/api/README.md
docs/crewportglobal/125_cpg_ref_001_seafarer_reference_catalog_foundation_report.md
docs/crewportglobal/00_documentation_register.md
```

Private generated files outside Git:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_review_20260518T191557Z.json
/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_seed_20260518T191557Z.sql
/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_summary_20260518T191557Z.md
```

## 8. Verification

Commands run:

```bash
python3 -m py_compile projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql
/tmp/cpg-xls-venv/bin/python projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -c "select to_regclass('crewportglobal.reference_catalogs') is not null, to_regclass('crewportglobal.reference_catalog_values') is not null;"
git diff --check
```

Results:

```text
Python syntax: passed
migration 011 schema apply: passed
private importer generation: passed
reference tables exist: true / true
seed values in database: 0 catalogs / 0 values
git diff --check: passed
```

## 9. Boundaries

Not changed in this slice:

```text
frontend pages
public navigation
authenticated seafarer workspace UI
reference API endpoints
seafarer schema beyond catalog foundation
document upload/review flow
auth/session
payment
OpenClaw
nginx/server configuration
deployment
```

## 10. Recommended Next Step

Next implementation slice:

```text
CPG-REF-002 - Reference catalog review API and owner-controlled publication workflow
```

Recommended scope:

```text
read private generated review artifact
allow owner/team review of catalog values
mark selected catalogs/values approved or published
create GET /api/v1/reference-catalogs endpoint for published values only
add tests proving pending_owner_review values are not exposed
```

Alternative if Project Owner wants faster UI work:

```text
CPG-SEAFARER-001 - Seafarer workspace schema draft using reference catalog fields
```

But the safer path is to review and publish catalogs first.

## 11. Final Recommendation

The reference catalog foundation is ready for Project Owner review.

CrewPortGlobal can now proceed from private Excel source material toward controlled, dictionary-driven seafarer forms without committing the source workbook or exposing unreviewed dropdown values to users.
