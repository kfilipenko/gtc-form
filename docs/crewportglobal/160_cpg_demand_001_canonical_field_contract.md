# CPG-DEMAND-001 - Canonical Demand Field Contract

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Canonical field contract / planning report
- Source task: #31 - CPG-DEMAND-001
- Version: 1.0
- Date: 2026-05-22
- Status: Contract design only; no implementation changes

## 1. Purpose And Boundaries

This document defines the canonical demand-side field contract for future structured employer, vessel and vacancy implementation.

It converts the CPG-SEAFARER-021 demand-side normalization plan into exact field keys, field types, validations, catalog dependencies, evidence requirements, visibility scopes and future storage/API expectations.

This report does not implement UI changes, database migrations, backend/API behavior, tests, matching algorithms, scoring, publication behavior or employment-decision logic.

## 2. Sources Inspected

Approved source documents:

1. `docs/crewportglobal/161_cpg_demand_001_agent_execution_guide.md`
2. `docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md`
3. `docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md`
4. `docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md`
5. `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md`
6. `docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md`
7. `docs/crewportglobal/00_documentation_register.md`

Read-only demand-side files inspected for current field names:

1. `projects/crewportglobal/public/post-vacancy/index.html`
2. `projects/crewportglobal/public/vacancies/index.html`
3. `projects/crewportglobal/app/backend/api/public/index.php`
4. `projects/crewportglobal/app/backend/db/migrations/*.sql`

## 3. Demand Object Sections

Future API and storage work should keep demand data grouped into these five object sections:

```text
company
vessel
crew_request
contract_terms
operational_risk
```

The canonical field key is written without the object prefix inside each object. When a fully qualified key is needed in documentation, use:

```text
company.company_name
vessel.vessel_type_value_id
crew_request.required_rank_value_id
contract_terms.contract_duration_value
operational_risk.high_risk_area_flag
```

Do not collapse vessel data into vacancy text. Do not keep required COC, endorsements, STCW, visa, language or experience thresholds only inside `requirements`.

## 4. Naming Conventions

| Convention | Rule | Example |
|---|---|---|
| Canonical keys | Use lower snake_case; avoid UI ids and legacy form names. | `required_rank_value_id` |
| Object sections | Use one of `company`, `vessel`, `crew_request`, `contract_terms`, `operational_risk`. | `vessel.imo_number` |
| Catalog-backed value id | Use `_value_id` for a single reference catalog value. | `vessel_type_value_id` |
| Catalog-backed values | Use `_values` for arrays of reference catalog values. | `required_training_values` |
| Cached display label | Use `_label` for one label and `_labels` for arrays. | `required_rank_label` |
| Status fields | Use `_status` for workflow/review/calculated state. | `company_verification_status` |
| Evidence-derived fields | Use `_evidence_status` when derived from uploaded/reviewed documents. | `authority_evidence_status` |
| Calculated fields | Use explicit calculated names and keep read-only in future APIs. | `demand_readiness_status` |
| Internal/compliance fields | Keep in internal object sections or mark `internal_compliance`. | `sanctions_risk_status` |
| Public fields | Public fields must be allow-listed, not inferred from object membership. | `vacancy_title` |

## 5. Canonical Field Contract

