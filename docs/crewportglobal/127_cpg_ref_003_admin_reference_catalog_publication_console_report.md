# CrewPortGlobal - CPG-REF-003 Admin Reference Catalog Publication Console Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for Project Owner review
- Baseline:
  - `docs/crewportglobal/126_cpg_ref_002_reference_catalog_publication_api_report.md`

## 1. Purpose

This document records the first Project Owner UI slice for reference catalog review and publication.

CPG-REF-002 created the protected API and loaded Excel-derived values as `pending_owner_review`. CPG-REF-003 adds an admin-console control surface so the owner can inspect, approve, publish or retire reference catalog values before they are used by registration forms.

## 2. Implemented Scope

Updated:

```text
projects/crewportglobal/public/admin/access/index.html
```

Added a new admin console section:

```text
Reference catalogs — Owner review and publication
```

The section provides:

```text
catalog count
pending value count
approved value count
published value count
catalog queue
catalog selector
publication-state filter
selected catalog value list
audit-note field
catalog actions
selected-value actions
```

## 3. Owner Actions

Supported catalog-level actions:

```text
Approve catalog
Publish catalog
Retire catalog
```

Supported selected-value actions:

```text
Approve selected
Publish selected
Retire selected
```

All changes are submitted to the protected endpoint:

```text
PATCH /api/v1/admin/access/reference-catalogs/publication
```

The UI sends:

```text
catalog_code
publication_state
value_codes when selected values are targeted
reason when an audit note is entered
```

## 4. Visibility Boundary

The console uses only Project Owner protected admin endpoints:

```text
GET   /api/v1/admin/access/reference-catalogs
PATCH /api/v1/admin/access/reference-catalogs/publication
```

The public endpoint remains unchanged:

```text
GET /api/v1/reference-catalogs
```

Only values with `publication_state = published` are exposed publicly.

No new public form reads were added in this slice.

## 5. Current Data State

The database remains in owner-review state after this implementation:

```text
reference catalogs: 24
reference values: 1180
pending_owner_review values: 1180
published values: 0
```

No reference values were published by this implementation task.

## 6. Changed Files

```text
projects/crewportglobal/public/admin/access/index.html
projects/crewportglobal/app/backend/api/README.md
tests/crewportglobal-admin-reference-catalogs-ui.spec.ts
docs/crewportglobal/127_cpg_ref_003_admin_reference_catalog_publication_console_report.md
docs/crewportglobal/00_documentation_register.md
```

## 7. Verification

Commands run:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/reference_catalogs.php
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-admin-reference-catalogs-ui.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-admin-reference-catalogs-ui.spec.ts tests/crewportglobal-reference-catalogs.spec.ts
git diff --check
```

Focused UI test result:

```text
1 passed
```

The UI test verifies:

```text
admin console loads with an active Project Owner session context
reference catalog summary counts render
catalog queue renders
selected catalog values render
selected value publish action calls the protected publication endpoint
publication payload includes catalog_code, publication_state, reason and value_codes
```

## 8. Boundaries

No changes were made to:

```text
public registration forms
seafarer form field bindings
employer form field bindings
document upload
auth/session model
payment
OpenClaw
nginx/server configuration
manual deployment
```

Private Excel source and generated private artifacts remain outside Git.

## 9. Next Recommended Step

CPG-REF-004 should review and publish the first safe catalogs for form usage.

Recommended initial publication candidates:

```text
vessel_types
vessel_type_matching_categories
yes_no_values
confirmation_values
agreement_values
seafarer_positions
certificate_of_competence_types
training_course_types
```

Sensitive or normalization-heavy catalogs should stay pending until separately reviewed:

```text
religion_values
countries
nationalities
airports
cities
education_institutions
```

After selected catalogs are published, CPG-REF-005 can bind the seafarer authorization/profile forms to `GET /api/v1/reference-catalogs`.
