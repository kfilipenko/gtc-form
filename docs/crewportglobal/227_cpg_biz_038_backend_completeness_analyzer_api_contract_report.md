# CPG-BIZ-038 - Backend Completeness Analyzer And API Contract Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Отчет о реализации
- Source task: CPG-BIZ-035 Phase 1 after Project Owner approval
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and locally verified

## 1. Назначение

Этот отчет фиксирует Phase 1 по задаче CPG-BIZ-035:

```text
Backend completeness analyzer and API contract
```

Цель этапа - подключить canonical mandatory-field schema из Phase 0 к backend-анализу полноты анкет и открыть безопасный API для проверки готовности анкеты перед отправкой оператору.

Этап не меняет UI, не создает операторские задачи, не переводит анкету в review status и не меняет runtime workflow отправки на проверку.

## 2. Что Реализовано

Добавлен backend helper:

```text
projects/crewportglobal/app/backend/api/lib/questionnaire_completeness.php
```

Он вычисляет:

1. обязательные поля по stream `S/E/V/R`;
2. условно обязательные поля по текущему состоянию анкеты;
3. обязательные документы;
4. статус документа: missing, scan not clean, not stored, review blocked или complete;
5. unresolved correction blockers;
6. target URLs для будущих owner missing-section tasks;
7. non-blocking target gaps, которые описаны в schema, но еще не должны блокировать submit.

Добавлен read-only endpoint:

```text
GET /api/v1/registration/drafts/{draft_id}/completeness
```

Endpoint возвращает единый completeness response для:

1. seafarer profile stream `S`;
2. employer/company stream `E`;
3. vessel stream `V`;
4. crew request/vacancy stream `R`.

## 3. API Contract

Response содержит:

| Field | Meaning |
|---|---|
| `completeness.object_type` | `seafarer_profile` или `demand_questionnaire`. |
| `completeness.object_id` | ID draft/user object. |
| `completeness.streams` | Проверяемые streams: `S` или `E/V/R`. |
| `completeness.overall_status` | `complete` или `incomplete`. |
| `completeness.can_save` | Всегда `true`; неполная анкета может сохраняться как draft. |
| `completeness.can_submit_to_operator` | `true` только если нет missing items и unresolved corrections. |
| `completeness.missing_items[]` | Нумерованные missing field/document blockers. |
| `completeness.required_fields[]` | Все активные required fields для текущей анкеты. |
| `completeness.required_documents[]` | Required documents and their current statuses. |
| `completeness.document_checks[]` | Safe document metadata check result without storage paths. |
| `completeness.unresolved_corrections[]` | Existing correction blockers that still prevent submit. |
| `completeness.target_urls[]` | Internal target URLs for future form/cabinet guidance. |
| `completeness.target_gaps[]` | Future matching fields kept visible but non-blocking. |
| `completeness.counts` | Counts for required, missing, documents, corrections and target gaps. |
| `side_effects.*` | Explicit proof that this endpoint does not change workflow state. |

Side effects are always false in this phase:

```json
{
  "side_effects": {
    "created_operator_task": false,
    "changed_review_status": false,
    "changed_publication_status": false,
    "changed_document_status": false
  }
}
```

## 4. Current Data Mapping

### 4.1 Seafarer Supply

The backend maps current seafarer profile, workspace and document metadata to `S-*` fields.

Examples:

| Field code | Source |
|---|---|
| `S-1.1` | Profile name / display name. |
| `S-1.2` | Account email. |
| `S-1.3` | Profile contact phone. |
| `S-1.4` | Primary rank. |
| `S-1.5` | Department. |
| `S-1.6` | Availability status. |
| `S-1.7` | Availability date when availability is later. |
| `S-1.8` | Nationality. |
| `S-1.9` | Residence country. |
| `S-1.10` | Expected salary. |
| `S-1.11` | Preferred vessel types. |
| `S-6.1` | Passport expiry. |
| `S-7.1` to `S-7.3` | COC data when rank requires COC. |
| `S-10.1` | Medical certificate expiry. |
| `S-11.1` | Data-processing confirmation. |
| `S-12.D*` | Required uploaded documents. |

### 4.2 Employer / Vessel / Crew Request Demand

The backend maps employer draft data, vessel context, vacancy workspace and documents to `E-*`, `V-*` and `R-*`.

Examples:

