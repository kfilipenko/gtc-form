# CPG-BIZ-137 - Agent-Assisted Direct Contract Drafting Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation task for Project Owner approval
- Source request: Project Owner approval of the `Assisted drafting` agent mode after CPG-BIZ-135
- Version: 1.0
- Date: 2026-06-19
- Status: For Project Owner approval; no programming authorized before approval

## 1. Purpose

This task defines the next implementation slice for the approved agent working mode:

```text
Agent-assisted direct contract drafting
```

The purpose is to let an authorized agent prepare a populated direct seafarer-shipowner contract draft inside the existing Contract Agreement Workspace, then send the prepared draft to the real parties for review, correction or signature.

The direct contract remains:

```text
seafarer <-> shipowner / employer
```

The agent may negotiate, coordinate and prepare a draft, but must not become a hidden contractual party and must not replace personal party approval by default.

This task does not authorize code, SQL, runtime migration, signature-provider integration or legal text changes until the Project Owner approves it.

## 2. Standards Reviewed Before This Task

The task was prepared after reviewing:

| Standard / process | Role in this task |
|---|---|
| BP-012 | Crew formation process, agent-enabled contract triad and CF-13A/CF-14 contract transition. |
| BP-016 | Stage-to-standard matrix, task-routing and contract workspace gap register. |
| BP-017 | Shipowner-agent appointment and current runtime agent authority process. |
| CPG-BIZ-095 | Contract Agreement Workspace and embedded fields in clause context. |
| CPG-BIZ-096 | Contract workspace object/API/UI design, guard, approval and generation model. |
| CPG-BIZ-102 | Implemented direct SEA workspace detail view with verified source prefill. |
| CPG-BIZ-110 | Structured terms clarification before contract proposal and no-chat-as-primary-source rule. |
| CPG-BIZ-125 | Agent capacity, dual-interest facilitation, conflict boundary and personal signature rule. |
| CPG-BIZ-126 / 127 | Representative appointment, assignment notifications and shipowner-agent offer/authority runtime slice. |
| CPG-BIZ-135 | Unified contract workspace/template/generation rule for direct SEA and agent agreements. |
| CPG-BIZ-136 | Reserved prerequisite for the contract-kind / multi-template registry layer required by CPG-BIZ-135. |

## 3. Accepted Business Model

The accepted model is:

```text
Assisted drafting
= agent prepares a direct contract draft
+ parties personally review/approve/sign
+ all material changes are versioned and notified
```

The agent may:

1. work under a valid represented-party capacity;
2. access only users, objects, vacancies, vessels, candidates and workspaces available through the agent agreement / assignment scope;
3. open or request a direct `seafarer_shipowner_employment` workspace for an eligible candidate/vacancy pair;
4. review database-prefilled party/vessel/vacancy facts;
5. fill or propose only permitted contractual variables;
6. submit a populated draft to the seafarer and shipowner/employer for review;
7. correct draft variables after a party requests correction;
8. create a new draft version when material terms change.

The agent must not:

1. manually retype verified party, vessel, document or vacancy facts that already exist in source records;
2. edit fixed legal clauses;
3. bypass source-record correction when verified facts are missing or wrong;
4. sign the direct contract for the seafarer by default;
5. sign the direct contract for the shipowner/employer merely because an agent assignment exists;
6. move the workspace to final signature readiness without the required party review/approval gates;
7. charge or encode seafarer recruitment/placement fees in the direct SEA workflow.

## 4. Process Position

This task sits between:

```text
CF-13A Structured terms clarification
```

and:

```text
CF-14 Contract Agreement Workspace / direct SEA review and signature
```

It uses the existing direct seafarer-shipowner contract workspace already implemented in the system as the starting point.

The target flow is:

```text
candidate selected or terms clarification ready
-> authorized agent opens available direct contract workspace
-> system prefills verified source data
-> agent prepares permitted draft terms
-> draft version is created
-> parties receive review/signature request
-> party approves or requests correction
-> agent corrects and resubmits when needed
-> final party approvals unlock signature/generation
```

