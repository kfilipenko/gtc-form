# CPG-BIZ-086 - Automatic Google Page Localization Implementation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: CPG-BIZ-086
- Version: 1.0
- Date: 2026-06-03
- Status: Implemented and verified on GTC1

## 1. Цель

Цель этапа - завершить настройку автоматического машинного перевода страниц и интерфейсных элементов форм на все языки, доступные в панели выбора языка.

Этап не ставил задачу создавать идеальный ручной перевод. Реализованный результат - автоматический Google-перевод интерфейса страниц и форм через build-time/runtime bundle.

Официальным языком платформы остается английский. Локализация является машинным переводом.

## 2. Реализованные правила

Выполнены правила, утвержденные Project Owner:

1. Переводятся все публичные HTML-страницы сайта, подключенные к общему runtime.
2. При изменении страниц обновляется английский source catalog; измененные или новые строки получают новые cache entries и переводятся заново.
3. Переводятся страницы и интерфейс форм.
4. Пользовательские данные, введенные в поля форм, не переводятся автоматически и не изменяются при переключении языка.
5. Google Translate используется как build-time/provider-level machine translation source.
6. Browser runtime не вызывает внешние translation API и работает только с опубликованным bundle.

## 3. Что изменено

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/scripts/sync_translation_source_catalog.js` | Добавлен автоматический сбор статических HTML-текстов и атрибутов `placeholder`, `title`, `aria-label`, `alt` в английский source catalog. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлен runtime-перевод статических text nodes и атрибутов по machine bundle с защитой значений `input`, `textarea`, `select` и пользовательских данных. |
| `projects/crewportglobal/i18n/en.json` | Обновлен английский source catalog до 3695 ключей. |
| `projects/crewportglobal/i18n/translation-cache.json` | Обновлен Google machine translation cache: создано 20229 новых переводов, 20416 взято из кэша. |
| `projects/crewportglobal/i18n/publish-ready-export/*.json` | Обновлены publish-ready каталоги для всех утвержденных языков. |
| `projects/crewportglobal/i18n/runtime-bundle/*` | Собран новый runtime bundle. |
| `projects/crewportglobal/public/assets/crewportglobal-machine-translations.js` | Опубликован новый browser bundle. |
| `projects/crewportglobal/public/language.html` | Подключен общий machine bundle и runtime. |
| `projects/crewportglobal/public/team/translations/index.html` | Подключен machine bundle перед shared i18n runtime. |
| `tests/crewportglobal-homepage-language.spec.ts` | Добавлена проверка auto-text перевода и неизменности пользовательских form values. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Ранее дополнен правилами full-page/form UI localization и changed-page refresh. |

## 4. Языки покрытия

Machine localization bundle опубликован для:

```text
ar, el, es, fil, fr, hi, id, pt, ru, tr, uk
```

Английский остается исходным и официальным языком.

## 5. Граница пользовательских данных

Runtime не переводит:

1. значения `input`;
2. содержимое `textarea`;
3. выбранные значения `select`;
4. динамические пользовательские данные, введенные или загруженные в формы.

Runtime переводит только интерфейс:

1. статические текстовые узлы;
2. `placeholder`;
3. `title`;
4. `aria-label`;
5. `alt`.

## 6. Verification

### 6.1 Source catalog sync

```bash
npm run sync:cpg-i18n-source
```

Result:

```text
Synchronized 3695 English source translation key(s) to projects/crewportglobal/i18n/en.json
```

### 6.2 Google cache update

```bash
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk ar fil hi id es fr tr el --provider google_translate_public
```

Result:

```text
Translation cache updated: created=20229 cache_hits=20416 stale=0 provider=google_translate_public
```

### 6.3 Runtime publication

```bash
npm run build:cpg-i18n-publish-ready
npm run publish:cpg-i18n-runtime-bundle
```

Result:

```text
Bundled 3606 publish-ready entries for ar
Bundled 3606 publish-ready entries for el
Bundled 3606 publish-ready entries for es
Bundled 3606 publish-ready entries for fil
Bundled 3606 publish-ready entries for fr
Bundled 3606 publish-ready entries for hi
Bundled 3606 publish-ready entries for id
Bundled 3606 publish-ready entries for pt
Bundled 3606 publish-ready entries for ru
Bundled 3606 publish-ready entries for tr
Bundled 3606 publish-ready entries for uk
publication_version=feb3bf0984399de1
findings: 0
```

### 6.4 HTML runtime coverage audit

All 34 public HTML files load:

```text
crewportglobal-machine-translations.js
crewportglobal-public-i18n.js
```

The machine bundle is loaded before the shared runtime.

### 6.5 Playwright language regression

```bash
npx playwright test tests/crewportglobal-homepage-language.spec.ts --config=playwright.crewportglobal.config.ts
```

Result:

```text
17 passed
```

The focused test confirms:

1. approved language list is available;
2. homepage switches across all approved machine-localized languages;
3. static page text can be translated automatically without manual `data-i18n`;
4. entered form values are preserved during language switch;
5. invalid runtime bundle is ignored;
6. every public page with shared runtime loads the machine bundle before runtime.

## 7. Controlled Remaining Notes

1. Sensitive/legal Markdown publication still requires the existing human-review boundary.
2. Machine translation quality is intentionally not treated as manually approved legal text.
3. Browser runtime does not contact Google or any external translation endpoint.

## 8. Next Stage

The automatic localization infrastructure is now implemented for pages and form UI.

Next work should move to a different approved product task, while preserving this standard:

```text
English source -> changed-page source sync -> Google build-time cache -> publish-ready export -> runtime bundle -> browser-only bundle consumption
```
