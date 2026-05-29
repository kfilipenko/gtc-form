# CPG-BIZ-045B - Protected Upload Success Feedback Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source request: Project Owner upload testing feedback after CPG-BIZ-045A
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот корректирующий этап закрывает пользовательскую неоднозначность в protected upload.

При ручном тестировании `/create-profile/` после выбора PDF и нажатия `Upload` документ фактически мог быть принят backend-ом, но браузерный `file input` очищался после успешной загрузки и снова показывал:

```text
Файл не выбран
```

Это выглядело как ошибка загрузки, хотя статус ниже мог показывать успешную загрузку.

## 2. Найденная причина

Причина была не в backend upload endpoint и не в PDF-валидации.

После успешной загрузки общий helper намеренно очищал file input, чтобы пользователь случайно не отправил тот же файл повторно:

```text
nodes.file.value = ''
```

Но UI не показывал достаточно явно, какой именно файл уже загружен и где его увидеть в списке.

## 3. Исправленное поведение

Общий protected-upload helper теперь после успешной загрузки:

1. показывает имя загруженного файла в статусе;
2. сохраняет очистку file input как защиту от повторной отправки;
3. обновляет список загруженных документов;
4. прокручивает пользователя к списку загруженных документов.

Новый пример статуса:

```text
Document uploaded and scanned: multi-role-passport.pdf. It is listed below.
```

Русский вариант:

```text
Документ загружен и просканирован: multi-role-passport.pdf. Он показан в списке ниже.
```

## 4. Standard Boundary

Исправление сделано в общем implemented standard:

```text
projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
```

Поэтому поведение применяется не только к `/create-profile/`, но и к другим формам, использующим `CPGProtectedUpload`.

Это соответствует правилу:

```text
один стандарт -> одна canonical implementation -> page adapter -> regression test
```

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Added uploaded filename feedback and scroll to uploaded-document list after successful upload. |
| `projects/crewportglobal/public/create-profile/index.html` | Added EN/RU uploaded-detail translations for seafarer form. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Added EN/RU uploaded-detail translations for demand form. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Added assertions that successful upload status includes the filename and the uploaded list shows the file. |
| `docs/crewportglobal/implemented_code_standards/02_standard_protected_upload.md` | Updated ICS-002 with explicit success-feedback rule. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Updated BP-014 upload acceptance criteria. |
| `docs/crewportglobal/00_documentation_register.md` | Registered this report. |
| `docs/crewportglobal/237_cpg_biz_045b_protected_upload_success_feedback_report.md` | Added this implementation report. |

## 6. Verification

### 6.1 Syntax Checks

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

Embedded frontend scripts were checked for:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Result: checked 2 inline scripts on each page.

### 6.2 Focused Upload Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "document upload shows exact file limit|keeps seafarer save and upload active"
```

Result: 2 passed.

The regression confirms:

1. exact 10 MB frontend validation still works;
2. unsupported file type validation still works;
3. seafarer upload remains active for a multi-role account opened in seafarer context;
4. successful upload status no longer looks empty because it includes the uploaded filename;
5. uploaded document list includes the uploaded filename and document type.

## 7. User Verification Link

Test again on:

```text
https://crewportglobal.com/create-profile/?draft_id=28f326c2-c86e-4036-8889-1717070adc60#profile-section-documents
```

Expected behavior:

1. choose a PDF/JPG/PNG/WEBP under 10 MB;
2. click `Upload`;
3. the file input may clear, but the status must show the uploaded filename;
4. the uploaded document must appear in the list below.

## 8. Next Stage

The next planned stage remains:

```text
CPG-BIZ-046 - Owner correction resubmission gate and computed task recomputation alignment
```

Before moving there, upload behavior must be treated as standardized:

```text
successful upload must show the uploaded filename and refreshed protected-document list.
```