## 5. Preconditions

The agent may prepare a direct contract draft only when:

1. the agent is an authenticated platform participant;
2. the agent organization has an active or limited assignment for at least one relevant represented side;
3. the action carries a visible representation capacity:
   - `agent_for_shipowner`;
   - `agent_for_seafarer`;
   - or approved `dual_interest_facilitation` context;
4. the represented object is inside the active assignment scope;
5. an eligible candidate/vacancy relationship exists;
6. the direct contract workspace can link the required source records:
   - seafarer profile;
   - shipowner/employer company;
   - vessel or vessel context;
   - crew request / vacancy;
   - candidate presentation or accepted incoming request;
7. no hard source-data blocker prevents draft preparation.

If the same agent formally manages both sides for the same contract workspace, the workspace must apply the CPG-BIZ-125 control:

```text
dual_management_review_required
```

Ordinary dual-interest facilitation remains allowed, but final contract-critical approval must still route to the real parties.

## 6. Data And Field Rules

The workspace must preserve the source-first rule.

Field groups:

| Field group | Source | Agent action |
|---|---|---|
| Verified linked facts | Database source records | View, confirm context, or request source correction. No manual retyping. |
| Computed values | System | Read-only. |
| Catalog-backed contract choices | Approved contract catalogs | Select or propose allowed values if authority scope permits. |
| Controlled inputs | Workspace controlled fields | Enter only permitted negotiated values, such as date, amount or short controlled note. |
| Fixed clauses | Approved master template | Read-only. |
| Signature / approval fields | Party approval workflow | Agent may request review but cannot self-approve as a party by default. |

Contract-critical values prepared by the agent remain proposals until party approval confirms the current preview hash.

Examples of agent-preparable variables:

1. rank / position where candidate and vacancy allow it;
2. joining date;
3. contract duration;
4. wage amount and currency;
5. payment frequency and method;
6. vessel/crew-request link where more than one eligible source exists;
7. joining travel arrangement;
8. repatriation / return destination and responsible party;
9. applicable approved CBA/law reference where source data supports it;
10. document readiness condition or blocker reference.

Examples of non-agent-editable values:

1. seafarer identity;
2. shipowner/employer legal identity;
3. verified vessel identity;
4. uploaded document metadata;
5. fixed no-fee acknowledgement text;
6. fixed insurance/repatriation/complaint clauses;
7. approval/signature declarations.

## 7. Agent Access Model

The agent must not receive a global list of all users or all contracts.

The agent's contract-drafting list must be computed from:

```text
agent organization
+ active assignment
+ representation capacity
+ represented object
+ eligible candidate/vacancy relationship
+ contract workspace state
+ required permission
= visible drafting task
```

Required visible surfaces:

| Surface | Purpose |
|---|---|
| `/agents/` | Shows agent tasks, including direct contract draft preparation tasks. |
| `/agents/tasks` | Computed queue for agent work where enabled. |
| `/agents/objects/{assignment_id}/workspace` | Scoped represented-object workspace and action entry. |
| `/contracts/workspace/` | Existing direct contract workspace, opened with agent context and assignment guard. |

Recommended direct link pattern:

```text
/contracts/workspace/?workspace_id={workspace_id}&actor=agent&assignment_id={assignment_id}
```

The workspace header must show:

```text
Managed by: {agent organization}
Representing: {represented party / capacity}
Authority: {authority status and reference}
Direct contract parties: {seafarer} + {shipowner/employer}
```

## 8. UI Requirements

The agent-facing Contract Workspace must keep the current work-focused layout and add an agent drafting mode.

Required UI blocks:

1. compact workspace header with party, vessel, vacancy, agent capacity and status;
2. source data panel showing database-prefilled facts and source links;
3. contract text with embedded fields in clause context;
4. editable controls only for fields allowed in `agent_assisted_drafting`;
5. missing/blocker checklist;
6. draft version indicator;
7. party review status for seafarer and shipowner/employer;
8. notification/audit summary for draft sent, correction requested and resubmitted.

Required primary operations:

