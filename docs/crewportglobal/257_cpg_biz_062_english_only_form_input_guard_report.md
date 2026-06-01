# CPG-BIZ-062 - English-Only Form Input Guard Report

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Основание: утверждение стандарта официального английского языка и машинной локализации
- Версия: 1.0
- Дата: 2026-06-01
- Статус: Реализовано и проверено

## 1. Цель

Цель этапа - закрепить правило, что пользовательский интерфейс может локализоваться машинным переводом, но операционные данные в формах должны вводиться на английском языке и латиницей.

Это необходимо не ради формального ограничения, а для главной бизнес-цели платформы:

```text
структурированные данные моряков + структурированные заявки судовладельцев
= надежный автоматизированный поиск совпадений
```

Заполненные формы не переводятся автоматически, потому что они становятся источником для matching, проверки документов, shortlist, представления кандидатов работодателю и аудиторской доказательной базы.

## 2. Реализованный стандарт

В общий модуль жизненного цикла формы добавлен reusable guard:

```text
window.CPGFormLifecycle.createLanguageInputGuard(config)
```

Каноническая реализация:

```text
projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Guard:

1. подключается к форме через page adapter;
2. блокирует ввод букв не из Latin script в текстовые поля;
3. не применяется к email, phone, date, number, file, password, checkbox, radio и catalog-backed `select`;
4. при вставке текста удаляет нелатинские буквы из вставляемого фрагмента;
5. перед сохранением, autosave, section save и submit-review повторно проверяет форму;
6. подсвечивает проблемное поле;
7. показывает пользователю понятное сообщение.

## 3. Подключенные формы

Стандарт подключен к:

```text
/create-profile/
/post-vacancy/
```

Форма моряка и форма работодателя теперь используют общий lifecycle guard, а не локальную page-specific проверку.

## 4. Документация стандарта

Обновлены:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md
docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md
```

В стандарте закреплено:

1. официальный язык платформы - английский;
2. локализация интерфейса - машинный перевод;
3. заполненные формы не переводятся;
4. операционные поля вводятся на английском и латиницей;
5. будущие аналогичные формы должны подключать существующий guard.

## 5. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` | Добавлен `createLanguageInputGuard`. |
| `projects/crewportglobal/public/create-profile/index.html` | Подключен guard, добавлены сообщения и визуальная подсветка. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Подключен guard, добавлены сообщения и визуальная подсветка. |
| `tests/crewportglobal-reference-catalog-form-bindings.spec.ts` | Добавлен regression test на блокировку нелатинских букв в обеих формах. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Стандарт дополнен official-language/form-data rule. |
| `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md` | ICS-001 обновлен. |
| `docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md` | Описан новый reusable guard. |

## 6. Проверка

Выполнены проверки:

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  'projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js',
  'projects/crewportglobal/public/create-profile/index.html',
  'projects/crewportglobal/public/post-vacancy/index.html',
]) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    const scripts = Array.from(source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
    scripts.forEach((script) => new Function(script));
    console.log(`${file}: checked ${scripts.length} inline script(s)`);
  } else {
    new Function(source);
    console.log(`${file}: checked script`);
  }
}
NODE
```

Результат: проверка синтаксиса пройдена.

```bash
npm run check:cpg-i18n
```

Результат: пройдено. English canonical coverage complete for all referenced i18n keys. Portuguese and Ukrainian remain controlled fallback languages before human publication review.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-reference-catalog-form-bindings.spec.ts
```

Результат: 2 passed.

Проверка подтверждает:

1. справочники по-прежнему подключаются к формам;
2. `/create-profile/` блокирует ввод нелатинских букв;
3. `/create-profile/` не обходит guard через локальное сохранение черновика;
4. `/post-vacancy/` блокирует ввод нелатинских букв;
5. проблемные поля получают `aria-invalid`;
6. пользователь получает понятное сообщение перед сохранением.

```bash
git diff --check
```

Результат: пройдено.

## 7. Следующий этап

Следующий логичный этап:

```text
CPG-BIZ-063 - Google machine localization cache backend design
```

Цель этапа - описать и затем реализовать backend-кэш машинного перевода UI-текстов, где английский source text остается authoritative, а локализация обновляется по source hash при изменении страницы.
