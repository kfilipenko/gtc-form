# CPG-BIZ-111 - Agent Role Separation And Authority Model

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process control report
- Source request: Project Owner clarification after CPG-BIZ-110
- Version: 1.0
- Date: 2026-06-07
- Status: Documented for process alignment before implementation

## 1. Purpose

This document records the new platform model for treating crewing agents as independent responsible participants.

The goal is to let CrewPortGlobal support both:

1. GTC-operated crewing work; and
2. external crewing companies or agents working on the platform under controlled scope.

The model separates:

```text
platform governance
agent responsibility
shipowner demand
seafarer supply
object ownership
task execution
audit evidence
```

This document does not approve code, DB migration or runtime changes. It updates the business-process baseline for future implementation.

## 2. Core Decision

CrewPortGlobal must not treat `Agent` as only a user group.

The correct model is:

```text
Agent organization
+ agent users
+ verified authority evidence
+ assigned object scope
+ operation permissions
= allowed agent work
```

An agent may create, enter or maintain data for shipowners, vessels, seafarers and vacancies only when it has a verified basis for doing so.

## 3. Agent Responsibility

An agent may provide:

1. its own company and representative data;
2. authority evidence to work with shipowners / employers;
3. authority evidence to work with vessels;
4. seafarer authorization or agency basis to maintain a seafarer profile;
5. agency agreement or platform service agreement;
6. documents confirming the agent's right to act in the defined scope.

When the agent enters data under that authority, the agent is responsible for the correctness of the data entered.

The agent may also initiate creation of a new platform object in the interest of a client, for example:

1. physical person / account;
2. seafarer profile;
3. shipowner / employer company card;
4. vessel card;
5. crew request / vacancy.

This must not create an agent-owned copy of the client record. After duplicate and authority checks, the object must be created in the normal platform source table and linked to the agent by scope assignment.

This supports the platform position:

```text
CrewPortGlobal provides the controlled digital platform.
The agent performs crewing-service activity for assigned objects and carries responsibility for the data and actions performed under its agency authority.
```

## 4. No Separate Privileged GTC Agent Class

The previous idea of "our agents" must be replaced by the standard agent model.

GTC-operated agents:

1. use the same role model as external agents;
2. work under the same task-computation rules;
3. are audited in the same way;
4. may receive new unassigned users or objects by default;
5. do not own platform data;
6. may be replaced by another approved agent according to reassignment rules.

This preserves the original business idea of building CrewPortGlobal's own operational base while allowing external crewing organizations to join the platform.

## 5. Platform Administration / Control

The platform must have a separate governance function.

Platform Administration / Control is responsible for:

1. approving or rejecting agent onboarding;
2. checking agent authority evidence;
3. limiting or suspending agent scope;
4. resolving duplicate users and account claims;
5. approving reassignment from one agent to another;
6. reviewing complaints about agent conduct;
7. preserving audit evidence;
8. giving platform-level feedback to users;
9. preventing unauthorized access to seafarer, shipowner, vessel and contract data.

This group must not be confused with ordinary agent execution.

## 6. Duplicate And Existing-Record Check

Before creating or activating a new person, seafarer profile, shipowner/company card or vessel card, the platform must check whether the record already exists.

This applies to:

1. self-registration by a user;
2. data entered by an agent;
3. imported records;
4. data entered by GTC-operated agent users;
5. shipowner or vessel records submitted through vacancy workflows.

If a likely existing record is found, the platform must not silently create a duplicate full-access record.

The required process is:

```text
new registration or agent-entered record
-> duplicate / existing-record check
-> notify potential owner or claimant where appropriate
-> collect proof of right to the account or object
-> Platform Administration / Control decision
-> grant full access, link record, keep limited, reject claim or request more evidence
```

## 7. Account And Object Claim Rule

If an existing user or organization is already present on the platform:

1. the claimant must be notified through a controlled process;
2. the claimant must provide evidence of identity or authority;
3. Platform Administration / Control must approve access restoration or linkage;
4. the claimant may receive full access only after the right to the account or card is confirmed;
5. all claim events must be audited.

The visible computed task should be:

```text
Resolve account or object claim. (Object: {safe summary}; Claimant: {safe claimant summary}.)
```

## 8. Agent Assignment And Reassignment

Object assignment must be scoped.

An agent may be assigned to:

1. a seafarer profile;
2. a shipowner/company card;
3. a vessel card;
4. a crew request / vacancy;
5. a candidate presentation workflow;
6. a contract workspace;
7. a voyage support record.

When an agent is replaced:

1. the old agent loses ordinary execution access;
2. the new agent receives scoped access only after approval;
3. data remains on the platform;
4. previous audit evidence remains visible to Platform Administration / Control;
5. active tasks are recomputed for the new agent scope;
6. the reason for reassignment is recorded.

### 8.1 Agent-Created Objects

An agent-created object must follow this controlled route:

```text
agent creation request
-> represented party and authority evidence identified
-> duplicate / existing-record check
-> Platform Administration / Control decision
-> source object created or existing object linked
-> agent object assignment created
-> audit event recorded
```

The agent is responsible for data correctness under its authority, while CrewPortGlobal remains responsible for platform controls, duplicate checks, audit and scope enforcement.

## 9. Task Computation Rule

The computed task formula must become:

```text
previous stage result
+ current object state
+ agent organization / object scope
+ role and permission
+ historical active executor where applicable
= visible task
```

Ordinary operational tasks should be shown only when:

1. the object is assigned to the agent organization; and
2. the user belongs to that agent organization; and
3. the user has the required permission; and
4. the object state requires the operation.

Platform Administration / Control may still see oversight, complaint, duplicate-claim, reassignment and audit tasks.

## 10. Business-Process Documents Updated

This control was added to:

```text
docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
```

The updates define:

1. agent organization as a process participant;
2. agent users as scoped executors;
3. Platform Administration / Control as governance;
4. duplicate / account-claim checks;
5. same-rule handling for GTC-operated and external agents;
6. agent/object scope in task computation.

## 11. Future Implementation Work

Future implementation should be planned as a separate approved task.

Expected implementation areas:

1. `agent_organizations`;
2. `agent_users` or agent membership link;
3. `agent_authority_documents`;
4. `agent_object_creation_requests`;
5. `agent_object_assignments`;
6. `account_claims` / duplicate-resolution workflow;
7. task computation update with agent scope;
8. admin/control UI for approving agents, agent-created objects and reassignments;
9. user notification for existing-record claims;
10. audit events for agent authority, object creation, assignment and reassignment.

No DDL/DML is approved by this document.

## 12. Next Stage

Next recommended task:

```text
CPG-BIZ-112 - Agent organization schema and access-scope SQL draft
```

That task should prepare a SQL draft and API/UI plan, but must not apply runtime migration until reviewed and approved.
