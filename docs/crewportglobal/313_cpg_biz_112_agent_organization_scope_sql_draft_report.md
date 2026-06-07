# CPG-BIZ-112 - Agent Organization Scope SQL Draft Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: SQL schema draft and implementation-planning report
- Source task: continuation after CPG-BIZ-111 approval by Project Owner
- Version: 1.0
- Date: 2026-06-07
- Status: SQL draft prepared for Project Owner review; runtime migration not approved or executed

## 1. Purpose

This report records the proposed additive database schema for supporting independent crewing agents on the CrewPortGlobal platform.

The schema supports the CPG-BIZ-111 model:

```text
agent organization
+ agent users
+ verified authority evidence
+ agent-created object request where applicable
+ assigned object scope
+ duplicate / account-claim control
+ audit evidence
= allowed agent work
```

No DDL, DML, seed data, runtime migration, API endpoint or UI change was executed in this stage.

## 2. SQL Draft Location

The SQL draft is stored outside runtime migrations:

```text
docs/crewportglobal/sql_drafts/020_agent_organization_scope_schema_draft.sql
```

It is intentionally not stored as:

```text
projects/crewportglobal/app/backend/db/migrations/020_agent_organization_scope_schema.sql
```

This keeps the draft in the review/approval gate and prevents accidental database application.

## 3. Existing Data Reuse

The agent model must reuse current platform records instead of creating parallel copies.

| Existing source | How the draft uses it |
|---|---|
| `users` | Agent users are ordinary platform users. Their e-mail, account status and authentication remain in the existing user/auth model. |
| `employer_companies` | An agent organization may link to an existing company card through `agent_organizations.linked_company_id`. This avoids duplicating company registration data. |
| `company_users` | Company representatives remain company-scoped users. Agent membership is added separately only when a user acts under an agent organization. |
| `seafarer_profiles` | Agents may be assigned scoped responsibility over a seafarer profile, but the seafarer profile remains the source record. |
| `vessels` | Vessel cards remain the source of vessel context; agent scope points to the vessel record. |
| `vacancy_requests` | Crew requests / vacancies remain demand-side source records; agent scope points to the exact request when assigned. |
| `vacancy_applications` | Seafarer-initiated requests and applications remain in existing workflow records. Agent scope may point to those records when support/processing is assigned. |
| `operator_shortlist_drafts` / `operator_shortlist_candidates` | Agent scope may be assigned to later workflow objects without changing shortlist storage. |
| `contract_workspace_instances` | Contract workspaces remain the contract source object; an agent can receive scope to work on a workspace only through assignment. |
| `uploaded_documents` | Authority documents are linked through `agent_authority_documents.document_id`. |
| `access_groups`, `access_group_members`, `access_roles`, `access_permissions` | Group/permission checks remain the permission layer; agent object assignment adds the narrower object-scope layer. |
| `registration_audit_events`, `access_audit_events` | Existing audit remains valid; the draft adds agent-specific audit events for authority, assignment, reassignment and claims. |

When an agent creates a new object for a client, the created object must still be created in the normal source table:

| Object created by agent | Source table after approval |
|---|---|
| Physical person / account | `users` and related auth records |
| Seafarer profile | `seafarer_profiles` |
| Shipowner / employer company | `employer_companies` |
| Vessel | `vessels` |
| Crew request / vacancy | `vacancy_requests` |

The agent-specific table records the creation request, authority basis, duplicate check, review decision and link to the created object. It does not replace the source table.

## 4. Proposed Tables