| State | Primary operation |
|---|---|
| Eligible workspace not yet opened | Open / prepare direct contract draft. |
| Draft fields incomplete | Save draft terms. |
| Draft complete but not sent | Send draft to parties for review. |
| Party correction requested | Correct draft and create new version. |
| Waiting for party review | View review status / send reminder where allowed. |
| Both parties approved current preview | Proceed to signature/generation gate. |

The page must not show full legal text duplicated from `/legal/` except the contract workspace itself, where the current generated/approved template text is the working contract context.

## 9. Simplified Party Review And Signing

Because some seafarers may be unable or unwilling to use the full portal workflow, this task must include a simple party-review route.

The simplified route may be:

```text
review link + one-time code / verified session
```

Minimum requirements:

1. the party must see the full populated agreement or a full preview with a link to the complete text;
2. the party must see key contract-critical terms in a readable summary;
3. approval must bind to the current `preview_hash`;
4. correction request must be available without needing to understand the full portal;
5. the audit event must record party identity context, timestamp and approved/rejected preview hash;
6. if the draft changes after approval, the old approval becomes invalid for signature readiness.

The simplified route must not become a blind checkbox or hidden agent signature.

## 10. API Direction

The implementation must reuse the existing Contract Workspace module and add guarded agent adapters.

Recommended API shape:

```text
GET  /api/v1/agents/contract-drafting/tasks
POST /api/v1/agents/contract-workspaces
GET  /api/v1/contract-workspaces/{workspace_id}?actor=agent&assignment_id={assignment_id}
PATCH /api/v1/contract-workspaces/{workspace_id}/fields
POST /api/v1/contract-workspaces/{workspace_id}/submit-party-review
POST /api/v1/contract-workspaces/{workspace_id}/party-approval
POST /api/v1/contract-workspaces/{workspace_id}/party-correction-request
```

The actual endpoint names may be adjusted to match the current API style, but the same module must be used.

No page-local or agent-local contract generation script is allowed.

## 11. Database / Runtime Design Direction

This task should use additive changes only.

Potential additive objects / fields:

| Object / field | Purpose |
|---|---|
| `contract_workspace_instances.contract_kind` | Must identify `seafarer_shipowner_employment`. |
| `contract_workspace_party_links` | General party rows for seafarer, shipowner/employer, agent and control. |
| `contract_workspace_source_links` | Source records linked by object type/id. |
| `contract_workspace_agent_context` | Agent organization, assignment, represented party and capacity for drafting actions. |
| `contract_workspace_draft_versions` | Versioned preview hash, changed fields, status and submitter. |
| `contract_workspace_party_review_requests` | Review requests sent to seafarer and shipowner/employer. |
| `contract_generation_audit_events` | Reused or extended audit trail for agent drafting events. |
| `participant_notification_ledger` | Durable notices for draft sent, correction requested, draft changed and approval completed. |

If existing tables can safely hold some of these records, the implementation may use them through adapters rather than creating all objects.

## 12. Guard And Blocker Codes

Required guard outcomes:

| Blocker | Meaning |
|---|---|
| `missing_agent_assignment` | Agent has no active/limited assignment for the represented object. |
| `agent_scope_mismatch` | Workspace source objects are outside the assignment scope. |
| `missing_represented_party_agreement` | Required agent agreement/authority evidence is absent. |
| `dual_management_review_required` | Same agent formally manages both interested parties without clearance. |
| `missing_source_record` | Required source record is absent. |
| `source_record_not_verified` | Required source record exists but is not approved/verified where required. |
| `field_not_agent_editable` | Agent attempted to edit fixed, linked or party-only field. |
| `invalid_contract_value` | Selected value is outside approved catalog/validation rule. |
| `party_review_not_requested` | Draft has not been sent to required parties. |
| `party_approval_missing` | One or more required parties have not approved current preview. |
| `party_approval_hash_mismatch` | Approval refers to older draft version. |
| `representative_signature_exception_required` | Agent attempts to sign/approve as party. |
| `seafarer_fee_boundary_violation` | Draft attempts to include prohibited recruitment/placement fee. |

