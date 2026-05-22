# CPG-DEMAND-002 - Additive Demand Schema And API Implementation Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Schema/API implementation planning report
- Source task: #32 - CPG-DEMAND-002
- Version: 1.0
- Date: 2026-05-22
- Status: Planning only; no implementation changes

## 1. Purpose And Boundaries

This document converts the canonical demand field contract from CPG-DEMAND-001 into an implementation-ready plan for future additive database and API work.

The plan is intentionally pre-implementation. It defines where future fields should live, which schema changes should be additive, how future API contracts should be shaped, how legacy fields should remain compatible, and how future rollout can be disabled or rolled back without data loss.

This report does not change UI, database schema, migrations, backend/API behavior, tests, matching/scoring, publication behavior or employment-decision logic.

## 2. Sources Inspected

Approved documents:

1. `docs/crewportglobal/163_cpg_demand_002_agent_execution_guide.md`
2. `docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md`
3. `docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md`
4. `docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md`
5. `docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md`
6. `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md`
7. `docs/crewportglobal/00_documentation_register.md`

Read-only files inspected:

1. `projects/crewportglobal/app/backend/db/migrations/*.sql`
2. `projects/crewportglobal/app/backend/api/public/index.php`
3. `projects/crewportglobal/public/post-vacancy/index.html`
4. `projects/crewportglobal/public/vacancies/index.html`

Repository currency check:

```text
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```

Result at planning time:

```text
0 0
```

The local `main` branch matched `origin/main` before this documentation update.

## 3. Existing Demand-Side Schema Inventory

| Current table | Current role | Relevant columns | Reusable? | Limitation | Notes |
|---|---|---|---|---|---|
| `employer_companies` | Legal/business company context for employer-side demand | `company_id`, `company_name`, `registration_number`, `country_code`, `company_type`, `verification_status`, `created_by_user_id` | Yes | `company_type` mixes legal/client role concepts; billing/risk/authority status is not structured | Keep existing fields as legacy-compatible foundation. |
| `company_users` | Relationship between company and user/representative | `company_user_id`, `company_id`, `user_id`, `role_in_company`, `is_primary_contact` | Yes | Authority evidence and role scope are not structured beyond a simple enum | Reuse for representative ownership and future authority checks. |
| `vessels` | Basic vessel identity linked to company | `vessel_id`, `company_id`, `imo_number`, `vessel_name`, `vessel_type`, `flag_country_code` | Yes | No vessel verification status, catalog IDs, GT/DWT, engine, year built, class, route/trading area | Reuse identity columns; add normalized particulars later. |
| `vacancy_requests` | Employer crew request / public vacancy source | `vacancy_request_id`, `company_id`, `vessel_id`, `vacancy_title`, `rank`, `department`, `vessel_type`, `join_date`, `contract_duration`, `salary_min_usd`, `salary_max_usd`, `salary_text`, `currency`, `employer_country_code`, `requirements`, `publication_status` | Yes | Core requirements remain free text; duration/rank/vessel type are not fully normalized; no structured join window or requirement rows | Existing table remains the anchor for future demand workspace. |
| `uploaded_documents` | Protected employer/vessel/company evidence metadata | `document_id`, `draft_id`, `card_id`, `form_type`, `document_type`, `review_status`, `scan_status`, `valid_from`, `valid_until`, `hidden_from_user_at` | Yes | Does not yet expose calculated demand evidence statuses | Use for document-backed company/vessel/authority status projections. |
| `registration_audit_events` | General audit trail for registration and review workflows | `event_id`, actor/context ids, `event_type`, `event_payload`, `created_at` | Yes | Not demand-specific; event payload shape is not normalized | Reuse for future demand workspace save/review/audit events. |
| `reference_catalogs` / `reference_catalog_values` | Published/reference catalog storage | `catalog_code`, `catalog_scope`, `publication_state`, value code/display/source metadata | Yes | Some demand catalogs do not exist or are supply-side only | Reuse for demand catalog expansion instead of inventing new catalog tables. |
| `vacancy_applications` | Candidate-to-vacancy application and presentation workflow | `vacancy_application_id`, `vacancy_request_id`, `application_status`, `candidate_note`, employer shortlist/action fields | Yes for integration only | Not a demand definition table | Future matching/presentation must read demand readiness but not store demand fields here. |

