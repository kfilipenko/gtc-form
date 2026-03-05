# Route Compatibility Plan (Transition Window)

## Цель
Обеспечить безболезненный переход при разделении RJAKA и GTSTOR без 404/поломки bookmark-ов, внешних ссылок и интеграций.

План покрывает:
- временные redirect/proxy правила;
- порядок включения/отключения compatibility-layer;
- критерии завершения переходного периода.

---

## 1) Принципы compatibility-layer

1. **No hard break:** старые URL продолжают работать через 301/302/proxy.
2. **Owner-first routing:** каждый URL обслуживается owner-проектом (RJAKA или GTSTOR).
3. **Observability required:** все compatibility hit-ы логируются.
4. **Time-boxed transition:** compatibility-layer удаляется после stabilization window.

---

## 2) Маршруты и целевые правила

## 2.1 RJAKA routes

| Legacy URL | Temporary Rule | Target URL | Type | Notes |
| --- | --- | --- | --- | --- |
| `/game-chat.html` | keep | `/game-chat.html` | native | Остаётся публичным входом RJAKA до отдельного домена/репо |
| `/chat-qa.html` | keep | `/chat-qa.html` | native | История RJAKA |
| `/game_chat.php` | keep | `/game_chat.php` | native | RJAKA API proxy |
| `/admin/chat-qa.php` | keep | `/admin/chat-qa.php` | native | RJAKA history API |
| `/admin/chat-qa-feedback.php` | keep | `/admin/chat-qa-feedback.php` | native | RJAKA feedback API |

## 2.2 GTSTOR routes

| Legacy URL | Temporary Rule | Target URL | Type | Notes |
| --- | --- | --- | --- | --- |
| `/chat/` | keep | `/chat/` | native | GTSTOR user chat |
| `/chat/internal/` | keep | `/chat/internal/` | native | GTSTOR admin chat |
| `/chat_api.php` | keep | `/chat_api.php` | native | GTSTOR chat API |
| `/user/` | keep | `/user/` | native | GTSTOR portal |
| `/news/` | keep | `/news/` | native | GTSTOR news |

---

## 3) Future split readiness (when separate hosts are introduced)

Если вводятся отдельные hostnames (рекомендуется):
- `rjaka.<domain>` для игрового контура;
- `app.gtstor.com` (или `gtstor.<domain>`) для платформы.

Тогда compatibility rules:

| Existing URL (app.gtstor.com) | Rule | Destination |
| --- | --- | --- |
| `/game-chat.html` | `301` | `https://rjaka.<domain>/game-chat.html` |
| `/chat-qa.html` | `301` | `https://rjaka.<domain>/chat-qa.html` |
| `/game_chat.php` | reverse proxy (temp) | `https://rjaka.<domain>/game_chat.php` |
| `/admin/chat-qa.php` | reverse proxy (temp) | `https://rjaka.<domain>/admin/chat-qa.php` |
| `/admin/chat-qa-feedback.php` | reverse proxy (temp) | `https://rjaka.<domain>/admin/chat-qa-feedback.php` |

Notes:
- для browser pages использовать `301`;
- для API в transition лучше `proxy`, чтобы не ломать CORS/клиентов;
- после обновления клиентов/фронтов API перевести на `308`/direct URL.

---

## 4) Nginx compatibility snippet (template)

```nginx
# RJAKA pages redirect (when RJAKA host is live)
location = /game-chat.html { return 301 https://rjaka.<domain>/game-chat.html; }
location = /chat-qa.html   { return 301 https://rjaka.<domain>/chat-qa.html; }

# RJAKA APIs temporary proxy
location = /game_chat.php {
  proxy_pass https://rjaka.<domain>/game_chat.php;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
location = /admin/chat-qa.php {
  proxy_pass https://rjaka.<domain>/admin/chat-qa.php;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
location = /admin/chat-qa-feedback.php {
  proxy_pass https://rjaka.<domain>/admin/chat-qa-feedback.php;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Важно: этот шаблон вводится только в момент фактического host split.

---

## 5) Logging & metrics for compatibility

Обязательные метрики на переходный период:
- количество hit-ов по legacy routes;
- доля 4xx/5xx по compatibility endpoints;
- latency для proxied API routes;
- топ referer-ов на legacy URLs.

Рекомендуется отдельный access-log формат с меткой `compat=1`.

---

## 6) Decommission criteria (removal of compatibility-layer)

Compatibility-layer можно отключать, когда одновременно выполнены условия:
- [ ] Legacy route traffic < agreed threshold (например <1% от baseline) 14 дней подряд.
- [ ] Нет внешних интеграций, использующих legacy API URLs.
- [ ] Нет P1/P0 инцидентов после redirect/proxy.
- [ ] Команды RJAKA и GTSTOR подписали go на удаление совместимости.

После отключения:
- [ ] оставить короткий период `410 Gone` + документацию для внешних интеграторов (опционально);
- [ ] обновить docs и runbooks.

---

## 7) Risks specific to route compatibility

1. **CORS break for API redirects**
- Митигировать: для API сначала proxy, а не redirect.

2. **Cache stickiness on 301**
- Митигировать: rollout через 302/307 в canary, затем 301.

3. **Mixed favicon/manifest due to stale routes**
- Митигировать: owner-local asset links + cache-busting where needed.

4. **Double auth hops for proxied endpoints**
- Митигировать: preserve headers and cookies explicitly in nginx rules.

---

## 8) Execution order with other artifacts

1. Validate `component-inventory.csv`.
2. Validate `dependency-map.md`.
3. Validate `db-ownership-matrix.md`.
4. Execute `cutover-checklist.md` with this route plan as routing appendix.
