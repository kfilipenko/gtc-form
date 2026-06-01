# CPG-BIZ-073 - Translation Runtime Bundle Emission Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-072
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - создать контролируемый emission artifact из `publish-ready-export` для будущего runtime dictionary bundle.

Этот этап не подключает bundle к live browser runtime. Он только создает и проверяет prebuilt artifact, который может быть подключен отдельным утвержденным этапом.

## 2. Реализация

Добавлена команда сборки:

```bash
npm run build:cpg-i18n-runtime-bundle
```

Она читает:

```text
projects/crewportglobal/i18n/publish-ready-export/*.json
```

и создает:

```text
projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js
projects/crewportglobal/i18n/runtime-bundle/manifest.json
```

JS artifact присваивает данные в:

```text
window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE
```

Это prebuilt dictionary artifact, а не provider call.

## 3. Validation

Добавлена команда проверки:

```bash
npm run check:cpg-i18n-runtime-bundle
```

Проверка подтверждает:

1. approved global assignment shape;
2. official language remains `en`;
3. target language list matches catalogs;
4. catalogs are non-empty;
5. browser provider calls are disabled;
6. form value translation is disabled;
7. sensitive text human-review gate remains recorded;
8. manifest matches bundle boundary.

## 4. Runtime Boundary

Bundle generation не меняет:

1. `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js`;
2. homepage-local dictionaries;
3. generated public HTML;
4. browser runtime loading behavior;
5. Google provider credentials;
6. backend API;
7. database;
8. migrations.

Следующий этап должен отдельно решить, когда и как browser runtime будет читать этот bundle.

## 5. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/build_translation_runtime_bundle.py` | Добавлена сборка prebuilt runtime bundle из publish-ready catalogs. |
| `projects/crewportglobal/scripts/check_translation_runtime_bundle.py` | Добавлена проверка bundle shape и safety boundary. |
| `projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js` | Создан prebuilt JS bundle artifact. |
| `projects/crewportglobal/i18n/runtime-bundle/manifest.json` | Создан manifest с counts и runtime boundary. |
| `package.json` | Добавлены `build:cpg-i18n-runtime-bundle` и `check:cpg-i18n-runtime-bundle`. |
| `projects/crewportglobal/README.md` | Добавлены команды build/check runtime bundle. |
| `projects/crewportglobal/i18n/README.md` | Описан runtime-bundle directory и workflow. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена bundle emission rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-073. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен runtime bundle emission artifacts. |
| `docs/crewportglobal/267_cpg_biz_072_translation_google_protected_smoke_test_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 268. |

## 6. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/build_translation_runtime_bundle.py projects/crewportglobal/scripts/check_translation_runtime_bundle.py
npm run build:cpg-i18n-publish-ready
npm run build:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-cache
npm run check:cpg-i18n-cache-report
npm run check:cpg-i18n
npm run check:cpg-translation-provider-boundary
git diff --check
```

Результаты:

1. Python compile - passed.
2. Publish-ready export - 11 entries for `pt`, `ru`, `uk`.
3. Runtime bundle build - 11 entries bundled for `pt`, `ru`, `uk`.
4. Runtime bundle validation - findings 0.
5. Translation cache tests - 23 passed.
6. Cache report - passed with controlled review-required findings.
7. Public i18n check - English canonical coverage complete.
8. Provider boundary - public credential findings: 0.
9. `git diff --check` - passed.

## 7. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-074 - Translation runtime bundle consumption design
```

Цель: спроектировать, как shared public i18n runtime будет подключать prebuilt bundle, сохранять English fallback и не переводить user-entered operational form data.

Этот этап выполнен и зафиксирован в:

```text
docs/crewportglobal/269_cpg_biz_074_translation_runtime_bundle_consumption_design.md
```
