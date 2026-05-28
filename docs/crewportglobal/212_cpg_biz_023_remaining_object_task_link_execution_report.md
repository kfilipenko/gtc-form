# CPG-BIZ-023 - Отчет о проверке ссылок вычисляемых задач по оставшимся объектам

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process verification and implementation report
- Source control: CPG-BIZ-012, BP-012, BP-013, CPG-BIZ-022
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Цель CPG-BIZ-023 - проверить оставшиеся вычисляемые задачи, которые отображаются в `/team/`, и подтвердить, что каждая задача ведет не в общий список, а в конкретный внутренний рабочий объект с исполнимой операцией.

Этап выполнен по утвержденной методике:

```text
1. Описали этап бизнес-процесса.
2. Проверили работу приложения.
3. При необходимости внесли исправления.
4. Протестировали.
5. Если тесты подтвердили соответствие - переходим к следующему этапу.
6. Если соответствия нет - повторяем этапы 2-5.
```

## 2. Проверенный участок бизнес-процесса

Проверялся участок между личным кабинетом команды и рабочими объектами проверки:

```text
Вычисленная задача в /team/
-> активная ссылка в названии задачи и описании объекта
-> конкретный /verify/ workspace
-> исполнимая операция в соответствии с группой и правом пользователя
-> audit actor context при выполнении решения
```

Проверенные объекты:

| Объект | Этап бизнес-процесса | Ответственная группа | Операция |
|---|---|---|---|
| Seafarer profile | Seafarer supply readiness review | `verification_team` | `review_seafarer_profile_completeness` |
| Company verification | Employer and authority setup | `verification_team` | `review_company_verification` |
| Vacancy deletion request | Controlled deletion confirmation | `owners` | `confirm_vacancy_deletion` / `reject_vacancy_deletion` |
| Vacancy request | Employer demand intake review / Request-supply matching | `review_team` | Existing reviewed operations remained covered |

## 3. Найденное несоответствие

Проверка показала реальный разрыв между описанным бизнес-процессом и приложением.

`/verify/` уже умел открывать и обрабатывать:

1. `seafarer_profile`;
2. `company_verification`;
3. `vacancy_request`;
4. `vacancy_application`.

Но `/api/v1/team/workbench/tasks` ранее не формировал отдельные задачи для:

1. проверки профиля моряка;
2. проверки компании / полномочий работодателя.

Также защищенный командный вход не считал `verification_team` допустимой группой для `/team/`. В результате участники verification-team могли иметь операционную ответственность, но не получали полноценно исполнимую задачу в командном кабинете.

## 4. Внесенное исправление

### 4.1 Backend task computation

Добавлены вычисляемые операции:

| Operation code | Target object | Group | Permission | Route |
|---|---|---|---|---|
| `review_seafarer_profile_completeness` | `seafarer_profile` | `verification_team` | `view_verification_queue` | `/verify/?task_operation=review_seafarer_profile_completeness&queue_type=seafarer_profile&queue_item_id=...` |
| `review_company_verification` | `company_verification` | `verification_team` | `view_verification_queue` | `/verify/?task_operation=review_company_verification&queue_type=company_verification&queue_item_id=...` |

Теперь `/team/workbench/tasks` вычисляет задачи для этих объектов из текущего состояния operator review queue.

### 4.2 Protected team access

`verification_team` добавлена в допустимые группы защищенного team workbench.

Это необходимо, потому что задача должна быть видима группе, которой поручена операция, и конкретному активному исполнителю, если он уже связан с объектом через историю выполнения аналогичной задачи.

### 4.3 UI labels and process stages

В `/team/` добавлены понятные названия:

| Operation | Task title | Process stage |
|---|---|---|
| `review_seafarer_profile_completeness` | `Review seafarer profile completeness.` | `Seafarer supply readiness review` |
| `review_company_verification` | `Review company verification.` | `Employer and authority setup` |

Задача остается ссылкой в названии и описании объекта. Отдельная кнопка `Open...` не возвращалась.

### 4.4 Audit actor context

Для решений по:

1. `seafarer_profile`;
2. `company_verification`;

добавлен `actor_context` в audit payload.

Это необходимо для дальнейшей персонализации задач по правилу:

```text
Если активный сотрудник группы уже выполнял аналогичную задачу по данному объекту,
следующая задача по этому объекту назначается ему.
Если такого исполнителя нет, задача идет в group queue.
```

## 5. Матрица проверки ссылок

