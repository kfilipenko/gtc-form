# GTC Web Chat — архитектурное описание

> Актуально для файла `chat/index.html` (≈700 строк, включает всю верстку, стили и JS-логику).
>
> Для публичного домена `rjaka.pro` актуальные URL -> файл вынесены отдельно: `chat/docs/rjaka_routes.md`.

## 1. Назначение и внешние зависимости
- **Цель:** выдать пользователю `gtc_user_id`, управлять подпиской и предоставить чат с n8n-агентом «GTC Sales Agent - Web Chat».
- **Фронтенд:** одиночная HTML-страница с inline CSS и IIFE-скриптом, не требует сборки.
- **API/Сервисы:**
  - `/auth/login`, `/auth/email/`, `/auth/google/`, `/auth/otp/request`, `/auth/otp/verify`, `/auth/profile` — авторизация и получение `gtc_user_id`.
  - `/chat_api.php` — PHP-ресивер/логгер: принимает `mode:"log"` из браузера, пишет входящие/исходящие сообщения в Postgres и ведёт журнал транзакций; `proxy`-режим оставлен как резервный.
  - `https://agent.gtstor.com/webhook/chat` — n8n workflow, вызывается напрямую из фронтенда (браузер → n8n) без PHP-прокси.
  - `https://pay.gtstor.com/payment.php` — оплата подписки.
  - SMTP Timeweb (`smtp.timeweb.ru`) — отправка писем от `noreply@gtstor.com`; для домена `gtstor.com` необходимо держать SPF запись `v=spf1 include:_spf.timeweb.ru ~all`, иначе письма попадают в спам.
- **Browser API:** `localStorage`, `fetch`, `crypto.randomUUID`, `navigator.clipboard`, `Intl.DateTimeFormat`, `navigator.language`.

### 1.1 `session_id` vs `chat_id`
- **`session_id`** — пользовательский идентификатор чата. Генерируется на фронте, показывается в UI, участвует в Stripe/оплатах и всегда отправляется в n8n. Пользователь управляет только им (кнопка «New chat session»).
- **`chat_id`** — серверный UUID, которым оперируют `/chat_api.php`, Postgres и `chat_transactions.log`. Он синхронизируется с `session_id`, но остаётся отдельным полем, чтобы SQL-журнал и сервисы с очередями могли эволюционировать независимо.
- Оба поля присутствуют в payload: `session_id` для UX/интеграций, `chat_id` для долговременной истории.

## 2. UI-структура
- **Макет:** `.layout` — грид 2 колонки (sidebar + main). На мобайле сворачивается в одну колонку.
- **Sidebar (`<aside>`):**
  - `#userSection` — информация о пользователе, `gtc_user_id`, email, кнопки `New chat`, `Clear chat`, `Обновить профиль`, линк на оплату.
  - `#authSection` — форма email/пароль, вызывающая `/auth/login` через `fetch`.
  - `#signupSection` — встроенные формы регистрации, повторной отправки письма и кнопка «Проверить доступ» без перехода со страницы.
  - `#quickAuthSection` — контейнер для Google Identity Services (GIS) кнопки + OTP-поток (поле email, запрос/подтверждение кода, статус) с fallback-кнопкой на прежний `/auth/google`.
  - FAQ блок с подсказками по `session_id` и подписке.
- **Main (`<main class="chat-pane">`):**
  - `#statusLabel` / `#stageLabel` — технический бейдж состояния.
  - `#chatLog` — история сообщений (привязана к localStorage).
  - `#techPanel` — системные уведомления (ошибки, подсказки).
  - `#chatForm` — textarea + кнопка отправки, подсказка «Shift+Enter».
  - `#chatStatus` — inline статус последнего действия.

