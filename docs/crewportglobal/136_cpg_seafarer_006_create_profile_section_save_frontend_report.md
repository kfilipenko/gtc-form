# CPG-SEAFARER-006 — Create Profile Section Save Frontend Report

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Date: 2026-05-19
- Status: Completed for Project Owner review

## Purpose

This slice connects the public `/create-profile/` seafarer workspace cards to the section-level backend API created in CPG-SEAFARER-005.

The goal is to let the user save one practical card at a time instead of relying only on the full draft save button.

## Implemented Scope

Updated:

```text
projects/crewportglobal/public/create-profile/index.html
tests/crewportglobal-seafarer-workspace-form.spec.ts
```

The following workspace cards now include a local `Save section` action:

```text
Personal contact and addresses
Certificates and education
Last sea service
Matching publication request
```

The buttons call:

```text
PATCH /api/v1/seafarer/workspace/sections/{section}
```

with the current `draft_id` fallback context.

## Section Mapping

The frontend saves:

```text
Personal contact and addresses -> personal_details + contact_and_addresses
Certificates and education -> qualifications
Last sea service -> sea_service
Matching publication request -> matching_publication
```

The combined contact card skips empty sub-sections so a user can save contact data even when optional personal details are not yet filled.

## User Experience

Each card now has:

```text
Save section
section-level saving status
section-level saved/error feedback
draft-first guard when no draft_id is available
English and Russian i18n keys
```

If no draft exists yet, the page tells the user to save the draft first. This keeps the existing draft creation flow intact and avoids silently creating new users from a partial card save.

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

The focused frontend test confirmed:

```text
the seafarer draft can still be saved through the full form
the contact card can then be saved independently through the section endpoint
the section save shows a local success message
the structured workspace API reflects the updated section value
the cabinet structured workspace view reflects the latest section save
existing cabinet document-correction flows still pass
existing employer cabinet flow still passes
```

## Boundaries

This slice does not:

```text
create a new database migration
change backend authorization or sessions
change document upload rules
publish seafarer candidate data
change matching logic
create employer-side section saves
change Stripe
change OpenClaw
change nginx/server config
perform deployment
```

## Next Planned Step

Proceed with:

```text
CPG-SEAFARER-007 — backend read/write contract for document metadata and upload readiness card
```

Recommended scope:

```text
separate document-readiness metadata from uploaded document files
prepare card-level save behavior for passport/medical/visa/readiness notes
preserve protected upload and ClamAV flow
keep user-facing correction tasks visible
do not introduce public document downloads
```
