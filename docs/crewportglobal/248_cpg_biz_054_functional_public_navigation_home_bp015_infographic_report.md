# CPG-BIZ-054 - Functional Public Navigation And Home BP-015 Infographic Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: CPG-BIZ-053 approved by Project Owner
- Version: 1.0
- Date: 2026-05-30
- Status: Implemented and verified

## 1. Цель этапа

Цель этапа - выполнить утвержденный первый шаг по приведению публичного сайта к BP-015 commercial operating cycle:

```text
функциональный вход -> регистрация -> структурированные данные -> проверка -> matching -> представление -> посадка -> счет -> повторный цикл
```

Задача не заключалась в создании очередной объяснительной страницы. Цель - убрать лишнюю навигационную "воду", оставить пользователю функциональный маршрут и встроить компактную схему процесса на главную страницу.

## 2. Что изменено

### 2.1 Верхнее меню

Общее меню приведено к короткой ролевой структуре:

```text
Home
Seafarers
Employers
Documents
Team
Login / Cabinet
```

Из публичного меню убраны страницы и маршруты, которые не должны быть постоянными пунктами верхней навигации:

```text
/about/
/how-it-works/
/language.html
/vacancies/detail/
/register/confirm/
/register/next/
/register/authorization/
/register/authorization/selected/
/register/authorization/seafarer-specialist/
/register/authorization/buyer-employer/
```

Эти маршруты не удалялись физически, если они нужны как рабочие, технические или support-страницы. Они просто не показываются как основные публичные страницы.

### 2.2 Documents / Trust Center

Раздел `Documents` теперь содержит не общие описательные страницы, а юридические и trust-center документы:

```text
/legal/terms/
/legal/privacy/
/legal/no-recruitment-fees/
/legal/seafarer-candidate-agreement/
/legal/shipowner-service-terms/
/legal/recruitment-and-matching-policy/
/legal/verification-policy/
/legal/complaints/
```

Это соответствует ранее принятому правилу: юридические документы должны быть доступны, но не должны превращать главную страницу и ролевые страницы в учебный материал.

### 2.3 Главная страница

На главную страницу добавлен компактный блок:

```text
#home-process-cycle
```

Он показывает BP-015 как короткий операционный цикл:

1. Register;
2. Complete data;
3. Verify;
4. Match;
5. Present;
6. Confirm boarding;
7. Bill service;
8. Repeat cycle.

Блок расположен как функциональная инфографика, а не как длинная статья. Пользователь видит, что платформа ведет к рабочему результату: моряку - работа, судовладельцу - экипаж, GTC INFORMATION TECHNOLOGY FZ-LLC - доказательная база оказанной B2B-услуги.

### 2.4 `/how-it-works/`

Страница `/how-it-works/` больше не является длинной объяснительной страницей.

Она сокращена до support-route, который направляет пользователя к компактному циклу на главной:

```text
https://crewportglobal.com/#home-process-cycle
```

Старые публичные ссылки на `/how-it-works/` заменены на ссылку к секции `#home-process-cycle`, а пользовательские подписи заменены на `BP-015 Cycle / Цикл BP-015`.

