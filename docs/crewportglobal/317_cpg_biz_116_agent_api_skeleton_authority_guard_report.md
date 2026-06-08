# CPG-BIZ-116 - Agent API Skeleton And Verified Authority Guard Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-115 approval
- Version: 1.0
- Date: 2026-06-08
- Status: Implemented and verified on GTC1 test flow

## 1. Назначение

Этот отчет фиксирует первый runtime API-слой для агентских организаций.

Цель этапа: подключить ранее созданную DB-модель агентского scope к API и интерфейсу `/agents/`, сохранив главный контроль:

```text
agent may request object creation
but agent may manage an object only after verified authority
and active object assignment.
```

## 2. Реализованный Объем

В backend добавлены protected endpoints:

```text
GET  /api/v1/agents/me
GET  /api/v1/agents/objects
GET  /api/v1/agents/object-creation-requests
POST /api/v1/agents/object-creation-requests
POST /api/v1/agents/authority-documents
PATCH /api/v1/admin/agents/authority-documents/{agent_authority_document_id}/review
POST /api/v1/admin/agents/object-assignments
```

В `/agents/` страница теперь читает реальные данные agent API:

1. статус агентской организации;
2. authority status;
3. количество управляемых объектов;
4. количество запросов на создание объектов;
5. список объектов с `Managed by`;
6. blocker, если агент не может управлять объектом.

## 3. Guard Правила

Управление объектом агентом разрешается только если:

1. agent organization имеет допустимый статус;
2. authority status организации допустим;
3. authority document имеет статус `verified` или `limited`;
4. authority document не истек;
5. agent object assignment имеет статус `active` или `limited`;
6. если authority document привязан к конкретному объекту, assignment создается только для этого же объекта.

Если authority document привязан к другому объекту, backend возвращает:

```text
409 agent_assignment_authority_scope_mismatch
```

## 4. Task Management Context

Computed team tasks теперь получают дополнительный блок:

```json
{
  "management": {
    "managed_by_type": "registered_user | agent_organization | platform_control",
    "managed_by_display_name": "safe display name",
    "managed_by_agent": true,
    "management_allowed": true,
    "management_blocker": null
  }
}
```

Этот блок не заменяет существующую логику вычисления задач. Он добавляет управленческий контекст, который нужен для следующего этапа назначения задач агенту или самостоятельному владельцу объекта.

## 5. Audit Evidence

API фиксирует события в:

```text
agent_scope_audit_events
```

Проверенный тестовый сценарий подтвердил события:

```text
agent_authority_submitted
agent_authority_reviewed
agent_object_creation_requested
agent_object_assignment_created
```

Каждая операция сохраняет actor context, agent organization, target object, previous/new value snapshot и reason.

## 6. JSONB Object Standard Correction

В ходе теста выявлена системная ошибка: пустые PHP-массивы для JSONB object полей могли сериализоваться как:

```json
[]
```

а таблицы agent scope требуют:

```json
{}
```

Добавлен отдельный helper для agent-scope API, который гарантирует object JSON для:

1. authority metadata;
2. authority scope snapshot;
3. object creation payload snapshot;
4. object creation metadata;
5. assignment source snapshot;
6. assignment metadata;
7. audit previous/new value.

Схема DB не ослаблялась.

## 7. No DDL / Migration Boundary

Этот этап не выполнял:

1. `CREATE`;
2. `ALTER`;
3. новую migration;
4. изменение runtime schema;
5. изменение production data outside focused API test cleanup.

Работа использовала уже утвержденную runtime migration 020.

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added agent API endpoints, authority review, object assignment, management context and JSONB object helper. |
| `projects/crewportglobal/public/agents/index.html` | Connected agent page to real API status, objects and creation request counts. |
| `tests/crewportglobal-registration-api.spec.ts` | Added focused API regression for verified authority, object assignment, management context and audit events. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 317. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added CPG-BIZ-116 business-control revision. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Updated agent-stage implementation status and next work. |
| `docs/crewportglobal/317_cpg_biz_116_agent_api_skeleton_authority_guard_report.md` | Added this report. |

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

### 9.3 Focused API Test

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "agent API exposes verified authority management context"
```

Result: 1 passed.

The test confirms:

1. account session can be connected to active agent user;
2. agent can submit authority document;
3. admin/control user can verify authority document;
4. agent can submit object creation request;
5. admin/control user can assign object to agent only under verified authority;
6. object returns `Managed by` agent organization;
7. agent object list returns the same management context;
8. audit events are recorded.

## 10. Remaining Controlled Gaps

1. Agent UI still shows a limited API summary; full authority upload/review UI is a future slice.
2. Dedicated admin UI for authority review and object assignment is not implemented yet.
3. Dedicated `agent_admin` permission is not introduced yet; admin endpoints currently reuse existing owner/control access guard.
4. Task queues can now receive management context, but agent-specific task queue routing is the next implementation stage.
5. Duplicate/account claim review remains DB-ready but not fully exposed in UI.

## 11. Next Stage

Recommended next stage:

```text
CPG-BIZ-117 - Agent task queue routing and authority review workspace
```

This stage should:

1. show agent-managed object tasks in `/agents/`;
2. compute task owner from `Managed by`;
3. expose authority document review workspace for platform control;
4. show authority evidence in managed object cards;
5. verify that agent tasks disappear/recompute after operation completion.
