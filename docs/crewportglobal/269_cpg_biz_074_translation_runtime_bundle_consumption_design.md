# CPG-BIZ-074 - Translation Runtime Bundle Consumption Design

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Design report
- Основание: продолжение CPG-BIZ-073
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Approved design; implemented by CPG-BIZ-075

## 1. Цель

Цель этапа - определить, как shared public i18n runtime должен потреблять prebuilt machine-translation bundle.

Этот этап не меняет runtime код. Он фиксирует design, safety rules и acceptance criteria для следующего implementation slice.

## 2. Current Runtime Baseline

Текущий shared runtime:

```text
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
```

использует lookup order:

```text
PAGE_TRANSLATIONS[language]
-> CHROME_TRANSLATIONS[language]
-> PAGE_TRANSLATIONS.en
-> CHROME_TRANSLATIONS.en
-> raw key
```

`data-i18n`, `data-i18n-placeholder`, `data-i18n-title` и `data-i18n-aria-label` переводятся только через словари.

Браузерный runtime не вызывает provider API.

## 3. Target Consumption Model

После утвержденной implementation slice lookup order должен стать:

```text
PAGE_TRANSLATIONS[language]
-> CHROME_TRANSLATIONS[language]
-> MACHINE_BUNDLE.catalogs[language]
-> PAGE_TRANSLATIONS.en
-> CHROME_TRANSLATIONS.en
-> raw key only as validation failure fallback
```

Где:

```text
MACHINE_BUNDLE = window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE
```

Bundle может быть загружен только как prebuilt static JS artifact:

```text
projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js
```

Он не должен выполнять provider calls.

## 4. Safety Rules

Runtime consumption must preserve:

1. English remains official language.
2. Machine localization is auxiliary convenience text.
3. No browser-side Google, AI or external translation provider calls.
4. No automatic translation of completed form values.
5. No automatic translation of names, vessel names, company names, emails, phones, document metadata or operator notes.
6. No mutation of `value` for inputs, textareas, selects or user-generated content.
7. `placeholder`, `title` and `aria-label` may be localized only from approved dictionary keys.
8. English fallback remains mandatory.
9. Raw key exposure must remain a validator finding, not a normal user experience.

## 5. Runtime Bundle Validation Before Consumption

Before runtime uses a loaded bundle, it must check:

| Check | Required behavior |
|---|---|
| `schema_version` | Must equal supported version. |
| `official_language` | Must be `en`. |
| `publication_boundary.browser_provider_calls_allowed` | Must be `false`. |
| `publication_boundary.form_value_translation_allowed` | Must be `false`. |
| `catalogs` | Must be an object keyed by language. |
| target language catalog | Must be object of string keys and string values. |

If checks fail, runtime must ignore the bundle and continue with existing page/chrome/English fallback.

## 6. Loading Rule

The next implementation slice may choose one of two safe loading models:

| Option | Description | Recommendation |
|---|---|---|
| Static script before shared runtime | Load bundle JS before `crewportglobal-public-i18n.js`. | Preferred for generated static pages. |
| Optional late detection | Runtime detects `window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE` if already present. | Required for graceful no-bundle fallback. |

The first implementation should support optional late detection even if the static script is not present.

## 7. Data Entry Boundary

Operational forms remain English-only for data input.

The bundle may localize:

1. labels;
2. short help text;
3. validation messages;
4. navigation;
5. placeholders, where the placeholder is instructional text.

The bundle must not localize:

1. stored user values;
2. uploaded document names;
3. candidate names;
4. employer names;
5. vessel names;
6. operator notes;
7. API payload values;
8. matching-critical free text after user entry.

## 8. Implementation Acceptance Criteria

The next implementation stage is complete only when:

1. shared runtime can read a valid prebuilt bundle when present;
2. shared runtime ignores invalid bundle shape;
3. existing page and chrome dictionaries remain higher priority than machine bundle;
4. English fallback remains unchanged;
5. browser runtime performs no provider calls;
6. form values are not translated or overwritten;
7. `data-i18n-placeholder`, `data-i18n-title` and `data-i18n-aria-label` still work;
8. generated public pages continue to pass i18n validation;
9. focused browser test confirms a key missing from RU local dictionaries can come from machine bundle;
10. focused browser test confirms an input value is not translated after language switch.

## 9. Proposed Verification For Next Slice

Recommended commands:

```bash
npm run build:cpg-i18n-publish-ready
npm run build:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-runtime-bundle
npm run check:cpg-i18n
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Recommended additional focused tests:

1. bundle fallback key resolution;
2. invalid bundle ignored;
3. user input value preserved after language switch.

## 10. Non-Scope

This design does not approve:

1. Google provider activation;
2. browser-side provider calls;
3. translation of user-entered form data;
4. live publication of unreviewed sensitive text;
5. backend/API/database changes.

## 11. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-075 - Translation runtime bundle consumption implementation
```

Результат реализации зафиксирован в:

```text
docs/crewportglobal/270_cpg_biz_075_translation_runtime_bundle_consumption_implementation_report.md
```

Следующий этап после реализации:

```text
CPG-BIZ-076 - Controlled runtime bundle publication on selected public pages
```