Current backend functions already normalize and persist basic demand fields through `normalize_vacancy_payload()`, `upsert_vacancy_request()`, `public_vacancy_select_clause()`, `map_public_vacancy_row()` and employer draft response assembly. Current public vacancy output is still legacy-field based.

## 4. Target Additive Schema Plan

Future implementation should use these storage categories:

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

Design rules:

1. Keep `employer_companies`, `vessels` and `vacancy_requests` as the primary parent records.
2. Add normalized fields only additively.
3. Preserve current legacy text fields for compatibility until public/API consumers are migrated.
4. Use child tables for repeated requirements and multi-value catalog requirements.
5. Use `reference_catalogs` / `reference_catalog_values` for catalog-backed demand fields.
6. Use calculated projections for readiness and matching payloads.
7. Keep internal compliance/risk records out of public vacancy and applicant projections by default.
8. Keep document-backed statuses derived from `uploaded_documents` instead of duplicating file truth.

## 5. Proposed Migration Sequence

These are future migration steps. They are not applied by this task.

| Migration step | Scope | Depends on | Safe to apply alone? | Backfill needed? | Rollback/disable note |
|---|---|---|---:|---:|---|
| Demand 002-A | Add `demand_workspace` JSONB compatibility field to `vacancy_requests`; optional metadata JSONB to `employer_companies` and `vessels` if needed | Existing tables | Yes | No initial backfill required | Feature flag can ignore JSONB and keep legacy reads. |
| Demand 002-B | Add normalized company/client-role fields or child table | `employer_companies`, `company_users` | Yes | Optional mapping from `company_type` and `role_in_company` | Disable normalized reads; preserve legacy company fields. |
| Demand 002-C | Add vessel particulars and vessel verification fields | `vessels`, reference catalogs | Yes | Optional mapping from `vessel_type` to catalog value | Disable vessel normalized projection; keep legacy vessel text. |
| Demand 002-D | Add normalized crew-request scalar columns on `vacancy_requests` | `vacancy_requests`, reference catalogs | Yes | Map `rank`, `department`, `join_date`, salary fields | API can fall back to legacy columns if new fields empty. |
| Demand 002-E | Add demand requirement child tables for rank/vessel/COC/endorsement/STCW/visa/language/experience | Demand 002-D, reference catalogs | Yes | Optional operator-assisted parse of `requirements` | Disable requirement-row reads and keep `requirements` text. |
| Demand 002-F | Add contract term structured fields | `vacancy_requests`, reference catalogs | Yes | Parse `contract_duration` only when safe; otherwise store raw compatibility note | Fall back to `contract_duration` text and salary columns. |
| Demand 002-G | Add operational/risk/internal compliance records | Access-control/compliance policy | Yes | No automatic backfill from free text unless reviewed | Feature flag excludes internal risk from matching/public projections. |
| Demand 002-H | Add calculated demand readiness and matching-safe projection helpers | Prior normalized fields | Yes | No destructive backfill | Disable projection endpoints; preserve existing endpoints. |

All future migrations must be idempotent and additive:

```text
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
ALTER TABLE ... ADD COLUMN IF NOT EXISTS
DO $$ BEGIN IF NOT EXISTS (...) THEN ADD CONSTRAINT ... END IF; END $$;
```

No future migration in this sequence should drop, rename or narrow existing columns.

## 6. Table / Column Plan By Demand Object