### 5.1 Employer / Company Profile

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Employer / Company Profile | `company_name` | Company name | Legal or operating company name requesting crew. | Text | Yes | Single | None | 1-240 chars, trim whitespace | Company registration evidence recommended | employer_owner, operator_review, public_vacancy_board when published, seafarer_applicant_view | `post-company`, `employer_companies.company_name` | Existing column can remain; future API key `company.company_name`. | P0 |
| Employer / Company Profile | `company_legal_type` | Company legal type | Legal/business type of the requesting entity. | Structured enum | Yes | Single | company legal type catalog | Required for verified company; known value only | Company registration/license | employer_owner, operator_review, internal_compliance partial | `company_type` backend default/current company type | New normalized column or reference relation. | P0 |
| Employer / Company Profile | `client_role` | Client role | Commercial/operational role: shipowner, vessel operator, ship manager, crew manager, agent, employer. | Structured enum | Yes | Multiple possible | client role catalog | At least one role for matching-capable company | Authority evidence may be required by role | employer_owner, operator_review, matching_payload | `post-role` partially; not persisted as demand role today | New company role child table or JSONB compatibility field. | P0 |
| Employer / Company Profile | `registration_number` | Registration number | Company registration or license number. | Text | Yes | Single | None | 1-120 chars, trim; unique with jurisdiction where present | Company registration | employer_owner, operator_review | `post-registration-number`, `employer_companies.registration_number` | Existing column can remain. | P0 |
| Employer / Company Profile | `jurisdiction_country` | Jurisdiction country | Registration jurisdiction/country. | Country enum | Yes | Single | country catalog | ISO 3166-1 alpha-2 code | Company registration | employer_owner, operator_review, public_vacancy_board optional | `post-country`, `employer_companies.country_code` | Existing `country_code` can map to canonical key. | P0 |
| Employer / Company Profile | `representative_role` | Representative role | Role of the person acting for the company. | Structured enum | Yes | Single per company user | representative role catalog | Known role only | Representative ID / authorization | employer_owner, operator_review | `post-role-in-company`, `company_users.role_in_company` | Existing column can remain; extend catalog if needed. | P0 |
| Employer / Company Profile | `authorized_representative_name` | Authorized representative | Name of the person submitting/controlling the request. | Text | Yes | Single primary contact | None | 1-240 chars, account-linked where possible | Representative ID / authority letter | employer_owner, operator_review | `post-full-name`, account display/user data | Future company user profile field or user display mapping. | P0 |
| Employer / Company Profile | `authority_evidence_status` | Authority evidence status | Calculated review status for company/representative authority evidence. | Document-backed status | Yes | Single calculated | evidence status catalog | Derived from uploaded document review states | Company registration, license, representative ID, authorization letter | employer_owner, operator_review, matching_payload as blocker | `post-document-upload-type` documents | Calculated/read-only from `uploaded_documents`. | P0 |
| Employer / Company Profile | `company_verification_status` | Company verification status | Operator/owner verification state for the company. | Status enum | Yes | Single | verification status catalog | Must be one of unverified, submitted, verified, rejected, suspended | Evidence-backed | employer_owner, operator_review, matching_payload as blocker | `employer_companies.verification_status` | Existing column can remain; consider adding suspended later. | P0 |
| Employer / Company Profile | `billing_service_status` | Billing/service status | Internal commercial service eligibility for B2B workflow. | Internal status enum | No | Single | billing status catalog | Internal values only | Service agreement/invoice evidence later | employer_owner limited, operator_review, internal_compliance | Missing | New internal column or service account table later. | P2 |
| Employer / Company Profile | `sanctions_risk_status` | Sanctions/risk status | Internal compliance screening status. | Internal status enum | No for MVP | Single | risk status catalog | Internal values only; no public leakage | Compliance evidence if flagged | operator_review restricted, internal_compliance, system_only | Missing | New compliance table/status later. | P2 |

