# DB Ownership Matrix (RJAKA / GTSTOR)

## Назначение
Фиксирует владельца каждой таблицы, правила миграций и границы доступа между проектами.

Статус: planning baseline + validated DB snapshot (2026-03-05).

---

## 1) Ownership matrix

| Schema.Table | Owner Project | Domain | Current Access Paths | Migration Policy | Cutover Notes |
| --- | --- | --- | --- | --- | --- |
| `public.anon_chats` | RJAKA | Игровые сессии чата | `game_chat.php` (create/resolve), `admin/chat-qa.php` (indirect) | **Only RJAKA repo** can alter | Переносится вместе с RJAKA API stack |
| `public.anon_chat_messages` | RJAKA | Игровые сообщения + feedback counters | `game_chat.php`, `admin/chat-qa.php`, `admin/chat-qa-feedback.php` | **Only RJAKA repo** can alter | Ключевая таблица для Q/A истории |
| `public.anon_chat_feedback_votes` | RJAKA | Голоса like/dislike per response | `admin/chat-qa-feedback.php` | **Only RJAKA repo** can alter | Enforces one-vote rule |
| `public.chats` | GTSTOR | Бизнес-чаты платформы (thread headers) | `chat_api.php` / `shared/chat-service.js` flows (docs) | **Only GTSTOR repo** can alter | Не должен использоваться RJAKA |
| `public.chat_messages` | GTSTOR | Бизнес-чат сообщения | `chat_api.php`, `shared/chat-service.js`, `/chat` и `/user` контуры | **Only GTSTOR repo** can alter | Содержит user/admin platform transcripts |
| `public.chat_groups` | GTSTOR | Группировка бизнес-чатов | group handlers в `chat_api.php` (по docs/plan) | **Only GTSTOR repo** can alter | Проверить production completeness before cutover |
| `public.chat_group_links` | GTSTOR | Связи chat↔group | group handlers в `chat_api.php` (по docs/plan) | **Only GTSTOR repo** can alter | Хранит ownership by `gtc_user_id` |
| `public.chat_log` | GTSTOR | Workflow log (web/legacy chat persistence) | n8n workflow `GTC Sales Agent - Web Chat`, docs `web_chat_workflow_*` | **Only GTSTOR repo** can alter | Активная таблица (1201 rows), не используется RJAKA |
| `public.chat_hub_agents` | GTSTOR (internal AI Hub) | Agent registry | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_hub_tools` | GTSTOR (internal AI Hub) | Tool registry | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_hub_agent_tools` | GTSTOR (internal AI Hub) | Agent↔tool mapping | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_hub_sessions` | GTSTOR (internal AI Hub) | Hub sessions | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_hub_messages` | GTSTOR (internal AI Hub) | Hub message stream | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_hub_session_tools` | GTSTOR (internal AI Hub) | Session↔tool mapping | direct app usage not found in current repo | **Freeze on split**; changes only by GTSTOR DB owner | Держать вне RJAKA cutover scope |
| `public.chat_messages_legacy` *(если существует)* | GTSTOR (legacy) | Исторический архив | read-only/backfill only (по docs) | **No schema changes** except archival ops | Не использовать для новых записей |

---

## 2) Hard boundary rules

1. RJAKA endpoints **не читают/не пишут** `chats`, `chat_messages`, `chat_groups`, `chat_group_links`.
2. GTSTOR endpoints **не читают/не пишут** `anon_*` таблицы.
3. Любая новая таблица должна иметь owner label в migration header.
4. Миграции применяются только пайплайном owner-проекта.
5. Запрещены cross-project foreign keys между RJAKA и GTSTOR таблицами.

---

## 3) Migration header standard (обязательный)

Для новых SQL-файлов использовать шапку:

```sql
-- ProjectOwner: RJAKA | GTSTOR
-- Domain: <chat|billing|auth|...>
-- BackwardCompatible: yes|no
-- RequiresDataBackfill: yes|no
```

---

## 4) Access control recommendations

- Отдельные DB роли на запись:
  - `rjaka_app_rw` → только `anon_*`
  - `gtstor_app_rw` → только `chat*` таблицы GTSTOR
- Read-only роли для аналитики — отдельные и scoped views.
- Любые shared analytics jobs читают через views, а не прямые cross-domain joins.

---

## 5) Cutover checks for DB ownership

Перед переключением:
- [ ] Все SQL-запросы RJAKA проверены на отсутствие ссылок в GTSTOR таблицы.
- [ ] Все SQL-запросы GTSTOR проверены на отсутствие ссылок в `anon_*`.
- [ ] DB credentials разделены по проектам.
- [ ] Migration pipelines разделены (RJAKA vs GTSTOR).

После переключения:
- [ ] Ошибок `relation does not exist` по chat endpoints нет.
- [ ] Row counts в ключевых таблицах стабильны.
- [ ] Запись/чтение работает в обоих контурах независимо.

---

## 6) Open items (to confirm before execution)

1. Стратегия archival retention для `chat_messages_legacy` (таблица подтверждена в production).
2. Подтвердить owner-команду GTSTOR для internal AI Hub (`chat_hub_*`) на уровне on-call/DB-owners.
3. Политика backup retention отдельно для RJAKA и GTSTOR.

---

## 7) Validation snapshot (DB, 2026-03-05)

Source: live query to `gtc_db` as `gtc_user` (TCP auth via `PGHOST=127.0.0.1`).

### 7.1 Exact row counts (core split tables)

| Table | Rows |
| --- | ---: |
| `anon_chats` | 0 |
| `anon_chat_messages` | 19 |
| `anon_chat_feedback_votes` | 3 |
| `chats` | 32 |
| `chat_messages` | 418 |
| `chat_groups` | 6 |
| `chat_group_links` | 10 |

### 7.2 Freshness markers

| Table | max(created_at) |
| --- | --- |
| `anon_chat_messages` | `2026-03-05 11:30:40+00` |
| `chat_messages` | `2026-01-19 18:38:47+00` |
| `chat_group_links` | `2026-01-18 15:27:56+00` |

### 7.3 Production introspection result (`public`)

Detected chat-related tables:

- `anon_chat_feedback_votes`
- `anon_chat_messages`
- `anon_chats`
- `chat_group_links`
- `chat_groups`
- `chat_hub_agent_tools`
- `chat_hub_agents`
- `chat_hub_messages`
- `chat_hub_session_tools`
- `chat_hub_sessions`
- `chat_hub_tools`
- `chat_log`
- `chat_messages`
- `chat_messages_legacy`
- `chats`

`chat_messages_legacy` existence check: **true**.

### 7.4 Additional table activity snapshot

| Table | Rows |
| --- | ---: |
| `chat_log` | 1201 |
| `chat_hub_agents` | 0 |
| `chat_hub_tools` | 1 |
| `chat_hub_agent_tools` | 0 |
| `chat_hub_sessions` | 1 |
| `chat_hub_messages` | 4 |
| `chat_hub_session_tools` | 1 |

Evidence summary:
- `chat_log` has active workflow references in `docs/workflows/GTC Sales Agent - Web Chat.json` and `docs/web_chat_workflow_plan.md`.
- Direct runtime code references to `chat_hub_*` were not found in current repo; tables are treated as GTSTOR internal AI Hub scope and frozen during RJAKA/GTSTOR split.
