# CPG-BIZ-108 - Отчет о taxonomy причин для входящего запроса моряка

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: продолжение после CPG-BIZ-107
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено

## 1. Назначение

Этот этап формализует причины, по которым review team не выпускает входящий запрос моряка в presented-candidate workflow.

После CPG-BIZ-107 команда могла:

```text
release / needs_correction / reject
```

CPG-BIZ-108 добавляет управляемую taxonomy причин для:

1. запроса исправления;
2. отклонения входящего запроса;
3. audit evidence;
4. будущего вычисления понятной задачи моряку.

## 2. Бизнес-правило

Входящий запрос моряка остается вычисляемой задачей:

```text
Review incoming seafarer request
```

Если команда выпускает запрос, кандидат переходит в `presented`.

Если команда не выпускает запрос, она обязана указать:

```text
review_reason_code
review_reason_name
review_note
```

Причина хранится в audit payload. Отдельная таблица задач не создавалась.

## 3. Taxonomy

### 3.1 Correction reasons

| Code | Meaning |
|---|---|
| `seafarer_profile_incomplete` | Profile or matching fields require correction before employer presentation. |
| `document_readiness_missing` | Required document readiness is missing or not readable enough for this request. |
| `availability_or_joining_unclear` | Availability, joining date or travel readiness requires clarification. |
| `contract_terms_clarification_required` | Contract expectation or request note requires clarification before presentation. |
| `request_note_unclear` | The seafarer request note is not clear enough for controlled employer presentation. |

### 3.2 Rejection reasons

| Code | Meaning |
|---|---|
| `not_matching_crew_request` | Candidate does not match the crew request after team review. |
| `duplicate_or_withdrawn_request` | Request is duplicate, withdrawn or no longer active. |
| `not_available_for_joining_date` | Candidate is not available for the requested joining date. |
| `employer_context_not_applicable` | Employer, vessel or request context is not applicable to this candidate. |
| `non_compliant_or_unsafe_request` | Request cannot proceed due to compliance, safety or policy concern. |

## 4. Runtime Behavior

Backend behavior:

1. `PATCH /api/v1/operator/review-queue/{vacancy_application_id}/status` now accepts `decision=needs_correction` or `decision=reject` for `queue_type=vacancy_application`.
2. If the request source is `seafarer_initiated_request`, correction/rejection requires `review_reason_code`.
3. `review_note` remains mandatory for correction/rejection.
4. Audit event `operator_review_decision_recorded` stores:

```text
request_source
review_reason_code
review_reason_name
review_note
```

UI behavior in `/verify/`:

1. The incoming request task panel keeps the primary release action.
2. Correction and rejection outcomes are shown inside the opened review workspace, not as competing queue actions.
3. The reviewer selects a structured reason from the relevant list.
4. The reviewer must add a note.
5. The result is recorded and the task list recomputes from the new object state.

## 5. Guard And Visibility Boundary

This slice does not:

1. create a contract;
2. create employment status;
3. create invoices;
4. publish seafarer contact data;
5. expose internal review rationale to shipowners before approved presentation.

Shipowner visibility remains safe:

```text
incoming request waiting for team review
or
presented candidate after review release
```

Internal reason codes are retained for audit and future seafarer correction tasks.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/access_control.php` | Added `reject` action permission mapping for `vacancy_application` review. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added incoming-request reason catalog, validation, audit payload fields and response fields for correction/rejection outcomes. |
| `projects/crewportglobal/public/verify/index.html` | Added structured reason controls for incoming seafarer request correction/rejection inside the review workspace. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Added regression check for `needs_correction` with `review_reason_code=document_readiness_missing`. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added control 76 for incoming-request reason taxonomy. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Updated CF-08A with structured correction/rejection reason behavior. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added reason taxonomy and operator instructions. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Marked CPG-BIZ-108 as implemented. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 309. |
| `docs/crewportglobal/309_cpg_biz_108_incoming_request_reason_taxonomy_report.md` | Added this report. |

## 7. Verification

Backend syntax:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/access_control.php
```

Result: passed.

Frontend inline JavaScript syntax:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: passed.

Focused workflow:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy workspace saves"
```

Result: passed.

The focused workflow confirms:

1. the original seafarer request can still be released to `presented`;
2. a second seafarer-initiated request can be sent to `needs_correction`;
3. correction requires and returns `review_reason_code`;
4. `request_source=seafarer_initiated_request` is preserved;
5. employer-facing contact data remains hidden.

Full post-vacancy workspace suite:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: 3 passed.

Access-control matrix:

```bash
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
```

Result: passed.

Patch hygiene:

```bash
git diff --check
```

Result: passed.

## 8. Next Stage

Recommended next stage:

```text
CPG-BIZ-109 - Seafarer correction task from incoming request reason
```

Planned work:

1. convert structured incoming-request correction reasons into a clear seafarer cabinet task;
2. link the task to the concrete vacancy request and relevant profile/document section;
3. clear the task after correction/resubmission;
4. recompute review-team visibility after the seafarer fixes the reason.
