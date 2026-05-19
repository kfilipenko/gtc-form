# CPG-SEAFARER-002 — Seafarer Workspace JSON to Structured Records Bridge Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice connects the expanded public seafarer workspace form to the normalized database schema created in CPG-SEAFARER-001.

The public form still writes the current safe payload to:

```text
seafarer_profiles.document_metadata.seafarer_workspace
```

This slice adds a backend bridge that also writes the same submitted data into structured seafarer workspace tables when migration 012 is available.

## Implemented Scope

Updated backend API:

```text
projects/crewportglobal/app/backend/api/public/index.php
```

Implemented:

```text
seafarer workspace table readiness guard
JSON metadata parser
reference catalog value resolver
structured sync on seafarer draft save/update
structured workspace summary reader
GET /api/v1/seafarer/workspace endpoint
draft_id fallback for transition access
authenticated user-session access path
```

## Structured Records Written

The bridge writes or refreshes records for:

```text
person details
primary emergency contact
education record
certificate of competency record
training records
latest sea-service record
matching preferences
```

The following table remains reserved for a future controlled publication workflow:

```text
crewportglobal.seafarer_publication_snapshots
```

No candidate publication is performed by this slice.

## API Endpoint

Added:

```text
GET /api/v1/seafarer/workspace
GET /api/v1/seafarer/workspace?draft_id={draft_id}
```

The endpoint returns a structured summary:

```text
schema_ready
seafarer_profile_id
person_details
emergency_contacts
education_records
certificates
training_records
sea_service_records
medical_declarations
matching_preferences
```

The endpoint does not return uploaded raw files, protected storage paths or publication snapshots.

## Backward Compatibility

If migration 012 is not applied on a target environment, the bridge exits safely:

```text
old JSON metadata remains the source of truth
draft save/update continues
GET workspace returns schema_ready=false
```

This prevents the public form from breaking during phased deployment.

## Reference Catalog Behavior

Where a submitted label matches a published reference catalog value, the bridge stores the corresponding:

```text
reference_value_id
```

The submitted label is also preserved as a snapshot so future catalog edits do not erase the user-submitted meaning.

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts
git diff --check
```

Result:

```text
PHP syntax check passed
focused Playwright seafarer workspace test passed
workspace endpoint returned structured records created from saved form metadata
whitespace check passed
```

The focused test confirmed:

```text
person details were read from structured tables
primary emergency contact was read from structured tables
certificate data was read from structured tables
training records were read from structured tables
sea-service record was read from structured tables
matching preferences were read from structured tables
```

## Boundaries

Not changed in this slice:

```text
frontend form layout
public candidate publication
operator review UI
document upload flow
file download behavior
account/session model
Stripe
OpenClaw
nginx/server config
deployment
```

## Next Recommended Step

Proceed with:

```text
CPG-SEAFARER-003 — seafarer cabinet workspace view from structured records
```

Recommended scope:

```text
show structured seafarer sections in /cabinet/
keep "My tasks" as the first expanded card
keep all other cards collapsed by default
show missing required data as tasks
do not publish candidate data automatically
```
