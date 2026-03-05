# Migration Blueprint v1

## Контекст и цель
Сейчас в одном пространстве смешаны два направления:
- **RJAKA** — игровой продукт (игровой чат + история чатов).
- **GTSTOR** — торговая платформа (сайт + пользовательский чат + административный чат).

Цель: разделить направления так, чтобы каждое можно было независимо развивать, деплоить, переносить и сопровождать без взаимного риска.

> Текущий документ — **план миграции**. Никаких переносов/рефакторинга в рамках этого этапа не выполняем.

---

## 1) Границы проектов (Target Ownership)

### A. RJAKA (игровой контур)
**Назначение:** игровой опыт, ассистент по правилам, история вопросов/ответов.

**Текущие артефакты (в рамках текущего репо):**
- `game-chat.html`
- `game_chat.php`
- `chat-qa.html`
- `admin/chat-qa.php`
- `admin/chat-qa-feedback.php`
- миграции anon chat:
  - `db/migrations/20260121_anon_chat.sql`
  - `db/migrations/20260305_anon_chat_feedback.sql`
  - `db/migrations/20260305_anon_chat_feedback_votes.sql`
- документация RJAKA:
  - `docs/rjaka-game-chat.md`
  - `docs/rjaka-design-standard.md`

**Данные RJAKA:**
- `anon_chats`
- `anon_chat_messages`
- `anon_chat_feedback_votes`

### B. GTSTOR (торговый контур)
**Назначение:** витрина/сайт, пользовательский и административный бизнес-чаты, биллинг/доступ.

**Текущие артефакты (кандидаты в GTSTOR):**
- `index.html`, `user/`, `news/`, `auth/`, `verify/`, `shared/`
- `chat/` (основной продуктовый чат)
- `admin/game-chat-admin.html` *(проверить принадлежность: если это не RJAKA admin, перенести в GTSTOR)*
- `chat_api.php`, `chat_api2.php`
- проектная документация GTSTOR:
  - `docs/project-overview.md`
  - `docs/TECHNICAL_DOCUMENTATION.md`
  - `docs/chat-user-current.md`
  - `docs/chat-admin-current.md`
  - `docs/chat-service-spec.md`

---

## 2) Рекомендуемая структура репозиториев

## Вариант (рекомендуемый): 2 отдельных репозитория

1. **rjaka-app**
   - `web/` (game-chat, chat-qa)
   - `api/` (game_chat.php, chat-qa endpoints)
   - `db/migrations/` (только RJAKA chat tables)
   - `docs/`

2. **gtstor-platform**
   - `web/` (site/user/news/auth/verify)
   - `chat/` (user/admin business chat)
   - `api/` (chat_api и related)
   - `db/migrations/` (GTSTOR tables)
   - `docs/`

3. **(Опционально) infra-shared**
   - только общие шаблоны CI/CD и ops-runbooks без продуктовой логики.

---

## 3) План миграции по этапам (без выполнения сейчас)

## Этап 0 — Freeze & inventory
- Заморозить крупные рефакторинги на период инвентаризации.
- Зафиксировать полный каталог артефактов по двум контурам.
- Зафиксировать матрицу зависимостей: страницы → API → DB → workflow → nginx.

**Deliverable:** `Component Inventory` + `Dependency Map`.

## Этап 1 — Data boundary
- Описать какие таблицы относятся к RJAKA, какие к GTSTOR.
- Подготовить политику миграции данных и ретеншна (архив/горячие данные).
- Установить принцип: новые таблицы создаются только в целевом контуре.

**Deliverable:** `Data Ownership Matrix`.

## Этап 2 — API boundary
- Для каждого API определить проект-владельца и контракт.
- Ввести префиксы/namespace для endpoint-ов (например `/rjaka/*`, `/gtstor/*`) на переходный период.
- Подготовить compatibility-layer (301/302/proxy) для старых URL.

**Deliverable:** `API Contract & Routing Plan`.

## Этап 3 — Repo split design
- Подготовить карту переноса папок/файлов в два репо.
- Определить историю миграции (`git filter-repo` или чистый перенос без истории).
- Определить owners и review-правила.

