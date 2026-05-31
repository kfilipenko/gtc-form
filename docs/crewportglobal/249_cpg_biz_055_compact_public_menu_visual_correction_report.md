# CPG-BIZ-055 - Compact Public Menu Visual Correction Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner visual-control feedback after CPG-BIZ-054
- Version: 1.0
- Date: 2026-05-31
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - исправить визуально выявленную проблему верхнего меню сайта.

После CPG-BIZ-054 меню действительно содержало все основные страницы, но было показано как крупная карта с несколькими колонками, большим пустым пространством и повторным блоком входа/регистрации. Это противоречило текущему направлению проекта:

```text
функциональный сайт -> короткая навигация -> действие -> рабочий объект -> доказуемый результат
```

На этом этапе меню приведено к компактной ролевой строке.

## 2. Что изменено

### 2.1 Меню стало одной компактной строкой

Публичная навигация теперь использует короткие пункты:

```text
Home
Seafarers
Employers
Documents
Team
```

В русской версии:

```text
Главная
Моряки
Работодатели
Документы
Команда
```

Пункты `Seafarers`, `Employers`, `Documents` и `Team` раскрываются как компактные dropdown-меню. Пояснение к группе вынесено в hover tooltip через `title`, чтобы не занимать место на странице.

### 2.2 Вход и регистрация больше не дублируются

Блок входа, выхода, регистрации и личного кабинета уже находится в верхней части сайта в account menu.

Поэтому отдельная группа:

```text
Login / Cabinet
```

удалена из основного site menu.

Это устраняет дублирование и оставляет один источник входа/выхода пользователя.

### 2.3 Адаптивность

На широком экране меню остается компактной строкой.

На мобильной ширине меню переносится без горизонтального overflow. Это важно для дальнейшей последовательной проверки всех страниц портала.

## 3. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Site menu переведен с крупных групп на компактные dropdown-группы; добавлены hover-пояснения; группа входа/кабинета удалена из основного меню. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Обновлены короткие названия групп меню и подсказки EN/RU/PT. |
| `projects/crewportglobal/public/assets/crewportglobal-docs.css` | Добавлен компактный one-line стиль для site menu, dropdown-панели и мобильный перенос без горизонтального overflow. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Тесты навигации обновлены под новую dropdown-модель и отсутствие page-level mobile overflow. |
| `tests/crewportglobal-homepage-language.spec.ts` | Языковые и CTA-тесты обновлены под короткое меню и отдельный account menu. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 249. |
| `docs/crewportglobal/249_cpg_biz_055_compact_public_menu_visual_correction_report.md` | Добавлен настоящий отчет. |

## 4. Verification

### 4.1 JS syntax

```bash
node -e "new Function(require('fs').readFileSync('projects/crewportglobal/public/assets/crewportglobal-navigation.js','utf8')); new Function(require('fs').readFileSync('projects/crewportglobal/public/assets/crewportglobal-public-i18n.js','utf8')); console.log('navigation and i18n syntax ok');"
```

Result:

```text
navigation and i18n syntax ok
```

### 4.2 i18n consistency

```bash
npm run check:cpg-i18n
```

Result: passed.

Примечание: существующие fallback-ключи `pt/uk` остаются текущим состоянием переводов и не связаны с этим этапом.

### 4.3 Focused Playwright regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-homepage-language.spec.ts
```

Result:

```text
18 passed
```

Проверка подтвердила:

1. все основные группы меню доступны;
2. вход/регистрация доступны через верхний account menu, но не дублируются в site menu;
3. dropdown-группы содержат нужные страницы;
4. русская и португальская навигация корректно используют короткие названия;
5. мобильные функциональные страницы не создают горизонтальный overflow.

## 5. Ограничения этапа

На этом этапе не менялись:

1. backend API;
2. DB;
3. migrations;
4. billing logic;
5. matching logic;
6. consent storage;
7. team task computation.

Этап ограничен только frontend-навигацией, i18n-текстами меню, CSS и регрессионными тестами.

## 6. Следующий этап

Следующий этап остается прежним:

```text
последовательно пройти по публичным страницам и привести их к компактному функциональному виду
```

Первым кандидатом для дальнейшей проверки после меню является верхняя часть главной страницы и ролевые страницы:

1. `/` - оставить только функциональные панели, данные и BP-015 цикл без лишних объяснений;
2. `/for-seafarers/` - сократить до действий моряка;
3. `/for-shipowners/` - сократить до действий работодателя/судовладельца;
4. `/vacancies/` - проверить компактность и полезность доски вакансий.

