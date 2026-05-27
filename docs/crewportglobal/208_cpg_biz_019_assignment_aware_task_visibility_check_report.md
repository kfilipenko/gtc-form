# CPG-BIZ-019 - Отчет о проверке assignment-aware task visibility

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation / audit report
- Source task: continuation after CPG-BIZ-018
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Verified current boundary; personal assignment implementation required next

## 1. Назначение этапа

Этот этап проверяет, соответствует ли текущее приложение требованию:

```text
Задача должна отображаться группе или конкретному сотруднику, если объект уже закреплен за ним.
```

Проверка проводилась по утвержденному циклу:

```text
1. Описали этап.
2. Проверили работу приложения.
3. При необходимости внесли исправления.
4. Протестировали.
5. Если тесты подтвердили соответствие - перешли к следующему этапу.
6. Если соответствия нет - повторяем этапы 2-5.
```

## 2. Проверенный факт

Текущее приложение подтверждает только group-queue модель.

API:

```text
GET /api/v1/team/workbench/tasks
```

возвращает:

```text
task_model = data_derived_current_state
persisted_task_table_created = false
```

Это означает:

1. задачи вычисляются из текущих данных;
2. задачи фильтруются по группе и permission;
3. задачи отображаются как `Assigned employee: group queue`;
4. persisted task assignment table пока не создана;
5. персональное закрепление сотрудника за задачей пока не является проверенной runtime-функцией.

## 3. Verified Matrix

| Проверяемое правило | Runtime result | Status |
|---|---|---|
| Задача вычисляется из текущего состояния данных | Confirmed through `/team/workbench/tasks` and focused Playwright suite | Passed |
| Задача видна группе, если user имеет нужный group/permission contract | Confirmed for `review_team` and `owners` operations | Passed |
| UI показывает, что персональный исполнитель не назначен | Confirmed by `Assigned employee: group queue` in `/team/` task cards | Passed |
| API содержит persisted task assignment table flag | Confirmed: `persisted_task_table_created = false` | Passed |
| Задача переносится из group queue в конкретного сотрудника после assignment | Not implemented in current slice | Controlled gap |
| Unrelated broad group membership скрывается при наличии более узкого assignment | Not verifiable until assignment table/API exists | Controlled gap |

## 4. Current Accepted Runtime Rule

На текущем этапе разрешенная модель:

```text
previous stage result + current object state + group/permission = visible group queue task
```

Пока не разрешено утверждать, что приложение выполняет полную формулу:

```text
previous stage result + current object state + role/permission + personal assignment = visible personal task
```

Такое утверждение станет допустимым только после отдельной DB/API/UI реализации assignment model.

## 5. What Was Added To Test Coverage

Focused Playwright suite теперь дополнительно проверяет:

1. `/api/v1/team/workbench/tasks` возвращает `persisted_task_table_created = false`;
2. computed task payload не содержит `context.assigned_user_label`, если персональное назначение не создано;
3. `/team/` отображает `Assigned employee: group queue` для проверенных задач;
4. group/permission checks из CPG-BIZ-018 сохраняются.

Проверенные task types:

1. `create_internal_shortlist_draft`;
2. `approve_internal_shortlist`;
3. `create_review_applications`;
4. `review_candidate_presentation`;
5. `confirm_vacancy_deletion`.

## 6. Business Process Documentation Updated

В BP-012 и BP-013 уточнено:

1. текущий проверенный уровень - group queue;
2. персональное assignment требует отдельного implementation slice;
3. до появления assignment table/API нельзя считать задачу персонально закрепленной;
4. `Assigned employee: group queue` является корректным отображением для текущей реализации.

## 7. Files Changed

| Файл | Изменение |
|---|---|
| `tests/crewportglobal-operator-queue.spec.ts` | Added assertions for group-queue task assignment boundary and `persisted_task_table_created = false`. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added verified assignment boundary note for current group-queue implementation. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added user/team instruction for group queue vs future personal assignment. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added current group-queue assignment boundary as a core control. |
| `docs/crewportglobal/208_cpg_biz_019_assignment_aware_task_visibility_check_report.md` | Added this report. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 208. |

## 8. Verification

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

### 8.2 Frontend script syntax

```bash
node inline script syntax check for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/team/matching/index.html
projects/crewportglobal/public/verify/index.html
```

Результат: passed.

### 8.3 Diff safety

```bash
git diff --check
```

Результат: passed.

### 8.4 Focused operator/team UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат: 4 passed.

## 9. Result

Этап CPG-BIZ-019 завершен как verification boundary.

Приложение соответствует group-queue части бизнес-процесса. Персональное закрепление сотрудника за задачей пока не реализовано и не должно описываться как работающее поведение.

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-020 - Personal task assignment model implementation plan
```

Цель следующего этапа:

1. определить минимальные additive DB records для assignment;
2. описать API contract для назначения задачи сотруднику;
3. определить manager/control rules для назначения и переназначения;
4. после утверждения реализовать assignment-aware task filtering;
5. протестировать переход задачи из group queue в `My tasks` конкретного сотрудника.
