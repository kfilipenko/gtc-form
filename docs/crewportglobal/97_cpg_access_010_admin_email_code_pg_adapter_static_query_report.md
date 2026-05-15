# CrewPortGlobal - CPG-ACCESS-010 Admin Email-Code PostgreSQL Adapter Static Query Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and static query validation record
- Status: Implemented and verified locally, PostgreSQL not connected

## 1. Purpose

This report records the next implementation slice after document 96 for document 88 Phase 3.

The goal is to prepare the future PostgreSQL adapter for admin email-code storage while keeping all checks static and isolated from any real database.

## 2. Implemented Scope

Implemented changes:

1. added `projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php`;
2. implemented `CpgAdminAccessPgStorage` against the existing `CpgAdminAccessStorage` interface;
3. used an injected callable query executor instead of opening a database connection;
4. added SQL for finding admin-eligible users by e-mail through access groups, roles and permissions;
5. added SQL for inserting hash-only admin email-code records;
6. added SQL for finding pending unexpired unused codes;
7. added SQL for atomically incrementing attempt counts;
8. added SQL for marking codes used;
9. added SQL for creating admin session records;
10. added SQL for writing admin access audit events;
11. added static PHP tests with a fake query executor;
12. updated backend API README.

## 3. Runtime Boundary

This slice does not connect to PostgreSQL.

Current boundaries:

1. no `psql` command was executed;
2. no `api_db()` call was added;
3. no public route calls `CpgAdminAccessPgStorage`;
4. `public/index.php` was not changed;
5. no migration was applied;
6. no production or non-production database was touched;
7. no email is sent;
8. no public admin session cookie or token is issued;
9. no existing operator token behavior changed.

## 4. Static Query Contract

The adapter prepares queries for these future tables:

```text
crewportglobal.users
crewportglobal.access_group_members
crewportglobal.access_groups
crewportglobal.access_group_roles
crewportglobal.access_roles
crewportglobal.access_role_permissions
crewportglobal.access_permissions
crewportglobal.admin_email_codes
crewportglobal.admin_sessions
crewportglobal.access_audit_events
```

The static tests verify:

1. constructor does not query;
2. SQL uses parameters instead of interpolating email or code hash;
3. e-mail lookup uses `lower(u.email) = lower($1)`;
4. admin eligibility query joins group, role and permission tables;
5. admin email-code writes return inserted records;
6. pending code query requires `used_at IS NULL` and future expiry;
7. failed attempt update increments atomically;
8. used-code update writes `used_at`;
9. session insert targets `admin_sessions`;
10. audit insert JSON-encodes `previous_value` and `new_value`.

## 5. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php`
- `projects/crewportglobal/app/backend/api/lib/admin_access_storage.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Documentation:

- `docs/crewportglobal/97_cpg_access_010_admin_email_code_pg_adapter_static_query_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_storage.php
php -l projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
git diff --check
```

Additional safe local suite:

```bash
php projects/crewportglobal/app/backend/api/tests/admin_access_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
php projects/crewportglobal/app/backend/api/tests/identity_context_test.php
```

## 7. Next Recommended Work

Recommended next slice:

1. add disabled public route wiring behind an explicit feature flag and injected storage factory;
2. keep the route returning disabled response until migration `006`, e-mail delivery and admin session handling are approved in a non-production target;
3. then build the read-only `/admin/access/` console shell behind the protected boundary.
