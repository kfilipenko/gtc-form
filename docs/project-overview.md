# Обзор проекта GTC

## Каноническая матрица чатов (источник истины)
- Административный чат GTC: `https://app.gtstor.com/chat/`
- Пользовательский чат GTC: `https://app.gtstor.com/user/`
- Игровой чат RJAKA: `https://rjaka.pro/chat/`

RJAKA history route:
- `https://rjaka.pro/chat/history/`

Legacy compatibility routes (не primary):
- `/game-chat.html` -> `/chat/`
- `/chat-qa.html` -> `/chat/history/`

## Как настраивается адрес каждого чата
1. `https://app.gtstor.com/chat/` (админ-чат GTC)
- Проект: `gtc-core-web`
- Nginx vhost: `/etc/nginx/sites-enabled/app.gtstor.com`
- Root кода: `/var/www/gtc-form`
- Frontend path: `/var/www/gtc-form/chat/`

2. `https://app.gtstor.com/user/` (пользовательский чат GTC)
- Проект: `gtc-core-web`
- Nginx vhost: `/etc/nginx/sites-enabled/app.gtstor.com`
- Root кода: `/var/www/gtc-form`
- Frontend path: `/var/www/gtc-form/user/`

3. `https://rjaka.pro/chat/` (игровой чат RJAKA)
- Проект: `rjaka-web`
- Nginx vhost: `/etc/nginx/sites-enabled/www.rjaka.pro`
- Root кода: `/var/www/gtc-form`
- Compat include: `/var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf`
- Compat mapping: `/chat/` -> `/game-chat.html`, `/chat/history/` -> `/chat-qa.html`

## Назначение
- Единую витрину и точку входа для сервисов GTC (витрина `/user/` на app.gtstor.com).
- Маркетинговый лендинг и шлюз доступа (репозиторий gtc-site, Next.js).
- Поддержку, чат и оплату: админ-чат на app.gtstor.com/chat, пользовательский чат на app.gtstor.com/user, биллинг на pay.gtstor.com.

## Архитектура взаимодействия
1) Пользователь открывает витрину `/user/` на app.gtstor.com (GTC1). Витрина показывает ссылки на сервисы:
   - Пользовательский чат (`/user/`, после авторизации и проверки доступа).
   - Административный/операторский чат (`/chat/`) для поддержки и управления.
   - Новости (app.gtstor.com/news/).
   - Кабинет/профиль (app.gtstor.com/user/ — сама витрина или связанный раздел).
   - Web payment portal (https://pay.gtstor.com/payment.php).
   - Telegram runtime payment entrypoint (https://pay.gtstor.com/payment_tg.php).
   - GTChain, Telegram-бот и др. внешние ссылки.
2) gtc-site (Next.js 14) обрабатывает SSR-маршруты `/auth` и `/chat`:
   - Извлекает доступные идентификаторы пользователя из query/cookies; для billing и entitlement canonical internal key remains `gtc_user_id`.
   - Строит AccessTicket по локальным JSON: data/users.json и data/subscriptions.json (опционально внешний API подписок).
   - Формирует decision: при доступе — отправляет в чат (`CHAT_URL`, по умолчанию https://app.gtstor.com/chat/); при отсутствии подписки — для web flow даёт ссылку на оплату (`PAYMENT_URL`, по умолчанию https://pay.gtstor.com/payment.php?gtc_user_id=...).
   - Этот пункт описывает web/SSR gateway и не должен использоваться как описание активного Telegram payment runtime.
   - При ошибке показывает Service Hub с статусом и ссылкой на поддержку (help@gtstor.com).
3) Админ-чат (app.gtstor.com/chat/) — фронтенд операторского/административного контура.
4) Пользовательский чат (app.gtstor.com/user/) — фронтенд пользовательского контура.
5) Игровой чат RJAKA (rjaka.pro/chat/) — отдельный домен и отдельный проектный контур.
6) Оплата:
   - Web flow: pay.gtstor.com/payment.php — текущая web payment page; runtime не менялся в этом шаге и по-прежнему использует `gtc_user_id` и `email`.
   - Telegram flow: pay.gtstor.com/payment_tg.php — текущая Telegram payment page; runtime now resolves `gtc_user_id -> stripe_customer_id -> Stripe Customer Session -> Pricing Table / Checkout`, preserves `client_reference_id` and `metadata.gtc_user_id`, and treats `email` only as optional billing/contact data.
   - Runtime validation on 2026-04-04 confirmed that a Telegram user completed subscription checkout successfully, a trial subscription was created, access was granted, and reuse of the same email no longer triggered an email-based "already subscribed" block in the Telegram flow.
   - Operational dependency: payment_tg.php requires host-level PHP-FPM env exposure for PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, and STRIPE_SECRET_KEY.

## Основные URL и роли
- Витрина: app.gtstor.com/user/ — ссылки на сервисы, витринный экран.
- Пользовательский чат: app.gtstor.com/user/ — основной пользовательский контур общения.
- Административный чат: app.gtstor.com/chat/ — административный/операторский контур.
- Лендинг: gtc-site `/` (Hero + CTA, ссылки на Telegram, новости, чат, GTChain).
- Доступ: gtc-site `/auth`, `/chat` — SSR решает доступ и перенаправляет.
- Игровой чат RJAKA: rjaka.pro/chat/ — отдельный игровой контур.
- Новости: app.gtstor.com/news/.
- Web payment: pay.gtstor.com/payment.php.
- Telegram payment runtime: pay.gtstor.com/payment_tg.php.
- Поддержка: help@gtstor.com (mailto).

## Витрина /user/
- Назначение: точка входа и витрина с ссылками (чат, новости, оплата, Telegram, GTChain и др.).
- Логирование: фронтенд отправляет события `page_view` и `link_click` через общий логгер (attachLogger → /chat_api.php, режим log). Маскируется email, используется текущая сессия.
- Хранение: записи попадают в таблицу `chat_messages` (роль `system`, source `web_user_analytics`) и журнал `/var/www/gtc-form/chat_transactions.log` для трассировки.
- Просмотр журнала: tail -f /var/www/gtc-form/chat_transactions.log (на сервере GTC1) или выборка из БД по source `web_user_analytics`.

## Поток данных доступа
- Источники: data/users.json (флаг chatAccess, gtcUserId), data/subscriptions.json (active, planName, expiresAt); env SUBSCRIPTION_STATUS_ENDPOINT может давать внешний статус.
- Решение: hasDirectAccess OR hasSubscription → hasChatAccess; reason: direct_access | subscription | inactive_subscription | user_not_found.
- Результат: redirect в чат или выдача payment URL; при ошибке — сообщение и поддержка.

## Ссылки на документацию
- Полная техдок gtc-site: [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md).
- Реестр приложений и доменов сервера: [docs/ops/server-applications-registry.md](docs/ops/server-applications-registry.md).
- Стандарт хранения и бэкапов: [docs/ops/storage-architecture-standard.md](docs/ops/storage-architecture-standard.md).
- Паспорта приложений и runbooks: [docs/apps/README.md](docs/apps/README.md).

## Заметки по улучшениям (фиксировать в бэклоге)
- Подписывать идентификатор пользователя (JWT/подписанные cookies), не доверять сырому query.
- Ветвление в resolveRedirectDecision: chat/payment/denied с логированием.
- Ограничить и логировать override SUBSCRIBED_USER_IDS/PLAN/EXPIRES.
- Расширить тесты SSR `/auth` и `/chat`, UI ServiceHub.
- Добавить мониторинг ошибок витрины и лендинга (client-side exceptions).
