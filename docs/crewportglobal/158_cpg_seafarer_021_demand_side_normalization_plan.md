# CPG-SEAFARER-021 — Demand-Side Normalization Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Planning / field-normalization report
- Source task: #30 — CPG-SEAFARER-021
- Version: 1.0
- Date: 2026-05-22
- Status: Planning report; no implementation changes

## 1. Purpose And Boundaries

This report converts the CPG-SEAFARER-020 supply-demand matching model into a concrete demand-side normalization plan.

The purpose is to define the structured employer, vessel and crew-request data model required before CrewPortGlobal can safely implement automated matching.

This is a planning-only document. It does not implement UI changes, database migrations, backend/API changes, tests, matching algorithms, scoring, publication behavior or employment decision logic.

## 2. Sources Inspected

Approved source documents:

1. `docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md`
2. `docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md`
3. `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md`
4. `docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md`
5. `docs/crewportglobal/00_documentation_register.md`
6. `docs/crewportglobal/159_cpg_seafarer_021_agent_execution_guide.md`

Read-only code/schema inspection:

1. `projects/crewportglobal/public/post-vacancy/index.html`
2. `projects/crewportglobal/public/vacancies/index.html`
3. `projects/crewportglobal/app/backend/api/public/index.php`
4. `projects/crewportglobal/app/backend/db/migrations/*.sql`

## 3. Current Demand-Side State

The current demand-side implementation already separates the basic records:

| Current object | Current table/source | Existing fields | Current limitation |
|---|---|---|---|
| Employer / company | `employer_companies`, `company_users`, `/post-vacancy/` | Company name, company type, registration number, country, representative role, verification status, primary contact relationship | Billing/service status, risk/sanctions status and authority scope are not structured |
| Vessel | `vessels`, `/post-vacancy/` | Vessel name, IMO number, vessel type, flag country code | Vessel particulars and vessel verification status are not structured |
| Vacancy / crew request | `vacancy_requests`, `/post-vacancy/` | Vacancy title, rank, department, vessel type, join date, salary min/max, currency, contract duration text, requirements text, publication status | Core matching requirements remain inside free-text `requirements` |
| Public vacancy board | `/vacancies/`, `GET /api/v1/vacancies` | Published vacancy title/rank, company, vessel, join date, duration, salary and requirements | Public view is read-only and does not expose internal demand normalization |
| Employer candidate pipeline | `/post-vacancy/`, presented-candidate payload | Presented candidate summary and minimized document summary | Depends on approval guard; no matching algorithm exists |

The main demand-side weakness is not missing free text. The weakness is that legally and operationally important matching criteria are not yet normalized into filterable, reviewable and evidence-aware fields.

## 4. Target Demand-Side Object Model

The normalized demand model must keep five objects separate.

### 4.1 Employer / Company Profile

Employer/company profile identifies who is requesting crew and whether the request is legitimate.

Target responsibilities:

1. Identify legal entity and authorized representatives.
2. Record company verification and authority evidence.
3. Separate public/company-facing facts from internal risk, billing and compliance state.
4. Gate publication/matching when the company is not verified.

### 4.2 Vessel Profile

Vessel profile identifies the vessel or vessel class for which crew is requested.

Target responsibilities:

1. Store vessel identity and particulars independently from vacancy notes.
2. Support vessel verification and IMO/flag checks.
3. Provide structured vessel attributes for matching experience, rank and engine requirements.
4. Keep private or risk-sensitive vessel details scoped to operator/internal views unless approved for public vacancy display.

### 4.3 Crew Request / Vacancy Requirement

Crew request describes the rank, qualifications and readiness required from the candidate.

Target responsibilities:

1. Define required rank, department and number of positions.
2. Define required professional documents and experience thresholds.
3. Split must-have, nice-to-have and disqualifying requirements.
4. Make requirements comparable with seafarer supply records.

### 4.4 Contract Terms

Contract terms describe the commercial and timing conditions of the crew request.

Target responsibilities:

1. Normalize salary, currency, duration and rotation.
2. Capture joining/sign-off logistics.
3. Separate filterable terms from explanatory contract notes.
4. Support candidate fit without making employment decisions.

### 4.5 Operational / Legal / Risk Requirements

Operational/legal/risk requirements describe constraints that affect eligibility, safety, compliance or special operations.

Target responsibilities:

1. Record high-risk trading areas, special vessel operations and cargo-specific requirements.
2. Capture sanctions/compliance and client-specific restrictions as internal/operator-scoped fields.
3. Decide which operational requirements are hard blockers and which are operator-visible context.
4. Prevent internal risk metadata from leaking to the public vacancy board or seafarer applicant view unless explicitly approved.

## 5. Current-To-Target Field Matrix

| Object | Current field/source | Current type | Target normalized field | Recommended type | Required for MVP | Notes |
|---|---|---|---|---|---|---|
| Employer / Company Profile | `company_name` | Text | `company_name` | Text with normalized display | Yes | Existing field can remain. |
| Employer / Company Profile | `company_type` | Enum-like text | `company_legal_type` and `client_role` | Structured enum | Yes | Separate legal type from role such as shipowner, manager, crewing agent. |
| Employer / Company Profile | `registration_number`, `country_code` | Text + country code | `registration_number`, `jurisdiction_country` | Text + country enum | Yes | Existing unique registration/country index can support future review. |
| Employer / Company Profile | `company_users.role_in_company` | Enum | `representative_role` | Structured enum | Yes | Existing roles are useful but authority scope needs evidence. |
| Employer / Company Profile | Uploaded company documents | Document records | `authority_evidence_status` | Document-backed calculated status | Yes | Derived from protected upload/review flow. |
| Employer / Company Profile | `verification_status` | Enum | `company_verification_status` | Status enum | Yes | Hard blocker for matching/publication. |
| Employer / Company Profile | Not structured | Missing | `billing_service_status` | Status enum | Later | Needed for commercial workflow, not matching MVP. |
| Employer / Company Profile | Not structured | Missing | `sanctions_risk_status` | Internal status enum | Later | Internal/compliance only. |
| Vessel Profile | `vessel_name` | Text | `vessel_name` | Text | Yes | Existing field can remain. |
| Vessel Profile | `imo_number` | Validated text | `imo_number` | Validated identifier | Yes where known | Current regex validates seven digits. |
| Vessel Profile | `vessel_type` | Text/datalist | `vessel_type_value_id`, `vessel_type_label` | Catalog enum | Yes | Must align with seafarer vessel preference/sea-service catalogs. |
| Vessel Profile | `flag_country_code` | Country code | `flag_country_code` | Country enum | Later | Useful but not all MVP requests require it. |
| Vessel Profile | Missing | Missing | `vessel_verification_status` | Status enum | Yes | Vessel trust currently depends mostly on company/vacancy review. |
| Vessel Profile | Missing | Missing | `gross_tonnage`, `deadweight_tonnage` | Number | Later/P1 | Needed for vessel-size experience fit. |
| Vessel Profile | Missing | Missing | `engine_type`, `engine_power_kw`, `main_engine_model` | Enum + number + text | Later/P1 | Critical for engine-department matching. |
| Vessel Profile | Missing | Missing | `year_built` | Number/year | Later | Contextual/risk signal. |
| Vessel Profile | Missing | Missing | `trading_area`, `route_regions` | Multi-select enum | Later/P1 | Required for visa/route/language fit. |
| Vessel Profile | Missing | Missing | `class_society`, `ism_manager` | Enum/text | Later | Evidence/risk context. |
| Vessel Profile | Missing | Missing | `safe_manning_evidence_status` | Document-backed status | Later | Needed if regulatory review requires it. |
| Crew Request / Vacancy Requirement | `vacancy_title`, `rank` | Text/datalist | `required_rank_value_id`, `required_rank_label` | Catalog enum | Yes | Keep title separate from required rank. |
| Crew Request / Vacancy Requirement | `department` | Enum | `crew_department` | Structured enum | Yes | Align department taxonomy with seafarer side. |
| Crew Request / Vacancy Requirement | Missing | Missing | `number_of_positions` | Number | Yes | Required for planning and later task allocation. |
| Crew Request / Vacancy Requirement | `join_date` | Date | `target_join_date`, `earliest_join_date`, `latest_join_date` | Date fields | Yes | Current single date is useful but not enough for real scheduling. |
| Crew Request / Vacancy Requirement | Missing | Missing | `joining_port`, `sign_off_port` | Port/catalog text | Later/P1 | Needed for route/logistics fit. |
| Crew Request / Vacancy Requirement | `vessel_type` | Text/datalist | `required_vessel_type_values` | Catalog multi-select with required/preferred flags | Yes | Must not remain free text. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `required_coc_values` | Document-backed multi-select enum | Yes | P0: legal qualification blocker. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `required_endorsement_values` | Document-backed multi-select enum | Yes | P0 for tanker/passenger/specialized roles. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `required_training_values` | Document-backed multi-select enum | Yes | P0 for STCW and mandatory training. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `required_visa_values` | Multi-select enum | Later/P1 | Depends on trading area/joining route. |
| Crew Request / Vacancy Requirement | Missing | Missing | `required_language_levels` | Multi-select enum + level | Later/P1 | Maritime English should be structured. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `required_sea_service_months` | Number by rank/vessel type | Later/P1 | Needed for experience filtering. |
| Crew Request / Vacancy Requirement | `requirements` | Free text | `must_have_requirements`, `nice_to_have_requirements`, `disqualifying_requirements` | Structured lists + notes | Yes | Separate blocker/score/exclusion logic. |
| Contract Terms | `salary_min_usd`, `salary_max_usd`, `currency` | Number + currency | Same plus `salary_negotiable` | Number/currency/boolean | Yes | Existing range is useful; negotiable flag missing. |
| Contract Terms | `contract_duration` | Text | `contract_duration_value`, `contract_duration_unit` | Number + enum | Yes | Must become comparable. |
| Contract Terms | Missing | Missing | `rotation_pattern` | Structured enum/text pair | Later/P1 | Important for fit but not first blocker. |
| Contract Terms | Missing | Missing | `travel_terms`, `repatriation_terms`, `leave_terms` | Structured enum + notes | Later | Applicant-visible summary later. |
| Contract Terms | Missing | Missing | `overtime_bonus_allowance_notes` | Free text | Later | Human explanation, not core score. |
| Contract Terms | Missing | Missing | `cba_reference`, `sea_reference` | Document/reference text | Later | Evidence-backed if needed. |
| Operational / Legal / Risk Requirements | `requirements` | Free text | `special_operation_tags` | Multi-select enum | Later/P1 | Tanker/offshore/passenger/DP/polar/crane/hazardous cargo. |
| Operational / Legal / Risk Requirements | Missing | Missing | `high_risk_area_flag`, `trading_area_risk` | Boolean/status enum | Later/P1 | Internal/operator-scoped unless approved. |
| Operational / Legal / Risk Requirements | Missing | Missing | `cargo_type_values` | Multi-select enum | Later | Relevant for tanker/dangerous cargo. |
| Operational / Legal / Risk Requirements | Missing | Missing | `sanctions_or_client_restrictions` | Internal status/list | Later | Must remain internal/system-scoped. |
| Operational / Legal / Risk Requirements | Missing | Missing | `flag_state_requirements`, `client_specific_requirements` | Structured list + notes | Later | Operator-reviewed constraints. |