## 3. Глобальное состояние и хранение
```js
const state = {
  user: loadUser(),           // email, gtc_user_id, id, full_name
  sending: false,             // флаг активного запроса
  sessionId: ensureSession(), // пользовательский session_id, показывается в UI
  chatId: loadChatId(),       // последний chat_id, полученный от backend/n8n
  sqlChatId: loadSqlChatId(), // chat_id, который вернул `/chat_api.php` во время логирования
  history: loadHistory(),     // последние 50 сообщений
  traceId: null
};
```
- **localStorage ключи:** `chat:user`, `chat:session` (user-facing `session_id`), `chat:history`, `chat:active-id` (актуальный `chat_id`), `chat:sql-id` (что сохранил PHP-логгер), дополнительно `gtc_user_id`.
- **История:** массив `{ role, text, meta, ts }`, обрезается до 50 записей, восстанавливается при загрузке.
- **Сессия:** `resetSession()` генерирует новый `session_id`, обновляет UI и сбрасывает оба chat-id. Первое сообщение после сброса получит новый `chat_id` из ответа сервера.

## 4. Авторизация и управление пользователем
### 4.1 Email + пароль
1. Submit `#authForm` → `postJson('/auth/login', body)` с `credentials:'include'`.
2. 401 → «Неверный email или пароль», 403/email_not_verified → подсказка подтвердить email.
3. После успеха вызывается `hydrateUserFromProfile()` — чат делает `fetch('/auth/profile')`, получает свежий `gtc_user_id` и только затем вызывает `saveUser()`.

### 4.2 Google OAuth (GIS)
- На странице подключён SDK Google Identity Services (`https://accounts.google.com/gsi/client`).
- `google.accounts.id.renderButton` рисует кнопку в `#googleBtnHost`; callback `handleGoogleCredential` отправляет `credential` на `/auth/google` и затем запускает `hydrateUserFromProfile()` + `syncAuthStatus('google-oauth')`.
- Если SDK не загрузился или клиент не задан, показывается fallback-кнопка, открывающая `/auth/google/?next=%2Fchat` в прежнем режиме редиректа.

### 4.3 OTP поток
1. Пользователь вводит email в `#otpEmail`, нажимает `otpRequestBtn` → `/auth/otp/request`.
2. При успехе разрешается поле `#otpCode` и кнопка `otpVerifyBtn`.
3. `otpVerifyBtn` отправляет `{ email, code }` на `/auth/otp/verify`, затем выполняются `hydrateUserFromProfile(fallback)` и `syncAuthStatus('otp-login')`.

### 4.4 Регистрация и повторное письмо
- `#signupForm` отправляет `POST /auth/register` с именем/email/паролем и показывает результат в `#signupStatus`.
- `#resendForm` дергает `/auth/request_email_verification`, чтобы отправить письмо ещё раз без ухода со страницы; UI показывает точный ответ бекенда (найден ли аккаунт, отправлено ли письмо, уже подтверждено).
- Кнопка `#accessCheckBtn` запускает `syncAuthStatus('manual-check')`; при ошибке `/auth/status` выводит расшифровку причины (401 → повторный вход, 403 → подтвердить email, 404/5xx → «сервис недоступен»). Если backend недоступен, дополнительно вызывается `hydrateUserFromProfile(state.user)` — при успехе UI сообщает, что профиль подтверждён локально и ждёт развёртывания `/auth/status`.

### 4.5 Доп. действия
- **Обновить профиль:** `refreshProfileBtn` вызывает `hydrateUserFromProfile(state.user)`.
- **Выйти:** `logoutBtn` очищает `state.user`, localStorage, возвращает UI в режим авторизации.
- **Скопировать ID:** `copyIdBtn` использует `navigator.clipboard.writeText`.
### 4.6 Проверка статуса `/auth/status`
- `syncAuthStatus(context)` обращается к `/auth/status` и повторяет бизнес-логику `/auth/finish`: `decision = chat` → чат готов, `payment` → показывается CTA об оплате и ссылка `https://pay.gtstor.com/payment.php`, `auth` → UI просит войти.
- Ответ может содержать `gtc_user_id`/`email` — фронт обновляет локальный профиль без лишних уведомлений.
- Функция вызывается после пароля, OTP, Google OAuth и вручную кнопкой «Проверить доступ».

