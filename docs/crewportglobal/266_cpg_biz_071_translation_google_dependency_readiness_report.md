# CPG-BIZ-071 - Translation Google Dependency Readiness Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-070
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - подготовить защищенный readiness gate для будущего запуска Google machine translation provider.

Этап не включает реальные Google credentials, не выполняет сетевой вызов к Google и не делает Google dependency обязательной для локальной разработки или public runtime.

## 2. Реализация

Добавлен отдельный проверочный контур:

```bash
npm run check:cpg-translation-google-readiness
```

Он проверяет:

1. что Google provider остается backend/build-only;
2. установлен ли Python module `google.cloud.translate_v3`;
3. настроены ли protected credential environment variables;
4. готова ли среда к запуску `translation_cache.py --provider google`.

Локальный режим не блокируется, если Google dependency и credentials отсутствуют:

```text
ready=False
findings: 0
```

Для protected backend/build environment используется строгий режим:

```bash
python3 projects/crewportglobal/scripts/check_translation_google_readiness.py --require-google
```

В строгом режиме отсутствие dependency или credentials становится blocking finding.

## 3. Dependency Boundary

Google dependency вынесена в отдельный файл:

```text
projects/crewportglobal/requirements.translation-google.txt
```

Содержимое:

```text
google-cloud-translate>=3,<4
```

Это означает:

1. public runtime не зависит от Google SDK;
2. обычный локальный `requirements.txt` не получает Google dependency;
3. dependency устанавливается только в protected backend/build окружении;
4. запуск `--provider google` остается невозможным без protected credentials.

## 4. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_provider_adapters.py` | Добавлен `check_google_provider_readiness`. |
| `projects/crewportglobal/scripts/check_translation_google_readiness.py` | Добавлен CLI readiness checker для Google dependency и protected environment. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 23 проверок. |
| `projects/crewportglobal/requirements.translation-google.txt` | Добавлен optional dependency файл для protected Google mode. |
| `package.json` | Добавлен `check:cpg-translation-google-readiness`. |
| `projects/crewportglobal/i18n/README.md` | Описан readiness workflow и dependency boundary. |
| `projects/crewportglobal/README.md` | Добавлены команды readiness и protected dependency install. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена dependency-readiness rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован CPG-BIZ-071. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен protected readiness validation. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 266. |

## 5. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_provider_adapters.py projects/crewportglobal/scripts/check_translation_credential_source.py projects/crewportglobal/scripts/check_translation_provider_boundary.py projects/crewportglobal/scripts/check_translation_google_readiness.py projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/validate_translation_cache.py projects/crewportglobal/scripts/review_translation_cache.py projects/crewportglobal/scripts/export_translation_publish_ready.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
npm run check:cpg-translation-google-readiness
python3 projects/crewportglobal/scripts/check_translation_google_readiness.py --require-google
npm run check:cpg-translation-credential-source
npm run check:cpg-translation-provider-boundary
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 23 passed.
3. `npm run check:cpg-translation-google-readiness` - passed in local non-blocking mode.
4. Strict `--require-google` mode - expected controlled fail with 2 findings.
5. `npm run check:cpg-translation-credential-source` - passed; configured=false, findings=0.
6. `npm run check:cpg-translation-provider-boundary` - public credential findings: 0.
7. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
8. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
9. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
10. `git diff --check` - passed.

Локальный readiness result:

```text
dependency_installed=False
credentials_configured=False
ready=False
findings: 0
```

Это ожидаемый результат: текущая среда не предназначена для реального Google provider call.

Strict protected-environment result in the current local environment:

```text
findings: 2
google_credentials_not_configured
google_cloud_translate_dependency_missing
```

Это также ожидаемый результат: до настройки protected environment запуск Google provider должен быть заблокирован.

## 6. Runtime Boundary

Этот этап не меняет:

1. browser runtime;
2. live translation dictionaries;
3. backend API;
4. database;
5. migrations;
6. Google credentials;
7. production translation provider activation.

## 7. Protected Environment Activation Rule

Перед первым реальным Google cache update protected environment должна пройти:

```bash
python3 projects/crewportglobal/scripts/check_translation_credential_source.py --require-config
python3 projects/crewportglobal/scripts/check_translation_google_readiness.py --require-google
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk --provider google
```

Если первые две команды не проходят, cache update через Google выполнять нельзя.

## 8. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-072 - Translation cache protected Google smoke test plan
```

Цель: подготовить пошаговый smoke-test сценарий для защищенной среды, где будут настроены credentials и dependency, но publication в live runtime все еще останется отдельным approval gate.
