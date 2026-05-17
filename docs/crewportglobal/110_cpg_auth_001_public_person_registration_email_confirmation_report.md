# CPG-AUTH-001 - Public Person Registration Email Confirmation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Implementation report
- Status: Implemented for controlled runtime use

## 1. Purpose

This report records the first working implementation slice for the new registration/authentication/authorization model:

```text
Registration = create or confirm the physical person / user card.
Authentication = confirm access to the service account and contact channel.
Authorization = grant roles, visibility and right to act only after evidence and scoped relationship review.
```

The immediate product problem was that `/register/` accepted input but did not move the user into a real next step.

## 2. Implemented Scope

The public `/register/` page now submits the physical-person registration data to a backend endpoint:

```text
POST /api/v1/registration/person/request
```

The endpoint:

1. validates email, full name, phone, country and required consents;
2. creates or confirms the base `crewportglobal.users` record;
3. does not assign a seafarer, employer, company, vessel, operator or team role;
4. signs a time-limited email confirmation link;
5. sends the link through the protected SMTP configuration;
6. records a registration audit event without storing or exposing the confirmation token.

The confirmation link opens:

```text
/register/confirm/?token=...
```

The confirmation page calls:

```text
POST /api/v1/registration/person/confirm
```

The endpoint:

1. verifies the signed token;
2. checks expiration;
3. marks `crewportglobal.users.email_verified_at`;
4. creates or updates the `email` row in `crewportglobal.user_auth_identities`;
5. records `person_registration_email_confirmed`;
6. returns the next route:

```text
/register/next/
```

## 3. Sequential Registration Page

The new page:

```text
/register/next/
```

implements the standard presentation rule:

```text
first card: My tasks - always open
other cards: collapsed by default
```

The current tasks are:

1. email confirmation completed;
2. phone confirmation next;
3. work-path / capability-card request pending.

The page explains that seafarer workforce and employer-side request cards come after account authentication, while authorization and data visibility remain evidence-based.

## 4. SMTP And Secret Boundary

The implementation reuses the protected server-only SMTP configuration:

```text
/etc/crewportglobal/admin-access.env
```

The sender remains:

```text
not_reply@crewportglobal.com
```

New server-only runtime keys:

```text
CREWPORTGLOBAL_REGISTRATION_PUBLIC_FLOW_ENABLED
CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED
CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE
CREWPORTGLOBAL_REGISTRATION_SMTP_SEND_ENABLED
CREWPORTGLOBAL_REGISTRATION_LINK_SECRET
CREWPORTGLOBAL_PUBLIC_BASE_URL
```

The link secret must remain server-only. It must not be committed to GitHub, source files, tests, documentation examples, logs or browser code.

## 5. Security Boundaries

This slice does not implement:

```text
password login
long-lived account sessions
phone verification
role assignment
company authority approval
vessel authority approval
seafarer profile publication
employer vacancy request publication
admin/team access
payment
OpenClaw
nginx changes
```

The confirmation token is stateless, signed with a server-only secret and expires after 60 minutes.

The API response does not return the token or confirmation URL.

## 6. Changed Files

```text
projects/crewportglobal/app/backend/api/lib/registration_person_flow.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/tests/registration_person_flow_test.php
projects/crewportglobal/app/backend/api/README.md
projects/crewportglobal/public/register/index.html
projects/crewportglobal/public/register/confirm/index.html
projects/crewportglobal/public/register/next/index.html
tests/crewportglobal-register-routing.spec.ts
tests/crewportglobal-homepage-language.spec.ts
docs/crewportglobal/110_cpg_auth_001_public_person_registration_email_confirmation_report.md
docs/crewportglobal/00_documentation_register.md
```

## 7. Verification

Safe verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/registration_person_flow.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php projects/crewportglobal/app/backend/api/tests/registration_person_flow_test.php
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-homepage-language.spec.ts
git diff --check
```

Live verification confirmed:

1. `/register/` sends a confirmation link;
2. the confirmation endpoint accepts a valid signed token;
3. the user reaches `/register/next/`;
4. no old role-routing occurs from the public registration page;
5. secrets and tokens are not printed.

## 8. Next Recommended Work

Next slice:

```text
CPG-AUTH-002 - phone confirmation and first authenticated cabinet/session boundary
```

After that, CrewPortGlobal can implement the capability-card request flow for:

```text
seafarer workforce / supply
employer-side request / demand
```

without returning to the old public role-selection model.
