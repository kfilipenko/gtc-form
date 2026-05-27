# CPG-BIZ-021 - Отчет об исправлении deep link к рабочему объекту crew request

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner feedback after CPG-BIZ-020
- Source control: CPG-BIZ-012, BP-012, BP-013, CPG-BIZ-017
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Причина исправления

При проверке computed task links была выявлена ошибка в рабочем переходе:

```text
/verify/?queue_type=vacancy_request&queue_item_id=<vacancy_request_id>#review-workspace
```

Ожидаемое поведение:

1. открыть конкретную заявку судовладельца;
2. показать рабочее пространство по этой заявке;
3. дать исполнителю выполнить операцию, предусмотренную бизнес-процессом.

Фактическое поведение до исправления:

1. открывался общий список `/verify/`;
2. конкретная заявка не выделялась как единственный рабочий объект;
3. пользователь видел список, а не исполнимую операцию по выбранной задаче;
4. ссылка могла восприниматься как повторное открытие очереди, а не как переход к рабочему объекту.

Это противоречило утвержденному правилу BP-012/BP-013:

```text
task title + object summary = active link to exact internal working object
```

## 2. Root Cause

Причина была в двух местах:

1. frontend `/verify/` для `vacancy_request` использовал общий queue context и не загружал detail endpoint по точному `vacancy_request_id`;
2. backend не имел отдельного operator detail endpoint для точного просмотра `vacancy_request` из review queue;
3. при открытии deep link список оставался полным, поэтому рабочий объект терялся среди множества строк;
4. status update route для review queue опирался на legacy operator-token boundary и не был полностью согласован с team session permission model.

## 3. Исправленная логика

Deep link вида:

```text
/verify/?queue_type=vacancy_request&queue_item_id=<vacancy_request_id>#review-workspace
```

теперь выполняет рабочий переход:

1. распознает `queue_item_id` как точный `vacancy_request_id`;
2. фильтрует очередь до целевого объекта;
3. загружает detail payload по exact vacancy request endpoint;
4. рендерит `review-workspace`;
5. прокручивает страницу к рабочему пространству;
6. сохраняет operation permission boundary;
7. позволяет выполнять review operation только при наличии нужной группы и permission.

## 4. Backend Changes

Добавлен точный internal endpoint:

```text
GET /api/v1/operator/review-queue/vacancy-requests/{vacancy_request_id}
```

Endpoint:

1. доступен только через operator queue access contract;
2. проверяет доступ к `vacancy_request`;
3. возвращает безопасный detail payload для review workspace;
4. не создает employer-facing payload;
5. не меняет статус заявки при чтении.

Также уточнен route:

```text
PATCH /api/v1/operator/review-queue/{id}/status
```

Теперь для `queue_type=vacancy_request` он:

1. проверяет team session / operator access по требуемой операции;
2. обновляет именно тот `vacancy_request_id`, который передан в deep link;
3. не выбирает заявку косвенно по employer user/company;
4. записывает audit actor context с group/permission boundary;
5. сохраняет совместимость с legacy operator-token flow.

## 5. Frontend Changes

Изменен `/verify/`.

Для `vacancy_request`:

1. `queueTargetId()` теперь возвращает `queue_item_id`, а не `draft_id`;
2. direct task target фильтрует список до одного целевого объекта;
3. добавлена загрузка exact vacancy request detail;
4. после загрузки workspace выполняется scroll к `#review-workspace`;
5. click handler по task row показывает `Task target opened` только после успешной загрузки рабочего объекта.

Это делает ссылку исполнимой: пользователь не ищет объект в списке, а сразу попадает в рабочую область.

## 6. Проверенная матрица поведения

| Сценарий | Ожидаемый результат | Статус |
|---|---|---|
| Открыть `/verify/?queue_type=vacancy_request&queue_item_id=...#review-workspace` | Загружается конкретная crew request | Verified |
| Открыть ссылку из computed task | Queue фильтруется до целевой заявки | Verified |
| Рабочее пространство после перехода | Видно `review-workspace` и данные заявки | Verified |
| Candidate-search panel | Доступен из конкретного workspace | Verified |
| Sensitive candidate contact fields | Не отображаются | Verified |
| Queue action permission | Проверяется по group/session contract | Verified |
| Audit actor context | Сохраняет операцию, группу и permission boundary | Verified |

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added exact vacancy request review detail endpoint, exact vacancy request status update handling and team-session queue-decision permission checks. |
| `projects/crewportglobal/public/verify/index.html` | Added exact vacancy request detail loading, target-row filtering, vacancy request queue-item targeting and workspace scroll after deep-link open. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added direct deep-link verification for `vacancy_request` task target, workspace visibility and candidate-search availability. |
| `docs/crewportglobal/210_cpg_biz_021_vacancy_request_deep_link_workspace_fix_report.md` | Added this report. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 210. |

## 8. Verification

### 8.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Frontend Script Syntax

```bash
node inline script syntax check for:
projects/crewportglobal/public/verify/index.html
```

Result: checked 2 inline scripts.

### 8.3 Focused Deep-Link UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused check confirms:

1. direct `/verify/` deep link opens a concrete `vacancy_request`;
2. page status shows `Task target opened`;
3. `#review-workspace` contains the expected vacancy title;
4. candidate-search controls are visible from the concrete workspace;
5. workspace is scrolled into the visible viewport;
6. sensitive contact fields and broad document metadata remain hidden.

### 8.4 Focused Operator Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

### 8.5 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search"
```

Result: 1 passed.

## 9. Result

Этап CPG-BIZ-021 завершен.

Ссылка:

```text
/verify/?queue_type=vacancy_request&queue_item_id=<vacancy_request_id>#review-workspace
```

теперь открывает конкретный internal working object, а не общий список. Пользователь видит одну целевую заявку, рабочее пространство и исполнимую операцию в рамках утвержденного business-process task model.

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-022 - Continue computed task link audit for non-vacancy objects
```

Цель:

1. пройти ссылки для `vacancy_application`, `operator_shortlist_draft`, `vacancy_deletion_request`, seafarer/company review tasks;
2. проверить, что каждая ссылка открывает конкретный объект;
3. проверить, что операция исполнима только нужной группой;
4. перенести найденные несоответствия в код;
5. после успешной проверки уточнить BP-012/BP-013 только по реально проверенным процессам.
