# CPG-BIZ-096 - Contract Workspace Object, API And UI Design

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Contract workspace object, API and UI design
- Source task: continuation after CPG-BIZ-095
- Version: 1.1
- Date: 2026-06-04
- Status: Drafted for Project Owner review

## 1. Purpose

This document designs the future CrewPortGlobal Contract Agreement Workspace.

The workspace must let the team, seafarer and shipowner/employer prepare and approve a seafarer / shipowner contract while seeing the full agreement text and the embedded variable fields inside the clauses they affect.

This document does not implement code, database migrations, runtime contract generation or electronic signature.

## 2. Controlling Standards

This design follows:

| Standard | Role |
|---|---|
| CPG-BIZ-091 | Initial seafarer / shipowner contract structure and required contract subjects. |
| CPG-BIZ-092 | Formal document reference and future workspace preparation standard. |
| CPG-BIZ-093 | Public master agreement versioning and immutable clause control. |
| CPG-BIZ-094 | Clause library `MC-*`, variable fields `C-*` and catalog seed. |
| CPG-BIZ-095 | Contract Agreement Workspace and embedded condition fields as the required user-facing model. |
| BP-012 / BP-015 / BP-016 | Crew formation, commercial cycle and stage-to-standard mapping. |

## 3. Target Business Outcome

The contract workspace must support this business result:

```text
employer selects candidate
+ contract workspace is prepared
+ parties approve contract terms in contract context
+ generated contract is produced
+ boarding / onboard status can be tracked
+ billing and service evidence are connected
+ return / repatriation support is controlled
```

The contract is not just a file. It is the record that connects:

1. vacancy / crew request;
2. selected seafarer;
3. employer / shipowner;
4. vessel;
5. agreed wages and payment terms;
6. joining and boarding;
7. return and repatriation;
8. replacement rules;
9. onboard service evidence;
10. billing basis.

## 3.1 Source-First Contract Data Rule

The workspace is created from already verified platform records, not from a blank contract form.

The first fill of the contract must use:

```text
verified seafarer profile
+ verified employer / shipowner company card
+ verified vessel card
+ approved crew request / vacancy
+ approved shortlist / candidate presentation evidence
= prefilled contract workspace
```

The workspace then separates fields into two groups:

| Field group | Source | User action |
|---|---|---|
| Verified linked facts | Approved platform cards and requests | View source, confirm, or request correction of the source record. |
| Contractual choices | Approved contract catalogs or controlled inputs | Select one/multiple permitted terms in the contract clause context. |

Examples of verified linked facts:

1. seafarer name, rank and document references;
2. employer legal name and authorized representative;
3. vessel name, flag and vessel type;
4. requested rank, joining date and demand context from the crew request.

Examples of contractual choices:

1. wage payment frequency;
2. payment route;
3. joining travel responsibility where not already fixed;
4. return/repatriation responsibility where a permitted alternative must be selected;
5. replacement / early termination option when the master contract permits alternatives.

If a field should come from a verified source but the source is missing, outdated or not approved, the workspace must show `blocked_missing_data` and compute a correction task for the relevant source object. It must not allow manual retyping in the contract as a shortcut.

## 4. Workspace Object Model

### 4.1 `contract_workspace_instances`

One workspace exists for one intended contract instance.

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Workspace ID. |
| `workspace_number` | text | Human-readable contract workspace reference. |
| `workspace_status` | enum | Current state of the workspace. |
| `master_agreement_version` | text | Approved master template version. |
| `catalog_version` | text | Approved embedded-field/catalog version. |
| `seafarer_profile_id` | uuid | Linked seafarer. |
| `employer_profile_id` | uuid | Linked employer / shipowner. |
| `vessel_id` | uuid | Linked vessel. |
| `vacancy_request_id` | uuid | Linked crew request / vacancy. |
| `shortlist_draft_id` | uuid nullable | Linked internal shortlist draft if applicable. |
| `candidate_presentation_id` | uuid nullable | Linked candidate presentation record if applicable. |
| `created_by_user_id` | uuid | Responsible creator. |
| `assigned_group_code` | text | Responsible group. |
| `assigned_user_id` | uuid nullable | Assigned employee if personalized. |
| `blocked_reason_snapshot` | jsonb | Current blocker summary. |
| `preview_hash` | text nullable | Hash of current preview text and values. |
| `generated_contract_id` | uuid nullable | Final generated contract instance. |
| `created_at` | timestamptz | Creation timestamp. |
| `updated_at` | timestamptz | Last update timestamp. |

### 4.2 `contract_embedded_field_values`

