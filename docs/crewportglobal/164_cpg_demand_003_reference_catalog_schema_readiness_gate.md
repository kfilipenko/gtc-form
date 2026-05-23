# CPG-DEMAND-003 - Reference Catalog And Schema Readiness Gate

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Readiness gate / catalog and schema audit report
- Source task: #33 - CPG-DEMAND-003
- Version: 1.0
- Date: 2026-05-23
- Status: Documentation-only readiness decision; no implementation changes

## 1. Purpose And Boundaries

This report records the readiness gate before the first demand-side implementation slice.

The purpose is to decide whether CrewPortGlobal can safely move from the CPG-DEMAND-001 and CPG-DEMAND-002 planning documents into additive database/API work.

The main risk is creating structured demand fields that point to incomplete, ambiguous or demand-incompatible reference catalogs. This report therefore evaluates catalog readiness first, then schema/API block readiness.

This task did not change UI, database schema, migrations, backend/API behavior, tests, runtime behavior, matching/scoring, publication behavior or employment-decision logic.

## 2. Sources Inspected

Approved documents:

1. `docs/crewportglobal/165_cpg_demand_003_agent_execution_guide.md`
2. `docs/crewportglobal/162_cpg_demand_002_schema_api_implementation_plan.md`
3. `docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md`
4. `docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md`
5. `docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md`
6. `docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md`
7. `docs/crewportglobal/125_cpg_ref_001_seafarer_reference_catalog_foundation_report.md`
8. `docs/crewportglobal/128_cpg_ref_004_full_reference_catalog_publication_report.md`
9. `docs/crewportglobal/129_cpg_ref_005_public_form_reference_catalog_bindings_report.md`
10. `docs/crewportglobal/130_cpg_ref_006_seafarer_workspace_extended_form_report.md`
11. `docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md`
12. `docs/crewportglobal/00_documentation_register.md`

Read-only files inspected:

1. `projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql`
2. `projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql`
3. `projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql`
4. `projects/crewportglobal/app/backend/db/migrations/007_create_uploaded_documents.sql`
5. `projects/crewportglobal/app/backend/db/migrations/012_create_seafarer_workspace_records.sql`
6. `projects/crewportglobal/app/backend/api/lib/reference_catalogs.php`
7. `projects/crewportglobal/app/backend/api/public/index.php`
8. `projects/crewportglobal/public/post-vacancy/index.html`
9. `projects/crewportglobal/public/vacancies/index.html`
10. `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js`

Read-only database inspection:

```text
reference_catalogs / reference_catalog_values catalog code, scope, publication state and value counts only
```

No personal data, names, emails, document contents, candidate data or employer private values were selected.

Repository currency check:

```text
git pull --ff-only origin main
```

Result:

```text
main fast-forwarded to origin/main and included document 165 before this report was prepared.
```

## 3. Current Reference Catalog Inventory

The reference catalog foundation is implemented through:

```text
crewportglobal.reference_catalogs
crewportglobal.reference_catalog_values
```

The public catalog endpoint returns only active published catalogs and values:

```text
GET /api/v1/reference-catalogs
GET /api/v1/reference-catalogs?catalog_code=...
```

Read-only inspection confirmed the current database has:

```text
published catalogs: 24
published values: 1180
pending_owner_review catalogs: 0
pending_owner_review values: 0
```

Current published catalogs:

