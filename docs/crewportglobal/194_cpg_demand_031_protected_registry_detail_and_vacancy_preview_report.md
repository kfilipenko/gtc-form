# CPG-DEMAND-031 — Protected Registry Detail And Vacancy Preview Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: продолжение после CPG-DEMAND-030
- Version: 1.0
- Date: 2026-05-25
- Status: Implemented and verified on GTC1

## 1. Цель

Цель этапа — дать внутренней команде и инвесторам защищённый просмотр фактически зарегистрированных данных, а также показать на странице вакансий безопасную информацию из тестовых/импортированных заявок.

Этап не публикует вакансии как проверенные публичные объявления, не раскрывает контакты, не меняет статусы найма, не создаёт shortlist и не принимает employment decisions.

## 2. Что реализовано

Добавлен защищённый detail-view:

```text
/team/registry/
```

Страница показывает:

1. все записи / заявки / суда / моряков;
2. фильтр `all / matching_ready / has_blockers`;
3. пагинацию;
4. реальные счётчики из PostgreSQL;
5. расширенные safe columns без контактных данных.

Добавлен защищённый API:

```text
GET /api/v1/operator/registry-detail
```

Параметры:

```text
type=all|vacancy_requests|vessels|seafarers
readiness=all|matching_ready|has_blockers
page=1
page_size=10|25|50
```

Доступ:

```text
operator token
team account session
team admin session
```

## 3. Safe Columns

### 3.1 Crew Requests

Показываются:

```text
rank
department
vessel_type
join_date
contract_duration
publication_status
company_name
company_type
employer_country_code
vessel_name
flag_country_code
readiness_status
readiness_blockers
```

### 3.2 Vessels

Показываются:

```text
vessel_name
vessel_type
flag_country_code
company_name
company_type
employer_country_code
readiness_status
readiness_blockers
```

### 3.3 Seafarers

Показываются:

```text
primary_rank
department
availability_status
country_code
nationality_code
residence_country_code
review_status
readiness_status
readiness_blockers
```

Имена моряков, e-mail, телефоны, документы, паспортные номера, medical details и private notes не показываются.

## 4. Страница Вакансий

На странице:

```text
/vacancies/
```

добавлен read-only блок:

```text
Registered crew requests / Зарегистрированные заявки
```

Он использует безопасные данные из:

```text
GET /api/v1/registry-summary
```

и показывает тестовые/импортированные заявки даже если они ещё не стали публичными вакансиями.

Публичная граница сохранена:

1. блок не является публикацией вакансии;
2. контакты не раскрываются;
3. candidate data не раскрывается;
4. private notes и document metadata не выводятся.

## 5. Доступ На Портале

Проверка защищённого просмотра:

```text
https://crewportglobal.com/team/registry/
```

Порядок входа:

1. пользователь входит в `/team/` через подтверждённый e-mail code;
2. пользователь должен состоять в approved team group или иметь operator/admin session;
3. после входа в блоке Team links появляется ссылка `Protected registry detail`;
4. для локальной/operator fallback проверки можно использовать operator token.

## 6. Изменённые Файлы

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен protected registry detail API, safe row assembly и маршрут `/operator/registry-detail`. |
| `projects/crewportglobal/public/team/registry/index.html` | Добавлена новая защищённая страница detail-view с фильтрами, пагинацией и safe columns. |
| `projects/crewportglobal/public/team/index.html` | Добавлена ссылка `Protected registry detail` в список командных ссылок. |
| `projects/crewportglobal/public/vacancies/index.html` | Добавлен блок безопасного preview зарегистрированных crew requests из registry summary. |
| `tests/crewportglobal-protected-registry-detail.spec.ts` | Добавлен тест protected API/UI и privacy boundary. |
| `tests/crewportglobal-vacancy-board.spec.ts` | Добавлены проверки registered request preview на странице вакансий. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 194. |
| `docs/crewportglobal/194_cpg_demand_031_protected_registry_detail_and_vacancy_preview_report.md` | Добавлен этот отчёт. |

## 7. Контроль Безопасности

API и UI исключают:

```text
email
contact_email
seafarer_email
phone
contact_phone
document_metadata
passport_number
medical_details
```

Protected detail-view предназначен для внутренней демонстрации и тестирования, а не для публичного раскрытия персональных данных.

## 8. Проверка

### 8.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

Embedded frontend scripts checked for:

```text
projects/crewportglobal/public/team/registry/index.html
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/vacancies/index.html
projects/crewportglobal/public/index.html
```

Result: passed.

### 8.2 Focused UI/API Verification

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-protected-registry-detail.spec.ts tests/crewportglobal-vacancy-board.spec.ts
```

Result: 3 passed.

Проверено:

1. `/team/registry/` открывает protected detail-view через operator/team access.
2. `GET /api/v1/operator/registry-detail` возвращает paginated rows.
3. Registry rows не содержат `contact_email`, `seafarer_email`, `contact_phone`, `document_metadata`, `passport_number`, `medical_details`.
4. `/vacancies/` показывает safe preview зарегистрированных crew requests.
5. Homepage live registry behavior из CPG-DEMAND-030 не сломан.
6. Missing token and invalid/non-UUID Bearer token return `401 unauthorized` instead of causing a database UUID error.

### 8.3 API Regression

```bash
npm run test:cpg-api
```

Result: 18 passed.

## 9. Следующий Этап

Следующий практический этап — добавить внутреннюю страницу сравнения `crew request -> candidate supply`, где оператор сможет видеть:

1. какие поля заявки используются как hard requirements;
2. какие поля моряка совпали;
3. какие blockers мешают matching-ready статусу;
4. какие данные нужно дозаполнить до формирования shortlist.