### 5.2 Vessel Profile

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Vessel Profile | `vessel_name` | Vessel name | Vessel name or operational vessel label. | Text | Yes when known | Single | None | 1-240 chars | Registry evidence optional | employer_owner, operator_review, public_vacancy_board if approved, seafarer_applicant_view if approved | `post-vessel-name`, `vessels.vessel_name` | Existing column can remain. | P0 |
| Vessel Profile | `imo_number` | IMO number | Seven-digit IMO vessel identifier. | Validated identifier | Yes where known | Single | None | Exactly 7 digits; future checksum optional | Registry evidence recommended | employer_owner, operator_review, public optional, matching_payload | `post-imo`, `vessels.imo_number` | Existing column can remain; normalize away `IMO` prefix in input. | P0 |
| Vessel Profile | `flag_country_code` | Flag | Vessel flag state. | Country enum | Later | Single | country catalog | ISO 3166-1 alpha-2 code | Registry evidence optional | employer_owner, operator_review, public optional, matching_payload | `vessels.flag_country_code`; not in current post form | Existing column exists; future UI/API field. | P1 |
| Vessel Profile | `vessel_type_value_id` | Vessel type value | Canonical vessel type reference. | Catalog enum | Yes | Single | vessel type catalog | Valid reference value id | Optional | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-vessel-type`, `vessels.vessel_type`, `vacancy_requests.vessel_type` | New reference relation; keep text label compatibility. | P0 |
| Vessel Profile | `vessel_type_label` | Vessel type label | Cached human-readable vessel type. | Text label | Yes | Single | Derived from vessel type catalog | Must match catalog label when value id present | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-vessel-type` | Cached display field or API projection. | P0 |
| Vessel Profile | `vessel_verification_status` | Vessel verification status | Operator review state for vessel identity and particulars. | Status enum | Yes | Single | verification status catalog | Known status only | Registry/management evidence if required | employer_owner, operator_review, matching_payload as blocker | Missing | New column or vessel verification table. | P0 |
| Vessel Profile | `gross_tonnage` | Gross tonnage | Vessel gross tonnage. | Number | No | Single | None | Integer or decimal >= 0 | Registry evidence optional | employer_owner, operator_review, matching_payload; public optional | Missing | New vessel column. | P1 |
| Vessel Profile | `deadweight_tonnage` | Deadweight | Vessel DWT. | Number | No | Single | None | Integer or decimal >= 0 | Registry evidence optional | employer_owner, operator_review, matching_payload; public optional | Missing | New vessel column. | P1 |
| Vessel Profile | `engine_type` | Engine type | Main propulsion/engine type category. | Structured enum | No | Single | engine type catalog | Known value or operator-approved text fallback | Optional | employer_owner, operator_review, matching_payload | Missing | New vessel column/reference. | P1 |
| Vessel Profile | `engine_power_kw` | Engine power kW | Main engine power in kW. | Number | No | Single | None | Number >= 0 | Optional | employer_owner, operator_review, matching_payload | Missing | New vessel column. | P1 |
| Vessel Profile | `main_engine_model` | Main engine model | Manufacturer/model text for main engine. | Text | No | Single | None | 1-240 chars | Optional | employer_owner, operator_review | Missing | New vessel text column or JSONB compatibility. | P2 |
| Vessel Profile | `year_built` | Year built | Year vessel was built. | Number/year | No | Single | None | 4-digit year; not future beyond current year | Registry evidence optional | employer_owner, operator_review, public optional | Missing | New vessel column. | P2 |
| Vessel Profile | `trading_area_values` | Trading areas | Operating/trading areas for the request. | Multi-select enum | No | Multiple | trading area catalog | Valid value ids | Optional | employer_owner, operator_review, seafarer_applicant_view summarized, matching_payload | Missing | New child table or JSONB array. | P1 |
| Vessel Profile | `route_region_values` | Route regions | Region/route tags relevant to visa/language/risk. | Multi-select enum | No | Multiple | route region catalog | Valid value ids | Optional | employer_owner, operator_review, seafarer_applicant_view summarized, matching_payload | Missing | New child table or JSONB array. | P1 |
| Vessel Profile | `class_society` | Class society | Classification society name/code. | Structured enum/text | No | Single | class society catalog later | Known value or text fallback | Registry/class evidence optional | employer_owner, operator_review | Missing | New vessel column/reference. | P2 |
| Vessel Profile | `ism_manager_name` | ISM manager | ISM manager if different from employer. | Text | No | Single | None | 1-240 chars | Management evidence optional | employer_owner, operator_review, internal_compliance optional | Missing | New vessel/compliance field. | P2 |
| Vessel Profile | `safe_manning_evidence_status` | Safe manning evidence | Review status for safe manning / crew complement evidence. | Document-backed status | No | Single calculated | evidence status catalog | Derived from document review | Safe manning certificate / crew matrix | employer_owner, operator_review, matching_payload blocker if required | Missing | Calculated from future uploaded document type. | P2 |

