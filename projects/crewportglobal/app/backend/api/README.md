# CrewPortGlobal Backend API (CPG-BE-002)

## Scope

This directory contains the first implementation slice for registration draft endpoints and reviewed public vacancy publication.

- CPG-BE-002: registration draft API endpoints

The current implementation provides runtime handlers and DB writes for draft create/get/update, operator review decisions, reviewed vacancy listing/detail, vacancy applications, vacancy application review, seafarer-side application history and withdrawal, employer-side visibility for operator-presented candidates, employer shortlist actions and a basic token boundary for operator-only routes.

## Planned endpoints

- POST /api/v1/registration/drafts
- GET /api/v1/registration/drafts/{draft_id}
- PATCH /api/v1/registration/drafts/{draft_id}
- GET /api/v1/registration/drafts/{draft_id}/documents
- POST /api/v1/registration/drafts/{draft_id}/documents
- POST /api/v1/registration/person/request
- POST /api/v1/registration/person/confirm
- POST /api/v1/auth/register-password
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- GET /api/v1/operator/review-queue
- GET /api/v1/operator/review-queue/vacancy-applications/{vacancy_application_id}
- PATCH /api/v1/operator/review-queue/{draft_id}/status
- GET /api/v1/operator/document-review-queue
- GET /api/v1/operator/documents/{document_id}/download
- PATCH /api/v1/operator/documents/{document_id}/review
- GET /api/v1/vacancies
- GET /api/v1/vacancies/{vacancy_request_id}
- POST /api/v1/vacancies/{vacancy_request_id}/applications
- PATCH /api/v1/seafarer/vacancy-applications/{vacancy_application_id}/status
- PATCH /api/v1/employer/vacancy-applications/{vacancy_application_id}/shortlist
- GET /api/v1/health
- POST /api/v1/admin/access/email-code/request
- POST /api/v1/admin/access/email-code/verify
- GET /api/v1/admin/access/session
- POST /api/v1/admin/access/session/revoke
- GET /api/v1/admin/access/team-links
- GET /api/v1/admin/access/management
- POST /api/v1/admin/access/users
- POST /api/v1/admin/access/group-members

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
- protected document upload logic: draft documents can be uploaded through `POST /api/v1/registration/drafts/{draft_id}/documents`, stored outside the public web root, scanned by ClamAV and listed as metadata only through `GET /api/v1/registration/drafts/{draft_id}/documents`
- protected document review logic: clean uploaded documents can be listed through `GET /api/v1/operator/document-review-queue`, downloaded through `GET /api/v1/operator/documents/{document_id}/download` and reviewed through `PATCH /api/v1/operator/documents/{document_id}/review`; infected, blocked, unscanned and scan-error files are not reviewable
- operator access boundary: `GET /api/v1/operator/review-queue`, `PATCH /api/v1/operator/review-queue/{draft_id}/status` and document-review operator routes require `X-CPG-Operator-Token` or approved team/admin session access
- access-control guard foundation: `lib/access_control.php` defines Phase 2 permission-loading, scope-checking, operator queue permission mapping and access-audit write helpers, with isolated tests; the guard is not wired into runtime routes yet
- operator queue capability contract: operator queue responses include `operator_access` permission/scope metadata in `temporary_operator_token` mode so `/verify/` can prepare for future role-based action disabling without changing current token behavior
- identity context foundation: `lib/identity_context.php` defines anonymous, temporary-operator-token, future account-session and future admin-session identity shapes without introducing login sessions or replacing the current token boundary
- admin email-code foundation: `lib/admin_access.php` defines one-time code generation, hashing, verification, expiry, attempt-limit helpers, admin-session TTL helpers and email message payloads without adding runtime endpoints or sending email
- admin email-code flow skeleton: `lib/admin_access_flow.php` defines disabled-by-default request/verify skeleton responses and validates the future OpenAPI contract without adding public routes
- admin email-code storage adapter contract: `lib/admin_access_storage.php` defines the storage boundary and in-memory test adapter for hash-only code storage, attempt counting, single-use verification, admin session creation and audit events without connecting to PostgreSQL
- admin email-code PostgreSQL adapter design: `lib/admin_access_pg_storage.php` defines a callable-query PostgreSQL adapter and static SQL tests for future `admin_email_codes`, `admin_sessions`, access-audit and admin-user eligibility queries without opening a database connection
- admin email-code public route wiring: `public/index.php` exposes POST request/verify routes; they load protected runtime config and keep the disabled response before JSON parsing unless explicit server-only flags enable the flow
- admin email-code storage factory contract: `lib/admin_access_storage_factory.php` defines disabled-by-default storage selection and explicit `pgsql` adapter creation through an injected query executor; public routes call it only after runtime gates pass
- admin email-code delivery adapter contract: `lib/admin_access_email_delivery.php` defines disabled-by-default email delivery selection, Timeweb SMTP configuration validation, safe message preparation, a test-only capture adapter and a controlled SMTP send path for approved admin access runtime use
- admin access Project Owner bootstrap: `tools/bootstrap_project_owner.php` records the controlled first-owner bootstrap path for `kfilipenko@gtchain.io`
- group-based access bootstrap: `tools/bootstrap_group_based_access.php` creates/confirms `owners` and `cpg_team`, assigns `project_owner` through the `owners` group and removes the owner user from the legacy direct bootstrap membership
- admin access console view: `/admin/access/` displays the current Project Owner session, active groups, roles, effective permissions and recent access audit events, with logout / session revoke only
- protected team links: `/team/` loads links only through `GET /api/v1/admin/access/team-links` after a session whose user belongs to `owners` or `cpg_team`; the protected document review page is available at `/team/documents/`
- access-management console slice: Project Owner can read users/groups, create or confirm users, and add users to assignable internal/administration groups through `GET /api/v1/admin/access/management`, `POST /api/v1/admin/access/users` and `POST /api/v1/admin/access/group-members`
- public physical-person registration slice: `/register/` posts to `POST /api/v1/auth/register-password` for the first password credential MVP, creates a base user/draft with the selected primary capability and opens `/cabinet/`; the earlier `registration/person/*` e-mail confirmation endpoints remain available for the later verified-email stage
- password credential/session MVP: `POST /api/v1/auth/register-password`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` and `GET /api/v1/auth/me` store only `password_hash`, store only hashed session tokens, issue HttpOnly SameSite=Lax cookies, revoke sessions on logout and never return raw passwords, password hashes or raw session tokens

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

`lib/admin_access.php` is the local security primitive layer for admin email-code protection: code generation, hashing, verification, expiry and admin-session TTL helpers.

`lib/admin_access_flow.php` describes the request/verify handler boundary. By default the flow returns `admin_access_flow_not_enabled`; after protected runtime flags pass, request stores a hash-only code and sends email, while verify marks the code used and creates an admin-session record.

`lib/admin_access_storage.php` defines the storage boundary for admin email-code records and admin sessions. The implementation includes an in-memory test adapter and the interface used by the PostgreSQL adapter.

`lib/admin_access_pg_storage.php` defines the PostgreSQL adapter using an injected query executor. Runtime routes create it only through the storage factory after protected feature gates pass.

The public admin email-code routes require both `CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED` and `CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED` before reading JSON. When disabled, the default response is `admin_access_flow_not_enabled`.

`lib/admin_access_storage_factory.php` controls route storage selection. Default mode is disabled; `CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE=pgsql` creates a PostgreSQL adapter through the factory and without querying at construction time. Public routes call the factory only after route and flow gates pass.

`lib/admin_access_email_delivery.php` controls email delivery. Default mode is disabled; `CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED=true` triggers SMTP configuration validation, but delivery remains not-sent unless `smtp_send_ready` mode and `CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED=true` are explicitly set in protected server config. The approved sender mailbox is `not_reply@crewportglobal.com` via `smtp.timeweb.ru:465` with SSL.

`/admin/access/` is the first read-only Project Owner console view. It uses the verified admin session token to call `GET /api/v1/admin/access/session` and displays the current user, status, active groups, active roles, effective permissions and recent access audit events. `POST /api/v1/admin/access/session/revoke` logs out by setting `admin_sessions.revoked_at`.

Admin console access is group-based. A user can open the admin console only when an active access-control group membership grants the owner/admin role or permission. Direct personal e-mail allowlists are not part of normal access control.

The initial owner group is:

```text
Display name: Владельцы
Group code: owners
Recommended group email: owners@gtchain.io
Initial member: kfilipenko@gtchain.io
```

The team entry group is:

```text
Display name: Команда CPG
Group code: cpg_team
Recommended group email: cpg-team@gtchain.io
Members: Project Owner approved members only
```

The `/team/` entry page is a protected shell: it does not embed the internal link list in static HTML. The browser loads links from `GET /api/v1/admin/access/team-links` only after group-checked session validation.

The first writable `/admin/access/` management slice is intentionally narrow:

```text
allowed: create/confirm user records
allowed: add existing users to assignable internal/administration groups
not allowed yet: create groups
not allowed yet: edit group roles
not allowed yet: revoke membership
not allowed yet: open group work pages
```

This keeps user access administration separate from the next product stage, where each working group receives its own functional page and data permissions.

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
CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED=false
CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED=false
CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE=disabled
```

