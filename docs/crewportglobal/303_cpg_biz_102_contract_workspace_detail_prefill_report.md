# CPG-BIZ-102 - Отчет о реализации detail view Contract Agreement Workspace

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: продолжение после CPG-BIZ-101
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено на GTC1

## 1. Цель этапа

Этап CPG-BIZ-102 реализует безопасный просмотр конкретного Contract Agreement Workspace после действия судовладельца:

```text
Подобрать кандидата -> Предложить контракт -> Открыть рабочее пространство договора
```

Цель этапа - показать сторонам и команде, какие сведения уже подтянуты из проверенных форм моряка, судовладельца, судна и заявки, а какие условия договора еще требуют выбора или согласования.

Этот этап не генерирует финальный договор, не подписывает договор, не меняет employment status, не создает посадку на судно и не создает счет.

## 2. Что реализовано

Добавлена защищенная страница:

```text
/contracts/workspace/
```

Пример маршрута:

```text
https://crewportglobal.com/contracts/workspace/?workspace_id={contract_workspace_id}&draft_id={draft_id}
```

Страница открывается из `/shipowners/candidates/` после создания или переиспользования Contract Agreement Workspace.

На странице отображаются:

1. номер workspace;
2. статус workspace;
3. источник шаблона договора;
4. проверенные сведения моряка;
5. проверенные сведения судовладельца;
6. проверенные сведения судна;
7. проверенная заявка / vacancy request;
8. embedded contract fields;
9. missing поля договора;
10. контекст пунктов master contract;
11. guard status;
12. подтверждение отсутствия side effects.

## 3. Источники автозаполнения

Поля договора заполняются source-first из уже существующих проверенных объектов.

| Contract field | Источник | Назначение |
|---|---|---|
| `C-1.1` Seafarer | `seafarer_profiles.first_name` | Имя моряка из заполненной анкеты. |
| `C-1.2` Seafarer rank | `seafarer_profiles.primary_rank` | Должность моряка. |
| `C-1.3` Seafarer department | `seafarer_profiles.department` | Департамент моряка. |
| `C-2.1` Shipowner / employer | `employer_companies.company_name` | Компания судовладельца. |
| `C-2.2` Company registration number | `employer_companies.registration_number` | Регистрационный номер компании. |
| `C-3.1` Vessel | `vessels.vessel_name` | Судно. |
| `C-3.2` Vessel type | `vessels.vessel_type_label / vessel_type` | Тип судна. |
| `C-3.3` Flag | `vessels.flag_country_code` | Флаг судна. |
| `C-4.1` Crew request | `vacancy_requests.vacancy_title` | Заявка / потребность в экипаже. |
| `C-4.2` Requested rank | `vacancy_requests.rank` | Запрошенная должность. |
| `C-5.1` Joining date | `vacancy_requests.join_date` | Дата посадки. |
| `C-5.2` Contract duration | `vacancy_requests.contract_duration` | Срок контракта. |
| `C-6.1` Salary range | `vacancy_requests.salary_min_usd / salary_max_usd / currency` | Диапазон оплаты. |
| `C-6.2` Currency | `vacancy_requests.currency` | Валюта. |
| `C-8.1` Joining travel responsibility | catalog choice | Требует выбора условия договора. |
| `C-9.1` Return / repatriation responsibility | catalog choice | Требует выбора условия договора. |

Если в `contract_embedded_field_values` уже есть сохраненное значение, оно имеет приоритет над расчетным отображением поля.

## 4. Backend/API

Добавлен endpoint:

```text
GET /api/v1/contract-workspaces/{contract_workspace_id}?draft_id={draft_id}
```

Endpoint:

1. проверяет UUID workspace;
2. проверяет `draft_id`;
3. разрешает доступ моряку только к workspace, связанному с его профилем;
4. разрешает доступ судовладельцу только к workspace его primary company;
5. читает Contract Agreement Workspace;
6. собирает verified facts из связанных source records;
7. собирает embedded fields;
8. читает party approvals;
9. читает master contract clauses;
10. возвращает guard status и blockers.

