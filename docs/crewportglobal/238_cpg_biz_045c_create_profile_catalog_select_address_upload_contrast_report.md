# CPG-BIZ-045C - Catalog Select, Same Address And Upload Readability Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner runtime testing of `/create-profile/`
- Version: 1.4
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует исправление стандартного поведения анкеты моряка `/create-profile/`.

Цель этапа:

1. восстановить контролируемый выбор для конечных справочников;
2. исключить потерю выбора после сохранения и перезагрузки;
3. сократить повторный ввод адресов через опцию `Same address`;
4. улучшить читаемость списка загруженных документов и полей формы в темной теме;
5. закрепить правило в стандарте формы, чтобы аналогичные формы использовали общий механизм;
6. перенести загрузку документов в начало анкеты как основу будущего document-first заполнения профиля;
7. заменить технический выбор типа документа на понятный список документов со статусами.

## 2. Найденная системная причина

Проблема с `Civil status` и ранее похожая проблема с `Preferred vessel types` имели один общий источник:

```text
часть конечных справочников была реализована через input + datalist
```

`datalist` не является надежным контролом выбора. Он ведет себя как обычное текстовое поле, зависит от браузера, не гарантирует раскрытие списка и не обеспечивает строгий выбор одного утвержденного значения.

Решение:

```text
finite catalog field -> true select
large searchable catalog -> input + datalist временно допустим
multi-value catalog -> explicit multi-choice control / approved searchable multiselect
```

Additional manual testing showed that native browser `select multiple` is not sufficient for ordinary users: the list is connected to the catalog, but multiple selection depends on hidden Ctrl/Shift behavior. The accepted standard is now an explicit multi-choice control. In `/create-profile/`, `Preferred vessel types` is shown as visible checkboxes while preserving the same structured stored array for backend save, autosave and matching.

## 3. Измененные справочники формы

| Поле | Старый контроль | Новый контроль | Справочник | Тип выбора |
|---|---|---|---|---|
| `Gender` | `input + datalist` | `select` | `gender_values` | single |
| `Civil status` | `input + datalist` | `select` | `civil_status_values` | single |
| `Emergency contact relation` | `input + datalist` | `select` | `relation_types` | single |
| `Kin gender` | `input + datalist` | `select` | `gender_values` | single |
| `Kin relation` | `input + datalist` | `select` | `relation_types` | single |
| `Last vessel type` | `input + datalist` | `select` | `vessel_types` | single |
| `Preferred vessel types` | `select multiple` | visible checkbox multi-choice backed by structured hidden select | `vessel_types` | multiple |

Большие справочники, где нужен поиск или ввод кода, временно оставлены как `input + datalist`: страны, города, аэропорты, учебные заведения, религия и отдельные профессиональные справочники. Для них отдельный searchable-select стандарт может быть выделен позже.

## 4. Общий код стандарта

Добавлен общий helper:

```text
projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js
window.CPGReferenceCatalogs.bindSelect()
window.CPGReferenceCatalogs.populateSelect()
```

Поведение:

1. получает значения из `GET /api/v1/reference-catalogs`;
2. заполняет настоящий `select`;
3. сохраняет ранее выбранное значение при асинхронной загрузке справочника;
4. добавляет fallback-значения, если каталог временно недоступен;
5. сохраняет legacy-значение, если оно уже записано в черновике, но отсутствует в текущем каталоге.

## 5. Same Address

В разделе адресов добавлена опция:

```text
Registration address is the same as permanent address
```

Она копирует в регистрационный адрес:

1. permanent street;
2. permanent house;
3. permanent flat;
4. residence city;
5. residence country;
6. permanent region;
7. permanent post code;
8. permanent address comments.

Скопированные значения сохраняются как обычные поля формы и остаются после backend save и hard reload.

## 6. Upload And Contrast Cleanup

Исправлена читаемость:

1. карточки загруженных документов больше не используют жесткий белый фон в темной теме;
2. metadata-чипы документа используют цвета приложения;
3. textarea и другие поля формы используют общий контрастный фон;
4. справочный текст о порядке обработки файла перенесен ниже строки выбора/загрузки файла и сделан мелким справочным текстом без акцентного выделения.