Stores each selected or computed `C-*` value.

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Value row ID. |
| `workspace_id` | uuid | Parent workspace. |
| `field_code` | text | Stable `C-*` code. |
| `clause_id` | text | Related `MC-*` clause. |
| `choice_type` | enum | `single`, `multiple`, `linked_record`, `computed`, `date`, `number`, `money`, `text_controlled`, `document_reference`, `signature`. |
| `source_type` | enum | `catalog`, `linked_record`, `computed`, `controlled_input`, `document_reference`. |
| `value_code` | text nullable | Catalog value code for `single` or each `multiple` item. |
| `value_json` | jsonb | Structured value, including amount/currency/date/list/reference. |
| `display_value` | text | Safe display value in the agreement. |
| `requiredness` | enum | `required`, `conditional`, `optional`. |
| `completion_status` | enum | `missing`, `draft`, `ready`, `blocked`, `approved`. |
| `last_changed_by_user_id` | uuid nullable | Actor who changed value. |
| `last_changed_at` | timestamptz | Last change timestamp. |

### 4.3 `contract_workspace_party_approvals`

Stores contract-context approvals.

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Approval row ID. |
| `workspace_id` | uuid | Parent workspace. |
| `party_type` | enum | `seafarer`, `employer`, `platform_reviewer`, `control`. |
| `party_user_id` | uuid nullable | Linked user when available. |
| `approval_status` | enum | `not_requested`, `requested`, `approved`, `rejected`, `correction_requested`, `withdrawn`. |
| `approved_preview_hash` | text nullable | Hash of preview approved by party. |
| `approval_note` | text nullable | Controlled note. |
| `approved_at` | timestamptz nullable | Approval time. |
| `ip_context` | jsonb nullable | Minimal technical context if legally required. |

### 4.4 `generated_contract_instances`

Stores final generated document metadata.

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Generated document ID. |
| `workspace_id` | uuid | Source workspace. |
| `document_reference` | text | Protected document reference. |
| `master_agreement_version` | text | Template version used. |
| `catalog_version` | text | Catalog version used. |
| `source_snapshot_hash` | text | Hash of source records and selected values. |
| `generated_document_hash` | text | Hash of generated file/text. |
| `generated_status` | enum | `generated`, `signature_pending`, `signed`, `voided`, `superseded`. |
| `generated_at` | timestamptz | Generation time. |

## 5. Workspace Status Model

| Status | Meaning | Next computed task |
|---|---|---|
| `draft_from_platform_data` | Workspace created from verified records and selected candidate. | Complete embedded contract fields. |
| `prepare_fields` | Responsible employee is completing embedded values. | Complete embedded contract fields. |
| `blocked_missing_data` | Required linked record or field is missing. | Correct linked profile / vessel / request data. |
| `blocked_catalog_exception` | Required catalog value is not available or needs controlled approval. | Review contract catalog exception. |
| `party_review` | Parties are reviewing populated agreement. | Review and approve contract. |
| `correction_requested` | A party requested field correction. | Correct embedded contract field. |
| `ready_for_signature` | All required values and approvals are present. | Sign contract / generate final instance. |
| `signed_pending_generation` | Required approvals/signatures exist; generation can run. | Generate contract instance. |
| `generated` | Final contract instance exists. | Confirm boarding / employment pending embarkation. |
| `voided` | Workspace cannot be used. | Create replacement workspace if needed. |
| `superseded` | Replaced by newer workspace. | Continue in replacement workspace. |

## 6. Computed Task Rules

The workspace must create visible tasks from data, not from manual to-do items.

Examples:

| Condition | Visible task | Responsible |
|---|---|---|
| Workspace exists, required fields missing | Complete embedded contract fields. | Assigned review/support employee |
| Linked vessel missing flag or particulars | Correct vessel contract data. | Employer owner / vessel reviewer |
| Wage field missing | Complete wage and payment terms. | Assigned employee + employer confirmation |
| Return responsibility missing | Complete return and repatriation terms. | Assigned employee + parties |
| Seafarer approval requested | Review and approve contract. | Seafarer |
| Employer approval requested | Review and approve contract. | Employer / authorized representative |
| All approvals present | Generate contract instance. | System / authorized team user |
| Generated contract exists | Confirm boarding preparation. | Support / responsible employee |

Personal assignment follows the existing object-history rule:

```text
same object + same responsible group + previous active performer = assigned performer
```

If no active performer exists, the task remains in the group queue.

## 7. UI Design

### 7.1 Layout

The first implementation should use a compact, work-focused layout:

| Area | Content |
|---|---|
| Header | Contract reference, status, parties, vessel, request summary. |
| Left rail | Clause navigation `MC-001..MC-018`, missing count, approval state. |
| Main panel | Full agreement text with embedded fields inline. |
| Right panel | Current field details, blockers, source records, approvals. |
| Footer/action band | Primary computed operation only. |

