# CPG-SEAFARER-001 — Structured Seafarer Workspace Schema Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice creates the first normalized database foundation for the seafarer workspace described in BP-011.

The previous `/create-profile/` extension stores expanded data in:

```text
seafarer_profiles.document_metadata.seafarer_workspace
```

That JSON bridge remains valid for the current public form. This slice adds structured tables so future API and cabinet work can move repeating seafarer records out of JSON and into scoped, reviewable records.

## Migration

Created migration:

```text
projects/crewportglobal/app/backend/db/migrations/012_create_seafarer_workspace_records.sql
```

The migration is idempotent and safe to re-run.

## Tables Created

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

## Design Rules

The schema follows the BP-011 separation rules:

```text
account/person fields are separated from workforce fields
repeating records are separated from flat profile fields
sensitive medical declarations are separated from normal profile data
matching publication is separated from raw profile editing
```

## Reference Catalog Links

Where practical, records include optional links to:

```text
crewportglobal.reference_catalog_values
```

Each catalog-linked field also keeps a label/code snapshot field, so future catalog updates do not erase what the user originally submitted.

## Document Links

Structured records can link to uploaded evidence through:

```text
crewportglobal.uploaded_documents(document_id)
```

This allows future upload sections to attach documents to the relevant card instead of leaving evidence as an unstructured pile.

## Review and State Model

Most user-editable records include:

```text
record_state
review_status
metadata
created_at
updated_at
```

Supported review statuses are aligned with the document-review model:

```text
not_submitted
pending_human_review
under_review
verified
rejected
correction_requested
superseded
```

## Publication Boundary

The new table:

```text
crewportglobal.seafarer_publication_snapshots
```

is designed for future controlled candidate presentation. It does not publish data by itself.

Publication remains a future controlled workflow requiring:

```text
clean uploaded documents
human review
scoped authorization
explicit publication state
audit trail
```

## Verification Performed

Executed against the local development database:

```text
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/012_create_seafarer_workspace_records.sql
```

Verified table creation:

```text
seafarer_certificates
seafarer_education_records
seafarer_emergency_contacts
seafarer_matching_preferences
seafarer_medical_declarations
seafarer_person_details
seafarer_publication_snapshots
seafarer_sea_service_records
seafarer_training_records
```

Also executed:

```text
git diff --check
```

Result:

```text
migration applied cleanly to local development DB
all 9 structured tables were present
whitespace check passed
```

## Boundaries

Not changed in this slice:

```text
/create-profile/ runtime write path
frontend form behavior
public candidate publication
document upload endpoints
operator review UI
Stripe
OpenClaw
nginx/server config
deployment
```

## Next Recommended Step

Create the first backend API bridge:

```text
CPG-SEAFARER-002 — migrate/update structured records from seafarer_workspace JSON
```

Recommended scope:

```text
read current document_metadata.seafarer_workspace
write structured records for one profile
keep JSON fallback
add GET /api/v1/seafarer/workspace summary endpoint
add tests proving old drafts still load
```
