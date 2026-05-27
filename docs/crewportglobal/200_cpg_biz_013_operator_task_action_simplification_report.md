# CPG-BIZ-013 - Operator Task Action Simplification Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: follow-up after CPG-BIZ-012 Project Owner approval
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчёт фиксирует первый практический шаг после утверждения CPG-BIZ-012.

Цель этапа: привести строку задачи в операторской очереди `/verify/` к модели одной главной вычисленной операции, чтобы исполнитель не видел одновременно конкурирующие действия:

```text
Open item
Start review
Needs correction
Mark reviewed
Request deletion
```

Теперь строка очереди показывает один основной вход в работу:

```text
Open review workspace
```

или, если пользователь пришёл по глубокой ссылке на конкретную вычисленную задачу, название этой вычисленной операции.

Результативные действия перенесены в рабочую область открытого объекта.

## 2. Реализованное поведение

### 2.1 Строка очереди

В таблице операторской очереди колонка `Actions` заменена на:

```text
Task
```

В строке теперь отображается одна основная кнопка:

```text
Open review workspace
```

В русской версии:

```text
Открыть рабочую область
```

Это означает внутреннюю рабочую область проверки, а не публичный или внешний просмотр.

### 2.2 Рабочая область объекта

После открытия объекта в детальной области появляется блок:

```text
Workspace actions
```

В этом блоке находятся действия, которые меняют результат проверки:

1. `Start review`.
2. `Needs correction`.
3. `Mark reviewed`.
4. `Request deletion` только для crew request / vacancy request.

Таким образом оператор сначала открывает объект, проверяет данные и только потом выбирает результат операции.

### 2.3 Сохранённые ограничения доступа

Существующая модель `operator_access.actions` сохранена.

Если действие недоступно текущей группе или роли, оно остаётся disabled уже внутри рабочей области.

В строке очереди не показываются disabled-действия, чтобы пользователь не считал их равноценными текущей задаче.

### 2.4 Сохранённые границы процесса

Этап не меняет:

1. backend API;
2. DB schema;
3. migrations;
4. workflow statuses;
5. audit event model;
6. approval guard;
7. employer-facing visibility;
8. shortlist / presentation business rules.

Это UI/task-flow simplification поверх уже существующих endpoint-ов.

## 3. Изменённые файлы

| File | Change |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Очередь `/verify/` показывает одну главную task-кнопку в строке; secondary/review outcome actions перенесены в `Workspace actions` внутри открытой рабочей области. Обновлены EN/RU подписи. |
| `tests/crewportglobal-operator-access-contract.spec.ts` | Тест доступа обновлён: проверяет отсутствие competing row actions и сохранение permission metadata/disabled state внутри workspace actions. |
| `tests/crewportglobal-operator-queue.spec.ts` | UI-тесты обновлены под новую модель: review decisions и deletion request выполняются из workspace, а строка очереди остаётся single-primary-operation. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 200. |
| `docs/crewportglobal/200_cpg_biz_013_operator_task_action_simplification_report.md` | Добавлен этот отчёт. |

## 4. Проверка

### 4.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 4.2 Frontend inline script syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 4.3 Operator access contract

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-access-contract.spec.ts
```

Result: 1 passed.

Проверено:

1. строка очереди больше не показывает `Start review`, `Needs correction`, `Mark reviewed`;
2. строка показывает `Open review workspace`;
3. permission metadata остаётся на действиях внутри workspace;
4. denied actions остаются disabled внутри workspace.

### 4.4 Focused candidate-search scenario

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

Первый параллельный запуск вместе с другим Playwright webServer был остановлен тестовым окружением из-за PostgreSQL preparation race:

```text
ERROR: tuple concurrently updated
```

После отдельного повтора сценарий прошёл успешно.

### 4.5 Focused operator UI suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

Проверено:

1. очередь загружается и помещается в workbench;
2. seafarer/company/vacancy review flows используют workspace actions;
3. vacancy application review flow использует workspace actions;
4. vacancy deletion request больше не конкурирует в строке очереди и доступен в рабочей области vacancy request;
5. candidate search, shortlist draft и approval guard boundaries не изменены.

## 5. Контроль generated artifacts

После Playwright запусков generated artifacts были очищены из working tree:

```text
playwright-report/
test-results/
```

Они не входят в итоговый набор изменений.

## 6. Результат этапа

Этап CPG-BIZ-013 завершён.

Операторская строка задачи теперь соответствует утверждённому принципу:

```text
одна строка = одна главная вычисленная операция
```

Результаты проверки и вторичные действия доступны только после открытия внутренней рабочей области объекта.

## 7. Следующий этап

Следующий логичный этап:

```text
CPG-BIZ-014 - Contextual review workspace labels and role-specific task wording
```

Цель следующего этапа:

1. заменить универсальные названия `Start review`, `Needs correction`, `Mark reviewed` на stage-specific labels внутри рабочей области;
2. показать исполнителю не просто действие, а ожидаемый результат этапа;
3. согласовать wording с BP-012/BP-013;
4. сохранить правило, что строка очереди показывает только одну главную computed operation.
