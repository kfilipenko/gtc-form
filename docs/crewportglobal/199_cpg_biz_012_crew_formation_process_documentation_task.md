# CPG-BIZ-012 - Crew Formation Business Process Documentation Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task for Project Owner approval
- Source request: Project Owner instruction after CPG-DEMAND-035
- Version: 1.0
- Date: 2026-05-26
- Status: Approved by Project Owner; BP-012 and BP-013 drafted for review

## 1. Purpose

This task authorizes preparation of the controlling business-process documentation for CrewPortGlobal crew formation services.

The current application already has practical tools for:

1. collecting seafarer supply data;
2. collecting employer, vessel and crew-request demand data;
3. matching request and supply;
4. showing blockers before shortlist;
5. creating internal shortlist drafts;
6. approving internal shortlist drafts;
7. staging candidate presentation review;
8. recording audit events and actor context.

The next step is to formalize these operations into internationally understandable business-process documents before further architecture and UI changes.

This task does not approve code, UI, DB, migration or runtime changes.

## 2. Business Reason

The operator card currently can show several actions at the same time, for example:

```text
Open item
Start review
Needs correction
Mark reviewed
Request deletion
```

This creates ambiguity for the user. The user does not immediately understand:

1. which action is the primary operation for the current stage;
2. what each action means;
3. whether `Open item` means external/public view or internal review;
4. which operation changes workflow state;
5. which operation only opens the working object;
6. which role is responsible for the next step.

The business-process documentation must become the control source for simplifying the workflow UI and for making every visible action understandable.

## 3. Required Deliverables

### 3.1 Main business-process manual

Prepare:

```text
docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md
```

This document must describe the end-to-end business process for helping shipowners, vessel operators, ship managers and maritime employers form crews through CrewPortGlobal.

The process must cover the sequence from demand intake to final service result and revenue basis for GTC INFORMATION TECHNOLOGY FZ-LLC.

The manual must include:

1. process purpose;
2. process owner;
3. customer and service boundaries;
4. process inputs;
5. process outputs;
6. process stages;
7. responsible roles and groups;
8. required records and evidence;
9. DB records created or updated at each stage;
10. audit events required at each stage;
11. approval gates;
12. handoff rules;
13. revenue trigger and billing handoff;
14. controls for no seafarer recruitment or placement fees;
15. controls preventing automatic employment decisions.

The style must be suitable for ISO-style process documentation and audit review. It should align with a process approach, documented evidence, traceability, role accountability and controlled handoffs.

### 3.2 Operating instructions for users, team and AI agents

Prepare:

```text
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
```

This document must expand the main business-process manual into practical instructions.

It must be understandable for:

1. seafarers;
2. employer / shipowner users;
3. support operators;
4. reviewers;
5. managers;
6. billing operators;
7. Project Owner / control users;
8. AI agents assisting the team.

The instruction must describe:

1. each participant's responsibilities;
2. system rights and permissions;
3. expected sequence of actions;
4. allowed actions;
5. prohibited actions;
6. required evidence before completing an operation;
7. when to request correction;
8. when to escalate;
9. when AI may assist;
10. when human approval is mandatory.

## 4. Mandatory Task Computation Principle

Every task inside the CrewPortGlobal business process must be computed from current data and from the result of the previous approved stage.

Tasks must not be treated as arbitrary manual to-do items.

The standard rule is:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

Examples:

| Previous result | Object state | Computed next task |
|---|---|---|
| Crew request is submitted | Demand fields are incomplete | Review crew request completeness |
| Crew request is structured | Matching can run | Review request-supply comparison |
| Candidate-search result exists | Candidate has no hard blockers | Create internal shortlist draft |
| Internal shortlist draft exists | Draft is ready for review | Approve internal shortlist |
| Internal shortlist approved | Candidate presentation guard is ready | Create candidate presentation review |
| Candidate presentation reviewed | Employer-facing guard is ready | Present candidate to employer |
| Employer decision received | Service result is billable | Prepare billing / service completion record |

If the previous stage has not produced the required result, the next task must not be shown as executable.

## 5. Task Visibility And Assignment Rule

Computed tasks must be shown in the personal cabinet of:

1. the responsible group; and
2. the specific employee assigned to the client or object, if such assignment already exists.

The visibility decision must consider:

1. authenticated user;
2. group membership;
3. role;
4. permission;
5. client assignment;
6. object assignment;
7. current workflow state;
8. visibility scope;
9. audit/control exception, if applicable.

Broad group membership alone must not expose unrelated client records if a narrower assignment exists.

If no personal employee assignment exists yet, the task may be visible to the responsible group queue.

If a personal assignment exists, the task should be visible in:

```text
My tasks
```

