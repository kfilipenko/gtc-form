# CPG-DEMAND-022 - Панель выполнения вычисленной операции по shortlist-задаче

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-021
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап закрывает следующий практический шаг после CPG-DEMAND-021: когда пользователь открывает вычисленную задачу из `/team/`, страница `/verify/` должна показывать не только запись, но и конкретную панель выполнения операции для текущего объекта.

Фокус этапа:

1. `approve_internal_shortlist` для существующего `operator_shortlist_draft`.
2. `create_review_applications` для уже internally approved shortlist draft.
3. Сохранение принципа: задачи не хранятся как отдельная таблица, а вычисляются из текущих данных.
4. Выполнение операции возможно только при наличии нужной групповой принадлежности, роли и permission.

Этап не публикует кандидатов работодателю, не переводит заявки в `presented`, не меняет matching/scoring logic и не добавляет миграции БД.

## 2. Что реализовано

### 2.1 `/verify/` task-specific panel

Если `/team/` открывает `/verify/` с параметрами:

```text
queue_type=operator_shortlist_draft
queue_item_id=<shortlist_draft_id>
task_operation=approve_internal_shortlist
```

или:

```text
queue_type=operator_shortlist_draft
queue_item_id=<shortlist_draft_id>
task_operation=create_review_applications
```

то `/verify/` теперь добавляет отдельную панель:

```text
Task action
```

Панель показывает:

1. выбранную вычисленную операцию;
2. доступность операции по backend `computed_operations`;
3. blocker codes, если операция недоступна;
4. кнопку выполнения операции, если доступ разрешен;
5. результат выполнения;
6. ссылку `Return to team tasks`.

### 2.2 Выполнение `approve_internal_shortlist`

Кнопка вызывает существующий защищенный endpoint:

```text
PATCH /api/v1/operator/shortlist-drafts/{shortlist_draft_id}/approval
```

Тело запроса:

```json
{
  "decision": "approve_internal"
}
```

Backend остается источником истины:

1. проверяет доступ;
2. проверяет internal approval guard;
3. фиксирует actor context в audit;
4. меняет только internal status draft;
5. не создает employer-facing payload.

После успеха `/verify/` записывает feedback для `/team/`:

```text
Operation completed: approve_internal_shortlist
result: approved_internal
next group: review_team
```

### 2.3 Выполнение `create_review_applications`

Кнопка вызывает существующий защищенный endpoint:

```text
POST /api/v1/operator/shortlist-drafts/{shortlist_draft_id}/review-applications
```

Backend остается источником истины:

1. проверяет, что shortlist draft approved internally;
2. проверяет guard staging;
3. создает или переиспользует internal review applications;
4. выставляет статус `submitted_for_human_review`;
5. не переводит application в `presented`;
6. не открывает кандидата работодателю.

После успеха `/verify/` записывает feedback для `/team/`:

```text
Operation completed: create_review_applications
result: submitted_for_human_review
next group: review_team
```

### 2.4 Фильтрация computed tasks на `/team/`

`/team/` теперь не показывает операции, которые уже не executable:

```text
operation_status != available
is_executable != true
```

Это важно для текущей модели:

1. после создания active internal shortlist draft задача `create_internal_shortlist_draft` исчезает;
2. после internal approval появляется следующая executable задача `create_review_applications`;
3. после staging review applications повторная задача `create_review_applications` исчезает;
4. `review_candidate_presentation` появляется только когда presentation guard действительно готов.

## 3. Матрица доступа

| Operation | Target group | Target role | Required permission | UI surface |
|---|---|---|---|---|
| `approve_internal_shortlist` | `review_team` | `reviewer` | `approve_candidate_presentation` | `/team/` -> `/verify/` |
| `create_review_applications` | `review_team` | `reviewer` | `start_human_review` | `/team/` -> `/verify/` |

Пользователь должен входить как named team/admin session, затем открывать:

```text
https://crewportglobal.com/team/
```

Далее порядок проверки:

1. Найти computed task по нужной vacancy / shortlist draft.
2. Открыть ссылку задачи.
3. Проверить, что `/verify/` открыл targeted object.
4. Выполнить действие в панели `Task action`.
5. Вернуться в `/team/`.
6. Проверить feedback и пересчитанный список задач.

## 4. Guard и no-employer-facing boundary

Этап сохраняет существующие guard boundaries:

| Boundary | Поведение |
|---|---|
| Employer visibility | Не создается. |
| Vacancy application status | `create_review_applications` создает или переиспользует только internal review application со статусом `submitted_for_human_review`. |
| Candidate presentation | Не выполняется. |
| Matching/scoring | Не меняется. |
| Sensitive fields | Candidate contact fields и broad document metadata не выводятся в candidate-search/task panel. |
| DB migration | Не требуется. |

Если операция заблокирована, `/verify/` показывает blocker codes из backend guard. UI не принимает самостоятельное решение о доступности операции.

## 5. Измененные файлы

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | `/team/` task builder теперь возвращает только executable computed operations; review-application guard получил blocker `review_applications_already_staged`, чтобы повторный staging не оставался доступной задачей. |
| `projects/crewportglobal/public/verify/index.html` | Добавлена task-specific панель для `approve_internal_shortlist` и `create_review_applications`, выполнение существующих protected endpoints, запись feedback для `/team/` и безопасный return link. |
| `tests/crewportglobal-operator-queue.spec.ts` | Расширен focused operator UI flow: task deep link -> create internal shortlist draft -> approve internal shortlist -> create review applications -> return feedback -> отсутствие повторной staging task. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 185. |
| `docs/crewportglobal/185_cpg_demand_022_task_specific_shortlist_operation_panel_report.md` | Добавлен этот отчет. |

## 6. Проверка на портале

Проверочные URL:

```text
https://crewportglobal.com/team/
https://crewportglobal.com/verify/
```

На момент проверки файлы live public root совпадают с repository public files для:

```text
/team/index.html
/verify/index.html
```

Для выполнения операций пользователь должен иметь named access с группой/ролью:

```text
group: review_team
role: reviewer
permissions:
  - view_review_queue
  - approve_candidate_presentation
  - start_human_review
```

## 7. Verification

### 7.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Frontend embedded script syntax

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of ['projects/crewportglobal/public/verify/index.html', 'projects/crewportglobal/public/team/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Result:

```text
projects/crewportglobal/public/verify/index.html: checked 2 inline script(s)
projects/crewportglobal/public/team/index.html: checked 1 inline script(s)
```

### 7.3 Diff check

```bash
git diff --check
```

Result: passed.

### 7.4 Focused failed-test rerun

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

### 7.5 Focused operator UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 7.6 API regression

```bash
npm run test:cpg-api
```

Result: 16 passed.

## 8. Controlled gaps

1. `review_candidate_presentation` пока не выполняется из task-specific panel в этом срезе.
2. Employer-facing publication по-прежнему не реализована.
3. Отдельная persisted task table не создавалась: список задач остается вычисляемым из текущего состояния данных.
4. Нет отдельной истории UI-переходов по task feedback, кроме текущего sessionStorage feedback после return to `/team/`.

## 9. Следующий этап

Следующий логичный этап: добавить task-specific панель для `review_candidate_presentation`, но только с жестким approval guard:

1. активный `employer_sharing` consent;
2. отсутствие unresolved source-card corrections;
3. employer payload allow-list check;
4. отсутствие restricted medical/family/contact data;
5. аудит actor user;
6. явное подтверждение перед созданием employer-facing visibility.

Текущий этап CPG-DEMAND-022 завершен.
