# CPG-BIZ-095 - Contract Agreement Workspace And Embedded Condition Fields Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process / contract workspace standard
- Source task: Project Owner clarification after CPG-BIZ-094
- Version: 1.1
- Date: 2026-06-04
- Status: Approved operating model for future implementation planning

## 1. Purpose

This standard replaces the earlier idea of a separate contract-condition questionnaire as the user-facing contract workflow.

CrewPortGlobal must prepare seafarer / shipowner contracts through a single controlled contract workspace where:

1. the full master agreement text is visible to the parties;
2. variable fields are embedded inside the relevant contract clauses;
3. each variable field is connected to an approved catalog, verified platform record or controlled input type;
4. users select or confirm conditions in the context of the exact clause they affect;
5. the final generated contract is produced only after the embedded fields and party approvals are complete.

The user-facing model is therefore:

```text
approved master agreement template
+ embedded condition fields inside clauses
+ verified seafarer / employer / vessel records
+ party review and approval
= generated contract instance
```

The previous wording `separate contract-condition form` must not be used as the user-facing model.

## 2. Business Reason

A standalone questionnaire can be efficient, but it separates the selected condition from the legal text that explains its effect.

For contract formation this is risky because a party may select an apparently simple value, such as:

```text
Return responsibility: shipowner arranges and pays
```

without seeing how that choice interacts with:

1. return destination;
2. early termination;
3. illness or injury;
4. replacement;
5. repatriation;
6. evidence and billing;
7. mandatory flag-state, CBA or MLC-aligned protections.

The contract workspace solves this by letting the parties work inside the agreement itself.

## 3. Required Construction Sequence

The contract model must be built in this order:

| Step | Output | Purpose |
|---|---|---|
| 1 | Master contract template | Fixed legal text, clauses, definitions, clause IDs and version. |
| 2 | Contract field catalog | Approved variable fields, input type, source, requiredness, catalog values and permission rules. |
| 3 | Embedded field map | Links each `C-*` field to the exact clause and location in the agreement text. |
| 4 | Contract agreement workspace | UI where users review the agreement and fill/select embedded fields in context. |
| 5 | Party review and approval | Seafarer and shipowner/employer confirm the complete populated agreement. |
| 6 | Generated contract instance | System-generated final document with template version, selected values, signatures and hash. |

## 4. Workspace Modes

The future workspace should support these modes:

| Mode | Purpose | Editable by |
|---|---|---|
| `prepare_fields` | Responsible employee selects initial embedded values from verified records and approved catalogs. | Authorized team user |
| `party_review` | Parties read the contract with embedded values visible in context. | Seafarer and shipowner/employer |
| `correction_required` | A party or reviewer asks to correct a field without rewriting fixed clauses. | Authorized workflow participants |
| `ready_for_signature` | All required fields are complete and no guard blockers remain. | System-computed |
| `signed` | Required approvals/signatures are recorded. | Seafarer and shipowner/employer |
| `generated` | Final contract instance is generated and hashed. | System script |
| `blocked` | Required data, catalog, approval, law/CBA or document condition is unresolved. | System-computed |

## 5. Embedded Field Rules

Every variable condition must be represented as an embedded field inside the contract clause it affects.

Each embedded field must define:

| Attribute | Requirement |
|---|---|
| Field code | Stable `C-*` code from the clause library. |
| Clause reference | Exact `MC-*` clause and subclause where the field appears. |
| Display label | Human-readable field name. |
| Choice type | `single`, `multiple`, `linked_record`, `computed`, `date`, `number`, `money`, `text_controlled`, `document_reference` or `signature`. |
| Source | Verified record, approved catalog, controlled input or computed value. |
| Requiredness | Required, conditional or optional. |
| Completing role | Responsible employee, seafarer, shipowner/employer or system. |
| Approval scope | Which party must approve the value. |
| Change rule | Whether change is allowed before approval, after approval or only by correction workflow. |
| Guard blocker | Exact blocker if the field is missing, inconsistent or unsupported. |

## 6. User-Facing Presentation

The workspace must not look like a long isolated questionnaire.

The recommended presentation is:

1. a compact clause navigation panel;
2. full contract text in the main panel;
3. embedded fields shown inline inside the relevant clause;
4. short tooltips for field meaning;
5. a compact missing-field/checklist panel;
6. final preview mode where technical controls disappear and only the populated contract text remains.

The party should always understand:

```text
which contract clause is being accepted
+ which selected value changes that clause
+ who selected it
+ who approved it
+ whether it is ready for signature
```

## 7. What Is Not Allowed

The workflow must not:

1. ask parties to sign a standalone list of variables without showing the affected contract clauses;
2. let operational users rewrite legal clause wording;
3. allow unapproved free-text legal conditions;
4. hide material joining, wage, return, repatriation, replacement or document conditions outside the contract;
5. generate a final document from values the parties did not see in contract context;
6. treat a questionnaire approval as a substitute for contract review.

## 8. Structured Storage Boundary

The user-facing workspace is a contract document with embedded fields.

The backend may still store the selected values in normalized tables.

Recommended future object names:

| Object | Purpose |
|---|---|
| `contract_workspace_instances` | One working contract workspace for a seafarer, employer, vessel and request. |
| `contract_embedded_field_values` | Structured values selected for `C-*` fields. |
| `contract_embedded_field_approvals` | Party and reviewer approvals for embedded values and contract review. |
| `generated_contract_instances` | Final generated documents, hashes, versions and source references. |
| `contract_generation_audit_events` | Audit trail for every field change, approval, blocker, generation and exception. |

The old name `contract_condition_forms` may be used only as a migration alias if legacy code requires it. New documentation and implementation should use `contract_workspace_instances` and `contract_embedded_field_values`.

## 9. Relationship To CPG-BIZ-094

CPG-BIZ-094 remains valid as the clause library and catalog seed.

This document changes the user-facing and process model:

| CPG-BIZ-094 concept | CPG-BIZ-095 clarified model |
|---|---|
| Contract-condition form | Contract agreement workspace with embedded condition fields |
| Signed condition form | Party approval of populated contract workspace |
| Condition values | Embedded field values linked to exact clauses |
| Form approval | Contract review and approval in clause context |
| Generated contract after form approval | Generated contract after populated workspace approval/signature |

## 10. Guard Before Generation

The final contract must not be generated unless:

1. master agreement version is approved;
2. embedded field catalog version is approved;
3. all required embedded fields are completed;
4. all required values are shown in contract context;
5. verified seafarer, employer and vessel records are linked;
6. party approvals/signatures are recorded;
7. no `to_be_agreed` value remains unless a controlled exception is approved;
8. no fixed clause text was edited outside approved template versioning;
9. final preview hash/source snapshot is recorded.

## 11. Documentation Control

Any future document that describes contract formation must use this standard.

Preferred terms:

| Use | Avoid |
|---|---|
| Contract Agreement Workspace | separate contract questionnaire |
| embedded condition field | detached condition field |
| populated contract workspace | signed condition form |
| party contract review | questionnaire approval |
| generated contract instance | manually drafted contract |

## 12. Next Stage

CPG-BIZ-096 has now defined the future runtime workspace object, API, UI, guard and audit model.

The next implementation-planning stage should be:

```text
CPG-BIZ-097 - Contract workspace schema and SQL patch draft
```

That stage should show the additive SQL design first and must not execute DDL/DML without separate approval.

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-06-04 | GTC IT / AI Assistant | Updated next stage after CPG-BIZ-096 contract workspace object/API/UI design |
| 1.0 | 2026-06-04 | GTC IT / AI Assistant | Initial Contract Agreement Workspace and embedded condition fields standard |
