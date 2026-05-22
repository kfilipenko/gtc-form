# CPG-DEMAND-003 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/33
- Status: Published for readiness-audit plan and execution

## 1. Executive instruction

This is a readiness gate task before demand-side implementation.

Do not apply database migrations. Do not modify UI, backend/API code, tests or runtime behavior.

The goal is to audit reference catalog readiness and schema-block readiness before creating the first implementation slice.

## 2. Business reason

CPG-DEMAND-002 produced a schema/API implementation plan.

Before any implementation starts, the team must know whether the required catalogs and schema blocks are ready.

The key risk is creating structured fields that point to incomplete or inconsistent reference catalogs.

The output must help Project Owner decide what implementation slice is safe to start first.

## 3. Required source documents

Read first:

```text
docs/crewportglobal/162_cpg_demand_002_schema_api_implementation_plan.md
docs/crewportglobal/160_cpg_demand_001_canonical_field_contract.md
docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md
docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
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
docs/crewportglobal/164_cpg_demand_003_reference_catalog_schema_readiness_gate.md
```

Update the documentation register if active.

## 5. Required report sections

The report must include:

```text
1. Purpose and boundaries.
2. Current reference catalog inventory.
3. Catalog readiness matrix.
4. Catalog-to-demand-field dependency matrix.
5. Catalog-to-seafarer-supply compatibility matrix.
6. Schema block readiness matrix.
7. First implementation slice options.
8. Recommended first implementation slice.
9. Blockers and Project Owner decisions.
10. Future issue sequence.
```

## 6. Catalogs to audit

Audit at minimum:

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
language and level
currency
contract duration unit
rotation pattern
special operation tags
cargo type
risk status
verification status
```

For each catalog, determine:

```text
exists
missing
partial
needs cleanup
needs seed data
used by seafarer side
needed by demand side
ready for MVP matching
blocked
```

## 7. Catalog readiness matrix

Use this table:

| Catalog | Current source/status | Used by seafarer supply? | Needed by demand side? | Readiness | Cleanup needed | Seed data needed | MVP matching ready? | Notes |
|---|---|---:|---:|---|---|---|---:|---|

Allowed readiness values:

```text
ready
partial
missing
blocked
unknown
```

## 8. Catalog-to-demand-field dependency matrix

Use this table:

| Demand field/group | Required catalog | Current catalog readiness | Implementation impact | Recommended action |
|---|---|---|---|---|

## 9. Catalog-to-seafarer-supply compatibility matrix

Use this table:

| Catalog | Seafarer-side use | Demand-side use | Compatible now? | Gap | Required action |
|---|---|---|---:|---|---|

Important examples:

```text
rank: seafarer primary rank ↔ required rank
vessel type: preferred vessel types / sea service ↔ vessel type / required vessel type
COC: seafarer certificates ↔ required COC
endorsement: seafarer endorsements ↔ required endorsements
STCW/training: seafarer training records ↔ required training
```

## 10. Schema block readiness matrix

Evaluate these blocks:

```text
existing_column reuse
new_column additions
new_child_table for demand requirements
reference_relation to catalogs
jsonb_compatibility field
calculated/read-only demand projections
document-backed evidence statuses
internal compliance/risk records
matching-safe demand payload
operator demand review payload
employer demand workspace payload
```

Use this table:

| Schema/API block | Depends on | Readiness status | Risk | Can be first slice? | Notes |
|---|---|---|---|---:|---|

Allowed readiness values:

```text
ready_to_implement
needs_catalog_cleanup
needs_owner_decision
blocked
```

## 11. First implementation slice options

Compare:

```text
Option A — Reference catalogs first
Option B — demand_workspace JSONB compatibility first
Option C — vessel/vacancy scalar fields first
Option D — child requirement tables first
Option E — demand readiness projection first
```

Use this table:

| Option | Benefit | Risk | Dependencies | Safe as first slice? | Recommended? | Reason |
|---|---|---|---|---:|---:|---|

## 12. Recommendation rule

The report must recommend one first implementation slice.

The likely safest path may be:

```text
Reference catalog readiness and minimal demand_workspace compatibility before structured blocker tables.
```

But the agent must confirm or challenge this based on the inspected project state.

## 13. Project Owner decisions

List decisions that require Project Owner approval:

```text
which catalogs are MVP required;
which catalogs may be postponed;
whether port catalog should use UN/LOCODE later;
whether demand_workspace JSONB compatibility should be first or second;
whether internal risk/compliance fields should be included in MVP;
which schema block becomes the first implementation issue.
```

Use this table:

| Decision | Options | Recommended option | Reason | Required before implementation? |
|---|---|---|---|---:|

## 14. Future issue sequence

Propose the next issues in order.

Use this table:

| Future issue | Scope | Depends on | Output | Priority |
|---|---|---|---|---|

## 15. Boundaries

Do not implement:

```text
actual DB migrations
UI changes
backend/API changes
test changes
matching/scoring implementation
publication behavior changes
employment decision logic
Stripe/OpenClaw/nginx/systemd/deployment changes
```

## 16. Required first response from agent

Before writing the full report, post a short readiness-audit plan:

```text
which documents will be read;
which files/schema areas will be inspected;
how catalog readiness will be evaluated;
how schema blocks will be evaluated;
how first-slice options will be compared;
confirmation that no UI/DB/backend/test/runtime changes will be made.
```

Wait for approval before preparing the full report.

## 17. Acceptance criteria

The task is complete when the report clearly answers:

```text
which catalogs are ready;
which catalogs are partial or missing;
which demand fields depend on each catalog;
which schema blocks are safe to implement first;
which blocks are blocked or need Project Owner decision;
what first implementation slice should be created next;
what future issue sequence should follow.
```