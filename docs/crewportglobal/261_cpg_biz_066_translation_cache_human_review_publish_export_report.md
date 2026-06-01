# CPG-BIZ-066 - Translation Cache Human Review And Publish Export Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-065
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - добавить controlled workflow для перевода cache entries из machine draft / review-required состояния в human-reviewed состояние и подготовить отдельный publish-ready export.

Этот этап нужен, чтобы sensitive translations не попадали в будущие runtime bundles без human review.

Sensitive entries включают complaint, no-fee, legal, privacy, consent, terms и другие regulated или user-trust тексты.

## 2. Реализация

Добавлены две операции:

1. отметка cache entries как reviewed;
2. экспорт только publish-ready entries.

Команда отметки human review:

```bash
python3 projects/crewportglobal/scripts/review_translation_cache.py --keys nav.complaints --targets ru --reviewed-by reviewer-user-id
```

Команда publish-ready export:

```bash
npm run build:cpg-i18n-publish-ready
```

Publish-ready export сохраняется в:

```text
projects/crewportglobal/i18n/publish-ready-export/
```

## 3. Review Marking Rule

Запись может быть помечена как `reviewed` только если:

1. translation key явно передан в команду;
2. target language явно передан в команду;
3. provider совпадает;
4. entry не является `stale`;
5. source hash в cache совпадает с текущим canonical English source в `en.json`;
6. указан `reviewed_by_user_id`.

После отметки entry получает:

```text
translation_status = reviewed
human_review_required = false
reviewed_by_user_id
reviewed_at
updated_at
```

## 4. Publish-Ready Export Policy

Publish-ready export включает:

1. обычные low-risk `draft_machine` UI entries;
2. sensitive entries только после статуса `reviewed`.

Publish-ready export исключает:

1. `stale` entries;
2. `review_required` entries;
3. unreviewed sensitive entries;
4. rejected entries.

Текущий результат export:

```text
ru: 11 publish-ready entries
pt: 11 publish-ready entries
uk: 11 publish-ready entries
```

Sensitive keys:

```text
nav.complaints
nav.noRecruitmentFees
```

пока исключены из publish-ready export для `ru`, `pt`, `uk`, потому что требуют human review.

## 5. Files Changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/translation_cache.py` | Добавлены `mark_entries_reviewed` и `export_publish_ready_catalogs`. |
| `projects/crewportglobal/scripts/review_translation_cache.py` | Добавлен CLI для human-review marking. |
| `projects/crewportglobal/scripts/export_translation_publish_ready.py` | Добавлен CLI для publish-ready export. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 11 проверок. |
| `projects/crewportglobal/i18n/publish-ready-export/` | Добавлены generated publish-ready catalogs. |
| `package.json` | Добавлен `build:cpg-i18n-publish-ready`. |
| `projects/crewportglobal/i18n/README.md` | Описан human-review и publish-ready workflow. |
| `projects/crewportglobal/README.md` | Описаны команды review/export. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена review/export policy. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Операционный отчет дополнен CPG-BIZ-066. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен publish-ready export direction. |
| `docs/crewportglobal/260_cpg_biz_065_translation_cache_publish_gate_report.md` | Зафиксировано выполнение следующего этапа. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 261. |

## 6. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/validate_translation_cache.py projects/crewportglobal/scripts/review_translation_cache.py projects/crewportglobal/scripts/export_translation_publish_ready.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
npm run check:cpg-i18n-cache-report
npm run build:cpg-i18n-publish-ready
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 11 passed.
3. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
4. `npm run build:cpg-i18n-publish-ready` - exported 11 entries for `pt`, `ru`, `uk`.
5. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
6. `git diff --check` - passed.

## 7. Runtime Boundary

Этот этап не меняет:

1. public browser runtime;
2. live translation dictionaries;
3. Google credentials;
4. backend API;
5. database;
6. migrations;
7. auth/session behavior.

`publish-ready-export/` пока является build/backend artifact и не подключен к live runtime.

## 8. Next Stage

Следующий этап выполнен и зафиксирован в:

```text
docs/crewportglobal/262_cpg_biz_067_translation_cache_google_provider_boundary_report.md
```

Он добавил backend/build adapter boundary placeholder для Google provider и public-tree credential scan.

Следующий рекомендуемый этап после CPG-BIZ-067:

```text
CPG-BIZ-068 - Translation cache protected Google credential source decision
```

Цель: выбрать защищенный источник credentials на сервере/CI/CD и только после этого подключать реальный Google API client за уже проверенным backend/build boundary.
