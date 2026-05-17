# CPG-AUTH-002 - Authorization Request Cards Frontend Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Implementation report
- Status: Frontend-only draft implemented

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

A new public frontend page was added:

```text
/register/authorization/
```

The page is reached from:

```text
/register/next/
```

after the user confirms the service-account email and continues the registration sequence.

The page allows a physical person to request one or more authorization cards:

```text
1. Seafarer / Specialist
2. Buyer / Employer
```

The selection is multiple by design because one physical person is not equal to one role. A person may later have several confirmed capabilities attached to the same physical-person record.

## 3. Return-To-Authorization Rule

The authorization page is designed so the user can return later and update requested cards when status, work direction or business activity changes.

Current frontend storage:

```text
localStorage key: crewportglobal.authorization.requests
```

The saved draft records:

```text
person_id
email
registration_state
phone_verification_state = to_be_configured
authorization_state = requested_not_granted
cards[]
updated_at
```

This is only a browser-side draft until backend persistence is approved.

## 4. Presentation Standard

The page follows the BP-006 / BP-007 card presentation rule:

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

## 5. Authorization Boundary

Saving cards does not grant:

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

## 6. Changed Files

```text
projects/crewportglobal/public/register/next/index.html
projects/crewportglobal/public/register/authorization/index.html
tests/crewportglobal-register-routing.spec.ts
docs/crewportglobal/111_cpg_auth_002_authorization_request_cards_frontend_report.md
docs/crewportglobal/00_documentation_register.md
```

## 7. Verification Performed

Safe verification performed:

```bash
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-homepage-language.spec.ts
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/registration_person_flow.php
php projects/crewportglobal/app/backend/api/tests/registration_person_flow_test.php
git diff --check
```

Live verification confirmed:

1. `/register/next/` links to `/register/authorization/`;
2. `/register/authorization/` opens directly;
3. `My tasks` is open by default;
4. all other authorization cards are collapsed by default;
5. both Seafarer / Specialist and Buyer / Employer can be selected together;
6. phone verification is displayed as a future item to configure;
7. saving a draft does not grant roles, groups or visibility.

Public static deployment backup:

```text
/var/www/backups/crewportglobal.com/public_sync_20260517_151155_authorization_cards
```

## 8. Next Recommended Work

Next implementation slice:

```text
CPG-AUTH-003 - backend persistence for authorization-card requests and phone verification planning
```

The backend slice should store authorization-card requests against the physical-person record without granting permissions automatically.