| Demand object | Canonical field/group | Proposed storage | Additive change type | Reason | Migration risk | Notes |
|---|---|---|---|---|---|---|
| Company | `company_name`, `registration_number`, `jurisdiction_country` | Existing `employer_companies.company_name`, `registration_number`, `country_code` | existing_column | Already sufficient for identity foundation | Low | API should expose canonical keys while reading existing columns. |
| Company | `company_legal_type` | Existing `company_type` plus future clarified catalog/reference value if needed | existing_column / reference_relation | Current enum is useful but semantically broad | Low | Do not break existing `company_type` values. |
| Company | `client_role` | Future `company_client_roles` child table or JSONB compatibility array | new_child_table / jsonb_compatibility | One company may act as shipowner, operator, manager or employer | Medium | Child rows should support reviewed role and authority evidence status. |
| Company | `representative_role` | Existing `company_users.role_in_company` | existing_column | Already represents user/company relation | Low | May need expanded role catalog later. |
| Company | `authority_evidence_status` | Projection from `uploaded_documents` where `form_type='employer'` | document_backed_status / calculated_projection | Evidence truth belongs in protected uploads | Low | Document types include registration/license/representative ID. |
| Company | `company_verification_status` | Existing `employer_companies.verification_status` | existing_column | Already gates trust | Low | Future status may add `suspended` additively through constraint migration. |
| Company | `billing_service_status`, `sanctions_risk_status` | Future internal compliance/service table | internal_compliance_record | Internal workflows differ from public demand data | Medium | Never public or seafarer-applicant visible by default. |
| Vessel | `vessel_name`, `imo_number`, `flag_country_code` | Existing `vessels` columns | existing_column | Current identity fields are reusable | Low | Current IMO regex already requires seven digits. |
| Vessel | `vessel_type_value_id`, `vessel_type_label` | Add `vessel_type_value_id` FK plus keep `vessel_type` text as label/fallback | reference_relation / existing_column | Shared catalog is required for matching | Low/medium | Backfill by matching label to published `vessel_types` values when exact. |
| Vessel | `vessel_verification_status` | New `vessels.vessel_verification_status` | new_column | Separates vessel trust from company trust | Low | Default `unverified`; do not auto-publish. |
| Vessel | `gross_tonnage`, `deadweight_tonnage`, `engine_power_kw`, `year_built` | New numeric/year columns on `vessels` | new_column | Scalar vessel particulars are one-to-one | Low | Use nullable columns and non-negative checks. |
| Vessel | `engine_type`, `class_society` | Reference values plus cached labels | reference_relation | Needs controlled vocabulary but may need text fallback | Medium | Use catalog ID plus label fallback until catalogs mature. |
| Vessel | `trading_area_values`, `route_region_values` | Future `vessel_operating_areas` or demand route child table | new_child_table / reference_relation | Multiple routes/areas per vessel/request | Medium | May be tied to a vacancy rather than permanent vessel profile. |
| Crew request | `vacancy_title`, `crew_department`, `target_join_date`, salary range, `currency` | Existing `vacancy_requests` columns | existing_column | Current MVP fields are reusable | Low | `join_date` maps to `target_join_date`. |
| Crew request | `required_rank_value_id`, `required_rank_label` | New FK/cache fields on `vacancy_requests` | reference_relation / new_column | Rank must not remain title text | Medium | Keep `rank` as legacy label fallback. |
| Crew request | `number_of_positions`, `earliest_join_date`, `latest_join_date` | New scalar columns on `vacancy_requests` | new_column | One-to-one request metadata | Low | Add nullable first; validate once UI/API is enabled. |
| Crew request | `joining_port`, `sign_off_port` | Port reference relation plus text fallback | reference_relation / jsonb_compatibility | Port catalog may not be ready on day one | Medium | Use `demand_workspace` for raw text until port catalog is approved. |
| Crew request | Required COC, endorsements, STCW/training, visas, languages, vessel type, sea-service thresholds | Future `demand_requirement_items` child table | new_child_table / reference_relation | Repeated structured requirement rows drive blockers/scores | Medium | Include `requirement_group`, `requiredness`, `reference_value_id`, value/number fields and evidence rule. |
| Crew request | Must-have/nice-to-have/disqualifying requirement notes | `demand_requirement_items` plus raw `requirements` compatibility | new_child_table / jsonb_compatibility | Free text cannot be the only matching source | Medium | Operator should convert free text into structured rows before matching. |
| Contract terms | `salary_min`, `salary_max`, `currency` | Existing salary/currency columns | existing_column | Current fields are usable | Low | Later rename only in API projection, not DB. |
| Contract terms | `salary_negotiable` | New boolean on `vacancy_requests` or contract terms child table | new_column | Needed to decide score vs blocker | Low | Default null/false only after product decision. |
| Contract terms | `contract_duration_value`, `contract_duration_unit` | New scalar + catalog fields | new_column / reference_relation | Current duration text is not comparable | Medium | Keep `contract_duration` as raw text fallback. |
| Contract terms | Rotation/travel/repatriation/leave/CBA/SEA references | Future `demand_contract_terms` child/table or JSONB section | new_child_table / jsonb_compatibility | Some fields are optional and explanatory | Medium | Public/applicant visibility must be explicit. |
| Operational/risk | `special_operation_tags`, `cargo_type_values` | Future child table with catalog refs | new_child_table / reference_relation | Multiple operational tags per demand | Medium | Tags may become hard blockers only if marked required. |
| Operational/risk | `high_risk_area_flag`, `trading_area_risk_status` | Internal risk table/columns | internal_compliance_record | Risk fields require stricter visibility | Medium | Do not expose through public vacancy by default. |
| Operational/risk | Sanctions/client restrictions/internal notes | Internal compliance/review table | internal_compliance_record | Internal-only operational controls | Medium | Exclude from matching/public payload unless converted to safe structured criteria. |

