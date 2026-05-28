# CPG-BIZ-042 - Общий frontend-модуль жизненного цикла формы

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source standard: BP-014 - Standard Form Lifecycle And Validation Module
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот отчет фиксирует выполнение Phase B по стандарту BP-014.

Цель этапа - начать переход от локальных правил внутри отдельных страниц к общему модулю обработки форм. На этом этапе поведение страницы `/create-profile/` не менялось для пользователя: уже проверенные правила сохранения, подсветки незаполненных пунктов, перехода по `S-*` замечаниям и фонового autosave были вынесены в общий frontend helper.

Этот этап не добавляет новую бизнес-функцию, не меняет БД, API, миграции, права доступа, workflow-статусы, operator review, employer publication или matching decisions.

## 2. Что реализовано

Добавлен общий модуль:

```text
projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Модуль предоставляет:

| Helper | Назначение |
|---|---|
| `createCompletenessNavigator()` | Рендерит нумерованные missing items, строит ссылки на нужный раздел/поле, раскрывает секцию, прокручивает к объекту и применяет подсветку `is-completeness-missing`. |
| `createAutosaveController()` | Управляет отложенным autosave, предотвращает параллельные сохранения и повторно запускает сохранение, если изменения появились во время активного запроса. |

Страница `/create-profile/` подключена к этому модулю и теперь использует общий helper вместо локальных функций для:

1. очистки и применения подсветки незаполненных полей;
2. открытия нужной секции анкеты;
3. построения ссылок для `S-*`, `E-*`, `V-*`, `R-*` missing items;
4. рендера списка недостающих пунктов;
5. управления фоновым autosave.

## 3. Сохраненные границы поведения

Сохраняются утвержденные правила BP-014:

1. одна видимая кнопка `Save / confirm data`;
2. полевые изменения сохраняются безопасно и переживают перезагрузку;
3. `Save / confirm data` сохраняет draft и запускает backend completeness;
4. нумерованные missing items остаются кликабельными;
5. поле или секция, требующие доработки, подсвечиваются;
6. autosave не создает операторские задачи;
7. incomplete анкета не отправляется оператору;
8. frontend не принимает финальное решение о готовности без backend completeness analyzer.

## 4. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` | Добавлен общий frontend lifecycle helper для missing-item navigation/highlighting и autosave controller. |
| `projects/crewportglobal/public/create-profile/index.html` | Подключен общий helper; локальная логика навигации по missing items и autosave заменена вызовами общего модуля. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | BP-014 обновлен: `/create-profile/` отмечен как Phase B adopted; следующим этапом указан `/post-vacancy/`. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен контроль бизнес-процесса по использованию общего frontend lifecycle helper. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 231 в основной реестр. |
| `docs/crewportglobal/231_cpg_biz_042_shared_frontend_form_lifecycle_helper_report.md` | Добавлен этот отчет. |

## 5. Проверка

### 5.1 Синтаксис общего helper

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Result: passed.

### 5.2 Синтаксис встроенных скриптов `/create-profile/`

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/create-profile/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  .map((match) => match[1])
  .filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 5.3 Focused `/create-profile/` regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 12 passed.

Проверка подтверждает:

1. draft prefill продолжает работать;
2. `Save / confirm data` показывает backend `S-*` missing items;
3. кликабельные missing items ведут к нужным секциям;
4. field/section highlighting сохраняется;
5. autosave сохраняет локальные изменения до создания backend draft и после него;
6. reload safety сохранен;
7. protected upload multi-role regression остается рабочей;
8. vacancy application history на странице не сломана.

## 6. Контролируемые ограничения

1. `/post-vacancy/` пока не переведен на полный `E/V/R` lifecycle helper.
2. Protected upload UI пока не вынесен в отдельный shared upload helper.
3. Submit-to-operator endpoint и создание следующей team task остаются будущим этапом, зависящим от backend completeness gate.

## 7. Следующий этап

Следующий этап:

```text
CPG-BIZ-043 - Apply standard Save/completeness lifecycle to /post-vacancy/
```

Цель следующего этапа:

1. подключить общий lifecycle helper к `/post-vacancy/`;
2. включить единый `Save / confirm data` для employer/company, vessel и crew request streams;
3. показывать `E-*`, `V-*`, `R-*` missing items;
4. подсвечивать соответствующие поля и секции;
5. сохранить запрет на отправку оператору до прохождения backend completeness.

