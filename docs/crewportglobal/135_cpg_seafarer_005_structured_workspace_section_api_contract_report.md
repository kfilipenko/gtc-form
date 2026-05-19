# CPG-SEAFARER-005 — Structured Workspace Section API Contract Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice creates the first stable backend contract for saving individual sections of the structured seafarer workspace.

The goal is to let future frontend forms save one logical card at a time while preserving the current registration draft flow and the existing JSON fallback.

## Implemented Scope

Updated:

```text
projects/crewportglobal/app/backend/api/public/index.php
tests/crewportglobal-seafarer-workspace-form.spec.ts
```

Added endpoint:

```text
PATCH /api/v1/seafarer/workspace/sections/{section}
```

Supported sections:

```text
personal_details
contact_and_addresses
qualifications
sea_service
matching_publication
```

Request body:

```json
{
  "draft_id": "uuid-for-draft-fallback",
  "data": {
    "section_field": "value"
  }
}
```

The endpoint supports the existing transition model:

```text
authenticated session when available
draft_id fallback while the registration flow is still moving toward full cabinet-first editing
```

## Behavior

The endpoint:

```text
validates the requested workspace section
validates that a data object is provided
normalizes known fields for the target section
updates document_metadata.seafarer_workspace
preserves the JSON fallback
sets the seafarer profile review_status to submitted_for_human_review
syncs the changed workspace data into structured seafarer workspace tables
returns the full structured workspace summary
```

The structured sync still uses the existing bridge from the JSON workspace payload. This avoids two competing write models while the public create-profile page is being migrated card by card.

## Audit Event

The endpoint records:

```text
seafarer_workspace_section_updated
```

The audit payload includes:

```text
section
access_model
```

## JSON Fallback Preservation

The implementation intentionally keeps:

```text
document_metadata.seafarer_workspace
```

as the compatibility source for older public form behavior.

Structured tables are refreshed after each section save so the cabinet and future review/matching views can use normalized records without breaking existing draft reads.

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Result:

```text
PHP syntax check passed
whitespace check passed
6 Playwright tests passed
```

The focused API test confirmed:

```text
contact_and_addresses section PATCH works through draft_id fallback
qualifications section PATCH works through draft_id fallback
JSON fallback metadata is updated
structured person/emergency-contact/certificate/training records are refreshed
invalid section names are rejected
existing cabinet dashboard tests still pass
```

## Boundaries

This slice does not:

```text
publish candidate data
change matching logic
change database schema
change document upload or review behavior
change password/session/authentication behavior
change access-control role assignments
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

## Next Recommended Step

Proceed with:

```text
CPG-SEAFARER-006 — public create-profile section-save frontend integration
```

Recommended scope:

```text
connect expanded create-profile cards to the section PATCH endpoint
save one card at a time
show section-level saved/error states
keep draft_id fallback until cabinet-first editing is fully adopted
do not publish or match automatically
```
