# CPG-SEAFARER-011-TESTS — Operator Per-Card Review Actions Test Report

- Project: CrewPortGlobal.com
- Document type: Verification report
- Date: 2026-05-19
- Status: Completed

## Purpose

This report closes the test debt for `CPG-SEAFARER-011`.

The previous implementation report documented prepared tests. This report records that the required tests were actually executed on GTC1 with local PostgreSQL access.

## Tested Scope

Verified:

```text
PATCH /api/v1/operator/seafarer-workspace-cards/{draft_id}/review
Start card review
Card needs correction
Verify card
card status filters
cabinet task from persisted card state
operator review queue compatibility
existing cabinet document-correction workflow
```

## Commands Executed

```bash
cd /var/www/gtc-form
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

The first attempt to run Playwright inside the Codex sandbox failed because PostgreSQL socket creation was blocked by the sandbox. The same test commands were then executed on GTC1 outside the sandbox with local PostgreSQL access.

## Results

```text
php -l:
  passed

git diff --check:
  passed

npm run test:cpg-api:
  15 passed

npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts:
  7 passed
```

No failed tests remained after the GTC1 execution.

## API Verification

Confirmed by focused and API test coverage:

```text
start_review updates selected card to under_review
needs_correction with note updates selected card to correction_requested
needs_correction without note returns validation error
reviewed updates selected card to verified
invalid payloads are rejected with 4xx
operator access token is required for operator endpoints
```

The existing API suite also confirms that registration, upload, document review and operator review flows still work after the per-card review implementation.

## DB Verification

The executed tests used the GTC1 PostgreSQL-backed Playwright web server and confirmed persisted state through API readback from the database-backed application.

Confirmed persisted behavior:

```text
seafarer_profiles.document_metadata.seafarer_workspace_card_reviews stores card review state
seafarer_review_readiness exposes persisted review_status
structured workspace records reflect target-card review_status where rows exist
operator audit/history remains compatible with existing review queue behavior
```

## UI Verification

Confirmed:

```text
/verify/ renders submitted review items
operator can select a review target card
Start card review shows under_review
Card needs correction shows correction_requested
card status filter narrows the readiness checklist
/cabinet/ shows card correction task from operator review
/cabinet/ shows card correction task from persisted card review state without full-profile rejection
existing employer-side cabinet correction task remains working
```

## Cabinet Task Verification

Confirmed:

```text
persisted card state with correction_requested + review_note creates a My tasks action
task shows target card and reason
task links user back to the appropriate create-profile section
existing document replacement task behavior remains working
```

## Boundaries

This verification did not introduce new runtime behavior.

No changes were made to:

```text
production deployment
database migrations
candidate publication
matching decisions
protected document storage
ClamAV scanning
auth/session model
Stripe
OpenClaw
nginx/server config
```

## Remaining Risks

```text
full-profile approval guard is still not implemented;
per-card verification does not yet compute a final readiness summary;
operator filtering is UI-level for readiness cards and does not yet create a dedicated card-review queue.
```

## Final Recommendation

`CPG-SEAFARER-011` can now be treated as a completed implementation slice with executed tests on GTC1.

Proceed to the next implementation slice only after this report is committed.

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