## 6. Field Type Matrix

| Field | Object | Type | Single/multiple | Enum/catalog needed? | Document-backed? | Calculated? | Priority |
|---|---|---|---|---|---|---|---|
| `company_legal_type` | Employer / Company Profile | Structured enum | Single | Yes | No | No | P0 |
| `client_role` | Employer / Company Profile | Structured enum | Multiple possible by company | Yes | Optional | No | P0 |
| `representative_role` | Employer / Company Profile | Structured enum | Single per company user | Yes | Authority evidence | No | P0 |
| `authority_evidence_status` | Employer / Company Profile | Status enum | Single | Yes | Yes | Yes | P0 |
| `company_verification_status` | Employer / Company Profile | Status enum | Single | Yes | Yes | Yes | P0 |
| `billing_service_status` | Employer / Company Profile | Status enum | Single | Yes | Optional | Yes | P2 |
| `sanctions_risk_status` | Employer / Company Profile | Internal status enum | Single | Yes | Evidence if flagged | Yes | P2 |
| `vessel_type_value_id` | Vessel Profile | Catalog enum | Single | Yes | Optional | No | P0 |
| `vessel_verification_status` | Vessel Profile | Status enum | Single | Yes | Yes | Yes | P0 |
| `imo_number` | Vessel Profile | Validated identifier | Single | No | Optional | No | P0/P1 |
| `flag_country_code` | Vessel Profile | Country enum | Single | Yes | Optional | No | P1 |
| `gross_tonnage` | Vessel Profile | Number | Single | No | Optional | No | P1 |
| `deadweight_tonnage` | Vessel Profile | Number | Single | No | Optional | No | P1 |
| `engine_type` | Vessel Profile | Structured enum | Single | Yes | Optional | No | P1 |
| `engine_power_kw` | Vessel Profile | Number | Single | No | Optional | No | P1 |
| `trading_area`, `route_regions` | Vessel Profile | Multi-select enum | Multiple | Yes | Optional | No | P1 |
| `required_rank_value_id` | Crew Request / Vacancy Requirement | Catalog enum | Single | Yes | No | No | P0 |
| `crew_department` | Crew Request / Vacancy Requirement | Structured enum | Single | Yes | No | No | P0 |
| `number_of_positions` | Crew Request / Vacancy Requirement | Number | Single | No | No | No | P0 |
| `earliest_join_date`, `target_join_date`, `latest_join_date` | Crew Request / Vacancy Requirement | Date | Three single dates | No | No | Calculated window | P0 |
| `required_coc_values` | Crew Request / Vacancy Requirement | Multi-select enum | Multiple | Yes | Yes | No | P0 |
| `required_endorsement_values` | Crew Request / Vacancy Requirement | Multi-select enum | Multiple | Yes | Yes | No | P0 |
| `required_training_values` | Crew Request / Vacancy Requirement | Multi-select enum | Multiple | Yes | Yes | No | P0 |
| `required_document_validity_days` | Crew Request / Vacancy Requirement | Number by document type | Multiple | Yes | No | Yes | P0 |
| `required_vessel_type_experience` | Crew Request / Vacancy Requirement | Enum + number | Multiple | Yes | No | Yes | P1 |
| `required_language_levels` | Crew Request / Vacancy Requirement | Enum + level | Multiple | Yes | Optional | No | P1 |
| `required_visa_values` | Crew Request / Vacancy Requirement | Multi-select enum | Multiple | Yes | Optional | No | P1 |
| `must_have_requirements` | Crew Request / Vacancy Requirement | Structured list | Multiple | Yes where filterable | Optional | No | P0/P1 |
| `nice_to_have_requirements` | Crew Request / Vacancy Requirement | Structured list | Multiple | Yes where scored | Optional | No | P1 |
| `disqualifying_requirements` | Crew Request / Vacancy Requirement | Structured list | Multiple | Yes | Optional | Yes | P1 |
| `salary_min`, `salary_max`, `currency` | Contract Terms | Number + currency | Range | Currency enum | No | No | P0 |
| `salary_negotiable` | Contract Terms | Boolean | Single | No | No | No | P1 |
| `contract_duration_value`, `contract_duration_unit` | Contract Terms | Number + enum | Single pair | Unit enum | No | No | P0 |
| `rotation_pattern` | Contract Terms | Structured enum | Single | Yes | No | No | P1 |
| `travel_terms`, `repatriation_terms`, `leave_terms` | Contract Terms | Enum + notes | Multiple | Optional | Optional | No | P2 |
| `special_operation_tags` | Operational / Legal / Risk Requirements | Multi-select enum | Multiple | Yes | Optional | No | P1 |
| `high_risk_area_flag` | Operational / Legal / Risk Requirements | Boolean/status | Single | Yes | Evidence if flagged | Yes | P1 |
| `sanctions_or_client_restrictions` | Operational / Legal / Risk Requirements | Internal status/list | Multiple | Yes | Evidence if flagged | Yes | P2 |

