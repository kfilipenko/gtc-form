# Стандарт присвоения gtc_user_id

Цель: единообразно выдавать и переиспользовать внутренний идентификатор пользователя gtc_user_id как canonical internal entitlement key для биллинга и контроля доступа внутри GTC.

Важная оговорка текущего этапа:
- Этот документ не означает, что Telegram и Web уже объединены в одну модель учетных записей.
- До отдельной согласованной миграции Telegram и Web могут порождать отдельные user or account records.
- Совпадение email само по себе не является основанием для entitlement merge.

Актуальные платежные контракты runtime:
- Telegram: `payment_tg.php?gtc_user_id=...`
- Web: `payment.php?gtc_user_id=...&email=...`
- Ссылки вида `payment.php?user_id=...` считать legacy references, а не текущим контрактом runtime.
- Telegram runtime now binds Stripe customer identity by `gtc_user_id`, not by shared email.
- `client_reference_id = gtc_user_id` and `metadata.gtc_user_id = gtc_user_id` remain mandatory compatibility fields.

## Исходные данные
- Мастер-таблица пользователей: `public."user"` — источник истины для `gtc_user_id`.
- Исторические `gtc_user_id` находятся в диапазоне 1..3591 (пример: `gtc_user_id=3010` используется в платежном runtime-контексте).
- Все новые ID продолжают последовательность: 3592, 3593, ... (никаких “высоких” диапазонов).

## Правила назначения ID
1) Паспорта (telegram_id, email, google_sub, и др.) сопоставляются с пользователем; если паспорт найден — возвращаем ранее присвоенный `gtc_user_id`.
2) Если паспорт не найден — создаём пользователя в `public."user"` (INSERT), триггер присваивает новый `gtc_user_id` (3592+), после чего сохраняем привязку паспорта.
3) Все прикладные таблицы авторизации (auth.*) — только зеркалируют номер из `public."user"`.

## Правила применения
1) Если канал уже разрешил пользователя до `gtc_user_id`, downstream billing и access-control checks должны использовать именно `gtc_user_id`.
2) Email может храниться как контактный или billing attribute, но не как entitlement key.
3) Cross-channel identity merge не считается текущим инвариантом runtime и должен оформляться отдельным решением, а не предполагаться по умолчанию.
4) Telegram billing flow must resolve Stripe customer binding from `gtc_user_id`; совпадение email между Telegram и Web не считается основанием для объединения entitlement identity.

## Реализации

### Google OAuth
Обработчик `GET /auth/google/callback` вызывает `gtc.ensure_master_user_by_email(email, name)` — тем самым либо получает, либо создаёт мастер-запись в `public."user"` и её `gtc_user_id` (3592+). Затем номер зеркалируется в `auth.auth_google` и `auth.users`.

### Telegram (n8n)
Ваш существующий пайплайн остаётся без изменений. Первая вставка в `public."user"` (ins_user) триггером получает новый `gtc_user_id`. Повторный вход по тому же `telegram_id` даст тот же `user_id/gtc_user_id`.

## Опционально: Служебные функции/триггеры (для БД)
Для упрощения интеграций внедрены функции/триггеры в БД:
- `gtc.next_gtc_user_id()` — следующий ID из `auth.gtc_user_id_seq`.
- `gtc.ensure_master_user_by_email(email, name)` — гарантирует запись в `public."user"`, возвращает `user_id` и `gtc_user_id`.
- Триггер `BEFORE INSERT` на `public."user"` автоматически присваивает `gtc_user_id` при первой вставке.

## Эксплуатационные заметки
- Последовательность `auth.gtc_user_id_seq` должна быть всегда ≥ максимального ID в обеих таблицах: `auth.users` и `public."user"`.
- Не переносите «высокие» ID в легаси-диапазон — это может сломать исторические артефакты и ссылки совместимости.
- Не используйте email как основание для entitlement merge между Telegram и Web без отдельного согласованного решения.
- Не возвращайте `payment.php?user_id=...` в новые документы или новые runtime-контракты.
- Для Telegram payment runtime поддерживайте server-side Stripe binding через `gtc_user_id -> stripe_customer_id -> Customer Session`; требуемые PG* и `STRIPE_SECRET_KEY` должны приходить через host-level PHP-FPM env wiring, а не из repo-файлов.
- Все сервисы должны придерживаться правил выше. В идеале назначение ID централизуется в БД функциями (см. Опционально), либо повторяется как шаблон в коде каналов регистрации.

---
Вопросы/изменения: откройте тикет и укажите канал (Google/Telegram/Email), чтобы проверить, что логика назначения ID соответствует стандарту.