| Table | Purpose |
|---|---|
| `agent_organizations` | Agent company / organization record, linked to an existing company card where available. Stores status, authority status and whether default routing is enabled. |
| `agent_users` | User membership inside an agent organization. This is separate from broad access groups and must be active before ordinary agent tasks are visible. |
| `agent_authority_documents` | Evidence that the agent has authority to act for a platform scope: platform agreement, shipowner agreement, vessel authority, seafarer authorization or representative authority. |
| `agent_object_creation_requests` | Controlled request for an agent to create a user, seafarer profile, shipowner/company card, vessel card or vacancy in the interest of a client. Stores authority basis, duplicate-check state, submitted payload snapshot and created-object link. |
| `agent_object_assignments` | The concrete object-scope assignment: which agent organization may work on which user, seafarer, company, vessel, vacancy, application, shortlist, contract or voyage-support object. |
| `account_object_claims` | Duplicate / existing-record claim workflow. It prevents silent duplicate full-access records and records who claims which person, company, vessel or profile. |
| `agent_scope_audit_events` | Agent-specific audit trail for authority review, assignment, reassignment, suspension, claim resolution and scope changes. |

## 5. Task Computation Impact

After this schema is approved and implemented in a future runtime migration, computed tasks must add one more access condition:

```text
object state
+ required role / permission
+ active agent organization assignment
+ active agent user membership
= visible ordinary agent task
```

The normal rule becomes:

| Condition | Result |
|---|---|
| Object has no active agent assignment | Task may be routed by current group / historical executor / default routing rule. |
| Object has active agent assignment | Ordinary execution task is visible only to active users in that assigned agent organization with the required permission. |
| Agent organization is suspended / limited / expired | Ordinary task is blocked or limited; Platform Administration / Control receives oversight or reassignment task. |
| Existing-record claim is pending | Full access is not granted; claim-resolution task is shown to Platform Administration / Control and limited claimant task may be shown where safe. |
| GTC-operated agent receives unassigned work by default | Treated as an ordinary agent assignment, not privileged ownership. |

## 6. Duplicate / Claim Control

The draft provides `account_object_claims` for the required process:

```text
new registration or agent-entered record
-> duplicate / existing-record check
-> claim record if a likely existing record exists
-> evidence request / review
-> Platform Administration / Control decision
-> linked access, new record, rejection, blocked duplicate or limited pending state
```

The future implementation should check existing records before activating:

1. user account by e-mail;
2. seafarer profile by user, document metadata and protected document signals;
3. company by registration number, country and company name;
4. vessel by IMO number, vessel name, flag and company link;
5. vacancy/request by company, vessel, rank and join-date context.

## 6.1 Agent-Created Object Control

An agent may create an object in the interest of a client only through a controlled creation request.

The required flow is:

```text
agent starts object creation
-> agent identifies represented party and authority document
-> system stores submitted payload snapshot
-> duplicate check runs before activation
-> Platform Administration / Control approves creation or requests evidence
-> normal source object is created in users / seafarer_profiles / employer_companies / vessels / vacancy_requests
-> agent_object_assignments links the created object to the responsible agent organization
-> audit event records creation, source authority and assignment
```

This flow supports the user's clarification:

```text
Agent may create objects in the interest of shipowners, seafarers and vessels,
but the created records remain normal platform objects and are not agent-owned copies.
```

The agent remains responsible for correctness of data entered under its authority. The platform remains responsible for duplicate control, access scope, audit, reassignment and claim resolution.

## 7. API Design Draft

Future API endpoints should be implemented only after migration approval.

