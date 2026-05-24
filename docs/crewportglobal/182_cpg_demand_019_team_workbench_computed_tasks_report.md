# CPG-DEMAND-019 - Team Workbench Computed My Tasks Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-018
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует этап CPG-DEMAND-019.

Цель этапа: показать вычисленные операции в рабочем кабинете команды `/team/` как список `My tasks`, сохранив подтвержденный принцип:

1. задачи не создаются как отдельные постоянные записи;
2. задачи вычисляются из текущих данных очереди, shortlist draft, guard status и прав пользователя;
3. пользователь видит только те операции, на которые у него есть групповое право;
4. выполнение операций остается в защищенном operator workflow;
5. переходы не создают employer-facing visibility без отдельного утвержденного этапа.

Этап не создает persisted task table, не публикует кандидатов работодателю, не переводит заявки в `presented`, не добавляет matching score и не принимает employment decisions.

## 2. Что реализовано

Добавлен защищенный endpoint:

```text
GET /api/v1/team/workbench/tasks
```

Endpoint возвращает вычисленный список задач для named team/admin session.

Модель ответа:

```text
task_model = data_derived_current_state
persisted_task_table_created = false
access_model = team_admin_session
actor_user_id = named session user_id
queue_permissions = permissions available to current user
tasks[] = computed operation tasks visible to this user
```

Каждая задача формируется из уже существующих computed operations и содержит:

1. `task_id` - стабильный вычисленный идентификатор;
2. `operation_code` - код операции;
3. `title` - человекочитаемое название операции;
4. `record_type` и `record_id` - объект, по которому нужна работа;
5. `required_access` - группа, роль, permission и результат проверки;
6. `target_url` - ссылка на рабочую операторскую поверхность;
7. `responsible_group_after_transition` - следующая ответственная группа, если операция меняет этап;
8. `guard_summary` - краткое состояние guard, если применимо.

## 3. Access Model

Для входа в `/team/` теперь допускаются пользователи из групп:

```text
owners
cpg_team
review_team
```

Для demand shortlist workflow основной рабочий профиль:

```text
group = review_team
role = reviewer
permissions = view_review_queue, start_human_review, approve_candidate_presentation
```

`/team/` открывается только через named session. Временный operator token не используется для team workbench tasks, потому что для задач в кабинете требуется персональная атрибуция пользователя.

## 4. Computed Task Rules

Текущие вычисляемые задачи:

| Source data | Operation | Required permission | Visibility rule |
|---|---|---|---|
| `vacancy_request` queue row | `create_internal_shortlist_draft` | `view_review_queue` | Видно, если vacancy request доступна текущей группе и operation guard разрешает действие. |
| `operator_shortlist_drafts` with `needs_review` | `approve_internal_shortlist` | `approve_candidate_presentation` | Видно, если draft internal-only и пользователь имеет право approval. |
| `operator_shortlist_drafts` with `approved_internal` | `create_review_applications` | `start_human_review` | Видно, если draft approved internal и bridge guard разрешает создать internal review applications. |
| `vacancy_application` queue row | `review_candidate_presentation` | `approve_candidate_presentation` | Видно, если application находится в human-review queue и доступна текущей группе. |

Если `required_access.allowed` возвращает `false`, задача не попадает в `My tasks`.

## 5. UI Behavior

В `/team/` добавлен блок:

```text
My tasks
```

Он отображается после входа пользователя через team/admin session и показывает:

1. название вычисленной операции;
2. код операции;
3. тип и идентификатор записи;
4. ответственную группу;
5. требуемый permission;
6. ссылку `Open operator workbench`.

Ссылка ведет на:

```text
/verify/
```

`/verify/` продолжает использовать сохраненную named session и проверяет права на backend перед выполнением операции.

## 6. Portal Verification Path

Проверка на портале:

```text
https://crewportglobal.com/team/
```

Порядок входа:

1. Пользователь открывает `/team/`.
2. Пользователь входит через email-code team/admin session.
3. Пользователь должен состоять в `review_team` или иметь owner/admin override.
4. Для первого demand workflow пользователь должен иметь permission `view_review_queue`.
5. После входа `/team/` показывает `My tasks`.
6. Пользователь нажимает `Open operator workbench` и переходит в `/verify/`.
7. Операция выполняется только если backend подтверждает group permission.

## 7. Audit And Responsibility Boundary

`GET /api/v1/team/workbench/tasks` сам по себе не пишет audit event, потому что это read-only вычисление текущих задач.

Материальные операции остаются в существующих защищенных endpoint'ах:

```text
POST /api/v1/operator/vacancies/{id}/shortlist-drafts
PATCH /api/v1/operator/shortlist-drafts/{id}/approval
POST /api/v1/operator/shortlist-drafts/{id}/review-applications
```

Когда операция выполняется через named session, audit context содержит:

```text
actor_user_id
actor_label
permission_boundary = group_permission_check
```

Таким образом, отображение задачи вычисляется read-only, а выполнение операции фиксируется с персональной атрибуцией.

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php` | Added `review_team` as an allowed `/team/` entry group for demand workflow users. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added named-session-only `GET /api/v1/team/workbench/tasks`, computed task assembly from queue/shortlist data and permission filtering. |
| `projects/crewportglobal/public/team/index.html` | Added `My tasks` card, task fetch, empty/error states and task links to `/verify/`. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended focused operator workflow test to verify that a `review_team` named session sees computed `/team/` tasks. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 182 and revision 1.62. |
| `docs/crewportglobal/182_cpg_demand_019_team_workbench_computed_tasks_report.md` | Added this report. |

## 9. Verification

Verification performed on GTC1:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```text
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
```

Result: passed.

```text
node inline script syntax check for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/verify/index.html
```

Result: checked 1 team inline script and 2 verify inline scripts.

```text
git diff --check
```

Result: passed.

Focused operator/team UI check:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused check confirms:

1. a named `review_team` session can access `/team/`;
2. `/team/` displays `My tasks`;
3. the computed task list includes the vacancy request title;
4. the task list includes `create_internal_shortlist_draft`;
5. the task list shows required permission `view_review_queue`;
6. `/verify/` workflow remains compatible and continues to protect sensitive candidate data.

Focused operator UI suite:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

API regression:

```text
npm run test:cpg-api
```

Result: 16 passed.

## 10. Controlled Boundaries

This slice does not:

1. create persisted task records;
2. create employer-facing candidate publication;
3. create or change `presented` employer status;
4. implement shortlist scoring;
5. expose restricted medical, family/contact or candidate contact fields;
6. replace the existing `/verify/` execution guards;
7. make employment decisions.

## 11. Next Step

Следующий этап: улучшить переход из `My tasks` к конкретной записи в `/verify/`.

Рекомендуемый следующий slice:

```text
CPG-DEMAND-020 - Team task deep links to operator workbench records
```

Цель следующего этапа:

1. передавать из `/team/` в `/verify/` тип записи и идентификатор;
2. автоматически раскрывать нужную queue/detail panel;
3. сохранить backend guard как единственный источник права на действие;
4. не создавать persisted task table;
5. не открывать employer-facing publication без отдельного approval step.

