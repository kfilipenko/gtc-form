# CPG-BIZ-063 - Google Machine Localization Cache Backend Design

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Backend/design readiness report
- Основание: продолжение CPG-BIZ-062 после утверждения Project Owner
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Design ready; implementation requires separate approval

## 1. Цель

Цель этапа - зафиксировать управляемую backend-модель машинной локализации интерфейса CrewPortGlobal через Google translation provider.

Этот документ не внедряет runtime-перевод в браузере и не подключает внешние API-ключи к frontend.

Принцип остается прежним:

```text
English source text = official authoritative content
machine localization = auxiliary UI convenience
form data = English / Latin only, not translated
```

## 2. Почему нужен backend cache

Прямой перевод страниц в браузере не подходит для CrewPortGlobal, потому что:

1. browser-side JavaScript не должен содержать provider credentials;
2. перевод должен быть воспроизводимым и проверяемым;
3. legal / consent / no-fee тексты требуют human review перед публикацией;
4. изменение английского текста должно автоматически инвалидировать старый перевод;
5. одинаковые строки не должны повторно переводиться и повторно оплачиваться;
6. пользовательские данные форм не должны попадать в translation provider.

Backend/build-time cache решает эти задачи и позволяет позже использовать Google Cloud Translation API / Google Translate provider контролируемо.

## 3. Scope

В scope будущего implementation slice входят только UI/catalog texts:

| Категория | Разрешено к машинному переводу | Условие |
|---|---:|---|
| Короткие UI labels | Yes | English source key exists |
| Navigation labels | Yes | English source key exists |
| Buttons / badges / helper hints | Yes | English source key exists |
| Homepage marketing copy | Yes | Human review recommended before live publication |
| Long legal text | Draft only | Human review required |
| Consent / no-fee / complaint text | Draft only | Human review required |
| Form values entered by users | No | Must remain English / Latin |
| Uploaded document content | No | Separate OCR/extraction workflow only |
| Operator notes | No by default | Separate approved workflow required |

## 4. Cache key

Каждая запись translation cache должна определяться как минимум:

```text
translation_key
source_language
target_language
source_text_hash
provider
provider_model_or_version
```

Минимальная hash-модель:

```text
source_text_hash = sha256(normalized_english_source_text)
```

Если английский source text изменился, hash меняется и существующий перевод становится stale.

## 5. Proposed data model

Будущая backend/DB реализация может использовать таблицу:

```text
translation_cache
```

Рекомендуемые поля:

| Field | Purpose |
|---|---|
| `id` | UUID primary key |
| `translation_key` | i18n key, например `home.hero.title` |
| `source_language` | Обычно `en` |
| `target_language` | Например `ru`, `pt`, `uk` |
| `source_text` | Canonical English text at translation time |
| `source_text_hash` | Hash for invalidation |
| `translated_text` | Machine draft or reviewed localized text |
| `provider` | `google` |
| `provider_version` | Provider/model/version metadata when available |
| `translation_status` | `draft_machine`, `review_required`, `reviewed`, `rejected`, `stale` |
| `human_review_required` | Boolean |
| `reviewed_by_user_id` | Optional reviewer |
| `reviewed_at` | Optional timestamp |
| `created_at` | Cache creation |
| `updated_at` | Last update |

Recommended unique constraint:

```text
unique(translation_key, source_language, target_language, source_text_hash, provider)
```

## 6. Backend flow

Expected backend/build automation flow:

```text
collect English i18n source keys
-> calculate source_text_hash
-> check translation_cache
-> reuse reviewed/current translation when hash matches
-> request Google translation only when cache miss or forced refresh
-> store translated_text as draft_machine
-> mark sensitive categories as human_review_required
-> export approved/current catalogs to static JSON/runtime dictionary
-> run i18n validator
-> publish only validated static bundles
```

## 7. API / script boundary

The first implementation should prefer build/backend scripts, not public browser calls.

Candidate commands:

```bash
python projects/crewportglobal/scripts/update_translation_cache.py --targets ru pt uk --provider google
python projects/crewportglobal/scripts/export_translation_catalogs.py --targets ru pt uk
node projects/crewportglobal/scripts/check_public_i18n.js
```

No browser page should call Google translation APIs directly.

## 8. Security and secrets

Google provider credentials must be stored outside the public tree.

Allowed locations depend on deployment policy, for example:

```text
server environment variables
protected deployment secret storage
CI/CD secret store
```

Forbidden:

```text
public HTML
public JavaScript
committed JSON config with secrets
localStorage
query parameters
```

## 9. Publication and review gates

Machine translation may be used automatically for low-risk UI labels.

Human review remains required before publication for:

1. legal terms;
2. privacy text;
3. no-fee statements;
4. complaint handling text;
5. candidate agreement text;
6. seafarer-facing consent;
7. employer service terms;
8. pages that create legal reliance or user obligation.

If review is not complete, the site may fall back to English or mark the localized draft as not publishable.

## 10. Matching boundary

Translation cache must never be used to normalize matching data.

Matching-critical data must come from:

1. structured catalogs;
2. English/Latin user input;
3. normalized codes;
4. verified document extraction workflows when separately approved.

This prevents false candidate/request matching caused by uncontrolled translated form text.

## 11. Required implementation order

The implementation should proceed in small controlled slices:

1. Add DB migration or file-backed cache prototype for `translation_cache`.
2. Add provider adapter interface with a stub provider and Google provider placeholder.
3. Add source scanner/exporter for existing i18n keys.
4. Add cache update command with source hash invalidation.
5. Add catalog export command.
6. Extend validation to confirm English source coverage and stale target detection.
7. Add tests for cache hit, cache miss, stale source hash and no frontend provider call.
8. Only after that, wire generated catalogs into public runtime.

## 12. Non-scope

This design does not authorize:

1. translation of completed user forms;
2. translation of uploaded documents;
3. storing Google credentials in frontend;
4. automatic publication of legal translations;
5. automatic change to current live language selector behavior;
6. uncontrolled runtime API calls from browser pages.

## 13. Verification for this design slice

This slice is documentation/design only.

Required verification:

```bash
git diff --check
npm run check:cpg-i18n
```

No DDL, DML, migrations, provider calls or runtime behavior changes are performed in this design slice.

## 14. Next Stage

Recommended next task:

```text
CPG-BIZ-064 - Translation cache implementation skeleton with stub provider
```

That stage should implement the cache module with a stub provider first, so tests can verify invalidation and export behavior before connecting Google credentials.

Status update:

```text
CPG-BIZ-064 implemented in docs/crewportglobal/259_cpg_biz_064_translation_cache_stub_provider_skeleton_report.md.
```