Proposed protected endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/agents` | List agent organizations for Platform Administration / Control. |
| `POST` | `/api/v1/admin/agents` | Create an agent organization from existing company/user context or submitted agent application. |
| `PATCH` | `/api/v1/admin/agents/{agent_organization_id}` | Approve, limit, suspend, reject or archive an agent. |
| `POST` | `/api/v1/admin/agents/{agent_organization_id}/users` | Add a user to an agent organization. |
| `PATCH` | `/api/v1/admin/agent-users/{agent_user_id}` | Activate, suspend or revoke an agent user. |
| `POST` | `/api/v1/admin/agents/{agent_organization_id}/authority-documents` | Link protected uploaded document evidence to an agent authority record. |
| `PATCH` | `/api/v1/admin/agent-authority-documents/{agent_authority_document_id}` | Review, verify, limit, reject, expire or revoke authority evidence. |
| `POST` | `/api/v1/agents/object-creation-requests` | Agent creates a controlled request to create a person, seafarer, company, vessel or vacancy for a represented client. |
| `GET` | `/api/v1/admin/agent-object-creation-requests` | Platform Control reviews pending agent-created object requests and duplicate-check results. |
| `PATCH` | `/api/v1/admin/agent-object-creation-requests/{agent_object_creation_request_id}` | Approve creation, request evidence, block duplicate, reject or link created object. |
| `POST` | `/api/v1/admin/agent-object-assignments` | Assign a concrete object to an agent organization. |
| `PATCH` | `/api/v1/admin/agent-object-assignments/{agent_object_assignment_id}` | Suspend, revoke, expire or reassign object scope. |
| `GET` | `/api/v1/admin/account-object-claims` | Review duplicate / account / object claims. |
| `PATCH` | `/api/v1/admin/account-object-claims/{account_object_claim_id}` | Approve, reject, request evidence or block a claim. |

Agent-facing endpoints must never show all platform objects. They should read only objects assigned to the user's active agent organization.

## 8. UI Design Draft

Future UI areas:

| UI area | Purpose |
|---|---|
| Platform Control: Agent Organizations | Approve, limit, suspend and review agent organizations. |
| Platform Control: Agent Authority | Review agency agreements, representative authority, seafarer authorization and vessel authority evidence. |
| Platform Control: Agent-Created Objects | Review proposed objects created by agents, duplicate-check results and authority basis before activation. |
| Platform Control: Duplicate / Claims | Resolve user/company/vessel/seafarer claims before full access is granted. |
| Platform Control: Object Assignment | Assign or reassign a seafarer, shipowner, vessel, request, shortlist, contract or voyage-support object to an agent. |
| Agent Cabinet | Show only tasks and objects assigned to the active agent organization. |
| User Claim Flow | Let an existing seafarer, shipowner or agent claimant prove rights to an already-known platform record. |

## 9. Access-Control Boundary

The schema is not a replacement for the existing access-control model.

The intended access decision is:

```text
authenticated user
+ active user account
+ active group/role/permission
+ active agent organization membership when applicable
+ active object assignment when applicable
+ object state
= allowed action
```

Broad group membership alone must not expose unrelated objects after an agent assignment exists.

## 10. Important Non-Scope

This stage does not:

1. apply SQL to PostgreSQL;
2. create a runtime migration file;
3. seed agent groups or users;
4. change existing user/group memberships;
5. create API endpoints;
6. create UI pages;
7. change task computation code;
8. create any user, seafarer, shipowner, vessel or vacancy from an agent request;
9. move existing seafarer, shipowner, vessel, vacancy, shortlist or contract data;
10. grant any agent access.

## 11. Static Verification

Performed checks:

```bash
git diff --check
```

Result: passed.

The SQL draft was not executed against PostgreSQL.

## 12. Approval Gate

Before runtime migration, Project Owner should review:

1. whether `agent_organizations.linked_company_id` is sufficient for agent company identity;
2. whether one active ordinary agent assignment per object is the correct rule;
3. whether `default_routing_enabled` should exist only for GTC-operated agents or also for preferred external agents;
4. whether agent-created object requests require Platform Control approval before every creation, or whether verified agents may create low-risk drafts that remain inactive until duplicate checks clear;
5. whether account/object claims need user notifications before runtime implementation;
6. whether `agent_scope_audit_events` should stay separate or be merged into a future unified audit table.

## 13. Next Stage

After Project Owner review, the next stage can be:

```text
CPG-BIZ-113 - Agent organization SQL draft approval and runtime migration decision
```

That stage should either:

1. approve conversion of the SQL draft into a real migration with static/API tests; or
2. return the draft for correction before migration packaging.

## 14. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-07 | GTC IT / AI Assistant | Initial SQL draft and implementation-planning report for agent organizations, authority evidence, object assignments, duplicate claims and agent-scope audit |