| Catalog code | Scope | Values | Demand relevance |
|---|---|---:|---|
| `agreement_values` | system | 2 | Consent/confirmation compatibility, not direct demand matching. |
| `airports` | global | 155 | Possible logistics support; not a port catalog. |
| `certificate_of_competence_types` | seafarer | 27 | Required COC demand matching. |
| `child_relation_types` | global | 2 | Seafarer family data only; not demand matching. |
| `cities` | global | 228 | Possible location support; not a port catalog. |
| `civil_status_values` | global | 4 | Seafarer-only personal data. |
| `confirmation_values` | system | 2 | Consent/confirmation compatibility. |
| `countries` | global | 248 | Company jurisdiction and vessel flag support. |
| `education_grades` | seafarer | 6 | Supply side; not demand MVP. |
| `education_institutions` | seafarer | 139 | Supply side; not demand MVP. |
| `endorsement_institutions` | seafarer | 40 | Institution catalog, not enough for required endorsement type matching. |
| `gender_values` | global | 2 | Seafarer personal data; not demand matching. |
| `harbourmasters` | seafarer | 27 | Seafarer document authority context; not a route/port catalog. |
| `information_source_values` | seafarer | 14 | Internal/source tracking; not demand matching. |
| `national_document_types` | seafarer | 17 | Identity/document context; not visa category by itself. |
| `nationalities` | global | 2 | Seafarer personal data; insufficient for countries but separate from demand. |
| `relation_types` | global | 16 | Seafarer family/contact data; not demand matching. |
| `religion_values` | seafarer | 12 | Sensitive seafarer data; excluded from matching. |
| `schengen_countries` | global | 26 | Partial route/visa support, not visa category catalog. |
| `seafarer_positions` | seafarer | 48 | Rank/position matching. |
| `training_course_types` | seafarer | 130 | Required STCW/training demand matching. |
| `vessel_type_matching_categories` | vessel | 9 | Possible vessel category grouping; overlaps with `vessel_types`. |
| `vessel_types` | vessel | 22 | Vessel type and vessel-type experience matching. |
| `yes_no_values` | global | 2 | Boolean compatibility only. |

Current demand-side frontend catalog bindings:

| Page | Control | Catalog |
|---|---|---|
| `/post-vacancy/` | `post-vessel-type` | `vessel_types` |
| `/post-vacancy/` | `post-vacancy-title` | `seafarer_positions` |

These bindings are datalist suggestions only. They do not yet store catalog value IDs.

## 4. Catalog Readiness Matrix

Readiness values:

```text
ready
partial
missing
blocked
unknown
```

| Catalog | Current source/status | Used by seafarer supply? | Needed by demand side? | Readiness | Cleanup needed | Seed data needed | MVP matching ready? | Notes |
|---|---|---:|---:|---|---|---|---:|---|
| Rank | `seafarer_positions`, published, 48 values | Yes | Yes | ready | Minor taxonomy review only | No | Yes | Ready for required-rank selection, but vacancy title must be split from rank. |
| Department | Hard-coded enum in UI/DB; no reference catalog | Yes, partially | Yes | partial | Yes | Maybe | Yes, limited | Current values are usable for MVP, but supply/demand taxonomy needs cleanup around `hotel`, `catering`, `other`. |
| Vessel type | `vessel_types` published 22 values; `vessel_type_matching_categories` published 9 values | Yes | Yes | partial | Yes | No initial seed | Yes, limited | Ready for MVP label guidance, but overlapping VESSELTYPE/VESSELTYPE2 needs owner decision before strict matching. |
| Country | `countries` published 248 values; current DB also uses ISO alpha-2 codes | Yes | Yes | ready | Minor code/label mapping review | No | Yes | Existing country-code validation can support MVP demand fields. |
| Port | Missing dedicated port catalog | No | Yes | missing | Yes | Yes | No | Airports, cities and harbourmasters do not replace joining/sign-off ports. |
| COC | `certificate_of_competence_types` published 27 values | Yes | Yes | ready | Minor equivalence review later | No | Yes | Ready for required COC demand rows after demand binding. |
| Endorsement | `endorsement_institutions` published 40 values | Yes, as institution/source context | Yes | partial | Yes | Yes | No | Demand requires endorsement types, not only issuing institutions. |
| STCW/training | `training_course_types` published 130 values | Yes | Yes | ready | Possible duplicate/label cleanup later | No | Yes | Ready for required training demand rows after demand binding. |
| Visa category | `national_document_types` and `schengen_countries` exist, but no visa-category catalog | Partially | Yes | partial | Yes | Yes | No | Needs dedicated visa/status categories before route-based matching. |
| Language/level | Missing language and level catalog | No | Yes | missing | Yes | Yes | No | Required before Maritime English/language matching. |
| Currency | Existing `vacancy_requests.currency` ISO-style validation; no catalog | No | Yes | ready | No for MVP | No | Yes | ISO 4217 validation is enough for MVP; catalog can be later. |
| Contract duration unit | Missing catalog/enum table; current duration is free text | No | Yes | missing | Yes | Yes | No | Need `day`, `week`, `month` or approved units before structured duration matching. |
| Rotation pattern | Missing | No | Yes | missing | Yes | Yes | No | Required for rotation fit; not needed for first MVP blocker slice. |
| Special operation tags | Missing | No | Yes | missing | Yes | Yes | No | Needed for tanker/offshore/passenger/DP/polar/crane/hazardous cargo. |
| Cargo type | Missing | No | Yes | missing | Yes | Yes | No | Needed for cargo-specific demand matching later. |
| Risk status | Missing internal/system catalog | No | Yes, internal only | blocked | Yes | Yes | No | Requires Project Owner decision on internal compliance visibility and values. |
| Verification status | Company and document statuses exist as DB constraints; no general catalog | Yes, through review statuses | Yes | partial | Yes | Maybe | Yes, limited | Company status is ready; vessel/evidence status needs additive contract. |

