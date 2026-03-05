# Cutover Checklist (RJAKA / GTSTOR)

## Цель
Пошаговый runbook для безопасного разделения двух направлений:
- **RJAKA** (игровой чат + история)
- **GTSTOR** (платформа + user/admin чаты)

Документ описывает **операционную последовательность**, проверки, критерии успеха и откат.

---

## 0) Роли и ответственность

- **Release Owner**: принимает go/no-go, контролирует тайминг cutover.
- **Backend Owner**: API, DB migrations, workflow contracts.
- **Frontend Owner**: pages/assets/favicon/UX smoke.
- **Ops Owner**: nginx/routes/ssl/observability.
- **QA Owner**: smoke checklist и итоговый sign-off.

---

## 1) Pre-cutover gate (обязательно)

Переход к cutover разрешён только если:
- [ ] Есть актуальный backup snapshot (code + db) и проверка restore/read.
- [ ] Утверждены артефакты:
  - `migration-blueprint-v1.md`
  - `component-inventory.csv`
  - `dependency-map.md`
- [ ] Зафиксирована ownership-матрица (что уходит в RJAKA, что в GTSTOR).
- [ ] Утверждён временной слот и окно изменений.
- [ ] Назначены ответственные по ролям (см. раздел 0).

---

## 2) Dry-run (без переключения трафика)

## 2.1 Repo/structure dry-run
- [ ] Смоделировать перенос по inventory (без merge в production).
- [ ] Проверить, что build/run paths не содержат cross-project ссылок.

## 2.2 API/DB dry-run
- [ ] Проверить все endpoint contracts на тестовом окружении.
- [ ] Проверить, что DB queries не обращаются к «чужим» таблицам.
- [ ] Подтвердить, что `chat_log` продолжает заполняться в GTSTOR web workflow после dry-run.
- [ ] Подтвердить freeze-policy для `chat_hub_*` (никаких DDL/DML изменений в рамках split window).

## 2.3 Brand/favicons dry-run
- [ ] RJAKA страницы указывают только на RJAKA favicon set.
- [ ] GTSTOR страницы указывают только на GTSTOR favicon set.

**Gate:** Dry-run считается успешным только при нулевых блокерах уровня P0/P1.

---

## 3) Cutover day sequence

## Phase A — Freeze
- [ ] Ввести временный freeze на merge для затронутых модулей.
- [ ] Снять финальный pre-cutover backup.
- [ ] Зафиксировать commit/tag baseline.

## Phase B — Data/Schema (если требуется)
- [ ] Применить только утверждённые миграции целевого контура.
- [ ] Проверить row counts / constraints / индексы.
- [ ] Проверить read/write на ключевых endpoint.
- [ ] Контрольный срез `chat_log` row count до/после cutover (ожидается рост при живом трафике).
- [ ] Контрольный срез `chat_hub_*` row count до/после cutover (ожидается без изменений в split scope).

## Phase C — API routing
- [ ] Включить новые endpoint routes/namespace.
- [ ] Подключить compatibility-layer для старых URL (redirect/proxy).
- [ ] Проверить HTTP 200/3xx/4xx поведение по контракту.

## Phase D — Frontend switch
- [ ] Переключить страницы на целевые endpoint.
- [ ] Проверить favicon/manifest для каждого проекта.
- [ ] Проверить, что links между проектами только через публичные URL, без скрытых внутренних зависимостей.

## Phase E — Observability
- [ ] Проверить access/error logs после cutover.
- [ ] Проверить workflows/webhooks trace-id цепочки.
- [ ] Проверить алерты и baseline метрики (latency/error rate).

---

## 4) Smoke checklist (обязательный)

## 4.1 RJAKA smoke
- [ ] Открывается `game-chat`.
- [ ] Отправка сообщения работает, ответ приходит.
- [ ] Открывается `chat-qa` (история), поиск и лимит работают.
- [ ] Лайк/дизлайк работает с ограничением «один голос».
- [ ] Favicon соответствует RJAKA бренду.

## 4.2 GTSTOR smoke
- [ ] Открывается основной сайт/портал.
- [ ] User chat загружает список чатов и историю.
- [ ] Admin chat загружает список чатов и историю.
- [ ] Отправка сообщения в user/admin chat работает.
- [ ] Auth и `/api` прокси отвечают корректно.
- [ ] Favicon соответствует GTSTOR бренду.
- [ ] `chat_log` фиксирует user/assistant turns из web workflow.

## 4.3 Nginx/proxy smoke
- [ ] `app.gtstor.com` routes отвечают корректно.
- [ ] `/auth/*`, `/api/*`, `/shared/*` работают по ожидаемым upstream.
- [ ] PHP endpoints обрабатываются через php-fpm.

---

## 5) Go / No-Go критерии

## Go, если
- [ ] Все smoke-checks зелёные.
- [ ] Ошибки P0/P1 отсутствуют.
- [ ] Error rate не выше baseline + agreed threshold.
- [ ] Ответственные дали sign-off.

## No-Go, если
- [ ] Есть блокер по данным, маршрутам или workflow.
- [ ] Падение ключевых endpoint.
- [ ] Cross-project утечки зависимостей, нарушающие целевую границу.

---

## 6) Rollback plan

Rollback запускается при любом P0/P1 инциденте.

## 6.1 Немедленные действия
- [ ] Остановить rollout изменений.
- [ ] Вернуть предыдущие nginx/routes (pre-cutover baseline).
- [ ] Вернуть предыдущую frontend сборку/статику.
- [ ] Переключить API на предыдущие endpoint mappings.

## 6.2 Данные
- [ ] При необходимости восстановить таблицы из pre-cutover backup.
- [ ] Проверить целостность после restore (counts, constraints, sample reads).

