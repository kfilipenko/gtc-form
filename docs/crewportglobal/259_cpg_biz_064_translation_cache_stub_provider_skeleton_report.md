# CPG-BIZ-064 - Translation Cache Stub Provider Skeleton Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-063
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - реализовать первый безопасный слой translation cache без подключения Google credentials и без изменения runtime сайта.

Это нужно, чтобы до реального провайдера проверить:

1. cache miss;
2. cache hit;
3. source hash invalidation;
4. status `stale`;
5. export catalog generation;
6. human-review marker for sensitive keys.

## 2. Что реализовано

Добавлен file-backed translation cache skeleton:

```text
projects/crewportglobal/scripts/translation_cache.py
```

Скрипт:

1. читает canonical English source catalog из `projects/crewportglobal/i18n/en.json`;
2. считает `source_text_hash`;
3. обновляет `projects/crewportglobal/i18n/translation-cache.json`;
4. использует только deterministic `stub` provider;
5. помечает старые записи как `stale`, если английский текст изменился;
6. создает machine draft entries для target languages;
7. помечает sensitive keys как `review_required`;
8. экспортирует inspection catalogs в `projects/crewportglobal/i18n/cache-export/`.

## 3. Cache artifacts

Созданы:

```text
projects/crewportglobal/i18n/translation-cache.json
projects/crewportglobal/i18n/cache-export/ru.json
projects/crewportglobal/i18n/cache-export/pt.json
projects/crewportglobal/i18n/cache-export/uk.json
```

Эти файлы пока не подключены к live runtime.

Они нужны для проверки структуры, статусов и будущей publish-time интеграции.

## 4. Security boundary

Google API не подключался.

Credentials не создавались, не читались и не добавлялись.

Frontend не изменялся и не вызывает translation provider.

Текущий provider:

```text
stub
```

## 5. Проверка

Добавлен unit-test:

```text
projects/crewportglobal/scripts/test_translation_cache.py
```

Проверяет:

1. cache miss создает draft entries;
2. cache hit не создает дубликаты;
3. изменение source text переводит старую запись в `stale`;
4. sensitive keys получают `review_required`;
5. export не включает stale entries.

Добавлен npm script:

```text
npm run check:cpg-i18n-cache
```

## 6. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_cache.py` | Добавлен file-backed cache updater/exporter со stub provider. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Добавлены unit tests для cache behavior. |
| `projects/crewportglobal/i18n/translation-cache.json` | Создан первый cache artifact. |
| `projects/crewportglobal/i18n/cache-export/*.json` | Созданы inspection export catalogs. |
| `projects/crewportglobal/i18n/README.md` | Описан новый cache workflow. |
| `projects/crewportglobal/README.md` | Добавлена ссылка на cache skeleton и проверку. |
| `projects/crewportglobal/scripts/check_public_i18n.js` | Validator уточнен: `translation-cache.json` не считается language catalog. |
| `package.json` | Добавлен `check:cpg-i18n-cache`. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена stub-first implementation rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован реализованный skeleton. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | Зафиксирован implementation artifact set. |
| `docs/crewportglobal/258_cpg_biz_063_google_machine_localization_cache_backend_design.md` | Отмечено, что следующий этап реализован. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 259. |

## 7. Команды проверки

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/test_translation_cache.py
python3 projects/crewportglobal/scripts/test_translation_cache.py
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk
npm run check:cpg-i18n-cache
npm run check:cpg-i18n
git diff --check
```

## 8. Результат

Стандарт машинной локализации получил безопасный первый программный слой.

Теперь можно тестировать и развивать translation cache как reusable module без копирования логики и без риска утечки provider credentials.

Фактические результаты проверки:

1. Python compile check - passed.
2. Translation cache unit tests - 5 passed.
3. Первый cache update создал 39 записей для `ru`, `pt`, `uk`.
4. Повторный cache update показал `created=0`, `cache_hits=39`, `stale=0`.
5. `npm run check:cpg-i18n-cache` - 5 passed.
6. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
7. `git diff --check` - passed.

## 9. Следующий этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-065 - Translation cache stale-source validator and publish-gate report
```

Цель: добавить validator, который будет явно показывать stale translations, review-required translations и запрещать publish-time export для regulated text без review.

Status update:

```text
CPG-BIZ-065 implemented in docs/crewportglobal/260_cpg_biz_065_translation_cache_publish_gate_report.md.
```
