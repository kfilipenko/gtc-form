# CPG-DEMAND-002 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/32
- Status: Published for schema/API planning note and execution

## 1. Executive instruction

This is an implementation-planning task, not an implementation task.

Do not apply database migrations. Do not modify UI, backend/API code, tests or runtime behavior.

The goal is to convert the canonical demand field contract into a low-risk additive schema and API implementation plan for future development.

## 2. Business reason

CPG-DEMAND-001 established the canonical demand field contract.

CPG-DEMAND-002 must decide how those fields should be implemented later:

```text
new relational columns
new child tables
reference table relations
JSONB compatibility fields
calculated/read-only projections
document-backed statuses
internal/compliance-only records
API request/response shapes
validation and error model
rollback and disable strategy
```

This plan is the last architecture step before implementation issues can safely be created.

## 3. Required source documents

Read first:

```text
docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md
docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md
docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
docs/crewportglobal/00_documentation_register.md
```

Inspect current files read-only only as needed:

```text
projects/crewportglobal/app/backend/db/migrations/*.sql
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/vacancies/index.html
```

## 4. Required deliverable

Create:

```text
docs/crewportglobal/162_cpg_demand_002_schema_api_implementation_plan.md
```

Update the documentation register if active.

## 5. Required report sections

The report must include:

```text
1. Purpose and boundaries.
2. Existing demand-side schema inventory.
3. Target additive schema plan.
4. Proposed migration sequence.
5. Table/column plan by demand object.
6. Reference catalog storage plan.
7. JSONB compatibility strategy.
8. API request/response contract plan.
9. Validation and error model.
10. Visibility and access-control plan.
11. Data backfill and compatibility mapping.
12. Test plan for future implementation.
13. Rollback/disable strategy.
14. Open risks and decisions for Project Owner.
15. Recommended next implementation issues.
```

## 6. Required schema planning matrices

### 6.1 Existing schema inventory

| Current table | Current role | Relevant columns | Reusable? | Limitation | Notes |
|---|---|---|---|---|---|

Include at least:

```text
employer_companies
company_users
vessels
vacancy_requests
uploaded_documents
registration_audit_events
```

### 6.2 Target table/column plan

| Demand object | Canonical field/group | Proposed storage | Additive change type | Reason | Migration risk | Notes |
|---|---|---|---|---|---|

Use storage categories:

```text
existing_column
new_column
new_child_table
reference_relation
jsonb_compatibility
calculated_projection
document_backed_status
internal_compliance_record
```

### 6.3 Proposed migration sequence

| Migration step | Scope | Depends on | Safe to apply alone? | Backfill needed? | Rollback/disable note |
|---|---|---|---|---|---|

The migration sequence must be additive and idempotent in future implementation.

No destructive changes.

## 7. Required reference catalog storage plan

For each catalog, specify storage approach:

| Catalog | Current status | Proposed storage | Seed data needed? | Used by fields | Notes |
|---|---|---|---|---|---|

Include at least:

```text
rank
department
vessel type
country
port
COC
endorsement
STCW/training
visa category
language/level
currency
contract duration unit
rotation pattern
special operation tags
cargo type
risk status
verification status
```

## 8. Required JSONB compatibility strategy

Decide how current free-text / legacy fields remain compatible while normalized fields are introduced.

At minimum cover:

```text
post-requirements
post-duration
post-vessel-type
post-vacancy-title / rank ambiguity
existing document_metadata fields
future demand_workspace JSONB if proposed
```

Use this table:

| Current field | Legacy meaning | Normalized future fields | Compatibility strategy | Risk |
|---|---|---|---|---|

## 9. Required API contract plan

Define future API shapes without implementing them.

Minimum endpoints to plan:

```text
GET /api/v1/employer/demand-workspace?draft_id=...
PATCH /api/v1/employer/demand-workspace/sections/{section}
GET /api/v1/vacancies/{id}/demand-summary
GET /api/v1/operator/demand-review/{draft_id}
GET /api/v1/matching/demand-payload/{vacancy_request_id}
```

For each endpoint:

| Method | Endpoint | Consumer | Request | Response sections | Reads | Writes | Visibility scope | Notes |
|---|---|---|---|---|---|---|---|---|

## 10. Required validation and error model

Plan validation rules and future error codes.

Use this table:

| Field/group | Validation | Error code | Severity | Blocks save? | Blocks matching/publication? |
|---|---|---|---|---|---|

Include at least:

```text
IMO number
country code
currency
salary range
date windows
contract duration
GT/DWT
engine power
validity days
number of positions
catalog value IDs
required COC / STCW / endorsement values
```

## 11. Visibility and access-control plan

Use scopes:

```text
employer_owner
operator_review
public_vacancy_board
seafarer_applicant_view
matching_payload
internal_compliance
system_only
```

Plan which API projection returns which fields.

## 12. Data backfill and compatibility mapping

Plan how future implementation will map existing data:

```text
post-company -> company.company_name
post-country -> company.jurisdiction_country
post-registration-number -> company.registration_number
post-vessel-name -> vessel.vessel_name
post-vessel-type -> vessel.vessel_type_label / future vessel_type_value_id
post-imo -> vessel.imo_number
post-vacancy-title -> crew_request.vacancy_title and possible required_rank_label
post-department -> crew_request.crew_department
post-join-date -> crew_request.target_join_date
post-duration -> raw compatibility duration + future structured duration
post-salary-min/max -> contract_terms.salary_min/max
post-requirements -> raw compatibility notes + future structured requirement rows
```

## 13. Test plan for future implementation

Do not write tests now.

Plan future tests:

```text
migration idempotency tests
schema presence tests
API save/reload tests
legacy compatibility tests
validation error tests
visibility projection tests
matching-safe payload tests
generated artifact cleanup checks
```

## 14. Rollback/disable strategy

Even though future migrations are additive, the plan must describe:

```text
feature flags or config switches
API fallback to legacy fields
safe rollback without data deletion
how to ignore new fields if deployment fails
how to preserve existing post-vacancy behavior
```

## 15. Required first response from agent

Before writing the full report, post a short planning note:

```text
which documents will be read;
which current schema/API files will be inspected;
how schema categories will be assigned;
how API contracts will be structured;
how compatibility/backfill will be handled;
how rollback will be described;
confirmation that no UI/DB/backend/test changes will be made.
```

Wait for approval before preparing the full report.

## 16. Acceptance criteria

The task is complete when the report gives future implementation agents a clear, low-risk plan for additive schema, API contracts, validation, compatibility, tests and rollback.