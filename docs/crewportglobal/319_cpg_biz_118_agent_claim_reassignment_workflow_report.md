# CPG-BIZ-118 - Agent Claim And Reassignment Workflow Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-117 approval
- Version: 1.0
- Date: 2026-06-08
- Status: Implemented and verified on GTC1 test flow

## 1. Назначение

Этот отчет фиксирует следующий слой агентской модели после CPG-BIZ-117.

Цель этапа: если агент заявляет право на уже существующий объект платформы, система должна создать вычисляемый claim/review процесс, а не silent duplicate record.

Утвержденный принцип сохранен:

```text
agent may create or claim an object,
but may manage it only after verified authority
and active object assignment.
```

## 2. Реализованный Объем

Добавлены backend endpoints:

```text
GET /api/v1/agents/account-object-claims
POST /api/v1/agents/account-object-claims
PATCH /api/v1/admin/agents/account-object-claims/{account_object_claim_id}/review
```

Расширены существующие endpoints:

```text
GET /api/v1/agents/tasks
GET /api/v1/admin/agents/review-workspace
```

Теперь `/agents/tasks` вычисляет agent-visible claim tasks:

1. `Track account/object claim` для submitted / under_review claim;
2. `Provide claim evidence` для evidence_requested / limited_pending claim;
3. control record для завершенных claim statuses.

Теперь `/admin/agents/review-workspace` вычисляет platform-control task:

```text
Review account/object claim.
```

## 3. Claim Status Model

Реализация использует существующую таблицу:

```text
crewportglobal.account_object_claims
```

и существующие статусы migration 020:

| Status | Meaning |
|---|---|
| `submitted` | Agent submitted claim for platform/control review. |
| `under_review` | Platform/control started review. |
| `evidence_requested` | Agent must provide more evidence. |
| `limited_pending` | Claim remains limited pending extra confirmation. |
| `approved_linked` | Claim approved and linked to an existing platform object/assignment. |
| `approved_new_record` | Claim approved for a new controlled object record path. |
| `rejected` | Claim rejected. |
| `blocked_duplicate` | Claim confirmed as duplicate risk and blocked. |
| `cancelled` | Claim cancelled. |

No new DB migration was required.

## 4. Reassignment Behavior

When platform/control approves an agent claim for an existing object:

1. The endpoint checks that the claimant agent organization exists.
2. The endpoint checks target object type and ID.
3. The endpoint checks a verified or limited authority document for the claimant agent.
4. If the object is already assigned to the same agent organization, the claim is linked to the existing assignment.
5. If the object is assigned to another agent organization, the old active assignment is marked:

```text
assignment_status = reassigned
```

and a new active/limited assignment is created with:

```text
assignment_source = claim_resolution
data_responsibility_status = agent_responsible
source_authority_document_id = verified authority document
```

The object management context then returns:

```text
Managed by: <new agent organization>
```

## 5. Audit Behavior

`agent_scope_audit_events` now stores `account_object_claim_id` for claim events.

New audit event types used in this slice:

```text
agent_account_object_claim_submitted
agent_account_object_claim_reviewed
agent_account_object_claim_linked_existing_assignment
agent_object_assignment_created_from_claim
agent_object_assignment_reassigned
```

Every claim submission and approval/reassignment records:

1. actor user;
2. agent organization;
3. claim ID;
4. target object type and ID;
5. previous value;
6. new value;
7. review reason/note.

## 6. UI Behavior

Page:

```text
/agents/
```

now shows:

1. claim count in the agent summary;
2. account/object claim list;
3. claim status;
4. linked assignment ID when the claim is approved;
5. platform-control review task for pending claims when the viewer has review permission.

The UI still does not grant access by itself.

Actual management rights are computed only by backend assignment and authority guard.

## 7. No Employer / Seafarer Data Expansion

This slice does not expose sensitive candidate, employer, vessel or contract payloads.

The claim workflow handles safe identifiers only:

1. target object type;
2. target object ID;
3. optional email / registration number / country / IMO;
4. safe duplicate snapshot;
5. authority evidence reference.

No contact expansion, employment decision, contract generation or employer presentation was added.

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added agent claim endpoints, admin claim review endpoint, assignment reassignment logic, claim task builders and claim audit linkage. |
| `projects/crewportglobal/public/agents/index.html` | Added claim count and claim list in the agent workspace. |
| `tests/crewportglobal-registration-api.spec.ts` | Extended the focused agent API regression to approve a claim and reassign an existing object to another verified agent. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 319. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added CPG-BIZ-118 business-control revision. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Marked duplicate/account claim and reassignment workflow as implemented. |
| `docs/crewportglobal/319_cpg_biz_118_agent_claim_reassignment_workflow_report.md` | Added this report. |

## 9. Verification

### 9.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 9.2 Agent Page Inline Script

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/agents/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 1 inline script.

### 9.3 Focused Agent API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "agent API exposes verified authority management context"
```

Result: 1 passed.

The focused test confirms:

1. agent authority evidence can be submitted and verified;
2. an object can be assigned to the first verified agent;
3. a second verified agent can submit an account/object claim for the same object;
4. the claim appears in `/admin/agents/review-workspace`;
5. the claimant agent sees a computed claim task in `/agents/tasks`;
6. platform/control approval marks the old active assignment as `reassigned`;
7. a new assignment is created with `assignment_source = claim_resolution`;
8. object management context changes to the second agent;
9. the original agent no longer sees the object in `/agents/objects`;
10. the claim is stored as `approved_linked` with `linked_assignment_id`;
11. claim and reassignment audit events are recorded.

### 9.4 API Regression

```bash
npm run test:cpg-api
```

Result: 23 passed.

## 10. Controlled Gaps

1. The claim workflow does not yet create the missing object when `approved_new_record` is selected without a target object.
2. The claim workflow does not yet notify the original object owner or previous agent in a separate notification channel.
3. Deeper object-specific edit workspaces for agent-managed objects remain future work.
4. Agent authority upload UI remains a future slice; current API accepts authority document references.
5. No contract generation or party negotiation flow was added in this slice.

## 11. Следующий Этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-119 - Agent-managed object participant cards and scoped edit workspaces
```

Цель следующего этапа: показать в карточках моряка, судовладельца, судна и вакансии явное поле `Managed by / Управляется`, открыть scoped edit workspace для агента и сохранить, что управление объектом вычисляется из active assignment and verified authority.
