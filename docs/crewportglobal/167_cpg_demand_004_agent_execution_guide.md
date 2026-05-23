# CPG-DEMAND-004 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / implementation handoff
- Date: 2026-05-23
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/34
- Status: Published for DB/Excel reconciliation planning

## 1. Executive instruction

This is a practical DB reconciliation task, not another architecture-planning task.

The Project Owner clarified that the Excel dictionary was already used for SQL work and that some necessary supply-demand matching data may already exist in the current PostgreSQL database or in imported reference catalogs.

Your job is to verify the factual state and prepare only necessary additive completion.

Do not redesign all tables.
Do not repeat document 162.
Do not change runtime behavior.

## 2. Business goal

Confirm whether the existing database and Excel-derived reference catalogs are sufficient for automated matching:

```text
seafarer supply
↔
shipowner / employer / vessel / vacancy demand
```

The key questions are:

```text
1. Are current DB tables sufficient for automated request-offer matching?
2. Was the Excel dictionary fully imported into DB/catalog tables?
3. Which Excel-derived catalogs are present and populated?
4. Which demand-side catalogs/fields are missing, empty, partial or free-text-only?
5. Did prior analysis miss shipowner/employer/vessel/vacancy data already stored in DB?
6. What exact additive DB cleanup/seed/migration is required, if any?
7. Can we proceed to first automated matching prototype?
```

## 3. Required source documents

Read first:

```text
docs/crewportglobal/162_cpg_demand_002_schema_api_implementation_plan.md
docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md
docs/crewportglobal/164_cpg_demand_003_reference_catalog_schema_readiness_gate.md, if present
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
docs/crewportglobal/00_documentation_register.md
```

Inspect repository files:

```text
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
projects/crewportglobal/app/backend/db/migrations/011_create_reference_catalogs.sql
projects/crewportglobal/app/backend/db/migrations/*.sql
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/vacancies/index.html
```

Inspect private source paths if present on the server:

```text
/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls
/var/www/crewportglobal-private-sources/seafarer_fields/processed/
```

## 4. Required first response

Before running SQL or changing files, post a short Phase 1 plan:

```text
which DB will be inspected;
which Excel/import artifacts will be inspected;
which SQL read-only commands will be run;
how Excel catalogs will be compared to DB catalogs;
how demand matching sufficiency will be judged;
confirmation that no DDL/DML/runtime changes will be made in Phase 1.
```

Wait for Project Owner approval.

## 5. Phase 1 boundaries

During Phase 1, only read-only inspection is allowed.

Allowed:

```text
SELECT queries
\d / \dt / \dn style psql inspection commands
ls / find / sed / grep / cat read-only file inspection
python script --help or dry-run only if it does not write or apply SQL
```

Not allowed before approval:

```text
CREATE
ALTER
DROP
DELETE
UPDATE
INSERT
TRUNCATE
running generated SQL seed against DB
changing PHP/JS/UI/API files
changing tests
changing runtime services
```

## 6. Minimum read-only DB inspection

Run against the actual CrewPortGlobal DB used by the app.

First identify the DB and user:

```sql
SELECT current_database(), current_user, now();
```

List schemas and tables:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public', 'crewportglobal')
ORDER BY table_schema, table_name;
```

List columns:

```sql
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema IN ('public', 'crewportglobal')
ORDER BY table_schema, table_name, ordinal_position;
```

Find catalog/reference/dictionary tables:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public', 'crewportglobal')
  AND (
    table_name ILIKE '%catalog%'
    OR table_name ILIKE '%reference%'
    OR table_name ILIKE '%dictionary%'
    OR table_name ILIKE '%lookup%'
  )
ORDER BY table_schema, table_name;
```

If `crewportglobal.reference_catalogs` and `crewportglobal.reference_catalog_values` exist:

```sql
SELECT catalog_code, catalog_name, catalog_scope, source_name, source_sheet, is_active, publication_state
FROM crewportglobal.reference_catalogs
ORDER BY catalog_code;

SELECT rc.catalog_code, COUNT(rv.reference_catalog_value_id) AS values_count
FROM crewportglobal.reference_catalogs rc
LEFT JOIN crewportglobal.reference_catalog_values rv
  ON rv.reference_catalog_id = rc.reference_catalog_id
GROUP BY rc.catalog_code
ORDER BY rc.catalog_code;
```

