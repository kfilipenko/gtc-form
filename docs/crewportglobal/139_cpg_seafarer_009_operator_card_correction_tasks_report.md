# CPG-SEAFARER-009 — Operator Card Correction Tasks Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice turns operator correction notes for seafarer profiles into card-level user tasks.

The goal is to let the team request correction for a specific seafarer workspace card and let the user open the exact card that needs work.

## Implemented Scope

Updated:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/create-profile/index.html
tests/crewportglobal-registration-api.spec.ts
tests/crewportglobal-operator-queue.spec.ts
tests/crewportglobal-cabinet-dashboard.spec.ts
```

## Backend Behavior

The operator review decision endpoint now accepts:

```json
{
  "decision": "needs_correction",
  "note": "Correction reason",
  "correction_card_code": "qualifications"
}
```

Allowed seafarer correction card codes:

```text
personal_contact
qualifications
sea_service
matching_publication
document_readiness
```

The audit event `operator_review_decision_recorded` now stores:

```text
correction_card_code
correction_card_name
```

Draft detail responses and operator review history expose these fields safely as review metadata.

## Operator UI Behavior

The `/verify/` detail panel now includes a correction-target selector.

When the selected review item has seafarer readiness cards, the selector is populated from:

```text
seafarer_review_readiness
```

For `needs_correction`, the selected card code is sent with the review note and appears in:

```text
latest review note
review history
raw API payload
```

## User Cabinet Behavior

The `/cabinet/` page now derives a user task from the latest seafarer profile operator review when:

```text
decision = needs_correction
new_status = rejected
queue_type = seafarer_profile
review_note is present
```

The task shows:

```text
Action required: correct seafarer card
Target card
Reason
Open card
```

Card links route to the correct `/create-profile/` section:

```text
personal_contact -> #profile-section-contact
qualifications -> #profile-section-qualifications
sea_service -> #profile-section-sea-service
matching_publication -> #profile-section-publication
document_readiness -> #profile-section-documents
```

## Create Profile Behavior

The `/create-profile/` review status line now includes the correction target when the latest operator review specifies a seafarer card.

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Expected verification coverage:

```text
operator queue UI sends correction_card_code with needs_correction
operator history shows the selected target card
cabinet shows a card-level correction task
cabinet Open card link targets the correct create-profile section
existing document correction tasks still work
```

## Boundaries

This slice does not:

```text
create a persisted task table
change final approval rules
publish seafarer data
make automatic matching decisions
change protected file storage
change ClamAV scanning
change auth/session behavior
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

## Next Planned Step

Proceed with:

```text
CPG-SEAFARER-010 — seafarer workspace card review-state persistence
```

Recommended scope:

```text
store card-level review states in structured seafarer workspace tables
show per-card status in user cabinet and operator detail
preserve human-review-only approval
avoid automatic publication or matching decisions
```