### 5.3 Crew Request / Vacancy Requirement

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Crew Request / Vacancy Requirement | `vacancy_title` | Vacancy title | Human-readable title for public/operator display. | Text | Yes | Single | None | 1-240 chars | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view | `post-vacancy-title`, `vacancy_requests.vacancy_title` | Existing column can remain; not canonical rank. | P0 |
| Crew Request / Vacancy Requirement | `required_rank_value_id` | Required rank value | Canonical required rank. | Catalog enum | Yes | Single | rank catalog | Valid reference value id | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-vacancy-title`, `vacancy_requests.rank` text | New reference relation; current rank text maps as fallback. | P0 |
| Crew Request / Vacancy Requirement | `required_rank_label` | Required rank label | Cached required rank label. | Text label | Yes | Single | rank catalog | Matches catalog label when value id present | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-vacancy-title`, `vacancy_requests.rank` | Cached display field/API projection. | P0 |
| Crew Request / Vacancy Requirement | `crew_department` | Crew department | Required crew department. | Structured enum | Yes | Single | department catalog | Known department code | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-department`, `vacancy_requests.department` | Existing column can remain; align taxonomy with seafarer side. | P0 |
| Crew Request / Vacancy Requirement | `number_of_positions` | Number of positions | Number of crew positions requested for this requirement. | Number | Yes | Single | None | Integer >= 1 | No | employer_owner, operator_review, public optional, matching_payload | Missing | New vacancy column. | P0 |
| Crew Request / Vacancy Requirement | `earliest_join_date` | Earliest join date | Earliest acceptable joining date. | Date | Yes | Single | None | Date <= target/latest when present | No | employer_owner, operator_review, seafarer_applicant_view, matching_payload | Missing | New vacancy column. | P0 |
| Crew Request / Vacancy Requirement | `target_join_date` | Target join date | Preferred joining date. | Date | Yes | Single | None | Between earliest/latest when present | No | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-join-date`, `vacancy_requests.join_date` | Existing `join_date` maps to target. | P0 |
| Crew Request / Vacancy Requirement | `latest_join_date` | Latest join date | Latest acceptable joining date. | Date | Yes | Single | None | Date >= target/earliest when present | No | employer_owner, operator_review, seafarer_applicant_view, matching_payload | Missing | New vacancy column. | P0 |
| Crew Request / Vacancy Requirement | `joining_port` | Joining port | Port/location where candidate joins vessel. | Port catalog/text | No | Single | port catalog later | Valid port id or controlled text fallback | Optional | employer_owner, operator_review, seafarer_applicant_view if approved, matching_payload | Missing | New reference relation or JSONB compatibility. | P1 |
| Crew Request / Vacancy Requirement | `sign_off_port` | Sign-off port | Expected sign-off port/location. | Port catalog/text | No | Single | port catalog later | Valid port id or controlled text fallback | Optional | employer_owner, operator_review, seafarer_applicant_view if approved | Missing | New reference relation or JSONB compatibility. | P2 |
| Crew Request / Vacancy Requirement | `required_vessel_type_values` | Required vessel types | Vessel type requirement/preference for candidate experience. | Multi-select enum | Yes | Multiple | vessel type catalog | Valid value ids; each item can be required or preferred | Optional | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-vessel-type`, `vacancy_requests.vessel_type` | New child table/JSON array; current text maps as one required value. | P0 |
| Crew Request / Vacancy Requirement | `required_coc_values` | Required COC | Required certificate of competency. | Document-backed multi-select enum | Yes | Multiple | COC catalog | Valid value ids; active/non-expired candidate certificate later | Candidate evidence on supply side | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-requirements` free text | New requirement child table. | P0 |
| Crew Request / Vacancy Requirement | `required_endorsement_values` | Required endorsements | Required endorsements for vessel/operation. | Document-backed multi-select enum | Yes where applicable | Multiple | endorsement catalog | Valid value ids; active/non-expired candidate endorsement later | Candidate evidence on supply side | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-requirements` free text | New requirement child table. | P0 |
| Crew Request / Vacancy Requirement | `required_training_values` | Required STCW/training | Required STCW or other training courses. | Document-backed multi-select enum | Yes where applicable | Multiple | STCW/training catalog | Valid value ids; active/non-expired candidate training later | Candidate evidence on supply side | employer_owner, operator_review, public_vacancy_board, seafarer_applicant_view, matching_payload | `post-requirements` free text | New requirement child table. | P0 |
| Crew Request / Vacancy Requirement | `required_visa_values` | Required visas | Visa categories/status required for route/joining. | Multi-select enum | No | Multiple | visa category catalog | Valid value ids; route relevance reviewed | Candidate evidence on supply side | employer_owner, operator_review, seafarer_applicant_view, matching_payload | `post-requirements` free text | New requirement child table. | P1 |
| Crew Request / Vacancy Requirement | `required_language_levels` | Required languages | Required language and maritime English levels. | Multi-select enum + level | No | Multiple | language and level catalog | Valid language id and level code | Candidate evidence optional | employer_owner, operator_review, public/applicant when approved, matching_payload | Missing/free text | New requirement child table. | P1 |
| Crew Request / Vacancy Requirement | `required_medical_validity_days` | Medical validity days | Minimum remaining medical certificate validity. | Number | Yes | Single | None | Integer >= 0 | Candidate medical certificate evidence only | employer_owner, operator_review, seafarer_applicant_view summarized, matching_payload | `post-requirements` implicit | New vacancy requirement field. | P0 |
| Crew Request / Vacancy Requirement | `required_passport_validity_days` | Passport validity days | Minimum remaining passport validity. | Number | Yes | Single | None | Integer >= 0 | Candidate passport evidence only | employer_owner, operator_review, seafarer_applicant_view summarized, matching_payload | `post-requirements` implicit | New vacancy requirement field. | P0 |
| Crew Request / Vacancy Requirement | `required_seaman_book_validity_days` | Seaman book validity days | Minimum remaining seaman book validity. | Number | Yes | Single | None | Integer >= 0 | Candidate seaman book evidence only | employer_owner, operator_review, seafarer_applicant_view summarized, matching_payload | `post-requirements` implicit | New vacancy requirement field. | P0 |
| Crew Request / Vacancy Requirement | `required_sea_service_months` | Required sea service | Minimum sea-service months/years by rank, vessel type or department. | Structured requirement list | No | Multiple | rank/vessel type catalogs | Non-negative integer months with dimension keys | Candidate sea-service records | employer_owner, operator_review, matching_payload; applicant summary if approved | `post-requirements` free text | New child table. | P1 |
| Crew Request / Vacancy Requirement | `must_have_requirements` | Must-have requirements | Additional required criteria not represented by dedicated fields. | Structured list + notes | Yes | Multiple | Requirement type catalog where filterable | Each item typed as blocker or text note | Evidence depends on item | employer_owner, operator_review, public/applicant when approved, matching_payload if structured | `post-requirements` free text | JSONB compatibility plus future child table. | P0/P1 |
| Crew Request / Vacancy Requirement | `nice_to_have_requirements` | Nice-to-have requirements | Criteria used for soft scoring or operator preference. | Structured list + notes | No | Multiple | Requirement type catalog where scored | Each item typed as score or text note | Evidence depends on item | employer_owner, operator_review, public/applicant when approved, matching_payload if structured | `post-requirements` free text | JSONB compatibility plus future child table. | P1 |
| Crew Request / Vacancy Requirement | `disqualifying_requirements` | Disqualifying requirements | Criteria that exclude candidates if true/missing. | Structured list + notes | No | Multiple | Requirement type catalog | Each item must name condition and evidence basis | Evidence depends on item | employer_owner, operator_review, matching_payload; public only if approved | `post-requirements` free text | JSONB compatibility plus future child table. | P1 |

### 5.4 Contract Terms

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Contract Terms | `salary_min` | Salary minimum | Minimum offered salary. | Number | Yes | Single | None | >= 0; <= salary_max when both present | No | employer_owner, operator_review, public/applicant if approved, matching_payload | `post-salary-min`, `vacancy_requests.salary_min_usd` | Existing USD field maps to canonical; future currency-aware field. | P0 |
| Contract Terms | `salary_max` | Salary maximum | Maximum offered salary. | Number | Yes | Single | None | >= 0; >= salary_min when both present | No | employer_owner, operator_review, public/applicant if approved, matching_payload | `post-salary-max`, `vacancy_requests.salary_max_usd` | Existing USD field maps to canonical; future currency-aware field. | P0 |
| Contract Terms | `currency` | Currency | Salary currency. | Currency enum | Yes | Single | currency catalog | ISO 4217 uppercase code | No | employer_owner, operator_review, public/applicant if salary visible, matching_payload | `vacancy_requests.currency` default USD | Existing column can remain. | P0 |
| Contract Terms | `salary_negotiable` | Salary negotiable | Whether salary range is negotiable. | Boolean | No | Single | true/false | Boolean | No | employer_owner, operator_review, applicant if approved, matching_payload | Missing | New vacancy/contract field. | P1 |
| Contract Terms | `contract_duration_value` | Contract duration value | Numeric duration value. | Number | Yes | Single | None | > 0 | No | employer_owner, operator_review, public/applicant, matching_payload | `post-duration`, `vacancy_requests.contract_duration` text | New structured field; current text maps to compatibility note. | P0 |
| Contract Terms | `contract_duration_unit` | Contract duration unit | Unit for contract duration. | Structured enum | Yes | Single | duration unit catalog | Known unit: days, weeks, months | No | employer_owner, operator_review, public/applicant, matching_payload | `post-duration` text | New structured field. | P0 |
| Contract Terms | `rotation_pattern` | Rotation pattern | Rotation such as 4 on / 2 off or single contract. | Structured enum/text pair | No | Single | rotation pattern catalog | Known pattern or operator-approved text | No | employer_owner, operator_review, applicant if approved, matching_payload | Missing | New contract field. | P1 |
| Contract Terms | `travel_terms` | Travel terms | Travel arrangement summary. | Enum + notes | No | Multiple/structured group | travel terms catalog later | Known value or text note | Optional | employer_owner, operator_review, applicant if approved | Missing | JSONB compatibility or contract child table. | P2 |
| Contract Terms | `repatriation_terms` | Repatriation terms | Repatriation arrangement summary. | Enum + notes | No | Multiple/structured group | repatriation catalog later | Known value or text note | Optional | employer_owner, operator_review, applicant if approved | Missing | JSONB compatibility or contract child table. | P2 |
| Contract Terms | `leave_terms` | Leave terms | Leave/vacation terms. | Enum + notes | No | Multiple/structured group | leave terms catalog later | Known value or text note | Optional | employer_owner, operator_review, applicant if approved | Missing | JSONB compatibility or contract child table. | P2 |
| Contract Terms | `overtime_bonus_allowance_notes` | Overtime/bonus/allowances | Human-readable compensation notes. | Free text | No | Single | None | Max length, safe text | Optional | employer_owner, operator_review, applicant if approved | Missing | JSONB compatibility or text column later. | P2 |
| Contract Terms | `cba_reference` | CBA reference | Collective bargaining agreement reference if applicable. | Reference/text | No | Single | CBA reference catalog later | Max length; optional document link later | Optional | employer_owner, operator_review, applicant if approved | Missing | Future document/reference relation. | P2 |
| Contract Terms | `sea_reference` | SEA reference | Seafarer Employment Agreement reference if applicable. | Reference/text | No | Single | SEA reference catalog later | Max length; optional document link later | Optional | employer_owner, operator_review, internal/applicant if approved | Missing | Future document/reference relation. | P2 |

### 5.5 Operational / Legal / Risk Requirements

| Object | Canonical field key | Label | Description | Type | Required for MVP | Single/multiple | Allowed values / catalog | Validation | Evidence required | Visibility | Current source field | Future storage/API note | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Operational / Legal / Risk Requirements | `special_operation_tags` | Special operation tags | Operation types such as tanker, offshore, passenger, DP, polar, crane, hazardous cargo. | Multi-select enum | No | Multiple | special operation tag catalog | Valid value ids | Optional, depends on tag | employer_owner, operator_review, applicant when approved, matching_payload | `post-requirements` free text | New child table/JSONB compatibility. | P1 |
| Operational / Legal / Risk Requirements | `cargo_type_values` | Cargo types | Cargo categories relevant to vessel/operation. | Multi-select enum | No | Multiple | cargo type catalog | Valid value ids | Optional | employer_owner, operator_review, applicant if approved, matching_payload | Missing/free text | New child table/JSONB compatibility. | P2 |
| Operational / Legal / Risk Requirements | `high_risk_area_flag` | High-risk area flag | Indicates war/piracy/high-risk area involvement. | Boolean | No | Single | true/false | Boolean | Evidence/route confirmation if true | employer_owner limited, operator_review, internal_compliance, matching_payload as blocker | Missing | New internal risk field. | P1 |
| Operational / Legal / Risk Requirements | `trading_area_risk_status` | Trading area risk status | Risk status for trading area/route. | Internal status enum | No | Single | risk status catalog | Known status only | Risk evidence if flagged | operator_review, internal_compliance, system_only; applicant summary only if approved | Missing | New risk/compliance field. | P1 |
| Operational / Legal / Risk Requirements | `sanctions_or_client_restrictions` | Sanctions/client restrictions | Internal restrictions affecting candidate eligibility or client service. | Internal structured list | No | Multiple | restriction type catalog later | Internal values only | Compliance evidence if flagged | internal_compliance, system_only, restricted operator | Missing | New compliance child table. | P2 |
| Operational / Legal / Risk Requirements | `flag_state_requirements` | Flag-state requirements | Flag-state or regulatory requirements beyond normal certificates. | Structured list + notes | No | Multiple | requirement type catalog later | Typed item with optional text | Evidence if required | employer_owner, operator_review, matching_payload if structured; public/applicant if approved | Missing/free text | JSONB compatibility plus future child table. | P2 |
| Operational / Legal / Risk Requirements | `client_specific_requirements` | Client-specific requirements | Client-specific requirements not otherwise captured. | Structured list + notes | No | Multiple | requirement type catalog later | Typed item with visibility flag | Evidence if required | employer_owner, operator_review, matching_payload if structured; public/applicant if approved | `post-requirements` free text | JSONB compatibility plus future child table. | P2 |
| Operational / Legal / Risk Requirements | `internal_operator_notes` | Internal operator notes | Internal demand review notes not visible publicly. | Free text | No | Multiple notes | None | Safe text; no forbidden personal data | Optional | operator_review, internal_compliance | Missing/operator review history separate | Future operator review notes table; not public. | P2 |

## 6. Reference Catalog Plan

| Catalog | Needed for fields | Status | Notes |
|---|---|---|---|
| Rank catalog | `required_rank_value_id`, `required_rank_label` | Already exists on seafarer/reference side; demand binding needed | Must align with seafarer rank catalog. |
| Department catalog | `crew_department` | Exists as hard-coded values; needs cleanup/alignment | Align `hotel`, `catering`, `other` between supply and demand. |
| Vessel type catalog | `vessel_type_value_id`, `required_vessel_type_values` | Already exists on seafarer/reference side; demand binding needed | Use shared catalog for vessel profile and crew request. |
| Country catalog | `jurisdiction_country`, `flag_country_code` | Exists implicitly through country codes; catalog/reference may be needed | Validate ISO alpha-2. |
| Port catalog | `joining_port`, `sign_off_port` | Must be created later or external standard used | Could later use UN/LOCODE or controlled internal list. |
| COC catalog | `required_coc_values` | Exists on seafarer/reference side; demand binding needed | Must support equivalence/operator override later. |
| Endorsement catalog | `required_endorsement_values` | Exists on seafarer/reference side; demand binding needed | Include tanker/passenger/special endorsements. |
| STCW/training catalog | `required_training_values` | Exists on seafarer/reference side; demand binding needed | Must match seafarer training records. |
| Visa category catalog | `required_visa_values` | Must be created or cleaned up later | Link to route/trading area where possible. |
| Language and level catalog | `required_language_levels` | Must be created later | Include Maritime English and level scale. |
| Currency catalog | `currency` | Exists as ISO code convention; can use external standard | Validate ISO 4217. |
| Contract duration unit catalog | `contract_duration_unit` | Must be created later | Values: day, week, month. |
| Rotation pattern catalog | `rotation_pattern` | Must be created later | Include common maritime rotations and custom note fallback. |
| Special operation tag catalog | `special_operation_tags` | Must be created later | Tanker, offshore, passenger, DP, polar, crane, hazardous cargo. |
| Cargo type catalog | `cargo_type_values` | Must be created later | Useful for tanker/dangerous cargo. |
| Risk status catalog | `sanctions_risk_status`, `trading_area_risk_status` | Must be created later | Internal/compliance only. |
| Verification status catalog | Company/vessel/evidence status fields | Exists partially; needs cleanup | Company status exists; vessel/evidence status need contract. |

## 7. Validation Plan

| Validation area | Fields | Rule |
|---|---|---|
| IMO number | `imo_number` | Exactly seven digits after removing optional `IMO` prefix/spaces; future checksum can be added. |
| Country code | `jurisdiction_country`, `flag_country_code` | ISO 3166-1 alpha-2 uppercase code. |
| Currency | `currency` | ISO 4217 uppercase code; default may remain USD where not supplied. |
| Salary range | `salary_min`, `salary_max` | Values >= 0; `salary_max >= salary_min` when both present. |
| Date windows | `earliest_join_date`, `target_join_date`, `latest_join_date` | `earliest <= target <= latest` when all present; target required for MVP. |
| Contract duration | `contract_duration_value`, `contract_duration_unit` | Value > 0; unit in duration unit catalog. |
| GT/DWT | `gross_tonnage`, `deadweight_tonnage` | Numeric values >= 0. |
| Engine power | `engine_power_kw` | Numeric value >= 0. |
| Required validity days | `required_medical_validity_days`, `required_passport_validity_days`, `required_seaman_book_validity_days` | Integer >= 0; use calculated document expiry comparison later. |
| Number of positions | `number_of_positions` | Integer >= 1. |
| Catalog value IDs | All `_value_id` and `_values` fields | Must refer to active reference catalog values; label fields are display/cache only. |
| Status fields | All `_status` fields | Must be one of the approved status catalog values for that field. |
| Free-text notes | `overtime_bonus_allowance_notes`, internal notes, requirement notes | Max length, safe text, no personal/sensitive data outside approved scope. |

## 8. Visibility Plan

Approved demand contract visibility scopes:

```text
employer_owner
operator_review
public_vacancy_board
seafarer_applicant_view
matching_payload
internal_compliance
system_only
```

| Field group | Visibility classification |
|---|---|
| Company public identity | `employer_owner`, `operator_review`, optional `public_vacancy_board`, optional `seafarer_applicant_view` |
| Company registration and representative authority | `employer_owner`, `operator_review`; not public by default |
| Billing/service status | `employer_owner` limited, `operator_review`, `internal_compliance`; not public/matching by default |
| Sanctions/risk status | `internal_compliance`, `system_only`, restricted `operator_review`; never public |
| Vessel name/type | `employer_owner`, `operator_review`, `public_vacancy_board` if published, `seafarer_applicant_view`, `matching_payload` |
| IMO/flag/particulars | `employer_owner`, `operator_review`, `matching_payload`; public/applicant only if approved |
| Required rank/department/qualification requirements | `employer_owner`, `operator_review`, `public_vacancy_board`, `seafarer_applicant_view`, `matching_payload` |
| Join window and contract basics | `employer_owner`, `operator_review`, applicant/public when approved, `matching_payload` |
| Salary range | `employer_owner`, `operator_review`, applicant/public only if approved, `matching_payload` |
| Special operations | `employer_owner`, `operator_review`, `matching_payload`; public/applicant only if not risk-sensitive and approved |
| High-risk area and compliance restrictions | `operator_review`, `internal_compliance`, `system_only`; applicant/public only through approved safe summary if required |
| Internal operator notes | `operator_review`, `internal_compliance`; never public or matching payload unless converted to structured safe field |

## 9. Compatibility Mapping

| Current UI/API/source field | Current meaning | Canonical mapping | Compatibility note |
|---|---|---|---|
| `post-email` | Employer contact/account email | Account/user identity, not canonical demand field | Do not use as matching demand data. |
| `post-full-name` | Representative/display name | `company.authorized_representative_name` | Future account/company-user profile source. |
| `post-role` | Public role path / account role selection | `company.client_role` partial | Current value should not replace company legal type. |
| `post-role-in-company` | Representative role in company | `company.representative_role` | Existing `company_users.role_in_company`. |
| `post-company` | Company name | `company.company_name` | Existing `employer_companies.company_name`. |
| `post-country` | Company country code | `company.jurisdiction_country` | Existing `employer_companies.country_code`. |
| `post-registration-number` | Company registration number | `company.registration_number` | Existing `employer_companies.registration_number`. |
| `post-vessel-name` | Vessel name | `vessel.vessel_name` | Existing `vessels.vessel_name`. |
| `post-vessel-type` | Vessel type text/datalist | `vessel.vessel_type_label`; future `vessel.vessel_type_value_id`; also `crew_request.required_vessel_type_values` when used as requirement | Current text is ambiguous between vessel profile and requirement. |
| `post-imo` | IMO number | `vessel.imo_number` | Normalize optional `IMO` prefix before validation in future. |
| `post-vacancy-title` | Vacancy title / rank text | `crew_request.vacancy_title`; future `crew_request.required_rank_label` only when selected as rank | Must split title from canonical rank. |
| `post-department` | Department | `crew_request.crew_department` | Align taxonomy with seafarer side. |
| `post-join-date` | Joining date | `crew_request.target_join_date` | Future earliest/latest dates should surround this. |
| `post-duration` | Contract duration text | `contract_terms.contract_duration_value`, `contract_terms.contract_duration_unit`; compatibility note for raw text | Current text cannot be used for automated comparison. |
| `post-salary-min` | Salary minimum USD | `contract_terms.salary_min` | Existing value assumes current/default currency. |
| `post-salary-max` | Salary maximum USD | `contract_terms.salary_max` | Existing range validation remains conceptually valid. |
| `post-requirements` | Free-text key requirements | `crew_request.must_have_requirements`, `nice_to_have_requirements`, `disqualifying_requirements`, qualification/visa/language/special-operation fields after operator structuring | Must not remain the only source for blockers/scoring. |
| `post-document-upload-type` | Employer authority evidence upload type | `company.authority_evidence_status` source documents | Existing types: company registration, company license, representative ID. |

## 10. Future Storage/API Mapping

| Group | Likely future storage/API shape | Reason |
|---|---|---|
| Company identity | Existing `employer_companies` columns plus additive columns/reference fields | Current foundation already stores company name, registration, country and status. |
| Company roles and representatives | Existing `company_users` plus possible representative profile/evidence fields | Authority and representative scope are per user/company relationship. |
| Authority evidence status | Calculated/read-only from `uploaded_documents` review state | Avoid duplicating document truth; expose status projection. |
| Billing and sanctions risk | New internal/compliance table or columns | Internal scope and audit requirements differ from public demand fields. |
| Vessel identity | Existing `vessels` plus additive particulars columns | Vessel identity already separated from vacancy. |
| Vessel catalog fields | Reference table relation plus cached label | Align with seafarer vessel catalog and public display. |
| Crew request rank/department/join window | Additive columns/reference relation on `vacancy_requests` | Core one-to-one request fields. |
| Qualification requirements | New child table or structured JSONB compatibility field | Multiple required COC/endorsement/training records with required/preferred flags. |
| Document validity rules | Additive columns or child rows by document type | Multiple document validity checks are calculated later. |
| Sea-service requirements | New child table | Multiple thresholds by rank/vessel type/department. |
| Contract terms | Additive columns plus optional JSONB compatibility notes | Basic contract fields are one-to-one; notes are flexible. |
| Operational/risk tags | New child table or JSONB compatibility field | Multiple tags and internal visibility rules. |
| Matching payload | Calculated/read-only API projection | Must be allow-listed and separate from raw employer/vacancy records. |

## 11. Acceptance Checklist

| Requirement | Status |
|---|---|
| Naming conventions defined | Met |
| Canonical field table included for all required objects | Met |
| Employer / Company Profile fields covered | Met |
| Vessel Profile fields covered | Met |
| Crew Request / Vacancy Requirement fields covered | Met |
| Contract Terms fields covered | Met |
| Operational / Legal / Risk Requirements fields covered | Met |
| Reference catalog plan included | Met |
| Validation plan included | Met |
| Visibility plan included | Met |
| Compatibility mapping included | Met |
| Future storage/API mapping included | Met |
| No UI changes | Met |
| No DB migrations | Met |
| No backend/API changes | Met |
| No test changes | Met |
| No matching/scoring implementation | Met |
| No publication or employment-decision logic | Met |

