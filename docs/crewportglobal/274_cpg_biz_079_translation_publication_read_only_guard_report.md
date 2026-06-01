# CPG-BIZ-079 - Translation Publication Read-Only Guard Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Основание: продолжение CPG-BIZ-078
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Implemented and verified

## 1. Цель

Цель этапа - добавить read-only guard для CI/release review после стандартной публикации machine-translation runtime bundle.

Guard должен подтверждать, что:

1. runtime bundle остается валидным;
2. public bundle совпадает с canonical runtime artifact;
3. public HTML references используют текущий `publication_version`;
4. опубликованные machine-translation entries остаются допустимыми по publish-ready политике translation cache;
5. unreviewed sensitive translations не попадают в public runtime bundle;
6. проверка не изменяет файлы.

## 2. Новый Guard

Добавлена команда:

```bash
npm run check:cpg-i18n-publication-guard
```

Команда запускает:

```text
projects/crewportglobal/scripts/check_translation_publication_guard.py
```

Guard выполняет только чтение:

1. `projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js`;
2. `projects/crewportglobal/i18n/runtime-bundle/manifest.json`;
3. `projects/crewportglobal/public/assets/crewportglobal-machine-translations.js`;
4. `projects/crewportglobal/public/**/*.html`;
5. `projects/crewportglobal/i18n/translation-cache.json`.

## 3. Implementation

Существующий validator:

```text
projects/crewportglobal/scripts/check_translation_runtime_bundle.py
```

обновлен так, чтобы его runtime validation logic была доступна как переиспользуемая функция:

```text
collect_runtime_bundle_findings(...)
```

Это исключает копирование логики проверки bundle / manifest / public HTML.

Новый guard добавляет поверх нее publish-ready контроль:

```text
bundle catalogs == export_publish_ready_catalogs(translation-cache, target_languages)
```

Если bundle содержит entry, которого нет в publish-ready export, guard возвращает ошибку:

```text
bundle_entry_not_publish_ready:{language}:{key}
```

Если publish-ready cache содержит entry, которого нет в bundle, guard возвращает:

```text
bundle_missing_publish_ready_entry:{language}:{key}
```

Если ключ есть в обеих сторонах, но значение отличается:

```text
bundle_entry_value_mismatch:{language}:{key}
```

## 4. Safety Boundaries

Этот этап не меняет:

1. backend;
2. database;
3. auth;
4. secrets;
5. Google provider access;
6. browser runtime provider boundary;
7. rule that user-entered form values are not translated.

Guard не вызывает:

1. Google API;
2. translation provider;
3. cache update;
4. bundle build;
5. HTML synchronization.

## 5. Command Registration

Обновлен:

```text
package.json
```

Добавлен script:

```json
"check:cpg-i18n-publication-guard": "python3 projects/crewportglobal/scripts/check_translation_publication_guard.py"
```

## 6. Verification

Commands run:

```bash
python3 -m py_compile projects/crewportglobal/scripts/check_translation_runtime_bundle.py projects/crewportglobal/scripts/check_translation_publication_guard.py
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-runtime-bundle
npm run publish:cpg-i18n-runtime-bundle
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-runtime-bundle
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Result: all pass.

Current guard output:

```text
runtime_findings: 0
publish_ready_findings: 0
findings: 0
```

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/scripts/check_translation_publication_guard.py` | Added read-only publication guard. |
| `projects/crewportglobal/scripts/check_translation_runtime_bundle.py` | Extracted reusable runtime validation function. |
| `package.json` | Added `check:cpg-i18n-publication-guard`. |
| `projects/crewportglobal/README.md` | Documented read-only publication guard command. |
| `projects/crewportglobal/i18n/README.md` | Documented guard inside translation workflow. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Added guard rule and validation entrypoint. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Recorded CPG-BIZ-079 implementation. |
| `docs/crewportglobal/273_cpg_biz_078_translation_publication_workflow_command_report.md` | Marked next stage as completed. |
| `docs/crewportglobal/274_cpg_biz_079_translation_publication_read_only_guard_report.md` | Added this report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 274 to register. |

## 8. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-080 - Translation publication CI wiring and release checklist
```

Цель: подключить read-only guard к стандартному release checklist / CI sequence, чтобы публикация локализации всегда проходила через:

1. publish workflow;
2. read-only guard;
3. focused browser regression;
4. documentation/report update.
