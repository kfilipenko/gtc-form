# CrewPortGlobal - CPG-ACCESS-012 Admin Email-Code Storage Factory Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and storage factory contract
- Status: Implemented and verified locally, public routes not connected to storage factory

## 1. Purpose

This report records the next implementation slice after document 98 for document 88 Phase 3.

The goal is to prepare a storage factory contract for future admin email-code route activation while keeping public runtime behavior disabled.

## 2. Implemented Scope

Implemented changes:

1. added `projects/crewportglobal/app/backend/api/lib/admin_access_storage_factory.php`;
2. defined default disabled storage mode;
3. defined explicit PostgreSQL storage mode;
4. added modern env key `CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE`;
5. added legacy env key `CPG_ADMIN_ACCESS_STORAGE_MODE`;
6. added mode normalization for `postgres`, `postgresql` and `pgsql`;
7. added invalid-mode status handling;
8. added disabled storage response helper;
9. added PostgreSQL query-executor wrapper for future `api_query` use;
10. added `cpg_admin_access_create_storage(...)`;
11. added tests proving adapter creation does not query the database;
12. added tests proving public routes do not include or call the factory yet;
13. updated backend API README.

## 3. Runtime Boundary

This slice does not activate storage.

Current boundaries:

1. `public/index.php` does not include `admin_access_storage_factory.php`;
2. public admin email-code handlers do not call `cpg_admin_access_create_storage(...)`;
3. no `api_db()` call was added;
4. no `api_query()` call is executed by the factory constructor path;
5. no `psql` command was executed;
6. no migration was applied;
7. no production or non-production database was touched;
8. no email is sent;
9. no public admin session cookie or token is issued;
10. disabled public route behavior from document 98 remains unchanged.

## 4. Storage Factory Contract

Environment keys:

```text
CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE
CPG_ADMIN_ACCESS_STORAGE_MODE
```

Supported values:

```text
disabled
pgsql
postgres
postgresql
```

Default behavior:

```text
mode: disabled
error: admin_access_storage_not_configured
```

Invalid behavior:

```text
mode: invalid
error: admin_access_storage_mode_invalid
```

PostgreSQL behavior:

```text
mode: pgsql
adapter: CpgAdminAccessPgStorage
query execution: deferred until a storage method is called
```

## 5. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_storage_factory.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Documentation:

- `docs/crewportglobal/99_cpg_access_012_admin_email_code_storage_factory_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_storage_factory.php
php -l projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php
```

Additional safe local suite:

```bash
php projects/crewportglobal/app/backend/api/tests/admin_access_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
php projects/crewportglobal/app/backend/api/tests/identity_context_test.php
git diff --check
```

## 7. Next Recommended Work

Recommended next slice:

1. add an email-delivery adapter contract that is disabled by default;
2. keep public admin email-code routes returning disabled responses until storage, email delivery, sessions and migration `006` are approved in a non-production target;
3. then connect request/verify handlers to factory-created storage in a protected non-production activation path.
