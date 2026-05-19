# CPG-SEAFARER-004 — Cabinet Seafarer Completeness Tasks Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice turns incomplete structured seafarer workspace records into clear user tasks in the personal cabinet.

The cabinet should not merely show saved data. It should tell the seafarer what needs action and where to continue.

## Implemented Scope

Updated:

```text
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/create-profile/index.html
tests/crewportglobal-seafarer-workspace-form.spec.ts
```

The `My tasks` card now derives additional seafarer tasks from structured workspace data when the user has started the expanded seafarer workspace but required sections remain incomplete.

## Task Rules

The cabinet can now show tasks for:

```text
missing personal/contact details or emergency contact
missing certificate / qualification and training details
missing latest sea-service record
missing candidate summary or data-processing confirmation for reviewed matching
```

The existing task-first rule remains unchanged:

```text
My tasks is first and always expanded.
Other cards are collapsed by default.
```

## Navigation Behavior

Each completeness task includes:

```text
Open section
```

The link points to the relevant `/create-profile/` section with:

```text
draft_id
section hash
```

Example:

```text
/create-profile/?draft_id={draft_id}#profile-section-contact
```

The create-profile page now opens the matching collapsible section when a section hash is present.

## Boundaries

This slice does not:

```text
publish candidate data
change matching logic
change backend schema
change upload rules
change document review
change auth/session behavior
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

The tasks are frontend-derived from the current structured workspace summary. A future backend task engine can later persist these as formal workflow tasks.

## Verification Performed

Executed:

```text
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Result:

```text
whitespace check passed
5 Playwright tests passed
```

The focused test confirmed:

```text
partial structured seafarer workspace creates completeness tasks
task count includes completeness tasks and document task
task copy is visible in My tasks
Open section link points to the intended create-profile section
create-profile opens the target collapsible section from the URL hash
existing seafarer document-correction cabinet flow still passes
existing employer cabinet flow still passes
```

## Next Recommended Step

Proceed with:

```text
CPG-SEAFARER-005 — structured seafarer workspace edit/read API contract
```

Recommended scope:

```text
define stable backend read/update contract per structured section
prepare section-level save behavior
preserve current draft flow as fallback
do not publish or match automatically
```
