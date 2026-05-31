# CPG-BIZ-056 - Home Public Vacancy Board Text Minimization Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner visual-control feedback after CPG-BIZ-055
- Version: 1.0
- Date: 2026-05-31
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - привести блок главной страницы:

```text
Current public vacancy board / Текущая публичная доска вакансий
```

к функциональному виду.

Визуальная проверка показала, что внутри блока было слишком много текстовых пояснений. Они дублировали смысл документов и отвлекали от основной задачи: показать текущую доску вакансий или короткий статус ее готовности.

## 2. Что изменено

Удалены объяснительные карточки:

1. `Public availability`;
2. `Demand side`;
3. `Supply side`.

Удалены длинные описания о том, как работает сторона спроса и предложения.

В блоке оставлены только:

1. заголовок доски;
2. короткий статус;
3. список live vacancies, если они доступны;
4. компактное пустое состояние `No public vacancies yet / Публичных вакансий пока нет`;
5. ссылка `Open board / Открыть доску`.

Если API временно недоступен, показывается короткий статус:

```text
Vacancy board is temporarily unavailable.
```

В русской версии:

```text
Доска вакансий временно недоступна.
```

## 3. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Секция public vacancy board сокращена до функционального статуса, live-list и действия; удалены поясняющие карточки и длинные тексты. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 250. |
| `docs/crewportglobal/250_cpg_biz_056_home_public_vacancy_board_text_minimization_report.md` | Добавлен настоящий отчет. |

## 4. Verification

### 4.1 Inline script syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  .map((match) => match[1])
  .filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result:

```text
checked 2 inline script(s)
```

### 4.2 i18n consistency

```bash
npm run check:cpg-i18n
```

Result: passed.

### 4.3 Focused Playwright regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-vacancy-board.spec.ts
```

Result:

```text
12 passed
```

Проверка подтвердила:

1. homepage language scenarios remain valid;
2. live dashboard still reads the API state;
3. vacancy board still renders reviewed public vacancies from API;
4. public vacancy page remains functional.

## 5. Следующий этап

После визуальной проверки обновленного блока вакансий следующий этап - продолжить такой же проход по главной странице сверху вниз:

1. убрать или свернуть лишние пояснения;
2. оставить данные, действия и короткие статусы;
3. переносить методические тексты в документы/Trust Center;
4. проверять результат тестами после каждого изменения.