## 7. Hard Blocker / Soft Score Matrix

| Demand criterion | Hard blocker or soft score | Reason | Required data | Operator override allowed? | Priority |
|---|---|---|---|---|---|
| Company verified | Hard blocker | Prevents untrusted employer demand from entering matching/presentation | `company_verification_status` | No for employer-facing presentation | P0 |
| Representative authority evidence accepted | Hard blocker for publication/matching | Confirms requester authority | `authority_evidence_status` | Yes only with Project Owner/operator audit | P0 |
| Vacancy approved/published | Hard blocker | Matching should use reviewed demand only | `publication_status` or future internal matching approval | No for public board; limited for internal modelling | P0 |
| Required rank | Hard blocker | Candidate rank mismatch invalidates recommendation | `required_rank_value_id` | Operator equivalence override allowed | P0 |
| Crew department | Hard blocker | Department mismatch is normally disqualifying | `crew_department` | Operator equivalence override allowed | P0 |
| Required COC | Hard blocker | Legal qualification requirement | `required_coc_values` | Equivalent certificate override with audit | P0 |
| Required endorsements | Hard blocker when present | Tanker/passenger/special operations may require endorsements | `required_endorsement_values` | Equivalent endorsement override with audit | P0 |
| Required STCW/training | Hard blocker when present | Mandatory training requirement | `required_training_values` | Equivalent course override with audit | P0 |
| Document validity minimums | Hard blocker | Travel/medical/document readiness requirement | Required validity days by document type | Operator override only for non-critical warning | P0 |
| Joining window | Hard blocker or strong score | Candidate must be able to join | Earliest/target/latest join date | Operator override for negotiated date | P0 |
| Vessel type | Hard blocker if marked required | Required vessel experience/type may be essential | Required/preferred vessel type flags | Yes if employer accepts alternative | P0 |
| Number of positions | Operational blocker | Prevents over-presenting candidates | `number_of_positions` | Yes with request update | P0 |
| Salary range fit | Soft score; optional blocker | Salary can be negotiable | Salary range and negotiable flag | Yes | P1 |
| Contract duration / rotation fit | Soft score; optional blocker | Candidate preferences may be flexible | Structured duration/rotation | Yes | P1 |
| Sea-service months threshold | Hard blocker only if employer marks minimum | Experience depth can be legal/client-specific or preference | Required months by rank/vessel type | Yes with employer confirmation | P1 |
| Language / Maritime English level | Soft score or hard when required | Safety/communication requirement | Language and level | Yes if employer accepts alternative | P1 |
| Visa requirement | Hard blocker when required | Route/joining requirements can prevent boarding | Required visa values | Yes only if alternate route accepted | P1 |
| Special operation tag | Hard blocker when required | Tanker/offshore/passenger/DP/polar operations require specific readiness | Operation tags and required evidence | Limited, with audit | P1 |
| High-risk area flag | Internal blocker/review gate | Requires special handling and disclosure | Risk status and operator review | Project Owner/operator only | P1 |
| Billing/service status | Internal blocker | Commercial account must be serviceable | Billing/service status | Project Owner override | P2 |
| Sanctions/client restrictions | Hard internal blocker | Compliance boundary | Sanctions/risk status | No without compliance approval | P2 |

