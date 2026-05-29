# CPG-BIZ-045C - Catalog Select, Same Address And Upload Readability Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner runtime testing of `/create-profile/`
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует исправление стандартного поведения анкеты моряка `/create-profile/`.

Цель этапа:

1. восстановить контролируемый выбор для конечных справочников;
2. исключить потерю выбора после сохранения и перезагрузки;
3. сократить повторный ввод адресов через опцию `Same address`;
4. улучшить читаемость списка загруженных документов и полей формы в темной теме;
5. закрепить правило в стандарте формы, чтобы аналогичные формы использовали общий механизм.

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
multi-value catalog -> select multiple / approved multiselect
```

## 3. Измененные справочники формы

| Поле | Старый контроль | Новый контроль | Справочник | Тип выбора |
|---|---|---|---|---|
| `Gender` | `input + datalist` | `select` | `gender_values` | single |
| `Civil status` | `input + datalist` | `select` | `civil_status_values` | single |
| `Emergency contact relation` | `input + datalist` | `select` | `relation_types` | single |
| `Kin gender` | `input + datalist` | `select` | `gender_values` | single |
| `Kin relation` | `input + datalist` | `select` | `relation_types` | single |
| `Last vessel type` | `input + datalist` | `select` | `vessel_types` | single |
| `Preferred vessel types` | `select multiple` | unchanged | `vessel_types` | multiple |

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
repeated address blocks should provide explicit same-address copy when applicable;
form controls and upload lists must remain readable in dark and light themes.
```

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js` | Added reusable catalog-backed `bindSelect()` / `populateSelect()` helper with fallback and legacy-value preservation. |
| `projects/crewportglobal/public/assets/crewportglobal-app.css` | Added textarea coverage to shared/dark form-control contrast rules. |
| `projects/crewportglobal/public/create-profile/index.html` | Converted finite catalog fields to true selects, added same-address copy option, improved upload/list contrast and moved upload processing help text. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Added regression for catalog selects, same-address copy, backend save and reload persistence; updated relation field handling from text fill to select. |
| `docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md` | Added finite catalog select and repeated-address standard. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Added Phase E.2 lifecycle control. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added control 53 and revision record. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 238. |

## 9. Verification

### 9.1 Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
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

### 9.2 Focused Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "catalog selects|autosaves contact|multi-role"
```

Result: 3 passed.

The test confirms:

1. multi-role seafarer upload remains active for the correct role/form context;
2. finite catalog fields render as `select`;
3. `Preferred vessel types` remains a multi-select;
4. same-address copy fills registration fields;
5. selected catalog values and copied address values persist in backend metadata;
6. hard reload restores saved catalog/address values;
7. contact/address autosave still works.

## 10. Remaining Controlled Gaps

1. Large searchable catalogs still use `input + datalist`; a future shared searchable-select control may replace them.
2. The same-address option is currently implemented for permanent-to-registration address in `/create-profile/`; future forms should use the same standard when they contain repeated address blocks.
3. Full visual screenshot regression is not yet automated; current coverage is DOM/state and focused functional behavior.

## 11. Next Stage

This stage is complete.

Next planned stage remains:

```text
CPG-BIZ-046 - Owner correction resubmission gate and computed task recomputation alignment
```

Before moving there, any additional runtime issue found during manual `/create-profile/` testing should be checked against the same standard:

```text
standard documented -> implemented through shared helper or adapter -> tested -> recorded in report
```
