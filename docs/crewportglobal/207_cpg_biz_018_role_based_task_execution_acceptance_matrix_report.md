# CPG-BIZ-018 - Отчет о role-based task execution acceptance matrix

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation / audit report
- Source task: continuation after CPG-BIZ-017
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап проверяет, что computed task не только ведет к конкретному рабочему объекту, но и исполняется только той группой и пользователем, которым разрешена операция.

Этап выполнялся по утвержденному циклу:

```text
1. Описали этап.
2. Проверили работу приложения.
3. При необходимости внесли исправления.
4. Протестировали.
5. Если тесты подтвердили соответствие - перешли к следующему этапу.
6. Если соответствия нет - повторяем этапы 2-5.
```

## 2. Проверяемое правило

Computed task считается принятой только если:

1. задача вычислена из текущих данных и результата предыдущего этапа;
2. задача показывает бизнес-этап и безопасное описание объекта;
3. задача имеет активную ссылку на конкретный рабочий объект;
4. задача содержит требуемую группу и permission;
5. backend возвращает тот же access contract;
6. пользователь без нужной группы/permission не видит или не может выполнить операцию;
7. manager/control-only операции не исполняются review-team.

## 3. Матрица приемки по группам и правам

| Этап процесса | Computed operation | Ответственная группа | Требуемое permission | Проверенное поведение |
|---|---|---|---|---|
| Request-supply matching and shortlist preparation | `create_internal_shortlist_draft` | `review_team` | `view_review_queue` | Review-team session видит задачу, открывает конкретный `/team/matching/?vacancy_request_id=...` и создает internal-only draft. |
| Internal shortlist approval | `approve_internal_shortlist` | `review_team` | `approve_candidate_presentation` | Review-team session видит задачу, открывает конкретную панель утверждения draft и утверждает internal draft без employer visibility. |
| Candidate presentation review preparation | `create_review_applications` | `review_team` | `start_human_review` | Review-team session видит задачу после internal approval и создает review applications из конкретного shortlist draft. |
| Employer-facing candidate presentation review | `review_candidate_presentation` | `review_team` | `approve_candidate_presentation` | Review-team session видит задачу, открывает конкретную vacancy application и выполняет human presentation review. |
| Controlled deletion confirmation | `confirm_vacancy_deletion` / `reject_vacancy_deletion` | `owners` | `approve_access_policy_change` | Owner/control session видит и выполняет manager confirmation panel; review-team session не получает эту задачу и получает `workflow_operation_permission_required` при прямом endpoint access. |

## 4. Проверенный backend access contract

Текущий backend source of truth:

```text
operator_workflow_operation_requirements()
```

Проверенные operation contracts:

| Operation | Backend target group | Backend required permission |
|---|---|---|
| `create_internal_shortlist_draft` | `review_team` | `view_review_queue` |
| `approve_internal_shortlist` | `review_team` | `approve_candidate_presentation` |
| `create_review_applications` | `review_team` | `start_human_review` |
| `review_candidate_presentation` | `review_team` | `approve_candidate_presentation` |
| `request_vacancy_deletion` | `review_team` | `approve_vacancy_request` |
| `confirm_vacancy_deletion` | `owners` | `approve_access_policy_change` |
| `reject_vacancy_deletion` | `owners` | `approve_access_policy_change` |

## 5. Что добавлено в тестовое покрытие

Focused Playwright suite теперь проверяет task access contracts на уровне payload и endpoint.

Added checks:

1. task payloads for shortlist and presentation operations contain expected `target_group_code`, `required_permission_code` and `allowed = true`;
2. owner deletion confirmation task contains `target_group_code = owners` and `required_permission_code = approve_access_policy_change`;
3. review-team session does not receive the manager deletion confirmation task in `/api/v1/team/workbench/tasks`;
4. review-team session receives `403 workflow_operation_permission_required` when trying to open or execute `/api/v1/operator/vacancy-requests/{id}/deletion-review`;
5. owner session can open and reject the deletion confirmation through the concrete task panel.

## 6. Обновленная документация бизнес-процессов

Проверенные правила ролей и доступа добавлены в:

```text
docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
docs/crewportglobal/business_processes/00_business_process_register.md
```

Это означает, что документы бизнес-процессов теперь разделяют:

1. review-team operational tasks;
2. owner/control-only confirmation tasks;
3. direct endpoint denial where the user has the wrong group or permission.

## 7. Измененные файлы

| Файл | Изменение |
|---|---|
| `tests/crewportglobal-operator-queue.spec.ts` | Added role/permission assertions for computed task payloads and negative access checks for review-team deletion confirmation access. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added verified role-based task execution acceptance matrix. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added verified role-based execution rules for users, team and AI agents. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added role-based execution verification as a core business-process control. |
| `docs/crewportglobal/207_cpg_biz_018_role_based_task_execution_acceptance_matrix_report.md` | Added this report. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 207. |

## 8. Проверка

### 8.1 Синтаксис backend

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

### 8.2 Синтаксис frontend script

```bash
node inline script syntax check for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/team/matching/index.html
projects/crewportglobal/public/verify/index.html
```

Результат: passed.

### 8.3 Проверка diff safety

```bash
git diff --check
```

Результат: passed.

### 8.4 Focused operator/team UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат: 4 passed.

Suite подтверждает:

1. review-team tasks expose and enforce the review-team permission contract;
2. owner/control deletion confirmation exposes and enforces the owner permission contract;
3. review-team cannot open or execute manager deletion confirmation directly;
4. task links remain concrete and executable;
5. employer visibility and sensitive-field exclusions remain protected.

## 9. Result

Этап CPG-BIZ-018 завершен.

Проверенные бизнес-процессы теперь описывают не только название и ссылку задачи, но и группу, permission и отрицательный доступ для ошибочной группы.

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-019 - Assignment-aware task visibility check
```

Цель следующего этапа - проверить и уточнить модель:

1. задача видна группе, если персональный исполнитель еще не назначен;
2. задача видна конкретному сотруднику, если клиент или объект уже закреплен за ним;
3. authorized manager/control user сохраняет контрольный доступ;
4. unrelated group membership не раскрывает чужие клиентские задачи при наличии более узкого назначения.
