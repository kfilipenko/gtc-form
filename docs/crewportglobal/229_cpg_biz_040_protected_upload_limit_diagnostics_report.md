# CPG-BIZ-040 - Protected Upload Limit Diagnostics And Runtime Alignment Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner upload failure feedback after CPG-BIZ-039
- Version: 1.1
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап уточняет стандарт сохранения и проверки анкет отдельным правилом для защищенной загрузки документов.

Проблема: пользователь мог загрузить PDF меньше 10 MB и получить ошибку без понятного объяснения. Основная причина для файлов больше 2 MB была runtime-конфигурация PHP-FPM: прикладной код разрешал файл до 10 MB, но PHP-FPM ограничивал `upload_max_filesize` значением 2 MB, а nginx не имел явного upload limit для `/api/v1/`.

При дополнительной ручной проверке также выявлены два связанных сценария:

1. если открыть `/create-profile/` с `draft_id` employer/vacancy черновика и попытаться загрузить seafarer-документ, backend корректно отклоняет запрос кодом `form_type_does_not_match_draft`;
2. если один аккаунт имеет несколько ролей, например `crewing_manager` и `seafarer`, backend раньше выбирал только первую роль по дате создания и мог ошибочно отклонить seafarer-документ в форме моряка.

Цель: выровнять frontend, backend и runtime-лимиты, а также показывать пользователю точную причину отказа файла.

## 2. Найденная причина

Проверка runtime показала:

```text
upload_max_filesize = 2M
post_max_size = 8M
```

Backend upload policy при этом уже был:

```text
CPG_DOCUMENT_MAX_FILE_SIZE_BYTES = 10485760
```

Иными словами, документ больше 2 MB, но меньше 10 MB мог быть отклонен PHP до того, как приложение выполняло свою проверку.

## 3. Реализованное поведение

| Область | Реализация |
|---|---|
| `/create-profile/` upload panel | Показывает допустимые форматы и лимит 10 MB до загрузки. |
| `/post-vacancy/` upload panel | Показывает те же правила для authority evidence. |
| Client-side validation | Браузер заранее блокирует пустой файл, файл больше 10 MB и неподдерживаемый тип. |
| Backend upload errors | API возвращает более точные коды для PHP upload errors и превышения request body. |
| Runtime limit | Для live `/api/v1/` nginx выставлен `client_max_body_size 12m`. |
| PHP-FPM per-app limit | Добавлен `.user.ini` для API: `upload_max_filesize = 10M`, `post_max_size = 12M`. |
| Draft-role guard in UI | `/create-profile/` больше не пытается загрузить seafarer-документ в employer/vacancy draft; вместо этого показывает ссылку на `/post-vacancy/`. |
| Multi-role draft context | `GET/PATCH /registration/drafts/{id}`, completeness API и document upload guard теперь учитывают запрошенный контекст роли, чтобы аккаунт с ролями `seafarer` и `crewing_manager` мог сохранять и загружать документы в правильной анкете. |
| User message | UI показывает конкретную причину отказа: type, size, runtime limit, total draft limit, file count limit, malware scan, partial upload. |

## 4. Error Codes

| Code | User-facing meaning |
|---|---|
| `file_too_large` | Файл больше прикладного лимита 10 MB. |
| `file_too_large_runtime_limit` | Файл был остановлен PHP upload limit до прикладной проверки. |
| `request_body_too_large` | Весь multipart request превысил серверный request limit. |
| `draft_total_size_limit_exceeded` | Общий лимит документов черновика исчерпан. |
| `draft_file_count_limit_exceeded` | Достигнут лимит количества файлов черновика. |
| `empty_file_rejected` | Выбранный файл пустой. |
| `unsupported_file_type` | Тип файла не PDF/JPG/PNG/WEBP. |
| `form_type_does_not_match_draft` | Выбранная форма загрузки не соответствует роли текущего черновика. |
| `malware_detected` | Файл заблокирован malware scan. |
| `upload_partial` | Файл был получен частично. |
| `upload_failed` | Файл не был получен системой; используется как fallback. |