## 13. Notifications

The following events must create participant notification ledger records:

| Event | Recipient |
|---|---|
| Agent opened/prepared direct contract draft | Represented party and agent organization where useful. |
| Draft sent for review | Seafarer and shipowner/employer. |
| Party requested correction | Agent, opposite party where appropriate, and represented party. |
| Draft changed after review request | Both parties. |
| Party approved current draft | Opposite party, agent and represented party context. |
| Approval invalidated by new version | Previously approving party. |
| Workspace moved to signature/generation gate | Seafarer, shipowner/employer, agent and control where required. |

Notifications must include a safe summary, object reference, actor, agent capacity, draft version and exact action link or blocker reason.

## 14. Audit Requirements

Every material action must write an audit event:

1. actor user and organization;
2. represented party and capacity;
3. assignment id;
4. workspace id;
5. draft version id;
6. changed field codes;
7. previous and new structured values where safe;
8. source object ids;
9. preview hash before/after;
10. blocker/status transition;
11. notification ids where generated.

## 15. Non-Scope

This task does not implement:

1. new legal wording for the seafarer-shipowner contract;
2. shipowner-agent or seafarer-agent agreement text changes;
3. commercial price / Service Order / billing activation;
4. final PDF/DOCX generation if the existing generation step is not yet approved;
5. external e-signature provider integration;
6. employment, embarkation, onboard or invoice status changes;
7. broad chat as the agreement source;
8. global user search for agents.

## 16. Implementation Sequence After Approval

After Project Owner approval, implementation should proceed in this order:

1. reread BP-012, BP-016, BP-017, CPG-BIZ-095, CPG-BIZ-096, CPG-BIZ-102, CPG-BIZ-110, CPG-BIZ-125, CPG-BIZ-135 and CPG-BIZ-136 when the registry prerequisite is documented;
2. inspect current runtime `contract_workspace_instances`, field values, approvals and `propose_contract` endpoints;
3. add the minimal agent access adapter without duplicating contract workspace logic;
4. add agent task computation for eligible direct contract drafting;
5. add guarded field editing for permitted contract variables;
6. add draft version / preview hash behavior;
7. add party review request and correction request flow;
8. add simplified party review route if not already available;
9. update implemented-code standards only after reusable runtime behavior exists;
10. run focused API/UI tests for shipowner agent, seafarer agent and forbidden scope cases.

## 17. Acceptance Criteria

The implementation is acceptable only when:

1. an authorized agent can open only eligible direct SEA workspaces in its assignment scope;
2. verified linked facts are auto-filled from database records and are not manually retyped by the agent;
3. agent-editable fields are limited to approved contract variables;
4. every agent field change is versioned and audited;
5. both seafarer and shipowner/employer can review the same populated draft;
6. party approval is bound to the current preview hash;
7. a correction request creates a new draft cycle and invalidates outdated approvals;
8. final signature/generation remains blocked until required party approvals exist;
9. dual-management conflict produces `dual_management_review_required` where applicable;
10. no prohibited seafarer recruitment/placement fee can be inserted as a contract condition;
11. operational pages link to the exact working object, not to a generic list;
12. no separate contract generation script is introduced.

## 18. Verification Plan

Future implementation must verify:

1. agent with shipowner assignment can prepare a draft for that shipowner's eligible candidate;
2. agent with seafarer assignment can prepare or assist a draft for that seafarer's eligible vacancy/workflow;
3. agent outside scope receives `agent_scope_mismatch`;
4. agent cannot edit linked seafarer identity, shipowner identity, vessel identity or fixed clauses;
5. party review request creates notifications;
6. correction request creates a new version;
7. old approval hash fails after draft changes;
8. direct party approval unlocks only the next controlled signature/generation gate, not employment/onboard/billing status;
9. no global agent access to unrelated users or workspaces exists.

## 19. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-19 | GTC IT / AI Assistant | Created Project Owner approval task for agent-assisted direct seafarer-shipowner contract drafting through the existing Contract Agreement Workspace |
