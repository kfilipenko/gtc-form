# CPG-BIZ-058 - Home Registry Counter Compaction Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner visual-control feedback after CPG-BIZ-057
- Version: 1.0
- Date: 2026-05-31
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - уменьшить карточки количественных данных на главной странице и сделать их более компактными.

Project Owner подтвердил задачу и уточнил требование:

1. карточки с количественными данными должны быть меньше;
2. карточки должны стоять в один ряд;
3. подписи должны помещаться над числовым показателем внутри карточки.

## 2. Что изменено

В верхнем hero-блоке главной страницы изменены карточки:

```text
registered crew requests
registered vessels
registered seafarers
```

Изменения:

1. подпись перенесена над числом;
2. карточки уменьшены по высоте и внутренним отступам;
3. сетка оставлена в один ряд на desktop;
4. сохранена адаптация на мобильных устройствах через существующий responsive breakpoint;
5. числовые значения остались крупными, но не растягивают карточку.

## 3. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Уплотнены hero registry counter cards, подписи перенесены над показателями, сохранена desktop-сетка в один ряд и mobile fallback. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 252. |
| `docs/crewportglobal/252_cpg_biz_058_home_registry_counter_compaction_report.md` | Добавлен настоящий отчет. |

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

The focused homepage live-dashboard test includes layout checks for registry counter labels and confirms that the labels fit within their cards.

## 5. Следующий этап

Следующий этап - продолжить визуальный проход по главной странице:

1. проверить оставшиеся hero-actions и live-dashboard на компактность;
2. убрать или сократить текст, который не является действием, статусом или данными;
3. сохранить главную страницу как функциональную рабочую витрину, а не как обучающий документ.