## 8. Evidence / Document-Backed Fields Matrix

| Field/group | Evidence needed? | Evidence document type | Reviewed by operator? | Blocks publication/matching? | Notes |
|---|---|---|---|---|---|
| Company registration | Yes | `company_registration` | Yes | Blocks company verification | Existing upload type supports this. |
| Company license / manning authority | Yes where applicable | `company_license` or future authority document | Yes | Blocks high-trust matching if required | Needed for shipowner/manager/agent authority. |
| Representative identity/authority | Yes | `representative_id`, future authorization letter | Yes | Blocks publication/matching until accepted | Existing representative ID upload exists; authority letter can be future type. |
| Billing/service status | Optional | Contract/invoice/engagement record | Internal review | Blocks service workflow, not public listing by default | Later commercial workflow. |
| Sanctions/compliance risk | Yes if flagged | Internal compliance note/evidence | Restricted operator/compliance | Blocks matching/presentation if adverse | Must stay internal/system scoped. |
| Vessel IMO/ownership/management | Optional but recommended | Registry extract, vessel particulars, management agreement | Yes | Blocks vessel verification if required | Do not bury in vacancy notes. |
| Safe manning / crew complement | Yes if required | Safe manning certificate / crew matrix | Yes | Blocks matching when required by workflow | Later-stage regulatory evidence. |
| Required COC | Demand requirement itself may not need evidence; candidate fulfillment does | Candidate certificate evidence | Operator verifies candidate side | Blocks candidate matching if missing | Demand field must be structured. |
| Required endorsements | Same as COC | Candidate endorsement evidence | Operator verifies candidate side | Blocks candidate matching if missing | Demand requirement should be document-backed. |
| Required STCW/training | Same as COC | Candidate training certificates | Operator verifies candidate side | Blocks candidate matching if missing | Demand requirement should use catalog. |
| Visa requirement | Optional demand evidence; candidate evidence required | Candidate visa or route evidence | Operator verifies candidate side | Blocks if required and missing | Depends on route/trading area. |
| Medical certificate validity | Candidate evidence required | Medical certificate | Operator/doc reviewer | Blocks readiness when expired/insufficient | No medical declaration details in matching. |
| High-risk/special operation | Yes if operationally required | Client/vessel/operation evidence | Operator/compliance | Blocks or escalates matching | Internal visibility unless approved. |

