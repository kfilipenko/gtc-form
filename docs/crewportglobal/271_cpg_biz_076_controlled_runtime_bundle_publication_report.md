# CPG-BIZ-076 - Controlled Runtime Bundle Publication Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Основание: продолжение CPG-BIZ-075
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Implemented and verified

## 1. Цель

Цель этапа - подключить prebuilt machine-translation runtime bundle к public pages controlled way, чтобы shared runtime мог использовать approved machine localization на реальных страницах портала.

Этот этап не подключает Google provider в браузере и не меняет правило official English.

## 2. Реализация

Добавлен public runtime bundle artifact:

```text
projects/crewportglobal/public/assets/crewportglobal-machine-translations.js
```

Build command теперь пишет bundle в два места:

1. canonical build artifact:

```text
projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js
```

2. public static artifact:

```text
projects/crewportglobal/public/assets/crewportglobal-machine-translations.js
```

## 3. Loading Order

На страницах, где используется shared runtime:

```text
crewportglobal-public-i18n.js
```

добавлено предварительное подключение:

```html
<script src="/assets/crewportglobal-machine-translations.js?v=20260601-runtime-bundle" defer></script>
```

или эквивалентный relative path для generated public documents.

Правило:

```text
machine bundle script must load before shared public i18n runtime
```

Для `defer` scripts порядок сохранен через порядок script tags.

## 4. Generator And Validation Changes

Изменены:

```text
projects/crewportglobal/scripts/build_translation_runtime_bundle.py
projects/crewportglobal/scripts/check_translation_runtime_bundle.py
projects/crewportglobal/scripts/generate_public_pages.py
```

Build script теперь публикует public asset.

Bundle checker теперь проверяет, что public bundle существует и совпадает с canonical runtime bundle.

Generated public page template теперь включает machine bundle before shared runtime.

## 5. Browser Coverage

Обновлен:

```text
tests/crewportglobal-homepage-language.spec.ts
```

Добавлены проверки:

1. homepage после выбора Ukrainian берет `[uk machine draft] Language` из public machine bundle;
2. все public HTML pages, которые загружают shared runtime, также загружают machine bundle раньше runtime.

## 6. Safety Boundaries

Сохранены границы:

1. browser runtime не вызывает Google или иной provider;
2. browser runtime получает только static dictionary;
3. form values не переводятся;
4. English fallback остается обязательным;
5. sensitive unreviewed strings не попадают в publish-ready bundle.

## 7. Verification

Commands run:

```bash
npm run build:cpg-i18n-runtime-bundle
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
npm run check:cpg-i18n-runtime-bundle
npm run check:cpg-i18n
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Result: all pass.

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-machine-translations.js` | Added public static machine translation bundle. |
| `projects/crewportglobal/scripts/build_translation_runtime_bundle.py` | Added public bundle output. |
| `projects/crewportglobal/scripts/check_translation_runtime_bundle.py` | Added public bundle existence/content check. |
| `projects/crewportglobal/scripts/generate_public_pages.py` | Added generated-page bundle script before shared runtime. |
| `projects/crewportglobal/public/**/*.html` | Added machine bundle script before shared runtime where applicable. |
| `tests/crewportglobal-homepage-language.spec.ts` | Added public bundle publication and ordering tests. |
| `docs/crewportglobal/271_cpg_biz_076_controlled_runtime_bundle_publication_report.md` | Added this report. |

## 9. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-077 - Translation publication cache invalidation and versioning cleanup
```

Цель: заменить ручной query version marker на build-controlled version/hash, чтобы browser cache обновлялся вместе с изменением bundle или source catalog.
