# CPG-BIZ-075 - Translation Runtime Bundle Consumption Implementation Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Основание: продолжение CPG-BIZ-074
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Implemented and verified

## 1. Цель

Цель этапа - подключить approved prebuilt machine-translation bundle к shared public i18n runtime без browser-side provider calls и без изменения пользовательских значений форм.

Этот этап реализует утвержденный CPG-BIZ-074 lookup order:

```text
PAGE_TRANSLATIONS[language]
-> CHROME_TRANSLATIONS[language]
-> MACHINE_BUNDLE.catalogs[language]
-> PAGE_TRANSLATIONS.en
-> CHROME_TRANSLATIONS.en
-> raw key only as validation failure fallback
```

## 2. Реализация

Изменен shared runtime:

```text
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
```

Добавлено чтение:

```text
window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE
```

Runtime использует bundle только если он проходит fail-closed validation:

1. `schema_version = 1`;
2. `official_language = en`;
3. `publication_boundary.browser_provider_calls_allowed = false`;
4. `publication_boundary.form_value_translation_allowed = false`;
5. `catalogs` является объектом;
6. target language catalog является объектом string values.

Если bundle отсутствует или невалиден, runtime продолжает работать по прежней цепочке page/chrome/English fallback.

## 3. Data Boundary

Сохранено правило:

1. form values не переводятся;
2. stored user-entered values не изменяются;
3. names, vessel names, company names, email, phone, document metadata и operator notes не переводятся runtime-ом;
4. допускается dictionary-only localization для `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria-label`.

## 4. Tests Added

Обновлен:

```text
tests/crewportglobal-homepage-language.spec.ts
```

Добавлены проверки:

1. valid prebuilt bundle используется для языка `uk`, когда page/chrome dictionaries не имеют значения;
2. invalid bundle игнорируется и сохраняется English fallback;
3. input value не меняется после language switch;
4. placeholder может быть локализован только через dictionary key.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Added validated machine bundle dictionary lookup between chrome translation and English fallback. |
| `tests/crewportglobal-homepage-language.spec.ts` | Added runtime bundle consumption and invalid-bundle fallback browser tests. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 270 to the register. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Recorded implemented runtime bundle consumption rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Recorded CPG-BIZ-075 as implemented methodology. |
| `projects/crewportglobal/README.md` | Updated public-runtime translation notes. |
| `projects/crewportglobal/i18n/README.md` | Updated runtime-bundle consumption notes. |
| `docs/crewportglobal/270_cpg_biz_075_translation_runtime_bundle_consumption_implementation_report.md` | Added this report. |

## 6. Verification

Commands run:

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
npm run check:cpg-i18n-runtime-bundle
npm run check:cpg-i18n
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Result: all pass.

## 7. Non-Scope

This slice does not:

1. enable Google provider in browser;
2. add browser-side provider calls;
3. translate operational form values;
4. publish unreviewed sensitive translated text;
5. change backend, database, auth or deployment configuration.

## 8. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-076 - Controlled runtime bundle publication on selected public pages
```

Цель: определить, где именно static bundle script должен подключаться к public pages, чтобы live pages получили approved machine localization without duplicating runtime logic.

Результат реализации зафиксирован в:

```text
docs/crewportglobal/271_cpg_biz_076_controlled_runtime_bundle_publication_report.md
```