| Source page | Task | Expected target | Verified result |
|---|---|---|---|
| `/team/` | `Review seafarer profile completeness.` | Exact `/verify/` workspace for selected seafarer profile | Verified: opens `Seafarer profile` workspace with workspace actions. |
| `/team/` | `Review company verification.` | Exact `/verify/` workspace for selected company verification object | Verified: opens `Company` workspace with workspace actions. |
| `/team/` | `Confirm deletion request.` | Exact `/verify/` deletion confirmation panel for selected vacancy request | Verified: owner/control task opens manager confirmation panel and records decision feedback. |
| `/team/` / `/verify/` | `Create internal shortlist draft.` | Exact `/team/matching/?vacancy_request_id=...` comparison workspace | Existing verified behavior remained intact. |
| `/verify/` | Vacancy request review task | Exact vacancy request row/workspace | Existing CPG-BIZ-021 behavior remained intact. |

## 6. Access and visibility matrix

| Operation | Visible to | Not visible to | Execution boundary |
|---|---|---|---|
| `review_seafarer_profile_completeness` | Active `verification_team` user with `view_verification_queue` | Users without verification queue permission | Opens internal `/verify/` workspace only. |
| `review_company_verification` | Active `verification_team` user with `view_verification_queue` | Users without verification queue permission | Opens internal `/verify/` workspace only. |
| `confirm_vacancy_deletion` | Owner/control user with `approve_access_policy_change` | `review_team` user | Manager confirmation only; review team receives 403. |
| `create_internal_shortlist_draft` | `review_team` user with review queue permission | Users without review queue permission | Opens internal matching workspace; no employer visibility. |

## 7. Performance observation

During verification the team workbench task payload in the current test database was large, about 5 MB, and `/team/workbench/tasks` could take about 15 seconds to return.

This did not block correctness, but it is a controlled usability/performance gap. The current tests now allow enough time for the existing computed model. A later optimization stage should add pagination, scope filtering or server-side `my_tasks` narrowing before production-scale use.

## 8. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added seafarer/company computed task generation for `/team/workbench/tasks`; added actor context for seafarer/company review audit events. |
| `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php` | Added `verification_team` as an allowed protected team-workbench group. |
| `projects/crewportglobal/public/team/index.html` | Added task titles, object labels and process-stage labels for seafarer profile and company verification tasks. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added API and UI assertions that `/team/` tasks open exact seafarer/company workspaces; adjusted long computed-list waits for current test dataset size. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 212 to the register. |
| `docs/crewportglobal/212_cpg_biz_023_remaining_object_task_link_execution_report.md` | Added this report. |

## 9. Verification

### 9.1 Syntax checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
```

Result: passed.

Embedded frontend scripts:

```text
projects/crewportglobal/public/team/index.html: checked 1 inline script
projects/crewportglobal/public/verify/index.html: checked 2 inline scripts
```

Result: passed.

### 9.2 Focused link checks

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API"
```

Result: 1 passed.

Confirmed:

1. `verification_team` can open `/team/`.
2. Seafarer profile task appears with correct title, stage, group and permission.
3. Seafarer profile task link opens exact `/verify/` workspace.
4. Company verification task appears with correct title, stage, group and permission.
5. Company verification task link opens exact `/verify/` workspace.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "owner team task opens pending vacancy deletion confirmation panel"
```

Result: 1 passed.

Confirmed:

1. Review-team cannot confirm manager deletion.
2. Owner/control task opens exact deletion confirmation panel.
3. Decision feedback returns to `/team/` after operation completion.

### 9.3 Focused operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

The suite confirms:

1. submitted queue tasks still render;
2. seafarer/company verification tasks deep-link to concrete workspaces;
3. owner deletion confirmation remains protected;
4. vacancy application review still works;
5. candidate search and internal shortlist task behavior remain intact.

## 10. Controlled gaps

| Gap | Status |
|---|---|
| `/team/workbench/tasks` payload size | Correct but heavy; later performance stage should add pagination/filtering. |
| Vessel-context task | Not yet separately generated as a computed task; to be checked in a later demand-side stage. |
| Full document/source-card workspace from team task | Still requires the next supply-side verification stage. |
| Employer-facing presentation final publication | Still guarded and intentionally not broadened in this stage. |

## 11. Next planned stage

Next stage:

```text
CPG-BIZ-024 - Supply-side task execution and data-scope verification
```

Planned work:

1. Verify seafarer supply intake tasks end to end.
2. Confirm exact profile/card/document context for review and correction.
3. Confirm restricted family, medical and contact fields remain scoped.
4. Confirm audit actor context supports active historical executor assignment.
5. Document what is fully verified and what remains a controlled gap.

## 12. Conclusion

CPG-BIZ-023 is complete.

The business-process description and the running application are now closer: verification-team tasks for seafarer profile and company verification are computed, visible to the correct group, linked to exact internal workspaces and covered by automated tests.