## 7. Reference Catalog Storage Plan

| Catalog | Current status | Proposed storage | Seed data needed? | Used by fields | Notes |
|---|---|---|---:|---|---|
| Rank | Existing seafarer/reference-side catalog | Reuse `reference_catalogs` / `reference_catalog_values` | No initial if already published; demand binding needed | `required_rank_value_id` | Must align with seafarer positions. |
| Department | Hard-coded/current enum | Reference catalog or controlled enum | Yes if moving beyond current enum | `crew_department` | Align supply/demand taxonomy. |
| Vessel type | Existing reference-side catalog and frontend datalist binding | Reuse shared catalog | No initial if published; demand binding needed | `vessel_type_value_id`, `required_vessel_type_values` | Backfill exact text labels only. |
| Country | Current code validation; no dedicated demand catalog required initially | ISO code validation or reference catalog later | Optional | `jurisdiction_country`, `flag_country_code` | Keep uppercase alpha-2 validation. |
| Port | Missing | New catalog or external UN/LOCODE-backed table later | Yes | `joining_port`, `sign_off_port` | Use text fallback until catalog is approved. |
| COC | Existing seafarer/reference-side values | Reuse shared catalog | No initial if published; demand binding needed | `required_coc_values` | Supports document-backed blocker. |
| Endorsement | Existing seafarer/reference-side values | Reuse shared catalog | No initial if published; demand binding needed | `required_endorsement_values` | Include tanker/passenger/special endorsements. |
| STCW/training | Existing seafarer/reference-side values | Reuse shared catalog | No initial if published; demand binding needed | `required_training_values` | Must map to seafarer training records. |
| Visa category | Partial/free text today | New reference catalog | Yes | `required_visa_values` | Route-aware later. |
| Language/level | Missing | New language catalog and level scale | Yes | `required_language_levels` | Include Maritime English. |
| Currency | ISO 4217 convention | Code validation; optional reference catalog | No if code-only | `currency` | Existing `currency` check is usable. |
| Contract duration unit | Missing | New small catalog or enum | Yes | `contract_duration_unit` | Start with `day`, `week`, `month`. |
| Rotation pattern | Missing | New catalog plus custom text fallback | Yes | `rotation_pattern` | Common rotations plus operator-approved custom. |
| Special operation tags | Missing | New catalog | Yes | `special_operation_tags` | Tanker, offshore, passenger, DP, polar, crane, hazardous cargo. |
| Cargo type | Missing | New catalog | Yes | `cargo_type_values` | Useful for tanker/dangerous cargo. |
| Risk status | Missing | Internal catalog/enum | Yes | `sanctions_risk_status`, `trading_area_risk_status` | Internal/compliance only. |
| Verification status | Partially exists | Existing status checks plus additive values | Maybe | company/vessel/evidence status | Company exists; vessel/evidence need contract. |

## 8. JSONB Compatibility Strategy

Future normalized writes should retain enough raw legacy data to preserve existing workflows while normalized fields mature.

Recommended JSONB field:

```text
vacancy_requests.demand_workspace JSONB DEFAULT '{}'
```

Optional later metadata:

```text
employer_companies.company_demand_metadata JSONB DEFAULT '{}'
vessels.vessel_demand_metadata JSONB DEFAULT '{}'
```

Use JSONB only for compatibility, raw notes and staged section saves. Do not treat JSONB as the final matching source for fields that require hard blockers.

