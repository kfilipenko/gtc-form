# CPG-AUTH-003 — Password Credential Registration, Login Session and Cabinet Access Foundation

- Project: CrewPortGlobal.com
- Document type: Implementation report
- Status: Implemented for review
- Date: 2026-05-18

## Purpose

This slice creates the first safe password-based user authentication foundation for CrewPortGlobal:

- password credential registration;
- password hash storage;
- user login;
- HttpOnly cookie session;
- logout and session revocation;
- current-user endpoint;
- authenticated `/cabinet/` access without `draft_id`;
- account menu transition from public `Account / Login` to authenticated profile entry.

## Current Schema Findings

Before implementation, the codebase had:

- `crewportglobal.users`;
- `crewportglobal.user_auth_identities`;
- `crewportglobal.user_roles`;
- registration draft routes;
- no password hash storage;
- no user credential table;
- no user session table;
- no `/api/v1/auth/login`;
- no `/api/v1/auth/logout`;
- no `/api/v1/auth/me`;
- no real account-menu login.

The current draft model uses `users.user_id` as `draft_id`, so the first safe bridge is:

```text
registered user -> password credential -> session -> draft/cabinet context
```

## Implemented Scope

### Database

Created migration:

```text
projects/crewportglobal/app/backend/db/migrations/008_create_user_credentials_sessions.sql
```

Tables:

```text
crewportglobal.user_credentials
crewportglobal.user_sessions
```

Security rules:

- raw password is never stored;
- only `password_hash` is stored;
- raw session token is never stored;
- only `session_token_hash` is stored;
- sessions support expiry and revocation;
- credential login email is unique case-insensitively.

### Backend API

Added:

```text
POST /api/v1/auth/register-password
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

`register-password` creates or confirms the user/draft, assigns the selected primary role, creates password credentials and issues a session cookie.

`login` verifies credentials with `password_verify`, returns a generic login error on failure and creates a new session on success.

`logout` revokes the current session and clears the cookie.

`auth/me` returns the current authenticated user and draft context without password hashes or raw session tokens.

### Frontend

Updated shared account menu:

```text
projects/crewportglobal/public/assets/crewportglobal-navigation.js
```

Unauthenticated state:

```text
Account / Login
  Registration
  Login
```

Authenticated state:

```text
Avatar / Profile entry
  My Cabinet
  Profile settings
  Logout
```

Updated `/register/` to collect:

- email/login;
- password;
- confirm password;
- full legal name;
- phone;
- country;
- primary capability selection;
- consent checks.

After successful registration the user receives a session and can open:

```text
/cabinet/
```

Updated `/cabinet/` context priority:

1. authenticated session;
2. `draft_id` URL;
3. local draft context;
4. no-context guidance.

## Security Boundaries

Implemented:

- `password_hash`;
- `password_verify`;
- generic invalid-login response;
- HttpOnly session cookie;
- SameSite=Lax cookie;
- session revocation on logout;
- no password hash in API responses;
- no raw session token in JSON;
- draft-id fallback preserved.

Not implemented in this slice:

- OAuth;
- e-mail verification enforcement;
- phone verification;
- password reset;
- CSRF token framework;
- rate-limit enforcement beyond failed-attempt counters;
- profile photo upload persistence;
- Stripe;
- OpenClaw;
- nginx/server config changes;
- deployment.

## Changed Files

```text
projects/crewportglobal/app/backend/api/lib/user_auth.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/README.md
projects/crewportglobal/app/backend/db/migrations/008_create_user_credentials_sessions.sql
projects/crewportglobal/public/assets/crewportglobal-app.css
projects/crewportglobal/public/assets/crewportglobal-docs.css
projects/crewportglobal/public/assets/crewportglobal-navigation.js
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/register/index.html
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
tests/crewportglobal-auth-password-session.spec.ts
tests/crewportglobal-cabinet-dashboard.spec.ts
tests/crewportglobal-navigation-menus.spec.ts
docs/crewportglobal/00_documentation_register.md
docs/crewportglobal/117_cpg_auth_003_password_credential_session_report.md
```

## Verification Performed

Required safe checks:

```bash
php -l projects/crewportglobal/app/backend/api/lib/user_auth.php              # passed
php -l projects/crewportglobal/app/backend/api/public/index.php               # passed
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db \
  psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/008_create_user_credentials_sessions.sql # passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-password-session.spec.ts # 2 passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts     # 5 passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts    # 3 passed
npm run test:cpg-api                                                                                         # 15 passed
node projects/crewportglobal/scripts/check_public_i18n.js                                                    # passed with existing non-English fallback warnings
git diff --check                                                                                             # passed
```

A parallel attempt to start two UI Playwright suites at the same time hit a Postgres `tuple concurrently updated` migration-start race. The suites were rerun sequentially and passed.

## Next Recommended Step

CPG-AUTH-004 should add e-mail verification enforcement and phone verification planning without breaking the new password-session foundation.
