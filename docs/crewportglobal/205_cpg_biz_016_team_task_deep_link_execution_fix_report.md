# CPG-BIZ-016 - Отчет об исправлении deep-link выполнения задач из `/team/`

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner feedback after CPG-BIZ-015
- Source control: CPG-BIZ-012, BP-012, BP-013, CPG-DEMAND-032, CPG-DEMAND-033
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Причина исправления

После приведения `/team/` к модели computed task была выявлена практическая проблема.

Задача:

```text
Create internal shortlist draft.
```

открывала:

```text
/verify/?queue_type=vacancy_request&queue_item_id=...#review-workspace
```

Вместо перехода к конкретной заявке судовладельца и рабочей операции пользователь попадал в общий список `/verify/`. Выполнить требуемое действие было сложно или невозможно, потому что задача должна вести к конкретному объекту работы, а не к общей очереди.

## 2. Утвержденная логика маршрута

Для операции `create_internal_shortlist_draft` правильным рабочим пространством является:

```text
/team/matching/?vacancy_request_id=<vacancy_request_id>
```

Причина:

1. именно `/team/matching/` показывает конкретную crew request;
2. именно там виден результат сравнения `crew request -> candidate supply`;
3. именно там оператор видит, почему кандидат подходит или блокируется;
4. именно там уже реализован controlled handoff к созданию internal shortlist draft;
5. backend approval guard остается источником истины при создании draft.

`/verify/` остается рабочим пространством для review queue, approval tasks, presentation review и deletion confirmation, но не должен быть первым переходом для задачи создания shortlist из crew request.

## 3. Что изменено

Backend task payload для `create_internal_shortlist_draft` теперь формирует `target_url` и `action_url` так:

```text
/team/matching/?vacancy_request_id=<vacancy_request_id>
```

В результате клик по задаче из `/team/`:

1. открывает конкретную заявку судовладельца;
2. автоматически запускает comparison для этой заявки;
3. показывает demand summary;
4. показывает matching-ready / blocked candidates;
5. показывает controlled shortlist handoff;
6. позволяет создать internal shortlist draft без потери approval guard.

## 4. Что не изменено

Этот этап не меняет:

1. DB schema;
2. DB migrations;
3. candidate-search algorithm;
4. approval guard rules;
5. employer-facing visibility;
6. vacancy application statuses;
7. employment decision logic.

Изменение ограничено маршрутизацией computed task link и тестовым покрытием этого маршрута.

## 5. Исправленная матрица ссылок

| Computed operation | До исправления | После исправления |
|---|---|---|
| `create_internal_shortlist_draft` | `/verify/?queue_type=vacancy_request&queue_item_id=...#review-workspace` | `/team/matching/?vacancy_request_id=...` |
| `approve_internal_shortlist` | `/verify/?shortlist_draft_id=...&task_operation=approve_internal_shortlist` | Без изменений |
| `create_review_applications` | `/verify/?shortlist_draft_id=...&task_operation=create_review_applications` | Без изменений |
| `review_candidate_presentation` | `/verify/?queue_type=vacancy_application&queue_item_id=...&task_operation=review_candidate_presentation` | Без изменений |
| `confirm_vacancy_deletion` | `/verify/?record_type=vacancy_deletion_request&record_id=...&task_operation=confirm_vacancy_deletion` | Без изменений |

## 6. Проверка клика по ссылке

Playwright test теперь проверяет не только наличие URL, а фактический пользовательский путь:

1. открыть `/team/` с team session;
2. найти задачу с crew request;
3. проверить ссылку задачи:

```text
/team/matching/?vacancy_request_id=<vacancy_request_id>
```

4. кликнуть по названию задачи;
5. убедиться, что открылась `/team/matching/`;
6. убедиться, что загружена конкретная заявка;
7. убедиться, что visible demand panel содержит нужный `vacancy_title`;
8. убедиться, что comparison loaded;
9. создать internal shortlist draft через существующий backend guard.

## 7. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Для `create_internal_shortlist_draft` task URL изменен на `/team/matching/?vacancy_request_id=...`. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлена проверка реального клика из `/team/` в `/team/matching/` и загрузки конкретной заявки перед созданием internal shortlist draft. |
| `docs/crewportglobal/205_cpg_biz_016_team_task_deep_link_execution_fix_report.md` | Добавлен этот отчет. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 205 в documentation register. |

## 8. Verification

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Frontend script syntax

```bash
node inline script syntax check for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/team/matching/index.html
projects/crewportglobal/public/verify/index.html
```

Result: passed.

### 8.3 Diff safety

```bash
git diff --check
```

Result: passed.

### 8.4 Focused link execution check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

### 8.5 Relevant operator/team suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

## 9. Итог этапа

Этап CPG-BIZ-016 завершен.

Задача `Create internal shortlist draft` теперь открывает не общий список, а конкретное рабочее пространство сравнения заявки и кандидатов:

```text
/team/matching/?vacancy_request_id=<vacancy_request_id>
```

После перехода оператор может увидеть конкретную заявку судовладельца, matching result, blockers и выполнить создание internal shortlist draft через существующий guarded endpoint.

## 10. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-017 - End-to-end task link audit for all computed operations
```

Цель следующего этапа - пройти все типы computed task links:

1. `create_internal_shortlist_draft`;
2. `approve_internal_shortlist`;
3. `create_review_applications`;
4. `review_candidate_presentation`;
5. `confirm_vacancy_deletion`;
6. `reject_vacancy_deletion`;
7. ordinary review queue tasks.

Для каждого типа нужно проверить:

1. ссылка ведет к конкретному объекту;
2. рабочее пространство открывает правильную операцию;
3. операция доступна пользователю с нужной группой/permission;
4. невозможно выполнить действие из неправильной группы;
5. после завершения задачи она исчезает или меняет computed next operation.