### 7.2 Embedded Field Rendering

Embedded fields should render according to `choice_type`:

| Choice type | UI control |
|---|---|
| `single` | Select / segmented option list. |
| `multiple` | Checkbox group / compact multi-select. |
| `linked_record` | Read-only linked value with source link. |
| `computed` | Read-only computed value with explanation. |
| `date` | Date input. |
| `number` | Number input with unit. |
| `money` | Amount + currency. |
| `text_controlled` | Short controlled input with max length and review marker. |
| `document_reference` | Protected document selector / verified document link. |
| `signature` | Approval/signature state, not a free text field. |

### 7.2.1 Source Display Rule

For `linked_record`, `computed` and `document_reference` fields, the right panel should show:

1. source object type;
2. source object status;
3. source field / document reference;
4. last verification or review status when available;
5. action: open source object or request source correction.

For `catalog` and `controlled_input` fields, the panel should show why the value is selectable and which party must approve it.

### 7.3 Primary Action Rule

The workspace must show one primary computed operation at a time.

Examples:

| Status | Primary action |
|---|---|
| `prepare_fields` | Save contract fields |
| `blocked_missing_data` | Open blocking source record |
| `party_review` | Send reminder / wait for party approval |
| party user review | Approve contract / request correction |
| `ready_for_signature` | Generate contract instance |
| `generated` | Open generated contract |

Secondary actions, such as void, supersede, export draft or request legal review, must be inside a controlled secondary menu.

## 8. API Design

### 8.1 Create workspace

```text
POST /api/v1/operator/contract-workspaces
```

Request:

```json
{
  "seafarer_profile_id": "uuid",
  "employer_profile_id": "uuid",
  "vessel_id": "uuid",
  "vacancy_request_id": "uuid",
  "shortlist_draft_id": "uuid",
  "candidate_presentation_id": "uuid"
}
```

Response:

```json
{
  "workspace_id": "uuid",
  "workspace_status": "draft_from_platform_data",
  "master_agreement_version": "MA-SEA-1.0",
  "catalog_version": "MCAT-1.0",
  "embedded_fields": [],
  "source_prefill": {
    "linked_record_fields": [],
    "computed_fields": [],
    "selectable_contract_fields": [],
    "blocked_source_fields": []
  },
  "guard": {
    "status": "blocked",
    "blockers": []
  }
}
```

### 8.2 Get workspace

```text
GET /api/v1/operator/contract-workspaces/{workspace_id}
```

Returns:

1. safe party/vessel/request summary;
2. clause list;
3. embedded fields and values;
4. guard result;
5. approval state;
6. computed next operation;
7. generated contract metadata if available.

### 8.3 Save embedded field values

```text
PATCH /api/v1/operator/contract-workspaces/{workspace_id}/fields
```

Request:

```json
{
  "values": [
    {
      "field_code": "C-6.3",
      "value_code": "monthly"
    },
    {
      "field_code": "C-6.1",
      "value_json": {
        "amount": "6500.00",
        "currency": "USD"
      }
    }
  ]
}
```

The endpoint must:

1. validate field codes against approved catalog/version;
2. validate choice type;
3. reject unapproved free-text legal clauses;
4. recompute guard;
5. write audit events.

### 8.4 Request party review

```text
POST /api/v1/operator/contract-workspaces/{workspace_id}/review-requests
```

Request:

```json
{
  "party_types": ["seafarer", "employer"],
  "operator_note": "Contract workspace ready for party review."
}
```

### 8.5 Party approval

```text
POST /api/v1/contract-workspaces/{workspace_id}/party-approval
```

Request:

```json
{
  "decision": "approve",
  "party_type": "seafarer",
  "preview_hash": "sha256",
  "note": "optional controlled note"
}
```

Allowed decisions:

| Decision | Meaning |
|---|---|
| `approve` | Party approves populated workspace. |
| `request_correction` | Party requests correction of one or more fields. |
| `reject` | Party rejects this workspace. |
| `withdraw` | Party withdraws previous approval before generation. |

### 8.6 Preview generated contract

```text
GET /api/v1/contract-workspaces/{workspace_id}/preview
```

Returns:

1. generated preview text/html;
2. source snapshot hash;
3. preview hash;
4. blocker list;
5. visible field-source references.

### 8.7 Generate final contract

```text
POST /api/v1/operator/contract-workspaces/{workspace_id}/generate
```

Allowed only when:

1. guard status is `ready_for_generation`;
2. party approvals match current preview hash;
3. no fixed clause has changed;
4. no unresolved blocker remains.