**Deliverable:** `Repo Split Spec`.

## Этап 4 — Infra split design
- Разделить CI/CD pipeline по проектам.
- Разделить env secrets (минимально необходимые права).
- Разделить наблюдаемость: отдельные дашборды, алерты, error logs.

**Deliverable:** `Deployment & Ops Plan`.

## Этап 5 — Cutover plan
- Порядок переключения: DB -> API -> frontend -> DNS/routes.
- Чек-лист smoke-тестов по каждому проекту.
- План отката с SLA и ответственными.

**Deliverable:** `Cutover Checklist + Rollback Plan`.

---

## 4) Риски и как их снизить

1. **Скрытые связи между чатами**
   - Митигировать: обязательная dependency-карта до переноса.

2. **Смешанные таблицы/данные**
   - Митигировать: строгая ownership-матрица + миграции только в целевой контур.

3. **Потеря обратной совместимости URL**
   - Митигировать: этап compatibility routing.

4. **Секреты и доступы пересекаются**
   - Митигировать: разделение credential-ов и least-privilege.

5. **Нарушение UX при cutover**
   - Митигировать: staged rollout + smoke + быстрый rollback.

6. **Смешение бренд-ассетов (favicon/logo/manifest) между проектами**
    - Митигировать: отдельные favicon-наборы и webmanifest для каждого проекта, запрет на кросс-использование путей.

---

## 4.1) Обязательное разделение favicon и бренд-ассетов

Для каждого проекта формируется независимый набор:

- **RJAKA**
   - хранение: `assets/rjaka/favicons/` *(или текущий `assets/game-chat/favicons/` как transitional path)*
   - используется только на страницах RJAKA (`game-chat.html`, `chat-qa.html`, связанные RJAKA admin/landing)
   - отдельный `rjaka.webmanifest`

- **GTSTOR**
   - хранение: `assets/gtstor/favicons/` *(или корневой набор как transitional path)*
   - используется только на страницах GTSTOR (`chat/`, `user/`, `news/`, site pages)
   - отдельный `gtstor.webmanifest`

### Правила
1. Никаких общих favicon-путей между RJAKA и GTSTOR в финальном состоянии.
2. Любая страница с `rel=icon` должна ссылаться только на набор своего проекта.
3. Для каждого проекта — отдельный smoke-check на favicon и manifest в CI.

### Проверка готовности по favicon
- все HTML-страницы классифицированы по owner-проекту;
- кросс-проектные ссылки вида `RJAKA page -> GTSTOR favicon` отсутствуют;
- оба набора favicon и webmanifest отдаются сервером с `200`;
- браузерный hard-refresh показывает корректные иконки для каждого проекта.

---

## 5) Definition of Ready для старта реальной миграции

Перед началом фактического переноса должны быть готовы:
- Утверждённая ownership-матрица (RJAKA vs GTSTOR).
- Утверждённая карта маршрутов и API-контрактов.
- Утверждённый формат split (2 repo) и структура каталогов.
- Готовый rollback runbook.
- Актуальный backup snapshot (код + БД).
- Актуальный DB baseline snapshot (см. `docs/db-baseline-20260305.md`) с row counts и freshness markers.

---

## 6) Практический порядок реализации (когда начнём перенос)

1. Отделить **RJAKA chat stack** (frontend + endpoints + migrations + docs).
2. Прогнать интеграционные smoke-тесты RJAKA на новом контуре.
3. Зафиксировать GTSTOR baseline после выноса RJAKA.
4. Разделить GTSTOR user/admin chat и сайт внутри второго контура.
5. Завершить routing compatibility и выключить старые связи.

---

## 7) Следующий шаг (планирование)

На ближайшую сессию подготовить 3 рабочих документа:
1. `component-inventory.csv` — полный список артефактов и владельцев.
2. `dependency-map.md` — связи страниц/API/БД/workflow/nginx.
3. `cutover-checklist.md` — пошаговый runbook с rollback.

Дополнительно (обязательный для исполнения cutover):
4. `db-ownership-matrix.md` — owner каждой таблицы и правила миграций/доступа.
