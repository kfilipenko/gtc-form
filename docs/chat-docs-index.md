# Chat Documentation Index

Status: current
Updated: 2026-03-17

## 1) Canonical Chat Matrix (single source of truth)

1. Admin chat (GTC operations): https://app.gtstor.com/chat/
2. User chat (end-user workspace): https://app.gtstor.com/user/
3. RJAKA game chat: https://rjaka.pro/chat/
4. RJAKA history UI: https://rjaka.pro/chat/history/

RJAKA history route:
- https://rjaka.pro/chat/history/
- https://www.rjaka.pro/chat/history/ (host alias)

Legacy compatibility routes (not primary):
- /game-chat.html -> /chat/
- /chat-qa.html -> /chat/history/

## 2) How each chat address is configured

1. GTSTOR domain (app.gtstor.com)
- Nginx vhost: /etc/nginx/sites-enabled/app.gtstor.com
- Project ownership: gtc-core-web
- Code root: /var/www/gtc-form
- Admin chat route: /chat/ (entrypoint mapped to /var/www/gtc-form/chat/internal/index.html)
- User chat route: /user/
- Legacy file /var/www/gtc-form/chat/index.html must not be used as admin primary UI source.

2. RJAKA domain (rjaka.pro)
- Nginx vhost: /etc/nginx/sites-enabled/www.rjaka.pro
- Project ownership: rjaka-web
- Code root: /var/www/gtc-form
- Compatibility include: /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf
- Primary routes: /chat/, /chat/history/
- Compatibility aliases: /game-chat.html, /chat-qa.html

## 3) Current reference documents

- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/rjaka-history-spec.md
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md
- docs/dependency-map.md
- docs/chat-service-spec.md
- docs/chat-architecture-target.md

## 4) Transitional and historical docs

Use with caution for planning/history; do not treat as primary route-role reference:
- docs/chat_architecture.md
- docs/migration-blueprint-v1.md
- docs/rjaka-new-site-mvp-wireframe-20260305.md
- docs/runtime/* (execution evidence, immutable records)

## 5) Documentation rules to prevent chat routing errors

1. Any change to chat route/domain ownership must update in the same PR:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md
- docs/chat-docs-index.md

2. No current reference document may describe:
- /chat/ as end-user primary chat
- /user/ as admin primary chat
- /game-chat.html or /chat-qa.html as primary RJAKA public routes

3. Domain/project ownership must always be explicit:
- app.gtstor.com -> gtc-core-web
- rjaka.pro -> rjaka-web

## 6) Configuration lock and pre-merge checks

- Baseline lock document: docs/ops/chat-routing-baseline-lock.md
- Continuous monitoring rollout plan: docs/ops/chat-monitoring-rollout-plan.md
- Runtime route smoke-check: scripts/check_chat_route_matrix.sh
- Nginx config lock-check: scripts/check_chat_routing_lock.sh
- History SLA check: scripts/check_chat_history_sla.sh

Required gate before merge/deploy:
1. sudo nginx -t
2. sudo systemctl reload nginx
3. /var/www/gtc-form/scripts/check_chat_route_matrix.sh
4. /var/www/gtc-form/scripts/check_chat_routing_lock.sh
5. /var/www/gtc-form/scripts/check_chat_history_sla.sh
