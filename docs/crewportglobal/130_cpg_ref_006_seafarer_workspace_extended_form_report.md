# CPG-REF-006 — Seafarer Workspace Extended Form Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice extends the seafarer-facing `/create-profile/` workspace after publication of the Excel-based reference catalogs.

The goal is to move from a short CV intake form toward the BP-011 seafarer workspace structure without introducing a new database schema yet.

## Implemented Scope

The `/create-profile/` page now includes additional compact cards:

1. Personal contact and addresses.
2. Certificates and education.
3. Last sea service.
4. Matching publication request.

The cards are collapsed by default and can be opened by the user or by sidebar navigation.

## Reference Catalog Bindings

Additional datalist bindings were added through the existing public reference catalog helper:

```text
gender_values
civil_status_values
cities
airports
relation_types
certificate_of_competence_types
countries
education_institutions
education_grades
training_course_types
information_source_values
```

Existing bindings for `seafarer_positions` and `vessel_types` remain active.

## Data Persistence

Extended form data is saved in:

```text
seafarer_profiles.document_metadata.seafarer_workspace
```

The saved structure includes:

```text
personal_details
contact_and_addresses
qualifications
sea_service
matching_publication
```

No new production database migration was introduced in this slice.

## Backend Adjustment

The seafarer metadata normalizer now accepts training-course lists from both formats:

```text
comma-separated string
array from frontend JSON
```

This keeps the draft API tolerant while the future normalized seafarer workspace tables are still being designed.

## Publication Boundary

The field `publish_to_matching` records only the user's request or preference for future matching after review.

It does not automatically publish the seafarer profile, expose the candidate to employers or bypass human review.

## Changed Files

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/app/backend/api/public/index.php
tests/crewportglobal-seafarer-workspace-form.spec.ts
docs/crewportglobal/130_cpg_ref_006_seafarer_workspace_extended_form_report.md
docs/crewportglobal/00_documentation_register.md
```

## Verification

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts
git diff --check
```

Result:

```text
PHP syntax check passed.
Playwright: 6 passed.
Git diff whitespace check passed.
```

## Boundaries

Not changed in this slice:

```text
production DB schema
document upload security model
public candidate publication
operator review decisions
Stripe
OpenClaw
nginx/server config
deployment
```

## Next Recommended Step

Create the first normalized seafarer workspace schema/API plan for repeating records:

```text
children
identity documents
visas
education records
certificates
endorsements
training courses
sea service records
references
medical declarations
```

That step should replace the temporary JSON persistence with proper card-specific tables and scoped API endpoints.
