# CPG-SEAFARER-003 — Cabinet Structured Seafarer Workspace View Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice exposes the structured seafarer workspace records in the user personal cabinet.

The goal is to let a seafarer see the structured data that was saved from the expanded `/create-profile/` form and synchronized into the normalized seafarer workspace tables.

## Implemented Scope

Updated:

```text
projects/crewportglobal/public/cabinet/index.html
```

Added a new cabinet card:

```text
Seafarer workspace
```

The card is shown only when the current cabinet context belongs to a seafarer draft/account.

## Card Behavior

The cabinet continues to follow the standard workbench rule:

```text
My tasks is first and always expanded.
All other cabinet cards are collapsed by default.
```

The new `Seafarer workspace` card is also collapsed by default and expands only when the user clicks its header.

## Data Source

The cabinet reads structured workspace data in this order:

```text
1. draft payload: payload.seafarer_workspace_structured
2. fallback endpoint: GET /api/v1/seafarer/workspace
3. fallback endpoint with draft_id: GET /api/v1/seafarer/workspace?draft_id={draft_id}
```

If the structured schema is not available, the cabinet shows a controlled empty state and does not break the existing JSON-based draft behavior.

## Sections Displayed

The cabinet can display:

```text
personal and contact details
emergency contact
education
certificates
training
sea service
medical declarations
matching preferences
```

Empty sections are not rendered, keeping the cabinet compact.

## Internationalization

All new visible text was added through page i18n keys in:

```text
English
Russian
```

The existing English fallback behavior is preserved.

## Verification Performed

Executed:

```text
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Result:

```text
whitespace check passed
4 Playwright tests passed
```

The focused test confirmed:

```text
the Seafarer workspace card is visible for a seafarer cabinet
the card is collapsed by default
the card expands on header click
structured personal/contact data is displayed
structured emergency contact is displayed
structured certificate data is displayed
structured training records are displayed
structured sea-service data is displayed
structured matching preferences are displayed
existing cabinet document correction flows still pass
employer cabinet flow still passes
```

## Boundaries

Not changed in this slice:

```text
database schema
backend write logic
document upload endpoints
operator review UI
candidate publication
matching algorithm
auth/session model
Stripe
OpenClaw
nginx/server config
deployment
```

## Next Recommended Step

Proceed with:

```text
CPG-SEAFARER-004 — seafarer cabinet completeness tasks
```

Recommended scope:

```text
derive missing-data tasks from structured seafarer records
show clear actions in My tasks
link each missing-data task to the correct /create-profile/ section
keep publication disabled until human review and explicit approval
```
