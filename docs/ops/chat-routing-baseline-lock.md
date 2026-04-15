# Chat Routing Baseline Lock

Updated: 2026-03-17
Scope: production chat routing for app.gtstor.com and rjaka.pro

## Purpose

Зафиксировать единую рабочую конфигурацию маршрутов чатов, чтобы изменения в nginx, фронтенде и документации не расходились между участниками команды.

## Baseline (locked)

1. Admin chat (GTC operations)
- URL: https://app.gtstor.com/chat/
- Owner: gtc-core-web
- Nginx vhost: /etc/nginx/sites-enabled/app.gtstor.com
- Entrypoint behavior: must render admin UI marker `GTC • Web Chat`

2. User chat (end-user workspace)
- URL: https://app.gtstor.com/user/
- Owner: gtc-core-web
- Nginx vhost: /etc/nginx/sites-enabled/app.gtstor.com

3. RJAKA game chat
- URL: https://rjaka.pro/chat/
- Owner: rjaka-web
- Nginx vhost: /etc/nginx/sites-enabled/www.rjaka.pro
- Entrypoint behavior: must render RJAKA marker `РЖАКА - Ваш помощник в игре`

4. RJAKA history
- URL: https://rjaka.pro/chat/history/
- Host alias: https://www.rjaka.pro/chat/history/
- Owner: rjaka-web

## Required Nginx Includes

For app.gtstor.com vhost:
- include /var/www/gtc-form/docs/nginx/chat-internal.conf;
- include /var/www/gtc-form/docs/nginx/chat-block-public.conf;

Order requirement:
- chat-internal.conf must be included before chat-block-public.conf.

For rjaka.pro vhost:
- include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;

## Frozen Route Rules

1. app.gtstor.com
- /chat/ is primary admin route.
- /chat/index.html must redirect to /chat/.
- /chat/ must not expose RJAKA marker.

2. rjaka.pro
- /chat/ is primary RJAKA route.
- /chat/history/ is primary history route.
- /chat/history and /chat/history/ must be normalized with trailing-slash redirect behavior.
- `rjaka.pro` and `www.rjaka.pro` must serve equivalent history content.

3. Compatibility aliases (RJAKA only, non-primary)
- /game-chat.html -> /chat/
- /chat-qa.html -> /chat/history/

## Change Gate (mandatory before merge)

Run in this order:

1. sudo nginx -t
2. sudo systemctl reload nginx
3. /var/www/gtc-form/scripts/check_chat_route_matrix.sh
4. /var/www/gtc-form/scripts/check_chat_routing_lock.sh

Merge is blocked if any check reports FAIL.

## Mandatory Documentation Sync

When any chat route/domain ownership changes, update in the same PR:

1. docs/chat-admin-current.md
2. docs/chat-user-current.md
3. docs/rjaka-game-chat.md
4. docs/chat-docs-index.md
5. docs/ops/server-applications-registry.md
6. docs/ops/chat-routing-baseline-lock.md

## Rollback

If post-deploy checks fail:

1. Restore previous vhost from backup.
2. sudo nginx -t
3. sudo systemctl reload nginx
4. Re-run both check scripts.
5. Attach command output in incident note under docs/runtime/.
