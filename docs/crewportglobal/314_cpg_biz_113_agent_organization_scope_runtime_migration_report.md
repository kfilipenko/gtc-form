# CPG-BIZ-113 - Agent Organization Scope Runtime Migration Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Runtime migration implementation report
- Source task: Project Owner approval after CPG-BIZ-112
- Version: 1.0
- Date: 2026-06-07
- Status: Implemented and verified on test DB

## 1. Purpose

This report records conversion of the approved CPG-BIZ-112 agent organization SQL draft into a real runtime database migration.

The migration creates the database foundation for independent agent organizations:

1. GTC-operated and external agents use one common model;
2. agent users act under an agent organization;
3. agent authority documents are stored as evidence;
4. an agent may create objects for a client only through a controlled request;
5. created objects remain normal platform records, not agent-owned copies;
6. object assignments define the agent's working scope;
7. duplicate / account / object claims are controlled before full access;
8. agent-scope audit events record authority, assignment and claim operations.

## 2. Implementation Boundary

This slice implements database schema only.

It does not implement:

1. agent onboarding UI;
2. agent cabinet;
3. Platform Administration / Control pages;
4. API endpoints;
5. task-computation changes;
6. default routing of unassigned objects;
7. notifications for existing-record claims;
8. seed data;
9. agent access grants;
10. reassignment workflow.

No existing seafarer, shipowner, vessel, vacancy, shortlist or contract data was moved.

## 3. Runtime Migration

Created runtime migration:

```text
projects/crewportglobal/app/backend/db/migrations/020_agent_organization_scope_schema.sql
```

Source draft:

```text
docs/crewportglobal/sql_drafts/020_agent_organization_scope_schema_draft.sql
```

The runtime migration keeps the CPG-BIZ-112 decision:

```text
agent-created object request
-> duplicate / authority review
-> normal platform source object
-> agent object assignment
-> agent-scope audit
```

## 4. Test Bootstrap Update

Updated Playwright database bootstrap to apply migration 020:

```text
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
```

This ensures future API/UI regression environments include the agent organization scope schema.

## 5. Tables Created

| Table | Purpose |
|---|---|
| `agent_organizations` | Agent company / organization record, linked to an existing company card where available. |
| `agent_users` | User membership inside an agent organization. |
| `agent_authority_documents` | Evidence of platform agreement, shipowner agreement, vessel authority, seafarer authorization or representative authority. |
| `agent_object_creation_requests` | Controlled request for an agent to create a person, seafarer, company, vessel or vacancy for a represented client. |
| `agent_object_assignments` | Concrete object-scope assignment to an agent organization. |
| `account_object_claims` | Duplicate / existing-record claim workflow. |
| `agent_scope_audit_events` | Agent-specific audit trail for authority, assignment, reassignment, suspension and claim events. |

## 6. Existing Source Data Reuse

The migration is source-first. It does not create parallel business records.

| Existing source | Runtime schema use |
|---|---|
| `users` | Agent users are ordinary platform users with agent membership added separately. |
| `employer_companies` | Agent organization may link to an existing company card. |
| `seafarer_profiles` | Agent scope may point to a seafarer profile, but the profile remains the source record. |
| `vessels` | Agent scope may point to a vessel card, but the vessel remains the source record. |
| `vacancy_requests` | Agent scope may point to a crew request / vacancy. |
| `vacancy_applications` | Agent scope may support application / incoming request workflows. |
| `operator_shortlist_drafts` and `operator_shortlist_candidates` | Agent scope may later support shortlist workflow objects. |
| `contract_workspace_instances` | Agent scope may later support contract workspace operations. |
| `uploaded_documents` | Agent authority evidence links to protected uploaded documents. |

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
  -f projects/crewportglobal/app/backend/db/migrations/020_agent_organization_scope_schema.sql
```

Result: migration applied successfully on the test DB.

### 7.3 Idempotency Check

The same migration was executed a second time.

Result: passed. Existing tables, indexes and triggers were safely skipped/recreated where designed.

### 7.4 Schema Check

Confirmed seven agent-scope tables exist in `crewportglobal`:

```text
account_object_claims
agent_authority_documents
agent_object_assignments
agent_object_creation_requests
agent_organizations
agent_scope_audit_events
agent_users
```

Confirmed key linkage fields exist:

```text
agent_object_creation_requests.created_object_id
agent_object_assignments.source_creation_request_id
account_object_claims.claim_status
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

The database foundation for agent organizations and scoped agent work is now implemented as runtime migration 020 and verified in the test environment.

The platform still needs implementation of:

1. Platform Administration / Control API and UI;
2. agent organization onboarding;
3. agent authority document review;
4. agent object creation request review;
5. duplicate / account / object claim workflow;
6. agent object assignment and reassignment workflow;
7. task-computation update:

```text
object state
+ required role / permission
+ active agent organization assignment
+ active agent user membership
= visible ordinary agent task
```

## 9. Next Recommended Stage

Recommended next stage:

```text
CPG-BIZ-114 - Agent organization API/UI and task-computation scope implementation
```

That stage should implement the operational surface without changing the approved rule:

```text
agent authority first
+ duplicate / claim control
+ scoped object assignment
+ audit event
= allowed agent work
```
