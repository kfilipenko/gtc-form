# GTC Sales Agent — Web Chat Workflow Plan

## Goal
Создать HTTP-based версию пайплайна "GTC Sales Agent" для веб-чата (страница `/chat`). В отличие от Telegram, канал использует Webhook (HTTP POST) и возвращает JSON-ответ клиенту. Workflow должен:

1. Принимать сообщение пользователя + метаданные с веб-клиента (session_id, токен, локальное хранилище).
2. Валидировать сессию и доступ пользователя к агенту (подписка/whitelist).
3. Сохранять сообщения в `chat_log` с каналом `web` и сессионным ключом `web:{session_id}`.
4. Подтягивать историю диалога и строить промпт, совместимый с текущим AI агентом.
5. Вызывать основной AI Agent (Azure OpenAI + вспомогательный sub-workflow "Web Search OpenAI").
6. Фильтровать вывод (remove system JSON, deduplicate) и возвращать JSON структуры `{"status":"ok","reply":"..."}`.
7. Фиксировать ответ в `chat_log`, причём сохранять дополнительные поля (latency, модель, tool usage) в `metadata`.
8. Корректно отрабатывать ошибки/нет доступа (HTTP 401/402/500 и телеметрия).

## Input Contract (Webhook)
`POST /webhook/web-chat` с `Content-Type: application/json` и телом вида:

```json
{
  "message": "string",
  "session_id": "uuid-or-random",
  "channel": "web",
  "client": {
    "gtc_user_id": 3621,
    "user_id": "uuid",
    "email": "user@example.com",
    "locale": "en",
    "timezone": "+02:00"
  },
  "metadata": {
    "page": "/chat",
    "user_agent": "Mozilla/5.0"
  }
}
```

- `message` — чистый текст пользователя (обязателен).
- `session_id` — строка для sticky истории; если пусто, нода `Normalize Input` сгенерирует UUID.
- `client` — всё, что фронтенд знает о пользователе. Workflow использует эти поля для lookup в БД.

## Node Layout

| № | Node | Purpose |
|---|------|---------|
| 1 | **Webhook (Web Chat Entry)** | Принимает HTTP POST, выставляет `responseMode=onReceived`.
| 2 | **Code: Normalize Input** | Гарантирует `message`, `session_id`, `client` объекты, режет длину, добавляет `safe_session_id = 'web:' + session_id`.
| 3 | **Postgres: Lookup Web User** | SQL ищет `user_id`, `gtc_user_id`, email, `web_agent_access` (подписка/whitelist). Проверки:
  - `user_id` = UUID из клиента.
  - `gtc_user_id` из клиента.
  - `email` (lowercase) — fallback.
  - Дополнительно вытягиваем `subscription_status`, `subscription_tier`, `trial_expiration`.
| 4 | **IF: Access OK?** | Условие `web_agent_access == true OR gtc_user_id IN (whitelist)`.
| 5 | **Set: Payment Payload** | Формирует `status='payment_required'`, `gtc_user_id`, `payment_url`, `reason`.
| 6 | **HTTP Response (402)** | Возвращает JSON с оплатой.
| 7 | **Postgres: Save User Message** | Вставляет строку в `chat_log` с channel `web`, message text, session-id `safe_session_id`, `metadata->frontend`.
| 8 | **Postgres: Load Chat History** | Берёт до 12 последних сообщений по `gtc_user_id + session`. Только непустые messages/responses.
| 9 | **Code: Build Prompt** | Сортирует историю по timestamp ASC, формирует текст с ISO-датами, подмешивает профиль пользователя (email, timezone, locale).
|10 | **Merge (Combine)** | Собирает выходы `Build Prompt`, `Save User Message`, `Lookup Web User`.
|11 | **Code: Stage Detector** | Парсит `message` на JSON blobs, безопасно определяет текущую стадию (Goal Discovery / Product Search). Передаёт флаги в agent context.
|12 | **Set: Agent Inputs** | Формирует финальный payload: `latest_message`, `history_tail`, `stage`, `user_profile`, `strict_json_filters`.
|13 | **AI Agent (LangChain)** | Текущий Azure OpenAI + tool `Call 'Web Search OpenAI'`. `maxIterations=4`, `systemMessage` = обновлённый инструктаж.
|14 | **Code: Extract AI Reply** | Берёт `output` и `intermediateSteps`, удаляет JSON-похожие блоки, фильтрует повторения, ограничивает 1800 символами.
|15 | **Postgres: Save Bot Response** | Обновляет `chat_log.response`, `metadata->web_out` (latency, tokens, tool calls, stage).
|16 | **HTTP Response (200)** | Возвращает JSON `{status:'ok', reply, stage, suggestions[], trace_id}`.
|17 | **Error Workflow?** | В отдельном branch `Catch errors` → log + HTTP 500.

## Database Touchpoints

- `public."user"`: основной источник `gtc_user_id`, флагов доступа (например `web_agent_access` boolean, если нет — вычисляем).
- `auth_email`, `auth_google`: помогаем резолвить `user_id` по email.
- `subscriptions`: проверяем `status in ('active','trialing') and end_date > now()`.
- `chat_log`: сохранение/обновление сообщений (вставки/апдейты аналогично Telegram, но `channel='web'`).

## Error Handling & Responses

| Case | HTTP | Body |
|------|------|------|
| Missing message/session | 400 | `{status:'error',code:'bad_request',detail:'message is required'}`
| Unknown user / no subscription | 402 | `{status:'payment_required', payment_url, gtc_user_id}`
| Database/agent failure | 500 | `{status:'error', code:'server_error', detail:'…', trace_id}`

`Normalize Input` будет выбрасывать кастомную ошибку (`throw new Error('BAD_REQUEST::message is empty')`). Error branch перехватывает, мапит на HTTP коды.

## Reusable Pieces

- **Sanitizer:** функция для удаления дублей и JSON из ответа; переиспользуется и в Telegram WF.
- **Stage Detector:** JS модуль для обеих воронок (Telegram/Web). План — вынести в `Code` node с чистыми helper-функциями.
- **Search Subworkflow:** отдельный JSON `Web Search OpenAI.json` (см. TODO 4), подключён к `AI Agent` как tool.

## Assumptions

1. В БД есть булево поле `web_agent_access` (или аналог) в `public."user"`; если нет — можно рассчитать из `telegram_bot_access OR subscription active`.
2. Клиент всегда отправляет хотя бы одно из `user_id`, `gtc_user_id`, `email`. Этого хватает для lookup.
3. Frontend принимает структурированный JSON-ответ и самостоятельно обрабатывает (рендер текста, показ paywall и т.д.).

## Next Steps

1. Собрать итоговый JSON экспорт `GTC Sales Agent - Web Chat.json` с описанными нодами/соединениями.
2. Обновить/создать подчинённый workflow `Web Search OpenAI.json` (tool workflow) — менять только input contract `message` и, при необходимости, system prompt.
3. Добавить README с инструкцией по импорту в n8n и конфигах (credentials, environment variables, webhook URL).
