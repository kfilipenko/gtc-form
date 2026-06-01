# CPG-BIZ-067 - Translation Cache Google Provider Boundary Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-066
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - подготовить Google translation provider boundary перед реальным подключением Google Cloud Translation API.

На этом этапе не подключались реальные Google credentials, не выполнялись сетевые запросы к Google и не менялся public runtime.

Задача этапа: сделать так, чтобы будущий Google provider был возможен только через backend/build adapter, а не через браузерный JavaScript.

## 2. Реализация

Добавлен provider adapter module:

```text
projects/crewportglobal/scripts/translation_provider_adapters.py
```

В нем определены:

1. `StubTranslationProvider` - текущий deterministic provider для тестов и локальной разработки;
2. `GoogleTranslationProviderAdapter` - placeholder для будущего Google provider;
3. `boundary_status()` - явное описание backend/build-only границы;
4. защитное поведение `translate()`, которое запрещает использовать Google adapter до отдельного approved implementation slice.

Добавлен provider boundary checker:

```text
projects/crewportglobal/scripts/check_translation_provider_boundary.py
```

Команда:

```bash
npm run check:cpg-translation-provider-boundary
```

Проверка сканирует public tree и блокирует признаки:

1. `GOOGLE_APPLICATION_CREDENTIALS`;
2. `GOOGLE_CLOUD_PROJECT`;
3. Google API key marker `AIza`;
4. private key markers;
5. service account `client_email`;
6. browser-side references to Google translation endpoints.

## 3. Boundary Rule

Google translation provider разрешен только как:

```text
backend_or_build_only
```

Запрещено размещать в public tree:

1. Google credentials;
2. Google project id;
3. service account JSON;
4. API keys;
5. direct calls to Google translation endpoints;
6. frontend code, который вызывает provider напрямую.

Реальное подключение Google API должно быть отдельным этапом после выбора защищенного источника credentials.

## 4. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_provider_adapters.py` | Добавлен adapter module со stub provider и Google boundary placeholder. |
| `projects/crewportglobal/scripts/check_translation_provider_boundary.py` | Добавлен public-tree credential/API boundary checker. |
| `projects/crewportglobal/scripts/translation_cache.py` | `StubTranslationProvider` вынесен в общий adapter module. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 12 проверок, включая Google provider boundary placeholder. |
| `package.json` | Добавлен `check:cpg-translation-provider-boundary`. |
| `projects/crewportglobal/i18n/README.md` | Добавлен provider-boundary workflow. |
| `projects/crewportglobal/README.md` | Добавлена команда provider-boundary check. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Добавлено правило Google provider boundary. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-067. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен Google adapter boundary artifact. |
| `docs/crewportglobal/261_cpg_biz_066_translation_cache_human_review_publish_export_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 262. |

## 5. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_provider_adapters.py projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/validate_translation_cache.py projects/crewportglobal/scripts/check_translation_provider_boundary.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
npm run check:cpg-translation-provider-boundary
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 12 passed.
3. `npm run check:cpg-translation-provider-boundary` - public credential findings: 0.
4. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
5. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
6. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
7. `git diff --check` - passed.

## 6. Runtime Boundary

Этот этап не меняет:

1. Google credentials;
2. provider network calls;
3. browser runtime;
4. live translation dictionaries;
5. backend API;
6. database;
7. migrations;
8. auth/session behavior.

Google adapter сейчас является только защищенной точкой будущей интеграции.

## 7. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-068 - Translation cache protected Google credential source decision
```

Цель: выбрать, где именно в deployment/CI/server environment будут храниться Google credentials, и только после этого подключать реальный Google client за уже проверенным adapter boundary.
