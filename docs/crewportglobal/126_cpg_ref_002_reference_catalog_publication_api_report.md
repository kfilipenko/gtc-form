# CrewPortGlobal - CPG-REF-002 Reference Catalog Publication API Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for Project Owner review
- Baseline:
  - `docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md`
  - `docs/crewportglobal/125_cpg_ref_001_seafarer_reference_catalog_foundation_report.md`

## 1. Purpose

This document records the second reference catalog implementation slice.

The goal is to move the private Excel-derived reference values from file-only review artifacts into a controlled database review workflow without exposing unreviewed values to public forms or API consumers.

## 2. Implemented Scope

Created backend reference catalog module:

```text
projects/crewportglobal/app/backend/api/lib/reference_catalogs.php
```

Updated API router:

```text
projects/crewportglobal/app/backend/api/public/index.php
```

Added public read endpoint:

```text
GET /api/v1/reference-catalogs
```

Added Project Owner protected admin endpoints:

```text
GET   /api/v1/admin/access/reference-catalogs
PATCH /api/v1/admin/access/reference-catalogs/publication
```

Updated backend API documentation:

```text
projects/crewportglobal/app/backend/api/README.md
```

Added focused API visibility test:

```text
tests/crewportglobal-reference-catalogs.spec.ts
```

## 3. Publication Boundary

The public endpoint returns only:

```text
active catalog
active value
catalog publication_state = published
value publication_state = published
```

The public endpoint does not return:

```text
source_name
source_sheet
source_value
metadata
private file paths
pending_owner_review values
approved-but-not-published values
retired values
```

Supported public filters:

```text
scope
catalog_code
```

Allowed scopes:

```text
global
seafarer
employer
vessel
system
```

## 4. Owner Review API

Project Owner can inspect internal catalog state through:

```text
GET /api/v1/admin/access/reference-catalogs
```

Optional query parameters:

```text
include_values=1
catalog_code=...
publication_state=...
```

Project Owner can change publication state through:

```text
PATCH /api/v1/admin/access/reference-catalogs/publication
```

Request fields:

```text
catalog_code
publication_state
value_codes optional
reason optional
```

Allowed target states:

```text
pending_owner_review
approved
published
retired
```

Behavior:

```text
without value_codes: update catalog and all values
with value_codes: update selected values only
publishing or approving selected values also moves the catalog to the same state
```

Publication changes write an access audit event:

```text
reference_catalog_publication_state_changed
```

## 5. Seed Import Result

Applied the generated private seed SQL from:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_seed_20260518T191557Z.sql
```

Current database state after import:

```text
reference catalogs: 24
reference values: 1180
pending_owner_review values: 1180
published values: 0
```

This import did not publish any values.

## 6. Changed Files

```text
projects/crewportglobal/app/backend/api/lib/reference_catalogs.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/README.md
tests/crewportglobal-reference-catalogs.spec.ts
docs/crewportglobal/126_cpg_ref_002_reference_catalog_publication_api_report.md
docs/crewportglobal/00_documentation_register.md
```

Private source/seed files remain outside Git:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/processed/
```

## 7. Verification

Commands run:

```bash
php -l projects/crewportglobal/app/backend/api/lib/reference_catalogs.php
php -l projects/crewportglobal/app/backend/api/public/index.php
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalogs.spec.ts
```

Focused test result:

```text
1 passed
```

The test verifies:

```text
pending_owner_review catalog values are not returned publicly
published values are returned publicly
mixed published/pending catalogs expose only published values
private source fields are not returned by the public API
invalid public scope is rejected
```

## 8. Security and Product Boundaries

No changes were made to:

```text
public forms
registration flows
document upload
profile photo upload
auth/session model
payment
OpenClaw
nginx/server configuration
deployment
```

No private Excel file was committed.

No generated private review artifact was committed.

No unreviewed reference value is publicly exposed.

## 9. Next Recommended Step

CPG-REF-003 should add a compact Project Owner UI inside the admin console for:

```text
viewing pending reference catalogs
opening catalog values
approving selected values
publishing reviewed catalogs
retiring incorrect values
showing publication state counts
```

After owner publication, the seafarer registration/cabinet forms can safely replace hardcoded dropdowns with `GET /api/v1/reference-catalogs`.
