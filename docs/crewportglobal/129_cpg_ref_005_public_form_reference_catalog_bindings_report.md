# CrewPortGlobal - CPG-REF-005 Public Form Reference Catalog Bindings Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented
- Baseline:
  - `docs/crewportglobal/128_cpg_ref_004_full_reference_catalog_publication_report.md`

## 1. Purpose

This document records the first frontend-only binding between public application forms and the published CrewPortGlobal reference catalog API.

CPG-REF-004 published all imported reference catalogs. CPG-REF-005 uses those published values as user-facing suggestions in the seafarer and employer/vacancy forms while keeping the existing draft payload shape unchanged.

## 2. Implemented Scope

Added a shared browser helper:

```text
projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js
```

The helper:

```text
fetches GET /api/v1/reference-catalogs?catalog_code=...
caches catalog values in the browser session
populates datalist controls
fails safely when the API is unavailable
does not expose pending/unpublished values because the public API only returns published values
```

## 3. Form Bindings

Updated:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Bindings:

```text
/create-profile/
  create-rank -> seafarer_positions
  create-vessel-types -> vessel_types

/post-vacancy/
  post-vessel-type -> vessel_types
  post-vacancy-title -> seafarer_positions
```

The controls remain text inputs with `datalist` suggestions. This preserves:

```text
manual input
existing saved draft values
current backend field types
current profile/vacancy payload format
direct URL compatibility
```

## 4. Data Boundary

The frontend uses only the public catalog endpoint:

```text
GET /api/v1/reference-catalogs
```

No Project Owner/admin endpoint is called from public forms.

No raw source fields are exposed:

```text
source_value
source_name
source_sheet
source_row_number
metadata
storage paths
```

## 5. Changed Files

```text
projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
tests/crewportglobal-reference-catalog-form-bindings.spec.ts
docs/crewportglobal/129_cpg_ref_005_public_form_reference_catalog_bindings_report.md
docs/crewportglobal/00_documentation_register.md
```

## 6. Verification

Commands/checks performed:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
curl -fsS 'https://crewportglobal.com/api/v1/reference-catalogs?catalog_code=seafarer_positions'
curl -fsS 'https://crewportglobal.com/api/v1/reference-catalogs?catalog_code=vessel_types'
git diff --check
```

The focused form-binding test verifies:

```text
seafarer rank suggestions load from seafarer_positions
seafarer vessel suggestions load from vessel_types
employer vacancy rank suggestions load from seafarer_positions
employer vessel type suggestions load from vessel_types
existing text input behavior still works
```

Results:

```text
reference catalog form-binding UI test: 1 passed
create-profile/post-vacancy regression tests: 5 passed
seafarer_positions public lookup: ok, 48 values
vessel_types public lookup: ok, 22 values
git diff --check: passed
```

## 7. Boundaries

No changes were made to:

```text
backend API
database schema
reference catalog publication logic
registration draft persistence
document upload
auth/session
payment
OpenClaw
nginx/server configuration
deployment
```

## 8. Next Recommended Step

CPG-REF-006 should decide whether the next form iteration stores:

```text
display_name only
value_code only
both value_code and display_name
```

For matching quality, the recommended future model is to store both the stable `value_code` and the displayed label. CPG-REF-005 intentionally avoids that database/API change and keeps the current field model stable.
