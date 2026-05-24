# CPG-DEMAND-027 - Публичный демонстрационный реестр без контактных данных

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: owner request after CPG-DEMAND-026
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот этап добавляет на главную страницу публичный демонстрационный срез реальных зарегистрированных данных:

1. заявки / crew requests;
2. суда;
3. моряки.

Цель - показать инвесторам и тестировщикам, что портал уже работает с живыми записями, но не раскрывать контактные данные и чувствительные сведения.

## 2. Реализованная модель

Добавлен публичный read-only API:

```text
GET /api/v1/registry-summary
```

API возвращает:

1. реальные счетчики записей из PostgreSQL;
2. до 6 последних безопасных строк по заявкам;
3. до 6 последних безопасных строк по судам;
4. до 6 последних безопасных строк по морякам;
5. явное описание privacy boundary.

Физического удаления, изменения статусов, публикации кандидатов, автоматического matching scoring и изменения workflow этот этап не делает.

## 3. Что показывается на главной странице

Главная страница `/` теперь содержит блок:

```text
Registered platform data for demonstration
```

В блоке показываются:

| Объект | Что отображается |
|---|---|
| Заявки | количество, название / должность, департамент, тип судна, дата посадки, статус, компания, судно |
| Суда | количество, название судна, тип судна, флаг, компания |
| Моряки | количество, должность, департамент, доступность, страна, review status |

## 4. Что не показывается

Публичный блок и API не возвращают:

1. e-mail;
2. телефоны;
3. `contact_email`;
4. `contact_phone`;
5. `seafarer_email`;
6. имена моряков;
7. `document_metadata`;
8. паспортные / визовые / seaman book номера;
9. медицинские детали;
10. raw uploaded document identifiers.

## 5. Backend

В backend добавлены read-only helpers:

```text
cpg_public_registry_count_row()
cpg_public_registry_vacancy_rows()
cpg_public_registry_vessel_rows()
cpg_public_registry_seafarer_rows()
handle_get_public_registry_summary()
```

Данные читаются только через `SELECT`.

## 6. Frontend

В `projects/crewportglobal/public/index.html` добавлен новый публичный блок с:

1. live-счетчиками;
2. краткими списками;
3. английскими и русскими i18n-строками;
4. безопасным пояснением, что контактные данные остаются в защищенных workflow.

## 7. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен публичный read-only endpoint `/api/v1/registry-summary`. |
| `projects/crewportglobal/public/index.html` | Добавлен блок live registry на главной странице. |
| `tests/crewportglobal-homepage-live-dashboard.spec.ts` | Расширен тест главной страницы: проверяет реальные счетчики, строки заявок/судов/моряков и отсутствие e-mail/phone в публичном блоке. |
| `docs/crewportglobal/00_documentation_register.md` | Зарегистрирован документ 190. |
| `docs/crewportglobal/190_cpg_demand_027_public_demo_registry_summary_report.md` | Добавлен этот отчет. |

## 8. Проверка на портале

Проверка выполняется на:

```text
https://crewportglobal.com/
```

Ожидаемое поведение:

1. На главной странице виден блок зарегистрированных данных.
2. Счетчики заявок, судов и моряков берутся из текущей PostgreSQL DB.
3. В строках есть только безопасные операционные признаки.
4. Контактные данные не отображаются.

Прямой API для проверки:

```text
https://crewportglobal.com/api/v1/registry-summary
```

## 9. Verification

Проверка выполнена на GTC1.

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```bash
node inline script syntax check for projects/crewportglobal/public/index.html
```

Result: checked 2 inline scripts.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts
```

Result: 1 passed.

Focused UI test confirms:

1. the homepage loads the new live registry section;
2. the registry shows non-zero real counts after creating test data;
3. the registry preview contains the created vacancy, vessel and seafarer professional rank;
4. the registry preview does not contain the test seafarer e-mail;
5. the registry preview does not contain the test seafarer phone.

```bash
npm run test:cpg-api
```

Result: 18 passed.

## 10. Завершение этапа и следующий шаг

Этап публичного демонстрационного реестра завершен после прохождения проверок.

Следующий этап: добавить управляемый демонстрационный фильтр для инвесторского просмотра, чтобы можно было отдельно показать:

1. только заявки;
2. только суда;
3. только профессиональные профили моряков;
4. только matching-ready записи;
5. только записи без unresolved blockers.

Такой фильтр должен оставаться read-only и не раскрывать контактные данные.
