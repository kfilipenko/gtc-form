# CPG-BIZ-059 - Home Marketing Entry Cleanup Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner visual-control feedback after CPG-BIZ-058
- Version: 1.0
- Date: 2026-06-01
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - убрать с главной страницы лишний пояснительный текст и сделать первый экран ближе к продающей витрине сервиса.

Главная страница должна быстро отвечать на практический вопрос клиента:

```text
Что здесь есть для меня и куда нажать, чтобы начать работу?
```

Она не должна повторять документы, правила и учебные объяснения бизнес-процесса.

## 2. Что изменено

Выполнены правки по замечаниям Project Owner:

1. удален hero-текст о том, что заявки, суда и профили уже зарегистрированы;
2. счетчики заявок, судов и моряков перестроены в формат таблицы из двух строк и трех колонок;
3. верхняя строка таблицы содержит только короткие подписи:

```text
Заявок / Судов / Моряков
```

4. нижняя строка таблицы содержит только числовые значения;
5. удалены карточки `No-fee boundary / Правило без сборов` и `Evidence trail / Доказательная база` из публичного BP-цикла;
6. этапы BP-015 оставлены как короткие карточки-названия;
7. пояснения к этапам BP-015 теперь показываются только при наведении или фокусе на карточку;
8. блок `Registered platform data / Зарегистрированные данные платформы` переименован:

```text
Your crew market is already here
Вас ждут на нашей платформе
```

9. удален оставшийся описательный блок `Service model`, так как он дублировал документацию и возвращал главную страницу в справочный формат;
10. сохранены live registry, фильтры реестра и публичная доска вакансий как функциональные блоки.

## 3. Назначение главной страницы

Главная страница CrewPortGlobal должна быть коммерческой точкой входа.

Ее назначение:

1. быстро показать масштаб доступных данных;
2. направить моряка к созданию профиля;
3. направить работодателя к регистрации компании, судна и заявки;
4. показать, что платформа уже содержит спрос и предложение;
5. привести пользователя к действию, а не к чтению длинных объяснений.

Подробные правила, процессы, политики и доказательная модель должны оставаться в разделах документов, Trust Center, рабочих кабинетах и внутренних бизнес-процессах.

## 4. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Удален лишний hero-текст, перестроена таблица счетчиков, удалены публичные контрольные карточки, скрыты пояснения BP-015 до hover/focus, переименован блок live registry, удален описательный service-model блок. |
| `tests/crewportglobal-homepage-language.spec.ts` | Обновлены проверки RU-текста после удаления `landing-lead`. |
| `tests/crewportglobal-homepage-live-dashboard.spec.ts` | Обновлены проверки счетчиков и подтверждено отсутствие удаленного service-model блока. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 253. |
| `docs/crewportglobal/253_cpg_biz_059_home_marketing_entry_cleanup_report.md` | Добавлен настоящий отчет. |

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

Result: passed.

### 5.2 i18n consistency

```bash
npm run check:cpg-i18n
```

Result: passed.

### 5.3 Focused Playwright regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-vacancy-board.spec.ts
```

Result: passed.

## 6. Следующий этап

Следующий этап - обсудить и утвердить новый продающий смысл главной страницы:

1. короткий оффер для моряка;
2. короткий оффер для работодателя;
3. явные кнопки регистрации;
4. доверительные цифры и live registry;
5. минимум текста, максимум действия.

После утверждения смысла можно переходить к редизайну hero, CTA и публичного меню как полноценной продающей страницы.
