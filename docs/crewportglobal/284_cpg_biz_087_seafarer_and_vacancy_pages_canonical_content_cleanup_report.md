# CPG-BIZ-087 - Отчет о чистке канонического контента страниц моряков и вакансий

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: `283_cpg_biz_087_seafarer_and_vacancy_pages_canonical_content_cleanup_task.md`
- Version: 1.0
- Date: 2026-06-03
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - убрать дублирующую информационную страницу моряков из основного пользовательского маршрута, оставить основным действием моряка заполнение структурированного профиля, проверить справочники формы `/create-profile/` и очистить страницу `/vacancies/` от блоков, не создающих ценности при отсутствии опубликованных вакансий.

Этап выполнен как функциональная настройка страниц под основную бизнес-цель платформы:

```text
структурированные данные моряка + структурированные заявки работодателя = дальнейший автоматический поиск совпадений
```

## 2. Изменения в навигации моряков

Из публичного меню моряков удалена ссылка:

```text
/for-seafarers/
```

В меню оставлены действия, которые ведут пользователя к работе с данными:

1. создание профиля моряка;
2. просмотр вакансий как контролируемого публичного/операционного сценария;
3. работа с документами через раздел документов.

Прямая legacy-страница `/for-seafarers/` пока не удалялась физически, чтобы не создавать внезапный 404 для старых внешних ссылок. Она больше не является частью основного маршрута и не выводится в seafarer-menu.

## 3. Проверка формы Create Profile

Форма `/create-profile/` проверена как основная форма supply-data моряка.

Подтверждены подключенные справочники и поведение выбора:

| Поле | Проверка |
|---|---|
| Nationality | Справочник стран подключен; проверено значение `PH`. |
| Residence country | Справочник стран подключен; работает копирование из nationality. |
| Current country | Справочник стран подключен; работает копирование из nationality. |
| Gender | Справочник подключен; выбор доступен после открытия раздела Contact. |
| Civil status | Справочник подключен; выбор доступен после открытия раздела Contact. |
| Rank / specialty | Справочник должностей подключен; проверено `Chief Officer`. |
| Department | Существующий select остается доступным для структурированного выбора. |
| Preferred vessel types | Множественный выбор работает; проверены `BULK CARRIER` и `LNG`. |

Также сохранена проверка стандарта форм:

```text
ввод в формах допускается на английском языке / латиницей
```

## 4. Изменения страницы Vacancies

Страница `/vacancies/` приведена к более честной и функциональной модели.

Удалены или скрыты блоки, которые создавали лишнее объяснение без практической пользы:

1. `Public visibility rules`;
2. зарегистрированные заявки / safe preview registered demand;
3. карточки с пояснениями о спросе, предложении и внутреннем процессе;
4. лишние фильтры и registered-demand preview, если нет опубликованных вакансий.

Публичная доска вакансий оставлена как read-only путь для проверенных вакансий, но без обещания прямого контакта моряка с работодателем.

Новый смысл страницы:

```text
Проверенные вакансии появляются здесь только после публикации работодателем и контроля данных.
Если опубликованных вакансий нет, пользователь получает короткий призыв создать профиль.
```

## 5. Машинная локализация

После канонических английских изменений выполнен утвержденный пайплайн автоматической локализации:

```bash
npm run sync:cpg-i18n-source
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk ar fil hi id es fr tr el --provider google_translate_public
npm run build:cpg-i18n-publish-ready
npm run publish:cpg-i18n-runtime-bundle
```

Результат обновления кэша:

```text
created=209
cache_hits=40524
stale=121
provider=google_translate_public
```

Опубликован runtime bundle:

```text
publication_version = 53345f0f8938ec76
```

Публикационная проверка не выявила ошибок:

```text
Validation findings: 0
```

## 6. Файлы с ключевыми изменениями

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Убрана ссылка `/for-seafarers/` из меню моряков, уточнен смысл группы. |
| `projects/crewportglobal/public/vacancies/index.html` | Удалены низкоценные объяснительные блоки, registered-demand preview и спорный блок public visibility rules. |
| `projects/crewportglobal/public/create-profile/index.html` | Обновлена локализационная версия после публикации runtime bundle; существующие catalog bindings сохранены. |
| `tests/crewportglobal-reference-catalog-form-bindings.spec.ts` | Расширена проверка справочников формы моряка и множественного выбора vessel types. |
| `tests/crewportglobal-vacancy-board.spec.ts` | Зафиксировано отсутствие registered-demand блока на странице вакансий. |
| `tests/crewportglobal-homepage-language.spec.ts` | Зафиксировано отсутствие старых vacancy blocks и ссылки `/for-seafarers/` в меню. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Обновлены ожидания публичного меню без `/for-seafarers/`. |

## 7. Проверка

### 7.1 Синтаксис встроенных скриптов

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of ['projects/crewportglobal/public/vacancies/index.html','projects/crewportglobal/public/create-profile/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Результат:

```text
projects/crewportglobal/public/vacancies/index.html: checked 2 inline script(s)
projects/crewportglobal/public/create-profile/index.html: checked 2 inline script(s)
```

### 7.2 Проверка справочников формы

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts
```

Результат:

```text
2 passed
```

### 7.3 Проверка страницы вакансий

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-vacancy-board.spec.ts
```

Результат:

```text
1 passed
```

### 7.4 Проверка публичных страниц и локализации

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts -g "homepage and vacancies|create-profile holds|published homepage loads|machine runtime manifest|public pages load"
```

Результат:

```text
6 passed
```

### 7.5 Проверка навигации

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
```

Результат:

```text
8 passed
```

## 8. Контролируемые ограничения

1. Страница `/for-seafarers/` остается доступной по прямой ссылке как legacy/support route, но больше не показывается в основном seafarer-menu.
2. Физическое удаление или redirect `/for-seafarers/` следует делать отдельным этапом, чтобы не сломать старые внешние ссылки без утвержденного правила перехода.
3. Страница `/vacancies/` пока остается публичной read-only страницей; ее ценность будет окончательно подтверждаться после появления проверенных опубликованных вакансий.

## 9. Следующий этап

Следующий логичный этап:

```text
CPG-BIZ-088 - Legacy public page consolidation and functional route cleanup
```

На этом этапе следует:

1. принять решение по `/for-seafarers/`: удалить, сделать redirect или оставить как короткую support-страницу;
2. продолжить ревизию публичных страниц по BP-015: каждая страница должна вести к действию, данным или документу;
3. убрать оставшиеся страницы, которые повторяют документацию и не помогают пользователю выполнить процесс.

Этап CPG-BIZ-087 завершен.
