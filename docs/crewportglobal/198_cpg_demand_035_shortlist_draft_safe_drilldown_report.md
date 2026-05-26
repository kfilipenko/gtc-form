# CPG-DEMAND-035 — Безопасный drill-down по internal shortlist draft

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Источник задачи: продолжение после CPG-DEMAND-034
- Версия: 1.0
- Дата: 2026-05-26
- Статус: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап добавляет безопасный drill-down по конкретному internal shortlist draft.

Команда должна видеть:

1. кто создал internal shortlist draft;
2. кто выполнил internal approval;
3. какие blockers были зафиксированы при создании draft;
4. какие blockers актуальны сейчас;
5. какие blockers resolved / new / unchanged;
6. какие computed operations доступны дальше.

Этап не раскрывает контакты кандидатов, `document_metadata`, медицинские сведения, паспортные сведения или employer-facing payload.

## 2. Backend/API

Расширен существующий protected endpoint:

```text
GET /api/v1/operator/shortlist-drafts/{shortlist_draft_id}
```

В ответ добавлен блок:

```text
drill_down
```

Drill-down содержит:

| Блок | Назначение |
|---|---|
| `created` | Время создания draft, actor context, audit marker. |
| `internal_approval` | Decision, previous/new status, actor context, audit marker. |
| `review_application_bridge` | Информация о staging review applications, если этап уже выполнен. |
| `creation_snapshot` | Demand readiness и счетчики кандидатов на момент создания. |
| `current_guards` | Текущий internal approval guard и review application guard. |
| `computed_operations` | Текущие вычисленные операции и blockers. |
| `candidates` | Safe candidate drill-down по созданным и текущим blockers. |
| `audit_events` | Сокращенная audit timeline без raw payload. |
| `privacy_boundary` | Подтверждение исключения контактов, document metadata и operator notes. |

## 3. Actor и audit linkage

Для `created by` используется:

```text
operator_shortlist_drafts.created_by_operator_context
```

Для `approved by` используется audit event:

```text
operator_shortlist_internal_approval_recorded
```

Для review-application bridge используется audit event:

```text
operator_shortlist_review_applications_created
```

Audit events читаются из:

```text
crewportglobal.registration_audit_events
```

по условию:

```text
event_payload->>'shortlist_draft_id' = {shortlist_draft_id}
```

В drill-down возвращается только safe actor summary:

```text
operation_code
access_model
actor_label
actor_user_id
target_group_code
target_role_code
required_permission_code
scope
permission_boundary
```

Raw audit payload не публикуется в UI.

## 4. Blocker matrix

Для каждого candidate row сравниваются:

| Состояние | Источник | Что показывается |
|---|---|---|
| Creation search blockers | `operator_shortlist_candidates.blocker_codes` | Список кодов blockers на момент создания draft. |
| Creation approval blockers | `operator_shortlist_candidates.approval_guard_result.approval_blockers` | Список guard blocker codes на момент создания draft. |
| Current search blockers | текущий `read_operator_vacancy_candidate_search()` | Список текущих search blocker codes. |
| Current approval blockers | текущий `cpg_operator_shortlist_candidate_guard()` | Список текущих guard blocker codes. |
| Delta | comparison created/current | `resolved_blockers`, `new_blockers`, `unchanged_blockers`. |

Если кандидат больше не присутствует в текущем search result, drill-down показывает:

```text
candidate_not_in_current_search_results
```

## 5. UI

Расширена защищенная страница:

```text
/team/shortlists/
```

В каждой карточке internal draft добавлена кнопка:

```text
View drill-down
```

При открытии карточка показывает:

1. `Created by`;
2. `Approved by`;
3. `Current guards`;
4. computed operations;
5. candidate-level creation blockers;
6. candidate-level current blockers;
7. resolved / new / unchanged blockers.

## 6. Privacy boundary

Drill-down не показывает:

1. candidate email;
2. `contact_email`;
3. `contact_phone`;
4. `document_metadata`;
5. raw seafarer workspace;
6. medical/family/identity details;
7. operator notes.

## 7. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен safe drill-down payload к existing detail endpoint. |
| `projects/crewportglobal/public/team/shortlists/index.html` | Добавлено раскрытие `View drill-down` по каждому shortlist draft. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлены проверки actor summaries, approval decision, blockers at/current и отсутствия sensitive fields. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 198. |
| `docs/crewportglobal/198_cpg_demand_035_shortlist_draft_safe_drilldown_report.md` | Добавлен этот отчет. |

## 8. Проверка

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

### 8.2 Frontend inline-script syntax

Проверен inline JavaScript страницы:

```text
projects/crewportglobal/public/team/shortlists/index.html
```

Результат:

```text
checked 1 inline script(s)
```

### 8.3 Focused operator drill-down check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Результат: 1 passed.

Проверка подтвердила:

1. internal shortlist draft создается из `/verify/`;
2. draft утверждается как `approved_internal`;
3. detail endpoint возвращает `drill_down.created`;
4. detail endpoint возвращает `drill_down.internal_approval`;
5. creation/current blockers видны в safe drill-down;
6. `/team/shortlists/` открывает `View drill-down`;
7. sensitive contact fields и raw `document_metadata` не выводятся.

### 8.4 Focused operator UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат: 4 passed.

### 8.5 Test assertion correction

Во время проверки была уточнена тестовая проверка privacy boundary.

Broad assertion по строке `document_metadata` заменен на точную проверку raw JSON field:

```text
"document_metadata":
```

Причина: безопасный флаг `candidate_document_metadata_excluded` является допустимым privacy marker и не означает публикацию raw `document_metadata`.

## 9. Следующий этап

Следующий логичный этап:

```text
Добавить shortlist draft comparison snapshot view:
- demand snapshot at draft creation;
- current demand state;
- structured requirement drift;
- explanation whether draft still represents the current crew request.
```

Этот этап должен остаться internal-only и не должен создавать employer-facing visibility.
