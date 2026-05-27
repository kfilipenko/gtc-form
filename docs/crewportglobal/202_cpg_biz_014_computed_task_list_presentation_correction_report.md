# CPG-BIZ-014 - Отчет об исправлении представления вычисленных задач

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: `201_cpg_biz_014_computed_task_list_presentation_correction_task.md`
- Source control: CPG-BIZ-012, BP-012, BP-013
- Version: 1.0
- Date: 2026-05-27
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап исправляет список задач оператора в `/verify/` в соответствии с утвержденным правилом CPG-BIZ-012:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

До исправления список выглядел как техническая очередь и показывал служебные поля, включая тип, роль, email, имя, статус, summary, время обновления и отдельную кнопку `Open review workspace`.

После исправления строка списка показывает одну главную вычисленную операцию. Название и описание задачи являются активной ссылкой на внутреннее рабочее пространство. Отдельная кнопка открытия больше не используется.

## 2. Что изменено

Измененная страница:

```text
/verify/
```

Список задач теперь использует четыре колонки:

| Колонка | Назначение |
|---|---|
| `#` | Порядковый номер задачи в текущем списке. |
| `Task` | Активная ссылка с названием этапа и кратким безопасным описанием объекта. |
| `Responsible` | Ответственная группа и требуемое право выполнения операции. |
| `State` | Краткое состояние выполнения или подсказка по следующему действию. |

Из списка убраны как отдельные колонки:

```text
Type
Role
Email
Name
Status
Summary
Updated
Actions / Open review workspace
```

Эти сведения остаются внутри открытого рабочего пространства, где они имеют контекст и не конкурируют с основной задачей.

## 3. Формат задачи

Формат строки приведен к утвержденному виду:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

Примеры вычисленных операций:

| Объект | Видимая задача |
|---|---|
| Профиль моряка | `Review seafarer profile completeness. (Seafarer profile: Second Officer.)` |
| Проверка компании | `Review company verification. (Company: Operator Search Marine.)` |
| Заявка на экипаж | `Review crew request completeness. (Crew request: Chief Officer for Bulk Carrier, join date 2026-08-15.)` |
| Отклик кандидата | `Review candidate application. (Candidate application: Chief Officer for crew request.)` |
| Запрос удаления | `Confirm deletion request. (Crew request: Chief Officer for Bulk Carrier, deletion requested.)` |

В русской локализации используется тот же принцип: название этапа и безопасное описание объекта открывают внутренний рабочий объект.

## 4. Граница рабочего пространства

Клик по названию или описанию задачи открывает внутренний блок проверки на этой же странице.

Внутри рабочего пространства остаются:

1. технический тип объекта;
2. разрешенные текущим scope контактные или служебные поля;
3. статус;
4. полная служебная сводка;
5. история проверки;
6. доступные outcome-действия;
7. запрос удаления;
8. raw API payload, если он разрешен текущей ролью.

Такой подход сохраняет необходимые данные для проверки, но не превращает список задач в техническую таблицу.

## 5. Права и исполнители

В строке задачи показываются:

1. ответственная группа;
2. требуемое право;
3. состояние операции.

Это сохраняет принцип, что задача отображается ответственному пользователю или группе по вычисленному состоянию объекта, а не как произвольный набор кнопок.

Фактическое разрешение на выполнение действий по-прежнему проверяется существующей логикой доступа внутри рабочего пространства.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Перестроен список задач `/verify/`: одна активная task-ссылка, четыре бизнес-колонки, служебные поля перенесены в рабочее пространство, добавлены EN/RU строки. |
| `tests/crewportglobal-operator-queue.spec.ts` | Обновлены проверки operator queue: список не показывает email, содержит computed task title, task title открывает workspace, действия остаются внутри workspace. |
| `tests/crewportglobal-operator-access-contract.spec.ts` | Обновлена access-contract проверка: список не показывает email, нет отдельной кнопки `Open review workspace`, активная ссылка открывает объект, permission behavior сохранен. |
| `docs/crewportglobal/201_cpg_biz_014_computed_task_list_presentation_correction_task.md` | Уточненная задача переведена в статус implemented and verified. |
| `docs/crewportglobal/202_cpg_biz_014_computed_task_list_presentation_correction_report.md` | Добавлен этот отчет. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлены документы 201 и 202. |

## 7. Проверка

### 7.1 Синтаксис встроенных frontend scripts

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

### 7.2 Focused operator queue check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 4 passed.

Проверено:

1. список показывает computed task title;
2. email не отображается в списке;
3. отдельная кнопка `Open review workspace` отсутствует;
4. task title является активной ссылкой;
5. workspace открывается корректно;
6. review actions остаются внутри workspace;
7. deletion confirmation panel остается доступной через рабочее пространство;
8. candidate-search flow продолжает работать без раскрытия чувствительных контактов.

### 7.3 Focused access contract check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-access-contract.spec.ts
```

Result: passed.

Проверено:

1. список не раскрывает email;
2. task row содержит бизнес-задачу и ответственную группу;
3. permission-denied действия остаются недоступными внутри workspace;
4. permission contract не расширен.

## 8. Контролируемые границы

Этот этап не меняет:

1. backend API;
2. базу данных;
3. миграции;
4. workflow statuses;
5. employer-facing publication;
6. automatic matching scoring;
7. employment decision logic;
8. billing/payment logic.

## 9. Следующий этап

Этап CPG-BIZ-014 завершен.

Следующий логичный этап:

```text
CPG-BIZ-015 - Team cabinet My Tasks and group queue alignment
```

Цель следующего этапа: применить тот же формат computed task к личному кабинету команды и групповым очередям, чтобы задача отображалась одинаково для менеджера, назначенного сотрудника и ответственной группы.
