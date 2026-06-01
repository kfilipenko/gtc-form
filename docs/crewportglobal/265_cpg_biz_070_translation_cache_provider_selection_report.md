# CPG-BIZ-070 - Translation Cache Provider Selection Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-069
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - добавить controlled provider selection в translation cache update command.

`stub` должен оставаться default provider для локальной разработки и тестов.

`google` должен быть доступен только при явном выборе и только после успешной protected credential-source validation.

## 2. Реализация

Команда cache update теперь поддерживает:

```bash
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk --provider stub
```

и:

```bash
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk --provider google
```

Поведение:

1. `--provider stub` является default и работает без Google credentials;
2. `--provider google` вызывает `create_google_translation_provider`;
3. Google provider сначала выполняет protected credential-source validation;
4. при отсутствии или небезопасности credentials команда завершается controlled error и не обновляет cache;
5. Python traceback заменен на понятное operator-facing сообщение.

## 3. Fail-Closed Google Mode

В текущем окружении Google provider не настроен, поэтому команда:

```bash
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru --provider google --no-export
```

ожидаемо завершается с exit code 1 и сообщением:

```text
Translation provider configuration error: Google translation credential source is not valid: google_credentials_not_configured
```

Это правильное поведение: без protected credentials Google mode не должен выполнять cache mutation или сетевой вызов.

## 4. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_cache.py` | Добавлен `select_translation_provider`, CLI choices `stub/google`, fail-closed Google config handling. |
| `projects/crewportglobal/scripts/translation_provider_adapters.py` | Добавлен общий `TranslationProvider` protocol. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 20 проверок, включая provider selection. |
| `projects/crewportglobal/i18n/README.md` | Workflow обновлен с explicit provider selection. |
| `projects/crewportglobal/README.md` | Добавлены команды stub/google cache refresh. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена provider selection rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-070. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен explicit Google mode. |
| `docs/crewportglobal/264_cpg_biz_069_translation_cache_google_client_adapter_report.md` | Обновлен next-stage status. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 265. |

## 5. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_provider_adapters.py projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru --provider stub --no-export
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru --provider google --no-export
npm run check:cpg-translation-credential-source
npm run check:cpg-translation-provider-boundary
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 20 passed.
3. `--provider stub` - passed.
4. `--provider google` without credentials - failed closed with controlled configuration error.
5. `npm run check:cpg-translation-credential-source` - passed; configured=false, findings=0.
6. `npm run check:cpg-translation-provider-boundary` - public credential findings: 0.
7. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
8. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
9. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
10. `git diff --check` - passed.

## 6. Runtime Boundary

Этот этап не меняет:

1. real Google credentials;
2. live translation dictionaries;
3. browser runtime;
4. backend API;
5. database;
6. migrations.

Google provider теперь selectable, но не activated by default.

## 7. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-071 - Translation cache Google dependency and protected environment readiness
```

Цель: определить dependency installation boundary для `google-cloud-translate` и порядок запуска `--provider google` только в protected backend/build environment.

Этот этап выполнен и зафиксирован в:

```text
docs/crewportglobal/266_cpg_biz_071_translation_google_dependency_readiness_report.md
```