## 5. Catalog-To-Demand-Field Dependency Matrix

| Demand field/group | Required catalog | Current catalog readiness | Implementation impact | Recommended action |
|---|---|---|---|---|
| `crew_request.required_rank_value_id` | `seafarer_positions` | ready | Can implement reference relation when demand schema starts | Use in first structured demand field slice. |
| `crew_request.crew_department` | Department enum/catalog | partial | Can reuse current enum, but not ideal as catalog relation | Keep enum for MVP; create cleanup issue for supply/demand alignment. |
| `vessel.vessel_type_value_id` | `vessel_types` | partial | Can implement value ID, but strict matching should wait for overlap decision | Use as label/value relation with `vessel_type_matching_categories` decision recorded. |
| `crew_request.required_vessel_type_values` | `vessel_types` / matching categories | partial | Child table can be created later but blocker semantics need cleanup | Defer child table until catalog decision. |
| `company.jurisdiction_country`, `vessel.flag_country_code` | `countries` or ISO alpha-2 | ready | Safe as code validation / optional reference mapping | Use current code validation first. |
| `crew_request.joining_port`, `crew_request.sign_off_port` | Port catalog | missing | Reference relation blocked | Keep text/JSONB compatibility only until port catalog exists. |
| `crew_request.required_coc_values` | `certificate_of_competence_types` | ready | Ready for requirement child rows | Can be part of first real requirement table after framework exists. |
| `crew_request.required_endorsement_values` | Endorsement type catalog | partial | Current catalog is institution, not requirement type | Create/seed endorsement-type catalog before implementation. |
| `crew_request.required_training_values` | `training_course_types` | ready | Ready for requirement child rows | Can be part of first real requirement table after framework exists. |
| `crew_request.required_visa_values` | Visa category/status catalog | partial | Blocked for structured matching | Create visa category/status seed plan first. |
| `crew_request.required_language_levels` | Language and level catalogs | missing | Blocked for structured matching | Create language/level catalog before field implementation. |
| `contract_terms.currency` | ISO currency code or currency catalog | ready | Existing field is usable | Keep existing code validation; catalog later optional. |
| `contract_terms.contract_duration_unit` | Duration unit catalog | missing | Structured duration blocked | Seed small system catalog before structured duration field. |
| `contract_terms.rotation_pattern` | Rotation pattern catalog | missing | Rotation matching blocked | Later-stage catalog; not first slice. |
| `operational_risk.special_operation_tags` | Special operation tag catalog | missing | Operational blocker rows blocked | Later-stage seed issue. |
| `operational_risk.cargo_type_values` | Cargo type catalog | missing | Cargo matching blocked | Later-stage seed issue. |
| `operational_risk.trading_area_risk_status` | Risk status catalog | blocked | Internal risk implementation blocked | Requires Project Owner compliance decision. |
| Company/vessel/evidence status fields | Verification/evidence status catalog or constraints | partial | Company/document status usable; vessel status missing | Add vessel/evidence statuses only after owner-approved values. |

