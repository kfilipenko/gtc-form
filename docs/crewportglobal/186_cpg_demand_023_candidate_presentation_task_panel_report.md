# CPG-DEMAND-023 - Панель задачи подтверждения показа кандидата работодателю

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-022
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап закрывает следующий рабочий шаг после создания review application из внутреннего shortlist:

```text
review_candidate_presentation
```

Цель - дать пользователю из ответственной группы возможность выполнить вычисленную операцию из личного рабочего списка, открыть конкретную заявку кандидата в `/verify/`, пройти approval guard и только после этого перевести `vacancy_application` в статус `presented`.

Этап не добавляет автоматическое решение о найме, не реализует scoring, не создает новый shortlist и не публикует запрещенные поля в employer-facing payload.

## 2. Что реализовано

### 2.1 Backend endpoint

Добавлен защищенный операторский endpoint:

```text
PATCH /api/v1/operator/vacancy-applications/{vacancy_application_id}/presentation-review
```

Назначение endpoint:

1. Проверить право пользователя на выполнение операции `review_candidate_presentation`.
2. Повторно выполнить approval guard для конкретной `vacancy_application`.
3. При успешном guard перевести заявку в `presented`.
4. Зафиксировать actor context и approval audit.
5. Вернуть side-effect summary.

Endpoint принимает:

```json
{
  "note": "optional operator note"
}
```

Альтернативный ключ `operator_note` также поддерживается для совместимости.

### 2.2 UI panel

В `/verify/` добавлена task-specific панель для deep-linked задачи:

```text
task_operation=review_candidate_presentation
queue_type=vacancy_application
queue_item_id={vacancy_application_id}
```

Панель появляется только если пользователь открыл именно задачу `review_candidate_presentation` для соответствующей заявки.

Кнопка:

```text
Approve candidate presentation
```

вызывает новый backend endpoint. При успехе UI показывает:

```text
Candidate presentation approved: presented. Employer visible: true.
```

После выполнения операции `/verify/` записывает feedback для возврата в `/team/`.

## 3. Access и responsible group

| Operation | Responsible group | Role | Permission | UI entry | Backend endpoint |
|---|---|---|---|---|---|
| `review_candidate_presentation` | `review_team` | `reviewer` | `approve_candidate_presentation` | `/team/` -> task link -> `/verify/` | `PATCH /api/v1/operator/vacancy-applications/{id}/presentation-review` |

Пользователь должен войти как участник группы:

```text
review_team
```

Сценарий входа:

1. Открыть `/team/`.
2. Войти через team/admin session.
3. Убедиться, что у пользователя есть группа `review_team`.
4. В блоке `My tasks` открыть задачу `review_candidate_presentation`.
5. Ссылка откроет `/verify/` с параметрами задачи.
6. Выполнить операцию через `Approve candidate presentation`.
7. Вернуться в `/team/` по ссылке `Return to team tasks`.

Проверочные ссылки портала:

```text
https://crewportglobal.com/team/
https://crewportglobal.com/verify/
```

## 4. Approval guard

Перед переводом заявки в `presented` endpoint использует существующий guard:

```text
cpg_vacancy_application_approval_guard
```

Минимальные условия успешного перехода:

1. Company verification готова.
2. Vacancy опубликована или находится в разрешенном published state.
3. Candidate application находится в review-compatible state.
4. Требуемые consent events активны:
   - `matching_preparation`
   - `employer_sharing`
5. Нет unresolved required source-card corrections.
6. Employer payload probe не содержит forbidden fields.
7. Candidate search / presentation readiness не блокирует показ.

Если guard не проходит, endpoint возвращает:

```text
409 approval_guard_blocked
```

и не меняет состояние заявки.

Blocked response сохраняет side-effect boundary:

| Side effect | Blocked result |
|---|---|
| `changes_application_statuses` | `false` |
| `moves_applications_to_presented` | `false` |
| `presented_to_employer` | `false` |
| `employer_visible` | `false` |

## 5. Status transition

| Before | Operation | After | Employer visible |
|---|---|---|---:|
| `submitted_for_human_review` | `review_candidate_presentation` | `presented` | true |
| `in_review` | `review_candidate_presentation` | `presented` | true |
| blocked by approval guard | `review_candidate_presentation` | unchanged | false |

Переход выполняется только через task-specific endpoint. Generic review action не используется для named-session task execution.

## 6. Audit и actor context

Операция фиксируется в audit/history через существующий review decision path.

