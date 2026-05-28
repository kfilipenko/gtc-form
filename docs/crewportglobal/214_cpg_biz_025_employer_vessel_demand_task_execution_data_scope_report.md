# CPG-BIZ-025 - Проверка исполнения demand-side задач и границ данных работодателя, судна и заявки

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о проверке бизнес-процесса и приложения
- Исходный этап: продолжение после CPG-BIZ-024
- Версия: 1.0
- Дата: 2026-05-28
- Статус: Выполнено и проверено на GTC1

## 1. Цель

Этот отчет фиксирует проверку demand-side части процесса формирования экипажа.

Цель этапа - подтвердить, что задачи по работодателю, судну и crew request открывают конкретный рабочий объект, показывают достаточный безопасный контекст для выполнения операции и не смешивают demand-side review с чувствительными supply-side данными моряков.

Проверка выполнена по утвержденной методике:

1. описать этап бизнес-процесса;
2. проверить работу приложения;
3. исправить только выявленное несоответствие;
4. протестировать;
5. зафиксировать результат в документации;
6. перейти к следующему этапу только после подтверждения тестами.

## 2. Проверенные этапы бизнес-процесса

| Этап | Операция / рабочий объект | Ответственная группа | Проверенный результат |
|---|---|---|---|
| CF-02 Employer and authority setup | `review_company_verification` | `verification_team` | Задача открывает конкретную company verification workspace, а не общий список. |
| CF-03 Vessel context setup | Контекст судна внутри company/vacancy workspace | `verification_team` / `review_team` | Судно отображается как часть проверяемого спроса: название, тип, IMO/флаг где доступны. |
| CF-04 Crew request structuring | `vacancy_request` review workspace | `review_team` | Рабочая область показывает заявку, судно, должность, тип судна, дату посадки и candidate-search panel. |
| CF-08 Request-supply comparison | Candidate search в `vacancy_request` workspace | `review_team` | Сравнение спроса и предложения доступно без раскрытия контактов кандидатов и broad document metadata. |

Отдельной операции `review_vessel_context` в текущем приложении пока нет. На этом этапе судно проверяется в составе employer/company verification и crew request completeness. Если позднее потребуется отдельная проверка права работодателя на конкретное судно, это должно быть оформлено отдельным будущим task slice.

## 3. Матрица границ данных

| Объект | Видимо во внутренней рабочей области | Не должно отображаться в demand-side проверке | Результат проверки |
|---|---|---|---|
| Employer / company | Company name, company type, registration context, verification status, internal registration context | Данные моряка, restricted medical/family details | Company workspace показывает company/vessel/vacancy context и не раскрывает seafarer restricted values. |
| Vessel | Vessel name, vessel type, IMO/flag context where available | Контакты моряка, family/medical data | Vessel context виден внутри проверяемого demand object. |
| Crew request / vacancy | Rank, department, vessel type, join date, contract duration, salary range and requirements where available | Candidate email, `contact_email`, `contact_phone`, `document_metadata` | Vacancy workspace показывает структурированный спрос и candidate-search controls без candidate contact leakage. |
| Candidate supply in demand comparison | Candidate name/status, readiness and blocker context where allowed | Candidate contact fields and raw broad document metadata | Проверено Playwright assertion: candidate emails, `contact_email`, `contact_phone`, `document_metadata` не отображаются. |

## 4. Выявленное уточнение теста

Во время проверки был выявлен слишком широкий отрицательный assertion: тест запрещал отображение `employerEmail` внутри внутренней vacancy review workspace.

Это было уточнено, потому что email работодателя относится к внутреннему registration/demand review context и может присутствовать внутри служебной проверки заявки работодателя. Этот email не является candidate contact data и не является employer-facing candidate payload.

Оставлены и подтверждены запреты на:

```text
candidate email
contact_email
contact_phone
document_metadata
```

## 5. Аудит и результат операции

Проверка company verification task подтверждает:

1. задача открывается из task title/deep link в конкретный объект;
2. рабочая область содержит employer, vessel and vacancy context;
3. review outcome записывает статус `verified`;
4. audit event содержит actor context для `company_verification`;
5. операция остается в границах `verification_team`;
6. supply-side restricted data не отображается в demand-side workspace.

Проверка vacancy request task подтверждает:

1. deep link открывает конкретный `vacancy_request`;
2. workspace показывает структурированный demand context;
3. candidate search доступен как вычисляемая операция перед shortlist;
4. candidate contacts и raw broad metadata не отображаются;
5. операция не создает employer-facing presentation.

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `tests/crewportglobal-operator-queue.spec.ts` | Уточнена проверка demand-side workspace: запрет сохранен для candidate contact fields и `document_metadata`; внутренний employer registration email не трактуется как candidate leakage. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Добавлены проверенные demand-side строки в матрицу role-based task execution. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлены инструкции для company verification и vacancy demand/request-supply workspace. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 214. |
| `docs/crewportglobal/214_cpg_biz_025_employer_vessel_demand_task_execution_data_scope_report.md` | Добавлен настоящий отчет. |

## 7. Проверка

### 7.1 Связанные focused scenarios

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API|operator vacancy detail runs read-only candidate search"
```

Результат:

```text
2 passed
```

### 7.2 Полный operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат:

```text
4 passed
```

## 8. Итог этапа

Demand-side проверка employer/company/vessel/vacancy workspace подтверждена.

Текущая система уже позволяет выполнить следующие операции по утвержденной бизнес-методике:

1. открыть конкретную company verification task;
2. увидеть company, vessel and vacancy context;
3. записать review outcome и audit context;
4. открыть конкретный vacancy request workspace;
5. увидеть structured demand и candidate-search panel;
6. сохранить границу между demand review и restricted supply-side/candidate contact data.

## 9. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-026 - Internal review workspace raw payload and secondary-action minimization
```

Цель следующего этапа: проверить, нужно ли скрыть raw API/debug payload и вторичные действия внутри рабочей области за отдельным служебным disclosure или permission-gated режимом, чтобы пользователь видел сначала бизнес-операцию, ее этап, объект и допустимый результат, а не технические поля.

