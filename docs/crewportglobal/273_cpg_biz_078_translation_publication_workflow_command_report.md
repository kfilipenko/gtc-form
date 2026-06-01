# CPG-BIZ-078 - Translation Publication Workflow Command Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Implementation report
- Основание: продолжение CPG-BIZ-077
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Implemented and verified

## 1. Цель

Цель этапа - заменить ручную последовательность публикации machine-translation runtime bundle одной проверяемой командой.

До этого команда должна была отдельно:

1. пересобрать bundle;
2. синхронизировать `publication_version` в HTML;
3. запустить проверки.

Теперь эти действия объединены в один controlled workflow.

## 2. Новый Workflow

Добавлена команда:

```bash
npm run publish:cpg-i18n-runtime-bundle
```

Команда выполняет:

1. build canonical runtime bundle;
2. build public static bundle;
3. read `publication_version` from manifest;
4. synchronize all public HTML references to:

```text
crewportglobal-machine-translations.js?v={publication_version}
```

5. validate canonical/public bundle consistency;
6. validate public HTML query markers;
7. run public i18n coverage check.

Если `publication_version` не изменилась, build сохраняет прежний `generated_at` из manifest. Это делает повторный запуск workflow идемпотентным и не создает лишний git diff без изменения approved translation content.

## 3. Implementation

Добавлен:

```text
projects/crewportglobal/scripts/publish_translation_runtime_bundle.py
```

Скрипт использует уже реализованные стандарты:

1. `build_translation_runtime_bundle.py`;
2. `check_translation_runtime_bundle.py`;
3. `check_public_i18n.js`.

Новый workflow не копирует правила проверки, а связывает существующие модули в один операционный шаг.

## 4. Command Registration

Обновлен:

```text
package.json
```

Добавлен script:

```json
"publish:cpg-i18n-runtime-bundle": "python3 projects/crewportglobal/scripts/publish_translation_runtime_bundle.py"
```

## 5. Safety Boundaries

Workflow не меняет:

1. backend;
2. database;
3. auth;
4. secrets;
5. Google provider access;
6. browser runtime provider boundary;
7. rule that user-entered form values are not translated.

## 6. Verification

Commands run:

```bash
npm run publish:cpg-i18n-runtime-bundle
python3 -m py_compile projects/crewportglobal/scripts/publish_translation_runtime_bundle.py
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
npm run check:cpg-i18n-runtime-bundle
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
git diff --check
```

Result: all pass.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/scripts/publish_translation_runtime_bundle.py` | Added build-sync-validate workflow command. |
| `projects/crewportglobal/scripts/build_translation_runtime_bundle.py` | Preserves `generated_at` when publication content/version has not changed. |
| `package.json` | Added `publish:cpg-i18n-runtime-bundle`. |
| `projects/crewportglobal/README.md` | Documented the standard publication command. |
| `projects/crewportglobal/i18n/README.md` | Documented runtime bundle publication workflow. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Added mandatory one-command publication rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Recorded CPG-BIZ-078 implementation. |
| `docs/crewportglobal/273_cpg_biz_078_translation_publication_workflow_command_report.md` | Added this report. |

## 8. Next Stage

Следующий этап выполнен:

```text
CPG-BIZ-079 - Translation publication workflow CI/read-only guard
```

Результат зафиксирован в:

```text
docs/crewportglobal/274_cpg_biz_079_translation_publication_read_only_guard_report.md
```