## 5. Runtime Change On GTC1

Live nginx API location now includes:

```text
client_max_body_size 12m;
```

The API PHP directory now includes:

```text
projects/crewportglobal/app/backend/api/public/.user.ini

upload_max_filesize = 10M
post_max_size = 12M
```

Services were reloaded:

```text
nginx: active
php8.1-fpm: active
```

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/document_uploads.php` | Added exact PHP upload error mapping and request-body-too-large detection before document validation. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Added role-context resolution for multi-role registration drafts so seafarer save/completeness operations do not fall into the employer branch. |
| `projects/crewportglobal/app/backend/api/public/.user.ini` | Added per-application PHP upload/post limits aligned with the 10 MB app rule. |
| `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Added optional role query support for draft and completeness reads. |
| `projects/crewportglobal/public/create-profile/index.html` | Added visible upload limits, client-side file validation, exact server-error messages and a guard preventing seafarer uploads into employer/vacancy drafts. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Added the same upload limit / diagnostics standard for employer-side evidence uploads. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Added client-side upload size/type validation regression and employer/vacancy draft role guard assertion. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Added employer-side upload size/type validation regression. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added protected-upload limit and diagnostics control. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added the upload diagnostics rule to the save/completeness gate. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added user/team/AI instruction for upload limits and exact rejection reasons. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 229. |
| `docs/crewportglobal/229_cpg_biz_040_protected_upload_limit_diagnostics_report.md` | Added this report. |

## 7. Verification

### 7.1 Runtime Verification

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl reload php8.1-fpm
systemctl is-active nginx php8.1-fpm
```

Result: passed; both services active.

### 7.2 Live Upload Verification

A 3 MB synthetic PDF was uploaded through the live API:

```text
POST https://crewportglobal.com/api/v1/registration/drafts/{draft_id}/documents
form_type=employer
document_type=company_registration
file=cpg-upload-3mb.pdf
```

Result:

```text
HTTP 201
scan_status = clean
review_status = pending_human_review
file_size_bytes = 3145744
```

The temporary test user, DB rows and uploaded test file were removed after verification.

### 7.3 Draft Role And Multi-Role Verification

An employer/vacancy draft opened through `/create-profile/?draft_id=...` now shows a clear protected-upload boundary:

```text
This draft belongs to the employer/vacancy form. Upload company, vessel and crew request evidence there.
```

The upload button is disabled on the seafarer upload panel and the status line links to:

```text
/post-vacancy/?draft_id=...#post-document-upload-title
```

The backend guard remains unchanged and still rejects mismatched `form_type` uploads.

A multi-role account with both `crewing_manager` and `seafarer` roles was also covered:

```text
GET /api/v1/registration/drafts/{draft_id}?role=seafarer
GET /api/v1/registration/drafts/{draft_id}/completeness?role=seafarer
PATCH /api/v1/registration/drafts/{draft_id} with role=seafarer
POST /api/v1/registration/drafts/{draft_id}/documents with form_type=seafarer
```

Result: seafarer profile save, S-code completeness and seafarer document upload stay active for the seafarer form even when the same account also has an employer-side role.

## 8. Control Boundary

This stage does not change:

1. matching logic;
2. employment decision logic;
3. employer-facing publication;
4. document visibility scopes;
5. protected storage policy;
6. malware scan boundary;
7. completeness endpoint side-effect rules.

## 9. Следующий этап

Следующий этап по плану:

```text
CPG-BIZ-035 Phase 3 - /post-vacancy/ Save / confirm data completeness gate
```

На следующем этапе тот же стандарт сохранения и completeness control должен быть полноценно применен к employer / vessel / crew-request форме:

1. одна видимая кнопка `Save / confirm data`;
2. backend `E-*`, `V-*`, `R-*` missing items;
3. подсветка обязательных employer, vessel и crew-request полей;
4. отсутствие operator-review task до явной submit-review операции;
5. сохранение upload limit diagnostics как обязательного правила для документов.
