# GTC Site — Полная техническая документация проекта

Источник: https://github.com/gtc-ia/gtc-site/blob/main/docs/TECHNICAL_DOCUMENTATION.md (зеркало от 2026-02-14).

## 1. Назначение проекта

**GTC Site** — это Next.js-приложение, объединяющее:
- маркетинговый лендинг (главная страница с 3D-hero);
- серверный шлюз доступа к сервисам GTC (страницы `/auth` и `/chat`);
- страницу-хаб доступных сервисов в зависимости от состояния пользователя и подписки.
Ключевая задача: определить пользователя по query/cookies, проверить доступ через локальные JSON-источники (и опционально внешний API подписок), а затем либо направить в чат, либо показать состояние доступа и действия (оплатить, написать в поддержку).
---

## 2. Технологический стек

- **Framework**: Next.js 14 (Pages Router).
- **UI**: React 18 + TypeScript.
- **3D**: `@react-three/fiber`, `three`, `@react-three/drei`.
- **Стили**: Tailwind CSS + PostCSS.
- **Тесты**: встроенный `node:test` c запуском через `tsx`.

Скрипты проекта:
- `npm run dev` — development.
- `npm run build` — production build.
- `npm run start` — production server.
- `npm run test` — запуск тестов доступа и подписок.

---

## 3. Архитектура высокого уровня

### 3.1 Подсистемы

1. **Landing subsystem**
   - Рендерит главную (`/`) с SEO-тегами, CTA-кнопками и ленивой 3D-сценой.

2. **Access Gateway subsystem**
   - SSR-страницы `/chat` и `/auth` извлекают `userId` из query/cookies.
   - Формируют `AccessTicket` через библиотеку доступа.
   - Возвращают props для `ServiceHubPage` или делают redirect.

3. **Data Access subsystem**
   - Читает пользователей и подписки из JSON-файлов с кэшем по `mtime`.
   - Поддерживает lookup по `userId`, `gtcUserId` и alias.

4. **Service Hub UI subsystem**
   - Унифицированная страница статуса доступа с карточками сервисов.
   - Отображает reason, план, дату окончания, и доступные CTA.

---

## 4. Структура каталогов

- `src/pages/` — маршруты Next.js (landing + auth/chat маршрутизация).
- `src/components/` — переиспользуемые UI-компоненты hero-блока.
- `src/features/service-hub.tsx` — страница центра сервисов.
- `src/lib/` — бизнес-логика доступа/подписок/чтения БД-файлов.
- `data/` — локальные production-like JSON-данные пользователей и подписок.
- `tests/fixtures/` — фикстуры для автотестов.
- `tests/` — unit/integration-like тесты бизнес-логики.
- `public/` — статика и SEO-файлы (`robots.txt`, `sitemap.xml`).

---

## 5. Маршруты и их поведение

## 5.1 `/` (лендинг)
- SEO-метаданные (title, description, OpenGraph, Twitter).
- Кнопка `Customer Portal` (Stripe billing portal).
- Hero с CTA:
  - Telegram Consultant
  - Read the news
  - Web Chat Consultant
  - Visit GTChain
- Подложка: ленивый `Hero3DCanvas`, SSR отключён (`ssr: false`).

## 5.2 `/chat` и `/chat/[...slug]`
- `/chat/[...slug]` реэкспортирует `/chat/index.tsx`.
- SSR алгоритм:
  1) взять идентификатор из query/cookies; при наличии `gtc_user_id` он имеет приоритет, а `user_id`/`userId` считаются legacy compatibility inputs;
  2) если не найден — вернуть ошибку в props;
  3) получить `ticket` через `resolveAccessTicket`;
  4) построить `paymentUrl` для web/SSR flow с `gtc_user_id`;
  5) отдать `ServiceHubPage`.

> Эта часть документа описывает только web/SSR gateway. Активный Telegram payment runtime uses `https://pay.gtstor.com/payment_tg.php`, уже реализован как customer-bound flow через `gtc_user_id`, и не определяется этим разделом.

## 5.3 `/auth`, `/auth/router`, `/auth/[...slug]`
- `/auth/index.tsx` и `/auth/[...slug]` реэкспортируют `./router`.
- В `router.tsx` используется `resolveRedirectDecision`:
  - при `decision.type === "redirect"` выполняется redirect на `decision.destination`;
  - при ошибке/невозможности — рендерится `ServiceHubPage`.

