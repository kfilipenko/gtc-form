# CPG-SEAFARER-010 — Workspace Card Review-State Persistence Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice persists card-level review state for the structured seafarer workspace.

The goal is to make operator decisions on a specific seafarer card visible as a durable card state, not only as the latest operator history event.

## Implemented Scope

Updated:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/cabinet/index.html
tests/crewportglobal-operator-queue.spec.ts
tests/crewportglobal-cabinet-dashboard.spec.ts
docs/crewportglobal/00_documentation_register.md
```

## Backend Behavior

Added card-level review state persistence under:

```text
seafarer_profiles.document_metadata.seafarer_workspace_card_reviews
```

Each state stores:

```text
card_code
card_name
review_status
review_note
review_decision
review_updated_at
source
```

When the operator records a card-targeted seafarer profile decision:

```text
start_review -> under_review
needs_correction -> correction_requested
reviewed -> verified
```

the selected card state is persisted and returned through:

```text
seafarer_workspace_structured.card_review_states
seafarer_review_readiness
```

Structured workspace record tables are also updated where applicable:

```text
personal_contact -> person details and emergency contacts
qualifications -> education, certificates and training records
sea_service -> sea-service records
matching_publication -> matching preferences
document_readiness -> medical declarations where present
```

## User Resubmission Behavior

When the user saves a corrected workspace section, the relevant card state becomes:

```text
review_status = pending_human_review
review_decision = user_resubmitted
```

This removes the active card-level correction task from the cabinet and leaves the card waiting for team review.

Document readiness save uses the same rule for the `document_readiness` card.

## Operator UI Behavior

The `/verify/` review target selector can now be used for any operator decision, not only `needs_correction`.

The review-readiness checklist shows persisted card review state and review note when available.

## User Cabinet Behavior

The `/cabinet/` card-level correction task now checks the persisted card state.

If the latest operator note requested correction but the user has already resubmitted the target card, the task is no longer shown as active.

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Expected verification coverage:

```text
operator card-targeted correction persists card review state
operator detail checklist shows persisted review state
cabinet shows card correction task while state is correction_requested
user section resubmission changes card state to pending_human_review
cabinet hides the card correction task after resubmission
structured record review_status is updated for the target card where rows exist
```

## Boundaries

This slice does not:

```text
create a separate persisted user task table
create final card approval workflow pages
publish seafarer data
make automatic matching decisions
change protected document storage
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
CPG-SEAFARER-011 — operator per-card review actions and status filters
```

Recommended scope:

```text
let the operator start/review/verify individual seafarer workspace cards directly from the structured detail checklist
add per-card status filters to the operator view
keep full profile approval as a separate human-review decision
preserve no-publication and no-automatic-matching boundaries
```
