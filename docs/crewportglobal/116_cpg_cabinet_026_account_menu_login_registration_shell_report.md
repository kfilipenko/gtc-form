# CrewPortGlobal — CPG-CABINET-026 Account Menu, Login and Registration Shell Report

- Project: CrewPortGlobal.com
- Issue: #18 — CPG-CABINET-026
- Date: 2026-05-18
- Author: GTC IT / AI Assistant
- Status: Implemented as Path B UX shell for Project Owner review
- Scope: Frontend account area, registration/login separation, cabinet identity placeholder and tests

## 1. Purpose

This document records the CPG-CABINET-026 implementation slice.

The goal was to replace the combined public navigation item:

```text
Login / Register
```

with a standard account area in the top-right header:

```text
Account / Login
```

The account area separates two procedures:

```text
Registration -> existing physical person / registration draft flow
Login -> future password login flow
```

## 2. Required Auth Check Before Implementation

The codebase was checked before choosing the implementation path.

Findings:

```text
password field: not present
password_hash field: not present
public login endpoint: not present
public user session cookie/token: not present
user account table suitable for login: partially present, but no password credential state
draft-to-user relationship: present, current draft_id maps to crewportglobal.users.user_id
admin session model: present only for protected admin access flow, not public user login
```

Evidence:

```text
projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql
projects/crewportglobal/app/backend/db/README.md
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/lib/registration_person_flow.php
```

The database README still explicitly lists:

```text
password hashing
login sessions
```

as out of scope for the registration foundation.

## 3. Path Decision

Path B was selected.

Reason:

```text
Password login cannot be safely implemented yet because the public account model has no password hash, password reset, login endpoint, user session cookie/token, logout flow or /api/v1/me context.
```

The implementation does not fake login.

## 4. Implemented Scope

Updated:

```text
projects/crewportglobal/public/assets/crewportglobal-navigation.js
projects/crewportglobal/public/assets/crewportglobal-docs.css
projects/crewportglobal/public/assets/crewportglobal-app.css
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
projects/crewportglobal/public/cabinet/index.html
tests/crewportglobal-navigation-menus.spec.ts
tests/crewportglobal-cabinet-dashboard.spec.ts
docs/crewportglobal/00_documentation_register.md
```

Created:

```text
docs/crewportglobal/116_cpg_cabinet_026_account_menu_login_registration_shell_report.md
```

## 5. Account Area Behavior

Before public login exists, the header shows:

```text
Account / Login
```

No avatar is shown for unauthenticated users.

The dropdown contains:

```text
Registration
Login
Current cabinet, only when a local registration draft_id exists
```

Registration:

```text
opens /register/
uses the existing registration procedure
does not grant roles, groups or data visibility by itself
```

Login:

```text
opens a compact password-login shell
shows that password login is not enabled yet
does not submit credentials
does not create fake session state
does not show avatar/profile entry
```

## 6. Navigation Change

The main public Application menu no longer includes:

```text
Login / Register
```

The Application menu now remains navigation-only:

```text
Home
Vacancies
Documents
```

Document pages and operator public app menu use the same simplified public application target list.

## 7. Cabinet Identity Placeholder

The `/cabinet/` page now includes a user identity block in User summary:

```text
avatar placeholder
full name
email/login
current capability/role
profile photo placeholder
```

Persistent profile photo upload is deferred.

If implemented later, profile photo storage must use protected upload rules:

```text
JPG/JPEG, PNG, WEBP
max 5 MB
ClamAV scan
no public URL
no storage_path exposure
```

## 8. Internationalization

Account visible texts were added to the shared public i18n runtime:

```text
account.entry
account.register
account.login
account.currentCabinet
account.loginUnavailableTitle
account.loginUnavailableCopy
account.email
account.password
```

English canonical source is present.

Russian account strings are present.

Portuguese account strings are present as a partial existing-runtime continuation.

## 9. Verification

Commands run:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
node projects/crewportglobal/scripts/check_public_i18n.js
```

Results:

```text
navigation menus test: 5 passed
cabinet dashboard test: 3 passed
public i18n validator: passed
```

One parallel Playwright attempt for cabinet initially failed because both test commands tried to start the same local web server port at the same time. The cabinet test was then re-run separately and passed.

## 10. Boundary Confirmation

Not implemented:

```text
password hash storage
password login endpoint
password reset
public user session cookie/token
/api/v1/me cabinet context
real logout for public users
avatar after real login
persistent profile photo upload
email notifications
Stripe
OpenClaw
nginx/server configuration
deployment
```

Backend and database were not changed in this slice.

No fake login state was introduced.

## 11. Remaining Requirements for Path A

To implement real login safely, the next auth slice must define and test:

```text
password_hash or credential table;
password creation/reset policy;
POST /api/v1/auth/login;
POST /api/v1/auth/logout;
GET /api/v1/me;
secure session cookie or token;
CSRF / same-site cookie policy;
session expiry and revocation;
cabinet context assembled from authenticated user_id;
avatar/profile entry after real session;
audit events for login/logout/session revoke.
```

## 12. Final Recommendation

The account menu UX shell is ready for Project Owner review.

Recommended next implementation step:

```text
CPG-AUTH-003 — Public password credential and account session foundation.
```

That slice should implement real credentials and session context before changing the account area from Path B to Path A.
