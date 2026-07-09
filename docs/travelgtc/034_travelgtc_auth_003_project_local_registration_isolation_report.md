# TRAVELGTC-AUTH-003 - Project-Local Registration Isolation Report

- Project: TravelGTC
- Source task: `docs/travelgtc/033_travelgtc_auth_003_project_local_registration_isolation_task.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented, local/test API verified

## 1. Purpose

This report records the pivot from shared GTC identity to isolated TravelGTC project-local registration.

## 2. Decision Fixed

The previous idea of sharing users with CrewPortGlobal is superseded.

TravelGTC will use its own user table and its own credentials. A user may register in TravelGTC with the same email they use in another project, but TravelGTC will not look up, link or import that other project account.

## 3. Implementation Summary

Changed:

1. replaced `gtc_identity` runtime schema references with `travelgtc_identity`;
2. renamed migration to `projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql`;
3. removed optional CrewPortGlobal identity/credential backfill from the migration;
4. updated PostgreSQL auth store to use only `travelgtc_identity`;
5. changed identity consent default to `travelgtc-identity-consent-v1`;
6. updated tests to describe local TravelGTC account registration;
7. kept the secure auth mechanics from AUTH-002:
   - password hash;
   - session token hash;
   - HttpOnly/SameSite cookie;
   - email verification test token;
   - authenticated `account/leads`.

## 4. Current Data Boundary

Allowed:

1. TravelGTC local registration;
2. TravelGTC local login;
3. TravelGTC local role/membership context;
4. TravelGTC CRM lead linked to local `travelgtc_identity.users.user_id`.

Not allowed:

1. reading from `crewportglobal.users`;
2. reading from `crewportglobal.user_credentials`;
3. importing CrewPortGlobal users;
4. importing CrewPortGlobal documents, profiles, vessel, employer, contract or medical records;
5. treating an email in another project as an existing TravelGTC account.

## 5. API Impact

Endpoints remain the same:

```text
POST /api/travelgtc/v1/auth/register
POST /api/travelgtc/v1/auth/login
POST /api/travelgtc/v1/auth/logout
GET  /api/travelgtc/v1/auth/me
POST /api/travelgtc/v1/auth/email/send-verification
POST /api/travelgtc/v1/auth/email/verify
POST /api/travelgtc/v1/account/leads
```

Behavior changed:

```text
Registration checks duplicate email only inside travelgtc_identity.users.
It does not check CrewPortGlobal or any shared GTC user database.
```

## 6. Database Impact

Active migration:

```text
projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql
```

Active schema:

```text
travelgtc_identity
```

The previous file name and schema are superseded:

```text
projects/travelgtc/app/migrations/002_gtc_identity_auth.sql
gtc_identity
```

Migration note:

```text
This migration has not been applied to production. If an earlier test database already received the superseded gtc_identity migration, that test database should be cleaned or recreated before applying the project-local migration.
```

## 7. Verification

Commands run:

```bash
npm run check:travelgtc-api
```

Result:

```text
PASS: TypeScript build completed.
PASS: API tests passed: 15 tests in 2 files.
```

Additional source audit:

```text
Runtime app code no longer references standalone shared gtc_identity.
Runtime app code no longer contains CrewPortGlobal backfill.
Migration uses travelgtc_identity.
```

## 8. Files Changed

Main files:

```text
projects/travelgtc/app/.env.example
projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql
projects/travelgtc/app/src/modules/auth/stores/postgresAuthStore.ts
projects/travelgtc/app/src/server/config.ts
projects/travelgtc/app/tests/auth.test.ts
projects/travelgtc/app/tests/public-leads.test.ts
docs/travelgtc/00_documentation_register.md
docs/travelgtc/05_project_memory_handoff.md
```

## 9. Next Step

Recommended next implementation task:

```text
TRAVELGTC-AUTH-004 - Frontend Registration Gate And Authenticated Lead Form
```

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation report |
