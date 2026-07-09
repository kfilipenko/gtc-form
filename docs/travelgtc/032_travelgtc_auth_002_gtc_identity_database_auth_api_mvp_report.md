# TRAVELGTC-AUTH-002 - GTC Identity Database And Auth API MVP Report

- Project: TravelGTC
- Source task: `docs/travelgtc/031_travelgtc_auth_002_gtc_identity_database_auth_api_mvp_task.md`
- Source specification: `docs/travelgtc/030_travelgtc_auth_001_gtc_identity_registration_gate_spec.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Superseded by `TRAVELGTC-AUTH-003 - Project-Local Registration Isolation`

## Supersession Notice

This report is historical. The shared `gtc_identity` schema and optional CrewPortGlobal identity/credential backfill described below were removed in `TRAVELGTC-AUTH-003`.

Active implementation:

```text
travelgtc_identity
projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql
```

## 1. Purpose

This report records the first TravelGTC authentication implementation for shared GTC identity, sessions and authenticated lead submission.

## 2. Implementation Summary

Implemented:

1. `gtc_identity` PostgreSQL migration:
   - users;
   - auth identities;
   - credentials;
   - sessions;
   - email verification tokens;
   - project memberships;
   - project roles;
   - consents;
   - audit events.
2. TravelGTC table linkage to shared identity:
   - `travelgtc_contacts.user_id`;
   - `travelgtc_leads.user_id`;
   - `travelgtc_travel_ideas.created_by_user_id`;
   - `travelgtc_interactions.actor_user_id`;
   - `travelgtc_audit_log.actor_user_id`.
3. Optional CrewPortGlobal compatibility backfill:
   - copies only shared user identity fields;
   - copies password credentials for unified login;
   - creates `crewportglobal` project membership;
   - does not copy maritime documents, profiles, employer, vessel, contract or medical data.
4. Auth module:
   - validation;
   - errors;
   - cookie helpers;
   - bcrypt password hashing/verification;
   - memory auth store;
   - PostgreSQL auth store.
5. API endpoints:
   - `POST /api/travelgtc/v1/auth/register`;
   - `POST /api/travelgtc/v1/auth/login`;
   - `POST /api/travelgtc/v1/auth/logout`;
   - `GET /api/travelgtc/v1/auth/me`;
   - `POST /api/travelgtc/v1/auth/email/send-verification`;
   - `POST /api/travelgtc/v1/auth/email/verify`;
   - `POST /api/travelgtc/v1/account/leads`.
6. Authenticated lead submission:
   - requires a valid session;
   - validates the existing lead payload;
   - creates TravelGTC membership `interested`;
   - assigns the declared TravelGTC role;
   - stores `user_id` with the lead bundle.
7. Environment switches:
   - `TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED`;
   - `TRAVELGTC_IDENTITY_CONSENT_VERSION`;
   - `TRAVELGTC_SESSION_COOKIE_NAME`;
   - `TRAVELGTC_SESSION_TTL_DAYS`;
   - `TRAVELGTC_AUTH_SECURE_COOKIES`;
   - `TRAVELGTC_AUTH_EMAIL_VERIFICATION_TEST_MODE`.
8. Added `bcryptjs` dependency for bcrypt compatibility with PHP-style hashes.

## 3. API Behavior

### 3.1 Registration

```text
POST /api/travelgtc/v1/auth/register
```

Creates a new shared GTC identity only when the email does not already exist.

Duplicate registration returns:

```text
409 account_already_exists
```

Registration sets a session cookie and prepares an email verification token.

### 3.2 Login

```text
POST /api/travelgtc/v1/auth/login
```

Authenticates an existing shared GTC account and sets a session cookie.

Invalid credentials return:

```text
401 invalid_credentials
```

### 3.3 Current User

```text
GET /api/travelgtc/v1/auth/me
```

Without session:

```json
{
  "ok": true,
  "authenticated": false,
  "user": null
}
```

With session, returns safe user fields and project memberships.

### 3.4 Authenticated Lead

```text
POST /api/travelgtc/v1/account/leads
```

Requires valid session.

Anonymous request returns:

```text
401 auth_required
```

Valid authenticated request creates:

1. TravelGTC project membership;
2. TravelGTC project role from the submitted form;
3. contact/lead/travel idea/interaction/task/agent run;
4. authenticated user linkage through `user_id`.

## 4. CrewPortGlobal Boundary

The migration includes optional compatibility backfill from CrewPortGlobal only when the tables exist in the same database.

Copied:

1. shared user UUID;
2. email;
3. display name;
4. email verification timestamp;
5. account active/pending/suspended state;
6. password hash;
7. minimal `crewportglobal` project membership marker.

Not copied:

1. seafarer profile;
2. maritime documents;
3. employer/company/vessel data;
4. contract or joining/discharge data;
5. medical data;
6. CrewPortGlobal CRM/process data;
7. TravelGTC lead or role without TravelGTC action.

## 5. Runtime Safety

The new authenticated lead endpoint is disabled by default:

```text
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=false
```

Public lead capture remains separately disabled by default:

```text
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
```

Production use still requires privacy/consent/disclosure readiness, database migration execution and nginx `/api` proxy.

## 6. Verification

Commands run:

```bash
npm --prefix projects/travelgtc/app run check
```

Results:

```text
PASS: TypeScript build completed.
PASS: API tests passed: 15 tests in 2 files.
PASS: auth tests cover anonymous me, registration, duplicate registration, existing login, email verification, auth-required account leads, authenticated account leads and logout.
PASS: bcrypt compatibility test covers PHP-style $2y$ hashes.
```

Migration note:

```text
The PostgreSQL migration was added but not applied to production or to a shared database in this task.
It must be run first against a safe test database.
```

## 7. Files Changed

Main files:

```text
projects/travelgtc/app/.env.example
projects/travelgtc/app/package.json
projects/travelgtc/app/package-lock.json
projects/travelgtc/app/migrations/002_gtc_identity_auth.sql
projects/travelgtc/app/src/modules/auth/
projects/travelgtc/app/src/modules/public-leads/
projects/travelgtc/app/src/server/config.ts
projects/travelgtc/app/src/server/createApp.ts
projects/travelgtc/app/src/server/index.ts
projects/travelgtc/app/tests/auth.test.ts
projects/travelgtc/app/tests/public-leads.test.ts
```

## 8. Known Gaps

Remaining work:

1. build frontend login/registration UI;
2. add header account controls;
3. switch public funnel form to authenticated gate;
4. run migration against a safe database;
5. verify optional CrewPortGlobal backfill against real schema and backup;
6. configure API service and nginx `/api` proxy;
7. implement real email delivery;
8. add account page / `Мои заявки`;
9. continue to CRM board/detail implementation.

## 9. Next Step

Recommended next implementation task:

```text
TRAVELGTC-AUTH-004 - Frontend Registration Gate And Authenticated Lead Form
```

Runtime task still required before public/live API use:

```text
TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy
```

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation report |
