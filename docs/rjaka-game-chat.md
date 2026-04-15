# RJAKA Game Chat

## Каноническая матрица чатов (чтобы избежать путаницы)
- Административный чат GTC: `https://app.gtstor.com/chat/`
- Пользовательский чат GTC: `https://app.gtstor.com/user/`
- Игровой чат RJAKA: `https://rjaka.pro/chat/`

## Назначение
- Одностраничный анонимный чат для игры "RJAKA — Roles & Actions Card Game" (primary frontend route: `/chat/` on `rjaka.pro`).
- Прокси backend: /game_chat.php → n8n webhook https://agent.gtstor.com/webhook/game-chat.
- Отображает ответы ассистента, сохраняет историю (опционально) в anon_* таблицы.

## Размещение и поток
- Primary веб-страница: `https://rjaka.pro/chat/`.
- История чатов: `https://rjaka.pro/chat/history/`.
- Alias host for history route: `https://www.rjaka.pro/chat/history/`.
- Legacy aliases (compat only): `/game-chat.html` и `/chat-qa.html`.
- Адресная настройка выполняется в nginx vhost `/etc/nginx/sites-enabled/www.rjaka.pro` через include `/var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf`.
- Прокси: [game_chat.php](game_chat.php) — принимает JSON, проверяет message, проставляет chat_id/session_id, отправляет в n8n; ждёт до 60s.
- n8n: активный webhook `/webhook/game-chat`; формирует ответ и возвращает JSON с `reply`/`response`/`answer` (любое из этих полей парсится).
- Для адм. панели: /admin/game-chat-admin.html (отдельный интерфейс, авторизация, gtc_user_id опционален).

## Архитектура страницы истории `/chat/history/`
- Public route: `/chat/history/` (host: `rjaka.pro` и alias `www.rjaka.pro`).
- Compatibility source: nginx compat map `/chat/history/ -> /chat-qa.html`.
- Data read endpoint: `/admin/chat-qa.php` (read Q/A history).
- Feedback endpoint: `/admin/chat-qa-feedback.php` (like/dislike and quality signals).
- Data layer: `anon_chat_messages` и `anon_chat_feedback_votes`.

Route contract:
1. `/chat/history` -> `301` to `/chat/history/`.
2. `/chat/history/` -> `200` and page marker `РЖАКА — Вопросы и ответы`.
3. `rjaka.pro` and `www.rjaka.pro` must serve identical history page behavior.

## Предложения по включению в общую архитектуру чатов
1. Вынести `/chat/history/` в отдельный архитектурный блок в chat matrix как `RJAKA History UI`, а не только как подпункт RJAKA chat.
2. Зафиксировать для history страницы свой API-контракт (`chat-qa.php` + `chat-qa-feedback.php`) в единой спецификации зависимостей.
3. Добавить обязательный smoke-check history маршрута в pre-merge gate (включая `www` и проверку маркера страницы).
4. Разделить в документации «compat layer» и «primary route», чтобы `/chat-qa.html` не воспринимался как публичный canonical URL.
5. Добавить мониторинг SLA для history route (HTTP code, TTFB, error rate) как отдельный чатовый KPI.

## Хранение истории (опция)
- Таблицы для анонимного чата (миграция: [db/migrations/20260121_anon_chat.sql](db/migrations/20260121_anon_chat.sql)):
  - `anon_chats(chat_id uuid pk, title text not null, full_name text null, email text null, created_at, updated_at)`.
  - `anon_chat_messages(message_id uuid pk, chat_id uuid not null, role text check ('user','assistant','system'), content text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now())`.
  - Индекс: `idx_anon_chat_messages_chat_time(chat_id, created_at)`.
- Рекомендованные поля metadata: session_id, channel, page, user_agent, ip, client(name/email), trace_id/stage.

## Поведение фронтенда (game-chat.html)
- Держит chat_id в localStorage; отправляет { chat_id, message, page, metadata.language }.
- Для текущего WF n8n обязательны поля message и user_id; до правки WF передавайте user_id=chat_id (или session_id), иначе придёт 400.
- Парсит ответ из поля `reply`; при пустом отвечает системным "No reply".
- UI стилизован в палитре RJAKA.

## Цветовая гамма RJAKA
- Deep raspberry / warm magenta: #B0164D, #E34A8A
- Theatrical black vignette: #0E0610
- Warm golden spotlight: #F2B94B
- Muted turquoise stage floor: #2FA4A9
- Soft gray-white mask wall: #D6D6D2
- Стиль: бархатные градиенты, мягкие тени, без жёстких рамок, подсветки золото/магenta/бирюза.

## Технические детали
- Таймауты прокси: CURL_TIMEOUT=60s, CURL_CONNECT_TIMEOUT=12s.
- Парсинг ответа: `reply`, `response`, `answer`, `output.response`, `output.answer`, а также массивный `[0].output.response/answer`.
- Заголовок и логотип: путь к лого ожидается `/assets/rjaka-logo.png`.

## Возможности WF n8n (tpRyeUsuNWKHaiK8wxHRA)
- Валидация входа: требует непустые `message` и `user_id`; при отсутствии возвращает 400 с `{"status":"error","message":"Отсутствуют обязательные поля: message или user_id"}`.
- История: читает до 200 последних сообщений из `anon_chat_messages` по `chat_id`, упорядочивает по времени и подставляет в prompt.
- Построение prompt: склеивает историю и последний ввод; в системном промпте агент берёт только хвост контекста (~1500 символов) для ограничения.
- RAG: использует PGVector `documents_vectors` (topK=8, embeddings text-embedding-3-small) + Azure OpenAI gpt-4o; системный промпт настроен под RJAKA (ответы на русском, без выдуманных правил, с приоритетом документации).
- Ответ: нода Respond возвращает `output` как `text/plain; charset=utf-8`; если тело не JSON, прокси `game_chat.php` трактует его как `reply`.
- Сохранение: нода Build Save Rows формирует 2 записи (user и assistant) с metadata {session_id, channel, page, user_agent, ip, client}; upsert в `anon_chat_messages` идёт по `message_id=chat_id`, поэтому пока перезаписывает одну строку (нужно изменить на уникальные message_id, если хотим полную историю).

## Проверка
- Быстрый тест: 
```
curl -sS -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
  -H "Content-Type: application/json" \
  -X POST https://agent.gtstor.com/game_chat.php \
  -d '{"chat_id":"diag","message":"Привет, дай правила в 5 пунктах","metadata":{"page":"/chat/"}}'
```
- Убедиться, что поле reply непустое и HTTP_STATUS=200.

## Планы развития
1. Добавить кнопки в UI: копировать сообщение в буфер, поделиться (share sheet / внешние приложения).
2. Подключить модуль авторизации.
3. Подключить модуль оплаты.
4. Настроить доступ для бесплатной регистрации на 5 дней.
