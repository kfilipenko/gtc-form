# CPG-BIZ-117 - Agent Task Queue Routing And Authority Review Workspace Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-116 approval
- Version: 1.0
- Date: 2026-06-08
- Status: Implemented and verified on GTC1 test flow

## 1. Назначение

Этот отчет фиксирует следующий слой агентского процесса после CPG-BIZ-116.

Цель этапа: сделать агентскую работу вычисляемой задачей, а проверку доверенностей и заявок агента на создание объектов - видимой задачей platform/control.

Сохраняется утвержденный принцип:

```text
agent may create an object request,
but may manage the object only after verified authority
and active object assignment.
```

## 2. Реализованный Объем

Добавлены backend endpoints:

```text
GET /api/v1/agents/tasks
GET /api/v1/admin/agents/review-workspace
```

`/agents/tasks` вычисляет задачи агента из текущих данных:

1. active/limited object assignment;
2. verified/limited authority document;
3. management blocker, если полномочия не позволяют управлять объектом;
4. pending object creation requests.

`/admin/agents/review-workspace` вычисляет задачи platform/control из:

1. submitted/under_review agent authority documents;
2. submitted/duplicate/evidence object creation requests.

## 3. Task Display Model

Задачи агента и platform/control возвращаются в единой модели:

```json
{
  "task_model": "data_derived_agent_scope",
  "operation_code": "manage_represented_object",
  "task_title": "Manage represented object. (person_user: API Agent Manager managed account.)",
  "process_stage": "Seafarer represented-object management",
  "visibility_condition": "Visible while this object is assigned...",
  "task_state": "active_agent_operation",
  "target_url": "/agents/?object_type=person_user&object_id=...#agent-object-..."
}
```

Название задачи является активной ссылкой на конкретный объект или request record внутри agent workspace.

Отдельная кнопка `Open...` не используется.

## 4. Authority Evidence Visibility

`GET /api/v1/agents/objects` теперь возвращает по каждому назначенному объекту:

```json
{
  "authority": {
    "authority_document_id": "...",
    "authority_status": "verified",
    "authority_type": "power_of_attorney",
    "authority_scope_type": "other",
    "authority_scope_object_id": "...",
    "valid_from": "2026-06-08",
    "valid_until": "2027-06-08"
  }
}
```

Это позволяет показывать в карточке объекта, на основании какого документа агент управляет объектом.

## 5. UI Behavior

Страница:

```text
/agents/
```

теперь показывает:

1. summary агентской организации;
2. количество assigned objects;
3. количество pending requests;
4. количество computed tasks;
5. список `My agent tasks`;
6. список assigned objects с authority evidence;
7. список object creation requests;
8. platform-control review section, если у пользователя есть соответствующий доступ.

Platform-control section скрывается, если пользователь не имеет прав на review workspace.

## 6. No DB / Migration Boundary

Этот этап не выполнял:

1. `CREATE`;
2. `ALTER`;
3. новую migration;
4. изменение runtime schema.

Реализация использует migration 020 и добавляет только API/UI вычисление.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added agent task endpoint, admin review workspace endpoint, task builders, authority summary and routes. |
| `projects/crewportglobal/public/agents/index.html` | Added computed task list, object creation request list, authority metadata display and platform-control review section. |
| `tests/crewportglobal-registration-api.spec.ts` | Extended focused agent API regression for authority review workspace, request review task and agent computed task. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 318. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added CPG-BIZ-117 business-control revision. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Marked agent task queue and authority review workspace as implemented. |
| `docs/crewportglobal/318_cpg_biz_117_agent_task_queue_authority_review_workspace_report.md` | Added this report. |

## 8. Verification

### 8.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Agent Page Inline Script

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

### 8.3 Focused Agent API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "agent API exposes verified authority management context"
```

Result: 1 passed.

The focused test confirms:

1. submitted authority evidence appears as a platform-control review task;
2. verified authority evidence disappears from pending authority review;
3. agent object creation request appears as a platform-control review task;
4. object assignment creates `management_allowed: true`;
5. assigned object exposes authority metadata;
6. `/agents/tasks` computes an active agent task for the managed object;
7. pending object request remains visible as a waiting/control task for the agent.

## 9. Controlled Gaps

1. Duplicate/account-claim review workflow is still future work.
2. Agent reassignment workflow is still future work.
3. Agent task target opens the agent workspace object/request record; deeper object-specific edit workspaces remain future slices.
4. No employer/seafarer contact expansion was added.
5. No contract generation or employment decision was added.

## 10. Следующий Этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-118 - Agent duplicate/account claim and reassignment workflow
```

Цель следующего этапа: если агент создает объект, который уже существует на платформе, система должна вычислить claim/review task, уведомить владельца или platform/control и не создавать silent duplicate full-access record.
