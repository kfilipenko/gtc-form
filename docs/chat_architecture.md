# GTC Web Chat — архитектурное описание

## 1. Назначение и границы системы
- **Файл реализации:** `chat/index.html` — единая HTML‑страница с inline CSS/JS.
- **Цель:** выдать пользователю `gtc_user_id`, предоставить чат с агентом n8n и связать переписку с серверной сессией.
- **Внешние зависимости:**
  - Auth API (`/auth/login`, `/auth/google/`, `/auth/email/`, `/auth/otp/*`, `/auth/profile`).
  - Платёжная страница `https://pay.gtstor.com/payment.php`.
  - Chat webhook `https://agent.gtstor.com/webhook/chat` (n8n workflow «GTC Sales Agent - Web Chat»).
- **Браузерные API:** `fetch`, `localStorage`, `crypto.randomUUID`, `navigator.clipboard`, `Intl.DateTimeFormat`.

## 2. UI-слои
- **Общий макет:** двухколоночная сетка (`.layout`) — слева управление аккаунтом, справа чат.
- **Sidebar (aside):** карточки с авторизацией, быстрым входом (Google + OTP), текущей сессией, FAQ и платёжной ссылкой. Секция `#userSection` показывается после успешного входа.
- **Main pane:**
  - `#statusLabel` и `#stageLabel` выводят технический статус.
  - `#chatLog` — история сообщений (локально хранится до 50 записей).
  - `#techPanel` — системные уведомления (ошибки, подсказки).
  - `#chatForm` — текстовая область + кнопка отправки, поддержка Shift+Enter.

## 3. Состояния и локальное хранилище
- **Глобальный `state`:** `{ user, sending, sessionId, history, traceId }`.
- **Ключи localStorage:**
  - `chat:user` — сериализованный объект пользователя (email, gtc_user_id, user_id).
  - `chat:session` — UUID текущего чата; сохраняется между перезагрузками.
  - `chat:history` — массив последних сообщений (обрезается до 50).
  - Дополнительно: `gtc_user_id` сохраняется отдельно для совместимости со сторонними скриптами.
- **Инициализация:** при загрузке восстанавливает пользователя, сессию и историю, обновляет UI.
- **Сброс:**
  - `resetSession()` — генерирует новый `session_id`, сообщает пользователю через system message.
  - `clearHistory()` — очищает лог и localStorage.

## 4. Потоки авторизации
### 4.1 Email + пароль (`#authForm`)
1. Валидация данных на клиенте.
2. `postJson('/auth/login', { email, password })` с `credentials: 'include'`.
3. Обработка кодов 401/403 и бизнес-ошибок (`email_not_verified`).
4. При успехе `saveUser()` обновляет `state.user`, UI и сохраняет профиль в localStorage.

### 4.2 OAuth и быстрый вход
- **Google:** кнопка `#googleBtn` перенаправляет на `/auth/google/?next=%2Fchat`.
- **OTP:**
  1. `otpRequestBtn` → `/auth/otp/request` (email из поля `#otpEmail`).
  2. После ответа включается ввод кода и `otpVerifyBtn`.
  3. `otpVerifyBtn` → `/auth/otp/verify` с email + кодом.
  4. Успешная проверка вызывает `saveUser()` и чистит поля.

### 4.3 Управление сессией пользователя
- **Профиль:** `refreshProfileBtn` запрашивает `/auth/profile`, обновляет `gtc_user_id` при успехе.
- **Выход:** `logoutBtn` удаляет `chat:user`, скрывает user-UI и показывает подсказку в чате.
- **Копирование ID:** `copyIdBtn` использует `navigator.clipboard`.

## 5. Работа с сообщениями
### 5.1 Локальный лог
- `pushMessage(role, text, meta)` формирует запись с `ts` и meta (trace/stage).
- Сообщения рендерятся в `#chatLog`, метаданные отображаются в `msg-meta`.
- `pushSystem(text, tone)` использует `#techPanel` для заметок (ошибки, подсказки, лимиты).

### 5.2 Отправка на backend
1. `chatForm` перехватывает submit, блокирует отправку без `state.user.gtc_user_id`.
2. `sendMessage()`:
   - предотвращает параллельные запросы (`state.sending`).
   - пушит сообщение пользователя в лог.
   - строит payload `buildPayload()`:
     ```json
     {
       "channel": "web",
       "message": "...",
       "session_id": "uuid",
       "client": {
         "gtc_user_id": "...",
         "user_id": "...",
         "email": "...",
         "locale": "ru-RU",
         "timezone": "Europe/Moscow",
         "metadata": { "full_name": "..." }
       },
       "metadata": {
         "page": "/chat",
         "user_agent": "Mozilla/…",
         "language": "ru-RU"
       }
     }
     ```
   - отправляет POST на `https://agent.gtstor.com/webhook/chat`.
3. Ответ обрабатывается `handleAgentResponse()`:
   - **401 / `unauthorized`:** очищает локального пользователя, просит войти заново.
   - **402 / `payment_required`:** инициирует подсказку об оплате подписки.
   - **5xx / `status: error`:** сообщает о серверной ошибке и не изменяет историю.
   - **Успех:** берёт `reply`/`output`, trace/stage метаданные и пушит сообщение бота.

## 6. UI статусы и обратная связь
- `updateStatus(label, tone)` меняет цвет бейджа Status.
- `setChatStatus(message, variant)` показывает inline уведомления под формой ввода.
- `techPanel` хранит последний системный сигнал (например, «Session reset…» или «Ошибка сети»).
- OTP/auth формы имеют собственные статусы (`setAuthStatus`, `setOtpStatus`).

## 7. Безопасность и ограничения
- Пароли/OTP не кэшируются после отправки; поля очищаются только при success.
- Все auth запросы используют `credentials: 'include'` для привязки к сессионным cookie.
- Чат не формирует и не пересылает JWT; backend полагается на серверные cookie и `gtc_user_id`.
- История хранится только в браузере; серверный контекст определяется `session_id`, который пользователь может сбросить.
- Максимум 50 локальных сообщений; очистка history не затрагивает серверную переписку.

## 8. Точки расширения
- Добавление серверного хранения истории можно сделать в `sendMessage()`/`handleAgentResponse()` (payload уже содержит `session_id`).
- Поддержка ставок/тарифов реализуется через проверку 402; переход на платёжную страницу уже встроен.
- Простой способ добавить другие каналы auth — расширить `quickAuthSection` и использовать существующие `postJson`/`saveUser` механизмы.

## 9. Проверка работоспособности
1. Авторизация email/пароль → ожидать появления `gtc_user_id` в `#userSection`.
2. Нажать «New chat» — убедиться, что `session_id` и подсказка обновились.
3. Отправить сообщение и получить ответ от webhooks; статус в `#chatStatus` должен стать «Готово (trace …)».
4. Симулировать 401 (например, удалить cookie и отправить запрос) — интерфейс должен сбросить пользователя и запросить повторный вход.

Документ отражает состояние `chat/index.html` на момент последнего чтения файла (≈700 строк). Обновляя клиент, синхронизируйте этот документ, чтобы сохранить актуальность описания потоков и зависимостей.
