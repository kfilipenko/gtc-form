# CPG-DEMAND-005 - Additive Demand Matching Foundation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-004
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first practical additive implementation slice after the CPG-DEMAND-004 database/catalog reconciliation.

The goal is to prepare demand-side data for future automated request-offer matching without implementing matching, scoring, employment decisions or publication changes.

This slice keeps existing employer/vessel/vacancy forms compatible while adding catalog-backed demand fields and a minimal structured requirement layer for later matching logic.

## 2. Scope Implemented

Implemented narrowly:

1. Added nullable catalog links for demand-side rank and vessel type.
2. Added `demand_workspace` JSONB compatibility storage on `vacancy_requests`.
3. Added structured contract duration and future document-validity threshold fields.
4. Added `demand_requirement_items` for minimal catalog-backed demand rows.
5. Backfilled existing vacancies/vessels from current text fields where exact published catalog matches existed.
6. Updated backend save/read flows to populate and expose safe structured demand metadata.
7. Updated tests and Playwright migration chains to include migration 014.

Not implemented:

1. No matching algorithm.
2. No score calculation.
3. No candidate search endpoint.
4. No automatic publication.
5. No employment decision logic.
6. No UI field expansion.

## 3. Changed Files

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/db/migrations/014_demand_matching_foundation.sql` | New additive/idempotent migration for demand catalog links, `demand_workspace`, structured duration fields and `demand_requirement_items`. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Backend normalization, save, backfill-compatible response and requirement-item sync logic for demand matching foundation fields. |
| `playwright.crewportglobal.api.config.ts` | Added migration 014 to API test webServer bootstrap. |
| `playwright.crewportglobal.config.ts` | Added migration 014 to UI test webServer bootstrap. |
| `tests/crewportglobal-registration-api.spec.ts` | Added assertions for catalog-linked demand fields, structured duration, safe public vacancy output and requirement rows. |
| `docs/crewportglobal/168_cpg_demand_005_additive_matching_foundation_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 168 to the register. |

## 4. Migration 014 Details

Migration:

```text
projects/crewportglobal/app/backend/db/migrations/014_demand_matching_foundation.sql
```

Added to `crewportglobal.vacancy_requests`:

| Column | Type | Purpose |
|---|---|---|
| `required_rank_value_id` | UUID FK to `reference_catalog_values` | Catalog-backed required rank/position. |
| `required_rank_label` | TEXT | Text fallback from existing `rank`. |
| `vessel_type_value_id` | UUID FK to `reference_catalog_values` | Catalog-backed requested vessel type. |
| `vessel_type_label` | TEXT | Text fallback from existing `vessel_type`. |
| `contract_duration_value` | NUMERIC(8,2) | Parsed duration amount when unambiguous. |
| `contract_duration_unit` | TEXT | `day`, `week`, `month` or `year`. |
| `required_passport_validity_days` | INTEGER | Future passport-validity threshold. |
| `required_seaman_book_validity_days` | INTEGER | Future seaman-book-validity threshold. |
| `required_medical_validity_days` | INTEGER | Future medical-validity threshold. |
| `demand_workspace` | JSONB | Compatibility object for staged demand sections and legacy source text. |

Added to `crewportglobal.vessels`:

| Column | Type | Purpose |
|---|---|---|
| `vessel_type_value_id` | UUID FK to `reference_catalog_values` | Catalog-backed vessel type. |
| `vessel_type_label` | TEXT | Text fallback from existing `vessel_type`. |

Added table:

```text
crewportglobal.demand_requirement_items
```

The table currently supports these requirement groups:

```text
rank
vessel_type
coc
training
```

Only `rank` and `vessel_type` are populated automatically in this slice because current employer forms do not yet collect structured COC/training demand rows.

## 5. Backfill Result On GTC1

Migration 014 was applied on GTC1 against:

```text
database=gtc_db
schema=crewportglobal
```

Safe aggregate result after migration:

| Object | Result |
|---|---:|
| `vacancy_requests` rows | 151 |
| Vacancies with `required_rank_value_id` | 47 |
| Vacancies with `vessel_type_value_id` | 118 |
| Vacancies with structured `contract_duration_value/unit` | 151 |
| `vessels` rows | 107 |
| Vessels with `vessel_type_value_id` | 74 |
| `demand_requirement_items` rank rows | 47 |
| `demand_requirement_items` vessel-type rows | 118 |

Unmatched text remains preserved in legacy columns and labels. No demand row is deleted or force-mapped.

## 6. Backend/API Behavior

Employer vacancy save now still accepts the existing payload:

```text
vacancy.rank
vacancy.vessel_type
vacancy.contract_duration
vacancy.requirements
```

The backend now additionally derives:

```text
required_rank_value_id
required_rank_label
vessel_type_value_id
vessel_type_label
contract_duration_value
contract_duration_unit
demand_workspace.legacy
demand_workspace.matching_foundation
demand_requirement_items
```

Employer draft response now includes the internal owner-side `demand_workspace` and `demand_requirement_items`.

Public vacancy responses include safe structured summary fields, but do not expose `demand_workspace`.

## 7. Matching Readiness Impact

This slice makes the first future automated matching prototype possible for these exact dimensions:

| Matching dimension | Current readiness after CPG-DEMAND-005 |
|---|---|
| Rank / position | Partially ready where demand rank maps to `seafarer_positions`. |
| Vessel type | Partially ready where demand vessel type maps to `vessel_types`. |
| Contract duration | Ready as structured value/unit where text starts with an unambiguous duration. |
| COC requirement | Table supports it, but no structured demand capture yet. |
| Training requirement | Table supports it, but no structured demand capture yet. |
| Passport / seaman book / medical validity thresholds | Columns exist, but UI/API capture is not yet active. |
| Free-text requirements | Preserved only; not used for automatic matching. |

## 8. Verification

Syntax:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result:

```text
passed
```

Focused failed-test rerun:

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "employer vacancy request flows through review to public vacancy board"
```

Result:

```text
1 passed
```

Full API regression:

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result:

```text
15 passed
```

Focused post-vacancy UI regression:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result:

```text
1 passed
```

## 9. Remaining Gaps

1. Demand-side structured COC and training requirements are not yet collected by UI/API.
2. Demand-side validity thresholds are stored by schema but not yet collected by UI/API.
3. Rank catalog matching is partial because existing demand rank text does not always exactly match `seafarer_positions`.
4. Vessel type catalog matching is stronger but still not complete.
5. Free-text `requirements` remains preserved but intentionally excluded from automated matching until operator conversion or structured capture exists.
6. No matching candidate search endpoint exists yet.

## 10. Recommended Next Step

The next practical step should be:

```text
CPG-DEMAND-006 - Read-only internal candidate search prototype
```

Recommended first prototype behavior:

1. Read only approved/internal candidate supply data.
2. Read only reviewed demand requirement fields.
3. Match only exact catalog-backed dimensions first:
   - rank;
   - vessel type;
   - basic availability.
4. Return candidate explanations and blockers, not employment decisions.
5. Keep employer-facing presentation behind the existing approval guard.