| Current field | Legacy meaning | Normalized future fields | Compatibility strategy | Risk |
|---|---|---|---|---|
| `post-requirements` / `vacancy_requests.requirements` | Free-text requirements | `required_coc_values`, `required_endorsement_values`, `required_training_values`, `required_visa_values`, `required_language_levels`, `must_have_requirements`, `nice_to_have_requirements`, `disqualifying_requirements`, `special_operation_tags` | Keep original text in `requirements`; store raw parse/source notes under `demand_workspace.legacy.requirements_text`; require operator conversion for blockers | High if used directly for matching. |
| `post-duration` / `contract_duration` | Free-text duration | `contract_duration_value`, `contract_duration_unit`, `rotation_pattern` | Keep text; parse only when unambiguous; keep raw under `demand_workspace.legacy.contract_duration_text` | Medium; parsing ambiguity. |
| `post-vessel-type` / `vessel_type` | Vessel type label and sometimes requirement | `vessel.vessel_type_value_id`, `crew_request.required_vessel_type_values` | Keep existing text label; exact-match catalog backfill only; store ambiguity notes in JSONB | Medium; profile vs requirement ambiguity. |
| `post-vacancy-title` / `rank` | Human title and sometimes required rank | `crew_request.vacancy_title`, `crew_request.required_rank_value_id`, `required_rank_label` | Keep title and rank text; map to rank catalog only with exact or operator-confirmed match | High if title is assumed to be rank. |
| Existing employer/vacancy document metadata | Upload/evidence context | `authority_evidence_status`, `safe_manning_evidence_status`, demand document status projections | Keep file truth in `uploaded_documents`; JSONB may cache safe summaries only | Medium; avoid duplicating document truth. |
| Future `demand_workspace` JSONB | Staged structured sections and legacy notes | All five demand objects | Save section snapshots and raw compatibility data; normalized columns/child tables remain source for matching | Low if clearly marked compatibility-only. |

## 9. API Request / Response Contract Plan

These future contracts are planning targets only. They are not implemented by this task.