В audit payload теперь передается:

```text
actor_context
```

Для named session он включает:

1. user id;
2. user email;
3. active groups;
4. effective permissions;
5. operation code;
6. required group/permission context.

Approval guard snapshot также получает `approval_audit`:

```text
action: candidate_presentation_approved
operation_code: review_candidate_presentation
actor: named user or temporary operator token
reason: operator note
timestamp: UTC timestamp
```

Это закрывает требование фиксировать, кем выполнена операция.

## 7. Employer payload allow/deny proof

После успешного перехода employer-facing payload остается ограниченным.

Проверка тестами подтверждает, что employer candidate payload не содержит:

```text
candidate email
seafarer_email
contact_email
contact_phone
document_metadata
raw seafarer_workspace
restricted medical details
family / next-of-kin details
identity document numbers
raw uploaded document ids
```

Работодатель получает только разрешенную презентационную информацию и `document_summary`.

## 8. Page and API impact matrix

| Surface | Change | Access model | Side effect |
|---|---|---|---|
| `/team/` | Computed task `review_candidate_presentation` remains visible to authorized `review_team` users; after completion feedback is shown and task is recomputed away. | Named team/admin session with group permission. | No direct status change in `/team/`. |
| `/verify/` | Added task-specific panel for candidate presentation approval. | Named team/admin session or compatible operator access, checked by backend endpoint. | Calls PATCH endpoint. |
| `PATCH /api/v1/operator/vacancy-applications/{id}/presentation-review` | New guarded execution endpoint. | `approve_candidate_presentation` through `review_team` / `reviewer`. | Moves application to `presented` only after guard success. |
| Employer draft payload | No schema change; presented candidates become visible only after successful guard. | Employer-side read path. | Returns minimized candidate payload. |

## 9. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added guarded presentation-review endpoint, actor-context propagation into review audit and approval audit snapshot. |
| `projects/crewportglobal/public/verify/index.html` | Added task-specific `review_candidate_presentation` panel, endpoint call, guard failure rendering, success feedback and return-to-team feedback. |
| `tests/crewportglobal-registration-api.spec.ts` | Added API coverage for guarded transition to `presented` and employer payload allow-list after presentation. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added UI coverage for `/team/` task link, `/verify/` task panel execution, return feedback and task recomputation. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 186 to the documentation register. |
| `docs/crewportglobal/186_cpg_demand_023_candidate_presentation_task_panel_report.md` | Added this report. |

## 10. Verification

### 10.1 Syntax checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```bash
node inline script syntax check for:
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/team/index.html
```

Result: passed.

```bash
git diff --check
```

Result: passed.

### 10.2 Focused API check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

Confirmed:

1. Review application is initially internal review state.
2. New presentation-review endpoint moves it to `presented`.
3. Response confirms `moves_applications_to_presented: true`.
4. Response confirms `presented_to_employer: true`.
5. Employer payload after presentation excludes forbidden contact and broad metadata fields.

### 10.3 Focused UI check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders and reviews vacancy applications"
```

Result: 1 passed.

Confirmed:

1. `review_team` user sees computed task in `/team/`.
2. Task link opens exact `vacancy_application` in `/verify/`.
3. Task-specific panel is rendered.
4. Operator executes presentation approval.
5. UI shows `presented`.
6. Return-to-team feedback shows operation completion.
7. Task is recomputed away after completion.

### 10.4 Focused operator UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 10.5 API regression

```bash
npm run test:cpg-api
```

Result: 16 passed.

## 11. Remaining controlled gaps

1. Employer-side detailed candidate review page remains a later slice.
2. Employer shortlist decision after candidate presentation is not expanded in this slice.
3. Seafarer-side notification about employer presentation is not implemented in this slice.
4. Generic review queue actions still exist for compatibility; named task execution uses the new task-specific endpoint.

## 12. Next planned stage

Следующий этап:

```text
CPG-DEMAND-024 - Employer-side presented candidate review and response workflow
```

Рекомендуемая работа:

1. Показать работодателю presented candidates в отдельной task-aware области.
2. Сохранить employer-side decision:
   - interested;
   - request_more_info;
   - not_suitable;
   - shortlisted_by_employer.
3. Зафиксировать actor context работодателя.
4. Не раскрывать запрещенные поля.
5. Создать вычисляемую задачу для следующей ответственной группы после employer response.

Текущий этап CPG-DEMAND-023 завершен.
