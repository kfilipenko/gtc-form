# CPG-SEAFARER-019 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/28
- Status: Published for inspection planning and execution

## 1. Executive instruction

This task is an audit, test and documentation task.

Do not add new business functionality.

The goal is to produce a full factual inventory of the current seafarer workflow after CPG-SEAFARER-017 and CPG-SEAFARER-018.

The Project Owner needs to know exactly:

```text
what forms exist;
what fields exist;
where each field is stored;
what is in DB tables;
what remains in JSON metadata;
what APIs read/write the data;
what is visible to each role;
what tests confirm the current behavior;
what gaps remain.
```

## 2. Required source documents

Read first:

```text
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
docs/crewportglobal/152_cpg_seafarer_018_approval_consent_medical_report.md
docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md
docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
```

Also inspect current code, migrations and tests. Do not rely only on previous reports.

## 3. Required report

Create:

```text
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
```

Update the documentation register if active:

```text
docs/crewportglobal/00_documentation_register.md
```

## 4. Page/form inventory

List every relevant page/form:

```text
/create-profile/
/verify/
/cabinet/
/post-vacancy/
/vacancies/ if currently tied to seafarer flow
any onboarding or seafarer-related form still active
```

Use this table:

| Page | File | User role | Purpose | Form sections/cards | Submit/API endpoints | Stores data? | Notes |
|---|---|---|---|---|---|---|---|

## 5. Field inventory by page

For every relevant page, list important fields explicitly.

Use this table:

| Page | Section/card | Field label | HTML/input id or JS key | Backend key | Source card | Data type | Required? | Stored where | Visibility class | Notes |
|---|---|---|---|---|---|---|---|---|---|---|

Important: do not replace explicit fields with vague groups. Groups are allowed only after the important fields are listed.

## 6. Database schema inventory

Inspect migrations and actual GTC1 database if available.

List all tables related to:

```text
registration drafts
seafarer profiles
source card review states
repeated source records
document uploads
consent events
vacancy applications
employer presented candidates
operator review/audit records
```

Use this table:

| Table | Purpose | Column | Type | Nullable | Default | Index/constraint | Source of truth? | Notes |
|---|---|---|---|---|---|---|---|---|

If actual DB access is unavailable, say so and base the inventory on migrations plus code reads.

## 7. JSON/metadata inventory

List known JSON paths, including but not limited to:

```text
document_metadata.seafarer_workspace
document_metadata.seafarer_workspace_card_reviews
source_repeated_records
source_card_document_links
approval_guard
consent summary / consent events if returned by API
```

Use this table:

| JSON path | Stored in table/column | Purpose | Keys inside | Owner-visible? | Operator-visible? | Employer-visible? | Notes |
|---|---|---|---|---|---|---|---|

## 8. API inventory

List seafarer-related API endpoints.

Required endpoints to inspect:

```text
GET /api/v1/seafarer/workspace
GET /api/v1/seafarer/consents
POST /api/v1/seafarer/consents
PATCH /api/v1/seafarer/consents/{type}/withdraw
GET /api/v1/registration/drafts/{draft_id}
GET /api/v1/operator/review-queue/vacancy-applications/{id}
PATCH /api/v1/operator/review-queue/{id}/status
document upload/review endpoints used by seafarer workflow
vacancy application/presentation endpoints used by employer flow
```

Use this table:

| Method | Endpoint | Role/scope | Request params/body | Response keys | Reads tables | Writes tables | Sensitive fields returned? | Tests |
|---|---|---|---|---|---|---|---|---|

## 9. Consent and approval inventory

Document current consent and approval state model.

Use this table:

| Object | Stored where | Possible statuses/types | Created by | Updated by | Blocks what | Tests |
|---|---|---|---|---|---|---|

Must include:

```text
consent events
withdrawn consent
approval_status
approval_blockers
vacancy_application presented transition
source-card correction_requested / verified / under_review states
```

## 10. Visibility and employer payload inventory

Add a current visibility matrix:

| Field/group | Owner | General operator | Cabinet | Employer payload | Restricted medical | Notes |
|---|---|---|---|---|---|---|

Add employer payload allow/deny proof:

| Field/group | Included? | Why | Test evidence |
|---|---:|---|---|

## 11. Test execution and traceability

Run or report these checks:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
npm run test:cpg-api
approval guard focused test
visibility minimization test
source repeated-row test
operator queue test
cabinet dashboard test
post-vacancy/employer payload test
create-profile/prefill/workspace tests
```

Use this table:

| Test command/file | Purpose | Result | Fields/surfaces covered | Notes |
|---|---|---|---|---|

If a test is unavailable, document why.

## 12. Safe synthetic end-to-end trace

Do not include real personal data.

Document one synthetic trace:

```text
seafarer creates draft;
fills profile/source records;
upload/document metadata linked;
operator reviews source cards;
consent events created;
approval guard evaluates;
vacancy application attempted to be presented;
employer payload generated or blocked;
forbidden fields absent.
```

## 13. Remaining gaps

End the report with:

| Gap | Risk | Suggested next task | Priority |
|---|---|---|---|

## 14. Boundaries

Do not change unless required for safe inspection/testing and documented:

```text
business functionality
approval guard behavior
consent API behavior
restricted medical behavior
Stripe
OpenClaw
nginx/systemd/deployment
private Excel source
payment/subscription logic
automatic matching scoring
employment decision logic
```

Generated Playwright/test artifacts must not be committed unless intentionally tracked.

## 15. First response required from agent

Before writing the report, post a short inspection plan:

```text
files/pages to inspect;
database inspection commands planned;
tests planned;
whether DB access is available;
whether generated artifacts need cleanup;
report structure.
```

Wait for approval before executing the full inventory.