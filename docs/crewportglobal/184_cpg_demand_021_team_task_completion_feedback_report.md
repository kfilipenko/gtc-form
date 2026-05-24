# CPG-DEMAND-021 - Team Task Completion Feedback And Recomputed Next Step Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-020
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Назначение

Этот отчёт фиксирует реализацию следующего шага после deep links из командного кабинета.

Цель этапа: после выполнения операции из `/team/` пользователь должен вернуться в командный кабинет и увидеть, что список задач пересчитан по текущим данным, а следующий ответственный этап отображается явно.

Принцип сохраняется:

```text
tasks are computed from current data state
```

В этом этапе не создавалась отдельная таблица задач, не добавлялись миграции, не менялась логика публикации кандидатов работодателю и не создавался employer-facing shortlist.

## 2. Что реализовано

### 2.1 Backend: завершённая задача больше не остаётся в списке

В backend добавлена проверка активного internal shortlist draft для vacancy request.

Если по `vacancy_request_id` уже существует активный internal draft со статусом:

```text
needs_review
approved_internal
```

то вычисляемая задача:

```text
create_internal_shortlist_draft
```

больше не возвращается в `/api/v1/team/workbench/tasks` для этой вакансии.

После создания draft следующая задача появляется из уже существующего shortlist workflow:

```text
approve_internal_shortlist
```

Ответственная группа:

```text
review_team
```

### 2.2 `/verify/`: возврат к командным задачам после операции

В candidate-search панели `/verify/` добавлена ссылка:

```text
Return to team tasks
```

Ссылка появляется после выполнения операции, если оператор пришёл из `/team/` по computed task deep link.

При успешном выполнении операции `/verify/` записывает короткий frontend-only feedback в `localStorage`:

```text
operation_code
result_status
next_responsible_group
task_target
shortlist_draft_id
```

Это не является persisted task state и не заменяет backend audit. Это только безопасная подсказка для пользователя при возврате в командный кабинет.

### 2.3 `/team/`: отображение результата и пересчитанного next step

После возврата в `/team/` командный кабинет:

1. загружает `/api/v1/team/workbench/tasks`;
2. показывает краткий feedback о выполненной операции;
3. сообщает, что список ниже пересчитан из текущего состояния данных;
4. показывает следующий computed task, если он доступен по правам пользователя.

Пример отображаемого результата:

```text
Operation completed: create_internal_shortlist_draft | result: needs_review | next group: review_team | Task list below is recomputed from current data.
```

После этого в списке задач по той же вакансии отображается:

```text
approve_internal_shortlist
```

а выполненная задача:

```text
create_internal_shortlist_draft
```

для этой vacancy request больше не отображается.

## 3. Access And Responsibility Boundary

Операции остаются доступными только через существующую модель доступа:

| Operation | Required group | Required permission | Где выполняется |
|---|---|---|---|
| `create_internal_shortlist_draft` | `review_team` | `view_review_queue` | `/verify/` candidate-search panel |
| `approve_internal_shortlist` | `review_team` | `approve_candidate_presentation` | existing shortlist approval workflow |
| `create_review_applications` | `review_team` | `start_human_review` | existing shortlist bridge workflow |
| `review_candidate_presentation` | `review_team` | `approve_candidate_presentation` | vacancy application review queue |

Командный кабинет не выдаёт права сам по себе. Он только показывает computed operations, которые текущий named user может видеть и выполнять согласно group/permission context.

## 4. Audit Boundary

Backend audit остаётся на уровне реальных операций:

```text
operator_shortlist_draft_created
operator_shortlist_internal_approval_recorded
operator_shortlist_review_applications_created
```

Frontend feedback в `/team/` не считается audit log. Он нужен только для UX-подтверждения после возврата из операции.

Операции продолжают записывать actor context через существующие named-session / operator-access механизмы.

## 5. No Employer-Facing Boundary

Этот этап не создаёт employer-facing visibility.

Не изменялись:

```text
presented status
employer shortlist publication
candidate exposure to employer
automatic matching score
employment decision
```

Internal shortlist остаётся внутренним объектом до отдельного контролируемого employer-presentation этапа.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added active shortlist-draft check for vacancy requests so completed `create_internal_shortlist_draft` tasks disappear from computed `/team/` tasks and the next shortlist workflow task can surface. |
| `projects/crewportglobal/public/verify/index.html` | Added return-to-team link and frontend-only operation feedback handoff for task-originated operations. |
| `projects/crewportglobal/public/team/index.html` | Added task completion feedback panel and current-data recomputation wording. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended focused operator/team workflow test to verify return to `/team/`, completion feedback and next computed task. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 184 to the documentation register. |
| `docs/crewportglobal/184_cpg_demand_021_team_task_completion_feedback_report.md` | Added this report. |

## 7. Verification

### 7.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result:

```text
passed
```

Embedded frontend script syntax was checked for:

```text
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/team/index.html
```

Result:

```text
passed
```

### 7.2 Focused UI Scenario

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result:

```text
1 passed
```

The focused scenario confirms:

1. `/team/` shows `create_internal_shortlist_draft` for a matching vacancy request.
2. The task deep link opens the exact vacancy in `/verify/`.
3. Candidate search runs from the task-originated `/verify/` context.
4. Internal shortlist draft is created with `Employer visible: false`.
5. `/verify/` shows `Return to team tasks`.
6. `/team/` shows operation feedback after return.
7. `/team/` no longer shows `create_internal_shortlist_draft` for the same vacancy.
8. `/team/` shows `approve_internal_shortlist` as the next computed task.

### 7.3 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result:

```text
3 passed
```

This confirms the new task-completion feedback does not break the existing operator queue, vacancy application review and candidate-search UI paths.

### 7.4 API Regression

```bash
npm run test:cpg-api
```

Result:

```text
16 passed
```

This confirms that the backend task recomputation change remains compatible with the existing registration, document, vacancy, candidate-search and operator-review API flows.

## 8. Remaining Controlled Gaps

1. `approve_internal_shortlist` task deep link opens the internal shortlist draft details, but a fuller task-specific execution panel for existing shortlist drafts can still be improved in a later slice.
2. Feedback is frontend-only and short-lived; this is intentional because operational tasks are still computed from current data, not persisted as task rows.
3. Employer-facing presentation remains a future controlled step after internal review.

## 9. Next Planned Step

Следующий этап:

```text
CPG-DEMAND-022 - task-specific operation execution panel for existing internal shortlist drafts
```

Цель следующего этапа: когда пользователь открывает `approve_internal_shortlist` или `create_review_applications` из `/team/`, `/verify/` должен показывать не только computed operation summary, но и явную кнопку выполнения именно этой операции с тем же access guard, audit actor context и return-to-team feedback.