## 5. Чатовый конвейер (через PHP-посредник)
### 5.1 Подготовка
- Submit `#chatForm` блокируется, если нет `state.user?.gtc_user_id`.
- `sendMessage()` предотвращает повторную отправку (`state.sending`).
- Сообщение пользователя сразу добавляется в лог (`pushMessage('user', text)`), поле очищается.

### 5.2 Payload → `/chat_api.php`
`buildPayload(message)` формирует структуру (как и раньше для n8n):
```json
{
  "channel": "web",
  "message": "user text",
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
    "user_agent": "Mozilla/...",
    "language": "ru-RU"
  },
  "chat_id": "uuid" // если SQL уже присвоил отдельный идентификатор, он идёт здесь
}
```
- Locale/Timezone берутся из `Intl.DateTimeFormat` и `navigator.language`.
- `session_id` совпадает с локальным значением и нужен всем внешним сервисам.
- `chat_id` появляется, когда `/chat_api.php` или n8n вернули серверный UUID; при первом сообщении может быть `null`, тогда PHP создаёт новый ID и сообщает его обратно в лог-ответе.
- `sendMessage()` теперь снова бьёт напрямую в `https://agent.gtstor.com/webhook/chat`. Перед отправкой собирается snapshot заголовков (`origin`, `accept-language`, `user-agent`, `sec-ch-ua-*`) и кладётся в поле `headers`, а также устанавливается `source: 'web_chat_frontend'`. Ошибки сети/HTTP фиксируются в UI и не блокируют параллельный SQL-лог.

### 5.3 Асинхронный SQL-лог (`/chat_api.php`, `mode: log`)
- При каждом пользовательском сообщении браузер ставит задачу `queueSqlLog()` — payload + `role:'user'` уходят на `/chat_api.php` с `mode:'log'`. Очередь выполняется по одной записи; при сетевой ошибке элемент возвращается в начало и повторяется через ~1.5 секунды.
- После успешного ответа n8n вызывается та же очередь, но уже с `role:'assistant'`, `message: reply`, `trace_id`/`stage` и полем `response`, содержащим полный JSON ответа.
- PHP-скрипт создаёт/актуализирует `chat_id`, пишет сообщение в `chat_messages`, обновляет `chats.updated_at` и пишет событие в `chat_transactions.log`. Таким образом, база всегда знает о последних сообщениях, даже если вебхук временно недоступен или пользователь закрыл вкладку.

### 5.4 Обработка ответа
`handleAgentResponse(data, httpStatus)` покрывает случаи:
- **401 / `status:error` + `code: unauthorized`:** сбрасывает пользователя, просит повторный вход.
- **402 / `payment_required`:** показывает предупреждение об отсутствии подписки, предлагает оплату.
- **5xx или `status:error`:** сообщает об ошибке сервера, оставляет историю без изменений.
- **Успех:** достает `reply`/`output`, trace/stage (если есть), добавляет сообщение бота и обновляет `#chatStatus` («Готово (trace …)»). Здесь же формируется вторая запись для SQL-лога (см. выше).

### 5.5 Системные сообщения
- `pushSystem(text, tone)` выводит подсказку в `#techPanel` (например, «Session reset…», «Ошибка сети…»).
- `setChatStatus`, `setAuthStatus`, `setOtpStatus` управляют соответствующими статус-блоками.

### 5.6 SQL-персистенция, журнал и резервный proxy
- Основной поток теперь: **браузер → n8n** (ответ пользователю) + **браузер → `/chat_api.php` (`mode:log`)** (персистенция). Это уменьшает задержки и убирает зависимость от PHP при запросе к агенту.
- `proxy`-режим `/chat_api.php` оставлен для аварий/отладки: он может полностью взять на себя связку лог + вебхук, если нужно отключить прямые браузерные запросы.
- Все лог-запросы и события proxy продолжают писаться в `chat_transactions.log` (рядом с `/chat_api.php`). Файл отражает `log_mode_request`, `sql_insert`, `proxy_request`, `webhook_forward`, `webhook_error` и т.д.; в нём всегда присутствует `chat_id`, а `session_id` сохраняется в metadata для связи с UX.