## 9. Visibility / Publication Matrix

| Field/group | Employer owner | Operator | Public vacancy board | Seafarer applicant | Employer candidate matching | Notes |
|---|---|---|---|---|---|---|
| Company name | Visible | Visible | Visible if vacancy published | Visible if public/applicant view approved | Demand context only | Existing public vacancies show company. |
| Company registration number | Visible | Visible | Hidden by default | Hidden by default | Not needed | Verification context, not public marketing data. |
| Company verification status | Visible to owner | Visible | Public may imply reviewed, not raw status | Visible as trusted/reviewed indicator only if approved | Hard gate | Avoid exposing internal review labels publicly. |
| Representative identity | Visible to company owner/admin | Visible to authorized operator | Hidden | Hidden | Not used | Personal data boundary. |
| Billing/service status | Visible to owner/admin | Internal/operator | Hidden | Hidden | Internal blocker only | Not public or applicant-facing. |
| Sanctions/risk status | Hidden or restricted | Internal/compliance only | Hidden | Hidden | Internal blocker only | Must not leak. |
| Vessel name | Visible | Visible | Visible if approved/published | Visible if approved/published | Demand context | Public display may be withheld for generic requests. |
| IMO number | Visible | Visible | Optional/public if approved | Optional/applicant if approved | Verification context | Can be sensitive commercially; publication approval needed. |
| Vessel type | Visible | Visible | Visible | Visible | Core matching field | P0 public/applicant field. |
| Flag | Visible | Visible | Optional/public if approved | Optional/applicant if approved | Matching/context | Public display depends on policy. |
| GT/DWT/engine/year built | Visible | Visible | Hidden or summarized by default | Summarized only if useful | Matching/scoring context | Public disclosure should be deliberate. |
| Trading area/route | Visible | Visible | Summarized if approved | Visible when needed to decide applying | Matching/scoring context | Risk-sensitive route details may be hidden. |
| Required rank/department | Visible | Visible | Visible | Visible | Core matching field | P0. |
| Number of positions | Visible | Visible | Optional visible | Visible if helpful | Planning field | Can be public. |
| Join window / port | Visible | Visible | Join date visible; port optional | Visible if approved | Matching/logistics | Port may be commercial/safety sensitive. |
| Required COC/endorsement/STCW | Visible | Visible | Visible/summarized | Visible | Core matching field | Should be public/applicant-visible. |
| Required visa/language | Visible | Visible | Visible/summarized | Visible | Matching field | Applicant should know before applying. |
| Salary range | Visible | Visible | Visible only if approved | Visible if approved | Fit/scoring | Current public page can show salary. |
| Contract duration/rotation | Visible | Visible | Visible | Visible | Fit/scoring | Should be applicant-visible. |
| Special operations | Visible | Visible | Visible when not risk-sensitive | Visible when relevant | Matching/eligibility | Use tags; keep high-risk details scoped. |
| High-risk/sanctions/client restrictions | Restricted | Internal/operator | Hidden | Hidden or carefully summarized only if required by law/policy | Internal blocker | Not a public vacancy field by default. |

## 10. MVP Vs Later-Stage Priority Matrix