## 6. Catalog-To-Seafarer-Supply Compatibility Matrix

| Catalog | Seafarer-side use | Demand-side use | Compatible now? | Gap | Required action |
|---|---|---|---:|---|---|
| Rank / `seafarer_positions` | Profile primary rank, sea-service rank, post-vacancy datalist | Required rank | Yes | Demand still stores rank text, not value ID | Add demand value ID relation later; keep label snapshot. |
| Department | Profile department and demand department enums | Required department | Partial | Supply/demand values are close but not catalog-backed | Decide whether department remains enum or becomes catalog. |
| Vessel type / `vessel_types` | Seafarer preferences and sea-service vessel labels | Vessel profile type and required vessel type | Partial | `vessel_type_matching_categories` overlaps with `vessel_types` | Project Owner must choose strict vs category matching model. |
| Country / `countries` | Nationality/residence/country fields, issuing countries | Company jurisdiction, vessel flag, route context | Yes | Current production often uses two-letter code rather than catalog value ID | Keep code validation; catalog relation optional later. |
| COC / `certificate_of_competence_types` | Seafarer certificates | Required COC | Yes | Demand rows not implemented | Ready for future required COC child rows. |
| Endorsement | Seafarer endorsement records can exist; current catalog is institution | Required endorsements | No | Missing endorsement type catalog | Create endorsement-type catalog before demand blocker use. |
| STCW/training / `training_course_types` | Seafarer training records | Required training | Yes | Demand rows not implemented | Ready for future required training child rows. |
| Visa category | Identity/visa data and Schengen country support | Required visa / route eligibility | Partial | No canonical visa category/status catalog | Create visa category/status catalog before matching. |
| Language/level | Not currently structured as matching catalog | Required language/Maritime English | No | Missing both sides | Add supply/demand language model later. |
| Currency | Seafarer salary expectation and demand salary offer | Salary fit | Yes, code-level | Currency conversion not implemented | Keep USD/code validation for MVP; no scoring until policy exists. |
| Contract duration unit | Seafarer preference text and demand duration text | Duration fit | No | Missing structured duration on both sides | Add unit catalog and parsing rules before scoring. |
| Risk status | Not supply-side ordinary data | Internal risk/compliance gates | No | Internal-only taxonomy missing | Project Owner compliance decision required. |

## 7. Schema Block Readiness Matrix

Readiness statuses:

```text
ready_to_implement
needs_catalog_cleanup
needs_owner_decision
blocked
```

| Schema/API block | Depends on | Readiness status | Risk | Can be first slice? | Notes |
|---|---|---|---|---:|---|
| Existing column reuse | Existing `employer_companies`, `company_users`, `vessels`, `vacancy_requests` | ready_to_implement | Low | Yes | Safe for API projection and compatibility mapping. |
| New scalar column additions | Parent demand tables and owner-approved field list | needs_owner_decision | Low/medium | Not first | Some fields are safe, but choosing which first without catalog cleanup could create misleading structure. |
| New child table for demand requirements | Rank, vessel type, COC, endorsement, training, visa, language catalogs | needs_catalog_cleanup | Medium/high | No | COC/training are ready, but endorsement/visa/language are not. |
| Reference relation to catalogs | Published catalog values and approved exact mapping rules | needs_catalog_cleanup | Medium | No | Ready only for rank, country, COC, training and partial vessel type. |
| JSONB compatibility field | Existing parent records | ready_to_implement | Low | Yes | Safe as compatibility/staging if explicitly not used as final matching source. |
| Calculated/read-only demand projections | Existing columns, future normalized fields, visibility plan | needs_owner_decision | Medium | No | Useful after JSONB/scalar/catalog model exists. |
| Document-backed evidence statuses | `uploaded_documents` and document review statuses | ready_to_implement | Low/medium | Possible, not first | Company evidence can be projected; vessel/safe manning evidence needs document-type decisions. |
| Internal compliance/risk records | Compliance taxonomy, access control, risk status catalog | blocked | High | No | Requires Project Owner and compliance decision before schema work. |
| Matching-safe demand payload | Normalized fields, readiness levels, allow-list, blocker policy | blocked | High | No | Must wait for structured demand fields and catalog decisions. |
| Operator demand review payload | Existing fields plus future normalized projections | needs_owner_decision | Medium | No | Should follow schema/API skeleton, not precede it. |
| Employer demand workspace payload | Existing fields, optional JSONB compatibility, validation model | ready_to_implement | Medium | Possible | Safe only if disabled-by-default or compatibility-only. |

