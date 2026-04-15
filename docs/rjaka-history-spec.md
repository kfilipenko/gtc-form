# RJAKA History UI Spec

Status: current
Updated: 2026-03-17
Owner: rjaka-web

## Purpose

Зафиксировать отдельный архитектурный узел для страницы истории RJAKA и ее API-контракта, чтобы history не смешивался с игровым чатом `/chat/`.

## Canonical Routes

Primary:
1. https://rjaka.pro/chat/history/

Host alias:
1. https://www.rjaka.pro/chat/history/

Normalization rules:
1. `/chat/history` -> `301` to `/chat/history/`
2. Both hosts must serve identical content marker: `РЖАКА — Вопросы и ответы`

Compatibility (non-primary):
1. `/chat-qa.html` -> `/chat/history/`

## Nginx Ownership

1. Vhost: `/etc/nginx/sites-enabled/www.rjaka.pro`
2. Include: `/var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf`
3. Compatibility mapping source:
   - `/chat/history/` -> `try_files /chat-qa.html =404`

## Architecture Node: RJAKA History UI

1. UI route: `/chat/history/`
2. Read API: `/admin/chat-qa.php`
3. Feedback API: `/admin/chat-qa-feedback.php`
4. Data store:
   - `anon_chat_messages`
   - `anon_chat_feedback_votes`

## API Contract (History)

1. `GET /admin/chat-qa.php`
   - Purpose: load Q/A history for the public history page
   - Response: history rows + counters/metadata used by UI

2. `POST /admin/chat-qa-feedback.php`
   - Purpose: submit quality vote (like/dislike)
   - Constraints: one-vote policy per response/session policy as implemented by backend

## Operational Gate

Before merge/deploy:
1. `/var/www/gtc-form/scripts/check_chat_route_matrix.sh`
2. `/var/www/gtc-form/scripts/check_chat_routing_lock.sh`
3. `/var/www/gtc-form/scripts/check_chat_history_sla.sh`

## Observability Targets (History)

Default runtime thresholds:
1. HTTP status success: 200 (error rate max 0%)
2. TTFB p95 <= 0.800s

Tunable env vars for SLA probe:
1. `PROBES` (default 10)
2. `TTFB_P95_MAX` (default 0.800)
3. `ERROR_RATE_MAX` (default 0)
