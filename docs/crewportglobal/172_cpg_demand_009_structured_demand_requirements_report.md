# CPG-DEMAND-009 - Structured Demand Requirements Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-008
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the structured demand requirements implementation slice.

The purpose is to strengthen the shipowner/employer request side before building any shortlist. The platform now stores machine-readable demand requirements for certificates, training, endorsements, visa, language, sea-service and general constraints, while preserving the existing legacy rank and vessel type mapping.

This slice does not implement automatic scoring, shortlist creation, employer-facing presentation, matching decisions, publication decisions or employment decisions.

## 2. Scope Implemented

Existing vacancy creation/update can now accept structured requirement inputs in the `vacancy` payload:

```text
required_coc_values
required_endorsement_values
required_training_values
required_visa_values
required_language_levels
required_sea_service_months
must_have_requirements
nice_to_have_requirements
disqualifying_requirements
demand_requirement_items
```

The backend normalizes these values into `crewportglobal.demand_requirement_items` with:

```text
requirement_group
requirement_kind
requirement_key
reference_catalog_code
reference_value_id
requirement_label
source
metadata
```

Legacy mappings remain:

```text
rank -> seafarer_positions
vessel_type -> vessel_types
```

New structured groups are:

```text
coc
endorsement
training
visa
language
sea_service
general
```

## 3. Migration 015

Migration:

```text
projects/crewportglobal/app/backend/db/migrations/015_demand_structured_requirements.sql
```

Additive changes:

| Area | Change |
|---|---|
| `demand_requirement_items.requirement_key` | Added `TEXT NOT NULL DEFAULT 'primary'` so multiple rows can exist per group/source. |
| Group constraint | Expanded from `rank/vessel_type/coc/training` to include `endorsement`, `visa`, `language`, `sea_service` and `general`. |
| Active uniqueness | Replaced old `(vacancy_request_id, requirement_group, source)` uniqueness with `(vacancy_request_id, requirement_group, source, requirement_key)`. |
| Catalog lookup index | Added active lookup index on `(reference_catalog_code, reference_value_id)`. |

Compatibility adjustment:

`014_demand_matching_foundation.sql` was made idempotent after `015` by not recreating the old single-row-per-group unique index when `requirement_key` exists, and by making legacy backfill inserts safe on repeated bootstrap runs.

## 4. Requirement Group Matrix

| Requirement group | Input field | Catalog behavior | Matching role |
|---|---|---|---|
| `rank` | `rank` | `seafarer_positions` | Existing hard matching foundation. |
| `vessel_type` | `vessel_type` | `vessel_types` | Existing hard matching foundation. |
| `coc` | `required_coc_values` | `certificate_of_competence_types` when value matches published catalog | Future hard blocker candidate. |
| `endorsement` | `required_endorsement_values` | `national_document_types` interim catalog | Future hard blocker candidate after catalog cleanup. |
| `training` | `required_training_values` | `training_course_types` when value matches published catalog | Future hard blocker or strong score candidate. |
| `visa` | `required_visa_values` | `national_document_types` partial/interim; label-only allowed | Future compliance/readiness blocker after catalog decision. |
| `language` | `required_language_levels` | Metadata-only until language catalog exists | Future soft score or role-specific blocker. |
| `sea_service` | `required_sea_service_months` | Metadata stores months/rank/vessel context | Future experience blocker or score input. |
| `general` | `must_have_requirements`, `nice_to_have_requirements`, `disqualifying_requirements` | Label/metadata only | Review support; not direct automated blocker without later parsing/approval. |

## 5. API Behavior

When structured fields are present, the API writes normalized rows with `source='operator_structured'`.

On vacancy update, existing active `operator_structured` rows for that vacancy are archived and replaced with the newly submitted structured rows. Legacy rank/vessel rows are preserved separately with `source='legacy_mapping'`.

The response includes the normalized rows in:

```text
payload.demand_requirement_items
```

The internal compatibility payload also records:

```text
payload.vacancy_request.demand_workspace.structured_requirements
payload.vacancy_request.demand_matching_foundation.structured_requirements_ready
```

Public vacancy detail still does not expose `demand_workspace`.

## 6. Matching Boundary

This slice prepares inputs for future matching, but does not change candidate search scoring or candidate presentation.

No-side-effect boundary remains:

```text
no automatic shortlist
no vacancy application creation
no employer-facing presentation
no seafarer publication
no employment decision
```

Current read-only candidate search remains compatible and continues to use the existing matching dimensions from CPG-DEMAND-008.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/db/migrations/015_demand_structured_requirements.sql` | Added additive structured demand requirement migration. |
| `projects/crewportglobal/app/backend/db/migrations/014_demand_matching_foundation.sql` | Made legacy demand requirement backfill compatible with repeated runs after migration 015. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added structured demand requirement normalization and persistence. |
| `playwright.crewportglobal.api.config.ts` | Added migration 015 to API test bootstrap. |
| `playwright.crewportglobal.config.ts` | Added migration 015 to UI test bootstrap. |
| `tests/crewportglobal-registration-api.spec.ts` | Added structured demand requirement API assertions. |
| `docs/crewportglobal/172_cpg_demand_009_structured_demand_requirements_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 172 to the register. |

## 8. Verification

The implementation was verified on GTC1.

### 8.1 Syntax Check

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Migration Check

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db \
psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/015_demand_structured_requirements.sql
```

Result: passed.

### 8.3 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "employer vacancy request flows through review to public vacancy board"
```

Result: 1 passed.

This check confirms:

1. Structured requirement fields are accepted in vacancy creation.
2. `coc`, `endorsement`, `training`, `visa`, `language`, `sea_service` and `general` rows are returned in `demand_requirement_items`.
3. Catalog-backed COC/training/endorsement rows resolve reference values where current catalogs support them.
4. Visa/language requirements remain safe label/metadata rows when dedicated catalogs are not ready.
5. Public vacancy detail does not expose `demand_workspace`.

### 8.4 API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result: 16 passed.

### 8.5 Focused UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

This confirms the operator queue and read-only candidate-search panel remain compatible with the expanded demand requirement payload.

## 9. Next Recommended Step

The next slice can start using structured demand requirements in the read-only candidate-search evaluator.

Recommended order:

1. Add read-only blockers for catalog-backed `coc` and selected `training` requirements.
2. Add sea-service months as a separate experience dimension.
3. Keep visa/language/general requirements out of hard automation until catalog cleanup and Project Owner rules are approved.
4. Only after read-only evaluation is stable, design an internal shortlist draft object with approval guard and no employer visibility by default.
