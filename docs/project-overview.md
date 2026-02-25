# Обзор проекта GTC

## Назначение
- Единую витрину и точку входа для сервисов GTC (витрина `/user/` на app.gtstor.com).
- Маркетинговый лендинг и шлюз доступа (репозиторий gtc-site, Next.js).
- Поддержку, чат и оплату: чат на app.gtstor.com/chat, биллинг на pay.gtstor.com.

## Архитектура взаимодействия
1) Пользователь открывает витрину `/user/` на app.gtstor.com (GTC1). Витрина показывает ссылки на сервисы:
   - Чат консультанта (ведёт в gtc-site `/auth` или `/chat` с user_id).
   - Новости (app.gtstor.com/news/).
   - Кабинет/профиль (app.gtstor.com/user/ — сама витрина или связанный раздел).
   - Портал оплаты (https://pay.gtstor.com/payment.php).
   - GTChain, Telegram-бот и др. внешние ссылки.
2) gtc-site (Next.js 14) обрабатывает SSR-маршруты `/auth` и `/chat`:
   - Извлекает идентификатор пользователя из query/cookies (ключи user_id/userId/gtc_user_id и т.д.).
   - Строит AccessTicket по локальным JSON: data/users.json и data/subscriptions.json (опционально внешний API подписок).
   - Формирует decision: при доступе — отправляет в чат (`CHAT_URL`, по умолчанию https://app.gtstor.com/chat/); при отсутствии подписки — даёт ссылку на оплату (`PAYMENT_URL`, по умолчанию https://pay.gtstor.com/payment.php?user_id=...).
   - При ошибке показывает Service Hub с статусом и ссылкой на поддержку (help@gtstor.com).
3) Чат (app.gtstor.com/chat/) — фронтенд поддержки/консультанта. Получает пользователя уже после SSR-решения или прямого входа.
4) Оплата (pay.gtstor.com/payment.php) — принимает user_id, позволяет продлить/оформить доступ.

## Основные URL и роли
- Витрина: app.gtstor.com/user/ — ссылки на сервисы, витринный экран.
- Лендинг: gtc-site `/` (Hero + CTA, ссылки на Telegram, новости, чат, GTChain).
- Доступ: gtc-site `/auth`, `/chat` — SSR решает доступ и перенаправляет.
- Чат: app.gtstor.com/chat/ — основное приложение поддержки.
- Новости: app.gtstor.com/news/.
- Оплата: pay.gtstor.com/payment.php.
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

## Заметки по улучшениям (фиксировать в бэклоге)
- Подписывать идентификатор пользователя (JWT/подписанные cookies), не доверять сырому query.
- Ветвление в resolveRedirectDecision: chat/payment/denied с логированием.
- Ограничить и логировать override SUBSCRIBED_USER_IDS/PLAN/EXPIRES.
- Расширить тесты SSR `/auth` и `/chat`, UI ServiceHub.
- Добавить мониторинг ошибок витрины и лендинга (client-side exceptions).
