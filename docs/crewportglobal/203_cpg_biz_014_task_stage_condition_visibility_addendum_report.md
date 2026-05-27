# CPG-BIZ-014 - Дополнение: этап бизнес-процесса и причина видимости задачи

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation addendum report
- Source task: `201_cpg_biz_014_computed_task_list_presentation_correction_task.md`
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Причина уточнения

После первого исправления список задач `/verify/` уже показывал одну главную computed operation и убрал конкурирующие действия из строки.

Однако колонка `State` оставалась недостаточно информативной. Значения вроде:

```text
Ready for action
Waiting for correction
Completed/control record
```

не объясняли пользователю этап бизнес-процесса и причину, по которой задача вообще отображается в его очереди.

Для CrewPortGlobal это критично, потому что задача не является произвольной ручной записью. Она вычисляется из состояния объекта и видна только пока существует причина для выполнения операции.

## 2. Утвержденное правило

Правило CPG-BIZ-012 сохраняется:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

Поэтому строка задачи должна показывать:

1. какой этап бизнес-процесса сейчас активен;
2. почему задача видна;
3. до какого события задача будет оставаться в очереди;
4. что закрывает причину отображения задачи.

## 3. Что изменено

Колонка:

```text
State
```

заменена по смыслу на:

```text
Stage / condition
```

В русской локализации:

```text
Этап / причина
```

Каждая строка теперь показывает две смысловые строки:

```text
Stage: {business process stage}
Visible because / until: {computed visibility reason}
```

В русской версии:

```text
Этап: {этап бизнес-процесса}
Отображается, потому что / до: {причина видимости}
```

## 4. Матрица этапов

| Queue object / operation | Business process stage shown |
|---|---|
| `seafarer_profile` | Seafarer supply readiness review |
| `company_verification` | Employer / company verification |
| `vacancy_request` | Employer demand intake review |
| `vacancy_application` | Candidate application review |
| `create_internal_shortlist_draft` | Request-supply matching and shortlist preparation |
| `approve_internal_shortlist` | Internal shortlist approval |
| `create_review_applications` | Candidate presentation review preparation |
| `review_candidate_presentation` | Employer-facing candidate presentation review |
| `vacancy_deletion_request` / deletion operations | Controlled deletion confirmation |
| closed workflow records | Control record / closed workflow |

## 5. Матрица причин видимости

| Object state / status | Visibility condition shown |
|---|---|
| `submitted_for_human_review`, `submitted`, `pending_review` | Visible because submitted data requires a human review outcome. |
| `in_review` | Visible until the reviewer records the outcome. |
| `rejected`, `needs_correction`, `correction_requested` | Visible until correction is submitted and the blocker is resolved. |
| pending deletion confirmation | Visible until manager confirms or rejects the deletion request. |
| active computed operation from team deep link | Visible until this computed operation is completed or blocked by guard. |
| `reviewed`, `approved`, `published`, `presented`, `closed` | Shown by the current filter as a control record; no primary execution remains. |
| other status | Visible because workflow status is `{status}`. |

## 6. User-facing effect

The list now communicates:

1. the task is part of a defined business process;
2. the task is computed, not manually invented;
3. the user sees why the task is in the queue;
4. the user sees what event removes the task from the queue;
5. closed/control rows are clearly separated from active operations when the user selects broad filters like `All work`.

This directly supports the rule that a user should not manually count, interpret or guess tasks.

## 7. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Added process-stage and visibility-reason mapping for task rows; changed `State` column label to `Stage / condition`; added EN/RU text for process stages and computed visibility reasons. |
| `tests/crewportglobal-operator-access-contract.spec.ts` | Added assertions that queue rows show process stage and computed visibility reason. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added assertions for seafarer profile stage and visibility condition in the operator queue. |
| `docs/crewportglobal/203_cpg_biz_014_task_stage_condition_visibility_addendum_report.md` | Added this addendum report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 203 to the register. |

## 8. Verification

### 8.1 Frontend syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: passed, checked 2 inline scripts.

### 8.2 Diff safety

```bash
git diff --check
```

Result: passed.

### 8.3 Access contract test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-access-contract.spec.ts
```

Result: 1 passed.

### 8.4 Focused operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

## 9. Controlled boundaries

This addendum does not change:

1. backend API behavior;
2. database schema;
3. migrations;
4. workflow status transitions;
5. employer-facing publication;
6. automatic matching score;
7. employment decision logic;
8. billing/payment logic.

## 10. Next planned work

This correction completes the `/verify/` task-list presentation layer for the current stage.

The next planned work remains:

```text
CPG-BIZ-015 - Team cabinet My Tasks and group queue alignment
```

That stage should apply the same computed-task title, process-stage and visibility-condition model to `/team/`, so managers and assigned employees see the same logic outside the operator queue.
