# CPG-BIZ-029 - Team Queue Recalculation And Completed Task Disappearance Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: отчет о проверке бизнес-процесса и приложения
- Исходный этап: продолжение после CPG-BIZ-028
- Версия: 1.0
- Дата: 2026-05-28
- Статус: Выполнено и проверено на GTC1

## 1. Цель

Этот этап продолжает утвержденный цикл:

```text
описать этап -> проверить приложение -> исправить несоответствие -> протестировать -> зафиксировать результат -> перейти дальше
```

Цель CPG-BIZ-029 - проверить два связанных правила:

1. ссылка computed task должна открывать конкретный рабочий объект, а не общий список;
2. после выполнения review outcome та же активная задача должна исчезать из активной team queue или оставаться только как control/blocked record с понятной причиной.

## 2. Проверяемая ссылка

Project Owner указал нерабочую ссылку:

```text
https://crewportglobal.com/verify/?queue_type=seafarer_profile&queue_item_id=06ddb0a9-5109-413a-b3e1-b4e4b52e90e5#review-workspace
```

Read-only DB inspection подтвердил, что это реальный `seafarer_profile_id`:

| Поле | Значение |
|---|---|
| `seafarer_profile_id` | `06ddb0a9-5109-413a-b3e1-b4e4b52e90e5` |
| `draft_id` / `user_id` | `378302c1-dd02-45f2-ac78-1b24611dc5ff` |
| `review_status` | `rejected` |
| Safe profile summary | `UI Mismatch Candidate ...`, rank `Master` |

## 3. Найденное несоответствие

`/verify/` корректно определял target object по `queue_type=seafarer_profile` и `queue_item_id`.

Однако после этого рабочая область загружала draft details через:

```text
GET /api/v1/registration/drafts/{draft_id}?visibility=operator_general
```

без operator/team access headers.

В результате direct link из `/team/` или ручная ссылка на конкретный `seafarer_profile` могла показать:

```text
Could not load draft details.
```

Это нарушало BP-012/BP-013: task title/link должен открывать точный internal working object.

## 4. Исправление

В `/verify/` загрузка draft details теперь выполняется с теми же operator headers, которые используются для protected operator queue.

Если доступ отсутствует, workspace показывает access panel, а не техническую ошибку загрузки.

```text
loadDraftDetails -> fetch(..., { headers: operatorHeaders() })
```

## 5. Проверка исчезновения активной задачи

Дополнительно проверено правило recomputation:

```text
после review outcome активная задача не должна продолжать висеть в My Tasks / group queue как будто ее еще надо выполнить
```

Backend task computation уточнен:

| Queue type | Active statuses that still create active team task | Completed/control statuses no longer create the same active task |
|---|---|---|
| `seafarer_profile` | `submitted_for_human_review`, `in_review` | `approved`, `rejected`, correction/control states outside active review |
| `company_verification` | `unverified`, `submitted` | `verified`, `rejected` and other non-active review states |

Это не удаляет records из системы. Оно только предотвращает показ уже выполненного или закрытого объекта как активной исполнимой задачи.

## 6. Business Process Matrix

| Business-process stage | Operation | Expected task behavior | Verified result |
|---|---|---|---|
| CF-02 / CF-03 Employer authority and company verification | `review_company_verification` | После `reviewed` задача компании исчезает из active `/team/workbench/tasks`. | Подтверждено Playwright assertion после review outcome. |
| CF-06 / CF-07 Seafarer supply readiness review | `review_seafarer_profile_completeness` | После `needs_correction` та же verification-team задача исчезает из active `/team/workbench/tasks`. | Подтверждено Playwright assertion после correction outcome. |
| CF-06 / CF-07 Seafarer profile direct workspace link | `seafarer_profile` target link | Direct link открывает конкретный seafarer workspace с current task/control context. | Подтверждено для `06ddb0a9-5109-413a-b3e1-b4e4b52e90e5`. |
| Control / blocked record boundary | Non-active review state | Объект может оставаться доступным как control/correction context, но не как активная исполнимая задача той же группы. | Подтверждено через filtered active team tasks. |

## 7. Что изменено

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Direct deep-link loading для draft details теперь передает operator headers и корректно обрабатывает access failure. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Team workbench computation теперь создает active tasks только для active review statuses, а completed/control statuses не возвращает как исполнимые задачи. |
| `tests/crewportglobal-operator-queue.spec.ts` | Добавлены проверки direct `seafarer_profile` link и recomputation: company reviewed / seafarer needs-correction больше не возвращаются как те же active tasks. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Verified matrix дополнена правилом active task disappearance после review outcome. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Operating instructions дополнены правилом: после outcome исполнитель проверяет recomputed queue, а та же активная задача не должна сохраняться без контрольной причины. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Core controls и revision history дополнены CPG-BIZ-029. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 218. |
| `docs/crewportglobal/218_cpg_biz_029_team_queue_recomputation_completed_task_disappearance_report.md` | Добавлен настоящий отчет. |

## 8. Проверка

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат:

```text
No syntax errors detected
```

### 8.2 Embedded frontend syntax

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

### 8.3 Focused link and recomputation check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API"
```

Результат:

```text
1 passed
```

Проверено:

1. direct `seafarer_profile` link открывает workspace;
2. workspace показывает профиль и current task/control context;
3. `Could not load draft details` больше не появляется;
4. после `company reviewed` задача компании исчезает из active team workbench tasks;
5. после `seafarer needs_correction` та же verification-team задача исчезает из active team workbench tasks.

### 8.4 Full operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат:

```text
4 passed
```

### 8.5 API regression

```bash
npm run test:cpg-api
```

Результат:

```text
18 passed
```

## 9. Итог этапа

Этап CPG-BIZ-029 завершен.

Подтверждено:

1. конкретная ссылка на `seafarer_profile` открывает рабочий объект;
2. access-controlled draft details больше не ломают direct task link;
3. completed/correction outcomes пересчитывают active team queue;
4. та же активная задача не остается у группы после выполнения outcome;
5. объект может оставаться доступным как control/correction context, но не как активная исполнимая задача без причины.

## 10. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-030 - Correction owner task visibility and responsible-party handoff check
```

Цель следующего этапа: проверить, что после `needs_correction` появляется не повторная задача verification-team, а правильная задача владельцу/ответственной стороне на исправление, с понятной ссылкой на конкретный объект и source-card/correction context.
