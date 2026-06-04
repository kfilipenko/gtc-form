# CPG-BIZ-098D - Contract Workspace Runtime Migration Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Runtime migration implementation report
- Source task: Project Owner approval after CPG-BIZ-098C
- Version: 1.0
- Date: 2026-06-04
- Status: Implemented and verified on test DB

## 1. Purpose

This report records conversion of the approved Contract Agreement Workspace SQL draft into a runtime database migration.

The migration creates the schema foundation needed for future contract workspace implementation:

1. approved master contract templates;
2. fixed master contract clauses;
3. contract field catalogs and catalog values;
4. contract workspace instances;
5. embedded field values with source traceability;
6. party approvals tied to preview hash;
7. generated contract instance records;
8. contract generation audit events.

## 2. Implementation Boundary

This slice implements database schema only.

It does not implement:

1. API endpoints;
2. shipowner candidate menu;
3. `Предложить контракт` UI button;
4. contract workspace page;
5. seed data for templates or catalogs;
6. generated PDF/DOCX files;
7. electronic signatures;
8. changes to shortlist, application, onboarding, billing or voyage states.

## 3. Runtime Migration

Created runtime migration:

```text
projects/crewportglobal/app/backend/db/migrations/018_contract_workspace_schema.sql
```

Source draft:

```text
docs/crewportglobal/sql_drafts/018_contract_workspace_schema_draft.sql
```

The runtime migration keeps the approved CPG-BIZ-098C correction:

```text
contract_workspace_instances.shortlist_candidate_id
```

This allows a future contract workspace to be linked to the exact selected candidate row.

## 4. Test Bootstrap Update

Updated Playwright database bootstrap to apply migration 018:

```text
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
```

This ensures API/UI regression environments include the contract workspace schema.

## 5. Tables Created

The migration creates these tables:

| Table | Purpose |
|---|---|
| `master_contract_templates` | Approved master agreement versions and hashes. |
| `master_contract_clauses` | Fixed `MC-*` clauses and field references. |
| `contract_field_catalogs` | Approved embedded-field catalog versions. |
| `contract_field_catalog_values` | Approved selectable values. |
| `contract_workspace_instances` | One contract workspace per seafarer / employer / vessel / request / candidate context. |
| `contract_embedded_field_values` | Structured `C-*` field values with source object traceability. |
| `contract_workspace_party_approvals` | Party/reviewer/control approvals tied to preview hash. |
| `generated_contract_instances` | Generated contract metadata and document hash. |
| `contract_generation_audit_events` | Audit trail for contract workspace operations. |

## 6. Source Traceability

The migration supports these source object types for embedded values:

```text
seafarer_profile
employer_company
vessel
vacancy_request
shortlist_draft
shortlist_candidate
vacancy_application
uploaded_document
contract_workspace
```

The new `shortlist_candidate` type is required because a future contract proposal must be tied to a specific candidate selection event.

## 7. Verification

### 7.1 Static Diff Check

```bash
git diff --check
```

Result: passed.

### 7.2 Runtime Migration Application

```bash
PGHOST=${PGHOST:-127.0.0.1} \
PGUSER=${PGUSER:-gtc_user} \
PGPASSWORD=${PGPASSWORD:-gtc_pass} \
PGDATABASE=${PGDATABASE:-gtc_db} \
psql -v ON_ERROR_STOP=1 \
  -f projects/crewportglobal/app/backend/db/migrations/018_contract_workspace_schema.sql
```

Result: migration applied successfully on the test DB.

### 7.3 Idempotency Check

The same migration was executed a second time.

Result: passed. Existing tables, indexes and triggers were safely skipped/recreated where designed.

### 7.4 Schema Check

Confirmed nine contract workspace tables exist in `crewportglobal`.

Confirmed `contract_workspace_instances` contains:

```text
shortlist_candidate_id
shortlist_draft_id
vacancy_application_id
source_snapshot_hash
```

Confirmed `contract_embedded_field_values_source_object_type_chk` allows:

```text
shortlist_candidate
```

### 7.5 API Regression

```bash
npm run test:cpg-api
```

Result:

```text
22 passed
```

## 8. Current Status

The contract workspace database foundation is now implemented as a runtime migration and verified in the test environment.

The next implementation must still preserve the source-first rule:

```text
verified source records first
+ selectable contract alternatives only where real choice exists
+ exact shortlist candidate source link
= controlled contract workspace
```

## 9. Next Recommended Stage

Recommended next stage:

```text
CPG-BIZ-099 - Shipowner candidate review menu and Propose Contract computed operation design
```

That stage should design the employer-side candidate list and define the exact guard for showing:

```text
Предложить контракт
```

No UI button should be added until the candidate-view visibility rule and contract-proposal guard are defined.

