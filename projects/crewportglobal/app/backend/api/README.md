# CrewPortGlobal Backend API (CPG-BE-002)

## Scope

This directory contains the first implementation slice for registration draft endpoints and reviewed public vacancy publication.

- CPG-BE-002: registration draft API endpoints

The current implementation provides runtime handlers and DB writes for draft create/get/update, operator review decisions, reviewed vacancy listing/detail, vacancy applications, vacancy application review, seafarer-side application history and withdrawal, employer-side visibility for operator-presented candidates, employer shortlist actions and a basic token boundary for operator-only routes.

## Planned endpoints

- POST /api/v1/registration/drafts
- GET /api/v1/registration/drafts/{draft_id}
- PATCH /api/v1/registration/drafts/{draft_id}
- GET /api/v1/operator/review-queue
- GET /api/v1/operator/review-queue/vacancy-applications/{vacancy_application_id}
- PATCH /api/v1/operator/review-queue/{draft_id}/status
- GET /api/v1/vacancies
- GET /api/v1/vacancies/{vacancy_request_id}
- POST /api/v1/vacancies/{vacancy_request_id}/applications
- PATCH /api/v1/seafarer/vacancy-applications/{vacancy_application_id}/status
- PATCH /api/v1/employer/vacancy-applications/{vacancy_application_id}/shortlist
- GET /api/v1/health
- POST /api/v1/admin/access/email-code/request (disabled public route, runtime flow off)
- POST /api/v1/admin/access/email-code/verify (disabled public route, runtime flow off)

## Current status

- endpoint contracts: created
- handler stubs: retained as behavior notes
- runtime router/handlers: implemented in public/index.php
- persistence logic: minimal DB writes implemented for draft flow
- vacancy publication logic: public vacancies are returned only when the vacancy is published and the employer company is verified
- vacancy application logic: seafarers can submit an application only against a reviewed public vacancy, and applications are stored for human review
- vacancy application review logic: operator queue includes submitted vacancy applications and can move them through `in_review`, `presented` or `rejected`
- seafarer application history logic: seafarer draft responses include the user's own `vacancy_applications` with vacancy, company and review status context
- seafarer vacancy application action logic: seafarers can withdraw an active application or mark themselves not available, both resulting in `withdrawn` status with an audit event
- employer candidate pipeline logic: employer draft responses include only `presented_candidates` that belong to the employer company and the current vacancy workspace
- employer shortlist action logic: employers can mark an operator-presented candidate as `contacted`, `interview_requested`, `not_suitable` or back to `presented`, with an optional employer follow-up note, through the draft-scoped employer workspace
- operator access boundary: `GET /api/v1/operator/review-queue` and `PATCH /api/v1/operator/review-queue/{draft_id}/status` require `X-CPG-Operator-Token` or `Authorization: Bearer ...`
- access-control guard foundation: `lib/access_control.php` defines Phase 2 permission-loading, scope-checking, operator queue permission mapping and access-audit write helpers, with isolated tests; the guard is not wired into runtime routes yet
- operator queue capability contract: operator queue responses include `operator_access` permission/scope metadata in `temporary_operator_token` mode so `/verify/` can prepare for future role-based action disabling without changing current token behavior
- identity context foundation: `lib/identity_context.php` defines anonymous, temporary-operator-token, future account-session and future admin-session identity shapes without introducing login sessions or replacing the current token boundary
- admin email-code foundation: `lib/admin_access.php` defines one-time code generation, hashing, verification, expiry, attempt-limit helpers, admin-session TTL helpers and email message payloads without adding runtime endpoints or sending email
- admin email-code flow skeleton: `lib/admin_access_flow.php` defines disabled-by-default request/verify skeleton responses and validates the future OpenAPI contract without adding public routes
- admin email-code storage adapter contract: `lib/admin_access_storage.php` defines the storage boundary and in-memory test adapter for hash-only code storage, attempt counting, single-use verification, admin session creation and audit events without connecting to PostgreSQL
- admin email-code PostgreSQL adapter design: `lib/admin_access_pg_storage.php` defines a callable-query PostgreSQL adapter and static SQL tests for future `admin_email_codes`, `admin_sessions`, access-audit and admin-user eligibility queries without opening a database connection
- admin email-code public route wiring: `public/index.php` exposes disabled-by-default POST route stubs for request/verify; by default they return `admin_access_flow_not_enabled` before reading JSON or touching storage
- admin email-code storage factory contract: `lib/admin_access_storage_factory.php` defines disabled-by-default storage selection and explicit `pgsql` adapter creation through an injected query executor; it is not included by public routes yet
- admin email-code delivery adapter contract: `lib/admin_access_email_delivery.php` defines disabled-by-default email delivery selection, Timeweb SMTP configuration validation, safe message preparation, a test-only capture adapter and a controlled SMTP send path for approved smoke tests; public routes do not include or call it
- full login/session logic: not implemented

## Access-control Phase 2 status

Document 88 defines the final access model. The current backend slice prepares the guard layer only:

- `cpg_access_load_effective_permissions(user_id)`
- `cpg_access_effective_permissions_allow(...)`
- `cpg_access_require_permission(...)`
- `cpg_access_operator_queue_permission_matrix()`
- `cpg_access_operator_queue_view_permission(queue_type)`
- `cpg_access_operator_queue_action_permission(queue_type, decision)`
- `cpg_access_operator_queue_capabilities(queue_type, effective_permissions, default_allowed, mode)`
- `cpg_access_write_audit_event(...)`