## 8. First Implementation Slice Options

| Option | Benefit | Risk | Dependencies | Safe as first slice? | Recommended? | Reason |
|---|---|---|---|---:|---:|---|
| Option A - Reference catalogs first | Prevents bad references and false matching blockers | Low if documentation/seed-review first | Existing catalog API/admin publication workflow | Yes | Yes | This directly addresses the main risk before schema fields reference catalogs. |
| Option B - `demand_workspace` JSONB compatibility first | Low-risk staged storage and compatibility layer | Medium if treated as final source | Existing parent records and feature flags | Yes | Conditional | Safe as second or paired minimal slice after catalog readiness decision. |
| Option C - vessel/vacancy scalar fields first | Adds useful structured data quickly | Medium; may create fields before catalog choices are ready | Owner-approved field list and validation | Maybe | No | Safe technically, but premature for matching-oriented work. |
| Option D - child requirement tables first | Creates future blocker/score foundation | High; several required catalogs missing/partial | Rank, vessel type, COC, endorsement, training, visa, language catalogs | No | No | Too much catalog debt remains. |
| Option E - demand readiness projection first | Helps operators see readiness | High if based on incomplete fields/catalogs | Structured data and blocker policy | No | No | Projection should summarize real normalized state, not legacy text. |

## 9. Recommended First Implementation Slice

Recommended first implementation slice:

```text
CPG-DEMAND-004 - Demand reference catalog cleanup and seed readiness
```

Scope:

1. Confirm which existing published catalogs are approved for demand use.
2. Decide vessel type strategy: `vessel_types` vs `vessel_type_matching_categories` vs both.
3. Create owner-approved seed plans for missing demand catalogs:
   - port / route location strategy;
   - endorsement type;
   - visa category/status;
   - language and level;
   - contract duration unit;
   - rotation pattern;
   - special operation tags;
   - cargo type;
   - risk/verification statuses where approved.
4. Define exact catalog codes for demand-specific catalogs.
5. Define which catalogs are MVP required and which are later-stage.
6. Keep UI/API/schema behavior unchanged unless a later implementation issue is approved.

Secondary implementation slice after CPG-DEMAND-004:

```text
CPG-DEMAND-005 - Minimal demand_workspace JSONB compatibility and disabled API skeleton
```

Reason:

`demand_workspace` compatibility is low-risk, but it should not become the first step until catalog readiness and naming decisions are recorded. The first implementation should prevent bad catalog dependencies; the second can introduce compatibility storage.

## 10. Blockers And Project Owner Decisions

| Decision | Options | Recommended option | Reason | Required before implementation? |
|---|---|---|---|---:|
| MVP demand catalogs | Use only ready catalogs; include partial/missing catalogs; defer all catalogs | Use ready catalogs for rank/country/COC/training/currency and explicitly defer missing catalogs | Avoid false blockers and keep MVP small | Yes |
| Vessel type model | Use `vessel_types`; use `vessel_type_matching_categories`; use both | Use `vessel_types` for labels and review `vessel_type_matching_categories` for matching categories | Existing overlap is known and must be resolved | Yes |
| Department model | Keep enum; create catalog; use free text | Keep enum for MVP and create cleanup task for supply/demand taxonomy | Low-risk and already constrained | Yes |
| Port catalog source | Internal seed; UN/LOCODE later; use free text only | Use text/JSONB compatibility now, decide UN/LOCODE or internal seed later | Avoid large seed work before MVP | No for JSONB; yes for port reference relation |
| Endorsement catalog | Reuse institutions; create endorsement-type catalog | Create endorsement-type catalog | Institutions are not requirement types | Yes before endorsement blocker rows |
| Visa catalog | Use national docs/Schengen countries; create visa category/status catalog | Create dedicated visa category/status catalog | Route and visa fit needs explicit categories | Yes before visa matching |
| Language/level catalog | Defer; seed Maritime English only; seed full language/level | Seed minimal Maritime English + level scale later | Useful but not required before first schema slice | No for first slice |
| Internal risk/compliance fields | Include in MVP; defer; system-only only | Defer from MVP and require owner compliance decision | High visibility/compliance risk | Yes before internal risk schema |
| First implementation slice | Catalog cleanup; JSONB compatibility; scalar columns; child tables | Catalog cleanup/readiness first | Prevents structured fields pointing to bad catalogs | Yes |

