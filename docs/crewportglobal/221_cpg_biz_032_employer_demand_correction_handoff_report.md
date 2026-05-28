# CPG-BIZ-032 - Проверка Передачи Исправлений По Работодателю И Заявке

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Отчет о реализации и проверке
- Source task: continuation after CPG-BIZ-031
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Назначение

Этот отчет фиксирует проверку и исправление demand-side correction handoff для потоков работодателя, судна и заявки на экипаж.

Цель этапа: подтвердить, что результат `needs_correction` в командном review не оставляет старую активную задачу в очереди команды, а создает понятную задачу владельцу / ответственному пользователю на исправление данных. После исправления задача владельца должна исчезнуть, а следующая командная задача должна вычислиться заново для правильной группы или исторически активного исполнителя.

Этап продолжает утвержденную методику бизнес-процессов:

```text
описали этап
-> проверили работу приложения
-> исправили несоответствие
-> протестировали
-> зафиксировали проверенный процесс
-> перешли к следующему этапу
```

## 2. Проверенный Бизнес-Процесс

Проверенный процесс относится к потокам:

1. Employer / shipowner demand account.
2. Vessel context.
3. Crew request / vacancy requirement.

Проверенный переход:

```text
team review records needs_correction
-> active team task disappears
-> owner cabinet shows correction task
-> owner corrects demand-side data in /post-vacancy/
-> owner correction task disappears
-> team task recomputes for the responsible group or historical active executor
```

Проверенные рабочие объекты:

| Поток | Объект | Командная операция | Owner correction task | Повторная командная задача |
|---|---|---|---|---|
| Employer / shipowner demand account | company verification | `review_company_verification` | `Action required: correct employer authority data` | `review_company_verification` для `verification_team` или исторически активного исполнителя |
| Crew request / vacancy requirement | vacancy request | `create_internal_shortlist_draft` / crew request review context | `Action required: correct crew request data` | `create_internal_shortlist_draft` для `review_team` или исторически активного исполнителя |

## 3. Найденное Несоответствие

До этого этапа supply-side correction handoff для моряка был проверен, но demand-side correction handoff был неполным:

1. Company review мог быть отмечен как `needs_correction`, но повторная отправка владельцем не возвращала компанию из `rejected` в `submitted` надежным образом.
2. Vacancy requests в состояниях `rejected` или `closed` могли продолжать отображаться как активные задачи подготовки shortlist.
3. `/cabinet/` не показывал понятную задачу владельцу для исправления company или vacancy данных.

Это означало, что правило бизнес-процесса было не полностью исполнимым для demand-side объектов работодателя.

## 4. Внесенные Исправления

### 4.1 Backend

`projects/crewportglobal/app/backend/api/public/index.php`

1. Обновление company context теперь возвращает отклоненную компанию в `submitted`, когда владелец повторно отправляет исправленные данные компании.
2. Вычисление team task для vacancy requests теперь пропускает статусы, которые не являются активными для review / matching preparation:

```text
draft
rejected
closed
```

Активное вычисление задач vacancy request ограничено статусами:

```text
submitted_for_human_review
in_review
published
```

### 4.2 Owner Cabinet

`projects/crewportglobal/public/cabinet/index.html`

Кабинет теперь вычисляет demand-side correction tasks из `operator_review_history` и текущего состояния объекта.

Видимые задачи владельца:

| Текущее состояние объекта | Задача в кабинете |
|---|---|
| `company.verification_status = rejected` | `Action required: correct employer authority data` |
| `vacancy_request.publication_status = rejected` | `Action required: correct crew request data` |

Обе задачи ведут на:

```text
/post-vacancy/?draft_id={draft_id}#post-vacancy-form
```

Задача исчезает после повторной отправки владельцем, если исправленное состояние объекта больше не требует correction.

### 4.3 Test Coverage

`tests/crewportglobal-operator-queue.spec.ts`

Добавлен focused regression, который покрывает:

1. company `needs_correction` outcome;
2. disappearance of active company team task;
3. owner cabinet company correction task;
4. company resubmission;
5. recomputed `verification_team` task with historical executor;
6. vacancy `needs_correction` outcome;
7. disappearance of active vacancy shortlist task;
8. owner cabinet crew request correction task;
9. vacancy resubmission;
10. recomputed `review_team` task with historical executor.

## 5. Граница Доступа И Видимости

Этот этап не раскрывает restricted seafarer data.

Задача owner correction показывается только как demand-side correction task для соответствующего draft owner context. Она не публикует данные кандидатов, не создает employer-facing candidate presentation и не меняет vacancy applications.

DB migration не добавлялась.

Новая public page не добавлялась.

## 6. Измененные Файлы

| File | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен state transition для повторной отправки исправленной компании и фильтрация активных vacancy statuses для computed tasks. |
| `projects/crewportglobal/public/cabinet/index.html` | Добавлены вычисление и отображение demand-side owner correction task для company/vacancy corrections. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлен end-to-end focused regression для demand-side correction handoff и recomputation. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен verified demand-side correction handoff control. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Demand-side correction handoff добавлен в verified role-based task execution matrix. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлена operating instruction для employer/vessel/crew-request correction handoff. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен document 221. |
| `docs/crewportglobal/221_cpg_biz_032_employer_demand_correction_handoff_report.md` | Добавлен этот отчет. |

## 7. Проверка

### 7.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

### 7.2 Cabinet Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/cabinet/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Результат: checked 2 inline scripts.

### 7.3 Focused Demand-Side Handoff Test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "demand-side correction handoff"
```

Результат: 1 passed.

### 7.4 Relevant UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Результат: 10 passed.

### 7.5 API Regression

```bash
npm run test:cpg-api
```

Результат: 18 passed.

## 8. Подтвержденные Контроли

| Control | Result |
|---|---|
| `needs_correction` removes active team task | Подтверждено для company и vacancy flows. |
| Owner correction task is visible | Подтверждено в `/cabinet/` для company и crew request corrections. |
| Owner task has exact work link | Подтверждено: `/post-vacancy/?draft_id=...#post-vacancy-form`. |
| Owner resubmission clears correction task | Подтверждено для company и vacancy corrections. |
| Review task recomputes | Подтверждено для `verification_team` и `review_team`. |
| Historical executor rule remains active | Подтверждено через `assignment_mode = historical_active_executor`. |
| No employer-facing publication | Подтверждено; этот этап не создает presentations или vacancy applications. |

## 9. Оставшиеся Контролируемые Разрывы

1. The owner correction task currently opens the shared `/post-vacancy/` form, not a smaller object-specific correction form.
2. Vessel-specific correction is covered through the demand-side form context, but a separate vessel-only correction panel remains a future UI simplification.
3. The next process stage still needs similar verification for employer feedback / service completion / billing handoff when those flows become executable.

## 10. Следующий Запланированный Этап

Следующий этап должен продолжить ту же методику verified-process для demand-side review outcomes:

```text
CPG-BIZ-033 - Employer, vessel and crew-request review outcome sequence verification
```

Planned focus:

1. verify that employer authority review, vessel context review and crew request completeness each have distinct process-stage titles;
2. verify that each task opens the exact executable workspace;
3. verify that `reviewed`, `needs_correction`, `rejected` and deletion-request outcomes produce the correct next computed task or control record;
4. update BP-012 and BP-013 only after the application behavior is verified.