| Field code | Source |
|---|---|
| `E-1.1` | Company name. |
| `E-1.2` | Company registration country. |
| `E-1.3` | Company registration number. |
| `E-2.1` to `E-2.4` | Representative identity and contact fields. |
| `E-4.D1` to `E-4.D3` | Company and representative authority documents. |
| `V-1.1` | Vessel name if exact vessel is known. |
| `V-1.2` | IMO number if exact vessel is known. |
| `V-2.1` | Vessel type. |
| `R-1.1` | Required rank. |
| `R-1.2` | Department. |
| `R-2.1` | Request vessel type. |
| `R-3.1` | Joining date. |
| `R-4.1` to `R-4.4` | Contract duration, salary range and currency. |

## 5. Document Gate

Required documents pass completeness only when a matching uploaded document is:

```text
upload_state = stored_protected
scan_status = clean
review_status not in correction_requested / rejected / superseded
```

The API response returns only safe metadata:

```text
document_id
document_type
upload_state
review_status
scan_status
mime_type
uploaded_at
valid_until
```

It does not expose:

```text
storage_path
protected_path
document_metadata
raw file identifiers outside safe document_id
```

## 6. Submit-Review Boundary

The CPG-BIZ-035 task also describes:

```text
POST /api/v1/registration/drafts/{draft_id}/submit-review
```

That endpoint is intentionally not implemented in this phase.

Reason:

1. Phase 1 establishes a safe analyzer and contract first.
2. Current product behavior must not create or remove team tasks until the form UI is wired to the new one-button Save / confirm model.
3. Submit-review changes review status and task visibility, so it belongs to the next implementation phases after UI integration and focused regression.

Future submit-review must reuse this completeness result and fail with:

```text
questionnaire_incomplete
```

without creating operator tasks or changing review status when blockers remain.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/questionnaire_completeness.php` | Added canonical schema-driven completeness analyzer. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added safe current-data adapters and read-only `GET /registration/drafts/{draft_id}/completeness` route. |
| `projects/crewportglobal/app/backend/api/tests/questionnaire_completeness_test.php` | Added no-DB helper tests for missing fields, complete package, target gaps and document review blockers. |
| `tests/crewportglobal-registration-api.spec.ts` | Added focused API assertions for seafarer and demand completeness responses. |
| `projects/crewportglobal/app/backend/api/README.md` | Documented the completeness endpoint and local test command. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 227. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added Phase 1 implementation control. |
| `docs/crewportglobal/224_cpg_biz_035_questionnaire_save_completeness_gate_implementation_task.md` | Marked Phase 1 as implemented and clarified remaining phases. |
| `docs/crewportglobal/227_cpg_biz_038_backend_completeness_analyzer_api_contract_report.md` | Added this report. |

## 8. Verification

### 8.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_completeness.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/tests/questionnaire_completeness_test.php
```

Result: passed.

### 8.2 Isolated PHP Tests

```bash
php projects/crewportglobal/app/backend/api/tests/questionnaire_schema_test.php
php projects/crewportglobal/app/backend/api/tests/questionnaire_completeness_test.php
```

Result: passed.

The completeness test confirms:

1. incomplete seafarer data remains saveable but cannot submit;
2. numbered missing fields and documents are returned;
3. a complete synthetic seafarer package can submit;
4. target gaps remain visible but non-blocking;
5. correction-requested documents block submit.

### 8.3 Focused API Tests

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "questionnaire completeness"
```

Result: 2 passed.

The focused API tests confirm:

1. seafarer completeness endpoint returns `S-*` missing items;
2. demand completeness endpoint returns `E/V/R-*` missing items;
3. incomplete questionnaires do not create operator tasks;
4. endpoint side effects remain false;
5. response does not expose broad metadata or protected storage paths.

### 8.4 API Regression

```bash
npm run test:cpg-api
```

Result: 20 passed.

The API regression confirms that the new completeness endpoint did not break existing registration, upload, review queue, vacancy, candidate search, deletion-request or operator-decision API flows.

## 9. Controlled Boundary

This phase does not yet:

1. change `/create-profile/` UI;
2. change `/post-vacancy/` UI;
3. add one visible `Save / confirm data` button;
4. add field-level autosave behavior;
5. add `Submit to operator review`;
6. create owner missing-section tasks in `/cabinet/`;
7. create or remove operator/team tasks;
8. change DB schema;
9. implement matching score, employer presentation or employment decisions.

## 10. Next Planned Stage

Next implementation stage:

```text
CPG-BIZ-035 Phase 2 - /create-profile/ autosave plus one Save / confirm action
```

Planned work:

1. connect `/create-profile/` to the new completeness endpoint;
2. keep field changes saveable without creating review tasks;
3. show numbered `S-*` missing fields/documents after Save / confirm data;
4. keep Submit to operator review disabled until `can_submit_to_operator = true`;
5. preserve existing data-minimization and source-card correction boundaries.
