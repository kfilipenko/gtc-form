# CPG-BIZ-046 - Standard Form Lifecycle Rollout Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Document 239 - CPG-BIZ-046
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот отчет фиксирует первый этап распространения утвержденного стандарта жизненного цикла формы на demand-side форму:

```text
/post-vacancy/
```

Главная цель этапа - не косметическая унификация интерфейса, а подготовка данных спроса судовладельца к будущему автоматическому сопоставлению с данными моряков.

Поэтому измененные поля спроса приведены к структурированным справочникам, которые уже используются или должны использоваться на supply-side:

1. страна;
2. тип судна;
3. требуемая должность / ранг;
4. документы работодателя / заявки.

Этот этап не реализует scoring, автоматическое решение о трудоустройстве, employer-facing publication или новые DB migrations.

## 2. Повторно использованные стандарты

| Standard | Canonical implementation | Как использован |
|---|---|---|
| ICS-001 - Standard form lifecycle | `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` | `/post-vacancy/` сохраняет draft, проверяет completeness, показывает `E/V/R-*` missing items и сохраняет значения после reload. |
| Reference catalog binding | `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js` | Поля country, vessel type и requested rank подключены к справочникам через `bindSelect`. |
| ICS-002 - Standard protected upload | `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Добавлен общий helper `createDocumentChecklist`, который рендерит компактный список документов и выполняет upload/replace без page-local копирования. |
| Submit-review gate | `window.CPGDrafts.submitForOperatorReview()` / backend submit-review endpoint | Граница между save/confirm и submit-review сохранена. |

## 3. Измененные файлы

| File | Изменение |
|---|---|
| `projects/crewportglobal/public/post-vacancy/index.html` | Demand-side поля country, vessel type и requested rank переведены из free-text/datalist в catalog-backed `select`; upload документов переведен на human-readable checklist; загрузка draft ждет готовности справочников. |
| `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` | Добавлен общий `createDocumentChecklist(config)` для строкового Upload/Replace checklist по фиксированному каталогу документов. |
| `projects/crewportglobal/public/assets/crewportglobal-docs.css` | Добавлены общие стили для компактного document checklist, статусов, row-level upload и responsive layout. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Обновлены проверки `/post-vacancy/`: выбор из справочников, сохранение, reload, upload через строку checklist. |
| `tests/crewportglobal-reference-catalog-form-bindings.spec.ts` | Обновлены проверки reference catalog bindings для seafarer vessel multiselect и demand-side selects. |
| `tests/crewportglobal-document-correction-tasks.spec.ts` | Обновлены correction tests под текущий row-level document checklist для seafarer и employer replacement scenarios. |
| `docs/crewportglobal/239_cpg_biz_046_standard_form_lifecycle_rollout_task.md` | Уточнен статус задачи после утверждения и выполнения Phase 1. |
| `docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md` | Уточнено, что rollout служит matching-first данным, а не только UI consistency. |
| `docs/crewportglobal/implemented_code_standards/02_standard_protected_upload.md` | Зафиксирован новый общий checklist helper. |
| `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md` | Обновлен реестр реализованных стандартов. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Зафиксировано применение стандарта к demand-side форме и следующий этап. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 240. |

## 4. Supply-Demand Field Synchronization Matrix

| Demand field | Demand form control | Catalog | Supply-side counterpart | Matching role | Result |
|---|---|---|---|---|---|
| Company / flag / operating country | `#post-country` | `countries` | Seafarer nationality/current/residence country where applicable | Soft score / compliance context | Structured ISO alpha-2 values are selected from catalog. |
| Request vessel type | `#post-vessel-type` | `vessel_types` | Seafarer preferred vessel types and sea-service vessel type | Hard blocker candidate only after both sides are consistently structured | Demand value is no longer unreliable free text. |
| Requested rank | `#post-vacancy-title` | `seafarer_positions` | Seafarer primary rank / position | Core matching key | Demand rank now uses the same catalog family as seafarer position data. |
| Employer authorization document | Document checklist row | Fixed document catalog | Seafarer document checklist pattern | Evidence / compliance | Upload and replacement behavior follows shared protected-upload standard. |

## 5. Demand Form Behavior

The `/post-vacancy/` form now loads catalog-backed controls before saved draft data is applied.

This prevents a common failure mode:

```text
saved value arrives before select options exist -> value is lost on reload
```

If a legacy draft contains a value not present in the current catalog, the form adds a legacy option for display and preservation. This keeps imported/test data visible while new entries move toward structured catalogs.

The form still stores the values through the existing draft payload. No DB schema change was made in this slice.

## 6. Protected Upload Checklist

The demand-side upload area now uses the same user-facing pattern as the approved document checklist standard:

1. one row per required document type;
2. document name visible;
3. description hidden in hover/title text;
4. latest uploaded filename visible when present;
5. scan status visible;
6. human/agent review status visible;
7. replacement-required state visible;
8. one visible `Upload` / `Replace` button per row.

The browser file input remains hidden as a technical adapter only. The user no longer has to work with a separate visible `Choose file` plus `Upload` pair.

## 7. Matching-First Control

This implementation follows the rule approved in document 239:

```text
form standard rollout exists to make request-offer matching reliable.
```

For that reason:

1. fields used for matching were converted before purely cosmetic fields;
2. finite catalog fields were not left as free text;
3. the same catalog families are used across supply and demand where available;
4. no new hard blocker was introduced merely because a field became structured;
5. future hard blockers should be enabled only after both sides have comparable structured values and enough verified data.

## 8. Verification

### 8.1 JavaScript syntax

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
```

Result: passed.

### 8.2 Embedded `/post-vacancy/` frontend syntax

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

### 8.3 Reference catalog and post-vacancy focused suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: 4 passed.

### 8.4 Document correction regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-document-correction-tasks.spec.ts
```

Result: 2 passed.

### 8.5 Static whitespace check

```bash
git diff --check
```

Result: passed.

## 9. Remaining Controlled Gaps

1. `/create-profile/` already follows the approved document-checklist behavior, but part of the checklist rendering still remains page-local from the earlier implementation. A future cleanup should migrate it to `createDocumentChecklist(config)` so the same helper fully owns both seafarer and employer document menus.
2. `/post-vacancy/` now uses structured selects for the key matching fields, but backend canonical reference IDs are still not fully normalized for every old/imported draft. Legacy values are preserved for visibility.
3. Company profile and vessel profile forms still need the same rollout analysis and adapter work.
4. No automatic matching score was introduced in this slice.

## 10. Next Planned Stage

Next stage after this report was executed as document 241:

```text
CPG-BIZ-048 - Employer and vessel submit-review readiness and owner correction handoff verification
```

That next stage should:

1. verify complete employer/vessel/crew-request submit-review readiness;
2. prove owner correction handoff for `E/V/R` missing or rejected evidence;
3. confirm computed team task recomputation after correction/resubmission;
4. keep matching-first boundaries and no automatic employment decision.