Runtime behavior is unchanged in this phase. The temporary operator token remains active, and no protected route calls the new guard until the access-control migration is reviewed, applied in an approved environment and account sessions are available.

Operator queue responses expose `operator_access` metadata for each queue item. In the current runtime this metadata uses `temporary_operator_token` mode with actions allowed, preserving existing behavior. Future account-session enforcement can switch the same contract to permission-checked `allowed` values, and `/verify/` already disables denied action buttons when `allowed` is `false`.

`lib/identity_context.php` is a preparation layer for that transition. It distinguishes a shared temporary operator token from a named active user session, and it prevents the temporary token from being treated as a user that can load role permissions.

`lib/admin_access.php` is a preparation layer for document 88 Phase 3. It implements the local security primitives for admin email-code protection, but it is not wired into public routes until the access-control migration and admin session storage are approved for use.

`lib/admin_access_flow.php` describes the future request/verify handler boundary. By default the flow returns `admin_access_flow_not_enabled`; even when enabled in isolated tests, the skeleton does not send email, write code storage or create admin sessions.

`lib/admin_access_storage.php` defines the future storage boundary for admin email-code records and admin sessions. The current implementation includes only an in-memory test adapter and storage-backed helper tests; no production database connection, public route or email delivery is enabled by this layer.

`lib/admin_access_pg_storage.php` defines the planned PostgreSQL adapter shape using an injected query executor. Its tests validate SQL shape, parameter usage and target tables through a fake executor only; it is not wired into runtime routes and does not call `api_db()` or `psql`.

The public admin email-code route stubs are wired only as a disabled boundary. They require both `CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED` and `CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED` before reaching skeleton body parsing; the default response is `admin_access_flow_not_enabled`.

`lib/admin_access_storage_factory.php` prepares the future route storage selection contract. Default mode is disabled; `CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE=pgsql` can create a PostgreSQL adapter, but only through the factory and without querying at construction time. Public routes do not include or call the factory until runtime activation is separately approved.

`lib/admin_access_email_delivery.php` prepares the future email delivery boundary. Default mode is disabled; `CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED=true` triggers SMTP configuration validation, but delivery remains not-sent unless `smtp_send_ready` mode and `CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED=true` are explicitly set for a controlled execution. The approved sender mailbox is `not_reply@crewportglobal.com` via `smtp.timeweb.ru:465` with SSL. Public routes do not include or call the delivery factory.

Admin access SMTP settings are server-only environment variables:

```bash
# protected server-only config path:
# /etc/crewportglobal/admin-access.env

CREWPORTGLOBAL_SMTP_HOST=smtp.timeweb.ru
CREWPORTGLOBAL_SMTP_PORT=465
CREWPORTGLOBAL_SMTP_SECURITY=ssl
CREWPORTGLOBAL_SMTP_USERNAME=not_reply@crewportglobal.com
CREWPORTGLOBAL_SMTP_PASSWORD=<server-only-secret>
CREWPORTGLOBAL_SMTP_FROM_EMAIL=not_reply@crewportglobal.com
CREWPORTGLOBAL_SMTP_FROM_NAME="CrewPortGlobal Security"
CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED=false
CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE=disabled
CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED=false
```

The password must not be committed to Git, documentation, tests, comments or source files.

Controlled SMTP smoke test command:

```bash
sudo -n php projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php --send --to=approved-recipient@example.com
```

The smoke test loads `/etc/crewportglobal/admin-access.env`, generates a one-time code, sends it through the SMTP adapter and prints only a safe result summary. It does not print the code or SMTP password.

## Operator access token

Set one of these environment variables in the API runtime:

```bash
CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN=replace-with-secret
# or
CPG_OPERATOR_ACCESS_TOKEN=replace-with-secret
```

For nginx/FPM publication, the deploy config reads the token from:

```text
/etc/nginx/snippets/crewportglobal-operator-access.conf
```

The publish script creates that local snippet if it is missing. The secret is not stored in the repository.

## Local run example

```bash
cd projects/crewportglobal/app/backend/api/public
php -S 127.0.0.1:8091 router.php
```

Then call endpoints under:

- http://127.0.0.1:8091/api/v1/registration/drafts
- http://127.0.0.1:8091/api/v1/registration/drafts/{draft_id}
- http://127.0.0.1:8091/api/v1/operator/review-queue
- http://127.0.0.1:8091/api/v1/operator/review-queue/vacancy-applications/{vacancy_application_id}
- http://127.0.0.1:8091/api/v1/vacancies
- http://127.0.0.1:8091/api/v1/vacancies/{vacancy_request_id}
- http://127.0.0.1:8091/api/v1/seafarer/vacancy-applications/{vacancy_application_id}/status
- http://127.0.0.1:8091/api/v1/employer/vacancy-applications/{vacancy_application_id}/shortlist

## Integration tests

Run the API-focused Playwright suite from repository root:

```bash
npm run test:cpg-api
```

This suite starts the API web server, applies the registration and marketplace migrations,
and verifies health/create/get/patch, operator decisions, reviewed vacancy publication, vacancy application flow, vacancy application operator review and validation error cases.

Run the isolated access-control guard checks without a database connection:

```bash
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
php projects/crewportglobal/app/backend/api/tests/identity_context_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_email_delivery_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
```

## Out of scope here

- account password hashing
- login sessions
- public runtime admin email sending
- active admin email delivery provider wiring
- admin email-code PostgreSQL storage wiring
- active admin email-code public route handling
- public form wiring
- deployment/nginx/openclaw/stripe changes
