# ICS-005 - Agent-Assisted Direct Contract Drafting Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented reusable runtime standard
- Version: 1.0
- Date: 2026-07-08
- Status: Active

## 1. Purpose

This standard controls how an authorized agent prepares a direct seafarer-shipowner contract draft inside the existing Contract Agreement Workspace.

The standard exists to prevent page-local contract generation or agent-specific duplicate drafting logic.

## 2. Applies To

This standard applies to:

1. agent task computation for direct contract drafting;
2. agent-scoped Contract Workspace access;
3. embedded contract field editing in agent mode;
4. preview-hash and audit evidence for agent-prepared values;
5. party-review request creation and participant notification ledger records.

## 3. Canonical Implementation

Canonical backend implementation:

```text
projects/crewportglobal/app/backend/api/public/index.php
```

Canonical functions and handlers:

```text
cpg_agent_contract_drafting_rows()
cpg_agent_task_from_contract_drafting_row()
cpg_contract_workspace_agent_access()
cpg_contract_workspace_require_agent_access()
cpg_contract_workspace_detail()
cpg_contract_workspace_save_agent_fields()
cpg_contract_workspace_request_party_review()
handle_get_agent_contract_drafting_tasks()
handle_get_contract_workspace()
handle_patch_contract_workspace_fields()
handle_post_contract_workspace_submit_party_review()
```

Canonical frontend adapters:

```text
projects/crewportglobal/public/agents/index.html
projects/crewportglobal/public/contracts/workspace/index.html
```

## 4. Adapter Contract

Agent-mode contract links must use:

```text
/contracts/workspace/?workspace_id={workspace_id}&actor=agent&assignment_id={assignment_id}
```

Party-mode contract links must continue to use:

```text
/contracts/workspace/?workspace_id={workspace_id}&draft_id={party_user_id}
```

Agent field-save requests must use:

```text
PATCH /api/v1/contract-workspaces/{workspace_id}/fields?actor=agent&assignment_id={assignment_id}
```

Party-review requests must use:

```text
POST /api/v1/contract-workspaces/{workspace_id}/submit-party-review?actor=agent&assignment_id={assignment_id}
```

## 5. Guard Rules

The agent may access the workspace only when the active assignment belongs to the same agent organization and matches one of the workspace source objects:

1. `contract_workspace`;
2. `employer_company`;
3. `vessel`;
4. `vacancy_request`;
5. `seafarer_profile`;
6. matching `person_user` for the seafarer or employer representative.

The assignment and authority must pass the existing active/limited and verified/limited guard.

## 6. Editable Fields

The current implemented editable set is:

| Field | Meaning |
|---|---|
| `C-5.1` | Joining date |
| `C-5.2` | Contract duration |
| `C-6.1` | Salary / wage terms |
| `C-6.2` | Currency |
| `C-8.1` | Joining travel responsibility |
| `C-9.1` | Return / repatriation responsibility |

Verified linked facts, fixed clauses, source document metadata and signature fields remain read-only.

## 7. Forbidden Local Logic

Pages and endpoints must not:

1. create a separate agent contract generator;
2. manually retype source facts into contract fields;
3. make broad user/workspace lists visible to the agent;
4. allow an agent to sign or approve the direct contract as a party by default;
5. bypass `participant_notification_ledger` for party-review notices;
6. create employment, embarkation, invoice or final generated-contract side effects from agent drafting.

## 8. Current Adopters

| Surface | Adoption |
|---|---|
| `/agents/` | Shows computed contract drafting tasks and opens exact workspace links. |
| `/contracts/workspace/` | Supports party mode and guarded agent-assisted mode. |
| `/api/v1/agents/tasks` | Includes direct contract drafting tasks. |
| `/api/v1/agents/contract-drafting/tasks` | Dedicated direct contract drafting queue. |
| `/api/v1/contract-workspaces/{workspace_id}` | Supports `actor=agent&assignment_id=...` guarded access. |

## 9. Required Tests

Required verification:

1. PHP syntax check for the API file;
2. agent with matching assignment can open the workspace;
3. agent outside source-object scope receives a blocker;
4. agent can save only permitted embedded fields;
5. review request creates approval-request rows and notification ledger records;
6. party mode with `draft_id` remains compatible.

## 10. Exceptions

The current slice uses `preview_hash` plus `contract_generation_audit_events` as the implemented draft-version evidence. A dedicated draft-version table remains a future enhancement if required by the full party approval/correction cycle.

## 11. Change Propagation Rule

Any future contract type that allows agent-assisted preparation must extend this standard through the shared Contract Workspace adapter and must not create a new page-local generation path.
