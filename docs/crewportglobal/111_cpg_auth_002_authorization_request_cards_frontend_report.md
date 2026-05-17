# CPG-AUTH-002 - Authorization Request Cards Frontend Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Implementation report
- Status: Frontend-only selection and separate form pages implemented

## 1. Purpose

This report records the next implementation slice after physical-person registration and email authentication.

The target model remains:

```text
Registration = create the physical person / user card.
Authentication = confirm access to the service account and correctness of contact channels.
Authorization = grant powers, roles, visibility and right to act only on proven evidence and scoped relationship.
```

Phone verification is not implemented in this slice. It is explicitly marked as:

```text
следует настроить
```

and must be handled in a later authentication stage.

## 2. Implemented Scope

A public frontend selection page was added:

```text
/register/authorization/
```

The page is reached from:

```text
/register/next/
```

after the user confirms the service-account email and continues the registration sequence.

The page now only allows a physical person to choose one or more authorization forms:

```text
1. Seafarer / Specialist
2. Buyer / Employer
```

The detailed form fields were removed from `/register/authorization/`. The selection step routes the user to the selected form page or to the selected-forms hub:

```text
/register/authorization/selected/
/register/authorization/seafarer-specialist/
/register/authorization/buyer-employer/
```

The selection is multiple by design because one physical person is not equal to one role. A person may later have several confirmed capabilities attached to the same physical-person record.

## 3. Return-To-Authorization Rule

The authorization page is designed so the user can return later and update requested cards when status, work direction or business activity changes.

Current frontend storage for selection:

```text
localStorage key: crewportglobal.authorization.selectedCards
```

Current frontend storage for request status compatibility:

```text
localStorage key: crewportglobal.authorization.requests
```

The saved draft records:

```text
person_id
email
registration_state
phone_verification_state = to_be_configured
authorization_state = forms_selected_not_submitted
selected_cards[]
updated_at
```

Separate form drafts are saved under:

```text
crewportglobal.authorization.form.seafarerSpecialist
crewportglobal.authorization.form.buyerEmployer
```

These are only browser-side drafts until backend persistence and file storage are approved.

## 4. Presentation Standard

The selection page and each separate form page follow the BP-006 / BP-007 card presentation rule:

```text
first card: My tasks - always open
all other cards: collapsed by default
```

The first card shows:

```text
email authentication: done
phone confirmation: should be configured
authorization-card selection: current task
```

The detailed form pages keep the actual data-entry fields outside the selection page.

## 5. Authorization Boundary

Choosing forms or saving form drafts does not grant:

```text
roles
group membership
company visibility
vessel visibility
client visibility
candidate publication
buyer-side action rights
operator access
```

Actual authorization still requires evidence review and scoped relationship checks.

## 6. Separate Forms

The Seafarer / Specialist form captures:

```text
rank / specialty
department
nationality
residence country
availability date
expected compensation
preferred / accepted vessel types
relevant experience
working languages
document readiness
professional note
passport / ID metadata
seaman's book metadata
certificates / CoC / STCW metadata
medical certificate metadata
maritime CV metadata
other evidence metadata
```

The Buyer / Employer form captures:

```text
company / buyer name
company country
company website
representative position
authority basis
buyer-side type
crew request status
vessel / fleet context
requested ranks / crew demand
expected timeline
buyer-side note
company registration / license metadata
authorization letter / POA metadata
representative ID metadata
vessel / management evidence metadata
crew request / service brief metadata
other evidence metadata
```

File inputs are present for the user workflow, but no file is uploaded to the server in this slice. The browser stores document metadata only.

## 7. Changed Files

```text
projects/crewportglobal/public/assets/crewportglobal-authz.css
projects/crewportglobal/public/register/authorization/index.html
projects/crewportglobal/public/register/authorization/selected/index.html
projects/crewportglobal/public/register/authorization/seafarer-specialist/index.html
projects/crewportglobal/public/register/authorization/buyer-employer/index.html
tests/crewportglobal-register-routing.spec.ts
docs/crewportglobal/111_cpg_auth_002_authorization_request_cards_frontend_report.md
docs/crewportglobal/00_documentation_register.md
```

## 8. Verification Performed

Safe verification performed:

```bash
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-register-routing.spec.ts
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/registration_person_flow.php
php projects/crewportglobal/app/backend/api/tests/registration_person_flow_test.php
git diff --check
```

Live verification confirmed:

1. `/register/next/` links to `/register/authorization/`;
2. `/register/authorization/` opens directly;
3. `/register/authorization/` contains selection only and no embedded form fields;
4. both Seafarer / Specialist and Buyer / Employer can be selected together;
5. multiple selection routes to `/register/authorization/selected/`;
6. each detailed form opens on its own page;
7. document upload controls exist on each detailed form;
8. saving drafts does not grant roles, groups or visibility.

Public static deployment backup:

```text
/var/www/backups/crewportglobal.com/public_sync_20260517_151155_authorization_cards
/var/www/backups/crewportglobal.com/public_sync_20260517_160735_authorization_separate_forms
```

## 9. Next Recommended Work

Next implementation slice:

```text
CPG-AUTH-003 - backend persistence for authorization-card requests and phone verification planning
```

The backend slice should store authorization-card requests against the physical-person record without granting permissions automatically.
