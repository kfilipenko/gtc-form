# CPG-BIZ-103 - Видимость задач в личных кабинетах моряка и судовладельца

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation and verification report
- Source task: проверка личных кабинетов и демонстрационного workflow после CPG-BIZ-101/102
- Version: 1.0
- Date: 2026-06-05
- Status: Implemented and verified on local GTC1 test runtime

## 1. Цель

Цель этапа - подтвердить, что вычисляемые задачи отображаются не только в командных очередях, но и в личных кабинетах участников процесса:

1. у моряка;
2. у судовладельца;
3. по конкретному объекту работы;
4. с рабочей ссылкой на следующую операцию.

Так как текущие данные портала являются демонстрационными, для проверки workflow разрешено использовать существующие записи базы и добавлять демонстрационные связи между ними.

## 2. Выполненные изменения

### 2.1 Ссылки на личный кабинет в меню

В общее меню добавлены ссылки `My Cabinet`:

1. в раздел `Seafarers`;
2. в раздел `Shipowners`.

Ссылка строится динамически:

```text
/cabinet/?draft_id={current_draft_id}
```

Правило выбора `draft_id`:

1. сначала используется `draft_id` из текущего URL;
2. затем используется сохраненный draft из browser localStorage;
3. если контекст не найден, открывается общий `/cabinet/`.

Это предотвращает ошибку, когда после ручной проверки разных ролей ссылка кабинета могла вести на предыдущий demo draft.

### 2.2 Задача судовладельца в личном кабинете

В `/cabinet/` добавлена вычисляемая задача судовладельца:

```text
Action required: review presented candidates
```

Задача появляется, когда endpoint:

```text
GET /api/v1/employer/candidate-selection?draft_id={draft_id}
```

возвращает хотя бы одного presented candidate.

Ссылка задачи ведет на рабочее пространство судовладельца:

```text
/shipowners/candidates/?draft_id={draft_id}
```

### 2.3 Задача моряка в личном кабинете

Проверено, что для моряка личный кабинет показывает следующую вычисленную операцию по состоянию объекта.

В демонстрационном сценарии задача:

```text
Action required: upload supporting documents
```

ведет в рабочее пространство анкеты моряка:

```text
/create-profile/?draft_id={draft_id}
```

### 2.4 Демонстрационная связь данных

Для ручной проверки создана демонстрационная presented-связка:

| Объект | Значение |
|---|---|
| Vacancy request | `32da1b22-815b-4f73-8a45-d6aaad002d12` |
| Shipowner draft/user | `9c33e748-cf2e-4b1b-8fa7-2daef52e1a67` |
| Seafarer draft/user | `e1074c9c-1673-4d28-81c7-4e6dcf5955b5` |
| Vacancy application | `fd6e7827-f993-49f3-9375-ced0d12d5470` |
| Application status | `presented` |
| Employer shortlist status | `presented` |

Эта связь создана только для демонстрации и проверки workflow.

## 3. Ссылки для ручной проверки

### 3.1 Личный кабинет судовладельца

```text
https://crewportglobal.com/cabinet/?draft_id=9c33e748-cf2e-4b1b-8fa7-2daef52e1a67
```

Ожидаемый результат:

```text
Action required: review presented candidates
Presented candidates: 1
Open candidate selection
```

### 3.2 Страница подбора кандидатов судовладельцем

```text
https://crewportglobal.com/shipowners/candidates/?draft_id=9c33e748-cf2e-4b1b-8fa7-2daef52e1a67
```

Ожидаемый результат:

1. отображается request судовладельца;
2. отображается presented candidate;
3. кнопка contract proposal остается под guard-условиями.

### 3.3 Личный кабинет моряка

```text
https://crewportglobal.com/cabinet/?draft_id=e1074c9c-1673-4d28-81c7-4e6dcf5955b5
```

Ожидаемый результат:

```text
Action required: upload supporting documents
```

### 3.4 Рабочее пространство анкеты моряка

```text
https://crewportglobal.com/create-profile/?draft_id=e1074c9c-1673-4d28-81c7-4e6dcf5955b5
```

## 4. Проверка

### 4.1 Синтаксис frontend-модуля навигации

```bash
node - <<'NODE'
const fs = require('fs');
new Function(fs.readFileSync('projects/crewportglobal/public/assets/crewportglobal-navigation.js', 'utf8'));
console.log('navigation syntax ok');
NODE
```

Result:

```text
navigation syntax ok
```

### 4.2 Ручная browser-проверка через Playwright

Проверено:

1. кабинет судовладельца показывает `Action required: review presented candidates`;
2. кабинет судовладельца показывает `Presented candidates: 1`;
3. ссылка `Open candidate selection` ведет на `/shipowners/candidates/?draft_id=...`;
4. кабинет моряка показывает `Action required: upload supporting documents`;
5. меню `My Cabinet` на странице с `draft_id` ведет в текущий кабинет, а не в предыдущий localStorage draft.

### 4.3 Фокусный regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result:

```text
11 passed
```

Проверено:

1. role-grouped menu содержит ссылки на личные кабинеты;
2. legacy document page остается доступной напрямую, но не требуется как активный пункт нового меню;
3. shipowner candidate selection workspace открывается из workflow;
4. личный кабинет судовладельца получает задачу presented candidate review;
5. личный кабинет моряка получает свою вычисляемую задачу.

## 5. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Добавлены ссылки кабинета в роли `Seafarers` и `Shipowners`; dynamic cabinet href теперь сначала использует URL `draft_id`. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлены EN/RU/PT подписи и tooltip для ссылок личного кабинета. |
| `projects/crewportglobal/public/cabinet/index.html` | Добавлена вычисляемая задача судовладельца для presented candidates. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Обновлены ожидания меню после удаления descriptive employer page из основного меню. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлена проверка задач моряка и судовладельца в личных кабинетах. |

## 6. Вывод

Этап подтвержден:

1. данные для демонстрации workflow есть;
2. личный кабинет моряка показывает следующую операцию;
3. личный кабинет судовладельца показывает следующую операцию;
4. ссылки ведут на конкретные рабочие объекты;
5. меню содержит доступ к личным кабинетам по ролям.

## 7. Следующий этап

Следующий этап:

```text
CPG-BIZ-104 - Shipowner candidate decision to contract proposal task transition
```

Цель следующего этапа:

1. проверить, что после решения судовладельца `Proceed with candidate` появляется следующая computed task;
2. связать эту задачу с Contract Agreement Workspace;
3. подтвердить, что кнопка `Propose contract` доступна только после выполнения guard-условий;
4. проверить, что задача исчезает или меняет статус после создания contract workspace.
