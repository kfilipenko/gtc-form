# CPG-BIZ-027 - Уточнение главной операции и условия завершения в review workspace

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о проверке бизнес-процесса и приложения
- Исходный этап: продолжение после CPG-BIZ-026
- Версия: 1.0
- Дата: 2026-05-28
- Статус: Выполнено и проверено на GTC1

## 1. Цель

Этот отчет фиксирует следующий шаг после минимизации raw payload и вторичных действий в review workspace.

Цель этапа - сделать открытую рабочую область понятной для исполнителя: пользователь должен видеть, какую главную операцию он выполняет, к какому этапу бизнес-процесса она относится, какой объект проверяется, почему задача сейчас видима и при каком результате она исчезнет из очереди.

Проверка выполнена по утвержденной методике:

1. описать этап бизнес-процесса;
2. проверить работу приложения;
3. исправить выявленное несоответствие;
4. протестировать;
5. зафиксировать результат в документации;
6. перейти к следующему этапу только после подтверждения тестами.

## 2. Проверенный этап бизнес-процесса

| Этап | Рабочая область | Ответственная группа | Проверенный результат |
|---|---|---|---|
| CF-06 / CF-07 Seafarer supply readiness review | Seafarer profile workspace | `verification_team` | Workspace показывает `Current task`, главную операцию, этап, объект, причину видимости и условие завершения. |
| CF-02 / CF-03 Employer / company verification | Company verification workspace | `verification_team` | Workspace показывает, что задача относится к проверке работодателя / компании и видима до review outcome или correction route. |
| CF-04 Employer demand intake review | Vacancy request workspace | `review_team` | Workspace показывает, что задача относится к проверке заявки на экипаж и видима до готовности к request-supply matching. |
| Control exception - deletion confirmation | Deletion confirmation workspace | `owners` | Для manager confirmation workspace подготовлен тот же контекст задачи: операция, объект и условие завершения. |

## 3. Что изменено

В начале review workspace добавлен новый блок:

```text
Current task
```

В русском интерфейсе:

```text
Текущая задача
```

Блок показывает:

| Поле | Назначение |
|---|---|
| Primary operation / Главная операция | Название действия в соответствии с computed task и этапом бизнес-процесса. |
| Business process stage / Этап бизнес-процесса | Где находится объект в end-to-end crew formation process. |
| Working object / Объект работы | Безопасное краткое описание конкретного объекта. |
| Why this task is visible / Почему задача видима | Причина, по которой задача вычислена и показана пользователю. |
| Completion condition / Условие завершения | Что должно произойти, чтобы задача перестала быть активной в очереди. |

## 4. Матрица условий завершения

| Объект / операция | Условие завершения, отображаемое пользователю |
|---|---|
| Seafarer profile completeness | Видима до проверки готовности профиля и source cards, исправления или блокировки review guard. |
| Company verification | Видима до проверки полномочий работодателя, данных компании и связанного demand context либо отправки на исправление. |
| Crew request completeness | Видима до проверки полноты заявки на экипаж и вычисления следующей операции request-supply matching. |
| Candidate application review | Видима до утверждения, отклонения или блокировки approval guard для candidate presentation review. |
| Create internal shortlist draft | Видима до создания internal shortlist draft или блокировки candidate-search guard. |
| Approve internal shortlist | Видима до утверждения, отклонения или блокировки approval guard для внутреннего shortlist. |
| Create review applications | Видима до создания review-заявок кандидатов или блокировки guard. |
| Review candidate presentation | Видима до утверждения candidate presentation для employer-facing review или блокировки guard. |
| Deletion confirmation | Видима до подтверждения или отклонения удаления менеджером. |

## 5. Проверенное поведение

Проверка подтвердила:

1. список задач остается списком вычисленных операций;
2. ссылка из задачи открывает конкретный рабочий объект;
3. внутри workspace появляется верхний блок `Current task`;
4. блок не заменяет рабочие данные объекта, а объясняет операцию;
5. review outcomes и secondary actions остаются внутри disclosure;
6. технический raw/debug payload остается скрытым в обычном режиме;
7. sensitive candidate contacts и broad `document_metadata` не появляются в проверенном UI.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Добавлен блок `Current task` / `Текущая задача` в review workspace; добавлены тексты stage/object/visibility/completion condition; deletion review получил такой же task context. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлены проверки, что seafarer, company и vacancy workspace показывают главную операцию, этап бизнес-процесса и условие завершения. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Матрица проверенных controls дополнена строкой про primary operation and completion guidance. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Инструкции дополнены правилом: исполнитель читает `Current task` перед review outcome и secondary actions. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 216. |
| `docs/crewportglobal/216_cpg_biz_027_review_workspace_primary_operation_guidance_report.md` | Добавлен настоящий отчет. |

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

### 7.2 Focused workspace guidance check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API|operator vacancy detail runs read-only candidate search"
```

Результат:

```text
2 passed
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

Этап CPG-BIZ-027 завершен.

Теперь review workspace объясняет исполнителю не только данные объекта, но и саму задачу:

1. что нужно сделать;
2. на каком этапе бизнес-процесса находится объект;
3. почему задача отображается;
4. что считается завершением операции;
5. где находятся вторичные действия после проверки объекта.

## 9. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-028 - Review workspace object-specific completion feedback and post-action task transition check
```

Цель следующего этапа: после выполнения review outcome проверять, что пользователь получает понятный feedback о результате операции и видит, какая следующая computed task будет создана или почему текущая задача больше не отображается.