> Текущее фактическое поведение `resolveRedirectDecision`: всегда возвращает redirect на `chatUrl`, при этом кладёт в payload рассчитанный `ticket`.
---

## 6. Бизнес-логика доступа

## 6.1 AccessTicket

`AccessTicket` содержит:
- `lookupId` — исходный идентификатор;
- `user` — запись пользователя (если найдена);
- `subscription` — запись подписки (если найдена);
- `hasDirectAccess` — прямой доступ (флаг `chatAccess` пользователя);
- `hasSubscription` — активная подписка;
- `hasChatAccess` — OR между direct/subscription;
- `reason` — одно из:
  - `direct_access`
  - `subscription`
  - `inactive_subscription`
  - `user_not_found`

## 6.2 Источники и порядок принятия решения

Для `resolveAccessTicket`:
1. lookup пользователя (`getUserFromDatabase`);
2. lookup подписки (`getSubscriptionFromDatabase`) с учётом `gtcUserId`;
3. вычисление итоговых флагов и reason.

Для `fetchSubscriptionStatus`:
1. override через `SUBSCRIBED_USER_IDS`;
2. внешний endpoint `SUBSCRIPTION_STATUS_ENDPOINT`;
3. локальная JSON-БД подписок (`data/subscriptions.json`);
4. встроенный fallback `STATIC_SUBSCRIPTIONS`;
5. иначе `active: false`.

---

## 7. Модели данных и форматы

## 7.1 Пользователь (`data/users.json`)

Поддерживаемые поля (вход):
- `userId`: string|number
- `gtcUserId`: string|number|null
- `providers`: string[] | строка (`","`/`;` разделители)
- `chatAccess` или `chat_access`: boolean|number|string

Нормализация:
- пустые id отбрасываются;
- `chatAccess` приводится к boolean по набору значений (`true/1/yes/enabled`, `false/0/no/disabled`);
- создаются map-индексы по `userId` и `gtcUserId`.

## 7.2 Подписка (`data/subscriptions.json`)

Поддерживаемые поля:
- `userId`: string
- `active`: boolean
- `planName`: string|null
- `expiresAt`: string|null

Lookup кандидаты: основной `userId`, затем `gtcUserId`, затем `aliases`.

## 7.3 Пример production seed

- `data/users.json`: пользователь `3001`, `chatAccess: false`.
- `data/subscriptions.json`: подписка `3001`, `active: true`, план `default`.

---

## 8. Переменные окружения

| Переменная | Назначение | Значение по умолчанию |
|---|---|---|
| `CHAT_URL` / `NEXT_PUBLIC_CHAT_URL` | URL целевого чата | `https://app.gtstor.com/chat/` |
| `PAYMENT_URL` / `NEXT_PUBLIC_PAYMENT_URL` | Web payment URL | `https://pay.gtstor.com/payment.php` |
| `SUPPORT_EMAIL` / `NEXT_PUBLIC_SUPPORT_EMAIL` | Email поддержки | `help@gtstor.com` |
| `USER_DB_PATH` | путь к users.json | `data/users.json` |
| `SUBSCRIPTION_DB_PATH` | путь к subscriptions.json | `data/subscriptions.json` |
| `SUBSCRIPTION_STATUS_ENDPOINT` | внешний API статуса подписки | unset |
| `SUBSCRIBED_USER_IDS` | override-список id через запятую | unset |
| `SUBSCRIBED_PLAN_NAME` | план для override | unset |
| `SUBSCRIBED_EXPIRES_AT` | expiry для override | unset |

---

