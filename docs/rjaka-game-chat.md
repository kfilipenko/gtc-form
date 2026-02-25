# RJAKA Game Chat

## Назначение
- Одностраничный анонимный чат для игры "RJAKA — Roles & Actions Card Game" (frontend: /game-chat.html).
- Прокси backend: /game_chat.php → n8n webhook https://agent.gtstor.com/webhook/game-chat.
- Отображает ответы ассистента, сохраняет историю (опционально) в anon_* таблицы.

## Размещение и поток
- Веб-страница: /game-chat.html (статический клиент, хранит chat_id в localStorage).
- Прокси: [game_chat.php](game_chat.php) — принимает JSON, проверяет message, проставляет chat_id/session_id, отправляет в n8n; ждёт до 60s.
- n8n: активный webhook `/webhook/game-chat`; формирует ответ и возвращает JSON с `reply`/`response`/`answer` (любое из этих полей парсится).
- Для адм. панели: /admin/game-chat-admin.html (отдельный интерфейс, авторизация, gtc_user_id опционален).

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
  -d '{"chat_id":"diag","message":"Привет, дай правила в 5 пунктах","metadata":{"page":"/game-chat.html"}}'
```
- Убедиться, что поле reply непустое и HTTP_STATUS=200.

## Планы развития
1. Добавить кнопки в UI: копировать сообщение в буфер, поделиться (share sheet / внешние приложения).
2. Подключить модуль авторизации.
3. Подключить модуль оплаты.
4. Настроить доступ для бесплатной регистрации на 5 дней.
