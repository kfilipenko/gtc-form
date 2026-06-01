# CPG-BIZ-068 - Translation Cache Google Credential Source Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-067
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - выбрать и зафиксировать защищенный источник Google credentials для будущего подключения Google Cloud Translation API.

Решение: credentials должны поступать только из protected server/CI environment, не из public files, не из committed config и не из browser runtime.

На этом этапе реальные Google credentials не добавлялись и Google API не вызывался.

## 2. Approved Credential Source

Для будущего Google provider утверждена следующая модель:

```text
GOOGLE_APPLICATION_CREDENTIALS=/protected/server/path/cpg-google-translate.json
GOOGLE_CLOUD_PROJECT=protected-google-project-id
```

Правила:

1. `GOOGLE_APPLICATION_CREDENTIALS` должен быть абсолютным путем;
2. путь должен находиться вне repository root;
3. путь должен находиться вне public web tree;
4. service account JSON не должен коммититься в git;
5. `GOOGLE_CLOUD_PROJECT` должен задаваться через environment;
6. frontend/browser code не должен знать эти значения;
7. local development может оставаться без Google credentials и использовать stub provider.

## 3. Реализация

Добавлена функция:

```text
validate_google_credential_source()
```

в:

```text
projects/crewportglobal/scripts/translation_provider_adapters.py
```

Добавлен CLI validator:

```text
projects/crewportglobal/scripts/check_translation_credential_source.py
```

Команда:

```bash
npm run check:cpg-translation-credential-source
```

Обычный режим разрешает отсутствие Google credentials, потому что текущий рабочий режим использует stub provider.

Для deployment, где Google provider должен быть включен, команда может запускаться как:

```bash
python3 projects/crewportglobal/scripts/check_translation_credential_source.py --require-config
```

## 4. Failure Conditions

Validator сообщает ошибку, если:

1. включен `--require-config`, но credentials отсутствуют;
2. задан `GOOGLE_CLOUD_PROJECT`, но отсутствует `GOOGLE_APPLICATION_CREDENTIALS`;
3. задан `GOOGLE_APPLICATION_CREDENTIALS`, но отсутствует `GOOGLE_CLOUD_PROJECT`;
4. path credentials не абсолютный;
5. path credentials находится внутри repository root;
6. path credentials находится внутри public web tree.

Validator не печатает значение credentials path и не читает секретные данные.

## 5. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_provider_adapters.py` | Добавлена `validate_google_credential_source`. |
| `projects/crewportglobal/scripts/check_translation_credential_source.py` | Добавлен CLI для проверки protected credential source. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 15 проверок. |
| `package.json` | Добавлен `check:cpg-translation-credential-source`. |
| `projects/crewportglobal/i18n/README.md` | Описан protected credential workflow. |
| `projects/crewportglobal/README.md` | Добавлена команда credential-source check. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена protected credential source rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-068. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен credential-source validation artifact. |
| `docs/crewportglobal/262_cpg_biz_067_translation_cache_google_provider_boundary_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 263. |

## 6. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_provider_adapters.py projects/crewportglobal/scripts/check_translation_credential_source.py projects/crewportglobal/scripts/check_translation_provider_boundary.py projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
npm run check:cpg-translation-credential-source
npm run check:cpg-translation-provider-boundary
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 15 passed.
3. `npm run check:cpg-translation-credential-source` - passed; configured=false, findings=0.
4. `npm run check:cpg-translation-provider-boundary` - public credential findings: 0.
5. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
6. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
7. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
8. `git diff --check` - passed.

## 7. Runtime Boundary

Этот этап не меняет:

1. real Google credentials;
2. Google API client;
3. provider network calls;
4. browser runtime;
5. live translation dictionaries;
6. backend API;
7. database;
8. migrations.

## 8. Next Stage

Следующий этап выполнен и зафиксирован в:

```text
docs/crewportglobal/264_cpg_biz_069_translation_cache_google_client_adapter_report.md
```

Он добавил protected Google client adapter за уже проверенным credential-source boundary.

Следующий рекомендуемый этап после CPG-BIZ-069:

```text
CPG-BIZ-070 - Translation cache provider selection in cache update command
```

Цель: добавить provider selection в cache update command так, чтобы `stub` оставался default для локальных тестов, а `google` был доступен только в protected backend/build environment.
