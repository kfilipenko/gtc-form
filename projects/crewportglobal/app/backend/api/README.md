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
- full login/session logic: not implemented

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

## Out of scope here

- password hashing
- login sessions
- public form wiring
- deployment/nginx/openclaw/stripe changes