| Method | Endpoint | Consumer | Request | Response sections | Reads | Writes | Visibility scope | Notes |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/v1/employer/demand-workspace?draft_id=...` | Employer owner / company representative | Query `draft_id`; authenticated session in later phase | `company`, `vessel`, `crew_request`, `contract_terms`, `operational_risk` safe owner view, `compatibility`, `validation`, `documents`, `readiness` | `employer_companies`, `company_users`, `vessels`, `vacancy_requests`, `uploaded_documents`, reference values | None | `employer_owner` | Owner workspace should show editable demand data and safe status summaries. |
| PATCH | `/api/v1/employer/demand-workspace/sections/{section}` | Employer owner / company representative | Path section in `company`, `vessel`, `crew_request`, `contract_terms`, `operational_risk`; body contains one section payload and optional `draft_id` | Updated section, validation warnings/errors, compatibility summary | Parent records, reference catalogs | Normalized fields, child rows, compatibility JSONB, audit event | `employer_owner` | Partial save; must preserve legacy `/post-vacancy/` behavior while enabled. |
| GET | `/api/v1/vacancies/{id}/demand-summary` | Public vacancy board / seafarer applicant view | Path vacancy id | Public allow-listed `company`, `vessel`, `crew_request`, `contract_terms` summary | Published/verified demand projection | None | `public_vacancy_board` / `seafarer_applicant_view` | Must exclude internal compliance/risk fields and unpublished details. |
| GET | `/api/v1/operator/demand-review/{draft_id}` | Operator review page | Path draft id or future demand id | Full review payload: all demand sections, validation, document evidence statuses, compatibility notes, audit summary, internal risk where permitted | All demand tables, uploads, audit, access context | None | `operator_review` and restricted `internal_compliance` for permitted fields | General operator should not automatically receive system-only risk notes unless capability allows. |
| GET | `/api/v1/matching/demand-payload/{vacancy_request_id}` | Future matching service / operator matching workbench | Path vacancy request id; internal access only | Matching-safe allow-list: hard blockers, soft score criteria, readiness status, visibility metadata | Normalized demand tables, calculated projections | None | `matching_payload` | No raw free text as blocker unless operator-structured; no internal notes, no personal contact fields. |

### 9.1 Request Section Shape

Future `PATCH /sections/{section}` requests should use section-specific payloads:

```json
{
  "draft_id": "uuid",
  "section": "crew_request",
  "data": {
    "required_rank_value_id": "uuid",
    "number_of_positions": 2,
    "target_join_date": "2026-07-15",
    "required_coc_values": [
      {
        "reference_value_id": "uuid",
        "requiredness": "required"
      }
    ]
  }
}
```

Response should include:

```json
{
  "ok": true,
  "section": "crew_request",
  "validation": {
    "errors": [],
    "warnings": []
  },
  "demand_readiness": {
    "status": "draft",
    "blocks_matching": true
  }
}
```

## 10. Validation And Error Model

| Field/group | Validation | Error code | Severity | Blocks save? | Blocks matching/publication? |
|---|---|---|---|---:|---:|
| IMO number | Exactly seven digits after optional `IMO` prefix/spaces are removed | `invalid_imo_number` | error | Yes for vessel section if supplied | Yes when vessel identity is required |
| Country code | Uppercase ISO alpha-2 | `invalid_country_code` | error | Yes | Yes if field is required for publication |
| Currency | Uppercase ISO 4217 code | `invalid_currency_code` | error | Yes | Yes if salary is present |
| Salary range | Min/max >= 0 and max >= min | `invalid_salary_range` | error | Yes | Yes |
| Date windows | `earliest_join_date <= target_join_date <= latest_join_date` where present | `invalid_join_date_window` | error | Yes | Yes |
| Contract duration | Positive numeric value and known duration unit | `invalid_contract_duration` | error | Yes for structured duration | Yes once structured duration is required |
| GT/DWT | Numeric value >= 0 | `invalid_tonnage_value` | error | Yes for supplied field | No unless employer marks as hard criterion |
| Engine power | Numeric value >= 0 | `invalid_engine_power` | error | Yes for supplied field | No unless engine role requires it |
| Validity days | Integer >= 0 | `invalid_validity_days` | error | Yes | Yes for document-readiness blockers |
| Number of positions | Integer >= 1 | `invalid_positions_count` | error | Yes | Yes |
| Catalog value IDs | Must refer to active and published/allowed reference values in expected catalog | `invalid_catalog_value` | error | Yes | Yes when field participates in matching |
| Required COC values | Each required COC value must have valid catalog id and requiredness | `invalid_required_coc` | error | Yes | Yes |
| Required STCW/training values | Each value must have valid catalog id and requiredness | `invalid_required_training` | error | Yes | Yes |
| Required endorsement values | Each value must have valid catalog id and requiredness | `invalid_required_endorsement` | error | Yes | Yes |
| Free-text requirement notes | Max length and safe text; no personal/sensitive candidate data | `invalid_requirement_note` | warning/error depending field | Sometimes | No unless note is converted to structured blocker |
| Internal risk values | Must be internal enum/capability-controlled | `invalid_internal_risk_status` | error | Yes for risk section | Yes for internal matching eligibility, not public by default |

Future API responses should return validation in a stable shape:

```json
{
  "code": "invalid_salary_range",
  "field": "contract_terms.salary_max",
  "severity": "error",
  "blocks_save": true,
  "blocks_matching_publication": true
}
```

## 11. Visibility And Access-Control Plan

Use these demand scopes:

```text
employer_owner
operator_review
public_vacancy_board
seafarer_applicant_view
matching_payload
internal_compliance
system_only
```

| API projection | Allowed field groups | Explicit exclusions |
|---|---|---|
| `employer_owner` | Employer's own company, vessel, crew request, contract terms, safe operational status, uploaded document status summaries | Other companies, candidate private data, internal sanctions reasoning not approved for owner view |
| `operator_review` | Full demand review fields, compatibility notes, document evidence statuses, publication readiness, operator notes | System-only secrets, unrelated tenant records |
| `public_vacancy_board` | Published vacancy title/rank, company display name if approved, vessel type/name if approved, join date, duration, salary if approved, public requirements summary | Internal risk, billing, sanctions, raw documents, unpublished data, contact emails/phones |
| `seafarer_applicant_view` | Approved applicant-safe vacancy/demand summary | Employer internal notes, risk details, document storage metadata, unapproved compensation/details |
| `matching_payload` | Hard blocker and soft score fields only from reviewed normalized data | Free-text-only requirements as hard blockers, raw internal notes, unreviewed compatibility JSONB, personal contact data |
| `internal_compliance` | Risk, sanctions, restricted operational/legal requirements | Public and employer-facing projections unless explicitly summarized and approved |
| `system_only` | Feature flags, calculated internals, migration/backfill state | All human UI/API projections unless admin/system capability exists |

Projection rule:

```text
Public and matching payloads must be allow-listed, not built by removing a few forbidden fields from a broad object.
```

## 12. Data Backfill And Compatibility Mapping

| Legacy source | Future canonical target | Backfill method | Human review needed? | Notes |
|---|---|---|---:|---|
| `post-company` / `company_name` | `company.company_name` | Direct read from existing column | No | Keep same source. |
| `post-country` / `country_code` | `company.jurisdiction_country` | Direct read after ISO validation | No | Existing check already constrains alpha-2. |
| `post-registration-number` | `company.registration_number` | Direct read | No | Existing unique index by country helps identity. |
| `post-role-in-company` | `company.representative_role` | Direct from `company_users.role_in_company` | No initially | Expanded roles need later catalog decision. |
| `post-role` / company type selection | `company.client_role` | Map only known role values; otherwise keep compatibility note | Yes for ambiguous values | Do not confuse legal type and client role. |
| `post-vessel-name` | `vessel.vessel_name` | Direct read | No | Existing column. |
| `post-vessel-type` | `vessel.vessel_type_label`, future `vessel_type_value_id`, possible `required_vessel_type_values` | Exact label-to-catalog match only; store ambiguous mapping in JSONB | Yes when ambiguous | May describe vessel profile or crew requirement. |
| `post-imo` | `vessel.imo_number` | Normalize optional prefix/spaces, validate seven digits | No if valid | Existing DB constraint expects seven digits. |
| `post-vacancy-title` | `crew_request.vacancy_title`, possible `required_rank_label` | Keep as title; map to rank only with exact catalog match or operator confirmation | Yes if used as rank | Prevent title/rank conflation. |
| `post-department` | `crew_request.crew_department` | Direct enum mapping | No if current value known | Align supply/demand taxonomy later. |
| `post-join-date` | `crew_request.target_join_date` | Direct read | No | Earliest/latest remain null until collected. |
| `post-duration` | `contract_terms.contract_duration_value`, `contract_duration_unit`, raw compatibility | Parse only simple values; otherwise keep raw text | Yes for ambiguous text | Avoid unsafe machine comparison. |
| `post-salary-min/max` | `contract_terms.salary_min/max` | Direct read from existing numeric fields | No | Currency remains current/default. |
| `post-requirements` | Structured requirement rows plus raw compatibility note | Keep raw text; operator-assisted conversion into rows | Yes | Free text should not create automatic blockers. |
| Employer document upload types | `authority_evidence_status` | Calculate from `uploaded_documents` scan/review statuses | No for status projection; yes for review decision | Do not duplicate protected document truth. |

Backfill safety rules:

1. Never delete or overwrite legacy fields during backfill.
2. Only exact, deterministic catalog matches should be automatic.
3. Ambiguous free text should become compatibility notes and operator tasks, not blockers.
4. Every automated backfill should be repeatable and idempotent.

## 13. Test Plan For Future Implementation

Do not write tests in this planning task. Future implementation should add:

| Test group | Future coverage |
|---|---|
| Migration idempotency tests | Re-running additive migrations creates no duplicate columns/tables/indexes and does not fail. |
| Schema presence tests | Required future columns, child tables, constraints and indexes exist. |
| Reference catalog tests | Demand catalogs exist where required; unpublished values do not leak to public APIs. |
| API save/reload tests | `PATCH /demand-workspace/sections/{section}` persists one section and `GET /demand-workspace` reloads it. |
| Legacy compatibility tests | Existing `/post-vacancy/` flow still saves and reloads legacy fields when normalized demand feature is disabled. |
| Validation error tests | Stable error codes return for invalid IMO, country, currency, salary range, date window, duration and catalog IDs. |
| Visibility projection tests | Public/applicant/matching projections are allow-listed and exclude internal risk, raw notes and protected document metadata. |
| Matching-safe payload tests | Future matching payload includes only reviewed structured blockers/scores and excludes raw free text as hard blocker. |
| Backfill tests | Exact label mappings populate catalog IDs; ambiguous values remain raw compatibility notes. |
| Rollback/disable tests | Feature flags disable normalized demand reads/writes without breaking current employer workspace. |
| Generated artifact cleanup checks | Playwright/test artifacts are not committed after future test runs. |

## 14. Rollback / Disable Strategy

Because future changes must be additive, rollback should mean disabling reads/writes and falling back to legacy behavior, not deleting data.

Recommended switches:

```text
CPG_DEMAND_WORKSPACE_ENABLED=false
CPG_DEMAND_NORMALIZED_WRITES_ENABLED=false
CPG_DEMAND_NORMALIZED_READS_ENABLED=false
CPG_DEMAND_MATCHING_PAYLOAD_ENABLED=false
CPG_DEMAND_PUBLIC_SUMMARY_V2_ENABLED=false
```

Disable behavior:

1. Existing `/post-vacancy/` continues to write `employer_companies`, `company_users`, `vessels` and `vacancy_requests` legacy fields.
2. Existing `/vacancies/` continues to read published legacy vacancy fields.
3. New normalized tables/columns remain unused but retained.
4. `demand_workspace` JSONB is ignored by runtime reads when disabled.
5. Matching payload endpoint returns `503 feature_disabled` or is route-disabled until approved.
6. Backfill jobs can be stopped and re-run because they are idempotent.
7. No rollback step should drop normalized tables/columns without a separate Project Owner-approved data retention decision.

## 15. Open Risks And Project Owner Decisions

| Risk / decision | Why it matters | Recommended owner decision |
|---|---|---|
| Demand catalog ownership | Rank, vessel type, COC, STCW and endorsement catalogs must align with supply-side catalogs | Reuse existing reference catalogs wherever possible; create demand-only catalogs only when no supply equivalent exists. |
| Port catalog source | Joining/sign-off ports can become large and standards-dependent | Decide between UN/LOCODE integration and controlled internal MVP list. |
| Title vs rank ambiguity | Current vacancy title often acts like rank | Require explicit rank catalog selection before automated matching. |
| Requirement free-text conversion | Free text cannot safely drive blockers | Require operator conversion or employer structured fields before matching. |
| Internal risk visibility | Risk/sanctions fields must not leak into public/applicant views | Keep internal risk under `internal_compliance` / `system_only` unless a safe summary is approved. |
| Vessel type dual meaning | Current `post-vessel-type` can describe vessel profile and candidate experience requirement | Store both meanings separately in future UI/API. |
| Backfill automation level | Aggressive parsing can create false blockers | Allow only deterministic backfill; route ambiguous data to review. |
| Matching payload readiness | Demand payload must be structured before scoring | Block scoring implementation until normalized demand and supply readiness levels exist. |

## 16. Recommended Next Implementation Issues

| Sequence | Issue candidate | Scope | Must remain out of scope |
|---:|---|---|---|
| 1 | CPG-DEMAND-003 - Demand workspace additive schema draft | Draft idempotent migration for `demand_workspace`, normalized scalar columns and minimal indexes | No UI switch-on, no matching algorithm |
| 2 | CPG-DEMAND-004 - Demand catalog binding plan/import | Bind demand fields to existing reference catalogs and add missing demand catalogs | No public exposure of unpublished values |
| 3 | CPG-DEMAND-005 - Employer demand workspace API skeleton | Disabled-by-default GET/PATCH contracts and validation model | No frontend wiring unless separately approved |
| 4 | CPG-DEMAND-006 - Legacy compatibility and backfill dry-run | Exact mapping/backfill report from legacy fields to canonical demand fields | No destructive writes; no fuzzy parsing as blockers |
| 5 | CPG-DEMAND-007 - Operator demand review payload | Operator review projection for normalized demand and compatibility notes | No employment decisions; no automatic publication |
| 6 | CPG-DEMAND-008 - Public/applicant demand summary v2 | Allow-listed summary projection for published vacancies | No internal risk leakage; no private document metadata |
| 7 | CPG-DEMAND-009 - Matching-safe demand payload contract | Read-only, allow-listed payload for future matching workbench/service | No scoring implementation; no auto-presentation |

## 17. Acceptance Checklist

| Requirement | Status |
|---|---|
| Purpose and boundaries included | Met |
| Existing demand-side schema inventory included | Met |
| Target additive schema plan included | Met |
| Proposed migration sequence included | Met |
| Table/column plan by demand object included | Met |
| Reference catalog storage plan included | Met |
| JSONB compatibility strategy included | Met |
| API request/response contract plan included | Met |
| Validation and error model included | Met |
| Visibility and access-control plan included | Met |
| Data backfill and compatibility mapping included | Met |
| Future test plan included | Met |
| Rollback/disable strategy included | Met |
| Open risks and Project Owner decisions included | Met |
| Recommended next implementation issues included | Met |
| No UI changes | Met |
| No DB migrations applied | Met |
| No backend/API behavior changes | Met |
| No test changes | Met |
| No matching/scoring implementation | Met |
| No publication or employment-decision logic | Met |