## 7. Обновленные стандарты

Обновлены:

```text
docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
docs/crewportglobal/business_processes/00_business_process_register.md
```

Новый стандарт:

```text
finite catalog-backed fields must use true select controls;
browser datalist is not accepted for finite mandatory or matching-critical choices;
multi-value finite catalogs must show explicit choices, not only native select multiple;
repeated address blocks should provide explicit same-address copy when applicable;
form controls and upload lists must remain readable in dark and light themes.
```

## 8. Document-First Profile Completion

После проверки Project Owner утвержден новый принцип:

```text
документы загружаются в начале анкеты
-> система в будущем извлекает данные из документов
-> пользователь подтверждает предложенные значения
-> недостающие сведения остаются нумерованными missing items
```

В `/create-profile/` блок защищенной загрузки перенесен сразу после:

```text
Identity, rank and availability
```

Это сделано потому, что документы моряка являются естественным первичным источником данных для:

1. паспорта / ID;
2. seaman's book;
3. COC / endorsement;
4. STCW / training certificates;
5. medical certificate;
6. maritime CV / experience records;
7. visa and other professional evidence.

Текущий этап не включает OCR, AI extraction или автоматическое заполнение. Но UI уже подготовлен к будущей обработке через явный extraction context:

```text
data-document-first-context="seafarer_profile"
data-extraction-field-prefix="S"
data-extraction-mode="future_ai_assisted_confirmation"
```

### 8.1 Future AI document extraction workflow

Будущий AI/OCR workflow должен выполняться в таком порядке:

| Step | Purpose | Control |
|---|---|---|
| Protected upload | Получить файл в защищенное хранилище | Файл не публичный, проходит malware scan |
| Document classification | Определить тип документа | `passport`, `seamans_book`, `coc`, `medical_certificate`, `visa`, `cv`, etc. |
| OCR / AI extraction | Извлечь кандидаты значений | Извлеченные данные не становятся финальными автоматически |
| Canonical mapping | Сопоставить значения с `S-*` полями и справочниками | Rank, department, vessel type, country, certificate, visa |
| Confidence review | Отметить уверенность | `high_confidence`, `needs_user_confirmation`, `ambiguous`, `not_extracted` |
| Owner confirmation | Пользователь принимает или исправляет значения | Без подтверждения владельца данные не считаются принятыми |
| Missing item generation | Показать то, чего нет в документах | Нумерованные `S-*` items остаются в checklist |
| Operator review | Команда проверяет итоговый профиль и evidence | AI не принимает employment / presentation decisions |

## 9. Human Document Checklist

После дополнительной проверки Project Owner утверждено, что фиксированный список документов не должен выглядеть как технический выпадающий справочник.

В `/create-profile/` видимый `Document type` dropdown заменен на компактный список документов:

1. Passport / ID;
2. Seaman's book;
3. Certificate of competency;
4. STCW certificate;
5. Medical certificate;
6. Maritime CV;
7. Experience record;
8. Training certificate;
9. Language certificate;
10. Other evidence.

Каждая строка списка показывает:

1. название документа;
2. короткое описание только через hover / `title`, без превращения блока загрузки в страницу для чтения;
3. исходное имя последнего загруженного файла под названием документа;
4. scan status;
5. human/agent review status;
6. размер файла;
7. row-level upload / replace control справа от названия.

Состояния строки:

| State | User-facing meaning |
|---|---|
| `not uploaded` | Документ пока не загружен. |
| `uploaded / clean` | Документ загружен и прошел scan. |
| `pending_human_review` / `under_review` | Документ ожидает проверки команды. |
| `verified` | Документ подтвержден оператором / агентом через review workflow. |
| `correction_requested` / `rejected` | Требуется замена документа; показывается причина, если она есть. |

Технический `document_type` сохранен как hidden adapter value для API:

```text
select#create-document-upload-type[hidden]
```

Пользователь выбирает файл в строке нужного документа и нажимает `Upload`. Если документ не прошел проверку, та же строка показывает `Replacement required` и используется для загрузки замены.

