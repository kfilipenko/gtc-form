# CPG-DEMAND-018 - Named Operator Access For Computed Operations Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-017
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует этап CPG-DEMAND-018.

Цель этапа: сделать следующий практический шаг после вычисленных операций CPG-DEMAND-017:

1. оставить принцип, что задачи вычисляются из текущих данных;
2. показать вычисленные операции на `/verify/`;
3. разрешить выполнение операций не только через временный operator token, но и через существующую named team/admin session;
4. связать выполнение операций с группой, ролью и permission;
5. передавать `actor_user_id` в operation/audit context, когда операция выполнена named user session.

Этап не создает отдельную persisted task table, не публикует кандидатов работодателю, не переводит заявки в `presented`, не добавляет matching score и не принимает employment decisions.

## 2. Что реализовано

Backend теперь поддерживает два режима доступа для operator workflow:

| Access mode | Назначение | Actor identity | Permission boundary |
|---|---|---|---|
| `temporary_operator_token` | Текущая совместимость `/verify/` | shared token, без named user | `temporary_operator_token_compatibility` |
| `team_admin_session` | Named user доступ через `/team/` / admin session | `actor_user_id` и email из session | `group_permission_check` |

Для named session backend проверяет:

1. активную admin/team session;
2. членство пользователя в рабочей группе;
3. наличие нужного permission code;
4. owner/admin override для управляющих групп.

## 3. Group And Permission Contract

Основная группа для demand shortlist workflow:

```text
target_group_code = review_team
target_role_code = reviewer
```

Операции и права:

| Computed operation | Required permission | Scope | Runtime effect |
|---|---|---|---|
| `create_internal_shortlist_draft` | `view_review_queue` | `queue` | Создать internal shortlist draft из candidate search |
| `approve_internal_shortlist` | `approve_candidate_presentation` | `queue` | Утвердить internal shortlist |
| `create_review_applications` | `start_human_review` | `queue` | Создать internal review applications |
| `review_candidate_presentation` | `approve_candidate_presentation` | `queue` | Подготовить review candidate presentation step |

Queue visibility также стала permission-filtered:

| Queue type | View permission | Named session behavior |
|---|---|---|
| `seafarer_profile` | `view_verification_queue` | Видно только пользователям с verification permission |
| `company_verification` | `view_verification_queue` | Видно только пользователям с verification permission |
| `vacancy_request` | `view_review_queue` | Видно `review_team` / `reviewer` |
| `vacancy_application` | `view_review_queue` | Видно `review_team` / `reviewer` |

## 4. Portal Access Order

Проверка на портале:

```text
https://crewportglobal.com/verify/
```

Текущий compatible route:

1. Открыть `/verify/`.
2. Ввести действующий `Operator access token`.
3. Работать с очередью и computed operations.

Named team route:

1. Открыть `/team/`.
2. Войти по email-code как пользователь, включенный в `review_team` или группу с owner/admin override.
3. Вернуться на `/verify/`.
4. `/verify/` использует сохраненную team/admin session из browser localStorage.
5. Backend проверяет session, группу и permission.
6. Вычисленные операции показываются и выполняются только при наличии нужного permission.

Для текущего demand shortlist workflow пользователь должен иметь:

```text
group = review_team
role = reviewer
permissions = view_review_queue, start_human_review, approve_candidate_presentation
```

## 5. API / UI Impact

| Surface | Change |
|---|---|
| `GET /api/v1/operator/review-queue` | Теперь принимает operator token или approved team/admin session; named session получает очередь, отфильтрованную по queue view permissions. |
| `GET /api/v1/operator/vacancies/{id}/candidate-search` | Теперь может работать по `review_team` session и возвращает `group_permission_check` в computed operation metadata. |
| `POST /api/v1/operator/vacancies/{id}/shortlist-drafts` | Сохраняет прежний guard; named session получает actor context с `actor_user_id`. |
| `PATCH /api/v1/operator/shortlist-drafts/{id}/approval` | Выполняется только при `approve_candidate_presentation` для named session. |
| `POST /api/v1/operator/shortlist-drafts/{id}/review-applications` | Выполняется только при `start_human_review` для named session. |
| `GET /api/v1/operator/review-queue/vacancy-applications/{id}` | Поддерживает named queue access and computed operation metadata. |
| `/verify/` | Берет operator token из sessionStorage или team/admin session из localStorage. |

## 6. Audit Result

Для material operations сохраняется actor-context:

```text
operator_shortlist_draft_created
operator_shortlist_internal_approval_recorded
operator_shortlist_review_applications_created
```

В `temporary_operator_token` режиме:

```text
actor_user_id = null
actor_label = temporary_operator_token
permission_boundary = temporary_operator_token_compatibility
```

В `team_admin_session` режиме:

```text
actor_user_id = named session user_id
actor_label = session email
permission_boundary = group_permission_check
```

Это закрывает требование фиксировать, кем выполнена операция, когда операция выполняется через named session. Shared token остается совместимостью и не подменяет персональную атрибуцию.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added named/team session access checks for operator review queue and computed operations, queue filtering by permissions, actor context propagation and preserved temporary-token compatibility. |
| `projects/crewportglobal/public/verify/index.html` | Added team/admin session Authorization support from localStorage and access-panel guidance. |
| `playwright.crewportglobal.config.ts` | Enabled access-control migration/env for UI verification of named team session behavior. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added review-team admin-session verification for queue filtering and computed operation permission metadata. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 181 and revision 1.61. |
| `docs/crewportglobal/181_cpg_demand_018_named_operator_access_for_computed_operations_report.md` | Added this report. |

## 8. Verification

Verification performed on GTC1:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```text
node inline script syntax check for projects/crewportglobal/public/verify/index.html
```

Result: checked 2 inline scripts.

```text
git diff --check
```

Result: passed.

Focused named-session UI check:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused check confirms:

1. a user with named `team_admin_session` and `review_team` membership can call `GET /api/v1/operator/review-queue`;
2. the queue response returns `access_model = team_admin_session` and the named `actor_user_id`;
3. queue rows are filtered to `vacancy_request` / `vacancy_application` for `view_review_queue`;
4. `GET /api/v1/operator/vacancies/{id}/candidate-search` returns computed operation metadata with `permission_boundary = group_permission_check`;
5. the required group/permission metadata remains `review_team` / `view_review_queue`;
6. temporary operator-token UI access still creates and approves internal shortlist drafts without exposing sensitive candidate contacts.

Focused operator UI suite:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

API regression:

```text
npm run test:cpg-api
```

Result: 16 passed.

## 9. Controlled Boundaries

This slice does not:

1. create employer-facing candidate publication;
2. create or change `presented` employer status;
3. implement shortlist scoring;
4. replace all older operator-token-only endpoints outside the demand shortlist workflow;
5. create a persisted task table;
6. expose restricted medical or family/contact fields.

## 10. Next Step

Следующий этап: вывести вычисленные операции в персональный или групповой рабочий кабинет команды.

План следующего этапа:

1. использовать тот же data-derived task principle;
2. показывать `Мои задачи` как вычисленный список по active session, group membership and permissions;
3. не хранить отдельный task source of truth;
4. добавить route для team workbench, где пользователь из `review_team` видит только операции, которые может выполнить;
5. оставить `/verify/` как рабочую поверхность оператора, но связать вход через `/team/` с рабочим кабинетом.

Этап CPG-DEMAND-018 считается законченным после прохождения проверок и подтверждения, что generated Playwright/test artifacts не остаются в working tree.