for that employee, and may also remain visible to authorized managers or control users according to scope.

## 6. Standard Task Display Format

Each visible task should show one clear primary operation.

The task title should combine:

```text
Stage name + short object description
```

The task must include an active hyperlink to the exact object that the executor must work with.

Recommended format:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

Examples:

```text
Approve candidate for employer presentation. (Seafarer document completeness review: Able Seaman Ivanov Sergey.)
```

```text
Review crew request completeness. (Crew request: Chief Officer for Bulk Carrier, join date 2026-08-15.)
```

```text
Confirm deletion request. (Crew request: Chief Officer for Bulk Carrier, deletion requested by reviewer.)
```

```text
Review request-supply comparison. (Crew request: Second Engineer for Container Vessel.)
```

Each task card must include:

| Element | Requirement |
|---|---|
| Primary task title | One clear operation name, not multiple competing action labels. |
| Object summary | Short safe summary without unnecessary raw data. |
| Active link | Opens the internal working object, not public/external view. |
| Responsible group | Group that owns the operation. |
| Assigned employee | Specific assignee when one exists. |
| Required permission | Permission required to execute the operation. |
| Due/SLA state | If defined by process. |
| Blockers | Only if they explain why the operation cannot be completed. |
| Secondary actions | Hidden under secondary menu or shown only after opening the working object. |

The phrase `Open item` must be replaced or clarified in future UI work.

Preferred labels:

| Current ambiguous label | Future meaning |
|---|---|
| `Open item` | `Open internal work item` or `Open review workspace` |
| `Start review` | Primary operation only when the current stage is review start |
| `Needs correction` | Review outcome, not a default visible action for every row |
| `Mark reviewed` | Review outcome, shown only inside review workspace |
| `Request deletion` | Controlled secondary action requiring manager confirmation |

## 7. Required Process Model

The main business process must be documented as an end-to-end flow:

```text
Employer demand intake
-> Employer / vessel / crew request structuring
-> Seafarer supply intake
-> Document and profile readiness review
-> Request-supply matching
-> Blocker review
-> Internal shortlist draft
-> Internal shortlist approval
-> Candidate presentation review
-> Employer-facing candidate presentation
-> Employer feedback / selection support
-> Service completion
-> Billing / reward basis
-> Audit / retention
```

For each process step the documents must define:

1. trigger;
2. input data;
3. responsible group;
4. responsible employee rule;
5. system permission;
6. main task shown to executor;
7. DB records read;
8. DB records created or updated;
9. audit event;
10. expected output;
11. next computed task;
12. rollback/correction route;
13. prohibited shortcuts.

## 8. Compliance And International Practice Alignment

The documents must align with these principles:

1. process approach;
2. documented operating procedure;
3. traceable responsibility;
4. evidence-based decisions;
5. segregation of duties where required;
6. access by role, permission and assignment;
7. auditability of material operations;
8. no automatic employment decision;
9. no recruitment or placement fee charged to seafarers;
10. B2B service and billing boundary for maritime employers / shipowners.

The documents should be written so they can later support:

1. internal training;
2. investor demonstration;
3. audit review;
4. future ISO-style quality management alignment;
5. future licensing/compliance discussion.

## 9. Explicit Non-Scope

This task does not authorize:

1. UI changes;
2. backend changes;
3. DB changes;
4. migrations;
5. test changes;
6. billing implementation;
7. automatic matching score implementation;
8. automatic employment decisions;
9. employer-facing publication changes.

Implementation may start only after Project Owner approval of this task.

Project Owner approval was received on 2026-05-26.

## 10. Acceptance Criteria

The task is complete when:

1. BP-012 main business-process manual is prepared;
2. BP-013 operating instructions are prepared;
3. both documents define computed task logic;
4. both documents define group and employee assignment rules;
5. both documents define standard task display format;
6. every major stage has input, output, responsible role and audit evidence;
7. the process reaches the business result: vessel crew formation support and service-fee basis for GTC INFORMATION TECHNOLOGY FZ-LLC;
8. documents do not contradict existing no-fee seafarer, approval guard, access-control and data-minimization boundaries;
9. the business-process register is updated;
10. the main documentation register is updated.

## 11. Approval Gate

Project Owner approval was required before execution and was received on 2026-05-26.

After approval, the implementation agent should first prepare BP-012 and BP-013 as documentation-only work.

No product UI simplification should be implemented until the approved business-process documents define the primary task model.

## 12. Next Stage After Approval

After this task is approved and BP-012/BP-013 are prepared, the next implementation-planning stage should be:

```text
CPG-BIZ-013 - Operator task-action simplification based on approved crew formation process
```

That later stage should convert the current multi-action row into a single primary computed operation with secondary actions moved into contextual review workspaces.
