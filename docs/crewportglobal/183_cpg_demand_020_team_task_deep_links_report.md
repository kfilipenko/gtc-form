# CPG-DEMAND-020 - Team Task Deep Links To Operator Workbench Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-019
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует этап CPG-DEMAND-020.

Цель этапа: сделать вычисленные задачи в `/team/` практически исполнимыми через прямой переход к нужному рабочему контексту в `/verify/`.

После CPG-DEMAND-019 пользователь уже видел `My tasks`, но ссылка открывала общий operator workbench. Теперь задача передает тип операции и идентификатор рабочей записи, а `/verify/` автоматически открывает соответствующую queue/detail область.

Этап не создает persisted task table, не меняет БД, не публикует кандидатов работодателю, не переводит заявки в `presented`, не добавляет scoring и не принимает employment decisions.

## 2. Что реализовано

Backend task payload теперь содержит:

```text
task_id
action_url
target_url
```

`action_url` и `target_url` включают query-параметры задачи:

```text
/verify/?task_operation=create_internal_shortlist_draft&queue_type=vacancy_request&queue_item_id={vacancy_request_id}
```

Для internal shortlist draft задач ссылка может использовать:

```text
/verify/?task_operation=approve_internal_shortlist&shortlist_draft_id={shortlist_draft_id}
```

`/team/` использует `target_url` как основной адрес перехода и сохраняет fallback на `action_url`.

## 3. Verify Deep-Link Behavior

`/verify/` теперь читает query-параметры:

```text
task_operation
queue_type
queue_item_id
record_type
record_id
shortlist_draft_id
```

После загрузки operator queue страница:

1. определяет целевой queue item;
2. переключает operator lane на подходящую группу (`reviewer` для demand workflow);
3. выставляет фильтр `Type` на целевой queue type;
4. подсвечивает целевую строку в таблице;
5. автоматически загружает detail panel;
6. показывает статус `Task target opened`;
7. оставляет выполнение операции под backend guard.

Для `vacancy_request` deep link открывает employer/vacancy detail и candidate-search panel.

Для `vacancy_application` deep link открывает protected application detail.

Для `shortlist_draft_id` deep link вызывает защищенный endpoint:

```text
GET /api/v1/operator/shortlist-drafts/{shortlist_draft_id}
```

и показывает internal shortlist draft summary, candidate guard summary and computed operations.

## 4. Named Session Fix

До этого slice `/verify/` уже умел отправлять named team/admin session в API headers, но начальная загрузка страницы запускалась только при наличии temporary operator token.

Теперь `/verify/` запускает queue loading, если есть:

```text
crewportglobal.operatorAccessToken
```

или named session:

```text
crewportglobal_team_session
crewportglobal_admin_session
```

Это нужно для корректного маршрута:

```text
/team/ -> My tasks -> /verify/?task_operation=...
```

без ручного ввода operator token.

## 5. Access And Guard Boundary

Deep link не является правом доступа.

Переход только передает целевой контекст. Все защищенные действия по-прежнему проверяются backend:

1. named session validity;
2. group membership;
3. required permission;
4. operation guard;
5. candidate/source-card/consent guard;
6. employer payload exclusion rules.

Если пользователь не имеет доступа, `/verify/` показывает обычный access denied state.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added stable `task_id` and deep-link `target_url` generation for computed team tasks. |
| `projects/crewportglobal/public/team/index.html` | Updated task links to use `target_url` before `action_url`. |
| `projects/crewportglobal/public/verify/index.html` | Added task query parsing, queue target matching, lane/filter auto-selection, target row highlight, shortlist draft detail loading and named-session initial queue load. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the review-team UI test to click a `/team/` task link and verify `/verify/` opens the target candidate-search context. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 183 and revision 1.63. |
| `docs/crewportglobal/183_cpg_demand_020_team_task_deep_links_report.md` | Added this report. |

## 7. Verification

Verification performed on GTC1.

### 7.1 Syntax Checks

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
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

### 7.2 Focused Team Deep-Link UI Check

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused check confirms:

1. `/team/` shows a computed task for the target vacancy;
2. the task link contains `task_operation=create_internal_shortlist_draft`;
3. the task link contains `queue_type=vacancy_request`;
4. the task link contains the exact `queue_item_id`;
5. clicking the task opens `/verify/?...`;
6. `/verify/` loads through named `review_team` session;
7. `/verify/` displays `Task target opened`;
8. the target candidate-search panel is open;
9. the no-side-effects boundary remains visible.

### 7.3 Focused Operator UI Suite

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 7.4 API Regression

```text
npm run test:cpg-api
```

Result: 16 passed.

## 8. Portal Verification Path

Проверка на портале:

```text
https://crewportglobal.com/team/
```

Порядок:

1. Войти в `/team/` через named team/admin session.
2. Пользователь должен состоять в `review_team`.
3. Для первого demand task нужен permission `view_review_queue`.
4. В блоке `My tasks` нажать `Open operator workbench`.
5. Откроется `/verify/?task_operation=...`.
6. `/verify/` автоматически откроет нужную запись и candidate-search panel.

## 9. Controlled Boundaries

This slice does not:

1. create persisted task records;
2. change database schema;
3. create employer-facing candidate publication;
4. create or change `presented` employer status;
5. implement shortlist scoring;
6. bypass backend access checks;
7. expose restricted medical, family/contact or candidate contact fields;
8. make employment decisions.

## 10. Next Step

Следующий этап: расширить `My tasks` до полного team workbench execution loop.

Рекомендуемый следующий slice:

```text
CPG-DEMAND-021 - Team workbench operation execution status and completion feedback
```

Цель следующего этапа:

1. после выполнения операции возвращать пользователя к `/team/`;
2. показывать, что задача исчезла или сменила следующий ответственный этап;
3. явно отображать следующую ответственную группу;
4. сохранить принцип computed tasks from current data;
5. не создавать persisted task table без отдельного решения Project Owner.

