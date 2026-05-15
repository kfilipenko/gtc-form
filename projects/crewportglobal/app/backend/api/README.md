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
```

## Out of scope here

- account password hashing
- login sessions
- admin email sending
- public form wiring
- deployment/nginx/openclaw/stripe changes
