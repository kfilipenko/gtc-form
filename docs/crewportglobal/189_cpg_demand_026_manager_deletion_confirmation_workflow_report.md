# CPG-DEMAND-026 - Manager confirmation workflow для удаления заявок

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-025
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап завершает контролируемый workflow удаления заявки.

До этого оператор мог нажать `Request deletion`, заявка скрывалась из обычной очереди и получала:

```text
demand_workspace.deletion_request.status = pending_manager_confirmation
manager_confirmation_status = pending
publication_status = closed
```

Но pending deletion не превращался в явную задачу менеджеру.

Теперь pending deletion становится вычисленной задачей для manager / project owner, открывается из `/team/` в `/verify/`, и менеджер может:

1. подтвердить удаление;
2. отклонить удаление и вернуть заявку в предыдущий workflow status.

Физическое удаление записи не выполняется.

## 2. Ролевая граница

Workflow разделен на два этапа.

| Этап | Operation code | Группа | Роль | Permission | Что делает |
|---|---|---|---|---|---|
| Запрос удаления | `request_vacancy_deletion` | `review_team` | `reviewer` | `approve_vacancy_request` | Скрывает заявку из обычной очереди и ставит pending manager confirmation. |
| Подтверждение удаления | `confirm_vacancy_deletion` | `owners` | `project_owner` | `approve_access_policy_change` | Подтверждает удаление как soft-closed state без physical delete. |
| Отклонение удаления | `reject_vacancy_deletion` | `owners` | `project_owner` | `approve_access_policy_change` | Отклоняет удаление и возвращает заявку в предыдущий статус. |

Это сохраняет separation of duties: тот же reviewer, который запросил удаление, не получает автоматическое право финального подтверждения.

## 3. Backend behavior

Добавлены два operation contract:

```text
confirm_vacancy_deletion
reject_vacancy_deletion
```

Добавлен endpoint:

```text
GET /api/v1/operator/vacancy-requests/{vacancy_request_id}/deletion-review
PATCH /api/v1/operator/vacancy-requests/{vacancy_request_id}/deletion-review
```

GET возвращает:

1. краткие сведения о заявке;
2. `deletion_request`;
3. computed operations `confirm_vacancy_deletion` и `reject_vacancy_deletion`;
4. actor/access context.

PATCH принимает:

```json
{
  "decision": "confirm",
  "note": "optional manager note"
}
```

или:

```json
{
  "decision": "reject",
  "note": "optional manager note"
}
```

## 4. Статусы после решения менеджера

### 4.1 Confirm

При `decision = confirm`:

```text
publication_status = closed
deletion_request.status = confirmed_deleted
deletion_request.manager_confirmation_status = confirmed
deletion_request.hidden_from_operator_queue = true
deletion_request.requires_manager_confirmation = false
deletion_request.physical_delete = false
```

Заявка остается закрытой и не возвращается в обычную operator queue.

### 4.2 Reject

При `decision = reject`:

```text
publication_status = deletion_request.previous_publication_status
deletion_request.status = rejected_by_manager
deletion_request.manager_confirmation_status = rejected
deletion_request.hidden_from_operator_queue = false
deletion_request.requires_manager_confirmation = false
deletion_request.physical_delete = false
```

Заявка возвращается в обычную review queue по предыдущему workflow status.

## 5. Computed task behavior

`/team/workbench/tasks` теперь дополнительно вычисляет задачи из:

```text
vacancy_requests.demand_workspace.deletion_request
```

Условие появления задачи:

```text
deletion_request.status = pending_manager_confirmation
deletion_request.manager_confirmation_status = pending
```

Задача имеет:

```text
task_type = vacancy_deletion_confirmation
operation_code = confirm_vacancy_deletion
record_type = vacancy_deletion_request
record_id = vacancy_request_id
target_url = /verify/?task_operation=confirm_vacancy_deletion&record_type=vacancy_deletion_request&record_id=...
```

Задача видима только пользователю, у которого есть доступ `owners / project_owner / approve_access_policy_change`.

## 6. UI behavior

### 6.1 `/team/`

Менеджер видит computed task:

```text
Confirm vacancy deletion
operation: confirm_vacancy_deletion
group: owners
permission: approve_access_policy_change
```

Ссылка открывает `/verify/` с deep link на конкретную pending deletion запись.

### 6.2 `/verify/`

