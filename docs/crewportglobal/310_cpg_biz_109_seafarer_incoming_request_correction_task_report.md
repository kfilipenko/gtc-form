# CPG-BIZ-109 - Отчет о задаче моряку после correction входящего запроса

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: продолжение после CPG-BIZ-108
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено

## 1. Назначение

Этот этап превращает структурированную причину review-team по входящему запросу моряка в понятную задачу в личном кабинете моряка.

После CPG-BIZ-108 команда могла записать:

```text
needs_correction / reject
review_reason_code
review_reason_name
review_note
```

CPG-BIZ-109 добавляет user-facing handoff:

```text
Correct incoming request
```

Задача вычисляется из текущего состояния `vacancy_applications` и последнего audit event. Отдельная таблица задач не создавалась.

## 2. Бизнес-правило

Если входящий запрос моряка:

1. имеет `request_source = seafarer_initiated_request`;
2. находится в `application_status = rejected`;
3. последнее review-team решение по заявке равно `needs_correction` или `reject`;
4. audit содержит `review_reason_code`;

то в `/cabinet/` моряка появляется задача:

```text
Action required: correct incoming request
```

Задача показывает:

1. безопасное описание crew request;
2. `review_reason_name`;
3. безопасное пояснение review note;
4. ссылку на точный раздел `/create-profile/`, связанный с reason code.

## 3. Reason-To-Section Mapping

| Reason code | Target section |
|---|---|
| `seafarer_profile_incomplete` | `#profile-section-review` |
| `document_readiness_missing` | `#profile-section-documents` |
| `availability_or_joining_unclear` | `#profile-section-cv` |
| `contract_terms_clarification_required` | `#profile-section-publication` |
| `request_note_unclear` | `#profile-section-publication` |
| `not_available_for_joining_date` | `#profile-section-cv` |
| `not_matching_crew_request` | `#profile-section-publication` |
| `duplicate_or_withdrawn_request` | `#profile-section-publication` |
| `employer_context_not_applicable` | `#profile-section-publication` |
| `non_compliant_or_unsafe_request` | `#profile-section-review` |

## 4. Guard Boundary

Этот этап не создает:

1. employer-facing presentation;
2. contract proposal;
3. contract workspace;
4. employment status;
5. invoice or billing basis.

Судовладелец не получает внутреннюю rationale review-team. Моряк получает только owner-context задачу по своему запросу.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added latest vacancy-application review reason fields to seafarer cabinet payload. |
| `projects/crewportglobal/public/cabinet/index.html` | Added computed `Correct incoming request` task from incoming request review reason. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Added regression check that correction reason appears in seafarer cabinet with exact section link. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added control 77 for seafarer-owner incoming request correction task. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Updated CF-08A with seafarer cabinet handoff after correction/rejection. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added operating instruction for `Correct incoming request`. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Marked CPG-BIZ-109 as implemented. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 310. |
| `docs/crewportglobal/310_cpg_biz_109_seafarer_incoming_request_correction_task_report.md` | Added this report. |

## 6. Verification

### 6.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 6.2 Cabinet Inline JavaScript Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/cabinet/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.3 Focused Workflow Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy workspace saves"
```

Result: 1 passed.

The focused regression confirms:

1. review-team can record `needs_correction` for an incoming seafarer request;
2. the decision stores `review_reason_code = document_readiness_missing`;
3. the seafarer cabinet shows `Action required: correct incoming request`;
4. the task shows the safe crew-request summary, structured reason and operator note;
5. the task link opens `/create-profile/` at `#profile-section-documents`;
6. no employer presentation, contract proposal, employment status or billing side effect is created.

### 6.4 Diff Whitespace Check

```bash
git diff --check
```

Result: passed.

## 7. Next Stage

Recommended next stage:

```text
CPG-BIZ-110 - Incoming request resubmission lifecycle after seafarer correction
```

Planned work:

1. define how the seafarer confirms correction/resubmission;
2. clear the cabinet task after resubmission;
3. recompute the review-team incoming-request task;
4. preserve audit evidence linking original reason to corrected submission.
