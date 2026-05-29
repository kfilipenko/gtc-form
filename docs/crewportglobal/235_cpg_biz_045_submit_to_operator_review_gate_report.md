# CPG-BIZ-045 - Submit-To-Operator Review Gate Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source request: Project Owner approval after CPG-BIZ-044A
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап завершает разделение трех разных действий в больших анкетах:

1. автосохранение введенных полей;
2. `Save / confirm data` для сохранения и проверки полноты;
3. явная отправка полной анкеты на проверку оператору.

Теперь обычное сохранение анкеты не создает задачу оператору. Задача появляется только после прохождения backend completeness gate и отдельного действия пользователя:

```text
Submit to operator review
```

## 2. Реализованный стандарт

Добавлен implemented code standard:

```text
docs/crewportglobal/implemented_code_standards/03_standard_submit_review_gate.md
```

Стандарт зарегистрирован как:

```text
ICS-003 - Submit-to-operator review gate
```

Главное правило стандарта:

```text
autosave/save -> только сохранение и completeness;
submit-review -> отдельный backend gate, audit и вычисление следующей team task.
```

## 3. Backend Implementation

Добавлен endpoint:

```text
POST /api/v1/registration/drafts/{draft_id}/submit-review
```

Endpoint выполняет:

1. повторную backend completeness-проверку;
2. блокировку отправки при missing items;
3. безопасное изменение review/status только при полной анкете;
4. запись audit event;
5. возврат draft payload после перехода.

При неполной анкете endpoint возвращает:

```text
409 submit_review_gate_blocked
```

и явно подтверждает отсутствие side effects:

```text
created_operator_task: false
changed_review_status: false
wrote_audit: false
```

## 4. Status Boundary

Сохранение теперь оставляет объекты в draft-состоянии.

| Object | Save / confirm status | Submit-review status |
|---|---|---|
| `seafarer_profiles.review_status` | `draft` | `submitted_for_human_review` |
| `employer_companies.verification_status` | `draft` | `submitted` |
| `vacancy_requests.publication_status` | `draft` | `submitted_for_human_review` |

Для поддержки статуса `draft` добавлена migration:

```text
projects/crewportglobal/app/backend/db/migrations/017_submit_review_gate_statuses.sql
```

Migration additive/idempotent по смыслу текущего проекта: она расширяет допустимые статусы и default-значения, не удаляя данные.

## 5. UI Behavior

### 5.1 `/create-profile/`

На форме моряка добавлена отдельная кнопка:

```text
Submit to operator review
```

Она скрыта или disabled до тех пор, пока backend completeness не вернет:

```text
can_submit_to_operator = true
```

При нажатии UI:

1. сохраняет текущие данные;
2. повторно проверяет полноту;
3. показывает numbered missing items, если gate заблокирован;
4. вызывает submit-review endpoint только если анкета полная.

### 5.2 `/post-vacancy/`

Та же модель подключена к demand-side форме работодателя/судовладельца.

Demand stream сохраняет:

1. employer/company context;
2. vessel context;
3. crew request / vacancy requirement.

Но операторская задача появляется только после successful submit-review.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added submit-review endpoint, gate payload, draft-save status boundary and audit transition. |
| `projects/crewportglobal/app/backend/db/migrations/017_submit_review_gate_statuses.sql` | Added `draft` status support for seafarer and company review states. |
| `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Added shared `submitForOperatorReview()` API client method. |
| `projects/crewportglobal/public/create-profile/index.html` | Added submit-review button, state handling and blocked-gate rendering for seafarer form. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Added submit-review button, save-before-submit flow and blocked-gate rendering for demand form. |
| `playwright.crewportglobal.config.ts` | Added migration 017 to local UI test setup. |
| `playwright.crewportglobal.api.config.ts` | Added migration 017 to local API test setup. |
| `tests/crewportglobal-registration-api.spec.ts` | Added API tests for blocked and successful submit-review gate; updated queue, vacancy deletion and operator-decision regressions to use explicit submit-review before operator work appears. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Updated UI expectations for draft save followed by explicit submit-review. |
| `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md` | Registered active ICS-003. |
| `docs/crewportglobal/implemented_code_standards/03_standard_submit_review_gate.md` | Added implemented standard for submit-review gate. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Updated Phase E status. |
| `docs/crewportglobal/00_documentation_register.md` | Registered this implementation report and ICS-003 document. |

## 7. Verification

### 7.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
node -c projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
```

Result: passed.

Embedded frontend scripts were checked for:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Result: passed.

### 7.2 Focused API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "questionnaire completeness|submit review gate|employer vacancy request flows"
```

Result: 5 passed.

The focused API regression confirms:

1. completeness remains side-effect free;
2. incomplete seafarer submit is blocked;
3. blocked submit does not create operator task or audit;
4. complete seafarer submit succeeds after required documents are uploaded;
5. employer vacancy save remains draft until explicit submit-review.

### 7.3 Focused Demand UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: 3 passed.

The focused UI regression confirms:

1. `/post-vacancy/` saves and reloads draft data;
2. status remains draft before submit-review;
3. submit-review moves completed demand data to operator review state.

### 7.4 Focused Create-Profile UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 12 passed.

### 7.5 Full API Regression

```bash
npm run test:cpg-api
```

Result: 22 passed.

The full API regression confirms that legacy operator queue, vacancy deletion and operator decision tests now follow the approved boundary:

```text
save draft -> upload required documents -> submit-review -> operator queue / operator decision
```

## 8. Controlled Boundaries

This slice does not:

1. publish vacancies;
2. publish seafarer profiles;
3. create internal shortlist drafts;
4. present candidates to employers;
5. make matching scores or employment decisions;
6. expose restricted fields.

## 9. Remaining Risks And Controlled Gaps

1. Owner correction resubmission should be connected to the same submit-review standard in a future slice.
2. Future dedicated company/vessel forms should use ICS-001, ICS-002 and ICS-003 from the beginning.
3. Computed task model still needs a separate implemented standard (`ICS-004`) so all review tasks use the same stage, assignee and visibility contract.

## 10. Следующий этап

Этап CPG-BIZ-045 завершен.

Следующий плановый этап:

```text
CPG-BIZ-046 - Owner correction resubmission gate and computed task recomputation alignment
```

Цель следующего этапа: применить тот же стандарт submit-review к исправлениям владельца анкеты, чтобы после устранения missing/correction items задача владельца исчезала, а новая review task появлялась у правильной группы или назначенного исполнителя.