## 3. Файлы, измененные на этапе

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Упрощено публичное меню, убраны технические маршруты, Documents переведен на legal/trust документы. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлен ключ `nav.loginCabinet` для нового пункта меню. |
| `projects/crewportglobal/public/index.html` | Добавлена компактная BP-015 инфографика `#home-process-cycle` и переводы EN/RU. |
| `projects/crewportglobal/public/how-it-works/index.html` | Страница сокращена до support-route на главную BP-015 схему. |
| `projects/crewportglobal/public/register/index.html` | Старая ссылка/подпись `How It Works` переведена на `/#home-process-cycle` и `BP-015 Cycle`. |
| `projects/crewportglobal/public/about/index.html` | Старая ссылка/подпись `How It Works` переведена на `/#home-process-cycle` и `BP-015 Cycle`. |
| `projects/crewportglobal/public/for-seafarers/index.html` | Старая ссылка/подпись `How It Works` переведена на `/#home-process-cycle` и `BP-015 Cycle`. |
| `projects/crewportglobal/public/for-shipowners/index.html` | Старая ссылка/подпись `How It Works` переведена на `/#home-process-cycle` и `BP-015 Cycle`. |
| `projects/crewportglobal/public/for-shipowners/index.md` | Исходная markdown-ссылка синхронизирована с `/#home-process-cycle`, подпись заменена на `BP-015 Cycle`. |
| `projects/crewportglobal/public/vacancies/index.html` | CTA `How It Works` переведен на `/#home-process-cycle` и `BP-015 Cycle`. |
| `projects/crewportglobal/public/how-it-works/index.md` | Исходный markdown-документ переименован в `BP-015 Cycle` для согласования с новой поддерживающей страницей. |
| `projects/crewportglobal/public/legal/**/*.html` | Старые ссылки на `/how-it-works/` переведены на главную BP-015 схему. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Тесты меню обновлены под функциональную ролевую навигацию. |
| `tests/crewportglobal-homepage-language.spec.ts` | Тесты главной страницы обновлены под секцию `#home-process-cycle`. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 248. |
| `docs/crewportglobal/248_cpg_biz_054_functional_public_navigation_home_bp015_infographic_report.md` | Добавлен настоящий отчет. |

## 4. Verification

### 4.1 i18n consistency check

```bash
npm run check:cpg-i18n
```

Result: passed.

Примечание: проверка по-прежнему сообщает о допустимых fallback-ключах для `pt/uk`, что является существующим состоянием переводов и не связано с этим этапом.

### 4.2 Syntax check

Проверены inline scripts и общие JS-файлы:

```bash
node - <<'NODE'
const fs = require('fs');
const files = [
  'projects/crewportglobal/public/index.html',
  'projects/crewportglobal/public/how-it-works/index.html',
];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g))
    .map((match) => match[1])
    .filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
for (const file of [
  'projects/crewportglobal/public/assets/crewportglobal-navigation.js',
  'projects/crewportglobal/public/assets/crewportglobal-public-i18n.js',
]) {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log(`${file}: checked`);
}
NODE
```

Result: passed.

### 4.3 Focused public navigation and homepage tests

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-homepage-language.spec.ts
```

Result:

```text
18 passed
```

Проверка подтвердила:

1. публичное меню соответствует обновленной ролевой модели;
2. старые технические маршруты не отображаются как пункты верхнего публичного меню;
3. главная страница содержит `#home-process-cycle`;
4. CTA на главной ведет к компактной BP-015 схеме;
5. обновленная навигация работает в проверяемых языковых сценариях.

### 4.4 Broken old link check

```bash
rg -n "how-it-works/" projects/crewportglobal/public -g '*.html' -g '*.js' -g '*.md'
```

Result: no active public source links to `/how-it-works/` remain.

## 5. Ограничения этапа

На этом этапе не менялись:

1. backend API;
2. DB;
3. migrations;
4. billing logic;
5. matching/scoring logic;
6. internal approval guards;
7. runtime task computation.

Этап был ограничен публичной навигацией, homepage BP-015 infographic и связанными regression tests.

## 6. Remaining Controlled Gaps

1. `/for-seafarers/` еще требует дальнейшего сокращения до action-first страницы: профиль, документы, доступность, вакансии, повторный рейс.
2. `/for-shipowners/` еще требует дальнейшего сокращения до action-first страницы: компания, суда, подписка/пакет, crew request, matching.
3. `/about/` остается существующим route, но больше не находится в верхнем меню. Позднее его надо либо сократить до trust/reference page, либо удалить из активного маршрута.
4. Сгенерированные library-блоки на legal/role pages теперь ведут на `#home-process-cycle`, но сами страницы еще требуют отдельной компактной переработки на следующих этапах.

## 7. Следующий этап

Следующий рекомендуемый этап:

```text
CPG-BIZ-055 - Compact role pages and vacancy board alignment with BP-015
```

Цель:

1. привести `/for-seafarers/` к функциональной странице моряка без лишних объяснений;
2. привести `/for-shipowners/` к функциональной странице судовладельца/работодателя;
3. привести `/vacancies/` к компактной безопасной доске вакансий и заявок;
4. сохранить принцип: каждая страница должна вести к рабочему действию, данным, доказательству или следующему computed task.
