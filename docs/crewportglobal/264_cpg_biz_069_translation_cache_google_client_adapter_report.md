# CPG-BIZ-069 - Translation Cache Google Client Adapter Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-068
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - реализовать защищенный backend/build Google client adapter за уже утвержденной credential-source boundary.

Этот этап не включает реальные Google credentials, не выполняет сетевые вызовы к Google в текущем окружении и не подключает Google provider к live runtime.

## 2. Implementation Model

`GoogleTranslationProviderAdapter` теперь поддерживает protected client path:

```text
validate_google_credential_source
-> create_google_translation_provider
-> GoogleTranslationProviderAdapter.translate
-> backend/build TranslationServiceClient.translate_text
```

Без валидного credential source provider не создается.

Без backend/build client и project id метод `translate()` завершается controlled error.

Для тестов используется injected fake client. Это позволяет проверить request contract без сети и без real credentials.

## 3. Google Request Contract

Adapter формирует request:

```text
contents: [source_text]
source_language_code: en
target_language_code: ru / pt / uk / ...
parent: projects/{GOOGLE_CLOUD_PROJECT}/locations/global
mime_type: text/plain
```

Returned translation читается из:

```text
response.translations[0].translated_text
```

или из equivalent mapping shape.

## 4. Safety Controls

Сохраняются следующие ограничения:

1. browser runtime не вызывает Google provider;
2. public tree не содержит credentials или Google translation endpoints;
3. `GOOGLE_APPLICATION_CREDENTIALS` должен быть protected absolute path outside repository/public tree;
4. `GOOGLE_CLOUD_PROJECT` обязателен для Google mode;
5. local default остается stub provider;
6. tests не используют сеть и не требуют Google dependency.

Если dependency `google-cloud-translate` отсутствует, provider creation сообщает controlled error и не делает fallback к небезопасному runtime path.

## 5. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_provider_adapters.py` | Добавлен `create_google_translation_provider` и protected Google `translate_text` request path. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 17 проверок, включая injected fake Google client и invalid credential pre-block. |
| `projects/crewportglobal/i18n/README.md` | Описан protected backend/build Google client path. |
| `projects/crewportglobal/README.md` | Обновлен статус Google adapter. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена protected Google client adapter rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-069. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен provider-selection next step. |
| `docs/crewportglobal/263_cpg_biz_068_translation_cache_google_credential_source_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 264. |

## 6. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_provider_adapters.py projects/crewportglobal/scripts/test_translation_cache.py projects/crewportglobal/scripts/translation_cache.py
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
2. `npm run check:cpg-i18n-cache` - 17 passed.
3. `npm run check:cpg-translation-credential-source` - passed; configured=false, findings=0.
4. `npm run check:cpg-translation-provider-boundary` - public credential findings: 0.
5. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
6. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
7. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
8. `git diff --check` - passed.

## 7. Runtime Boundary

Этот этап не меняет:

1. real Google credentials;
2. default cache update provider;
3. live translation dictionaries;
4. browser runtime;
5. backend API;
6. database;
7. migrations.

## 8. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-070 - Translation cache provider selection in cache update command
```

Цель: добавить controlled provider selection в cache update command, где `stub` остается default, а `google` доступен только после успешной credential-source validation в protected backend/build environment.
