# CPG-BIZ-097 - Contract Workspace Schema And SQL Patch Draft

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: SQL schema draft report
- Source task: continuation after CPG-BIZ-096
- Version: 1.1
- Date: 2026-06-04
- Status: Drafted for Project Owner review; not applied

## 1. Purpose

This report records the proposed additive database schema for the future Contract Agreement Workspace.

The schema supports the CPG-BIZ-095/096 model:

```text
approved master agreement template
+ embedded condition fields inside clauses
+ verified platform records
+ party approvals tied to preview hash
+ generation guard
= generated contract instance
```

No DDL, DML, migration or runtime change was executed in this stage.

## 2. SQL Draft Location

The draft SQL is stored outside runtime migrations:

```text
docs/crewportglobal/sql_drafts/018_contract_workspace_schema_draft.sql
```

It is intentionally not stored as:

```text
projects/crewportglobal/app/backend/db/migrations/018_contract_workspace_schema.sql
```

This prevents accidental database application before Project Owner approval and migration review.

## 3. Existing Schema Alignment

The draft follows existing CrewPortGlobal database patterns:

| Existing pattern | Applied in draft |
|---|---|
| `crewportglobal` schema | Yes |
| `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Yes |
| `JSONB NOT NULL DEFAULT '{}'::jsonb` or `[]` for structured snapshots | Yes |
| `CHECK` constraints instead of PostgreSQL enum types | Yes |
| `CREATE TABLE IF NOT EXISTS` | Yes |
| `CREATE INDEX IF NOT EXISTS` | Yes |
| `crewportglobal.set_updated_at()` triggers | Yes |
| Additive schema only | Yes |

## 4. Proposed Tables

| Table | Purpose |
|---|---|
| `master_contract_templates` | Approved master agreement versions, status, hash and approval metadata. |
| `master_contract_clauses` | Fixed clauses `MC-*`, order, text, field references and hash. |
| `contract_field_catalogs` | Versioned approved catalog groups for embedded fields. |
| `contract_field_catalog_values` | Approved selectable catalog values. |
| `contract_workspace_instances` | One working contract workspace for one seafarer/employer/vessel/request combination, with optional direct link to the exact shortlist candidate row that triggered contract proposal. |
| `contract_embedded_field_values` | One structured value per `C-*` field in a workspace, including source object/type metadata for values prefilled from verified records. |
| `contract_workspace_party_approvals` | Seafarer, employer, reviewer and control approvals tied to preview hash. |
| `generated_contract_instances` | Final generated contract metadata, source hash and document hash. |
| `contract_generation_audit_events` | Audit log for workspace creation, field changes, approvals, blockers and generation. |

## 5. Actual DB Field Mapping Notes

CPG-BIZ-096 used some business-level names. The SQL draft maps them to current DB reality:

| Business design term | SQL draft field |
|---|---|
| `employer_profile_id` | `employer_company_id` referencing `crewportglobal.employer_companies(company_id)` |
| `candidate_presentation_id` | `shortlist_candidate_id` referencing `crewportglobal.operator_shortlist_candidates(shortlist_candidate_id)` for the exact selected candidate row; `vacancy_application_id` remains optional supporting evidence when an application/presentation row exists |
| generated protected document reference | nullable `document_id` referencing `crewportglobal.uploaded_documents(document_id)` plus `document_reference` |
| responsible employee | `assigned_user_id` referencing `crewportglobal.users(user_id)` |

This keeps the schema compatible with existing tables instead of inventing new identity concepts.

## 6. Guard-Supporting Fields

The proposed schema stores the minimum data needed for generation guards:

| Guard need | Proposed storage |
|---|---|
| Approved template | `master_contract_templates.template_status = 'approved'` |
| Approved catalog | `contract_field_catalogs.catalog_status = 'approved'` |
| Clause integrity | `master_contract_clauses.clause_hash` |
| Field completion | `contract_embedded_field_values.completion_status` |
| Source value traceability | `contract_embedded_field_values.source_object_type`, `source_object_id`, `source_field_code`, `source_status_snapshot` |
| Candidate-selection traceability | `contract_workspace_instances.shortlist_candidate_id` and `contract_embedded_field_values.source_object_type = 'shortlist_candidate'` |
| Current preview | `contract_workspace_instances.preview_hash` |
| Source snapshot | `contract_workspace_instances.source_snapshot_hash` |
| Party approval for current preview | `contract_workspace_party_approvals.approved_preview_hash` |
| Generated document integrity | `generated_contract_instances.generated_document_hash` |
| Audit evidence | `contract_generation_audit_events` |

## 7. Important Non-Scope

This stage does not:

1. apply the SQL patch;
2. create migration file under runtime migrations;
3. create seed data;
4. create API endpoints;
5. create UI pages;
6. generate PDF/DOCX;
7. implement electronic signatures;
8. change onboard, application, shortlist or billing states.

## 7.1 Source-First Prefill Boundary

The schema draft is intended to support source-first contract creation.

Contract workspaces should be created from verified platform records:

```text
verified seafarer profile
+ verified employer / shipowner company card
+ verified vessel card
+ approved crew request / vacancy
+ approved shortlist / candidate presentation evidence
= prefilled contract workspace
```

For fields that come from source records, `contract_embedded_field_values` stores the source object metadata and status snapshot. The future UI should show these values as linked or confirm-only facts, not as blank fields to be retyped.

Only true contractual alternatives, catalog choices, controlled exceptions and missing data corrections should require user selection or input. If a required linked fact is absent or not verified, the workspace should block generation and route the user/team back to the source object correction workflow.

## 8. Review Questions Before Approval

Before turning the draft into a real migration, the team should confirm:

1. whether `document_id` in `generated_contract_instances` should reference `uploaded_documents` or a future generated-documents table;
2. whether `contract_field_catalogs` should reuse generic `reference_catalogs` later or remain contract-specific;
3. whether one generated active contract per workspace is sufficient;
4. whether `workspace_number` should be generated by backend code or database sequence;
5. whether party approvals require additional legal/e-signature provider metadata.

Resolved by CPG-BIZ-098B/098C:

```text
contract_workspace_instances.shortlist_candidate_id
```

is the primary source link for the exact candidate row that makes the future "Propose contract" operation executable.

```text
contract_workspace_instances.vacancy_application_id
```

remains optional evidence only, because not every internal shortlist candidate necessarily originates from a candidate-submitted vacancy application.

## 9. Static Verification

Performed checks:

```bash
git diff --check
```

Result: passed.

The SQL draft was not executed against PostgreSQL.

## 10. Next Stage

After Project Owner review, the next stage can be one of two paths:

| Path | Meaning |
|---|---|
| CPG-BIZ-098C | Review the corrected SQL draft with `shortlist_candidate_id`, then approve conversion into runtime migration plus static/API tests, or return it for a revision cycle. |

Recommended next stage:

```text
CPG-BIZ-098C - Contract workspace SQL draft correction for shortlist candidate source link
```

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098C correction: direct `shortlist_candidate_id` link in contract workspace instances and `shortlist_candidate` as an embedded-field source object type |
| 1.0 | 2026-06-04 | GTC IT / AI Assistant | Initial documentation-only SQL draft report |
