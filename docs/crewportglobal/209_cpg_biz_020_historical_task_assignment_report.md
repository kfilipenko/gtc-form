# CPG-BIZ-020 - Отчет о вычисляемой персонализации задач по истории объекта

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-019
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап реализует правило персонализации вычисляемых задач:

```text
Если активный сотрудник ответственной группы ранее выполнил аналогичную операцию
по тому же объекту, следующая задача по этому объекту и группе назначается ему.
Если такой истории нет, задача остается в очереди группы.
```

Этап не создает ручную таблицу задач и не меняет бизнес-объекты. Задача по-прежнему вычисляется из текущего состояния данных, прав доступа и истории операций.

## 2. Проверенный бизнес-принцип

Утвержденный принцип:

```text
previous stage result
+ current object state
+ responsible group/permission
+ active historical executor for the same object and group
= visible task for person or group queue
```

Практическое правило:

| Ситуация | Результат |
|---|---|
| По объекту еще нет истории выполнения операции членом группы | Задача видна как `Assigned employee: group queue`. |
| Первый член группы выполнил операцию по объекту | Audit event становится источником будущего персонального назначения. |
| Следующая задача по тому же объекту и группе вычисляется позже | Задача получает `assigned_user_id` и `assigned_user_label`. |
| Исторический исполнитель неактивен или уже не состоит в группе | Задача возвращается в group queue. |

## 3. Реализация в backend

Изменен процесс сборки задач:

```text
GET /api/v1/team/workbench/tasks
```

Теперь ответ содержит:

```text
task_assignment_model = historical_active_executor_or_group_queue
persisted_task_table_created = false
```

В каждую computed task добавляется блок:

```text
assignment
context.assigned_group_code
context.assignment_mode
context.assignment_reason
context.assigned_user_id
context.assigned_user_label
```

`assigned_user_id` и `assigned_user_label` появляются только когда найден активный исторический исполнитель.

## 4. Источник вычисления исполнителя

Исполнитель вычисляется из уже существующих данных:

```text
registration_audit_events.event_payload.actor_context.actor_user_id
registration_audit_events.event_payload.actor_context.target_group_code
registration_audit_events.event_payload object identifiers
registration_audit_events.actor_user_id fallback
users.is_active
access_group_members.membership_state = active
access_groups.is_active = true
```

Fallback на `registration_audit_events.actor_user_id` используется только если:

1. `actor_context.actor_user_id` отсутствует;
2. этот user активен;
3. этот user является активным членом ответственной группы.

Это не дает доступа посторонним клиентам, потому что персонализация невозможна без активного group membership.

## 5. Object Matching

Для связи новой задачи с предыдущей операцией используются безопасные object identifiers:

| Object type | Matching keys |
|---|---|
| Crew request / vacancy request | `vacancy_request_id`, `record_id`, `queue_item_id` |
| Internal shortlist draft | `shortlist_draft_id`, linked `vacancy_request_id` |
| Vacancy application | `vacancy_application_id`, `applications[].vacancy_application_id` |
| Deletion confirmation | `vacancy_request_id` from `vacancy_deletion_request` |
| Future seafarer/vessel/company objects | `candidate_user_id`, `seafarer_user_id`, `vessel_id`, `company_id`, `draft_id` |

## 6. UI Behavior

`/team/` already reads:

```text
context.assigned_user_label
```

Therefore no extra UI layout change was required.

Visible behavior:

| Condition | UI text |
|---|---|
| No active historical executor | `Assigned employee: group queue` |
| Active historical executor found | `Assigned employee: {employee name}` |

The task title remains the active link to the concrete internal work object.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added computed assignment helpers, historical assignee lookup, assignment context in task payloads and `task_assignment_model`. |
| `tests/crewportglobal-operator-queue.spec.ts` | Updated focused assertions to verify group queue before first execution and named employee assignment after shortlist draft creation. |
| `tests/crewportglobal-registration-api.spec.ts` | Updated contact/data-minimization assertion to reject raw `"document_metadata":` payload fields while allowing safe proof flags such as `candidate_document_metadata_excluded`. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Replaced group-queue-only boundary with the active historical executor or group queue model. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added practical user/team/AI instructions for computed personal assignment. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Updated core control 34 and revision history. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 209. |
| `docs/crewportglobal/209_cpg_biz_020_historical_task_assignment_report.md` | Added this report. |

## 8. Verification

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Focused task-assignment check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused check confirms:

1. initial `create_internal_shortlist_draft` task remains in group queue;
2. after the first operation is completed, the next `approve_internal_shortlist` task is assigned to the historical active executor;
3. the next `create_review_applications` task remains assigned to the same executor;
4. task links still open concrete working objects;
5. no candidate contact fields or broad document metadata are exposed.

### 8.3 Focused operator/team suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

The suite confirms:

1. ordinary operator queue still renders;
2. manager-only deletion confirmation remains protected;
3. vacancy application review still works;
4. shortlist task personalization works after historical execution evidence is created.

### 8.4 Focused API check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

The API check confirms:

1. candidate-search and internal shortlist API flow still works;
2. raw contact fields remain excluded;
3. raw `"document_metadata":` payload objects remain excluded;
4. safe privacy-boundary proof flags are still allowed.

## 9. Result

Этап CPG-BIZ-020 завершен.

Приложение теперь поддерживает вычисляемую персонализацию задач без отдельной ручной assignment table:

```text
active historical executor -> named task assignment
no historical executor -> group queue
```

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-021 - Manager reassignment and inactive-assignee fallback verification
```

Цель следующего этапа:

1. описать manager-controlled reassignment route;
2. проверить поведение при inactive/blocked historical executor;
3. определить, нужна ли отдельная таблица ручного reassignment;
4. не менять автоматические employment decisions и employer-facing publication boundary.
