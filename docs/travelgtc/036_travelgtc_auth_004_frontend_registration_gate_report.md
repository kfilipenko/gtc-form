# TRAVELGTC-AUTH-004 - Frontend Registration Gate And Authenticated Lead Form Report

- Project: TravelGTC
- Source task: `docs/travelgtc/035_travelgtc_auth_004_frontend_registration_gate_task.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented, local/test verified

## 1. Purpose

This report records the frontend implementation that separates TravelGTC account registration from the user's travel-need form while making lead creation an authenticated CRM event.

## 2. Implemented Behavior

Public browsing remains open.

Lead/contact form submission now works as follows:

```text
anonymous visitor clicks submit
frontend saves non-sensitive travel-idea fields
visitor is redirected to /auth/?mode=register&next=...
visitor registers or logs in to a TravelGTC-local account
visitor returns to the original form
form shows logged-in account context
lead is submitted to POST /api/travelgtc/v1/account/leads
```

The public `POST /api/travelgtc/v1/public/leads` endpoint is no longer used by the public site JavaScript.

## 3. Frontend Changes

Added:

1. `/auth/` page with:
   - TravelGTC registration form;
   - TravelGTC login form;
   - identity consent text;
   - local project boundary explanation;
2. header auth controls on all public routes:
   - `Войти`;
   - `Регистрация`;
   - logged-in display name;
   - `Выйти`;
3. shared frontend auth state loader through `GET /api/travelgtc/v1/auth/me`;
4. `credentials: "include"` API calls for cookie session support;
5. auth gate note inside TravelGTC lead forms;
6. safe draft restore for non-sensitive travel-idea fields after registration;
7. authenticated lead submission to `account/leads`;
8. responsive CSS for the auth page and compact header account controls.

## 4. Backend/Test Runtime Changes

Changed Fastify CORS settings:

```text
credentials: true
```

Reason: local browser tests use static site port `4174` and API port `4302`; the session cookie must be accepted by browser fetch calls with credentials.

Changed funnel test server environment:

```text
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
```

This matches the new rule that public forms create CRM leads only after TravelGTC authentication.

## 5. Files Changed

Main files:

```text
projects/travelgtc/public/auth/index.html
projects/travelgtc/public/assets/js/site.js
projects/travelgtc/public/assets/css/site.css
projects/travelgtc/public/index.html
projects/travelgtc/public/travel-lifestyle/index.html
projects/travelgtc/public/club/index.html
projects/travelgtc/public/create-trip/index.html
projects/travelgtc/public/business-model/index.html
projects/travelgtc/public/events/index.html
projects/travelgtc/public/about/index.html
projects/travelgtc/public/contacts/index.html
projects/travelgtc/app/src/server/createApp.ts
projects/travelgtc/scripts/start_funnel_test_servers.sh
tests/travelgtc-funnel.spec.ts
tests/travelgtc-responsive.spec.ts
```

Documentation:

```text
docs/travelgtc/035_travelgtc_auth_004_frontend_registration_gate_task.md
docs/travelgtc/036_travelgtc_auth_004_frontend_registration_gate_report.md
docs/travelgtc/00_documentation_register.md
docs/travelgtc/05_project_memory_handoff.md
```

## 6. Verification

Commands run:

```bash
node --check projects/travelgtc/public/assets/js/site.js
bash -n projects/travelgtc/scripts/start_funnel_test_servers.sh
npm --prefix projects/travelgtc/app run build
npm run check:travelgtc-api
npm run test:travelgtc-funnel
npm run test:travelgtc
```

Results:

```text
PASS: JS syntax check.
PASS: funnel test server shell syntax check.
PASS: TravelGTC app TypeScript build.
PASS: API check: 15 tests passed in 2 files.
PASS: authenticated funnel Playwright test: 1 passed.
PASS: responsive Playwright tests: 13 passed, including /auth/.
PASS: mobile home screenshot visually reviewed after header/auth changes.
```

Verification note:

```text
The app package has no npm script named typecheck. The supported build/type verification command is npm --prefix projects/travelgtc/app run build.
```

## 7. Publication State

This task is local/test verified but not sufficient for live API use.

Before switching the live site to real form processing:

1. apply database migrations to a safe TravelGTC database;
2. configure production environment variables;
3. run the API as a service;
4. configure nginx `/api/travelgtc/` proxy;
5. confirm HTTPS cookie behavior on `travelgtc.com`;
6. approve privacy/consent/disclosure pages;
7. explicitly enable:

```text
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
```

## 8. Next Step

Recommended next implementation task:

```text
TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy
```

Then continue:

```text
TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation report |
