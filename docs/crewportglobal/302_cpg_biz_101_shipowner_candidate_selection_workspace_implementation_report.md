# CPG-BIZ-101 - Отчет о реализации рабочего места подбора кандидата судовладельцем

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: `301_cpg_biz_101_shipowner_candidate_selection_workspace_task.md`
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено на GTC1

## 1. Цель этапа

Этап CPG-BIZ-101 реализует выделенное рабочее место судовладельца для выбора кандидата после внутреннего shortlist, approval и candidate presentation review.

Пользовательский маршрут теперь отделен от формы создания заявки:

```text
Судовладельцы -> Подобрать кандидата
```

Новая страница показывает только безопасные для судовладельца представления кандидатов и позволяет выполнить контролируемую операцию:

```text
Предложить контракт
```

Операция не создает финальный договор и не заменяет approval guard. Она вызывает ранее реализованный CPG-BIZ-100 endpoint и создает или переиспользует Contract Agreement Workspace.

## 2. Что реализовано

### 2.1 Терминология меню

В пользовательском меню demand-side сторона приведена к единому термину:

```text
Shipowners / Судовладельцы
```

Термин используется как пользовательское обозначение стороны, которая подает заявку на экипаж. Внутренние имена БД и API могут сохранять legacy-названия `employer`, `employer_company`, `vacancy_request`.

### 2.2 Состав меню судовладельца

В меню оставлены функциональные действия:

| Пункт | Назначение |
|---|---|
| `Post Vacancy` / `Разместить вакансию` | Заполнение данных компании, судна и заявки на экипаж. |
| `Select Candidate` / `Подобрать кандидата` | Просмотр представленных кандидатов и переход к предложению контракта. |

Описательная страница `/for-shipowners/` убрана из нормального меню. Она не является рабочей операцией и не должна быть обязательным пользовательским маршрутом.

### 2.3 Новая страница

Добавлена страница:

```text
/shipowners/candidates/
```

Ссылка для проверки:

```text
https://crewportglobal.com/shipowners/candidates/
```

Страница принимает `draft_id` судовладельца:

```text
https://crewportglobal.com/shipowners/candidates/?draft_id={shipowner_draft_id}
```

Страница показывает:

1. заявки судовладельца;
2. статус заявки;
3. количество представленных кандидатов;
4. безопасные карточки кандидатов;
5. краткое объяснение matching-result;
6. статус решения судовладельца по кандидату;
7. статус contract operation;
8. кнопку `Propose contract`, если guard CPG-BIZ-100 разрешает операцию.

## 3. Backend/API

Добавлен внутренний employer-side endpoint:

```text
GET /api/v1/employer/candidate-selection?draft_id={draft_id}
```

Endpoint:

1. проверяет `draft_id`;
2. проверяет, что draft относится к shipowner/employer-side пользователю;
3. находит primary company;
4. читает заявки этой компании;
5. добавляет только уже представленных кандидатов из safe employer presentation payload;
6. возвращает `visibility_scope = shipowner_presented_candidates_only`.

Endpoint не вызывает raw operator candidate-search и не раскрывает весь пул моряков.

## 4. Граница видимости

Страница и API сохраняют утвержденную границу:

| Данные | Статус |
|---|---|
| Все профили моряков | Не раскрываются. |
| Кандидаты без approved presentation | Не раскрываются. |
| Email моряка | Не показывается. |
| Телефон моряка | Не показывается. |
| Family/private/medical details | Не показываются. |
| Broad document metadata | Не показывается. |
| Employer-safe document summary | Может показываться. |
| Contract proposal | Только через CPG-BIZ-100 guard. |

## 5. Contract Proposal Handoff

Кнопка `Propose contract` на новой странице вызывает существующий endpoint:

```text
POST /api/v1/employer/vacancy-applications/{vacancy_application_id}/contract-proposal
```

Тело запроса:

```json
{
  "employer_draft_id": "{shipowner_draft_id}"
}
```

Если Contract Agreement Workspace уже существует, endpoint переиспользует его и страница показывает:

```text
Open contract workspace
```

Если guard блокирует операцию, страница показывает blocker codes без раскрытия внутренних/private данных кандидата.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен safe endpoint `/api/v1/employer/candidate-selection` и helper чтения заявок с presented candidates. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Меню `Employers` переименовано в `Shipowners`, добавлен пункт `Select Candidate`, `/for-shipowners/` убран из normal navigation. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Обновлены EN/RU/PT подписи меню и добавлен ключ `nav.selectCandidate`. |
| `projects/crewportglobal/public/shipowners/candidates/index.html` | Добавлена новая страница подбора кандидатов судовладельцем. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Расширен UI-тест: проверяется новая страница, отсутствие email моряка и guarded contract handoff. |
| `docs/crewportglobal/301_cpg_biz_101_shipowner_candidate_selection_workspace_task.md` | Статус задачи обновлен после реализации. |
| `docs/crewportglobal/302_cpg_biz_101_shipowner_candidate_selection_workspace_implementation_report.md` | Добавлен этот отчет. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 302. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Бизнес-процесс register обновлен результатом CPG-BIZ-101. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Матрица этапов обновлена: shipowner candidate selection отмечен как реализованный. |

## 7. Проверка

Выполнены проверки:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: синтаксис PHP корректен.

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/shipowners/candidates/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
for (const js of [
  'projects/crewportglobal/public/assets/crewportglobal-navigation.js',
  'projects/crewportglobal/public/assets/crewportglobal-public-i18n.js'
]) {
  new Function(fs.readFileSync(js, 'utf8'));
}
console.log(`checked ${scripts.length} inline script(s) and shared navigation/i18n`);
NODE
```

Результат: frontend syntax корректен.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Результат: suite passed.

Тест подтверждает:

1. demand-side форма `/post-vacancy/` продолжает сохранять и публиковать заявку;
2. candidate presentation остается безопасным employer-facing payload;
3. email моряка не отображается;
4. `Propose contract` создает Contract Agreement Workspace;
5. `/shipowners/candidates/?draft_id=...` открывает конкретное рабочее место судовладельца;
6. страница показывает представленную кандидатуру;
7. страница не показывает email моряка;
8. существующее Contract Agreement Workspace переиспользуется через guarded endpoint.

## 8. Соответствие бизнес-процессу

Этап соответствует цепочке:

```text
Crew request / vacancy intake
-> Request-supply comparison
-> Internal shortlist draft
-> Internal shortlist approval
-> Candidate presentation review
-> Shipowner candidate selection
-> Contract Agreement Workspace
```

Теперь у судовладельца есть отдельная рабочая страница для результата matching/review, а не только форма создания заявки.

## 9. Оставшиеся контролируемые ограничения

1. Страница пока не открывает полноценный detail view Contract Agreement Workspace.
2. На странице пока нет отдельного детального экрана кандидата; карточка показывает safe summary и primary contract operation.
3. Employer feedback outcomes остаются реализованными в `/post-vacancy/`; будущий этап может перенести их в candidate detail workspace.
4. Финальный договор не генерируется и не подписывается в этом этапе.

## 10. Следующий этап

Следующий этап:

```text
Contract Agreement Workspace detail view and embedded field prefill implementation
```

На нем следует открыть созданный workspace и показать:

1. verified facts из заявки судовладельца;
2. verified seafarer facts из approved presentation;
3. verified vessel facts;
4. embedded contract condition fields;
5. source traceability;
6. party review/signature readiness guard.
