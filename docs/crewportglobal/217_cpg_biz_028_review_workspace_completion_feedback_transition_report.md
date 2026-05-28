# CPG-BIZ-028 - Object-specific completion feedback and task transition check

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о проверке бизнес-процесса и приложения
- Исходный этап: продолжение после CPG-BIZ-027
- Версия: 1.0
- Дата: 2026-05-28
- Статус: Выполнено и проверено на GTC1

## 1. Цель

Этот этап продолжает утвержденный цикл:

```text
описать этап -> проверить приложение -> исправить несоответствие -> протестировать -> зафиксировать результат -> перейти дальше
```

Цель CPG-BIZ-028 - проверить, что после выполнения review outcome в рабочей области пользователь получает понятный feedback:

1. какая операция была записана;
2. по какому объекту она выполнена;
3. какой результат зафиксирован;
4. почему список задач будет пересчитан;
5. какая следующая вычисленная задача ожидается, если она известна.

## 2. Проверенный этап бизнес-процесса

| Этап | Операция | Ответственная группа | Проверенный результат |
|---|---|---|---|
| CF-02 / CF-03 Employer authority and company verification | Company review outcome | `verification_team` | После `reviewed` workspace показывает operation result, object summary и return-to-team guidance. |
| CF-06 / CF-07 Seafarer supply readiness review | Source-card review | `verification_team` | После card review feedback сохраняет target card/status и поясняет, что нужно продолжить проверку required source cards. |
| CF-06 / CF-07 Seafarer supply readiness review | Needs correction | `verification_team` | После `needs_correction` workspace показывает recorded operation, result status и правило пересчета task list. |
| Control exception - deletion request | Request deletion | `review_team` | После запроса удаления feedback указывает, что следующая computed task - manager deletion confirmation для `owners`. |

## 3. Что изменено

В `/verify/` добавлен общий post-action feedback helper.

Теперь после review/card/deletion action workspace формирует текст по модели:

```text
Operation recorded: {operation}. Result: {result}.
Object: ({object type}: {safe object summary}.)
The task list is recomputed from the current object state.
Return to Team tasks to see the recalculated queue.
```

Для card review дополнительно выводится:

```text
Continue reviewing required source cards or return to Team tasks after blockers are resolved.
```

Для vacancy deletion request дополнительно выводится:

```text
Next computed task: manager deletion confirmation. Responsible group: owners.
```

## 4. Post-action feedback matrix

| User action | Old behavior | New behavior |
|---|---|---|
| Company verification marked reviewed | Был виден только saved status / latest note. | Feedback называет operation, object, result и возврат к пересчитанной team queue. |
| Source card marked under review | Был виден target card/status. | Target card/status сохранен, добавлено пояснение по продолжению source-card review. |
| Seafarer profile sent to correction | Был виден saved note/status. | Saved note сохранен, добавлено object-specific operation result и правило recomputation. |
| Vacancy deletion requested | Был виден общий текст deletion requested. | Текст сохранен, добавлено явное указание на manager confirmation task для `owners`. |

## 5. Сохраненные границы

Изменение не меняет:

1. backend/API behavior;
2. DB schema;
3. migrations;
4. approval guards;
5. visibility scopes;
6. employer-facing payload;
7. access-control decisions;
8. computed task source of truth.

Post-action feedback является UI-level пояснением для исполнителя. Состояние процесса продолжает определяться backend data, audit events, permissions and guards.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Добавлены post-action feedback translations/helper; review outcome, card review и deletion request теперь показывают объектный результат и правило пересчета задач. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлены assertions для company review, source-card review и seafarer correction feedback. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Verified matrix дополнена строкой про post-action completion feedback. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Review outcomes дополнены правилом: после действия исполнитель читает feedback и возвращается к team tasks, когда операция завершена или заблокирована. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Revision history дополнена записью о verified post-action completion feedback control. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 217. |
| `docs/crewportglobal/217_cpg_biz_028_review_workspace_completion_feedback_transition_report.md` | Добавлен настоящий отчет. |

## 7. Проверка

### 7.1 Embedded frontend syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Результат:

```text
checked 2 inline script(s)
```

### 7.2 Focused post-action feedback check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API"
```

Результат:

```text
1 passed
```

### 7.3 Полный operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат:

```text
4 passed
```

## 8. Итог этапа

Этап CPG-BIZ-028 завершен.

Теперь рабочая область не оставляет исполнителя в неопределенности после выполнения действия. Пользователь видит:

1. что именно записано;
2. к какому объекту относится результат;
3. что task list пересчитывается по текущему состоянию данных;
4. что нужно вернуться в team queue для проверки следующей вычисленной задачи;
5. что deletion request приводит к отдельной manager-confirmation задаче для `owners`.

## 9. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-029 - Team queue recomputation and completed-task disappearance check
```

Цель следующего этапа: проверить, что после выполнения review outcome соответствующая задача действительно исчезает из активной очереди или остается только как control/blocked record с понятной причиной, а следующая computed task видима правильной группе или назначенному исполнителю.
