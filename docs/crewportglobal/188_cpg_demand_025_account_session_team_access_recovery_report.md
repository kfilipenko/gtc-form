# CPG-DEMAND-025 - Восстановление доступа к очереди через account session

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-024
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап устраняет ситуацию, когда пользователь вошел в портал обычной учетной записью, видит account header, но на странице `/verify/` не видит заявки и задачи.

Проблема проявлялась так:

1. В верхнем меню отображался пользователь.
2. `/verify/` показывал требование operator token или team session.
3. Счетчики очереди были равны нулю.
4. Список задач не загружался, хотя пользователь должен работать с очередью по групповой принадлежности.

Цель исправления: разрешить пользователю с активной account session и правильной группой видеть вычисленные задачи и очередь без ручного temporary operator token.

## 2. Причина проблемы

Найдены три связанные причины.

| Уровень | Причина | Эффект |
|---|---|---|
| Frontend `/verify/` | Очередь загружалась только при наличии временного operator/team token в `localStorage`. | Обычная account session не пыталась загрузить очередь. |
| Frontend `/team/` | Team links также зависели от локального admin/team token. | Авторизованный пользователь мог не получить рабочие ссылки команды. |
| Backend account access | Account access payload не передавал `user_id`, а проверка team links ожидала именно это поле. | Backend не мог корректно подтвердить командный доступ. |
| Backend boolean parsing | PostgreSQL boolean `t` обрабатывался как false через `filter_var`. | Активный пользователь мог считаться неактивным. |

## 3. Реализованное исправление

### 3.1 Backend

Backend теперь принимает обычную account session cookie `cpg_user_session` как источник named operator/team access, если пользователь состоит в допустимой группе.

Исправлено:

1. Account access содержит `user_id`.
2. Account access содержит `email`.
3. `is_active` нормализуется через существующий PostgreSQL-aware boolean helper.
4. Named operator access может использовать account session fallback.
5. Операции по-прежнему проходят через permission/group checks.

Это не дает широкого доступа всем аккаунтам. Доступ сохраняется только для пользователей с нужной группой и разрешением.

### 3.2 `/verify/`

Страница `/verify/` теперь пытается загрузить очередь всегда, а решение о доступе принимает backend.

Практический результат:

1. Пользователь входит обычным способом.
2. Открывает `/verify/`.
3. Если у него есть подходящая группа и permission, очередь и задачи загружаются.
4. Если прав нет, backend возвращает controlled access error.

### 3.3 `/team/`

Страница `/team/` теперь запрашивает team links через backend даже без localStorage token.

Практический результат:

1. Пользователь входит обычным способом.
2. Открывает `/team/`.
3. Если он входит в `owners`, `cpg_team` или `review_team`, backend возвращает доступные рабочие ссылки.
4. Операции внутри рабочих страниц все равно проверяются отдельно.

## 4. Группы и порядок входа

### 4.1 Проверка на портале

Основные страницы проверки:

```text
https://crewportglobal.com/team/
https://crewportglobal.com/verify/
```

### 4.2 Порядок входа пользователя

1. Открыть CrewPortGlobal.
2. Войти через обычный account login.
3. Убедиться, что в верхнем меню отображается имя пользователя и статус учетной записи.
4. Открыть `/team/`.
5. Перейти по доступной рабочей ссылке или открыть `/verify/` напрямую.
6. Проверить, что очередь и вычисленные задачи загружены без temporary operator token.

### 4.3 Требуемая группа

Для работы с текущей review queue и задачами по shortlist/candidate presentation пользователь должен иметь доступ через:

```text
review_team
```

Для общего входа в team area также допустимы:

```text
owners
cpg_team
```

Но конкретные операции не должны выполняться только из-за факта входа в team area. Для операции требуется соответствующее разрешение, например:

| Операция | Требуемый смысл доступа |
|---|---|
| Просмотр review queue | `view_review_queue` |
| Создание internal shortlist draft | `create_internal_shortlist_draft` |
| Internal approval | `approve_internal_shortlist` |
| Создание review applications | `create_review_applications` |
| Candidate presentation review | `review_candidate_presentation` |
| Запрос удаления заявки | `request_vacancy_deletion` |

## 5. Что теперь видно пользователю

Если пользователь имеет `review_team` и нужные permissions:

1. `/team/` показывает доступ к рабочим областям команды.
2. `/team/` показывает вычисленные задачи на основании текущих данных.
3. `/verify/` показывает очередь заявок и черновиков.
4. `/verify/` показывает доступные операции только там, где текущие данные создают такую операцию.
5. После выполнения операции задача пересчитывается из данных.

Если пользователь не имеет нужных прав:

1. Очередь не открывается.
2. Операции не становятся доступными.
3. Temporary operator token остается совместимым, но не требуется для корректно настроенной учетной записи команды.

## 6. Граница безопасности

Исправление не меняет правила публикации кандидатов и не расширяет employer-facing visibility.

Сохраняются ограничения:

1. Операции выполняются только через backend permission checks.
2. Ответственный пользователь фиксируется через actor context.
3. Данные работодателю не раскрываются без соответствующих guard stages.
4. Ordinary account без группового доступа не получает операторскую очередь.
5. Temporary token compatibility сохранена только как переходный режим.

## 7. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Account session подключена к named operator/team access fallback; исправлены `user_id` и PostgreSQL boolean normalization для active user; team links могут открываться через account cookie session. |
| `projects/crewportglobal/public/verify/index.html` | Initial queue load больше не зависит от localStorage token; backend сам решает, есть ли доступ. |
| `projects/crewportglobal/public/team/index.html` | Team links запрашиваются через backend account session fallback, если пользователь вошел обычным account login. |
| `tests/crewportglobal-registration-api.spec.ts` | Добавлен API regression test для account session пользователя в `review_team`, который видит operator queue и computed team tasks без operator token. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 188. |
| `docs/crewportglobal/188_cpg_demand_025_account_session_team_access_recovery_report.md` | Добавлен этот отчет. |

## 8. Проверка

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Frontend syntax

Embedded scripts checked for:

```text
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/team/index.html
```

Result:

```text
verify: checked 2 inline scripts
team: checked 1 inline script
```

### 8.3 Focused API check - account session access

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator queue accepts account session"
```

Result: 1 passed.

The test confirms:

1. A normal account session can authenticate through `cpg_user_session`.
2. A user in `review_team` receives `view_review_queue`.
3. `/operator/review-queue` returns `access_model: account_team_session`.
4. The imported/test vacancy appears in the queue.
5. `/team/workbench/tasks` returns the computed task for the same vacancy.

### 8.4 Focused deletion regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator can request vacancy deletion"
```

Result: 1 passed.

### 8.5 Focused operator UI regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

### 8.6 API regression

```bash
npm run test:cpg-api
```

Result: 18 passed.

## 9. Итог этапа

Этап завершен.

Очередь и вычисленные задачи больше не зависят от ручного temporary operator token, если пользователь вошел обычной учетной записью и имеет правильную групповую принадлежность.

Следующий логичный этап: довести manager-confirmation workflow для заявок на удаление, чтобы удаленная заявка не просто скрывалась в pending deletion state, а попадала в явную задачу менеджеру на подтверждение или отклонение удаления.
