# CPG-BIZ-047 - Employer And Vessel Form Standard Rollout Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Continuation after document 240 and Project Owner approval
- Version: 1.1
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап продолжает распространение утвержденного стандарта жизненного цикла формы на demand-side поток:

```text
/post-vacancy/
```

Фактически эта страница сейчас является объединенной рабочей формой для трех потоков:

1. employer / company demand account;
2. vessel context;
3. crew request / vacancy requirement.

Цель этапа - закрыть выявленный разрыв по vessel context, чтобы данные судна стали сопоставимыми с данными моряков и могли использоваться для будущего automated request-offer matching.

Этап не добавляет scoring, автоматическое трудоустройство, employer-facing publication, миграции БД или новые workflow shortcuts.

## 2. Повторно использованные стандарты

| Standard | Canonical implementation | Как применен |
|---|---|---|
| ICS-001 - Standard form lifecycle | `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` | `V-2.2` и `V-4.D1` получили точные field/document targets для completeness navigation. |
| Reference catalog binding | `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js` | `Vessel flag country` подключен к `countries` catalog и хранит ISO alpha-2 code. |
| ICS-002 - Standard protected upload | `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Добавлен отдельный vessel document checklist с `form_type = vessel`, без копирования upload logic. |
| Backend completeness analyzer | `cpg_questionnaire_demand_completeness()` | `V-2.2` теперь оценивается по `vessels.flag_country_code`. |

## 3. Измененные файлы

| File | Изменение |
|---|---|
| `projects/crewportglobal/public/post-vacancy/index.html` | Добавлено поле `#post-vessel-flag-country`, helper `Same as company country`, отдельный vessel evidence checklist, исправлено отображение employer/vessel upload как checklist без видимых legacy `select` / `Choose file` controls, обновлены completeness targets. |
| `projects/crewportglobal/app/backend/api/public/index.php` | `upsert_company_context()` сохраняет `vessels.flag_country_code`; demand completeness возвращает значение `V-2.2`. |
| `projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php` | `V-2.2` переведен с target gap на реальное поле; `V-4.D1` ведет к vessel upload checklist. |
| `tests/crewportglobal-reference-catalog-form-bindings.spec.ts` | Добавлена проверка catalog-backed flag country и copy helper. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлены проверки vessel document upload через checklist, flag-country persistence after reload и сохранения demand workspace. |
| `docs/crewportglobal/implemented_code_standards/*` | Уточнено применение стандартов к vessel context. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Уточнен demand-side rollout для vessel context. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 241. |

## 4. Matching-First Matrix

| Field / evidence | Stream | Control | Stored value | Matching role | Result |
|---|---|---|---|---|---|
| Vessel flag country | Vessel context | Country catalog select | `vessels.flag_country_code` ISO alpha-2 | Soft score / compliance context; possible future hard blocker only after approval | Теперь поле структурировано и сохраняется. |
| Same as company country | Vessel context helper | Explicit copy button | Copies company country ISO alpha-2 into flag country | Reduces duplicate input without hiding independent choice | Проверено через UI test. |
| Vessel particulars document | Vessel evidence | Protected checklist row | `uploaded_documents.form_type = vessel`, `document_type = vessel_particulars` | Evidence-backed vessel identity/type/flag verification | Доступен отдельный upload/list path. |

## 5. Поведение формы

`/post-vacancy/` теперь разделяет employer и vessel evidence:

```text
employer checklist -> form_type employer
vessel checklist   -> form_type vessel
```

Это важно для будущей автоматизации: документы работодателя подтверждают полномочия, а документы судна подтверждают объект, на который подбирается экипаж.

Визуальный слой загрузки документов приведен к стандарту, уже примененному на `/create-profile/`:

1. перечень документов отображается как основной список;
2. название документа имеет краткое описание через hover/title;
3. в строке документа показываются исходное имя файла и статус обработки;
4. пользователь видит одну кнопку `Upload` в строке документа;
5. технический `Document type` dropdown и отдельный `Choose file` control скрыты и не используются как видимый интерфейс.

Поле `Vessel flag country`:

1. использует общий `countries` catalog;
2. сохраняет `AE`, `CY`, `GB` и другие ISO alpha-2 значения;
3. может быть заполнено кнопкой `Same as company country`;
4. сохраняется в backend и восстанавливается после reload;
5. участвует в backend completeness как `V-2.2`.

## 6. Verification

### 6.1 Syntax

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
```

Result: passed.

### 6.2 Embedded frontend syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/post-vacancy/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.3 Focused Playwright

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: 4 passed.

The test suite confirms:

1. `post-vessel-flag-country` is populated from the country catalog;
2. `Same as company country` copies and persists the ISO country code;
3. vessel document upload works through the vessel checklist;
4. `vessel_particulars.pdf` becomes visible in the vessel document row;
5. employer and vessel legacy upload selects/file inputs are hidden from the visible UI;
6. `/post-vacancy/` still saves, reloads and moves through the existing human-review publication flow.

## 7. Controlled Gaps

1. `/post-vacancy/` remains a combined employer/vessel/crew-request workspace. A future stage may split dedicated company and vessel cabinet pages if the business process requires it.
2. Vessel flag currently supports structured storage and completeness, but no automatic matching blocker or score uses it yet.
3. Vessel particulars are uploaded and listed, but document content is not parsed by AI/OCR in this slice.
4. Existing legacy/imported vessel records without complete vessel context remain preserved; no cleanup migration was introduced.

## 8. Next Planned Stage

Next recommended stage:

```text
CPG-BIZ-048 - Employer and vessel submit-review readiness and owner correction handoff verification
```

Planned work:

1. verify that complete employer/vessel/crew-request data enables submit-to-operator review only after all required `E/V/R` items and documents are present;
2. verify that incomplete vessel evidence produces clear owner missing-item tasks;
3. verify that `needs_correction` on employer or vessel evidence returns the task to the owner with exact document/field links;
4. keep the same matching-first standard: no hard matching blocker until supply and demand data are both structured and approved for blocker use.