Для `record_type=vacancy_deletion_request` добавлена панель:

```text
Vacancy deletion confirmation
Confirm deletion
Reject deletion
```

Панель показывает:

1. заявку;
2. компанию;
3. судно;
4. текущий deletion status;
5. кто запросил удаление;
6. причину удаления;
7. manager confirmation status.

После выполнения операции `/verify/` пишет feedback для `/team/`, и `/team/` пересчитывает задачи из текущих данных.

## 7. Audit behavior

Сохраняется audit trail:

| Event type | Когда пишется |
|---|---|
| `operator_vacancy_deletion_requested` | Reviewer запросил удаление заявки. |
| `manager_vacancy_deletion_confirmed` | Manager / Project Owner подтвердил удаление. |
| `manager_vacancy_deletion_rejected` | Manager / Project Owner отклонил удаление. |

Audit payload содержит:

1. `vacancy_request_id`;
2. previous/new status;
3. deletion request snapshot;
4. `actor_context`;
5. `actor_user_id`;
6. side effects;
7. подтверждение `physical_delete = false`.

## 8. Граница безопасности

Этот этап не делает physical delete.

Этот этап не создает candidate presentation, не меняет shortlist scoring, не публикует кандидатов и не раскрывает employer-facing payload.

Заявка скрывается из обычной operator queue только пока:

```text
deletion_request.status = pending_manager_confirmation
```

После reject она возвращается в предыдущий статус.

После confirm она остается закрытой.

## 9. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлены operation contracts, computed manager deletion tasks, deletion-review GET/PATCH endpoint, confirm/reject state transitions и audit events. |
| `projects/crewportglobal/public/verify/index.html` | Добавлен deep-link loader для `vacancy_deletion_request`, task panel с кнопками `Confirm deletion` / `Reject deletion`, feedback в `/team/`. |
| `tests/crewportglobal-registration-api.spec.ts` | Расширен API test: pending deletion task, deletion-review detail, reject restore, повторный request, confirm closed, manager audit actor. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлен UI test: owner видит task в `/team/`, открывает `/verify/`, отклоняет deletion request и получает feedback. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 189. |
| `docs/crewportglobal/189_cpg_demand_026_manager_deletion_confirmation_workflow_report.md` | Добавлен этот отчет. |

## 10. Проверка

### 10.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 10.2 Frontend syntax

```text
projects/crewportglobal/public/verify/index.html: checked 2 inline scripts
projects/crewportglobal/public/team/index.html: checked 1 inline script
```

Result: passed.

### 10.3 Focused API test

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator can request vacancy deletion"
```

Result: 1 passed.

Проверено:

1. reviewer запрашивает удаление;
2. заявка скрывается из обычной очереди;
3. owner получает computed task;
4. deletion-review detail показывает confirm/reject operations;
5. reject возвращает заявку в предыдущий статус;
6. повторный request deletion снова ставит pending;
7. confirm закрывает заявку без physical delete;
8. audit записывает manager actor.

### 10.4 Focused UI test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "owner team task opens pending vacancy deletion"
```

Result: 1 passed.

Проверено:

1. owner видит task в `/team/`;
2. task содержит `confirm_vacancy_deletion`;
3. deep link ведет в `/verify/`;
4. `/verify/` показывает кнопки `Confirm deletion` и `Reject deletion`;
5. reject записывает решение;
6. `/team/` показывает feedback `Operation completed: reject_vacancy_deletion`.

## 11. Как проверить на портале

1. Войти пользователем из группы `review_team`.
2. Открыть:

```text
https://crewportglobal.com/verify/
```

3. На строке заявки нажать:

```text
Удалить заявку / Request deletion
```

4. Войти пользователем из группы:

```text
owners
```

5. Открыть:

```text
https://crewportglobal.com/team/
```

6. Найти задачу:

```text
Confirm vacancy deletion
```

7. Открыть задачу и принять решение:

```text
Confirm deletion
Reject deletion
```

## 12. Итог этапа

Этап завершен.

Pending deletion больше не является невидимым промежуточным состоянием. Он превращается в явную manager task, а решение менеджера фиксируется в данных и audit.

Следующий этап: добавить отдельную сводку/фильтр для manager decisions по удалению, чтобы Project Owner видел историю подтвержденных и отклоненных удалений без просмотра raw JSON.
