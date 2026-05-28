# CPG-BIZ-037 - Canonical Mandatory Field Schema Phase 0 Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Отчет о реализации
- Source task: CPG-BIZ-035 Phase 0 after Project Owner approval
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and locally verified

## 1. Назначение

Этот отчет фиксирует первый implementation step по CPG-BIZ-035:

```text
Phase 0 - Canonical mandatory field schema and synchronized supply-demand required keys
```

Цель этапа - создать единый backend source of truth для обязательных полей анкет и синхронизации supply/demand matching fields до изменения UI, API submit gate или runtime workflow.

## 2. Что Реализовано

Добавлен backend helper:

```text
projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
```

Он содержит:

1. четыре информационных потока `S/E/V/R`;
2. canonical field schema для seafarer, employer, vessel and crew request;
3. признаки `required_for_submit`, `required_for_matching`, `conditional_required`;
4. `mirrored_required_key` для matching-critical fields;
5. `visibility_class`;
6. `target_url` для будущих owner missing-section tasks;
7. document field definitions;
8. `implementation_status = target_gap` для полей, которые нужны для matching, но еще не полностью представлены в текущем UI.

Публичный API runtime behavior не изменен. Новый helper подключен в `index.php`, но endpoints и статусы форм пока не изменялись.

## 3. Синхронизированные Matching Keys

| Canonical key | Supply side | Demand / vessel / request side | Status |
|---|---|---|---|
| `rank` | `S-1.4` | `R-1.1` | Covered |
| `department` | `S-1.5` | `R-1.2` | Covered |
| `availability_or_joining_date` | `S-1.6`, `S-1.7` | `R-3.1` | Covered |
| `vessel_type` | `S-1.11` | `V-2.1`, `R-2.1` | Covered |
| `salary` | `S-1.10` | `R-4.2`, `R-4.3`, `R-4.4` | Covered |
| `coc` | `S-7.1`, `S-7.2`, `S-7.3`, `S-12.D3` | `R-5.1` | Covered, demand field marked target gap |
| `education` | `S-7.4`, `S-7.5` | `R-5.2` | Covered, demand field marked target gap |
| `training_stcw` | `S-7.6`, `S-12.D4` | `R-5.3` | Covered, demand field marked target gap |
| `sea_service` | `S-8.1`, `S-8.2` | `R-5.4` | Covered, demand field marked target gap |
| `medical_certificate` | `S-10.1`, `S-12.D2` | Future demand validity rule | Supply covered; demand date-window logic remains future/conditional |
| `language` | `S-7.7` | `R-6.2` | Target gap, not hard matching until structured fields are implemented |

## 4. Target Gaps Explicitly Preserved

Некоторые поля включены в schema как будущие matching dimensions, но помечены `target_gap`, чтобы система не использовала их как hard blocker раньше времени.

Examples:

1. vessel flag country;
2. structured COC requirement on demand;
3. structured education requirement on demand;
4. structured training requirement on demand;
5. structured sea-service requirement on demand;
6. structured language/level on both sides;
7. visa requirement as structured demand field.

Это предотвращает ложное чувство готовности matching, когда поле описано в бизнес-процессе, но еще не реализовано в форме.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php` | Added canonical mandatory field schema helper and validation/indexing functions. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Loaded the schema helper for future API use without changing route behavior. |
| `projects/crewportglobal/app/backend/api/tests/questionnaire_schema_test.php` | Added isolated no-DB schema validation and supply-demand parity test. |
| `projects/crewportglobal/app/backend/api/README.md` | Documented the new isolated PHP schema test command. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 226. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added Phase 0 implementation control and revision entry. |
| `docs/crewportglobal/224_cpg_biz_035_questionnaire_save_completeness_gate_implementation_task.md` | Marked Phase 0 as implemented and clarified remaining phases. |
| `docs/crewportglobal/226_cpg_biz_037_canonical_mandatory_field_schema_phase0_report.md` | Added this report. |

## 6. Verification

### 6.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/tests/questionnaire_schema_test.php
```

Result: passed.

### 6.2 Focused Schema Test

```bash
php projects/crewportglobal/app/backend/api/tests/questionnaire_schema_test.php
```

Result:

```text
Questionnaire schema tests passed
```

The test confirms:

1. streams are exactly `S/E/V/R`;
2. schema has broad current and target questionnaire coverage;
3. field codes are unique and valid;
4. target URLs are internal;
5. required flags are booleans;
6. document fields declare document type;
7. matching keys have supply and demand-side coverage where applicable;
8. target gaps are explicitly marked.

## 7. Controlled Boundary

This phase does not yet:

1. change form UI;
2. add field-level autosave;
3. add `GET completeness` endpoint;
4. add `POST submit-review` endpoint;
5. block submit-review;
6. create or remove team tasks;
7. change DB schema;
8. change matching score or employer presentation.

## 8. Next Planned Stage

Next implementation stage:

```text
CPG-BIZ-035 Phase 1 - Backend completeness analyzer and API contract
```

Planned work:

1. use `questionnaire_schema.php` as the source of required fields;
2. compute missing fields/documents from draft payload and uploaded document metadata;
3. expose a safe completeness response;
4. keep runtime review submission unchanged until the submit gate is implemented in a later phase;
5. add no-DB helper tests and focused API tests where endpoint behavior is introduced.

