# CPG-DEMAND-017 - Computed Operation Visibility and Access Contract Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-016
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует этап CPG-DEMAND-017.

Главный принцип сохранен: операционные задачи не становятся отдельным источником истины. Они вычисляются из текущих данных:

```text
candidate search result
operator shortlist draft status
internal approval guard
review application guard
vacancy application status
candidate presentation approval guard
```

Этап добавляет отображение вычисленной операции и контракт доступа к ней:

```text
target_group_code
target_role_code
required_permission_code
scope
permission_boundary
actor_label
actor_user_id
```

## 2. Что реализовано

Добавлен backend-контракт вычисляемых workflow operations:

| Operation code | Когда вычисляется | Ответственная группа | Роль | Требуемое право |
|---|---|---|---|---|
| `create_internal_shortlist_draft` | После read-only candidate search, если есть кандидаты | `review_team` | `reviewer` | `view_review_queue` |
| `approve_internal_shortlist` | Для shortlist draft в состоянии `needs_review`, если internal guard готов | `review_team` | `reviewer` | `approve_candidate_presentation` |
| `create_review_applications` | После `approved_internal`, если bridge guard готов | `review_team` | `reviewer` | `start_human_review` |
| `review_candidate_presentation` | После создания review application или в application detail | `review_team` | `reviewer` | `approve_candidate_presentation` |

Каждая операция возвращается как вычисленная структура:

```text
operation_code
operation_status
is_visible
is_executable
computed_from
blockers
required_access
```

## 3. Access Boundary

Текущая рабочая совместимость сохранена:

```text
temporary_operator_token
```

Для временного operator token операции остаются разрешены, но response явно показывает:

```text
permission_boundary = temporary_operator_token_compatibility
```

Подготовлена граница для будущего named-user режима:

```text
team_admin_session
group_permission_check
```

Если операция вызывается через team/admin session, backend проверяет:

1. активную session;
2. наличие целевой группы или owner/admin override;
3. наличие требуемого permission code.

На этом этапе полноценная замена `/verify/` с token на named operator login не выполнялась.

## 4. UI Result

На `/verify/` теперь отображаются вычисленные операции в candidate-search / internal shortlist flow.

После internal approval оператор видит:

```text
Computed operation: Create internal review applications.
Group: review_team.
Permission: start_human_review.
Status: available.
```

После создания review application оператор видит:

```text
Computed operation: Review candidate presentation.
Group: review_team.
Permission: approve_candidate_presentation.
Status: available.
```

Это показывает, какая следующая операция возникла из данных и какая группа должна иметь право ее выполнить.

### 4.1 Portal Verification Route And Access Order

Проверять изменение можно на операторской странице:

```text
https://crewportglobal.com/verify/
```

Текущий runtime-порядок входа остается прежним:

1. Открыть `/verify/`.
2. Ввести действующий operator access token в поле `Operator access token`.
3. Открыть vacancy request.
4. Запустить candidate search.
5. Создать internal shortlist draft.
6. Выполнить internal approval.
7. Создать internal review applications.
8. Проверить блок `Computed operation`.

Contract-level доступ для выполнения операций должен принадлежать:

```text
target_group_code = review_team
target_role_code = reviewer
```

Минимальные permission codes по операциям:

```text
create_internal_shortlist_draft -> view_review_queue
approve_internal_shortlist -> approve_candidate_presentation
create_review_applications -> start_human_review
review_candidate_presentation -> approve_candidate_presentation
```

На этом этапе `/verify/` еще не переведен на named user login. Поэтому персональный порядок будущего входа должен быть реализован следующим этапом: пользователь входит через approved team/admin session, backend проверяет членство в `review_team` и требуемый permission, затем audit получает реальный `actor_user_id`.

## 5. Audit Result

Audit payload расширен actor-context для material operations:

```text
operator_shortlist_draft_created
operator_shortlist_internal_approval_recorded
operator_shortlist_review_applications_created
```

Actor-context содержит:

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

В текущем временном режиме `actor_user_id` остается `null`, а `actor_label` фиксируется как `temporary_operator_token`.

Ограничение зафиксировано явно: для персонального `кем выполнено` нужен следующий этап с named operator session на `/verify/`. Этот этап не подменяет персональную атрибуцию псевдо-именем.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added computed workflow operation contracts, temporary-token/team-session access boundary, actor-context audit enrichment and computed operations in candidate search, shortlist approval, review-application bridge and vacancy-application detail responses. |
| `projects/crewportglobal/public/verify/index.html` | Added computed operation rendering in the operator candidate-search and internal shortlist flow. |
| `tests/crewportglobal-registration-api.spec.ts` | Added assertions for operation access metadata on internal approval and review application bridge responses. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added UI assertions that computed operations, responsible group and required permissions are visible. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 180 and revision entry 1.60. |
| `docs/crewportglobal/180_cpg_demand_017_computed_operation_visibility_and_access_report.md` | Added this report. |

## 7. Verification

Verification performed on GTC1:

### 7.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Embedded Frontend Syntax

```bash
node inline script syntax check for projects/crewportglobal/public/verify/index.html
```

Result: checked 2 inline scripts.

### 7.3 Diff Whitespace Check

```bash
git diff --check
```

Result: passed.

### 7.4 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

The focused API check confirms:

1. internal shortlist approval response includes computed `create_review_applications`;
2. review application bridge response includes computed `review_candidate_presentation`;
3. each computed operation carries `review_team`, `reviewer` and the required permission;
4. temporary operator token compatibility is explicit in `permission_boundary`;
5. employer visibility remains false.

### 7.5 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused UI check confirms:

1. `/verify/` shows computed operation text after internal approval;
2. `/verify/` shows `review_team`;
3. `/verify/` shows `start_human_review` before review application creation;
4. `/verify/` shows `approve_candidate_presentation` after review application creation.

### 7.6 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 7.7 API Regression

```bash
npm run test:cpg-api
```

Result: 16 passed.

## 8. Controlled Boundaries

This slice does not:

1. create a separate persisted task table;
2. change employer-facing visibility;
3. move any candidate to `presented`;
4. create matching scores;
5. make employment decisions;
6. replace temporary `/verify/` token auth with named operator login.

## 9. Next Step

Следующий этап должен заменить временный operator token для `/verify/` на named operator access:

1. вход пользователя через утвержденную team/admin session;
2. членство в `review_team` или другой рабочей группе;
3. проверка permission на backend перед выполнением операции;
4. запись `actor_user_id` в audit payload и access audit;
5. отображение вычисленных операций в персональном кабинете группы, где `Мои задачи` остаются вычисляемыми из текущих данных.

Этап CPG-DEMAND-017 считается законченным после прохождения проверок, указанных в разделе 7.
