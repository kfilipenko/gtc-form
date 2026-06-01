# CPG-BIZ-077 - Translation Publication Cache Invalidation Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Основание: продолжение CPG-BIZ-076
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Implemented and verified

## 1. Цель

Цель этапа - заменить ручной query marker для public machine-translation bundle на build-controlled publication version.

Практическая задача: браузер должен получать обновленный bundle после изменения approved source/catalog content, а команда не должна вручную редактировать версию в HTML.

## 2. Реализованное правило

Build command теперь вычисляет стабильную версию публикации:

```text
publication_version
```

Версия записывается в:

```text
projects/crewportglobal/i18n/runtime-bundle/manifest.json
projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js
projects/crewportglobal/public/assets/crewportglobal-machine-translations.js
```

Текущее значение:

```text
02e3d1722d63d321
```

Public pages теперь подключают bundle так:

```html
<script src="/assets/crewportglobal-machine-translations.js?v=02e3d1722d63d321" defer></script>
```

или эквивалентным relative path для generated public documents.

## 3. Cache Invalidation Boundary

`publication_version` строится из:

1. official language;
2. canonical English source catalog hash;
3. approved publish-ready target catalogs;
4. target language list;
5. publication boundary.

Версия не является ручной датой и не должна редактироваться в HTML вручную.

Если approved translations или source catalog меняются, build command пересчитывает `publication_version`, после чего public HTML references должны быть синхронизированы с новой версией.

## 4. Validator Changes

Обновлен:

```text
projects/crewportglobal/scripts/check_translation_runtime_bundle.py
```

Проверки:

1. bundle содержит корректный `publication_version`;
2. manifest содержит тот же `publication_version`;
3. public bundle совпадает с canonical bundle;
4. все public HTML references на `crewportglobal-machine-translations.js` используют текущую версию из manifest;
5. stale или manually mismatched query marker приводит к validation finding.

## 5. Generator Changes

Обновлен:

```text
projects/crewportglobal/scripts/generate_public_pages.py
```

Generated public documents теперь читают `publication_version` из runtime-bundle manifest и вставляют его в machine-bundle script URL.

## 6. Browser Regression

Обновлен:

```text
tests/crewportglobal-homepage-language.spec.ts
```

Тест public pages теперь проверяет:

1. machine bundle загружается раньше shared runtime;
2. script URL содержит текущую `publication_version` из manifest.

## 7. Safety Boundaries

Этап не меняет:

1. backend;
2. database;
3. auth;
4. secrets;
5. Google provider access;
6. official English rule;
7. prohibition on translating completed user form values.

## 8. Verification

Commands run:

```bash
npm run build:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-runtime-bundle
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
npm run check:cpg-i18n
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Result: all pass.

## 9. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/scripts/build_translation_runtime_bundle.py` | Added stable `publication_version` and `source_catalog_hash` emission. |
| `projects/crewportglobal/scripts/check_translation_runtime_bundle.py` | Added manifest/version validation and public HTML version checks. |
| `projects/crewportglobal/scripts/generate_public_pages.py` | Added manifest-driven machine bundle query version for generated documents. |
| `projects/crewportglobal/i18n/runtime-bundle/manifest.json` | Added current `publication_version` and source hash. |
| `projects/crewportglobal/public/**/*.html` | Replaced manual bundle marker with generated publication version. |
| `tests/crewportglobal-homepage-language.spec.ts` | Added public HTML version assertion. |
| `docs/crewportglobal/272_cpg_biz_077_translation_publication_cache_invalidation_report.md` | Added this report. |

## 10. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-078 - Translation publication workflow command
```

Цель: добавить единый командный workflow для rebuild -> version sync -> validation, чтобы публикация machine-localized bundle выполнялась одной проверяемой командой, без ручной синхронизации HTML.
