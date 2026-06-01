# CPG-BIZ-065 - Translation Cache Publish Gate Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: продолжение CPG-BIZ-064
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - добавить проверку свежести и публикационной готовности translation cache.

Теперь translation cache не только создает machine drafts, но и может показать:

1. устаревшие записи;
2. отсутствующие текущие записи;
3. несовпадение source hash;
4. orphan entries;
5. записи, требующие human review.

## 2. Реализация

Добавлен validator:

```text
projects/crewportglobal/scripts/validate_translation_cache.py
```

Команда:

```bash
npm run check:cpg-i18n-cache-report
```

Обычный режим:

1. возвращает exit code 0, если нет stale/missing/hash mismatch;
2. показывает `review_required` как controlled finding;
3. подходит для текущей разработки.

Strict publish mode:

```bash
python3 projects/crewportglobal/scripts/validate_translation_cache.py --strict-publish
```

В strict mode публикация блокируется также при наличии `review_required`.

## 3. Current cache status

Текущий cache свежий:

```text
stale entries: 0
missing current entries: 0
hash mismatch entries: 0
orphan entries: 0
```

Есть controlled review-required entries:

```text
review-required entries: 6
```

Они относятся к:

```text
nav.complaints
nav.noRecruitmentFees
```

для языков:

```text
ru
pt
uk
```

Это ожидаемо: complaint/no-fee тексты являются sensitive/legal-adjacent и не должны публиковаться как reviewed без человека.

## 4. Files changed

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/validate_translation_cache.py` | Добавлен cache freshness / publish-gate validator. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Unit tests расширены до 8 проверок, включая validator findings. |
| `package.json` | Добавлен `check:cpg-i18n-cache-report`. |
| `projects/crewportglobal/i18n/README.md` | Добавлен workflow проверки publish gate. |
| `projects/crewportglobal/README.md` | Добавлена команда проверки cache report. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Методология дополнена publish-gate требованиями. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Зафиксирован validator и текущий статус cache. |
| `docs/crewportglobal/62_build_time_translation_pipeline_plan.md` | План дополнен validator artifact. |
| `docs/crewportglobal/259_cpg_biz_064_translation_cache_stub_provider_skeleton_report.md` | Отмечено выполнение следующего этапа. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 260. |

## 5. Verification

Выполнено:

```bash
python3 -m py_compile projects/crewportglobal/scripts/translation_cache.py projects/crewportglobal/scripts/validate_translation_cache.py projects/crewportglobal/scripts/test_translation_cache.py
npm run check:cpg-i18n-cache
npm run check:cpg-i18n-cache-report
npm run check:cpg-i18n
git diff --check
```

Результаты:

1. Python compile - passed.
2. `npm run check:cpg-i18n-cache` - 8 passed.
3. `npm run check:cpg-i18n-cache-report` - passed with controlled review-required findings.
4. `npm run check:cpg-i18n` - passed; English canonical coverage complete.
5. `git diff --check` - passed.

## 6. Runtime boundary

Этот этап не меняет:

1. browser runtime;
2. public language selector;
3. live translation dictionaries;
4. backend API;
5. database;
6. Google credentials.

## 7. Next Stage

Следующий этап выполнен и зафиксирован в:

```text
docs/crewportglobal/261_cpg_biz_066_translation_cache_human_review_publish_export_report.md
```

Он добавил:

1. controlled CLI для отметки текущих cache entries как human-reviewed;
2. фиксацию `reviewed_by_user_id` и `reviewed_at`;
3. publish-ready export, который исключает unreviewed sensitive translations.

Следующий рекомендуемый этап после CPG-BIZ-066:

```text
CPG-BIZ-067 - Translation cache Google provider adapter design and secret boundary check
```

Цель: до подключения Google Cloud Translation API описать и проверить boundary для credentials, runtime isolation и fallback на stub-provider tests.
