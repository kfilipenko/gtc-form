# CPG-BIZ-057 - Home Post-Board Explanatory Sections Removal Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner visual-control feedback after CPG-BIZ-056
- Version: 1.0
- Date: 2026-05-31
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - убрать с главной страницы пояснительные блоки, которые оставались после секции:

```text
Current public vacancy board / Текущая публичная доска вакансий
```

Project Owner указал, что после статуса:

```text
Публичных вакансий пока нет
```

на главной странице не должны идти методические объяснения. Такие тексты должны находиться в документах, Trust Center или рабочих инструкциях, а не в первом пользовательском сценарии.

## 2. Что изменено

С главной страницы удалены секции после блока публичной доски вакансий:

1. блок `For employers / Для работодателей`;
2. блок `For seafarers / Для моряков`;
3. блок `How the platform works / Как работает платформа`;
4. блоки `Trust & Safety`;
5. нижние CTA-карточки с дополнительными описаниями.

Из операционного цикла BP-015 на главной странице удалена карточка:

```text
Human control / Человеческий контроль
No automatic employment decision / Нет автоматического решения о трудоустройстве
```

Причина: сам принцип контроля сохраняется в бизнес-процессах и backend guard logic, но на публичной главной странице такая формулировка может создавать неверное впечатление о машинной обработке в отрасли.

Также нейтрализована публичная формулировка про automated comparison:

```text
Data comparison supports operators; final presentation remains controlled.
```

В русской версии:

```text
Сравнение данных помогает оператору; финальное представление остается контролируемым.
```

## 3. Текущее поведение главной страницы

После блока публичной доски вакансий страница больше не показывает длинные пояснительные карточки.

Блок доски вакансий теперь остается функциональным:

1. заголовок;
2. короткий статус;
3. live-list при наличии опубликованных вакансий;
4. компактное состояние `Публичных вакансий пока нет`;
5. ссылка на страницу вакансий.

## 4. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Удалены пояснительные секции после vacancy board, удалена карточка Human control из BP-cycle controls, очищены неиспользуемые i18n-ключи этих секций. |
| `tests/crewportglobal-homepage-language.spec.ts` | Обновлена homepage CTA regression: тест больше не ищет удаленную ссылку из пояснительного блока и проверяет отсутствие удаленных секций. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 251. |
| `docs/crewportglobal/251_cpg_biz_057_home_post_board_explanatory_sections_removal_report.md` | Добавлен настоящий отчет. |

## 5. Verification

### 5.1 Inline script syntax

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

### 5.2 i18n consistency

```bash
npm run check:cpg-i18n
```

Result: passed.

### 5.3 Focused Playwright regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-vacancy-board.spec.ts
```

Result:

```text
12 passed
```

## 6. Следующий этап

Следующий этап - продолжить визуальный проход по главной странице сверху вниз:

1. оставить только данные, действия и короткие статусы;
2. убрать обучающие и объяснительные тексты;
3. переносить правила и методологию в документы;
4. после каждого изменения проверять соответствие визуально и тестами.