## 11. Future Issue Sequence

| Future issue | Scope | Depends on | Output | Priority |
|---|---|---|---|---|
| CPG-DEMAND-004 - Demand reference catalog cleanup and seed readiness | Decide existing catalog reuse, missing catalog codes, MVP/later catalog list and owner approvals | CPG-DEMAND-003 | Approved demand catalog readiness pack | P0 |
| CPG-DEMAND-005 - Minimal demand workspace compatibility contract | Additive/disabled plan or implementation for `demand_workspace` compatibility and section shape | CPG-DEMAND-004 decisions | Safe compatibility storage/API skeleton path | P0 |
| CPG-DEMAND-006 - Demand scalar field additive migration draft | Parent table scalar columns for safe low-risk fields | CPG-DEMAND-004/005 | Idempotent migration draft and static review | P1 |
| CPG-DEMAND-007 - Demand requirement child-table design | Requirement rows for rank, COC, training and later endorsement/visa/language | Catalog readiness pack | Child-table DDL/API contract | P1 |
| CPG-DEMAND-008 - Operator demand review projection | Operator view of demand sections and compatibility notes | Minimal schema/API skeleton | Review payload contract | P1 |
| CPG-DEMAND-009 - Public/applicant demand summary v2 | Allow-listed published demand summary | Visibility decisions and scalar fields | Public/applicant projection contract | P2 |
| CPG-DEMAND-010 - Matching-safe demand payload | Read-only demand payload for future matching workbench/service | Structured demand fields and readiness projection | Matching input contract only, no scoring | P2 |

## 12. Final Readiness Decision

| Area | Decision | Reason |
|---|---|---|
| Existing catalog foundation | Ready | Reference catalog tables/API/admin publication flow exist and all imported catalogs are published. |
| Demand MVP catalog base | Partial | Rank, country, COC, training, currency and limited department/vessel type support are usable; several demand-specific catalogs are missing. |
| First schema migration | Not recommended yet | Schema could be additive, but catalog dependencies are not ready enough for requirement child tables or strict reference relations. |
| First implementation slice | Reference catalog cleanup/readiness first | This prevents false confidence from structured fields that point to incomplete catalogs. |
| JSONB compatibility | Safe after catalog decision | Useful as second slice or minimal paired slice, but not a substitute for catalog readiness. |
| Child requirement tables | Blocked for first slice | Endorsement, visa, language, port, operation and risk catalogs are missing/partial. |
| Matching-safe payload | Blocked | Matching payload must wait for normalized demand fields and explicit visibility/allow-list rules. |

## 13. Acceptance Checklist

| Requirement | Status |
|---|---|
| Purpose and boundaries included | Met |
| Current reference catalog inventory included | Met |
| Catalog readiness matrix included | Met |
| Catalog-to-demand-field dependency matrix included | Met |
| Catalog-to-seafarer-supply compatibility matrix included | Met |
| Schema block readiness matrix included | Met |
| First implementation slice options included | Met |
| Recommended first implementation slice included | Met |
| Blockers and Project Owner decisions included | Met |
| Future issue sequence included | Met |
| No UI changes | Met |
| No DB migrations applied | Met |
| No backend/API changes | Met |
| No test changes | Met |
| No runtime behavior changes | Met |
| No matching/scoring implementation | Met |
| No publication or employment-decision logic | Met |
