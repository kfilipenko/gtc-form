# CPG-DEMAND-003 - Reference Catalog And Schema Readiness Gate

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Narrow readiness gate / catalog alignment report
- Source task: #33 - CPG-DEMAND-003
- Version: 1.1
- Date: 2026-05-23
- Status: Documentation-only readiness decision; no implementation changes

## 1. Purpose And Project Owner Clarification

This document is a narrow readiness gate before demand-side implementation.

It does not repeat the schema/API design from document 162. Document 162 remains the accepted schema/API plan.

The only question answered here is:

```text
Can the first demand-side implementation slice start safely on the current Excel field dictionary and current reference catalogs,
or must a catalog cleanup/seed task happen first?
```

The answer is:

```text
Catalog cleanup/seed is required before the first catalog-backed demand implementation slice.
```

A very small compatibility-only implementation slice could start without catalog cleanup, but it would not be a reliable matching foundation. Any first slice that adds catalog-backed fields, reference relations, strict blockers or matching-ready demand requirements should wait for a dedicated demand catalog cleanup/seed task.

This task did not change UI, database schema, migrations, backend/API behavior, tests, runtime behavior, matching/scoring, publication behavior or employment-decision logic.

## 2. Readiness Scope

This gate compares three already-approved inputs:

1. The existing Excel field dictionary and the published reference catalogs imported from it.
2. The current catalog database/API state.
3. The canonical demand fields from document 160.

This gate does not decide table design. Schema/API implementation sequencing remains governed by document 162.

## 3. Sources Inspected

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

Read-only implementation files inspected only to confirm current bindings and storage, not to redesign them:

1. `projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql`
2. `projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql`
3. `projects/crewportglobal/app/backend/api/lib/reference_catalogs.php`
4. `projects/crewportglobal/app/backend/api/public/index.php`
5. `projects/crewportglobal/public/post-vacancy/index.html`
6. `projects/crewportglobal/public/vacancies/index.html`
7. `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js`

Read-only database inspection was limited to:

```text
reference_catalogs / reference_catalog_values catalog code, scope, publication state and value counts
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

## 4. Current Excel/Catalog Baseline

The current reference catalog foundation contains the 24 published catalogs imported from the existing source dictionary process.

Read-only inspection confirmed:

```text
published catalogs: 24
published values: 1180
pending_owner_review catalogs: 0
pending_owner_review values: 0
```

Published catalog inventory:

| Catalog code | Scope | Values | Demand relevance |
|---|---|---:|---|
| `agreement_values` | system | 2 | Consent/confirmation compatibility, not direct demand matching. |
| `airports` | global | 155 | Possible logistics support; not a port catalog. |
| `certificate_of_competence_types` | seafarer | 27 | Demand COC requirement candidate. |
| `child_relation_types` | global | 2 | Seafarer family data only. |
| `cities` | global | 228 | Possible location support; not a port catalog. |
| `civil_status_values` | global | 4 | Seafarer personal data only. |
| `confirmation_values` | system | 2 | Confirmation compatibility. |
| `countries` | global | 248 | Company jurisdiction, vessel flag and route support. |
| `education_grades` | seafarer | 6 | Supply-side education only. |
| `education_institutions` | seafarer | 139 | Supply-side education only. |
| `endorsement_institutions` | seafarer | 40 | Issuing institution context, not endorsement requirement type. |
| `gender_values` | global | 2 | Seafarer personal data only. |
| `harbourmasters` | seafarer | 27 | Document authority context, not route/port catalog. |
| `information_source_values` | seafarer | 14 | Internal source tracking. |
| `national_document_types` | seafarer | 17 | Identity/document context, not visa category. |
| `nationalities` | global | 2 | Seafarer personal data; not a country catalog substitute. |
| `relation_types` | global | 16 | Seafarer family/contact data only. |
| `religion_values` | seafarer | 12 | Sensitive seafarer data; excluded from matching. |
| `schengen_countries` | global | 26 | Partial visa/route support, not visa category. |
| `seafarer_positions` | seafarer | 48 | Rank/position matching candidate. |
| `training_course_types` | seafarer | 130 | STCW/training requirement candidate. |
| `vessel_type_matching_categories` | vessel | 9 | Possible matching grouping; overlaps with `vessel_types`. |
| `vessel_types` | vessel | 22 | Vessel type and vessel experience matching candidate. |
| `yes_no_values` | global | 2 | Boolean compatibility only. |

Current demand-side frontend catalog bindings:

| Page | Control | Catalog | Binding strength |
|---|---|---|---|
| `/post-vacancy/` | `post-vessel-type` | `vessel_types` | Datalist suggestion only. |
| `/post-vacancy/` | `post-vacancy-title` | `seafarer_positions` | Datalist suggestion only. |

These bindings do not yet store catalog value IDs.

## 5. Demand Canonical Field Alignment Matrix

This matrix checks document 160 canonical demand fields against the current Excel/catalog baseline.

| Demand object | Canonical field/group from document 160 | Current Excel/catalog support | Readiness | First-slice implication |
|---|---|---|---|---|
| Employer / Company Profile | Company jurisdiction country | `countries` exists and is published | ready | Can be supported by current catalog/code validation. |
| Employer / Company Profile | Company verification status | Status exists as workflow/state concept, not reference catalog | partial | Do not create new catalog relation until status model is approved. |
| Employer / Company Profile | Billing/payment terms | No relevant Excel reference catalog | missing | Not a catalog-backed MVP matching field. |
| Vessel Profile | Vessel type | `vessel_types` and `vessel_type_matching_categories` both exist | partial | Needs cleanup/owner decision on exact demand catalog. |
| Vessel Profile | Vessel flag country | `countries` exists | ready | Can be supported by current catalog/code validation. |
| Vessel Profile | Ports/trading area | `airports`, `cities`, `harbourmasters`, `schengen_countries` exist but no port catalog | missing | Port/trading-area relation blocked. |
| Vessel Profile | Cargo type | No cargo catalog | missing | Requires seed task before structured matching. |
| Crew Request / Vacancy Requirement | Required rank | `seafarer_positions` exists | ready | Ready as a catalog candidate, but current demand UI stores text. |
| Crew Request / Vacancy Requirement | Department | Existing enum/hard-coded values, no catalog | partial | Usable for MVP as enum; not ready as reference catalog. |
| Crew Request / Vacancy Requirement | Required vessel type | `vessel_types` / `vessel_type_matching_categories` exist with overlap | partial | Requires cleanup decision before strict matching. |
| Crew Request / Vacancy Requirement | Required COC | `certificate_of_competence_types` exists | ready | Ready as catalog candidate. |
| Crew Request / Vacancy Requirement | Required endorsement | Only `endorsement_institutions` exists | partial | Not enough; endorsement type seed/cleanup required. |
| Crew Request / Vacancy Requirement | Required STCW/training | `training_course_types` exists | ready | Ready as catalog candidate. |
| Crew Request / Vacancy Requirement | Required visa | `national_document_types` and `schengen_countries` are partial only | partial | Visa category/status seed required. |
| Crew Request / Vacancy Requirement | Required language/level | No language/level catalogs | missing | Seed required before matching. |
| Contract Terms | Currency | Existing ISO-style field validation, no catalog needed for MVP | ready | Safe as code-level scalar. |
| Contract Terms | Contract duration unit | No unit catalog | missing | Seed required before structured duration matching. |
| Contract Terms | Rotation pattern | No catalog | missing | Later-stage seed required. |
| Operational / Legal / Risk Requirements | Special operation tags | No catalog | missing | Seed required before operational matching. |
| Operational / Legal / Risk Requirements | Risk status | No approved internal risk catalog | blocked | Requires Project Owner compliance decision. |
| Operational / Legal / Risk Requirements | Verification status | Existing review/status concepts, no unified demand catalog | partial | Can stay workflow-level; catalog relation requires decision. |

## 6. Catalog Readiness Matrix

Readiness values:

```text
ready
partial
missing
blocked
unknown
```

| Catalog need | Current source/status | Used by seafarer supply? | Needed by demand side? | Readiness | Cleanup needed | Seed data needed | MVP matching ready? | Notes |
|---|---|---:|---:|---|---|---|---:|---|
| Rank | `seafarer_positions`, published, 48 values | Yes | Yes | ready | Minor taxonomy review only | No | Yes | Current catalog is usable, but demand must separate vacancy title from rank. |
| Department | Hard-coded enum; no reference catalog | Partial | Yes | partial | Yes | Maybe | Limited | Existing values can support UI continuity, not final catalog-backed matching. |
| Vessel type | `vessel_types` 22 and `vessel_type_matching_categories` 9 | Yes | Yes | partial | Yes | No initial seed | Limited | Owner must decide exact matching semantics. |
| Country | `countries`, published, 248 values | Yes | Yes | ready | Minor code/label mapping review | No | Yes | Good enough for company/vessel country fields. |
| Port | Missing dedicated port catalog | No | Yes | missing | Yes | Yes | No | Current airports/cities/harbourmasters are not a joining/sign-off port catalog. |
| COC | `certificate_of_competence_types`, published, 27 values | Yes | Yes | ready | Minor equivalence review later | No | Yes | Good enough for first COC requirement model after implementation starts. |
| Endorsement type | Only `endorsement_institutions`, published, 40 values | Partial | Yes | partial | Yes | Yes | No | Institution is not endorsement requirement type. |
| STCW/training | `training_course_types`, published, 130 values | Yes | Yes | ready | Possible duplicate/label cleanup later | No | Yes | Good enough for training requirement model. |
| Visa category/status | No dedicated catalog | Partial | Yes | partial | Yes | Yes | No | Needs explicit category/status model. |
| Language/level | Missing | No | Yes | missing | Yes | Yes | No | Required before language matching. |
| Currency | ISO-style field validation, no catalog | No | Yes | ready | No for MVP | No | Yes | Catalog is optional for MVP. |
| Contract duration unit | Missing | No | Yes | missing | Yes | Yes | No | Needs small system catalog or approved enum. |
| Rotation pattern | Missing | No | Yes | missing | Yes | Yes | No | Later-stage readiness gap. |
| Special operation tags | Missing | No | Yes | missing | Yes | Yes | No | Later-stage readiness gap. |
| Cargo type | Missing | No | Yes | missing | Yes | Yes | No | Later-stage readiness gap. |
| Risk status | Missing and compliance-sensitive | No | Internal only | blocked | Yes | Yes | No | Requires Project Owner decision before any implementation. |
| Verification status | Workflow/status concepts exist, no unified demand catalog | Partial | Yes | partial | Yes | Maybe | Limited | Keep as workflow/status first; catalogize later only if approved. |

## 7. Supply-Demand Compatibility Matrix

| Matching dimension | Supply-side catalog/source | Demand-side canonical field | Compatible now? | Gap | Gate decision |
|---|---|---|---:|---|---|
| Rank | `seafarer_positions` | Required rank | Yes | Demand stores text today | Can be first MVP catalog candidate. |
| Department | Hard-coded/profile values | Crew department | Partial | No catalog; taxonomy drift possible | Keep enum for continuity; cleanup before catalog relation. |
| Vessel type | `vessel_types` and sea-service vessel data | Vessel type / required vessel type | Partial | Two vessel catalog concepts overlap | Needs owner cleanup decision before strict matching. |
| Country | `countries` and code fields | Company jurisdiction / vessel flag | Yes | Code vs catalog value ID mapping | Safe for MVP with code validation. |
| COC | `certificate_of_competence_types` | Required COC | Yes | Demand relation not implemented | Ready after implementation starts. |
| Endorsement | Endorsement records and institution catalog | Required endorsement | No | Missing endorsement type catalog | Seed/cleanup required first. |
| STCW/training | `training_course_types` | Required training | Yes | Demand relation not implemented | Ready after implementation starts. |
| Visa | Identity/visa source fields, Schengen support | Required visa | Partial | Missing visa category/status catalog | Seed/cleanup required first. |
| Language | Not catalog-backed | Required language/level | No | Missing both supply and demand catalogs | Seed later; not first MVP. |
| Contract fit | Salary/currency/duration text | Salary/currency/duration/rotation | Partial | Currency ready; duration/rotation not structured | Use currency only for MVP; defer scoring. |
| Risk/operation | Not ordinary supply matching data | Operational/risk requirements | No | Missing internal taxonomy and visibility rules | Blocked until owner decision. |

## 8. Implementation Readiness Gate Against Document 162

This section does not redesign the schema/API plan. It only gates whether the accepted plan in document 162 can begin safely with the current catalog baseline.

| Document 162 implementation area | Catalog dependency status | Start now? | Gate result |
|---|---|---:|---|
| Existing field/backfill inventory | No new catalog dependency | Yes | Safe as documentation/static analysis only. |
| Compatibility JSON/workspace shape | No strict catalog dependency if disabled/compatibility-only | Conditional | Can start only if explicitly not treated as final matching source. |
| Parent scalar fields using current text/code values | Low catalog dependency | Conditional | Safe only for non-catalog scalar continuity fields. |
| Catalog-backed reference fields | Mixed: rank/COC/training/country ready; vessel/endorsement/visa/language/port not ready | No | Needs catalog cleanup/seed first. |
| Child requirement tables | Depends on several partial/missing catalogs | No | Do not start before catalog cleanup/seed. |
| Demand readiness projection | Depends on normalized fields and blocker policy | No | Premature before catalog-backed model exists. |
| Matching-safe payload | Depends on normalized fields, catalog alignment and visibility allow-list | No | Blocked until demand data model and publication guard are implemented. |
| Internal risk/compliance fields | Depends on owner-approved taxonomy and access rules | No | Blocked. |

## 9. First Slice Decision

| Possible first slice | Can start from current Excel/catalog baseline? | Recommended? | Reason |
|---|---:|---:|---|
| Reference catalog cleanup/seed readiness | Yes | Yes | Directly resolves the current blocker without changing product behavior. |
| Compatibility-only demand workspace | Conditional | Not first | Technically low-risk, but it does not solve catalog readiness and could create false confidence. |
| Demand scalar fields | Conditional | No | Safe only for a narrow subset; premature before catalog decisions. |
| Catalog-backed demand fields | No | No | Existing catalogs are too mixed for first implementation. |
| Demand requirement child tables | No | No | Endorsement, visa, language, port and operation catalogs are not ready. |
| Demand readiness projection / matching-safe payload | No | No | Requires normalized demand fields and guard policy first. |

Final first-slice recommendation:

```text
CPG-DEMAND-004 - Demand reference catalog cleanup and seed readiness
```

## 10. Required Catalog Cleanup/Seed Scope

The next task should not create demand schema yet. It should produce an approved catalog decision pack.

| Catalog decision | Recommended treatment | Reason |
|---|---|---|
| Rank | Approve `seafarer_positions` for demand rank use | Already published and supply-compatible. |
| Department | Decide enum vs catalog | Current enum can continue, but matching taxonomy needs control. |
| Vessel type | Decide `vessel_types` vs `vessel_type_matching_categories` usage | Current overlap blocks strict matching semantics. |
| Country | Approve code/catalog use rules | Current catalog is ready; code/value mapping must be explicit. |
| Port | Decide source strategy, likely later UN/LOCODE or controlled seed | Current catalogs do not represent ports. |
| COC | Approve `certificate_of_competence_types` for demand requirements | Ready and supply-compatible. |
| Endorsement type | Create/approve endorsement type catalog | Existing institution catalog is not enough. |
| STCW/training | Approve `training_course_types` for demand requirements | Ready and supply-compatible. |
| Visa category/status | Create/approve dedicated catalog | Current document/country catalogs are not enough. |
| Language/level | Create/approve minimal language and level catalogs | Required before language matching. |
| Currency | Keep ISO code validation for MVP | No catalog needed before first implementation. |
| Contract duration unit | Create small system catalog or enum decision | Required before structured duration. |
| Rotation pattern | Seed later-stage catalog | Not first MVP blocker. |
| Special operation tags | Seed later-stage catalog | Needed before operational matching. |
| Cargo type | Seed later-stage catalog | Needed before cargo-specific matching. |
| Risk status | Require Project Owner compliance decision | Sensitive internal classification. |
| Verification status | Keep workflow/status first; catalogize only if approved | Avoid creating unnecessary catalog layer. |

## 11. Project Owner Decisions Required

| Decision | Options | Recommended option | Required before demand implementation? |
|---|---|---|---:|
| Can implementation begin with current catalogs? | Yes for compatibility-only; no for catalog-backed fields | Start catalog cleanup/seed first | Yes |
| First implementation slice | Catalog cleanup/seed; JSONB compatibility; scalar fields; child tables | Catalog cleanup/seed | Yes |
| Vessel type semantics | Use `vessel_types`; use `vessel_type_matching_categories`; use both with defined roles | Define roles before strict matching | Yes |
| Endorsement model | Reuse institutions; create type catalog | Create endorsement type catalog | Yes for endorsement requirements |
| Visa model | Reuse national docs/Schengen; create visa category/status | Create visa category/status | Yes for visa requirements |
| Language model | Defer; seed Maritime English only; seed full language/level | Defer from first slice or seed minimal later | No for first catalog cleanup, yes before language matching |
| Port source | Internal seed now; UN/LOCODE later; free text compatibility | Decide source strategy, but do not block non-port MVP fields | No for catalog cleanup; yes before port relation |
| Risk statuses | Include in MVP; defer; system-only later | Defer and require compliance decision | Yes before risk implementation |

## 12. Future Issue Sequence

| Future issue | Scope | Depends on | Output | Priority |
|---|---|---|---|---|
| CPG-DEMAND-004 - Demand reference catalog cleanup and seed readiness | Approve reusable catalogs, define missing catalog codes and decide MVP/later catalog list | CPG-DEMAND-003 | Owner-approved demand catalog decision pack | P0 |
| CPG-DEMAND-005 - Minimal demand workspace compatibility | Compatibility storage/API shape only, explicitly not final matching source | CPG-DEMAND-004 decisions | Safe compatibility implementation path | P0 |
| CPG-DEMAND-006 - Demand scalar/reference implementation slice | First additive implementation using only approved ready catalogs | CPG-DEMAND-004/005 | Narrow implementation ticket | P1 |
| CPG-DEMAND-007 - Demand requirement child tables | Rank/COC/training first, then endorsement/visa/language after catalogs are approved | Catalog readiness pack | Requirement-table implementation plan | P1 |
| CPG-DEMAND-008 - Demand readiness projection | Read-only projection after normalized fields exist | Approved schema implementation | Operator/internal readiness contract | P1 |
| CPG-DEMAND-009 - Matching-safe demand payload | Allow-listed demand payload only, no scoring | Normalized fields and visibility guard | Matching input contract | P2 |

## 13. Final Gate Decision

| Question | Decision |
|---|---|
| Can a first demand-side implementation slice start immediately on current catalogs? | Not if it creates catalog-backed fields, requirement child tables, blocker logic or matching-ready payloads. |
| Is the current Excel/catalog baseline useless? | No. It already supports rank, country, COC, STCW/training and limited vessel type usage. |
| What blocks implementation? | Vessel type overlap, missing port catalog, missing endorsement type catalog, missing visa category/status, missing language/level, missing duration/rotation/operation/cargo catalogs and blocked risk taxonomy. |
| What should happen first? | Demand reference catalog cleanup/seed readiness task. |
| Does document 162 remain valid? | Yes. This gate only determines that catalog cleanup should precede the first catalog-backed implementation slice. |

## 14. Acceptance Checklist

| Requirement | Status |
|---|---|
| Narrow readiness gate scope applied | Met |
| Document 162 not re-designed or replaced | Met |
| Existing Excel/current catalog baseline checked | Met |
| Demand canonical fields from document 160 checked | Met |
| Catalog readiness matrix included | Met |
| Supply-demand catalog compatibility checked | Met |
| First-slice go/no-go decision included | Met |
| Catalog cleanup/seed recommendation included | Met |
| No UI changes | Met |
| No DB migrations applied | Met |
| No backend/API changes | Met |
| No test changes | Met |
| No runtime behavior changes | Met |
| No matching/scoring implementation | Met |
| No publication or employment-decision logic | Met |
