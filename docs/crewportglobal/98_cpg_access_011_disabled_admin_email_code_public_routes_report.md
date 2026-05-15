# CrewPortGlobal - CPG-ACCESS-011 Disabled Admin Email-Code Public Routes Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and disabled public route wiring record
- Status: Implemented and verified locally, runtime admin access still disabled

## 1. Purpose

This report records the next implementation slice after document 97 for document 88 Phase 3.

The goal is to wire the future public API paths for admin email-code request and verify while keeping the runtime flow disabled by default.

## 2. Implemented Scope

Implemented changes:

1. added disabled route stubs in `projects/crewportglobal/app/backend/api/public/index.php`;
2. added `POST /api/v1/admin/access/email-code/request`;
3. added `POST /api/v1/admin/access/email-code/verify`;
4. added explicit public route flag `CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED`;
5. retained existing flow flag `CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED`;
6. required both flags before any JSON body parsing;
7. returned `admin_access_flow_not_enabled` by default;
8. kept PostgreSQL storage out of public route wiring;
9. added static route-wiring tests;
10. performed local HTTP smoke checks with PHP built-in server;
11. updated backend API README.

## 3. Runtime Boundary

This slice does not enable admin access.

Current boundaries:

1. default route response is HTTP 503;
2. disabled route response happens before JSON body parsing;
3. no `api_db()` call is used by the new handlers;
4. no `api_query()` call is used by the new handlers;
5. `CpgAdminAccessPgStorage` is not included by `public/index.php`;
6. no `psql` command was executed;
7. no migration was applied;
8. no production or non-production database was touched;
9. no email is sent;
10. no public admin session cookie or token is issued;
11. no existing operator token behavior changed.

## 4. Public Route Contract

Disabled routes:

```text
POST /api/v1/admin/access/email-code/request
POST /api/v1/admin/access/email-code/verify
```

Default response:

```json
{
  "ok": false,
  "error": "admin_access_flow_not_enabled",
  "message": "Admin access email-code flow is not enabled yet"
}
```

Method contract:

```text
GET /api/v1/admin/access/email-code/request -> 405 Allow: POST
GET /api/v1/admin/access/email-code/verify -> 405 Allow: POST
```

## 5. Feature Flags

The public route stubs require both flags before they can reach skeleton request parsing:

```text
CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED
CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED
```

Legacy aliases:

```text
CPG_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED
CPG_ADMIN_ACCESS_FLOW_ENABLED
```

These flags are not enabled by this implementation report.

## 6. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Documentation:

- `docs/crewportglobal/98_cpg_access_011_disabled_admin_email_code_public_routes_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 7. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
```

Local HTTP smoke check:

```bash
php -S 127.0.0.1:8097 router.php
curl -i -X POST http://127.0.0.1:8097/api/v1/admin/access/email-code/request
curl -i -X POST http://127.0.0.1:8097/api/v1/admin/access/email-code/verify
curl -i http://127.0.0.1:8097/api/v1/admin/access/email-code/request
curl -i http://127.0.0.1:8097/api/v1/admin/access/email-code/verify
```

Observed:

```text
POST request -> 503 admin_access_flow_not_enabled
POST verify -> 503 admin_access_flow_not_enabled
GET request -> 405 Allow: POST
GET verify -> 405 Allow: POST
```

Additional safe local suite:

```bash
php projects/crewportglobal/app/backend/api/tests/admin_access_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
php projects/crewportglobal/app/backend/api/tests/identity_context_test.php
git diff --check
```

## 8. Next Recommended Work

Recommended next slice:

1. add a route storage-factory contract that still returns disabled until PostgreSQL, email delivery and admin session handling are approved;
2. then create the read-only `/admin/access/` console shell behind the disabled admin boundary;
3. keep migration `006` unapplied until separate non-production approval.