Во время тестирования была найдена и исправлена системная ошибка строковой загрузки: выбор файла не должен перерисовывать список документов до нажатия `Upload`, иначе браузер теряет выбранный `File` object. Теперь выбор типа документа обновляется без перерисовки строки, а upload использует общий `crewportglobal-protected-upload.js` controller.

Для безопасного owner-view API добавлено поле:

```text
reviewed_at
```

Оно позволяет показывать дату подтверждения документа без раскрытия служебных данных исполнителя.

## 10. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/document_uploads.php` | Added safe `reviewed_at` to owner-visible uploaded-document metadata so verified document rows can show confirmation date. |
| `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js` | Added reusable catalog-backed `bindSelect()` / `populateSelect()` helper with fallback and legacy-value preservation. |
| `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Exposed `uploadFileForType()` so row-level document checklist upload controls reuse the shared protected-upload standard. |
| `projects/crewportglobal/public/assets/crewportglobal-app.css` | Added textarea coverage to shared/dark form-control contrast rules. |
| `projects/crewportglobal/public/create-profile/index.html` | Converted finite catalog fields to true selects, replaced preferred-vessel native multi-select UX with visible checkbox multi-choice, added same-address copy option, improved upload/list contrast, moved upload processing help text, moved protected upload into document-first placement after identity/rank/availability and replaced visible document-type dropdown with compact row-level document checklist upload. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Added regression for catalog selects, explicit preferred-vessel checkbox selection, same-address copy, backend save and reload persistence, document-first upload placement/extraction context and row-level document upload/status rendering. |
| `docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md` | Added finite catalog select, repeated-address, document-first completion and human document checklist standards. |
| `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md` | Updated ICS-001/ICS-002 to include document-first completion and document-checklist adapters through the standard lifecycle/upload model. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Added Phase E.5 lifecycle control, document-checklist behavior and future AI/OCR confirmation boundary. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added controls 54-55 and revision records for document-first completion and document-checklist upload UI. |
| `docs/crewportglobal/00_documentation_register.md` | Updated document 238 description and revision record. |

## 11. Verification

### 11.1 Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```bash
php -l projects/crewportglobal/app/backend/api/lib/document_uploads.php
```

Result: passed.

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js
```

Result: passed.

Embedded `/create-profile/` scripts:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/create-profile/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 11.2 Focused Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 14 passed.

The test confirms:

1. multi-role seafarer upload remains active for the correct role/form context;
2. finite catalog fields render as `select`;
3. `Preferred vessel types` is selected through visible checkboxes while preserving a structured multi-value payload;
4. same-address copy fills registration fields;
5. selected catalog values and copied address values persist in backend metadata;
6. hard reload restores saved catalog/address values;
7. contact/address autosave still works;
8. protected upload appears before long manual sections and after identity/rank/availability;
9. document upload keeps the future AI-assisted confirmation context without OCR side effects;
10. document type selection and upload are performed through visible compact document rows while hidden `document_type` preserves API compatibility;
11. uploaded documents appear under the relevant document name with pending/verified/replacement states instead of a separate generic uploaded-file list;
12. selecting a file in a document row does not rerender the list before upload, so the chosen file is not lost.

## 12. Remaining Controlled Gaps

1. Large searchable catalogs still use `input + datalist`; a future shared searchable-select control may replace them.
2. The same-address option is currently implemented for permanent-to-registration address in `/create-profile/`; future forms should use the same standard when they contain repeated address blocks.
3. Full visual screenshot regression is not yet automated; current coverage is DOM/state and focused functional behavior.
4. AI/OCR document extraction is intentionally not implemented in this stage; only the placement, standard and future extraction contract are prepared.
5. Owner-visible document rows show safe review state and `reviewed_at`; detailed reviewer identity remains internal audit data.

## 13. Next Stage

This stage is complete.

Next planned stage remains:

```text
CPG-BIZ-046 - Owner correction resubmission gate and computed task recomputation alignment
```

Before moving there, any additional runtime issue found during manual `/create-profile/` testing should be checked against the same standard:

```text
standard documented -> implemented through shared helper or adapter -> tested -> recorded in report
```