Telegram runtime payment URL is `https://pay.gtstor.com/payment_tg.php`.
This document does not define the Telegram payment runtime contract.
Current runtime status outside this app: Telegram billing now resolves `gtc_user_id -> stripe_customer_id -> Stripe Customer Session -> Pricing Table / Checkout`, preserves `client_reference_id` and `metadata.gtc_user_id`, and does not use email as the entitlement identity.
The web `PAYMENT_URL` flow remains unchanged.
Operational dependency: `payment_tg.php` requires host-level PHP-FPM env wiring for `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `STRIPE_SECRET_KEY`.

---

## 9. UI-компоненты и frontend

## 9.1 HeroOverlay
- Контентная часть hero c CTA-кнопками и внешними ссылками.
- Общий button style через `buttonBase`.

## 9.2 Hero3DCanvas
- `Canvas` с камерой, anti-aliasing, `dpr [1,2]`.
- Сцена: 1 сфера + 3 тора + ambient/point lights.
- Анимация вращений через `useFrame`.

## 9.3 ServiceHubPage
- Показывает reason/status, параметры подписки, карточки сервисов.
- Карточки собираются функцией `buildServiceCards(ticket, chatUrl, paymentUrl, supportHref)`.
- В зависимости от статуса меняются badge/accent/action.

---

## 10. SEO и статические файлы

- `public/robots.txt` разрешает индексацию и указывает sitemap.
- `public/sitemap.xml` содержит базовый URL сайта.
- `public/fallback-hero.png` используется как OG/Twitter image.

---

## 11. Конфигурация сборки

- `next.config.js`:
  - `reactStrictMode: true`
  - `swcMinify: true`

- `tsconfig.json`:
  - `strict: true`, `moduleResolution: bundler`, `noEmit: true`;
  - alias `@/* -> src/*`.

- `tailwind.config.js`:
  - сканирование `src/pages/**/*` и `src/components/**/*`.

---

## 12. Тестирование

Текущие тесты:
1. `tests/access-gateway.test.ts`
   - проверяет связывание пользователя и подписки через `gtcUserId`.
2. `tests/subscription.test.ts`
   - проверяет fallback-статус;
   - проверяет обработку `trialing` через mock fetch;
   - проверяет связку user -> subscription через фикстуры.

Запуск:
```bash
npm test
```

---

## 13. Эксплуатация и сопровождение

## 13.1 Добавить/обновить пользователя
1. Изменить `data/users.json` (или файл по `USER_DB_PATH`).
2. Проверить наличие `userId` и (по возможности) `gtcUserId`.
3. При необходимости выставить `chatAccess: true` для прямого доступа.

## 13.2 Добавить/обновить подписку
1. Изменить `data/subscriptions.json`.
2. Заполнить `userId`, `active`, `planName`, `expiresAt`.
3. Убедиться, что `userId`/`gtcUserId` связаны с пользователем.

## 13.3 Подключить внешний API подписок
1. Установить `SUBSCRIPTION_STATUS_ENDPOINT`.
2. API должен возвращать JSON с одним из ключей: `active`, `isActive`, `subscription_active`, `hasSubscription`, `subscription`, `status`.
3. Дополнительно (опционально): `planName`, `expiresAt`.

---

## 14. Известные особенности текущей реализации

1. В `resolveRedirectDecision` сейчас нет ветвления по статусу доступа — возврат всегда redirect на chat URL.
2. `tailwind.config.js` не сканирует `src/features/**/*`; если добавлять новые utility-классы только в feature-файлах, стоит расширить `content`.
3. В `ServiceHubPage` `supportEmail` типизирован как optional, но в SSR-потоке заполняется всегда через defaults/env.

---

## 15. Минимальный runbook (для новых разработчиков)

1. Установить зависимости: `npm install`.
2. Создать/проверить env (минимум — дефолты уже есть в коде).
3. Запустить локально: `npm run dev`.
4. Проверить:
   - `/` (лендинг),
  - `/chat?gtc_user_id=3001`,
  - `/chat?gtc_user_id=unknown-user`,
  - `/auth?gtc_user_id=3001`.
5. Перед релизом: `npm run test && npm run build`.

---

## 16. Рекомендации по развитию

- Вынести логику extraction `userId` в shared utility (сейчас дублируется в `auth/router.tsx` и `chat/index.tsx`).
- Доработать `resolveRedirectDecision`: реальный выбор между chat/payment/service-hub в зависимости от `ticket`.
- Добавить тесты на рендер `ServiceHubPage` (snapshot/RTL).
- Ввести linting и форматирование в CI (ESLint + Prettier).
- Рассмотреть миграцию источников данных с JSON на сервис/БД при росте нагрузки.
