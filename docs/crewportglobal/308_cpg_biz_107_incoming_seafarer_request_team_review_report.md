# CPG-BIZ-107 - Отчет о командной проверке входящего запроса моряка

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: продолжение после CPG-BIZ-106
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено

## 1. Назначение

Этот этап уточняет встречный поток, когда моряк сам нашел подходящую вакансию и направил запрос судовладельцу на рассмотрение контракта.

После CPG-BIZ-106 судовладелец видел safe incoming-request block. В CPG-BIZ-107 этот же объект теперь вычисляется как конкретная задача review team:

```text
Review incoming seafarer request
```

Задача открывает конкретный `vacancy_application`, а не общий список.

## 2. Бизнес-логика

Процесс теперь выглядит так:

```text
Seafarer job search
-> Request contract consideration
-> vacancy_applications.submitted_for_human_review
-> Shipowner sees safe incoming request
-> Review team sees Review incoming seafarer request
-> Team review outcome
   -> reviewed: application becomes presented
   -> needs_correction: application becomes rejected with reason / correction route
   -> rejected: application becomes rejected
-> Shipowner task recomputes from incoming request to presented candidate flow
```

Задача остается вычисляемой из текущих данных. Отдельная persisted task table не создавалась.

## 3. Реализованное поведение

| Состояние объекта | Вычисляемая задача | Исполнитель | Результат |
|---|---|---|---|
| `vacancy_applications.submitted_for_human_review` + `request_source=seafarer_initiated_request` | `Review incoming seafarer request` | `review_team` | Проверить и выпустить / отклонить / запросить исправление |
| Team review `reviewed` | Задача incoming исчезает | `review_team` | `application_status=presented` |
| `application_status=presented` | Shipowner sees presented candidate | Shipowner | Можно принять employer decision |
| Employer decision `proceed_with_candidate` | `Propose contract` | Shipowner | Contract workspace guard запускается отдельно |

## 4. Guard And Visibility Boundary

Этот этап не создает:

1. контракт;
2. трудоустройство;
3. счет;
4. employment status;
5. автоматическое решение о найме.

Контакты моряка не отображаются судовладельцу во входящем блоке. Employer-facing presentation остается data-minimized и появляется только после team review.

## 5. Измененные файлы

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен `request_source` для `vacancy_application`, уточнена computed operation context и team workbench task title для seafarer-initiated requests. |
| `projects/crewportglobal/public/verify/index.html` | Добавлены task title, process stage и completion condition для `Review incoming seafarer request`. |
| `projects/crewportglobal/public/team/index.html` | Team task list теперь показывает incoming seafarer request как отдельный бизнес-этап. |
| `projects/crewportglobal/public/cabinet/index.html` | Shipowner cabinet task link теперь ведет на конкретную заявку через `vacancy_request_id`, а не на общий список подбора. |
| `projects/crewportglobal/public/shipowners/candidates/index.html` | Страница подбора поддерживает deep link на конкретную заявку, обновляет выбранную заявку в URL и после review показывает empty incoming state / presented candidate flow. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлена проверка `request_source`, handoff operation и исчезновения incoming block после review. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен control 75. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | CF-08A уточнен как review-team release перед presented-candidate flow. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлены инструкции для review team по входящему запросу моряка. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | CPG-BIZ-107 отмечен как implemented stage. |

## 6. Проверка

Проверка PHP:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

Проверка inline JavaScript:

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  'projects/crewportglobal/public/verify/index.html',
  'projects/crewportglobal/public/team/index.html',
  'projects/crewportglobal/public/shipowners/candidates/index.html',
  'projects/crewportglobal/public/cabinet/index.html'
]) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Результат: passed.

Проверка diff:

```bash
git diff --check
```

Результат: passed.

End-to-end workflow:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy workspace saves"
```

Результат: passed.

Full focused workspace suite:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Результат: 3 passed.

Проверка подтверждает:

1. моряк направляет request contract consideration;
2. судовладелец видит входящий safe request;
3. cabinet task link содержит конкретный `vacancy_request_id`;
4. страница `/shipowners/candidates/` открывает конкретную заявку, а не общий список;
5. operator detail содержит `request_source=seafarer_initiated_request`;
6. computed operation содержит `review_handoff=release_incoming_request_to_presented_candidate`;
7. после team review incoming block исчезает;
8. кандидат появляется в presented-candidate flow;
9. email моряка не отображается судовладельцу.

Дополнительно был выполнен exploratory check:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Результат: failed на старой проверке очереди `tests/crewportglobal-operator-queue.spec.ts:1667`, где тест ожидал newly generated vacancy title в общей review queue. Ошибка возникла до CPG-BIZ-107 incoming-request ветки и не использовалась как acceptance check для этого этапа.

## 7. Ссылки для визуального контроля

Общие страницы:

```text
https://crewportglobal.com/team/
https://crewportglobal.com/verify/
https://crewportglobal.com/shipowners/candidates/
https://crewportglobal.com/cabinet/
```

Демонстрационный incoming объект из CPG-BIZ-106 остается доступным для визуальной проверки:

```text
https://crewportglobal.com/cabinet/?draft_id=1c2e6288-cce6-44f0-8412-150172d77d69
https://crewportglobal.com/shipowners/candidates/?draft_id=1c2e6288-cce6-44f0-8412-150172d77d69&vacancy_request_id=<vacancy_request_id>#incoming-requests
```

`vacancy_request_id` формируется из конкретной crew request. В рабочем маршруте cabinet task подставляет его автоматически.

## 8. Следующий этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-108 - Incoming request correction and rejection reason taxonomy
```

Цель следующего этапа:

1. формализовать причины correction / rejection для входящего запроса моряка;
2. показать моряку понятную задачу исправления, если team review не может выпустить запрос;
3. сохранить связь причины с конкретной вакансией и конкретным полем/документом;
4. не показывать судовладельцу лишние внутренние причины до approved presentation boundary.