If these names differ, report actual schema/table names first and adapt SELECT queries only.

## 7. Excel/import reconciliation

The known importer is:

```text
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
```

It maps Excel headers to DB catalog codes. At minimum reconcile:

| Excel header | Expected catalog code |
|---|---|
| POSITION | seafarer_positions |
| COUNTRY | countries |
| COC | certificate_of_competence_types |
| VESSELTYPE | vessel_types |
| VESSELTYPE2 | vessel_type_matching_categories |
| TRAINING_COURSES | training_course_types |
| NATIONAL_DOC | national_document_types |
| SHENGENCOUNTRY | schengen_countries |

Also inspect whether importer includes additional useful catalogs such as airports, cities, relation types, harbourmasters, yes/no values, confirmation/agreement values and information source values.

## 8. Demand-required catalog coverage

Check whether current DB contains direct or equivalent catalogs for:

```text
rank / position
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

Use statuses:

```text
present_populated
present_empty
present_partial
missing
equivalent_exists
free_text_only
needs_cleanup
needs_seed
ready_for_matching
```

## 9. Demand/supply matching sufficiency assessment

Assess existing DB sufficiency for these matching dimensions:

```text
rank / position
crew department
vessel type
COC
endorsement
STCW/training
passport / seaman book / medical validity requirements
availability / join date
contract duration
salary range / currency
vessel identity / IMO
trading area / route / visa / Schengen relevance
language level
risk/compliance status
verification status
```

For each dimension classify:

```text
structured_supply_available
structured_demand_available
catalog_linked
free_text_only
hard_blocker_ready
soft_score_only
not_ready
needs_owner_review
```

## 10. Required report output

Create:

```text
docs/crewportglobal/166_cpg_demand_004_existing_db_excel_catalog_reconciliation.md
```

The report must include:

```text
1. Purpose and Project Owner correction.
2. Existing DB inspection result.
3. Existing migration/import-script inspection result.
4. Excel source/import artifact availability.
5. Reference catalog table status.
6. Excel catalog -> DB catalog reconciliation matrix.
7. Demand-required catalog coverage matrix.
8. Existing DB data sufficiency for request-offer matching.
9. Missed shipowner/employer/vessel/vacancy fields, if any.
10. Gaps: missing / empty / partial / free-text-only / needs cleanup.
11. Proposed additive completion SQL, if needed.
12. Risk and rollback plan.
13. Go/no-go recommendation for first automated matching prototype.
14. Next implementation issue.
```

Update documentation register if active.

## 11. Additive completion, only after approval

If inspection shows DB completion is required, prepare but do not run without approval:

```text
projects/crewportglobal/app/backend/db/migrations/014_demand_reference_catalog_reconciliation.sql
```

If `014` exists, use next available migration number.

Allowed SQL patterns:

```sql
INSERT INTO ... ON CONFLICT (...) DO NOTHING;
INSERT INTO ... ON CONFLICT (...) DO UPDATE SET ...;
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;
CREATE TABLE IF NOT EXISTS ...;
CREATE INDEX IF NOT EXISTS ...;
```

Forbidden without separate approval:

```text
DROP TABLE
DELETE FROM
ALTER TABLE ... DROP COLUMN
mass UPDATE without WHERE
changing production API behavior
changing public UI
matching/scoring runtime implementation
```

## 12. Final decision expected

The report must conclude one of:

```text
A. Existing DB/catalogs are sufficient for first automated matching prototype.
B. Existing DB/catalogs are mostly sufficient; only seed/cleanup is required.
C. Existing DB/catalogs are insufficient; additive catalog/field migration is required.
D. Demand-side data exists but is free-text-only and requires operator structuring before matching.
```

## 13. Acceptance criteria

The task is complete only when the Project Owner can decide:

```text
proceed to first automated matching prototype
or
complete DB/catalog reconciliation first
```

Do not close or claim completion without factual DB evidence.