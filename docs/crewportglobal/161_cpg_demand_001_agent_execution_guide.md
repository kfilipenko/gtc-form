# CPG-DEMAND-001 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/31
- Status: Published for contract-design plan and execution

## 1. Executive instruction

This is a canonical demand field contract task.

Do not implement UI changes, database migrations, backend/API behavior, tests, matching algorithms, scoring, publication behavior or employment decision logic.

The goal is to produce an exact field contract for future implementation of structured demand-side data.

## 2. Business reason

CPG-SEAFARER-021 established the demand-side normalization plan.

CPG-DEMAND-001 must now define exact canonical field keys, types, validations, catalogs, evidence requirements, visibility scopes and future storage/API expectations for:

```text
Employer / Company Profile
Vessel Profile
Crew Request / Vacancy Requirement
Contract Terms
Operational / Legal / Risk Requirements
```

This contract will be used later to build UI, database migrations, API payloads and validation rules without ambiguity.

## 3. Required source documents

Read first:

```text
docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md
docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
docs/crewportglobal/00_documentation_register.md
```

Inspect current demand-side files only as needed for current field names:

```text
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/vacancies/index.html
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/db/migrations/*.sql
```

## 4. Required deliverable

Create:

```text
docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md
```

Update the documentation register if active.

## 5. Contract naming conventions

The report must define naming conventions for:

```text
canonical field keys
object prefixes or object sections
catalog-backed value fields
human-readable label fields
document-backed status fields
calculated fields
internal/compliance fields
public vs internal fields
```

Example convention direction:

```text
required_rank_value_id — canonical catalog-backed value
required_rank_label — human-readable label cached for display
vessel_type_value_id — canonical catalog-backed vessel type
authority_evidence_status — calculated/reviewed status
```

## 6. Required canonical field table

For every canonical field, use this table shape:

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## 7. Required object coverage

### 7.1 Employer / Company Profile

At minimum include:

```text
company_name
company_legal_type
client_role
registration_number
jurisdiction_country
representative_role
authorized_representative_name
authority_evidence_status
company_verification_status
billing_service_status
sanctions_risk_status
```

### 7.2 Vessel Profile

At minimum include:

```text
vessel_name
imo_number
flag_country_code
vessel_type_value_id
vessel_type_label
vessel_verification_status
gross_tonnage
deadweight_tonnage
engine_type
engine_power_kw
main_engine_model
year_built
trading_area_values
route_region_values
class_society
ism_manager_name
safe_manning_evidence_status
```

### 7.3 Crew Request / Vacancy Requirement

At minimum include:

```text
vacancy_title
required_rank_value_id
required_rank_label
crew_department
number_of_positions
earliest_join_date
target_join_date
latest_join_date
joining_port
sign_off_port
required_vessel_type_values
required_coc_values
required_endorsement_values
required_training_values
required_visa_values
required_language_levels
required_medical_validity_days
required_passport_validity_days
required_seaman_book_validity_days
required_sea_service_months
must_have_requirements
nice_to_have_requirements
disqualifying_requirements
```

### 7.4 Contract Terms

At minimum include:

```text
salary_min
salary_max
currency
salary_negotiable
contract_duration_value
contract_duration_unit
rotation_pattern
travel_terms
repatriation_terms
leave_terms
overtime_bonus_allowance_notes
cba_reference
sea_reference
```

### 7.5 Operational / Legal / Risk Requirements

At minimum include:

```text
special_operation_tags
cargo_type_values
high_risk_area_flag
trading_area_risk_status
sanctions_or_client_restrictions
flag_state_requirements
client_specific_requirements
internal_operator_notes
```

## 8. Reference catalog plan

Define catalog need and status for at least:

```text
rank catalog
department catalog
vessel type catalog
country catalog
port catalog
COC catalog
endorsement catalog
STCW/training catalog
visa category catalog
language and level catalog
currency catalog
contract duration unit catalog
rotation pattern catalog
special operation tag catalog
cargo type catalog
risk status catalog
verification status catalog
```

For each catalog, state:

```text
already exists
exists but needs cleanup
must be created later
can use external standard/reference later
```

## 9. Validation plan

Specify validation for at least:

```text
IMO number
country code
currency
salary range
date windows
contract duration
GT/DWT
engine power
required validity days
number of positions
catalog value IDs
```

## 10. Visibility plan

Use these scopes:

```text
employer_owner
operator_review
public_vacancy_board
seafarer_applicant_view
matching_payload
internal_compliance
system_only
```

Classify every important field.

## 11. Compatibility mapping

Map current `/post-vacancy/` fields to canonical demand fields:

```text
post-email
post-full-name
post-role
post-role-in-company
post-company
post-country
post-registration-number
post-vessel-name
post-vessel-type
post-imo
post-vacancy-title
post-department
post-join-date
post-duration
post-salary-min
post-salary-max
post-requirements
post-document-upload-type
```

## 12. Future storage/API mapping

Do not implement storage/API changes.

But the report should propose whether each group is likely to become:

```text
new relational column
new child table
JSONB compatibility field
reference table relation
calculated/read-only field
document-backed status derived from upload review
```

## 13. Boundaries

Do not implement:

```text
UI changes
DB migrations
backend/API changes
test changes
matching/scoring implementation
publication behavior changes
employment decision logic
Stripe/OpenClaw/nginx/systemd/deployment changes
```

## 14. Required first response from agent

Before writing the full report, post a short contract-design plan:

```text
which documents will be read;
which current demand-side files will be inspected;
how canonical field keys will be organized;
how catalogs and validation will be represented;
how compatibility mapping will be prepared;
confirmation that no UI/DB/backend/test changes will be made.
```

Wait for approval before preparing the full report.

## 15. Acceptance criteria

The task is complete when the report defines a clear canonical demand field contract that future implementation tasks can use to build UI fields, database schema, API payloads and validation rules without ambiguity.