# CPG-BIZ-017 - Отчет о полном audit computed task links

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation / audit report
- Source task: continuation after CPG-BIZ-016
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап проверяет, что все основные computed task links открывают не общий список, а конкретный внутренний рабочий объект с исполнимой операцией или контролируемым blocker state.

Работа выполнена по утвержденному Project Owner циклу:

```text
1. Описали этап.
2. Проверили работу приложения.
3. При необходимости внесли исправления.
4. Протестировали.
5. Если тесты подтвердили соответствие - перешли к следующему этапу.
6. Если соответствия нет - повторяем этапы 2-5.
```

Этот порядок зафиксирован в BP-012 и BP-013 как обязательный способ подготовки бизнес-процессов и должностных инструкций.

## 2. Проверяемое правило

Computed task считается корректной только если:

1. название задачи и описание объекта являются активной ссылкой;
2. ссылка содержит конкретный идентификатор рабочего объекта;
3. ссылка содержит конкретную операцию, если операция выполняется в task panel;
4. открытое рабочее пространство показывает исполнимое действие или точный blocker;
5. после выполнения задачи список пересчитывается из текущих данных;
6. задача не ведет пользователя в общий список без выбранного объекта.

## 3. Audit matrix computed task links

| Computed operation | Expected working object | Required URL contract | Audit result |
|---|---|---|---|
| `create_internal_shortlist_draft` | Concrete request-supply comparison workspace | `/team/matching/?vacancy_request_id=<vacancy_request_id>` | Passed. Link opens concrete crew request, loads comparison and allows guarded internal draft creation. |
| `approve_internal_shortlist` | Concrete shortlist draft task panel | `/verify/?task_operation=approve_internal_shortlist&shortlist_draft_id=<id>` | Passed. Link opens internal shortlist approval panel and executes guarded approval. |
| `create_review_applications` | Concrete approved shortlist draft task panel | `/verify/?task_operation=create_review_applications&shortlist_draft_id=<id>` | Passed. Link opens review-application creation panel and executes guarded bridge operation. |
| `review_candidate_presentation` | Concrete vacancy application review panel | `/verify/?task_operation=review_candidate_presentation&queue_type=vacancy_application&queue_item_id=<id>` | Passed. Link opens candidate presentation review panel and executes human approval action. |
| `confirm_vacancy_deletion` | Concrete vacancy deletion manager confirmation panel | `/verify/?task_operation=confirm_vacancy_deletion&record_type=vacancy_deletion_request&record_id=<vacancy_request_id>` | Passed. Link opens deletion confirmation workspace with confirm/reject choices inside the workspace. |
| `reject_vacancy_deletion` | Same deletion confirmation workspace | Same record as `confirm_vacancy_deletion`; reject is a workspace outcome | Passed by workflow design. Reject is not a competing list task; it remains an outcome inside manager confirmation workspace. |
| Ordinary review queue task | Concrete review workspace row | `/verify/?queue_type=<queue_type>&queue_item_id=<queue_item_id>#review-workspace` | Passed in focused queue checks. Link title opens concrete review workspace; review outcomes stay inside workspace. |

## 4. What Was Added To Test Coverage

The Playwright suite now checks computed task URL contracts at payload level before clicking.

The new helper rejects task payloads that point only to:

```text
/verify/
/team/
```

without a concrete object identifier and expected operation.

The suite now checks URL contracts for:

1. deletion confirmation task;
2. candidate presentation review task;
3. create internal shortlist draft task;
4. approve internal shortlist task;
5. create candidate presentation review task.

## 5. Process Documentation Updated

The required describe / verify / correct / test / advance cycle was added to:

```text
docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
docs/crewportglobal/business_processes/00_business_process_register.md
```

This means future process work must not stop at writing a document. Each stage must be checked against the running application or explicitly reported as not verifiable.

## 6. Files Changed

| File | Change |
|---|---|
| `tests/crewportglobal-operator-queue.spec.ts` | Added computed task URL contract checks for the main task operations and preserved click-through execution checks. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added mandatory process-description and application-verification cycle. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added operational instruction that every process stage must be verified in the application and tested before completion. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Registered the verification cycle as a core business-process control. |
| `docs/crewportglobal/206_cpg_biz_017_computed_task_link_audit_report.md` | Added this audit report. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 206. |

## 7. Verification

### 7.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 7.2 Frontend script syntax

```bash
node inline script syntax check for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/team/matching/index.html
projects/crewportglobal/public/verify/index.html
```

Result: passed.

### 7.3 Diff safety

```bash
git diff --check
```

Result: passed.

### 7.4 Focused operator/team UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

The suite confirms:

1. task payload links are concrete;
2. task-title links open the intended internal object;
3. workspace panels expose the executable operation;
4. completed operations recompute the task list;
5. sensitive candidate contact fields and broad document metadata remain excluded.

## 8. Result

Этап CPG-BIZ-017 завершен.

Основные computed task links проверены как payload contracts и как пользовательские click-through paths. Обнаруженный ранее дефект с переходом в общий список был закрыт в CPG-BIZ-016; на этом этапе добавлен системный audit-контроль, чтобы подобный дефект не вернулся.

## 9. Next Stage

Следующий этап:

```text
CPG-BIZ-018 - Role-based task execution acceptance matrix
```

Цель следующего этапа - проверить не только направление ссылок, но и исполнение задач по группам:

1. какая группа видит задачу;
2. какая группа может выполнить операцию;
3. какая группа должна видеть blocker / access denied;
4. какие операции доступны назначенному сотруднику;
5. какие операции остаются manager/control-only.
