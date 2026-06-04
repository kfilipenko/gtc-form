# CPG-BIZ-098A - Contract Workspace Verified Source Prefill Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Contract workspace standard clarification report
- Source task: Project Owner clarification after CPG-BIZ-097
- Version: 1.0
- Date: 2026-06-04
- Status: Implemented in documentation and SQL draft; no runtime DB changes

## 1. Purpose

This report records the source-first contract workspace rule.

The seafarer / shipowner contract must be prepared from verified platform data, not from a blank duplicate questionnaire.

## 2. Clarified Principle

The contract is composed from:

```text
verified seafarer profile
+ verified employer / shipowner company card
+ verified vessel card
+ approved crew request / vacancy
+ approved shortlist / candidate presentation evidence
+ approved master contract template
+ approved contract field catalogs
= prefilled Contract Agreement Workspace
```

The parties review the populated contract in context and select only real contractual alternatives.

## 3. What Must Be Prefilled

| Source | Prefilled contract data |
|---|---|
| Seafarer profile | Identity, rank, certificates, document references, nationality, availability and relevant declared preferences. |
| Employer / shipowner card | Legal name, registration data, authorized representative and authority evidence. |
| Vessel card | Vessel name, flag, vessel type, particulars and vessel evidence. |
| Crew request / vacancy | Requested rank, joining date, contract duration, salary range, currency, vessel context and demand requirements. |
| Shortlist / presentation evidence | Selected candidate link and review basis. |

## 4. What Users May Select

Users or responsible team members may select only:

1. values intentionally defined as alternatives in the master contract;
2. catalog values that are not already fixed by verified source data;
3. controlled exceptions approved by the workflow;
4. corrections through the source-object correction process.

They must not manually retype verified facts into the contract to bypass incomplete or unverified source records.

## 5. Source Types

| Contract field source | Expected behavior |
|---|---|
| `linked_record` | Value is taken from verified platform record; user sees source and may request correction. |
| `computed` | Value is calculated from approved source records or approved workspace values. |
| `document_reference` | Value links to protected uploaded/verified document where available. |
| `catalog` | User selects from approved contract catalog alternatives. |
| `controlled_input` | Used only when no verified source or approved catalog can supply the value. |

## 6. Documentation Updated

| File | Update |
|---|---|
| `292_cpg_biz_095_contract_agreement_workspace_embedded_fields_standard.md` | Added verified source prefill rule. |
| `293_cpg_biz_096_contract_workspace_object_api_ui_design.md` | Added source-first data rule, source display rule and API source-prefill response shape. |
| `294_cpg_biz_097_contract_workspace_schema_sql_patch_draft.md` | Added source-first schema boundary. |
| `sql_drafts/018_contract_workspace_schema_draft.sql` | Added source metadata fields to `contract_embedded_field_values`. |
| `00_documentation_register.md` | Added this report. |
| `business_processes/00_business_process_register.md` | Added source-first contract data control. |

## 7. Verification

Performed static documentation and SQL-draft checks:

```bash
git diff --check
```

Result: passed.

No DDL, DML, seed data, migration or runtime change was executed.

## 8. Next Stage

The next stage remains the controlled approval gate:

```text
CPG-BIZ-098B - Contract workspace SQL draft approval and migration implementation decision
```

Before any migration is created or applied, the Project Owner should review:

1. whether the source metadata fields are sufficient for audit and UI traceability;
2. whether linked facts should be confirm-only or strictly read-only for each party;
3. whether additional source object types are needed before implementation.