## 5. Guard And Side Effects

Текущий guard возвращает:

| Status | Meaning |
|---|---|
| `ready_for_party_review` | Все обязательные embedded fields заполнены. |
| `blocked_missing_embedded_fields` | Есть обязательные поля, которые еще требуют выбора или согласования. |

При наличии незаполненных полей возвращаются blockers:

```text
missing_required_field
```

Side effects остаются запрещенными:

```text
creates_generated_contract: false
creates_signature_request: false
changes_employment_status: false
creates_invoice: false
```

## 6. UI Handoff

Страница `/shipowners/candidates/` обновлена:

1. если workspace уже существует, кнопка открывает `/contracts/workspace/`;
2. если workspace создается через `Propose contract`, после успешного ответа выполняется переход на `/contracts/workspace/`;
3. route содержит `workspace_id` и `draft_id`;
4. пользователь видит конкретный рабочий объект договора, а не общий список.

## 7. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен access guard, detail builder и endpoint `GET /api/v1/contract-workspaces/{id}`. |
| `projects/crewportglobal/public/contracts/workspace/index.html` | Добавлена новая страница detail view Contract Agreement Workspace. |
| `projects/crewportglobal/public/shipowners/candidates/index.html` | Handoff обновлен: после `Propose contract` открывается конкретное workspace. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Тест расширен проверкой перехода в `/contracts/workspace/` и source-prefill данных. |
| `docs/crewportglobal/303_cpg_biz_102_contract_workspace_detail_prefill_report.md` | Добавлен этот отчет. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 303. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен контроль CPG-BIZ-102. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Contract Agreement Workspace отмечен как реализованный для detail view/source-prefill. |

## 8. Проверка

Выполнены проверки:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: синтаксис PHP корректен.

```bash
node - <<'NODE'
const fs = require('fs');
for (const htmlFile of [
  'projects/crewportglobal/public/contracts/workspace/index.html',
  'projects/crewportglobal/public/shipowners/candidates/index.html'
]) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
}
console.log('checked contract workspace and candidate-selection inline scripts');
NODE
```

Результат: frontend syntax корректен.

```bash
git diff --check
```

Результат: whitespace issues не обнаружены.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Результат: 3 passed.

Тест подтверждает:

1. форма `/post-vacancy/` продолжает работать;
2. безопасный candidate presentation сохраняется;
3. судовладелец может открыть `/shipowners/candidates/`;
4. `Propose contract` создает или переиспользует workspace;
5. открывается конкретная страница `/contracts/workspace/`;
6. verified source facts отображаются;
7. embedded fields отображаются;
8. email моряка не раскрывается;
9. финальный договор, подпись, employment status и invoice не создаются.

## 9. Соответствие бизнес-процессу

Этап закрывает переход:

```text
Shipowner candidate selection
-> Contract Agreement Workspace
```

Теперь созданное рабочее пространство договора не является скрытой записью БД: его можно открыть, проверить источники данных и увидеть недостающие условия договора до согласования сторонами.

## 10. Оставшиеся контролируемые ограничения

1. Embedded fields пока показываются read-only.
2. Выбор договорных альтернатив пока не сохраняется через UI.
3. Party approval не запускается.
4. Scripted contract generation не запускается.
5. Подписание договора не реализовано.

## 11. Следующий этап

Следующий этап:

```text
CPG-BIZ-103 - Contract workspace embedded field editing and party-review readiness guard
```

На нем следует:

1. включить сохранение договорных альтернатив `C-8.1`, `C-9.1` и других selectable fields;
2. показывать source fields как read-only verified facts;
3. разрешить party review только после заполнения обязательных embedded fields;
4. сохранить audit evidence изменения условий;
5. не запускать генерацию договора до отдельного approval/signature этапа.
