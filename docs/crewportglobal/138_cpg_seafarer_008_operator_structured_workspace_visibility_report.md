# CPG-SEAFARER-008 — Operator Structured Workspace Visibility Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice makes the operator review surface show structured seafarer workspace data together with document-readiness metadata.

The goal is to help the team understand whether a seafarer draft is ready for human review without opening separate user-facing pages or relying only on raw JSON.

## Implemented Scope

Updated:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/verify/index.html
tests/crewportglobal-operator-queue.spec.ts
playwright.crewportglobal.config.ts
```

## Backend Behavior

The draft detail response now includes:

```text
payload.seafarer_workspace_structured
payload.seafarer_review_readiness
```

The vacancy-application operator detail response now also includes:

```text
seafarer_workspace_structured
seafarer_review_readiness
```

The review-readiness checklist is derived from structured seafarer data and document-readiness metadata.

Checklist cards:

```text
personal_contact
qualifications
sea_service
matching_publication
document_readiness
```

Each card returns:

```text
card_code
card_name
status: complete / incomplete
missing[]
```

## Operator UI Behavior

The `/verify/` detail panel now renders:

```text
Structured seafarer workspace
Review readiness checklist
```

The structured workspace section shows:

```text
date of birth
residence city
emergency contact
COC number
training records
latest sea service
candidate summary
matching publication choice
data-processing consent
```

The readiness checklist shows each review card as complete or incomplete and lists missing fields where applicable.

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Expected verification coverage:

```text
operator queue opens a seafarer draft
structured seafarer workspace appears in the detail panel
review-readiness checklist appears in the detail panel
COC, sea-service and document-readiness data are visible to the operator
document-readiness metadata can be marked complete for review visibility
```

## Boundaries

This slice does not:

```text
publish seafarer data
make automatic matching decisions
grant new access rights
change protected file storage
create public document downloads
change ClamAV scanning
change user auth/session behavior
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

## Next Planned Step

Proceed with:

```text
CPG-SEAFARER-009 — operator review checklist actions and card-level correction notes
```

Recommended scope:

```text
let the operator request correction for a specific seafarer card
show the user which exact card needs correction
preserve the existing document-correction task model
keep all final approval decisions under human review
```