Response:

```json
{
  "generated_contract_id": "uuid",
  "generated_document_hash": "sha256",
  "generated_status": "generated",
  "side_effects": {
    "creates_vacancy_application": false,
    "changes_employment_status": false,
    "employer_visible_candidate_payload": false
  }
}
```

Employment/onboard statuses must be handled by later embarkation workflow, not by generation alone.

## 9. Guard And Blocker Codes

| Blocker code | Meaning |
|---|---|
| `master_agreement_not_approved` | Template version is not approved. |
| `catalog_version_not_approved` | Catalog version is not approved. |
| `missing_seafarer_record` | Seafarer profile is missing or not linked. |
| `missing_employer_record` | Employer profile is missing or not linked. |
| `missing_vessel_record` | Vessel record is missing or not linked. |
| `missing_representative_authority` | Employer representative authority is missing. |
| `missing_required_field` | Required embedded field is not completed. |
| `invalid_catalog_value` | Selected value is not in approved catalog. |
| `unresolved_to_be_agreed` | A field still says `to_be_agreed` at signature/generation stage. |
| `fixed_clause_modified` | Fixed text differs from approved template. |
| `party_approval_missing` | Required party approval is missing. |
| `party_approval_hash_mismatch` | Approval refers to an older preview hash. |
| `mandatory_rule_exception_required` | Flag/CBA/mandatory rule requires controlled exception. |
| `document_reference_missing` | Required protected document reference is missing. |

## 10. Audit Events

Every material operation must write an audit event.

| Event | Actor |
|---|---|
| `contract_workspace_created` | Operator/system |
| `contract_workspace_field_changed` | Operator/system |
| `contract_workspace_guard_recomputed` | System |
| `contract_workspace_review_requested` | Operator |
| `contract_workspace_party_approved` | Seafarer/employer |
| `contract_workspace_party_correction_requested` | Seafarer/employer |
| `contract_workspace_blocked` | System |
| `contract_workspace_preview_generated` | System |
| `contract_instance_generated` | System/operator |
| `contract_workspace_voided` | Authorized manager/control |
| `contract_workspace_superseded` | Authorized manager/control |

Audit payload must include:

1. actor;
2. workspace ID;
3. source object IDs;
4. changed field codes if applicable;
5. preview/source hash if applicable;
6. blocker codes if applicable.

## 11. Access And Visibility

| User / group | Visibility | Allowed operations |
|---|---|---|
| Seafarer | Own populated workspace and final contract | Review, approve, request correction, download approved copy. |
| Employer representative | Workspace for own company/vessel/request | Review, approve, request correction, download approved copy. |
| Review team | Assigned or group workspace | Prepare fields, request review, handle corrections. |
| Support team | Joining/return-relevant fields after approval | View relevant fields, support boarding/return tasks. |
| Billing team | Billing-relevant generated contract evidence only | View billing basis after generation/boarding evidence. |
| Control / Project Owner | Full controlled access | Void, supersede, controlled exception, audit review. |

No user should see broader candidate/private contact data through the contract workspace than already allowed by the underlying verified workflow.

## 12. Implementation Boundary

This design intentionally does not:

1. implement database migrations;
2. implement API endpoints;
3. generate PDF/DOCX contracts;
4. implement electronic signature provider integration;
5. change employment/onboard statuses;
6. create billing invoices;
7. publish employer-facing candidate payloads.

Those must remain separate controlled stages.

## 13. Verification Plan For Future Implementation

Future implementation must test:

1. workspace can be created only from linked seafarer/employer/vessel/request records;
2. embedded fields render in clause context;
3. invalid catalog values are rejected;
4. missing required fields produce exact blocker codes;
5. party approval stores preview hash;
6. changing a field after party approval invalidates the old approval;
7. generation is blocked when approvals do not match current preview;
8. generated instance stores template/catalog/source/document hashes;
9. no fixed clause can be edited through runtime UI;
10. task queue shows one computed operation at a time.
11. linked facts are prefilled from verified source records and cannot be manually retyped to bypass source correction.

## 14. Next Stage

The next stage should be:

```text
CPG-BIZ-098B - Contract workspace SQL draft approval and migration implementation decision
```

CPG-BIZ-097 has already prepared the additive SQL draft, and CPG-BIZ-098A has clarified the source-first prefill rule. The next gate should decide whether to convert the draft into a runtime migration.

## 15. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 2026-06-04 | GTC IT / AI Assistant | Added source-first contract data rule: verified platform records prefill linked facts, while user selection is limited to true contract alternatives and controlled exceptions |
| 1.0 | 2026-06-04 | GTC IT / AI Assistant | Initial contract workspace object/API/UI design |
