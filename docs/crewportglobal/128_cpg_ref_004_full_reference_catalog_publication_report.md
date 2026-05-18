# CrewPortGlobal - CPG-REF-004 Full Reference Catalog Publication Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Completed for full standard reference catalog publication
- Baseline:
  - `docs/crewportglobal/125_cpg_ref_001_seafarer_reference_catalog_foundation_report.md`
  - `docs/crewportglobal/126_cpg_ref_002_reference_catalog_publication_api_report.md`
  - `docs/crewportglobal/127_cpg_ref_003_admin_reference_catalog_publication_console_report.md`

## 1. Purpose

This document records the first controlled full publication of standard reference catalogs derived from the private seafarer Excel source.

The goal of this slice is to make all existing imported reference catalogs available through:

```text
GET /api/v1/reference-catalogs
```

so that the next implementation slice can bind seafarer and employer forms to published dictionaries.

## 2. Published Catalogs

The following catalogs were moved from `pending_owner_review` to `published`:

```text
agreement_values
airports
certificate_of_competence_types
child_relation_types
cities
civil_status_values
confirmation_values
countries
education_grades
education_institutions
endorsement_institutions
gender_values
harbourmasters
information_source_values
national_document_types
nationalities
relation_types
religion_values
schengen_countries
seafarer_positions
training_course_types
vessel_type_matching_categories
vessel_types
yes_no_values
```

## 3. Publication Counts

After publication:

```text
published catalogs: 24
published values: 1180
pending_owner_review catalogs: 0
pending_owner_review values: 0
```

The public API now exposes all 24 imported catalogs and their 1180 imported values.

## 4. Source Completeness Verification

The source Excel file was re-read directly for verification:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
```

Source sheet:

```text
DROPDOWN_LISTS
```

Completeness result:

```text
source catalogs: 24
source values after duplicate skip: 1180
source duplicates skipped: 0
database matching catalogs: 24
database matching values: 1180
missing catalogs: 0
extra catalogs: 0
count mismatches: 0
value mismatches: 0
unpublished catalogs: 0
unpublished values: 0
```

The database catalog/value set matches the source workbook-derived dictionary set by catalog code, value code, display name, source value, source row number and sort order.

## 5. Audit Event

The publication was recorded in:

```text
crewportglobal.access_audit_events
```

Audit event:

```text
reference_catalog_full_publication_completed
```

Actor:

```text
kfilipenko@gtchain.io
```

Reason:

```text
CPG-REF-004 full standard reference catalog publication after Project Owner instruction to publish all existing catalogs.
```

## 6. Verification

Commands/checks performed:

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql ...
curl -fsS 'https://crewportglobal.com/api/v1/reference-catalogs'
curl -fsS 'https://crewportglobal.com/api/v1/reference-catalogs?catalog_code=vessel_types'
curl -sS -o /tmp/cpg-reference-invalid.json -w '%{http_code}\n' 'https://crewportglobal.com/api/v1/reference-catalogs?scope=bad'
/tmp/cpg-xls-venv/bin/python ...
```

Results:

```text
public reference catalog API: ok
vessel_types public lookup: ok
invalid scope response: HTTP 400
published catalog count: 24
published value count: 1180
pending catalog count: 0
pending value count: 0
source completeness comparison: passed
audit event: written
```

## 7. Boundaries

No changes were made to:

```text
public form bindings
seafarer profile persistence schema
employer vacancy persistence schema
document upload
auth/session
payment
OpenClaw
nginx/server configuration
deployment
```

No private Excel file or generated private review artifact was committed to Git.

## 8. Next Recommended Step

CPG-REF-005 should bind the first form controls to the public catalog API:

```text
/create-profile/
  rank -> seafarer_positions
  preferred vessel types -> vessel_types

/post-vacancy/
  vessel type -> vessel_types
  vacancy title / rank -> seafarer_positions
```

The implementation must keep safe fallback behavior when the public API is unavailable and must not expose pending-owner-review catalogs.
