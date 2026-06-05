# CPG-BIZ-104 - Переход задачи судовладельца от решения по кандидату к договору

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation and verification report
- Source task: continuation after CPG-BIZ-103
- Version: 1.0
- Date: 2026-06-05
- Status: Implemented and verified on local GTC1 test runtime

## 1. Цель

Цель этапа - уточнить вычисляемую задачу в личном кабинете судовладельца после просмотра представленных кандидатов.

До этого `/cabinet/` показывал судовладельцу общее действие:

```text
Action required: review presented candidates
```

Этого было достаточно для первого просмотра, но недостаточно после того, как судовладелец уже выбрал кандидата и процесс должен перейти к подготовке договора.

Этап CPG-BIZ-104 закрепляет последовательность:

```text
presented candidate
-> proceed with candidate
-> guarded contract proposal
-> contract workspace review
```

## 2. Реализованное правило вычисления задачи

Личный кабинет судовладельца теперь вычисляет следующую операцию по фактическому состоянию `candidate_selection` и `contract_operation`.

| Состояние данных | Видимая задача в кабинете | Рабочая ссылка |
|---|---|---|
| Есть presented candidate, решения еще нет | `Action required: review presented candidates` | `/shipowners/candidates/?draft_id=...` |
| Есть `proceed_with_candidate`, contract workspace еще не создан | `Action required: propose contract` | `/shipowners/candidates/?draft_id=...` |
| Contract workspace уже создан | `Action required: review contract workspace` | `/contracts/workspace/?workspace_id=...&draft_id=...` |

Это сохраняет принцип вычисляемой задачи:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

## 3. Поведение для судовладельца

### 3.1 До решения по кандидату

Если кандидат представлен судовладельцу, но решения еще нет, кабинет показывает:

```text
Action required: review presented candidates
Presented candidates: N
Open candidate selection
```

### 3.2 После решения `Proceed with candidate`

Если судовладелец выбрал кандидата, но договор еще не создан, кабинет показывает:

```text
Action required: propose contract
Candidates ready for contract proposal: N
Open contract proposal
```

Ссылка ведет в `/shipowners/candidates/`, где guard-логика `Propose contract` остается источником правды.

### 3.3 После создания contract workspace

Если contract workspace уже создан, кабинет показывает:

```text
Action required: review contract workspace
Contract workspaces: N
Open contract workspace
```

Ссылка ведет прямо в конкретное рабочее пространство договора.

## 4. Guard Boundary

Этот этап не создает новый обход guard-логики.

Личный кабинет:

1. не создает договор сам;
2. не меняет статус кандидата;
3. не публикует данные работодателю или моряку;
4. не делает автоматическое решение о трудоустройстве;
5. только показывает вычисленную следующую операцию и рабочую ссылку.

Создание contract workspace по-прежнему выполняется через существующий guarded endpoint на странице судовладельца.

## 5. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/public/cabinet/index.html` | Добавлены состояния `proposeContract` и `contractWorkspace` для вычисляемой задачи судовладельца; ссылка задачи теперь ведет либо в подбор кандидатов, либо в конкретный contract workspace. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Расширен workflow-тест: после `Proceed with candidate` проверяется задача `propose contract`, после `Propose contract` проверяется задача `review contract workspace`. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена запись документа 305. |
| `docs/crewportglobal/305_cpg_biz_104_shipowner_candidate_decision_contract_task_transition_report.md` | Добавлен этот отчет. |

## 6. Проверка

### 6.1 Синтаксис личного кабинета

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/cabinet/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result:

```text
checked 2 inline script(s)
```

### 6.2 Diff whitespace check

```bash
git diff --check
```

Result:

```text
passed
```

### 6.3 Focused workflow test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result:

```text
3 passed
```

Тест подтверждает:

1. судовладелец видит presented candidate;
2. после `Proceed with candidate` кабинет показывает `Action required: propose contract`;
3. ссылка `Open contract proposal` ведет в `/shipowners/candidates/?draft_id=...`;
4. после `Propose contract` кабинет показывает `Action required: review contract workspace`;
5. ссылка `Open contract workspace` ведет в конкретный `/contracts/workspace/?workspace_id=...&draft_id=...`;
6. существующий post-vacancy workflow сохраняет статус кандидата и ссылку на contract workspace после reload.

### 6.4 Navigation and workflow regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result:

```text
11 passed
```

Проверено, что новое состояние задачи в личном кабинете не ломает:

1. role-grouped navigation;
2. ссылки личного кабинета;
3. document-menu access;
4. compact functional page checks;
5. full post-vacancy and contract handoff workflow.

## 7. Ссылки для ручной проверки

### 7.1 Личный кабинет судовладельца

```text
https://crewportglobal.com/cabinet/?draft_id=9c33e748-cf2e-4b1b-8fa7-2daef52e1a67
```

### 7.2 Подбор кандидатов судовладельцем

```text
https://crewportglobal.com/shipowners/candidates/?draft_id=9c33e748-cf2e-4b1b-8fa7-2daef52e1a67
```

### 7.3 Рабочее пространство договора

После создания contract workspace ссылка появляется в личном кабинете автоматически:

```text
/contracts/workspace/?workspace_id={contract_workspace_id}&draft_id={shipowner_draft_id}
```

## 8. Вывод

Этап подтвержден.

Личный кабинет судовладельца теперь показывает не статичный общий prompt, а следующую исполнимую операцию в соответствии с бизнес-процессом:

1. сначала просмотр кандидатов;
2. затем предложение договора;
3. затем проверка рабочего пространства договора.

Это делает workflow ближе к целевой модели: судовладелец видит не список технических действий, а одну понятную следующую задачу.

## 9. Следующий этап

Следующий этап:

```text
CPG-BIZ-105 - Contract workspace embedded field editing and party-review readiness guard
```

Цель следующего этапа - перейти от просмотра contract workspace к контролируемому заполнению переменных условий договора и вычислению готовности к согласованию сторонами.
