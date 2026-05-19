# CPG-SEAFARER-007 — Document Readiness Section Save Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice separates the seafarer document-readiness metadata card from the protected file upload flow.

The goal is to let the user save passport, medical, visa and document-readiness notes without changing uploaded-document storage, ClamAV scanning or human-review document queues.

## Implemented Scope

Updated:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/create-profile/index.html
tests/crewportglobal-seafarer-workspace-form.spec.ts
```

Added endpoint:

```text
PATCH /api/v1/seafarer/document-readiness
```

Request body:

```json
{
  "draft_id": "uuid-for-draft-fallback",
  "data": {
    "certificate_status": "ready",
    "stcw_status": "ready",
    "passport_expiry": "2030-03-20",
    "medical_expiry": "2027-02-10",
    "visa_status": "not_required",
    "notes": "Document readiness note"
  }
}
```

## Behavior

The endpoint:

```text
supports authenticated session or draft_id transition fallback
requires a seafarer profile
normalizes allowed readiness statuses and date fields
merges document-readiness fields into seafarer_profiles.document_metadata
preserves existing seafarer_workspace JSON metadata
sets review_status to submitted_for_human_review
records an audit event
returns safe document_metadata JSON
```

The audit event is:

```text
seafarer_document_readiness_updated
```

## Frontend Behavior

The `/create-profile/` Documents card now includes:

```text
Save section
section-level saving status
section-level saved/error feedback
draft-first guard when no draft_id exists
```

This is separate from:

```text
protected document upload
malware scanning
review queue
replacement upload
```

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

The focused test confirmed:

```text
the document-readiness card can be saved independently after draft creation
stcw_status updates through the section endpoint
passport_expiry updates through the section endpoint
visa_status updates through the section endpoint
notes update through the section endpoint
existing structured workspace section saves still work
existing cabinet document-correction flows still pass
```

## Boundaries

This slice does not:

```text
change uploaded_documents
change protected server storage
change ClamAV scanning
create public document download
change operator document-review queue
change matching logic
publish candidate data
change auth/session behavior
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

## Next Planned Step

Proceed with:

```text
CPG-SEAFARER-008 — structured seafarer workspace review-status and operator visibility refinement
```

Recommended scope:

```text
make operator/team views display structured workspace and document-readiness metadata together
show which seafarer cards are complete or incomplete for review
keep user uploads protected
keep human review mandatory before matching or employer presentation
do not create automatic publication or matching decisions
```
