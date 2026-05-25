# CPG-DEMAND-034 — История внутренних shortlist draft и список следующих операций

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Источник задачи: продолжение после CPG-DEMAND-033
- Версия: 1.0
- Дата: 2026-05-25
- Статус: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап добавляет защищенный список всех созданных внутренних shortlist draft, чтобы команда могла видеть:

1. какие internal drafts уже созданы;
2. в каком статусе находится каждый draft;
3. сколько кандидатов включено, удержано или исключено;
4. какая следующая вычисленная операция требуется;
5. какая группа и permission должны выполнять следующую операцию.

Этап не публикует кандидатов работодателю, не создает новый matching score, не принимает решений о трудоустройстве и не меняет employer-facing payload.

## 2. Backend/API

Добавлен защищенный read-only endpoint:

```text
GET /api/v1/operator/shortlist-drafts
```

Поддерживаемые параметры:

| Параметр | Значения | Назначение |
|---|---|---|
| `status` | `all`, `draft`, `needs_review`, `approved_internal`, `rejected`, `archived` | Фильтр по состоянию internal shortlist draft. |
| `page` | integer, минимум `1` | Номер страницы. |
| `page_size` | `10`..`100` | Размер страницы. |

Endpoint возвращает только безопасные данные:

1. `shortlist_draft_id`;
2. `vacancy_request_id`;
3. название заявки, компания, судно, должность, департамент;
4. `draft_status`;
5. `employer_visible`;
6. счетчики кандидатов;
7. следующую computed operation;
8. responsible group / role / permission;
9. ссылку на protected task в `/verify/`.

Endpoint не возвращает:

1. contact email / phone кандидатов;
2. `document_metadata`;
3. паспортные, медицинские или семейные данные;
4. employer-facing presentation payload.

## 3. UI

Добавлена защищенная внутренняя страница:

```text
/team/shortlists/
```

Страница показывает:

1. фильтр по статусу draft;
2. пагинацию;
3. общее количество drafts;
4. количество кандидатов на странице;
5. количество included / hold / excluded кандидатов;
6. количество match-ready / guard-blocked кандидатов;
7. next computed operation;
8. responsible group;
9. required permission;
10. access allowed / blocked;
11. ссылки `Open next task` и `Compare request-supply`.

В командный кабинет `/team/` добавлена ссылка:

```text
Shortlist draft history
```

В страницу сравнения `/team/matching/` добавлена навигационная ссылка:

```text
Shortlist drafts
```

## 4. Матрица видимости

| Поверхность | Кто видит | Что видно | Что не видно |
|---|---|---|---|
| `GET /api/v1/operator/shortlist-drafts` | Operator token или утвержденная team/admin session | Internal draft status, safe demand fields, candidate counts, next operation, group/permission metadata | Contacts, document metadata, medical/family/identity details, employer payload |
| `/team/shortlists/` | Внутренняя команда с доступом к protected pages | Список internal drafts, статусы, счетчики, next operation, ссылки на действия | Данные кандидатов за пределами безопасных счетчиков |
| `/team/` | Team member | Ссылка на историю draft | Нет раскрытия candidate/contact data |
| `/team/matching/` | Team member | Ссылка на историю draft | Нет новых side effects |

## 5. Связь со следующим computed operation

Для каждого draft backend заново вычисляет операции:

```text
approve_internal_shortlist
create_review_applications
```

и возвращает первую исполнимую операцию либо первую видимую операцию, если текущий пользователь не имеет права выполнить действие.

Это сохраняет принцип проекта:

```text
Задачи вычисляются на основании текущих данных, а не создаются как отдельные постоянные task-записи.
```

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен read-only list endpoint для internal shortlist drafts и safe list payload. |
| `projects/crewportglobal/public/team/shortlists/index.html` | Добавлена protected history/list page для internal shortlist drafts. |
| `projects/crewportglobal/public/team/index.html` | Добавлена ссылка `Shortlist draft history`. |
| `projects/crewportglobal/public/team/matching/index.html` | Добавлена навигационная ссылка `Shortlist drafts`. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлены проверки API/UI истории drafts, next operation и отсутствия contact/document metadata. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 197. |
| `docs/crewportglobal/197_cpg_demand_034_shortlist_draft_history_list_report.md` | Добавлен этот отчет. |

## 7. Проверка

План проверки:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

```bash
node inline-script syntax checks for:
projects/crewportglobal/public/team/index.html
projects/crewportglobal/public/team/matching/index.html
projects/crewportglobal/public/team/shortlists/index.html
```

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Результат:

```text
No syntax errors detected in projects/crewportglobal/app/backend/api/public/index.php
```

Inline frontend scripts:

```text
projects/crewportglobal/public/team/index.html: checked 1 inline script(s)
projects/crewportglobal/public/team/matching/index.html: checked 1 inline script(s)
projects/crewportglobal/public/team/shortlists/index.html: checked 1 inline script(s)
```

Focused Playwright:

```text
1 passed
```

Focused operator UI suite:

```text
4 passed
```

Live publication check:

```text
https://crewportglobal.com/team/shortlists/
```

Result: page is available and contains `Shortlist draft history` plus the `/api/v1/operator/shortlist-drafts` client call.

Проверка подтверждает:

1. internal shortlist draft создается из `/team/matching/`;
2. `/api/v1/operator/shortlist-drafts` возвращает созданный draft;
3. draft имеет `needs_review` и `employer_visible = false`;
4. next operation вычисляется как `approve_internal_shortlist`;
5. responsible group остается `review_team`;
6. `/team/shortlists/` показывает draft без candidate contact fields и без `document_metadata`.

## 8. Граница безопасности

Сохранены ограничения:

1. `employer_visible` остается `false`;
2. список не создает vacancy application;
3. список не переводит кандидатов в employer-facing state;
4. кандидатские контакты и document metadata не возвращаются;
5. выполнение операций остается за защищенными endpoint-ами `/verify/` и существующими approval guard.

## 9. Следующий этап

Следующий логичный этап после подтверждения истории drafts:

```text
Добавить shortlist draft detail/history drill-down:
- безопасная история candidate decisions;
- кто создал draft;
- кто выполнил approval;
- какие blockers были на момент создания;
- какие blockers остаются актуальными сейчас.
```

Этот следующий этап также должен оставаться internal-only до отдельного утверждения employer-facing presentation workflow.
