# CPG-BIZ-026 - Минимизация raw payload и вторичных действий в review workspace

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о проверке бизнес-процесса и приложения
- Исходный этап: продолжение после CPG-BIZ-025
- Версия: 1.0
- Дата: 2026-05-28
- Статус: Выполнено и проверено на GTC1

## 1. Цель

Этот отчет фиксирует проверку внутренней review workspace после упрощения списка computed tasks.

Цель этапа - подтвердить, что после открытия конкретной задачи пользователь видит сначала бизнес-операцию, объект работы и безопасный контекст, а не технический raw payload и не набор конкурирующих действий.

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
| CF-02 / CF-03 Employer, authority and vessel context review | Company verification workspace | `verification_team` | Пользователь видит рабочий объект и контекст проверки; review outcomes раскрываются только внутри secondary disclosure. |
| CF-04 / CF-08 Crew request and request-supply preparation | Vacancy request workspace | `review_team` | Пользователь видит structured demand и candidate-search context; технический payload скрыт в обычном режиме. |
| CF-06 / CF-07 Seafarer supply intake and readiness review | Seafarer profile workspace | `verification_team` | Пользователь видит safe profile/readiness context; secondary actions не конкурируют с главной computed operation. |
| Control exception - deletion confirmation | Manager confirmation workspace | `owners` | Контролируемое действие остается внутри конкретного workspace и не подменяет список задач. |

## 3. Что изменено

### 3.1 Raw/debug payload

Raw API payload больше не отображается в обычном режиме review workspace.

В нормальном операторском режиме:

```text
Technical debug payload is hidden in normal review mode.
```

Служебный технический payload может быть открыт только через явный debug mode:

```text
?debug_payload=1
```

Это оставляет возможность диагностики, но не показывает обычному исполнителю технические поля, broad JSON, внутренние ключи и служебные структуры как часть бизнес-задачи.

### 3.2 Вторичные действия

Review outcomes и secondary actions перенесены в отдельный disclosure внутри рабочей области:

```text
Review outcomes and secondary actions
```

В русском интерфейсе:

```text
Результаты проверки и вторичные действия
```

Пользователь сначала видит computed operation, stage и object context. Итоговые действия по review открываются уже внутри workspace, после просмотра объекта.

## 4. Матрица data scope и UX

| Режим / элемент | Обычный исполнитель | Служебная диагностика | Результат |
|---|---|---|---|
| Queue list | Одна computed operation с активной ссылкой на объект | Не применяется | Список остается ориентированным на задачу, а не на набор кнопок. |
| Review workspace | Показывает объект, stage, safe summary и разрешенные рабочие блоки | Не применяется | Исполнитель понимает, с чем работает и почему задача видима. |
| Raw/debug payload | Скрыт | Доступен только при `debug_payload=1` | Технические структуры не отвлекают от бизнес-операции и не раскрываются по умолчанию. |
| Review outcomes | Скрыты в disclosure до открытия пользователем | Доступны в той же рабочей области | Secondary actions не конкурируют с главным действием. |
| Candidate contacts / broad metadata | Не отображаются | Не должны использоваться для обычной проверки | Сохранена граница data minimization. |

## 5. Найденное и устраненное расхождение

Первый полный прогон operator queue suite выявил test drift после переноса secondary actions в disclosure.

Причина:

```text
после изменения результата review workspace перерисовывался, disclosure закрывался, а тест пытался нажать вторичное действие без повторного раскрытия блока.
```

Исправление:

1. добавлен тестовый helper для открытия secondary actions disclosure;
2. тесты обновлены так, чтобы повторно раскрывать disclosure после rerender workspace;
3. тесты больше не ожидают raw payload в обычном режиме;
4. добавлены проверки, что raw/debug block скрыт по умолчанию и candidate contact / broad metadata не появляются в `details-json`.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Raw/debug payload скрыт по умолчанию; добавлен режим `debug_payload=1`; review outcomes и secondary actions перенесены в disclosure внутри workspace. |
| `tests/crewportglobal-operator-queue.spec.ts` | Обновлены проверки review workspace: secondary disclosure раскрывается перед выполнением review outcomes; raw payload не ожидается в обычном режиме; проверяется отсутствие candidate contact leakage. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | В матрицу проверенных этапов добавлен контроль internal review workspace service controls. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлена инструкция для исполнителей: сначала работать с task title/object context, secondary actions открывать только после проверки объекта. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 215. |
| `docs/crewportglobal/215_cpg_biz_026_review_workspace_payload_secondary_action_minimization_report.md` | Добавлен настоящий отчет. |

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

### 7.2 Focused drift check

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

Этап CPG-BIZ-026 завершен.

Подтверждено:

1. computed task list остается списком одной главной операции на объект;
2. review workspace открывает конкретный рабочий объект;
3. технический raw/debug payload скрыт в обычном режиме;
4. review outcomes и secondary actions не конкурируют с главной задачей;
5. candidate contacts и broad `document_metadata` не раскрываются в проверенном операторском UI;
6. тесты подтверждают, что операции по-прежнему выполнимы после переноса secondary actions в disclosure.

## 9. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-027 - Review workspace primary operation wording and completion-condition guidance
```

Цель следующего этапа: уточнить текст самой рабочей области так, чтобы в начале workspace было явно видно:

1. этап бизнес-процесса;
2. главный результат, который должен получить исполнитель;
3. условие, при котором задача исчезнет из очереди;
4. какие secondary actions допустимы только после проверки объекта.
