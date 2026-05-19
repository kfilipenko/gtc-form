# CPG-SEAFARER-011 — Operator Per-Card Review Actions Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice adds operator actions for individual structured seafarer workspace cards.

The goal is to let the team review a selected card without treating that action as full seafarer profile approval or candidate publication.

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

Added protected operator endpoint:

```text
PATCH /api/v1/operator/seafarer-workspace-cards/{draft_id}/review
```

Payload:

```json
{
  "card_code": "qualifications",
  "decision": "start_review",
  "note": "Optional note"
}
```

Allowed decisions:

```text
start_review -> under_review
needs_correction -> correction_requested
reviewed -> verified
```

For `needs_correction`, a note is required.

The endpoint:

```text
requires operator access;
requires a seafarer draft/user;
requires a known card code;
updates persisted card review state;
updates structured record review_status where records exist;
writes audit events;
does not approve the full profile;
does not publish candidate data.
```

Audit events:

```text
seafarer_workspace_card_review_state_updated
operator_seafarer_workspace_card_review_recorded
```

## Operator UI Behavior

The `/verify/` page now supports selected-card actions:

```text
Start card review
Card needs correction
Verify card
```

These actions use the existing review-target selector and update only the selected seafarer workspace card.

The operator detail checklist also has a card status filter:

```text
all
pending_human_review
under_review
correction_requested
verified
```

The filter affects the review-readiness card list in the selected item detail panel.

## Cabinet Behavior

The `/cabinet/` card-level task derivation now also reads persisted card review states directly.

If an operator uses the per-card endpoint to request correction without changing the full profile status, the cabinet can still show:

```text
Action required: correct seafarer card
Target card
Reason
Open card
```

## Boundaries

Per-card review actions do not:

```text
approve the full seafarer profile;
publish a seafarer candidate;
make matching decisions;
create employer-visible candidate recommendations;
change document storage;
change ClamAV scanning;
change auth/session behavior;
change Stripe;
change OpenClaw;
change nginx/server config;
perform deployment.
```

## Verification Performed

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
```

Prepared focused Playwright coverage:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

This focused browser/API test requires local PostgreSQL access through the Playwright web server. In the current sandbox it was not executed because local socket creation for PostgreSQL is restricted. It should be run on GTC1 outside the sandbox or through the approved local test runner.

Expected verification coverage:

```text
operator can start review for a selected seafarer workspace card
operator detail checklist shows under_review card state
operator can request correction for a selected card
operator detail checklist shows correction_requested card state
card status filter narrows the review-readiness checklist
cabinet can derive a correction task from persisted card state
full profile decision path remains separate
```

## Next Planned Step

Proceed with:

```text
CPG-SEAFARER-012 — card-level verified readiness summary and full-profile approval guard
```

Recommended scope:

```text
show which workspace cards are verified, pending or blocked;
prevent full profile approval when required cards are still correction_requested;
keep final publication and matching as separate future human-review stages.
```