## 6. UX и статусы
- `updateStatus(label, tone)` меняет цветовую индикацию «Status» (ok/warn/err).
- `chatStatus` показывает текущие действия (отправка, готово, ошибки).
- `techPanel` предназначен для техсообщений и исчезает, когда текст пустой.
- OTP/авторизация используют отдельные статусы, скрываются при отсутствии текста.

## 7. Безопасность и ограничения
- Все auth-запросы выполняются с `credentials:'include'` → серверная сессия/CSRF должны быть настроены.
- Фронтенд не получает и не пересылает JWT; доверяем только `gtc_user_id` и серверным cookie.
- История хранится локально и ограничена 50 сообщениями. Очистка влияет только на клиентскую сторону.
- Нет серверных rate-limit проверок на фронте, поэтому backend должен ограничивать частоту /auth/* и webhook.

## 8. Расширение и сопровождение
- **Хранение истории на сервере:** использовать существующий `session_id` и `client` объект — можно добавить доп. поля в payload.
- **Новые методы авторизации:** переиспользовать `postJson`/`saveUser`, добавить UI-блок в sidebar.
- **Диагностика:** `trace_id` и `stage` из ответа уже отображаются в интерфейсе; при необходимости логировать их дополнительно в analytics.

## 9. Ручной тест-план
1. **Email+пароль:** войти, убедиться, что `#userSection` показывает `gtc_user_id`, статус «ready».
2. **OTP:** запросить код, ввести тестовый код, проверить, что UI переключается в режим пользователя.
3. **New chat:** нажать `resetSession` — `session_id` и techPanel должны обновиться.
4. **Отправка сообщения:** получить ответ от webhook, увидеть trace/stage в логе.
5. **Симуляция 401:** очистить cookie, отправить сообщение — UI должен разлогиниться и показать предупреждение.
6. **Проверка оплаты:** имитировать 402 ответ — статус предупредит и предложит оплату.

### Результаты ручных тестов (22.11.2025)
- **Email+пароль:** ✅ проходит — `gtc_user_id` отображается, статус переходит в ready.
- **OTP:** ✅ проходит — код приходит на почту, верификация включает пользователя в UI.
- **New chat:** ✅ проходит — `session_id` и techPanel обновляются.
- **Отправка сообщения:** ⚠️ половинчатый успех — фронт отправляет payload, но n8n workflow не отвечает. Нужно починить сценарий «GTC Sales Agent - Web Chat».
- **Симуляция 401:** ⚠️ получить ответ сервера не удалось, т.к. до отправки front блокирует отправку (`state.user?.gtc_user_id`). Отображается локальное предупреждение «Сначала войдите, чтобы получить gtc_user_id». Чтобы проверить серверный 401, временно разрешите отправку без ID либо подмените ответ webhook.
- **Проверка оплаты (402):** 🚫 тест не выполнен — нет возможности создать свежего пользователя без активной подписки. Нужно предусмотреть тестовый аккаунт или имитацию ответа 402 на стороне webhook.

**Рекомендации:**
1. Восстановить/настроить OTP endpoints, чтобы `otpVerify` корректно возвращал профиль.
2. Отладить workflow n8n (`https://agent.gtstor.com/webhook/chat`), т.к. запросы доходят, но ответа нет.
3. Добавить тестовый режим/флаг, позволяющий форсировать ответы 401/402 для QA без отключения фронтовой проверки `gtc_user_id`.
4. Заложить автоматический smoke-тест, который проверяет все сценарии из списка и пишет статус в техпанель.

Документ следует обновлять при каждом изменении `chat/index.html`, чтобы описания потоков, payload и зависимостей оставались актуальными.