| Field/group | Object | MVP? | Priority | Reason |
|---|---|---:|---|---|
| Company legal identity and country | Employer / Company Profile | Yes | P0 | Required to trust demand source. |
| Representative role and authority evidence status | Employer / Company Profile | Yes | P0 | Required before accepting demand from a person. |
| Company verification status | Employer / Company Profile | Yes | P0 | Existing approval guard depends on it. |
| Billing/service status | Employer / Company Profile | No | P2 | Commercial control, not first matching prerequisite. |
| Sanctions/risk status | Employer / Company Profile | No for MVP, yes before scale | P2 | Compliance control; must be internal. |
| Vessel type | Vessel Profile | Yes | P0 | Core match dimension. |
| Vessel verification status | Vessel Profile | Yes | P0 | Needed to trust vessel demand. |
| IMO number | Vessel Profile | Yes where known | P0/P1 | Strong vessel identity signal. |
| GT/DWT/engine type/engine power | Vessel Profile | No | P1 | Needed for better experience fit, especially engine roles. |
| Trading area/route | Vessel Profile | No | P1 | Needed for visa/language/risk matching. |
| Required rank and department | Crew Request / Vacancy Requirement | Yes | P0 | Core hard blockers. |
| Number of positions | Crew Request / Vacancy Requirement | Yes | P0 | Avoids over-presentation and supports queue planning. |
| Join window | Crew Request / Vacancy Requirement | Yes | P0 | Availability fit cannot rely on a single date forever. |
| Required COC/endorsements/STCW | Crew Request / Vacancy Requirement | Yes | P0 | Legal and operational blockers. |
| Required document validity | Crew Request / Vacancy Requirement | Yes | P0 | Passport/seaman book/medical readiness rules. |
| Required visa/language | Crew Request / Vacancy Requirement | No | P1 | Important for international matching; can follow core legal requirements. |
| Sea-service thresholds | Crew Request / Vacancy Requirement | No | P1 | Needed for ranking and some employer minimums. |
| Salary range/currency | Contract Terms | Yes | P0 | Already present and applicant-relevant. |
| Structured duration | Contract Terms | Yes | P0 | Current text blocks comparability. |
| Rotation/leave/travel terms | Contract Terms | No | P1/P2 | Important for fit but can follow basic duration. |
| Special operations tags | Operational / Legal / Risk Requirements | No for base MVP, yes for specialized vacancies | P1 | Required for tanker/offshore/passenger/DP/polar matching. |
| High-risk/sanctions/client restrictions | Operational / Legal / Risk Requirements | No for public MVP | P2 | Internal compliance gate before scale. |

## 11. Implementation Sequence Matrix

| Future task | Scope | Depends on | Expected artifact | Priority |
|---|---|---|---|---|
| CPG-DEMAND-001 — Demand normalized field contract | Define canonical fields for all five demand objects | This report and document 157 | Documentation/API contract, no code | P0 |
| CPG-DEMAND-002 — Additive demand schema plan | Plan idempotent tables/columns for normalized demand fields | CPG-DEMAND-001 | Migration plan for owner approval, not applied | P0 |
| CPG-DEMAND-003 — Employer/company authority evidence model | Normalize authority evidence and company/client roles | Existing upload/review workflow | Evidence/status model | P0 |
| CPG-DEMAND-004 — Vessel particulars and verification model | Vessel verification, IMO/flag/type, GT/DWT/engine/trading area | Demand schema plan | Vessel object schema and visibility plan | P0/P1 |
| CPG-DEMAND-005 — Crew request qualification requirements model | Required rank, department, COC, endorsements, STCW, document validity | Reference catalogs and source-card model | Requirement schema and blocker contract | P0 |
| CPG-DEMAND-006 — Contract terms normalization model | Duration, unit, rotation, salary negotiability and logistics | Existing vacancy request fields | Contract field contract | P1 |
| CPG-DEMAND-007 — Operational/legal/risk requirement model | Special operations, high-risk area, cargo, client/flag restrictions | Compliance policy approval | Internal visibility and blocker model | P1/P2 |
| CPG-DEMAND-008 — Demand completeness/readiness guard | Define demand readiness blockers before matching | Normalized demand schema | Guard contract, no scoring | P0 |
| CPG-MATCH-001 — Safe matching payload contract | Define allow-listed demand+supply matching payload | Demand readiness guard and CPG-SEAFARER-018/020 | Payload contract and tests plan | P0 |
| CPG-MATCH-002 — Non-production scoring examples | Draft example rules and explanations only | Safe payload contract | Documentation/test fixtures only | P2 |

## 12. Acceptance Checklist

| Requirement | Status |
|---|---|
| Five demand objects kept separate | Met |
| Current-to-target field matrix included | Met |
| Field type matrix included | Met |
| Hard blocker / soft score matrix included | Met |
| Evidence / document-backed fields matrix included | Met |
| Visibility / publication matrix included | Met |
| MVP vs later-stage priority matrix included | Met |
| Implementation sequence matrix included | Met |
| No UI changes | Met |
| No DB migrations | Met |
| No backend/API behavior changes | Met |
| No test changes | Met |
| No matching algorithm or scoring implementation | Met |
| No publication or employment-decision logic | Met |

