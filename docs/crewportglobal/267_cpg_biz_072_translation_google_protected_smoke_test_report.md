# CPG-BIZ-072 - Translation Google Protected Smoke Test Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-071
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - подготовить безопасный smoke-test для первого реального Google provider call в protected backend/build environment.

Smoke-test должен:

1. проверять readiness до provider call;
2. переводить только один approved English source key;
3. использовать только один target language;
4. не изменять repository translation cache;
5. не публиковать результат в live runtime;
6. останавливаться до provider call, если credentials или dependency отсутствуют.

## 2. Реализация

Добавлен CLI:

```bash
npm run smoke:cpg-translation-google-provider
```

Непосредственная команда:

```bash
python3 projects/crewportglobal/scripts/smoke_translation_google_provider.py --key site.tagline --target ru
```

Smoke-test выполняет:

1. `check_google_provider_readiness(..., require_google=True)`;
2. pre-block при любых findings;
3. загрузку `projects/crewportglobal/i18n/en.json`;
4. выбор одного source key;
5. создание Google provider через уже утвержденную protected provider selection;
6. in-memory `update_cache` только для одного ключа и одного языка;
7. вывод safe result metadata без записи в cache-файл.

## 3. No-Mutation Boundary

Smoke-test не пишет:

1. `projects/crewportglobal/i18n/translation-cache.json`;
2. `projects/crewportglobal/i18n/cache-export/`;
3. `projects/crewportglobal/i18n/publish-ready-export/`;
4. browser runtime dictionaries;
5. public HTML/JS.

Результат существует только в памяти процесса.

## 4. Protected Environment Procedure

В protected backend/build environment порядок запуска:

```bash
python3 -m pip install -r projects/crewportglobal/requirements.translation-google.txt
export GOOGLE_APPLICATION_CREDENTIALS=/protected/path/outside/repo/google-translate.json
export GOOGLE_CLOUD_PROJECT=crewportglobal-localization
python3 projects/crewportglobal/scripts/check_translation_credential_source.py --require-config
python3 projects/crewportglobal/scripts/check_translation_google_readiness.py --require-google
python3 projects/crewportglobal/scripts/smoke_translation_google_provider.py --key site.tagline --target ru
```

После успешного smoke-test можно отдельно утверждать реальный cache update:

```bash
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk --provider google
```

Этот cache update остается отдельным approval gate.

## 5. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/smoke_translation_google_provider.py` | Добавлен protected one-key in-memory Google provider smoke-test. |
| `package.json` | Добавлен `smoke:cpg-translation-google-provider`. |
| `projects/crewportglobal/README.md` | Добавлена smoke-test команда. |
| `projects/crewportglobal/i18n/README.md` | Описан protected one-key smoke workflow. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена smoke-test boundary rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-072. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен smoke-test перед real cache update. |
| `docs/crewportglobal/266_cpg_biz_071_translation_google_dependency_readiness_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 267. |

## 6. Verification

В текущем локальном окружении Google credentials и dependency отсутствуют, поэтому smoke-test должен остановиться до provider call.

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/smoke_translation_google_provider.py projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/translation_provider_adapters.py
npm run smoke:cpg-translation-google-provider
npm run check:cpg-translation-google-readiness
npm run check:cpg-i18n-cache
npm run check:cpg-translation-credential-source
npm run check:cpg-translation-provider-boundary
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Expected local smoke result:

```text
ready=False
findings: 2
google_credentials_not_configured
google_cloud_translate_dependency_missing
Smoke test stopped before provider call.
```

Other results:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 23 passed.
3. Google readiness local mode - passed with `ready=False`, findings 0.
4. Credential source check - passed; configured=false, findings=0.
5. Provider boundary check - public credential findings: 0.
6. Cache report - passed with controlled review-required findings.
7. Publish-ready export - exported 11 entries for `pt`, `ru`, `uk`.
8. Public i18n check - English canonical coverage complete.
9. `git diff --check` - passed.

## 7. Runtime Boundary

Этот этап не меняет:

1. Google credentials;
2. live translation dictionaries;
3. browser runtime;
4. backend API;
5. database;
6. migrations.

## 8. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-073 - Translation cache runtime bundle emission plan
```

Цель: определить, как publish-ready export будет превращаться в prebuilt runtime dictionary bundle после human-review gate, без браузерных provider calls и без перевода пользовательских данных.

Этот этап выполнен и зафиксирован в:

```text
docs/crewportglobal/268_cpg_biz_073_translation_runtime_bundle_emission_report.md
```
