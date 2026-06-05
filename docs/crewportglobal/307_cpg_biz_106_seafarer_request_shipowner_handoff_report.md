# CPG-BIZ-106 - Отчет о handoff запроса моряка в задачи судовладельца

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: продолжение после CPG-BIZ-105
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено

## 1. Назначение

Этот этап завершает первый controlled handoff встречного запроса моряка в сторону судовладельца.

После CPG-BIZ-105 моряк может найти подходящую опубликованную вакансию и направить запрос на рассмотрение контракта. В CPG-BIZ-106 этот запрос теперь становится видимым судовладельцу как вычисляемая задача, но не обходит командную проверку и contract proposal guard.

## 2. Реализованный процесс

Новый вычисляемый маршрут:

```text
моряк нашел подходящую вакансию
-> моряк нажал Request contract consideration
-> создана / переиспользована vacancy_applications со статусом submitted_for_human_review
-> у судовладельца вычисляется задача Review incoming seafarer requests
-> /shipowners/candidates/ показывает safe incoming-request details
-> команда выполняет review
-> кандидат переходит в существующий presented-candidate workflow
-> только после employer decision proceed_with_candidate доступен guarded contract proposal
```

## 3. Что видит судовладелец

В личном кабинете:

```text
Action required: review incoming seafarer requests
Incoming requests: N
Open incoming requests
```

На странице:

```text
/shipowners/candidates/?draft_id={shipowner_draft_id}#incoming-requests
```

появляется блок:

```text
Incoming requests / Входящие запросы
```

В этом блоке отображаются только безопасные данные:

1. имя/безопасное отображаемое имя кандидата;
2. должность;
3. доступность;
4. summary статуса документов;
5. статус application;
6. заметка кандидата, если она была направлена;
7. пояснение, что contract proposal пока заблокирован до team review.

Контактные данные моряка в employer-facing блоке не отображаются.

## 4. Guard boundary

Запрос моряка не создает:

1. контракт;
2. статус трудоустройства;
3. счет или billing record;
4. автоматическое решение о найме;
5. unrestricted employer-facing candidate payload.

Кнопка `Propose contract` остается недоступной, пока:

1. команда не выполнит review;
2. application не перейдет в `presented`;
3. судовладелец не примет решение `proceed_with_candidate`;
4. contract workspace guard не подтвердит готовность источников и шаблонов.

## 5. Измененные файлы

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Endpoint `/api/v1/employer/candidate-selection` теперь возвращает `incoming_candidate_requests` и `incoming_request_count` по заявкам судовладельца. |
| `projects/crewportglobal/public/cabinet/index.html` | Добавлена вычисляемая задача судовладельца для входящих запросов моряков. |
| `projects/crewportglobal/public/shipowners/candidates/index.html` | Добавлен блок incoming requests и safe rendering до team review. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлена проверка задачи судовладельца и блока входящего запроса до review, затем перехода в presented flow. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен control 74. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | CF-08A уточнен как встречный поток с задачей судовладельца. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлено правило видимости shipowner incoming-request task. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | CPG-BIZ-106 отмечен как реализованный handoff. |

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

Проверка whitespace/diff:

```bash
git diff --check
```

Результат: passed.

End-to-end workflow:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Результат: 3 passed.

Проверка подтверждает:

1. моряк видит matching vacancy;
2. моряк направляет contract-consideration request;
3. у судовладельца появляется вычисляемая задача incoming request;
4. `/shipowners/candidates/` показывает safe incoming request без email моряка;
5. после team review кандидат переходит в existing presented-candidate workflow;
6. contract workspace остается доступен только через guarded employer decision flow.

## 7. Ссылки для визуального контроля

Основные страницы:

```text
https://crewportglobal.com/cabinet/
https://crewportglobal.com/shipowners/candidates/
https://crewportglobal.com/seafarers/job-search/
```

Для визуального контроля подготовлен демонстрационный incoming-request объект:

| Объект | Значение |
|---|---|
| Shipowner draft/user id | `1c2e6288-cce6-44f0-8412-150172d77d69` |
| Seafarer draft/user id | `2b4da86c-effc-49df-86c1-5c5319d07052` |
| Vacancy application id | `62008509-aa76-4a70-82a9-5600c656849c` |
| Vacancy request id | `c0569df9-2b31-437d-88cc-f520831212b1` |
| Application status | `submitted_for_human_review` |

Прямые ссылки:

```text
https://crewportglobal.com/cabinet/?draft_id=1c2e6288-cce6-44f0-8412-150172d77d69
https://crewportglobal.com/shipowners/candidates/?draft_id=1c2e6288-cce6-44f0-8412-150172d77d69#incoming-requests
https://crewportglobal.com/seafarers/job-search/?draft_id=2b4da86c-effc-49df-86c1-5c5319d07052
```

Контрольный API-запрос подтвердил:

```text
visibility_scope: shipowner_candidate_selection_and_incoming_requests
incoming_request_count: 1
candidate_selection_state: incoming_seafarer_requests_waiting_review
candidate_visibility_scope: employer_safe_incoming_request
seafarer_email: not present
```

## 8. Следующий этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-107 - Team review workspace for seafarer-initiated matching requests
```

Цель следующего этапа - сделать для команды отдельную понятную задачу обработки входящего запроса моряка с результатами:

1. release to presented candidate;
2. request correction / more evidence;
3. reject request with reason;
4. keep contract proposal locked until release.
