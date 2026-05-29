# CPG-BIZ-044 - Shared Protected Upload Helper Normalization Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source standard: BP-014 - Standard Form Lifecycle And Validation Module
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот отчет фиксирует выполнение Phase D по стандарту BP-014.

Цель этапа - вынести повторяющуюся frontend-логику защищенной загрузки документов из отдельных страниц в общий подключаемый модуль:

```text
projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
```

Стандарт применяется к двум текущим большим формам:

```text
/create-profile/
/post-vacancy/
```

Этот этап не меняет backend API, БД, миграции, upload storage, проверку на вредоносный код, operator review workflow, submit-to-operator gate или employer-facing publication.

## 2. Что реализовано

Добавлен общий helper `window.CPGProtectedUpload`.

Он содержит:

1. единый лимит одного файла `10 MB`;
2. единый список допустимых типов: `PDF`, `JPG`, `JPEG`, `PNG`, `WEBP`;
3. frontend validation для пустого файла, размера и типа;
4. преобразование размера файла в человекочитаемый вид;
5. расшифровку backend upload error codes через page-specific translations;
6. единый рендер списка загруженных документов;
7. единый рендер задач по документам со статусом `correction_requested` или `rejected`;
8. единый upload flow: disable controls -> upload -> clear file input -> refresh documents -> run page callback;
9. поддержку page-specific role gate, чтобы `/create-profile/` продолжал блокировать загрузку, если открыт employer/vacancy draft.

## 3. Подключение страниц

| Page | Form type | Shared behavior | Page-specific adapter |
|---|---|---|---|
| `/create-profile/` | `seafarer` | Validation, upload status, uploaded document list, replacement document task rendering | Seafarer draft role check, link to `/post-vacancy/` if user opened employer/vacancy draft, `S-*` completeness refresh after upload |
| `/post-vacancy/` | `employer` | Validation, upload status, uploaded document list, replacement document task rendering | Demand-side `E/V/R` completeness refresh after upload |

Страницы больше не хранят собственные копии функций:

```text
formatBytes
fileHasAllowedDocumentType
documentUploadValidationMessage
documentUploadServerErrorMessage
documentTypeLabel
reviewStatusLabel
documentsNeedingAction
renderDocumentActionTasks
renderUploadedDocuments
```

Вместо этого они настраивают общий helper через:

```text
translationPrefix
formType
listFormType
getDraftId
beforeUpload
onUploaded
```

## 4. User-visible behavior

Поведение для пользователя сохранено:

1. панель до загрузки показывает допустимые форматы и лимит `10 MB`;
2. слишком большой файл блокируется до отправки на backend;
3. неподдерживаемый файл блокируется до отправки на backend;
4. backend errors продолжают показываться точными сообщениями;
5. после успешной загрузки список документов обновляется;
6. после загрузки пересчитывается completeness;
7. `/create-profile/` не дает загрузить документ моряка в draft работодателя и показывает ссылку на правильную форму.

## 5. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Added shared protected upload controller for validation, status rendering, uploaded document list, document correction tasks and upload execution. |
| `projects/crewportglobal/public/create-profile/index.html` | Replaced page-local upload validation/rendering with `CPGProtectedUpload` adapter while preserving seafarer role gate and completeness refresh. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Replaced page-local upload validation/rendering with `CPGProtectedUpload` adapter while preserving demand completeness refresh. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | BP-014 updated: Phase D marked completed; next stage moved to submit-review gating. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added business-process control for shared protected upload helper adoption. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 233. |
| `docs/crewportglobal/233_cpg_biz_044_shared_protected_upload_helper_report.md` | Added this report. |

## 6. Verification

### 6.1 Syntax

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
node --check projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Result: passed.

Embedded frontend scripts were checked for:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Result: checked 2 inline scripts on each page.

### 6.2 Focused tests

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "create profile document upload shows exact file limit and type validation|create profile keeps seafarer save and upload active for multi-role account"
```

Result: 2 passed.

The focused `/create-profile/` check confirms:

1. exact `10 MB` validation remains visible;
2. unsupported file type validation remains visible;
3. `/create-profile/` multi-role seafarer upload remains active for seafarer draft context;
4. `/create-profile/` protected upload loads the shared helper without changing the seafarer upload behavior.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy document upload shows exact file limit and type validation|post vacancy save confirm renders demand completeness items"
```

Result: 2 passed.

The focused `/post-vacancy/` check confirms:

1. exact `10 MB` validation remains visible;
2. unsupported file type validation remains visible;
3. demand-side `E/V/R` completeness rendering still works after helper extraction;
4. exact missing-field navigation still works.

Generated `playwright-report` and `test-results` artifacts were checked and removed from the final working tree.

## 7. Controlled gaps

1. Submit-to-operator review is still not implemented.
2. Owner correction tasks still need to be connected to the same numbered lifecycle gate in a later phase.
3. Backend upload/storage logic remains unchanged and should continue to be tested through existing API/UI paths.

## 8. Следующий этап

Следующий этап:

```text
CPG-BIZ-045 - Submit-to-operator review gate
```

Цель следующего этапа:

1. добавить controlled submit-review действие после `can_submit_to_operator = true`;
2. не создавать operator/team task до прохождения backend completeness;
3. записывать audit event с actor context;
4. вычислять следующую задачу для правильной группы или исторического исполнителя;
5. сохранить запрет на automatic matching, employment decision and employer-facing publication.