## 6.3 Коммуникация
- [ ] Обновить статус инцидента.
- [ ] Зафиксировать причину rollback.
- [ ] Назначить postmortem и дату повторного cutover.

---

## 7) Post-cutover tasks

- [ ] Удалить временный compatibility-layer после stabilization window.
- [ ] Удалить legacy favicon duplicates и устаревшие links.
- [ ] Обновить docs с фактической архитектурой после split.
- [ ] Обновить CI/CD pipelines и ownership-файлы.

---

## 8) Артефакты для cutover сессии

- `docs/migration-blueprint-v1.md`
- `docs/component-inventory.csv`
- `docs/dependency-map.md`
- `docs/cutover-checklist.md`
- `docs/route-compatibility-plan.md`
- `docs/db-ownership-matrix.md`
- `docs/cutover-ready-summary-20260305.md`
- `docs/dry-run-boundary-audit-20260305.md`
- `docs/dry-run-execution-20260305.md`
- `docs/cutover-operator-start-block-20260305.md`
- `docs/cutover-operator-end-block-20260305.md`
- `docs/cutover-sql-precheck-20260305-152323.md`
- `docs/cutover-sql-postcheck-template.md`
- `docs/cutover-decision-note-template.md`
- `docs/cutover-decision-note-20260305-immutable-template.md`
- `docs/cutover-decision-note-20260305-prefinal.md`
- `docs/cutover-quick-commands-20260305.md`
- `docs/projects-sync-guard-20260305.md`
- `docs/route-switch-dry-run-20260305.md`
- `docs/route-switch-plan-build-20260305.md`
- `docs/release-hand-off-20260305.md`
- `scripts/cutover_session_start.sh`
- `scripts/cutover_postcheck_capture.sh`
- `scripts/cutover_finalize_note.sh`
- `scripts/cutover_orchestrator.sh`
- `scripts/projects_sync_guard.sh`
- `scripts/route_switch_dry_run.sh`
- `scripts/route_switch_plan_build.sh`
- Backup snapshot path (актуальный на день cutover)

---

## 9) SQL validation playbook (pre/post cutover)

### 9.0 Session start

Быстрый запуск preflight и фиксация evidence:

```bash
cd /var/www/gtc-form
bash scripts/cutover_session_start.sh
```

Сценарий и детали: [docs/cutover-operator-start-block-20260305.md](docs/cutover-operator-start-block-20260305.md)

Все команды запускать в TCP-режиме (не через local socket peer-auth):

```bash
cd /var/www/gtc-form
export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db
```

### 9.1 Pre-cutover snapshot (сохранить в ticket/runbook)

```bash
psql -qAt -c "SELECT current_database(), current_user, now();"
```

```bash
psql -qAt -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'anon_%' OR table_name LIKE 'chat%') ORDER BY table_name;"
```

```bash
psql -qAt -c "SELECT 'anon_chats|'||count(*) FROM anon_chats UNION ALL SELECT 'anon_chat_messages|'||count(*) FROM anon_chat_messages UNION ALL SELECT 'anon_chat_feedback_votes|'||count(*) FROM anon_chat_feedback_votes UNION ALL SELECT 'chats|'||count(*) FROM chats UNION ALL SELECT 'chat_messages|'||count(*) FROM chat_messages UNION ALL SELECT 'chat_groups|'||count(*) FROM chat_groups UNION ALL SELECT 'chat_group_links|'||count(*) FROM chat_group_links UNION ALL SELECT 'chat_log|'||count(*) FROM chat_log UNION ALL SELECT 'chat_hub_agents|'||count(*) FROM chat_hub_agents UNION ALL SELECT 'chat_hub_tools|'||count(*) FROM chat_hub_tools UNION ALL SELECT 'chat_hub_agent_tools|'||count(*) FROM chat_hub_agent_tools UNION ALL SELECT 'chat_hub_sessions|'||count(*) FROM chat_hub_sessions UNION ALL SELECT 'chat_hub_messages|'||count(*) FROM chat_hub_messages UNION ALL SELECT 'chat_hub_session_tools|'||count(*) FROM chat_hub_session_tools;"
```

```bash
psql -qAt -c "SELECT 'anon_chat_messages|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM anon_chat_messages UNION ALL SELECT 'chat_messages|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_messages UNION ALL SELECT 'chat_group_links|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_group_links UNION ALL SELECT 'chat_log|max_timestamp|'||COALESCE(to_char(max(\"timestamp\"),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_log;"
```

### 9.2 Post-cutover acceptance checks

Post-check capture (recommended):

```bash
cd /var/www/gtc-form
bash scripts/cutover_postcheck_capture.sh
```

Сценарий закрытия сессии: [docs/cutover-operator-end-block-20260305.md](docs/cutover-operator-end-block-20260305.md)

1) Повторить весь блок 9.1.

2) Критерии приёма:
- `anon_*` и `chat*` core-таблицы доступны без ошибок `relation does not exist`.
- `chat_log` row count **не уменьшается**; при живом трафике — увеличивается.
- `chat_hub_*` row counts остаются стабильны (изменения допустимы только если отдельно согласованы вне split scope).
- max timestamps обновляются в ожидаемых контурах (`anon_chat_messages` для RJAKA, `chat_messages`/`chat_log` для GTSTOR).

3) При провале любого критерия:
- немедленно переключиться на раздел 6 (Rollback plan);
- приложить SQL-вывод до/после в incident ticket.

4) После успешного post-check:
- заполнить [docs/cutover-decision-note-template.md](docs/cutover-decision-note-template.md);
- зафиксировать финальное GO/NO-GO и sign-off владельцев.