The password must not be committed to Git, documentation, tests, comments or source files.

Public registration e-mail confirmation uses the same protected SMTP mailbox but has its own feature flags and signing secret:

```bash
CREWPORTGLOBAL_REGISTRATION_PUBLIC_FLOW_ENABLED=true
CREWPORTGLOBAL_REGISTRATION_EMAIL_ENABLED=true
CREWPORTGLOBAL_REGISTRATION_EMAIL_DELIVERY_MODE=smtp_send_ready
CREWPORTGLOBAL_REGISTRATION_SMTP_SEND_ENABLED=true
CREWPORTGLOBAL_REGISTRATION_LINK_SECRET=<server-only-secret>
CREWPORTGLOBAL_PUBLIC_BASE_URL=https://crewportglobal.com
```

The registration link secret is server-only and must not be committed. Public registration creates/confirms the physical person/user record first; role, company, vessel, task and data-visibility authorization remain later evidence-based steps.

Controlled SMTP smoke test command:

```bash
sudo -n php projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php --send --to=approved-recipient@example.com
```

The smoke test loads `/etc/crewportglobal/admin-access.env`, generates a one-time code, sends it through the SMTP adapter and prints only a safe result summary. It does not print the code or SMTP password.

Controlled Project Owner bootstrap:

```bash
php projects/crewportglobal/app/backend/api/tools/bootstrap_project_owner.php --owner-email=kfilipenko@gtchain.io
```

Controlled group-based access bootstrap:

```bash
php projects/crewportglobal/app/backend/api/tools/bootstrap_group_based_access.php --owner-email=kfilipenko@gtchain.io
```

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
- http://127.0.0.1:8091/api/v1/registration/drafts/{draft_id}/documents
- http://127.0.0.1:8091/api/v1/registration/person/request
- http://127.0.0.1:8091/api/v1/registration/person/confirm
- http://127.0.0.1:8091/api/v1/operator/review-queue
- http://127.0.0.1:8091/api/v1/operator/review-queue/vacancy-applications/{vacancy_application_id}
- http://127.0.0.1:8091/api/v1/operator/document-review-queue
- http://127.0.0.1:8091/api/v1/operator/documents/{document_id}/download
- http://127.0.0.1:8091/api/v1/operator/documents/{document_id}/review
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
php projects/crewportglobal/app/backend/api/tests/registration_person_flow_test.php
```

## Out of scope here

- OAuth, e-mail verification enforcement, password reset and phone verification
- broader admin console features beyond the first email-code gate
- deployment/nginx/openclaw/stripe changes
